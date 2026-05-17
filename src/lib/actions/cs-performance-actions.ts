"use server";

import { prisma } from "@/lib/prisma";
import { BonusTier } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getBonusTiers(): Promise<BonusTier[]> {
  const tiers = await prisma.bonusTier.findMany({
    orderBy: { minOmzet: 'desc' }
  });

  if (tiers.length > 0) return tiers;

  // Auto-seed default tiers if empty
  const defaultTiers = [
    { minOmzet: 0, maxOmzet: 49999999, percentage: 0 },
    { minOmzet: 50000000, maxOmzet: 99999999, percentage: 1 },
    { minOmzet: 100000000, maxOmzet: 150000000, percentage: 2 },
    { minOmzet: 150000001, maxOmzet: null, percentage: 3 },
  ];

  await prisma.bonusTier.createMany({ data: defaultTiers });
  
  return await prisma.bonusTier.findMany({
    orderBy: { minOmzet: 'desc' }
  });
}

export async function updateBonusTiers(newTiers: { minOmzet: number, maxOmzet: number | null, percentage: number }[]) {
  // Sort descending by minOmzet to store them logically
  newTiers.sort((a, b) => b.minOmzet - a.minOmzet);
  
  await prisma.$transaction(async (tx) => {
    await tx.bonusTier.deleteMany();
    await tx.bonusTier.createMany({ data: newTiers });
  });
  
  revalidatePath("/admin/cs-performance");
  return { success: true };
}

function calculateDynamicBonus(omzet: number, tiers: BonusTier[]) {
  // Ensure sorted by minOmzet desc to find the highest applicable tier
  const sorted = [...tiers].sort((a, b) => b.minOmzet - a.minOmzet);
  
  for (const tier of sorted) {
    if (omzet >= tier.minOmzet && (tier.maxOmzet === null || omzet <= tier.maxOmzet)) {
      let tierLabel = "";
      if (tier.maxOmzet) {
        tierLabel = `Rp ${(tier.minOmzet/1000000).toLocaleString("id-ID")}M - Rp ${(tier.maxOmzet/1000000).toLocaleString("id-ID")}M`;
      } else {
        tierLabel = `> Rp ${(tier.minOmzet/1000000).toLocaleString("id-ID")}M`;
      }
      return {
        percent: tier.percentage,
        bonus: (omzet * tier.percentage) / 100,
        tierLabel
      };
    }
  }
  
  return { percent: 0, bonus: 0, tierLabel: "Belum Mencapai Target" };
}

export async function getCSMonthlyPerformance(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const cashflows = await prisma.cashflow.findMany({
    where: {
      type: "INCOME",
      date: {
        gte: startDate,
        lt: endDate,
      }
    },
    include: {
      recordedBy: true,
      invoice: {
        include: {
          lead: {
            include: {
              assignee: true
            }
          }
        }
      }
    }
  });

  console.log("Found Cashflows: ", cashflows.length);

  const csMap: Record<string, { id: string, name: string, branch: string, omzet: number }> = {};

  for (const cf of cashflows) {
    const csName = cf.recordedBy?.name || cf.invoice?.lead?.assignee?.name || "Unknown CS";
    const branch = cf.recordedBy?.branch || cf.invoice?.lead?.assignee?.branch || "Pusat";
    const csId = cf.recordedById || cf.invoice?.lead?.assigneeId || "unknown";

    if (csId === "unknown") continue;
    
    if (!csMap[csId]) {
      csMap[csId] = {
        id: csId,
        name: csName,
        branch: branch,
        omzet: 0,
      };
    }
    
    csMap[csId].omzet += cf.amount;
  }

  const tiers = await getBonusTiers();

  const leaderboard = Object.values(csMap).map(cs => {
    const bonusInfo = calculateDynamicBonus(cs.omzet, tiers);
    return {
      ...cs,
      ...bonusInfo
    };
  });

  leaderboard.sort((a, b) => b.omzet - a.omzet);

  return leaderboard;
}
