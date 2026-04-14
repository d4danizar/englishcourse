"use server";

import { prisma } from "../../../../lib/prisma";
import { calculateExtendedEndDate } from "@/lib/utils/academic-calendar";

export async function getStudentProfile(studentId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      enrollments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          programType: true,
          programBatch: true,
          batchSchedule: true,
          startDate: true,
          endDate: true,
          leaveQuota: true,
          leaveUsed: true,
          totalLeaves: true,
          durationOption: true,
        }
      }
    },
  });

  if (!profile) return null;

  const enrollment = profile.enrollments[0] || {} as any;
  const mappedProfile = {
    id: profile.id,
    name: profile.name,
    activeProgram: enrollment.programType || null,
    programBatch: enrollment.programBatch || null,
    batchSchedule: enrollment.batchSchedule || null,
    startDate: enrollment.startDate || null,
    endDate: enrollment.endDate || null,
    leaveQuota: enrollment.leaveQuota || 0,
    leaveUsed: enrollment.leaveUsed || 0,
    totalLeaves: enrollment.totalLeaves || 0,
    durationOption: enrollment.durationOption || null,
  };

  let extendedEndDate: Date | null = null;
  if (mappedProfile.startDate && mappedProfile.activeProgram && mappedProfile.totalLeaves > 0) {
    extendedEndDate = calculateExtendedEndDate(
      mappedProfile.startDate,
      mappedProfile.durationOption || "1_MONTH",
      mappedProfile.totalLeaves,
      mappedProfile.activeProgram
    );
  }

  return {
    ...mappedProfile,
    extendedEndDate,
  };
}

export async function getStudentAttendances(studentId: string) {
  const attendances = await prisma.attendance.findMany({
    where: { studentId },
    include: {
      session: {
        select: {
          title: true,
          date: true,
          timeSlot: true,
        },
      },
      student: { // We need tutor info, but actually tutor is attached to session.
        select: { name: true }
      }
    },
    orderBy: {
      session: {
        date: "desc",
      },
    },
  });

  // Re-fetch sessions to include tutor name properly
  // Since session -> tutor is not directly accessible without nested include in Attendance,
  // let's do a more precise query:
  
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
