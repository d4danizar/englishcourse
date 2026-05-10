"use server";

import { prisma } from "../../../../lib/prisma";
import { calculateLeaveQuota } from "@/lib/formatters";

export async function getStudentProfile(studentId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      // Tarik Enrollment yang paling baru (indeks 0)
      enrollments: {
        orderBy: { createdAt: 'desc' },
        take: 1, 
        select: {
          programType: true,
          durationOption: true,
          startDate: true,
          endDate: true,
          totalLeaves: true,
          leaveQuota: true,
          leaveUsed: true,
          status: true,
          id: true,
          finalVideoLink: true,
          certificateScore: true,
          isCertificateApproved: true,
        }
      }
    }
  });

  if (!profile) return null;

  const currentEnrollment = profile.enrollments?.[0];

  console.log("=== 🔍 X-RAY DASHBOARD MURID ===");
  console.log("Data Enrollment:", currentEnrollment);
  console.log("================================");

  const safeLeaveQuota = calculateLeaveQuota(currentEnrollment?.programType || null, currentEnrollment?.durationOption || null) || 0;

  // Map kembali data ke format yang diharapkan oleh UI Frontend (PENTING agar UI tidak crash)
  return {
    id: profile.id,
    name: profile.name,
    activeProgram: currentEnrollment?.programType || "Belum ada program aktif",
    startDate: currentEnrollment?.startDate || null,
    endDate: currentEnrollment?.endDate || null,
    leaveUsed: currentEnrollment?.leaveUsed || 0,
    leaveQuota: safeLeaveQuota,
    programBatch: "-", 
    batchSchedule: "-",
    // Include full enrollment for FinalTaskSubmission (we also ensure leaveQuota is fixed inside currentEnrollment)
    currentEnrollment: currentEnrollment ? { ...currentEnrollment, leaveQuota: safeLeaveQuota } : null,
  };
}

export async function getStudentAttendances(studentId: string) {
  const detailedAttendances = await prisma.attendance.findMany({
    where: { studentId },
    include: {
      session: {
        include: {
          tutor: { select: { name: true } }
        }
      }
    },
    orderBy: {
      session: { date: "desc" }
    }
  });

  return detailedAttendances;
}

export async function getStudentEvaluations(studentId: string) {
  const evaluations = await prisma.descriptiveEvaluation.findMany({
    where: { studentId },
    include: {
      tutor: { select: { name: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function submitFinalVideo(enrollmentId: string, videoLink: string) {
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("../../../../lib/auth");

  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { error: "Unauthorized" };
  }

  const studentId = session.user.id;

  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment || enrollment.userId !== studentId) {
    return { error: "Invalid enrollment" };
  }

  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { finalVideoLink: videoLink }
    });

    return { success: true };
  } catch (error) {
    console.error("[submitFinalVideo] Error:", error);
    return { error: "Failed to submit final video." };
  }
}

export async function submitLeaveRequest(enrollmentId: string, leaveDate: Date, reason: string) {
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("../../../../lib/auth");
  const { calculateEndDate } = await import("@/lib/offday-utils");

  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { error: "Unauthorized" };
  }

  const studentId = session.user.id;

  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment || enrollment.userId !== studentId) {
    return { error: "Invalid enrollment" };
  }

  // 1. CHECK QUOTA
  const maxLeaves = calculateLeaveQuota(enrollment.programType, enrollment.durationOption) || 0;
  const usedLeaves = enrollment.leaveUsed || 0;
  
  if (usedLeaves >= maxLeaves) {
    return { error: "Kuota izin telah habis." };
  }

  // Calculate new leaves
  const newLeaveUsed = usedLeaves + 1;
  const newTotalLeaves = (enrollment.totalLeaves || 0) + 1;

  // 2. FETCH OFF DAYS (Global Holidays)
  const offDays = await prisma.offDay.findMany();

  // 3. CALCULATE NEW END DATE
  const newEndDate = calculateEndDate(
    enrollment.startDate,
    enrollment.durationOption,
    offDays,
    enrollment.programType,
    newTotalLeaves // Or newLeaveUsed if totalLeaves is same
  );

  // 4. UPDATE DATABASE
  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        leaveUsed: newLeaveUsed,
        totalLeaves: newTotalLeaves,
        endDate: newEndDate,
      }
    });

    return { success: true, newEndDate };
  } catch (error) {
    console.error("[submitLeaveRequest] Error:", error);
    return { error: "Failed to process leave request." };
  }
}


