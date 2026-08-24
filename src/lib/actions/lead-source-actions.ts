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

export async function getLeadsForTracking(skip: number = 0, take: number = 100) {
  try {
    const [totalCount, leads] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.findMany({
        select: {
          id: true,
          name: true,
          whatsapp: true,
          createdAt: true,
          discoverySource: true,
          notes: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      })
    ]);
    return { leads, totalCount };
  } catch (error) {
    console.error("Error fetching leads for tracking:", error);
    return { leads: [], totalCount: 0 };
  }
}
