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

export async function renewStudent(
  userId: string,
  data: {
    programType: string;
    startDate: Date;
    duration: string;
    amount: number;
    paymentMethod: string;
  }
) {
  try {
    const offDays = await prisma.offDay.findMany();
    const calculatedEndDate = calculateEndDate(new Date(data.startDate), data.duration, offDays, data.programType, 0);
    const calculatedLeaveQuota = calculateLeaveQuota(data.programType, data.duration);

    await prisma.user.update({
      where: { id: userId },
      data: {
        enrollments: {
          create: {
            programType: data.programType,
            startDate: new Date(data.startDate),
            endDate: calculatedEndDate,
            durationOption: data.duration,
            leaveQuota: calculatedLeaveQuota,
            leaveUsed: 0,
            status: "ACTIVE"
          }
        }
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/student/dashboard"); // Refresh if student is currently looking
    return { success: true };
  } catch (error: any) {
    console.error("renewStudent error:", error);
    return { error: error.message || "Failed to renew student." };
  }
}
