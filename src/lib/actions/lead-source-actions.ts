"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function getMarketingSources() {
  try {
    const sources = await prisma.marketingSource.findMany({
      orderBy: { createdAt: 'asc' }
    });

    if (sources.length === 0) {
      // Auto-seed defaults
      const defaults = ["Tiktok", "Instagram", "Facebook", "Non-Iklan"];
      await prisma.marketingSource.createMany({
        data: defaults.map(name => ({ name }))
      });
      return await prisma.marketingSource.findMany({
        orderBy: { createdAt: 'asc' }
      });
    }

    return sources;
  } catch (error) {
    console.error("Error fetching marketing sources:", error);
    return [];
  }
}

export async function addMarketingSource(name: string) {
  try {
    const newSource = await prisma.marketingSource.create({
      data: { name: name.trim() }
    });
    revalidatePath("/admin/lead-source");
    return { success: true, source: newSource };
  } catch (error: any) {
    console.error("Error adding marketing source:", error);
    if (error.code === 'P2002') {
      return { error: "Asal iklan dengan nama ini sudah ada." };
    }
    return { error: "Gagal menambahkan asal iklan baru." };
  }
}

export async function updateLeadSource(leadId: string, sourceName: string) {
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { discoverySource: sourceName }
    });
    revalidatePath("/admin/lead-source");
    return { success: true };
  } catch (error) {
    console.error("Error updating lead source:", error);
    return { error: "Gagal memperbarui asal iklan untuk lead ini." };
  }
}

export async function getLeadsForTracking(startDate?: Date, endDate?: Date) {
  try {
    // Default to current month if no dates are provided
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const queryStart = startDate || defaultStart;
    const queryEnd = endDate || defaultEnd;

    const [totalCount, leads] = await Promise.all([
      prisma.lead.count({
        where: { createdAt: { gte: queryStart, lte: queryEnd } },
      }),
      prisma.lead.findMany({
        where: { createdAt: { gte: queryStart, lte: queryEnd } },
        select: {
          id: true,
          name: true,
          whatsapp: true,
          phone: true,
          source: true,
          status: true,
          createdAt: true,
          discoverySource: true,
          notes: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { totalCount, leads };
  } catch (error) {
    console.error("Error fetching leads for tracking:", error);
    return { leads: [], totalCount: 0 };
  }
}
