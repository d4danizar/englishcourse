"use server";

import { prisma } from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function takeOverSession(sessionId: string, currentTutorId: string) {
  try {
    if (!sessionId || !currentTutorId) {
      return { error: "Session ID and Tutor ID are required." };
    }

    // Double check that the session isn't already completed
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { isCompleted: true, tutorId: true, _count: { select: { attendances: true } } },
    });

    if (!session) {
      return { error: "Session not found." };
    }

    if (session.isCompleted) {
      return { error: "Cannot take over a completed session." };
    }

    if (session._count.attendances > 0) {
      return { error: "Cannot take over a session that already has attendance records." };
    }

    if (session.tutorId === currentTutorId) {
      return { error: "You are already the assigned tutor for this session." };
    }

    // Update the session's tutor
    await prisma.session.update({
      where: { id: sessionId },
      data: { tutorId: currentTutorId },
    });

    revalidatePath("/tutor/schedules");
    revalidatePath("/tutor/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("takeOverSession error:", error);
    return { error: error.message || "Failed to take over session." };
  }
}
