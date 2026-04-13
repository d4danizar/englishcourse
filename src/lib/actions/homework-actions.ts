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

export async function getDashboardHomeworks(studentBranch: BranchLocation) {
  const now = new Date();
  
  // Convert server 'now' to GMT+7 to establish the true local "today"
  const indonesianTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  
  // Format Today
  const tzYear = indonesianTime.getFullYear();
  const tzMonth = String(indonesianTime.getMonth() + 1).padStart(2, "0");
  const tzDay = String(indonesianTime.getDate()).padStart(2, "0");
  const todayStr = `${tzYear}-${tzMonth}-${tzDay}`;
  
  // Format Tomorrow
  indonesianTime.setDate(indonesianTime.getDate() + 1);
  const tmrwYear = indonesianTime.getFullYear();
  const tmrwMonth = String(indonesianTime.getMonth() + 1).padStart(2, "0");
  const tmrwDay = String(indonesianTime.getDate()).padStart(2, "0");
  const tomorrowStr = `${tmrwYear}-${tmrwMonth}-${tmrwDay}`;

  // Parse strings to Midnight UTC exactly as saveHomework logic
  const normalizedToday = new Date(todayStr);
  normalizedToday.setHours(0, 0, 0, 0);

  const normalizedTomorrow = new Date(tomorrowStr);
  normalizedTomorrow.setHours(0, 0, 0, 0);

  const homeworks = await prisma.dailyHomework.findMany({
    where: {
      branch: studentBranch,
      date: {
        in: [normalizedToday, normalizedTomorrow],
      },
    },
    select: {
      id: true,
      content: true,
      date: true,
    },
    orderBy: {
      date: 'asc'
    }
  });

  return {
    today: homeworks.find(hw => hw.date.getTime() === normalizedToday.getTime())?.content || null,
    tomorrow: homeworks.find(hw => hw.date.getTime() === normalizedTomorrow.getTime())?.content || null,
  };
}

/**
 * Save (upsert) homework for a specific date and branch.
 * If content is empty, deletes the existing record.
 * Used by Admin/Manager.
 */
export async function saveHomework(
  dateStr: string,
  content: string,
  id?: string
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

    // Upsert or Update logic based on whether ID is explicitly provided
    if (id) {
      await prisma.dailyHomework.update({
        where: { id },
        data: {
          content: content.trim(),
        },
      });
    } else {
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
    }

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
