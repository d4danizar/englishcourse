"use server";

import { prisma } from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";
import { getBranchFilter } from "@/lib/actions/branch-actions";

export async function createSession(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const date = formData.get("date") as string;
    const timeSlot = formData.get("timeSlot") as string;
    const programType = formData.get("programType") as string;
    const tutorId = formData.get("tutorId") as string;
    const topicOffsetStr = formData.get("topicOffset") as string;
    
    // UI input represents the "Topic Number" (e.g., 1). Offset is input - 1.
    const topicOffsetInput = parseInt(topicOffsetStr);
    const topicOffset = isNaN(topicOffsetInput) ? 0 : Math.max(0, topicOffsetInput - 1);

    if (!title || !date || !timeSlot || !programType || !tutorId) {
      return { error: "All fields are required: Title, Date, Time Slot, Program Type, and Tutor." };
    }

    const branchFilter = await getBranchFilter();

    await prisma.session.create({
      data: {
        title,
        date: new Date(date),
        timeSlot,
        programType,
        tutorId,
        topicOffset,
        branch: branchFilter.branch,
      },
    });

    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create session." };
  }
}

export async function deleteSession(sessionId: string) {
  try {
    // Attendance records will cascade delete due to onDelete: Cascade in schema
    await prisma.session.delete({
      where: { id: sessionId },
    });

    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete session." };
  }
}

export async function updateSession(formData: FormData) {
  try {
    const sessionId = formData.get("sessionId") as string;
    const title = formData.get("title") as string;
    const date = formData.get("date") as string;
    const timeSlot = formData.get("timeSlot") as string;
    const programType = formData.get("programType") as string;
    const tutorId = formData.get("tutorId") as string;
    const topicOffsetStr = formData.get("topicOffset") as string;

    if (!sessionId) return { error: "Session ID is required." };

    const data: Record<string, unknown> = {};
    if (title) data.title = title;
    if (date) data.date = new Date(date);
    if (timeSlot) data.timeSlot = timeSlot;
    if (programType) data.programType = programType;
    if (tutorId) data.tutorId = tutorId;
    
    if (topicOffsetStr) {
      const parsedOffset = parseInt(topicOffsetStr);
      if (!isNaN(parsedOffset)) {
        data.topicOffset = Math.max(0, parsedOffset - 1);
      }
    }

    await prisma.session.update({
      where: { id: sessionId },
      data,
    });

    revalidatePath("/admin/classes");
    revalidatePath("/tutor/dashboard");
    revalidatePath("/tutor/schedules");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update session." };
  }
}
