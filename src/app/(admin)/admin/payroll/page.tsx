import { prisma } from "../../../../lib/prisma";
import { PayrollClientView } from "./PayrollClientView";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { getBranchFilter } from "@/lib/actions/branch-actions";

export default async function AdminPayrollPage() {
  await getServerSession(authOptions); // Ensure access

  // --- PRISMA QUERY LOGIC FOR FLAT RATE PAYROLL & REFERRALS ---
  // 1. Get start and end of current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const branchFilter = await getBranchFilter();

  // 2. Query: Get all staff eligible for teaching or referral bonuses
  const rawStaff = await prisma.user.findMany({
    where: { 
      role: { in: ["TUTOR", "CS", "MARKETING", "MANAGER", "SUPER_ADMIN"] }, 
      OR: [
        { ...branchFilter },
        { secondaryBranch: branchFilter.branch }
      ]
    },
    include: {
      sessionsTaught: {
        where: {
          isCompleted: true,
          date: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }
    }
  });

  // 3. Calculate FLAT RATE payroll and REFERRAL Bonus
  const PAY_PER_SESSION = 30000;
  const PAY_PER_REFERRAL = 50000;

  const payrollDataUnsorted = await Promise.all(rawStaff.map(async (staff) => {
    // Teaching Pay Calculation
    const totalSessions = staff.sessionsTaught.length;
    const teachingPay = totalSessions * PAY_PER_SESSION;
    
    // Referral Bonus Calculation
    let referralCount = 0;
    if (staff.referralCode) {
      referralCount = await prisma.enrollment.count({
        where: {
          referralCodeUsed: staff.referralCode,
          programType: { contains: "Membership", mode: "insensitive" },
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });
    }
    const referralBonus = referralCount * PAY_PER_REFERRAL;
    
    // Grand Total
    const grandTotal = teachingPay + referralBonus;

    // Status logic (If grandTotal > 0, it's Pending. Otherwise No Pay)
    const status = grandTotal === 0 ? "No Pay" : "Pending";

    return {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      totalSessions,
      teachingPay,
      referralCount,
      referralBonus,
      grandTotal,
      status
    };
  }));

  // Filter out people who have 0 sessions AND 0 referrals so they don't clutter the UI
  // Unless you want everyone to show up. It's usually better to only show people who earn something
  // Or show everyone. Let's show everyone who has at least some activity or is a TUTOR
  const payrollDataFiltered = payrollDataUnsorted.filter(
    (item) => item.grandTotal > 0 || item.role === "TUTOR"
  );

  // Sort descending by highest grand total
  payrollDataFiltered.sort((a, b) => b.grandTotal - a.grandTotal);

  return <PayrollClientView payrollData={payrollDataFiltered} />;
}
