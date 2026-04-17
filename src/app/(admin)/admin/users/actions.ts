"use server";

import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Role, BranchLocation } from "@prisma/client";
import { sanitizePhoneNumber, calculateLeaveQuota } from "@/lib/formatters";
import { calculateEndDate } from "@/lib/utils/date-helpers";

export async function createUser(formData: FormData) {
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

    // Refresh the table UI automatically
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Email already exists in the system." };
    }
    return { error: error.message || "Failed to create user." };
  }
}

export async function editUser(formData: FormData) {
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
    const totalLeaves = totalLeavesStr ? parseInt(totalLeavesStr, 10) : 0;

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

    if (isStudent && activeProgram && startDateStr) {
      await prisma.user.update({
        where: { id },
        data: {
          activeProgram,
          programBatch: programBatch || null,
          startDate: new Date(startDateStr),
          endDate: endDateStr ? new Date(endDateStr) : null,
          durationOption: durationOption || null,
          batchSchedule: batchSchedule || null,
          leaveQuota: calculateLeaveQuota(activeProgram, durationOption),
          leaveUsed: totalLeaves || 0,
        }
      });
    }

    revalidatePath("/admin/users");
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
    const calculatedEndDate = calculateEndDate(new Date(data.startDate), data.duration);
    const calculatedLeaveQuota = calculateLeaveQuota(data.programType, data.duration);

    await prisma.user.update({
      where: { id: userId },
      data: {
        activeProgram: data.programType,
        startDate: new Date(data.startDate),
        endDate: calculatedEndDate,
        durationOption: data.duration,
        leaveQuota: calculatedLeaveQuota,
        leaveUsed: 0,
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
