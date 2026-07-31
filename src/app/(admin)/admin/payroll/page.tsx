import { prisma } from "../../../../lib/prisma";
import { PayrollClientView } from "./PayrollClientView";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { getBranchFilter } from "@/lib/actions/branch-actions";
import { startOfMonth, endOfMonth } from "date-fns";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AdminPayrollPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await getServerSession(authOptions);

  // ── 1. Parse month & year from URL — fallback to current month/year ─────────
  const resolvedParams = await searchParams;
  const now = new Date();

  const rawMonth = resolvedParams?.month;
  const rawYear  = resolvedParams?.year;

  const selectedMonth = rawMonth
    ? Math.min(12, Math.max(1, parseInt(String(rawMonth), 10)))
    : now.getMonth() + 1;

  const selectedYear = rawYear
    ? parseInt(String(rawYear), 10)
    : now.getFullYear();

  const referenceDate = new Date(selectedYear, selectedMonth - 1, 1);
  const periodStart   = startOfMonth(referenceDate);
  const periodEnd     = endOfMonth(referenceDate);

  // ── 2. Branch filter ────────────────────────────────────────────────────────
  const branchFilter = await getBranchFilter();

  // ── 3. Query: all staff + their completed sessions in the selected period ────
  const rawStaff = await prisma.user.findMany({
    where: {
      role: { in: ["TUTOR", "CS", "MARKETING", "MANAGER", "SUPER_ADMIN"] },
      OR: [
        { ...branchFilter },
        { secondaryBranch: branchFilter.branch },
      ],
    },
    include: {
      sessionsTaught: {
        where: {
          isCompleted: true,
          date: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
        // Select only the fields we need — avoids over-fetching
        select: {
          id: true,
          date: true,
          timeSlot: true,
          title: true,
          programType: true,
        },
        orderBy: { date: "asc" },
      },
    },
  });

  // ── 4. Calculate FLAT RATE payroll and REFERRAL Bonus ──────────────────────
  const PAY_PER_SESSION  = 30000;
  const PAY_PER_REFERRAL = 50000;

  const payrollDataUnsorted = await Promise.all(
    rawStaff.map(async (staff) => {
      // Teaching Pay Calculation
      const totalSessions = staff.sessionsTaught.length;
      const teachingPay   = totalSessions * PAY_PER_SESSION;

      // Referral Bonus Calculation
      let referralCount = 0;
      if (staff.referralCode) {
        referralCount = await prisma.enrollment.count({
          where: {
            referralCodeUsed: staff.referralCode,
            programType: { contains: "Membership", mode: "insensitive" },
            createdAt: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
        });
      }
      const referralBonus = referralCount * PAY_PER_REFERRAL;

      const grandTotal = teachingPay + referralBonus;
      const status     = grandTotal === 0 ? "No Pay" : "Pending";

      // Serialize Date → ISO string so the Client Component receives plain objects
      const sessionDetails = staff.sessionsTaught.map((s) => ({
        id:          s.id,
        date:        s.date ? s.date.toISOString() : null,
        timeSlot:    s.timeSlot ?? "",
        title:       s.title,
        programType: s.programType,
      }));

      return {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        totalSessions,
        teachingPay,
        referralCount,
        referralBonus,
        grandTotal,
        status,
        sessionDetails, // ← new: array of completed sessions for this staff member
      };
    })
  );

  // ── 5. Filter & sort ────────────────────────────────────────────────────────
  const payrollDataFiltered = payrollDataUnsorted
    .filter((item) => item.grandTotal > 0 || item.role === "TUTOR")
    .sort((a, b) => b.grandTotal - a.grandTotal);

  return (
    <PayrollClientView
      payrollData={payrollDataFiltered}
      selectedMonth={selectedMonth}
      selectedYear={selectedYear}
    />
  );
}
