"use server";

import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Role, BranchLocation } from "@prisma/client";
import { sanitizePhoneNumber, calculateLeaveQuota } from "@/lib/formatters";
import { calculateEndDate } from "@/lib/offday-utils";
import { calculateFinalPrice, getMembershipPackageDetails, REFERRAL_DISCOUNT } from "@/lib/utils/pricing";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createUser(formData: FormData) {
  console.log("=== 🚨 ADD USER PAYLOAD RADAR 🚨 ===");
  console.log("Raw Data Received:", formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData); 
  console.log("=====================================");

  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const role = formData.get("role") as Role;
    const branch = (formData.get("branch") as BranchLocation) || "KARTASURA";
    const rawSecondaryBranch = formData.get("secondaryBranch") as string;
    const secondaryBranch = rawSecondaryBranch && rawSecondaryBranch.trim() !== "" ? rawSecondaryBranch : null;
    const activeProgram = formData.get("activeProgram") as string;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const durationOption = formData.get("durationOption") as string;
    const batchSchedule = formData.get("batchSchedule") as string;
    const programBatch = formData.get("programBatch") as string;

    if (!name || !email || !role) {
      return { error: "Name, email, and role are required." };
    }

    // Default password as requested
    const passwordHash = await bcrypt.hash("kampunginggris123", 10);

    const isStudent = role === "STUDENT";

    try {
      await prisma.user.create({
        data: {
          name,
          email,
          phoneNumber: phoneNumber ? sanitizePhoneNumber(phoneNumber) : null,
          role,
          branch,
          secondaryBranch: secondaryBranch ? (secondaryBranch as BranchLocation) : null,
          passwordHash,
          ...(isStudent && activeProgram && startDateStr ? {
            enrollments: {
              create: {
                programType: activeProgram,
                durationOption: durationOption || null,
                programBatch: programBatch || null,
                batchSchedule: batchSchedule || null,
                startDate: new Date(startDateStr),
                endDate: endDateStr ? new Date(endDateStr) : null,
                leaveQuota: calculateLeaveQuota(activeProgram, durationOption),
                leaveUsed: 0,
                totalLeaves: 0,
              }
            }
          } : {})
        },
      });
      console.log("✅ USER SUCCESSFULLY CREATED IN DB");
    } catch (prismaError: any) {
      console.error("❌❌ PRISMA CREATE FAILED ❌❌");
      console.error(prismaError);
      
      // Checking native constraint to give precise error
      if (prismaError.code === "P2002") {
        throw new Error("Email already exists in the system.");
      }
      
      throw new Error(prismaError.message || "Gagal menyimpan user baru ke database. Cek terminal!");
    }

    // Refresh the table UI automatically
    revalidatePath("/admin/users");
    return { success: true };
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("Email already exists in the system.");
    }
    throw new Error(error.message || "Failed to create user.");
  }
}

export async function editUser(formData: FormData) {
  console.log("=== 🚀 SERVER ACTION: EDIT USER TRIGGERED ===");
  console.log("FormData Entries:", Array.from(formData.entries()));

  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const role = formData.get("role") as Role;
    const branch = (formData.get("branch") as BranchLocation) || "KARTASURA";
    const rawSecondaryBranch = formData.get("secondaryBranch") as string;
    const secondaryBranch = rawSecondaryBranch && rawSecondaryBranch.trim() !== "" ? rawSecondaryBranch : null;

    // Student-specific fields
    const activeProgram = formData.get("activeProgram") as string;
    const programBatch = formData.get("programBatch") as string;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const durationOption = formData.get("durationOption") as string;
    const batchSchedule = formData.get("batchSchedule") as string;
    const totalLeavesStr = formData.get("totalLeaves") as string;
    const totalLeaves = Number(totalLeavesStr) || 0;

    console.log("=== 📋 FORM DATA DITERIMA ===");
    console.log("userId:", id, "| role:", role, "| totalLeavesStr:", JSON.stringify(totalLeavesStr), "| totalLeaves (Number):", totalLeaves, "| typeof:", typeof totalLeaves);
    console.log("activeProgram:", activeProgram, "| startDateStr:", startDateStr, "| durationOption:", durationOption);

    if (!id || !name || !email || !role) {
      return { error: "ID, Name, email, and role are required." };
    }

    const isStudent = role === "STUDENT";

    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phoneNumber: phoneNumber ? sanitizePhoneNumber(phoneNumber) : null,
        role,
        branch,
        secondaryBranch: secondaryBranch ? (secondaryBranch as BranchLocation) : null,
        referralCode: formData.get("referralCode") ? (formData.get("referralCode") as string).toUpperCase() : null,
      },
    });

    if (isStudent) {
      // Ambil enrollment aktif milik user (jika ada) saat ini yang perlu diupdate endDatenya
      const activeEnrollment = await prisma.enrollment.findFirst({
        where: { userId: id },
        orderBy: { createdAt: 'desc' }
      });

      console.log("=== 🔍 ENROLLMENT LOOKUP ===");
      console.log("Enrollment found:", activeEnrollment ? "YES (id: " + activeEnrollment.id + ")" : "NO");
      if (activeEnrollment) {
        console.log("  DB startDate:", activeEnrollment.startDate);
        console.log("  DB endDate (LAMA):", activeEnrollment.endDate);
        console.log("  DB durationOption:", activeEnrollment.durationOption);
        console.log("  DB programType:", activeEnrollment.programType);
        console.log("  DB leaveUsed:", activeEnrollment.leaveUsed);
      }

      if (activeEnrollment) {
        // Ambil data untuk kalkulasi (utamakan form input, jika kosong pakai database)
        const progType = activeProgram || activeEnrollment.programType;
        const durOpt = durationOption || activeEnrollment.durationOption;
        const startD = startDateStr ? new Date(startDateStr) : activeEnrollment.startDate;

        // Ambil tanggal matang langsung dari Client (yang sudah beres masalah timezone WIB-nya)
        const clientEndDateRaw = formData.get("clientCalculatedEndDate") as string;
        if (!clientEndDateRaw) {
          throw new Error("Tanggal estimasi dari client tidak ditemukan!");
        }
        const calculatedEndDateStr = new Date(clientEndDateRaw);

        console.log("6. ✨ HASIL newEndDate (DARI CLIENT):", calculatedEndDateStr);
        console.log("   vs. endDate LAMA:", activeEnrollment.endDate);
        console.log("================================");
        
        console.log("=== 🚀 MENCOBA UPDATE DATABASE ===");
        console.log("Data diterima:", { 
          leaveUsed: totalLeaves, 
          leaveQuota: calculateLeaveQuota(progType, durOpt), 
          clientEndDate: clientEndDateRaw 
        });

        try {
          await prisma.enrollment.update({
            where: { id: activeEnrollment.id },
            data: {
              programType: activeProgram || undefined,
              programBatch: programBatch || undefined,
              startDate: startDateStr ? new Date(startDateStr) : undefined,
              endDate: calculatedEndDateStr,
              durationOption: durationOption || undefined,
              batchSchedule: batchSchedule || undefined,
              leaveQuota: calculateLeaveQuota(progType, durOpt),
              leaveUsed: totalLeaves,
              totalLeaves: totalLeaves,
            }
          });
          console.log("✅ UPDATE BERHASIL:", { leaveQuota: calculateLeaveQuota(progType, durOpt), leaveUsed: totalLeaves, endDate: calculatedEndDateStr });
        } catch (error) {
          console.error("❌❌ PRISMA GAGAL UPDATE ❌❌");
          console.error(error);
          throw new Error("Gagal menyimpan ke database! Cek terminal server.");
        }
      } else if (activeProgram && startDateStr) {
        // Fallback jika belum pernah ada enrollment dan kita mengisi via Edit
        const startD = new Date(startDateStr);
        const clientEndDateRaw = formData.get("clientCalculatedEndDate") as string;
        if (!clientEndDateRaw) {
          throw new Error("Tanggal estimasi dari client tidak ditemukan (Fallback mode)!");
        }
        const calculatedEndDateStr = new Date(clientEndDateRaw);

        await prisma.enrollment.create({
          data: {
            userId: id,
            programType: activeProgram,
            programBatch: programBatch || null,
            startDate: startD,
            endDate: calculatedEndDateStr,
            durationOption: durationOption || null,
            batchSchedule: batchSchedule || null,
            leaveQuota: calculateLeaveQuota(activeProgram, durationOption),
            leaveUsed: totalLeaves || 0,
            status: "ACTIVE"
          }
        });
      }
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin/crm");
    revalidatePath("/admin/classes");
    revalidatePath("/student/dashboard");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Email already exists in the system." };
    }
    return { error: error.message || "Failed to edit user." };
  }
}

export async function resetPassword(userId: string) {
  try {
    const passwordHash = await bcrypt.hash("kampunginggris123", 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to reset password." };
  }
}

export async function deleteUser(userId: string) {
  try {
    // Cascade delete: attendance records for this student
    await prisma.attendance.deleteMany({ where: { studentId: userId } });
    // Delete sessions taught by this tutor (will cascade delete their attendances too)
    await prisma.session.deleteMany({ where: { tutorId: userId } });
    
    await prisma.user.delete({ where: { id: userId } });
    
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete user. Please check related records." };
  }
}

export async function validateReferralCode(code: string) {
  try {
    const userWithCode = await prisma.user.findUnique({
      where: { referralCode: code.toUpperCase() },
      select: { id: true, name: true, role: true }
    });

    if (!userWithCode) {
      return { valid: false, error: "Kode promo tidak ditemukan." };
    }

    // Discount amount is driven by the central pricing constant
    return { 
      valid: true, 
      discount: REFERRAL_DISCOUNT,
      ownerName: userWithCode.name 
    };
  } catch (error) {
    return { valid: false, error: "Terjadi kesalahan sistem." };
  }
}

export async function renewStudent(
  userId: string,
  data: {
    programType: string;
    startDate: Date;
    duration: string;
    amount: number;
    paymentMethod: string;
    membershipPackage?: string;
    referralCode?: string;
    paymentType?: "LUNAS" | "DP";
    dpAmount?: number;
  }
) {
  const session = await getServerSession(authOptions);
  const adminId = (session?.user as any)?.id || null;

  try {
    // ── Price Calculation (Single Source of Truth) ──────────────────────────
    // For non-Membership programs the admin passes `data.amount` directly from
    // the UI (which itself was calculated by the pricing engine on the client).
    // For Membership, calculateFinalPrice handles package lookup + referral here.
    let finalAmount = data.amount || 0;
    let finalDuration = data.duration;

    if (data.programType === "Membership") {
      const activeEnrollmentCount = await prisma.enrollment.count({
        where: { userId: userId, status: "ACTIVE" }
      });

      if (activeEnrollmentCount > 0) {
        throw new Error("Pendaftaran ditolak: Hanya alumni yang sudah lulus yang dapat mengambil program Membership.");
      }

      const hasReferral = !!(data.referralCode && data.referralCode.trim() !== "");

      const { totalAmount: computedAmount, resolvedDuration } = calculateFinalPrice({
        programName: data.programType,
        membershipPackage: data.membershipPackage,
        isRepeatOrder: true,    // Membership is always repeat — no registration fee
        hasReferral,
      });

      finalAmount = computedAmount;
      finalDuration = resolvedDuration;
    }

    const offDays = await prisma.offDay.findMany();
    const calculatedEndDate = calculateEndDate(new Date(data.startDate), finalDuration, offDays, data.programType, 0);
    const calculatedLeaveQuota = calculateLeaveQuota(data.programType, finalDuration);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    await prisma.$transaction(async (tx) => {
      // 0. SATPAM BACKEND: Pengecekan Duplikasi
      const duplicateCheck = await tx.enrollment.findFirst({
        where: {
          userId: userId,
          programType: data.programType,
          startDate: new Date(data.startDate)
        }
      });

      if (duplicateCheck) {
        console.log(`[WARNING] Duplication blocked for User ${userId} on program ${data.programType}`);
        throw new Error("Pendaftaran untuk program dan tanggal mulai ini sudah terproses. Menolak duplikasi data.");
      }

      // 0.5 Set all existing active enrollments for this user to EXPIRED to clean up DB
      await tx.enrollment.updateMany({
        where: { userId: userId, status: "ACTIVE" },
        data: { status: "EXPIRED" }
      });

      const newEnrollment = await tx.enrollment.create({
        data: {
          userId: userId,
          programType: data.programType,
          startDate: new Date(data.startDate),
          endDate: calculatedEndDate,
          durationOption: finalDuration,
          leaveQuota: calculatedLeaveQuota,
          leaveUsed: 0,
          status: "ACTIVE",
          referralCodeUsed: data.referralCode ? data.referralCode.toUpperCase() : null
        }
      });

      if (finalAmount > 0 && user) {
        // 1. Ensure Lead exists for Invoice
        let lead = await tx.lead.findFirst({
          where: { whatsapp: user.phoneNumber || "UNKNOWN" }
        });
        if (!lead) {
          lead = await tx.lead.findFirst({
            where: { name: user.name }
          });
        }
        if (!lead) {
          lead = await tx.lead.create({
            data: {
              name: user.name,
              whatsapp: user.phoneNumber || "000000",
              status: "CLOSED_WON",
              branch: user.branch,
              assigneeId: adminId,
            }
          });
        }

        // 2. Prepare Invoice Details
        const dateStr = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}`;
        const invoiceNumber = `INV-RO-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        let finalStatus = "PENDING";
        let amountDue = finalAmount;
        let paidAmount = 0;

        if (data.paymentType === "LUNAS") {
          finalStatus = "PAID";
          amountDue = 0;
          paidAmount = finalAmount;
        } else if (data.paymentType === "DP" && data.dpAmount) {
          finalStatus = "DP_PAID";
          amountDue = Math.max(0, finalAmount - data.dpAmount);
          paidAmount = data.dpAmount;
        }

        // 3. Create the Invoice Record
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber: invoiceNumber,
            leadId: lead.id,
            programName: `Repeat Order - ${data.programType}`,
            amountDue: amountDue,
            totalAmount: finalAmount,
            paidAmount: paidAmount,
            status: finalStatus as any,
            paymentMethod: data.paymentMethod,
            branch: user.branch,
            studentData: {
              name: user.name,
              email: user.email,
              whatsapp: user.phoneNumber,
              program: data.programType,
              isRepeatOrder: true,
              paymentType: data.paymentType
            }
          }
        });

        // 4. Create Cashflow (Since admin explicitly confirmed payment via Checkbox)
        if (data.paymentType === "LUNAS") {
          await tx.cashflow.create({
            data: {
              type: "INCOME",
              category: "PELUNASAN", 
              amount: finalAmount,
              description: `Pembayaran Lunas Repeat Order - ${data.programType} (${user.name})`,
              date: new Date(),
              invoiceId: invoice.id,
              branch: user.branch,
              recordedById: adminId,
              paymentMethod: data.paymentMethod || "TRANSFER", // ✅ Preserve payment channel
            }
          });
        } else if (data.paymentType === "DP" && data.dpAmount) {
          await tx.cashflow.create({
            data: {
              type: "INCOME",
              category: "DP",
              amount: data.dpAmount,
              description: `Pembayaran DP Repeat Order - ${data.programType} (${user.name})`,
              date: new Date(),
              invoiceId: invoice.id,
              branch: user.branch,
              recordedById: adminId,
              paymentMethod: data.paymentMethod || "TRANSFER", // ✅ Preserve payment channel
            }
          });
        }
      }
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/finance");
    revalidatePath("/admin/enrollments");
    revalidatePath("/admin/dashboard");
    revalidatePath("/student/dashboard"); // Refresh if student is currently looking
    return { success: true };
  } catch (error: any) {
    console.error("renewStudent error:", error);
    return { error: error.message || "Failed to renew student." };
  }
}

