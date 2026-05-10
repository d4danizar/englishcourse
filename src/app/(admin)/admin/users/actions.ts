"use server";

import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Role, BranchLocation } from "@prisma/client";
import { sanitizePhoneNumber, calculateLeaveQuota } from "@/lib/formatters";
import { calculateEndDate } from "@/lib/offday-utils";

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

    // Assuming only STAFF/ADMIN/TUTOR have codes
    return { 
      valid: true, 
      discount: 100000, 
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
  }
) {
  try {
    let finalAmount = data.amount || 0;
    let finalDuration = data.duration;

    if (data.programType === "Membership") {
      const activeEnrollmentCount = await prisma.enrollment.count({
        where: { userId: userId, status: "ACTIVE" }
      });

      if (activeEnrollmentCount > 0) {
        throw new Error("Pendaftaran ditolak: Hanya alumni yang sudah lulus yang dapat mengambil program Membership.");
      }

      switch (data.membershipPackage) {
        case "1_Bulan": 
          finalAmount = 750000; 
          finalDuration = "1_MONTH"; 
          break;
        case "3_Plus_1_Bulan": 
          finalAmount = 1250000; 
          finalDuration = "4_MONTHS"; 
          break;
        case "6_Plus_1_Bulan": 
          finalAmount = 1950000; 
          finalDuration = "7_MONTHS"; 
          break;
        case "12_Plus_1_Bulan": 
          finalAmount = 3100000; 
          finalDuration = "13_MONTHS"; 
          break;
        default: 
          throw new Error("Paket Membership tidak valid.");
      }

      if (data.referralCode && data.referralCode.trim() !== "") {
        // Apply the exact 100,000 discount if a code is provided
        const discountAmount = 100000;
        finalAmount = finalAmount - discountAmount;
      }
    }

    const offDays = await prisma.offDay.findMany();
    const calculatedEndDate = calculateEndDate(new Date(data.startDate), finalDuration, offDays, data.programType, 0);
    const calculatedLeaveQuota = calculateLeaveQuota(data.programType, finalDuration);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    await prisma.$transaction(async (tx) => {
      // 0. Set all existing active enrollments for this user to EXPIRED to clean up DB
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
        // 1. Determine Status based on Payment Method
        const isCash = data.paymentMethod.toUpperCase() === "CASH";
        const paymentStatus = isCash ? "PAID" : "PENDING"; // Though usually RO is considered PAID if Cash, or PENDING if Transfer. Wait, admin assumes PAID if they process it? The user said "Since admin processes it, assume it's paid" - let's stick to the user's explicit instructions.
        const finalStatus = isCash ? "PAID" : "WAITING_CONFIRMATION";

        // 2. Ensure Lead exists for Invoice
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
              branch: user.branch
            }
          });
        }

        // 3. Create the Invoice Record
        const dateStr = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}`;
        const invoiceNumber = `INV-RO-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber: invoiceNumber,
            leadId: lead.id,
            programName: `Repeat Order - ${data.programType}`,
            amountDue: isCash ? 0 : finalAmount,
            totalAmount: finalAmount,
            paidAmount: isCash ? finalAmount : 0,
            status: finalStatus,
            paymentMethod: data.paymentMethod,
            branch: user.branch,
            studentData: {
              name: user.name,
              email: user.email,
              whatsapp: user.phoneNumber,
              program: data.programType,
              isRepeatOrder: true
            }
          }
        });

        // 4. Inject into Cashflow if it's a CASH transaction
        if (isCash) {
          await tx.cashflow.create({
            data: {
              type: "INCOME",
              category: "PELUNASAN", // Kept PELUNASAN as per Prisma schema enum
              amount: finalAmount,
              description: `Repeat Order ${data.programType} (Cash) - ${user.name}`,
              invoiceId: invoice.id,
              branch: user.branch
            }
          });
        }
      }
    });

    revalidatePath("/admin/users");
    revalidatePath("/student/dashboard"); // Refresh if student is currently looking
    return { success: true };
  } catch (error: any) {
    console.error("renewStudent error:", error);
    return { error: error.message || "Failed to renew student." };
  }
}

