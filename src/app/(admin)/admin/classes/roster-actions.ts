"use server";

import { prisma } from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";
import { getBranchFilter } from "@/lib/actions/branch-actions";

type SessionPayload = {
  title: string;
  date: Date;
  timeSlot: string;
  programType: string;
  tutorId: string;
};

export async function bulkCreateSessions(payload: SessionPayload[]) {
  try {
    if (!payload || payload.length === 0) {
      return { error: "No sessions to create. Please assign at least one tutor." };
    }

    // Validate all entries have required fields
    for (const entry of payload) {
      if (!entry.title || !entry.date || !entry.timeSlot || !entry.programType || !entry.tutorId) {
        return { error: `Missing required fields in session: ${entry.timeSlot} on ${entry.date}` };
      }
    }

    const branchFilter = await getBranchFilter();

    await prisma.session.createMany({
      data: payload.map((s) => ({
        title: s.title,
        date: new Date(s.date),
        timeSlot: s.timeSlot,
        programType: s.programType,
        tutorId: s.tutorId,
        branch: branchFilter.branch,
      })),
    });

    revalidatePath("/admin/classes");
    return { success: true, count: payload.length };
  } catch (error: any) {
    console.error("bulkCreateSessions error:", error);
    return { error: error.message || "Failed to create sessions." };
  }
}
