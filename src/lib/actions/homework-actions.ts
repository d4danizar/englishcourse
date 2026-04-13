"use server";

import { prisma } from "../prisma";
import { getBranchFilter } from "./branch-actions";
import { BranchLocation } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Get homework for a specific date and branch.
 * Used by student dashboard to show today's homework.
 */
export async function getHomeworkForDate(
  date: Date,
  branch: BranchLocation
): Promise<{ id: string; content: string; date: Date } | null> {
  // Normalize date to midnight for consistent matching
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const homework = await prisma.dailyHomework.findUnique({
    where: {
      date_branch: {
        date: normalizedDate,
        branch,
      },
    },
    select: {
      id: true,
      content: true,
      date: true,
    },
  });

  return homework;
}

/**
 * Get homework for today at the student's branch.
 * Convenience wrapper using session-based branch detection.
 */
export async function getTodayHomeworkForStudent(studentBranch: BranchLocation) {
  const today = new Date();
  return getHomeworkForDate(today, studentBranch);
}

/**
 * Save (upsert) homework for a specific date and branch.
 * If content is empty, deletes the existing record.
 * Used by Admin/Manager.
 */
export async function saveHomework(
  dateStr: string,
  content: string
) {
  try {
    const branchFilter = await getBranchFilter();
    const branch = branchFilter.branch;

    const normalizedDate = new Date(dateStr);
    normalizedDate.setHours(0, 0, 0, 0);

    // If content is empty/whitespace, delete existing homework
    if (!content || content.trim().length === 0) {
      await prisma.dailyHomework.deleteMany({
        where: {
          date: normalizedDate,
          branch,
        },
      });
      revalidatePath("/admin/homework");
      return { success: true, deleted: true };
    }

    // Upsert: create or update
    await prisma.dailyHomework.upsert({
      where: {
        date_branch: {
          date: normalizedDate,
          branch,
        },
      },
      create: {
        date: normalizedDate,
        branch,
        content: content.trim(),
      },
      update: {
        content: content.trim(),
      },
    });

    revalidatePath("/admin/homework");
    return { success: true };
  } catch (error: any) {
    console.error("[saveHomework] Error:", error);
    return { success: false, error: "Gagal menyimpan homework." };
  }
}

/**
 * Get homework list for admin view (recent 14 days of the active branch).
 */
export async function getRecentHomeworks() {
  const branchFilter = await getBranchFilter();
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  twoWeeksAgo.setHours(0, 0, 0, 0);

  const homeworks = await prisma.dailyHomework.findMany({
    where: {
      branch: branchFilter.branch,
      date: { gte: twoWeeksAgo },
    },
    orderBy: { date: "desc" },
  });

  return homeworks;
}
