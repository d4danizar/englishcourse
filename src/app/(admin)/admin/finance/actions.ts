"use server";

import { prisma } from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function createManualIncome(data: {
  amount: number;
  category: string;
  description: string;
  branch: string;
  date: Date;
}) {
  try {
    await prisma.cashflow.create({
      data: {
        type: "INCOME",
        // @ts-ignore - Let prisma handle category enum dynamically if it's generic string from UI
        category: data.category,
        amount: data.amount,
        description: data.description,
        branch: data.branch as any,
        createdAt: new Date(data.date), // Allow backdating if necessary
      }
    });

    revalidatePath("/admin/finance");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating manual income:", error);
    return { error: error.message || "Gagal mencatat pemasukan." };
  }
}
