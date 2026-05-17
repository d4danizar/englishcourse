"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { calculateInvoiceAmount } from "../utils/pricing";
import { nextMonday, addWeeks, addMonths } from "date-fns";
import { getBranchFilter } from "@/lib/actions/branch-actions";
import { calculateEndDate } from "@/lib/offday-utils";

const STAFF_ALLOWED = ["SUPER_ADMIN", "CS"];

// ── 1. Create Invoice (CS / SUPER_ADMIN) ─────────────────────────────────────
export async function createInvoice(
  leadId: string,
  programName: string,
  duration: string,
  paymentType: "DP" | "FULL" = "DP",
  dpAmount: number = 0,
  paymentChannel: "CASH" | "TRANSFER" = "TRANSFER"
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Sesi tidak valid." };
    if (!STAFF_ALLOWED.includes(session.user.role as string)) {
      return { error: "Tidak memiliki hak akses." };
    }

    // Auto-generate invoice number: INV-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const rnd = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${rnd}`;

    const totalAmount = calculateInvoiceAmount(programName, duration);
    const paidAmount = paymentType === "FULL" ? totalAmount : dpAmount;
    const finalProgramName = duration ? `${programName} — ${duration}` : programName;
    const newAmountDue = totalAmount - paidAmount;

    const branchFilter = await getBranchFilter();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        leadId,
        programName: finalProgramName,
        amountDue: newAmountDue,
        totalAmount,
        paidAmount,
        status: "PENDING",
        paymentMethod: paymentType,
        studentData: { paymentChannel },
        branch: branchFilter.branch,
      },
    });

    revalidatePath("/admin/crm");
    return { success: true, invoiceNumber: invoice.invoiceNumber };
  } catch (err) {
    console.error("[createInvoice]", err);
    return { error: "Terjadi kesalahan saat membuat invoice. Silakan coba lagi." };
  }
}

// ── 2. Submit Payment Proof (public — by prospective student) ─────────────────
export async function submitPaymentProof(
  invoiceId: string,
  studentData: {
    name: string;
    email: string;
    whatsapp: string;
    school: string;
    program: string;
  },
  proofString: string
) {
  try {
    if (!invoiceId || !studentData.email || !studentData.whatsapp || !proofString) {
      return { error: "Data tidak lengkap. Pastikan semua field wajib diisi." };
    }

    // Update invoice: save student data + proof, change status
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "WAITING_CONFIRMATION",
        studentData: studentData as any,
        paymentProof: proofString,
        // Update programName from what student selected, if it differs
        programName: studentData.program || undefined,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("[submitPaymentProof]", err);
    return { error: "Gagal menyimpan data. Silakan coba lagi." };
  }
}

// ── 3. Approve Payment (CS/SUPER_ADMIN) ──────────────────────────────────────
//    Transaction: Invoice → PAID + create Student User + Lead → CLOSED_WON
// ── 3. Approve Payment (CS/SUPER_ADMIN) ──────────────────────────────────────
//    Transaction: Invoice → PAID/DP_PAID + create Student User + Lead → CLOSED_WON
export async function approvePayment(invoiceId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Sesi tidak valid." };
    if (!STAFF_ALLOWED.includes(session.user.role as string)) {
      return { error: "Tidak memiliki hak akses." };
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { lead: true }
    });
    if (!invoice) return { error: "Invoice tidak ditemukan." };

    if (invoice.status !== "WAITING_CONFIRMATION") {
      return { error: `Invoice berstatus "${invoice.status}" — hanya WAITING_CONFIRMATION yang bisa diverifikasi.` };
    }

    const data = invoice.studentData as any;

    if (!data?.email || !data?.whatsapp) {
      return { error: "Data siswa (email/WA) tidak ditemukan di invoice ini. Pastikan siswa sudah mengisi form." };
    }

    const { name: parsedName = "Siswa Baru", email, whatsapp } = data;
    const studentName = invoice.lead?.name || (invoice as any).user?.name || parsedName || "Siswa";
    const passwordHash = await bcrypt.hash(whatsapp, 10);

    const cashflowCount = await prisma.cashflow.count({ where: { invoiceId: invoice.id } });
    const isPelunasanVerify = cashflowCount > 0 && invoice.paidAmount < invoice.totalAmount;

    let newStatus = invoice.paymentMethod === "DP" ? "DP_PAID" : "PAID";
    let amountToLog = invoice.paidAmount;
    let finalPaidAmount = invoice.paidAmount;
    let paymentLabel = invoice.paymentMethod === "DP" ? "Pembayaran DP" : "Pelunasan";

    if (isPelunasanVerify) {
      newStatus = "PAID";
      amountToLog = invoice.totalAmount - invoice.paidAmount;
      finalPaidAmount = invoice.totalAmount;
      paymentLabel = "Pelunasan";
    }

    // Tentukan kategori cashflow secara dinamis
    let cashflowCategory = invoice.paymentMethod === "DP" ? "DP" : "PELUNASAN";
    if (isPelunasanVerify) {
      cashflowCategory = "PELUNASAN";
    }

    // Atomic transaction: 4 operations
    await prisma.$transaction(async (tx) => {
      // 1. Mark invoice as PAID / DP_PAID
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: newStatus as any,
          paidAmount: finalPaidAmount,
          paymentMethod: invoice.paymentMethod ?? "MANUAL_TRANSFER",
        },
      });

      // 1b. Insert Cashflow log for this income
      await tx.cashflow.create({
        data: {
          type: "INCOME",
          category: cashflowCategory as any,
          amount: amountToLog,
          description: `${paymentLabel} - ${studentName}`,
          invoiceId: invoice.id,
          recordedById: (session.user as any)?.id || null,
          branch: invoice.branch,
        } as any
      });

      // ==========================================================
      // 2. EKSTRAKSI DATA AKADEMIK (DIJALANKAN UNTUK SEMUA APPROVAL)
      // ==========================================================
      const dataPayload = (invoice.studentData as any) || {};

      // A. Ambil string paling mentah dari segala sumber
      const rawProgram = String(dataPayload.activeProgram || dataPayload.program || invoice.programName || "").toLowerCase();

      let finalActiveProgram = "Unknown";
      let finalBatch = dataPayload.programBatch || dataPayload.session || null;

      // B. JARING PROGRAM (Keyword Matching Mutlak)
      if (rawProgram.includes("regular")) finalActiveProgram = "Regular";
      else if (rawProgram.includes("fullday")) finalActiveProgram = "Fullday";
      else if (rawProgram.includes("asrama")) finalActiveProgram = "Asrama";
      else if (rawProgram.includes("english on saturday") || rawProgram.includes("eos")) finalActiveProgram = "English on Saturday";
      else if (rawProgram.includes("efk")) finalActiveProgram = "EFK";
      else if (rawProgram.includes("eft")) finalActiveProgram = "EFT";
      else if (rawProgram.includes("toefl")) finalActiveProgram = "TOEFL";
      else if (rawProgram.includes("private")) finalActiveProgram = "Private";

      // C. JARING SESI / JAM (Regex)
      const timeRegex = /(\d{2}:\d{2}\s*[-—–]\s*\d{2}:\d{2})/;
      const match = String(dataPayload.program || invoice.programName || "").match(timeRegex);
      if (match) {
        finalBatch = match[0].replace(/\s*[-—–]\s*/, ' - ');
      }

      if (!finalBatch) {
        if (finalActiveProgram === "Regular") {
          finalBatch = dataPayload.session || "Unspecified";
        } else {
          // Untuk Non-Regular, gunakan duration sebagai batch agar tidak kosong di data admin
          finalBatch = dataPayload.durationOption || dataPayload.duration || dataPayload.session || "Unspecified";
        }
      }

      // D. Kalkulasi Durasi & End Date
      const durationOption = dataPayload.durationOption || dataPayload.duration || null;
      const batchSchedule = dataPayload.batchSchedule || dataPayload.batch || null;
      const rawStartDate = dataPayload.startDate;
      const calculatedStartDate = rawStartDate ? new Date(rawStartDate) : new Date();

      let finalDurationOption = durationOption || "1_MONTH"; // default fallback

      if (finalActiveProgram === "Regular") {
        finalDurationOption = "1_MONTH";
      } else if (finalActiveProgram === "English on Saturday") {
        finalDurationOption = "2_MONTHS";
      } else if (finalActiveProgram === "EFK" || finalActiveProgram === "EFT") {
        finalDurationOption = "6_MONTHS";
      } else if (finalActiveProgram === "Fullday" || finalActiveProgram === "Asrama") {
        finalDurationOption = durationOption || "1_MONTH"; // Fallback aman
      }

      const offDays = await tx.offDay.findMany();
      const calculatedEndDate = calculateEndDate(
        calculatedStartDate, 
        finalDurationOption, 
        offDays, 
        finalActiveProgram, 
        0
      );

      // E. Kalkulasi Jatah Izin (Leave Quota)
      let calculatedLeaveQuota = 0;

      if (finalDurationOption === "1_WEEK") calculatedLeaveQuota = 1;
      else if (finalDurationOption === "2_WEEKS") calculatedLeaveQuota = 2;
      else if (finalDurationOption === "3_WEEKS") calculatedLeaveQuota = 3;
      else if (finalDurationOption === "1_MONTH") calculatedLeaveQuota = 3; // Regular/Fullday 1 Bulan
      else if (finalDurationOption === "2_MONTHS") calculatedLeaveQuota = 5; // English on Saturday / Fullday 2 Bulan
      else if (finalDurationOption === "6_MONTHS") calculatedLeaveQuota = 12; // EFK / EFT
      else if (finalActiveProgram === "Regular") calculatedLeaveQuota = 3; // Fallback untuk Regular

      // 3. SATPAM BACKEND: Pengecekan Duplikasi
      const existingUser = await tx.user.findUnique({ where: { email } });
      if (existingUser) {
        const duplicateCheck = await tx.enrollment.findFirst({
          where: {
            userId: existingUser.id,
            programType: finalActiveProgram,
            startDate: calculatedStartDate,
            status: "ACTIVE"
          }
        });

        if (duplicateCheck) {
          console.log(`[WARNING] Duplication blocked for User ${existingUser.id} on program ${finalActiveProgram}`);
          throw new Error("Pendaftaran untuk program dan tanggal mulai ini sudah terproses. Menolak duplikasi data.");
        }
      }

      // 4. UPSERT USER DATABASE
      await tx.user.upsert({
        where: { email },
        update: {
          name: studentName,
          role: "STUDENT",
          branch: invoice.branch,
          ...(dataPayload.gender && { gender: dataPayload.gender }),
          ...(dataPayload.birthPlace && { birthPlace: dataPayload.birthPlace }),
          ...(dataPayload.birthDate && { birthDate: new Date(dataPayload.birthDate) }),
          ...(dataPayload.occupation && { occupation: dataPayload.occupation }),
          ...(dataPayload.discoverySource && { discoverySource: dataPayload.discoverySource }),
          ...(dataPayload.address && { address: dataPayload.address }),
            enrollments: {
              create: {
                programType: finalActiveProgram,
                durationOption: finalDurationOption,
                programBatch: finalBatch,
                batchSchedule: batchSchedule,
                startDate: calculatedStartDate,
                endDate: calculatedEndDate,
                leaveQuota: calculatedLeaveQuota,
                tshirtSize: dataPayload.tshirtSize || null,
              }
            }
        },
        create: {
          name: studentName,
          email,
          passwordHash,
          phoneNumber: whatsapp,
          role: "STUDENT",
          branch: invoice.branch,
          gender: dataPayload.gender || null,
          birthPlace: dataPayload.birthPlace || null,
          birthDate: dataPayload.birthDate ? new Date(dataPayload.birthDate) : null,
          occupation: dataPayload.occupation || null,
          discoverySource: dataPayload.discoverySource || null,
          address: dataPayload.address || null,
            enrollments: {
              create: {
                programType: finalActiveProgram,
                durationOption: finalDurationOption,
                programBatch: finalBatch,
                batchSchedule: batchSchedule,
                startDate: calculatedStartDate,
                endDate: calculatedEndDate,
                leaveQuota: calculatedLeaveQuota,
                leaveUsed: 0,
                tshirtSize: dataPayload.tshirtSize || null,
              }
            }
        }
      });

      // 4. Mark the related Lead as CLOSED_WON and update tshirtSize
      if (invoice.leadId) {
        await tx.lead.update({
          where: { id: invoice.leadId },
          data: { 
            status: "CLOSED_WON",
            ...(dataPayload.tshirtSize && { tshirtSize: dataPayload.tshirtSize }),
          },
        });
      }
    });

    // Revalidate routes so UI updates immediately
    const { revalidatePath } = require("next/cache");
    revalidatePath("/admin/crm");
    revalidatePath("/admin/users");

    const loginUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
      : "https://portal.kampunginggrissolo.com/login";

    return {
      success: true,
      message:
        `Halo ${studentName}! 🎉 Pembayaran DP/Pelunasan untuk program *"${invoice.programName}"* sudah kami konfirmasi.\n\n` +
        `Berikut akun login portal siswa Anda:\n` +
        `🔗 *Portal*: ${loginUrl}\n` +
        `📧 *Email*: ${email}\n` +
        `🔑 *Password*: ${whatsapp}\n\n` +
        `Mohon segera login dan ganti password Anda. Selamat belajar! 🙌`,
    };
  } catch (err) {
    console.error("[approvePayment]", err);
    return { error: "Terjadi kesalahan saat memverifikasi pembayaran. Silakan coba lagi." };
  }
}

// ── 4. Settle Payment On-Site (CS) ───────────────────────────────────────────
export async function settlePaymentOnSite(invoiceId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Sesi tidak valid." };
    if (!STAFF_ALLOWED.includes(session.user.role as string)) {
      return { error: "Tidak memiliki hak akses." };
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { lead: true }
    });
    if (!invoice) return { error: "Invoice tidak ditemukan." };

    if (invoice.status !== "DP_PAID") {
      return { error: `Invoice berstatus "${invoice.status}", bukan DP_PAID.` };
    }

    const pelunasanAmount = invoice.totalAmount - invoice.paidAmount;

    const dataPayload = (invoice.studentData as any) || {};
    const { name: parsedName = "Siswa Baru" } = dataPayload;
    const studentName = invoice.lead?.name || (invoice as any).user?.name || parsedName || "Siswa";

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paymentMethod: "CASH_ON_SITE",
          paidAmount: invoice.totalAmount, // Fully paid
        },
      });

      await tx.cashflow.create({
        data: {
          type: "INCOME",
          category: "PELUNASAN",
          amount: pelunasanAmount,
          description: `Pelunasan - ${studentName}`,
          invoiceId: invoice.id,
          recordedById: (session.user as any)?.id || null,
          branch: invoice.branch,
        } as any
      });
    });

    revalidatePath("/admin/crm");
    return { success: true };
  } catch (err) {
    console.error("[settlePaymentOnSite]", err);
    return { error: "Terjadi kesalahan." };
  }
}

// ── 5. Submit Pelunasan Proof (Public) ───────────────────────────────────────
export async function submitPelunasanProof(invoiceId: string, proofUrl: string) {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return { error: "Invoice tidak ditemukan." };

    // Set to WAITING_CONFIRMATION so CS can verify the pelunasan transfer
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "WAITING_CONFIRMATION",
        paymentProof: proofUrl,
      },
    });

    revalidatePath(`/pay/pelunasan/${invoice.invoiceNumber}`);
    return { success: true };
  } catch (err) {
    console.error("[submitPelunasanProof]", err);
    return { error: "Terjadi kesalahan." };
  }
}
