"use server";

import { prisma } from "../../../../lib/prisma";

export async function getStudentProfile(studentId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      activeProgram: true,
      programBatch: true,
      batchSchedule: true,
      startDate: true,
      endDate: true,
      leaveQuota: true,
      leaveUsed: true,
    },
  });
  return profile;
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
