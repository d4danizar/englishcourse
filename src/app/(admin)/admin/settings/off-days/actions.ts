"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createOffDay(formData: FormData) {
  const description = formData.get("description") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;

  if (!description || !startDateStr || !endDateStr) return;

  try {
    const parsedStart = new Date(startDateStr);
    parsedStart.setHours(0, 0, 0, 0);
    
    const parsedEnd = new Date(endDateStr);
    parsedEnd.setHours(0, 0, 0, 0);

    await prisma.offDay.create({
      data: {
        startDate: parsedStart,
        endDate: parsedEnd,
        description,
      },
    });

    revalidatePath("/admin/settings/off-days");
  } catch (error: any) {
    console.error("Failed to create Off Day", error);
  }
}

export async function deleteOffDay(id: string) {
  try {
    await prisma.offDay.delete({
      where: { id },
    });
    revalidatePath("/admin/settings/off-days");
  } catch (error: any) {
    console.error("Failed to delete Off Day", error);
  }
}
