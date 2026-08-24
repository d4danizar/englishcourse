"use server";

import { prisma } from "../../../../lib/prisma";

export async function getStudentUpcomingSchedules(studentId: string) {
  const rawStudent = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      enrollments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          programType: true,
          programBatch: true,
          batchSchedule: true,
          startDate: true,
          endDate: true,
        }
      }
    },
  });

  const student = {
    activeProgram: rawStudent?.enrollments?.[0]?.programType || null,
    programBatch: rawStudent?.enrollments?.[0]?.programBatch || null,
    batchSchedule: rawStudent?.enrollments?.[0]?.batchSchedule || null,
    startDate: rawStudent?.enrollments?.[0]?.startDate || null,
    endDate: rawStudent?.enrollments?.[0]?.endDate || null,
  };

  console.log("=== DEBUG REVERSE RADAR ===");
  console.log("0. Raw Student Object:", student);
  console.log("===========================");

  if (!student || !student.activeProgram) {
    return [];
  }

  // Set today start to 00:00
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Safely determine upper bound for dates
  let safeEndDate;
  if (student.endDate) {
    safeEndDate = new Date(student.endDate);
    safeEndDate.setHours(23, 59, 59, 999);
  } else {
    // If no endDate provided, let the student see classes for the next 14 days
    safeEndDate = new Date();
    safeEndDate.setDate(safeEndDate.getDate() + 14);
    safeEndDate.setHours(23, 59, 59, 999);
  }

  // Broad fetch: all incomplete sessions from today until the student's end date
  const candidateSessions = await prisma.session.findMany({
    where: {
      date: {
        gte: today,
        lte: safeEndDate,
      },
      isCompleted: false, // Wait, maybe we want to show completed if they just want "schedules", but "upcoming" implies they need to attend. We'll leave it as all sessions in the timeframe. Actually let's fetch all sessions in the future timeframe.
    },
    include: {
      tutor: { select: { name: true } },
      assignedStudents: { select: { id: true } },
    },
    orderBy: [
      { date: "asc" },
      { timeSlot: "asc" }
    ],
  });

  console.log("=== DEBUG REVERSE RADAR ===");
  console.log("1. Student Program:", student.activeProgram, "| Batch:", student.programBatch);
  console.log("2. Total Sessions Fetched from DB:", candidateSessions.length);
  if (candidateSessions.length > 0) {
    console.log("3. Sample Session 0 ProgramType:", candidateSessions[0].programType, "| TimeSlot:", candidateSessions[0].timeSlot, "| Date:", candidateSessions[0].date);
  }
  console.log("===========================");

  // Apply Reverse Radar Logic
  const validSessions = candidateSessions.filter((session) => {
    const sType = session.programType.trim().toLowerCase();
    const prog = student.activeProgram!.trim().toLowerCase();
    const sessionDay = session.date.getDay();

    // -- CONVERSATION (Regular, Fullday, Asrama)
    if (sType === "conversation") {
      if (prog === "regular") {
        if (!student.programBatch) return false;
        const normBatch = student.programBatch.trim().toLowerCase();
        const normTime = session.timeSlot.trim().toLowerCase();
        return normTime.includes(normBatch) || normBatch.includes(normTime);
      }
      if (prog === "fullday") {
        return true; // Fullday can access any session now
      }
      if (prog === "asrama") {
        return session.timeSlot.trim().toLowerCase() !== "16:30 - 18:00"; // Mandatory break in Sesi 5
      }
      return false; // Not one of the above, can't see Conversation
    }

    // -- EFK / EFT
    if (sType === "efk" || sType === "eft") {
      if (prog !== sType) return false;

      const batchSchedule = (student.batchSchedule || "").trim().toLowerCase();
      if (sessionDay === 1 || sessionDay === 3) {
        return batchSchedule === "senin-rabu";
      }
      if (sessionDay === 2 || sessionDay === 4) {
        return batchSchedule === "selasa-kamis";
      }
      if (sessionDay === 5 || sessionDay === 6) {
        return batchSchedule === "jumat-sabtu";
      }
      return false;
    }

    // -- ENGLISH ON SATURDAY
    if (sType === "english on saturday") {
      return prog === "english on saturday";
    }

    // -- PRIVATE / TOEFL / HYBRID POOL ---
    const isAssignedPool = sType === "private" || sType === "toefl" || sType === "toefl prep";
    if (isAssignedPool) {
      if (!session.assignedStudents) return false;
      const isAssigned = session.assignedStudents.some((as) => as.id === studentId);
      return isAssigned && prog === sType;
    }

    // -- OTHER STRICT PROGRAMS
    return prog === sType;
  });

  return validSessions;
}
