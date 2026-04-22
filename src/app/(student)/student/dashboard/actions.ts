"use server";

import { prisma } from "../../../../lib/prisma";

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
          startDate: true,
          endDate: true,
          totalLeaves: true,
          leaveQuota: true,
          leaveUsed: true,
          status: true,
          // tambahkan batch/schedule di sini jika ada di schema Enrollment
        }
      }
    }
  });

  if (!profile) return null;

  const currentEnrollment = profile.enrollments?.[0];

  console.log("=== 🔍 X-RAY DASHBOARD MURID ===");
  console.log("Data Enrollment:", currentEnrollment);
  console.log("================================");

  // Map kembali data ke format yang diharapkan oleh UI Frontend (PENTING agar UI tidak crash)
  return {
    id: profile.id,
    name: profile.name,
    activeProgram: currentEnrollment?.programType || "Belum ada program aktif",
    startDate: currentEnrollment?.startDate || null,
    endDate: currentEnrollment?.endDate || null,
    leaveUsed: currentEnrollment?.leaveUsed || 0,
    leaveQuota: currentEnrollment?.totalLeaves || currentEnrollment?.leaveQuota || 0,
    // Jika UI butuh batch/schedule tapi datanya belum direlokasi sempurna, beri fallback string
    programBatch: "-", 
    batchSchedule: "-",
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
  return evaluations;
}

