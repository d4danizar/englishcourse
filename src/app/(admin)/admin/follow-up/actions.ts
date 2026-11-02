"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getLeadsByMonth(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return await prisma.lead.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      followUps: {
        orderBy: { stage: "asc" },
      },
    },
    orderBy: {
      nextReminderDate: "asc", // Prioritize leads that need to be contacted soon
    },
  });
}

// Function to submit a new follow-up and set the next reminder
export async function submitFollowUp(
  leadId: string,
  stage: number,
  note: string,
  handledBy: string,
  nextReminderDate?: Date,
  isClosedWon: boolean = false
) {
  const status = isClosedWon ? "CLOSED_WON" : stage >= 4 ? "CRM_FOLLOW_UP" : "CS_FOLLOW_UP";

  await prisma.$transaction([
    prisma.followUp.create({
      data: { leadId, stage, note, handledBy },
    }),
    prisma.lead.update({
      where: { id: leadId },
      data: {
        currentStage: stage,
        status: status,
        nextReminderDate: isClosedWon ? null : nextReminderDate, // Clear reminder if closed
      },
    }),
  ]);

  revalidatePath("/admin/follow-up");
  return { success: true };
}
