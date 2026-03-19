"use server";

import { prisma } from "../../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitAttendance(formData: FormData) {
  try {
    const sessionId = formData.get("sessionId") as string;
    const studentIds = formData.getAll("studentId") as string[];
    const statuses = formData.getAll("status") as string[];
    const pronunciations = formData.getAll("pronunciation") as string[];
    const fluencies = formData.getAll("fluency") as string[];
    const vocabularies = formData.getAll("vocabulary") as string[];
    const tutorNotes = formData.get("tutorNotes") as string;
    const rescheduleNotes = formData.get("rescheduleNotes") as string;

    if (!sessionId || studentIds.length === 0) {
      return { error: "Session ID and at least one student are required." };
    }

    // Use a transaction to atomically create attendance records AND mark session complete
    await prisma.$transaction(async (tx) => {
      // 1. Upsert attendance for each student
      for (let i = 0; i < studentIds.length; i++) {
        const studentId = studentIds[i];
        const status = (statuses[i] || "PRESENT") as "PRESENT" | "ABSENT" | "EXCUSED" | "SICK";
        const pronunciation = parseInt(pronunciations[i]) || null;
        const fluency = parseInt(fluencies[i]) || null;
        const vocabulary = parseInt(vocabularies[i]) || null;

        // Check if attendance already exists for this session+student
        const existing = await tx.attendance.findFirst({
          where: { sessionId, studentId },
        });

        if (existing) {
          await tx.attendance.update({
            where: { id: existing.id },
            data: {
              status,
              pronunciation,
              fluency,
              vocabulary,
              tutorNotes: tutorNotes || null,
              rescheduleNotes: rescheduleNotes || null,
            },
          });
        } else {
          await tx.attendance.create({
            data: {
              sessionId,
              studentId,
              status,
              pronunciation,
              fluency,
              vocabulary,
              tutorNotes: tutorNotes || null,
              rescheduleNotes: rescheduleNotes || null,
            },
          });
        }
      }

      // 2. Mark the session as completed (triggers payroll calculation)
      await tx.session.update({
        where: { id: sessionId },
        data: { isCompleted: true },
      });
    });

    revalidatePath("/tutor");
    revalidatePath("/tutor/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("submitAttendance error:", error);
    return { error: error.message || "Failed to submit attendance." };
  }
}
