import { prisma } from "../../../../lib/prisma";
import { UsersClientView } from "./UsersClientView";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { getBranchFilter } from "@/lib/actions/branch-actions";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  const branchFilter = await getBranchFilter();

  // 1. Define "today" starting at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2. THE AUTO-SWEEPER: Permanently update the DB for any expired enrollments
  await prisma.enrollment.updateMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: today }
    },
    data: {
      status: "EXPIRED"
    }
  });

  // 3. Now fetch the users as usual
  const rawUsers = await prisma.user.findMany({
    where: { ...branchFilter },
    orderBy: { createdAt: "desc" },
    include: {
      enrollments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      }
    }
  });

  const offDays = await prisma.offDay.findMany({
    orderBy: { startDate: "asc" },
  });

  const serializedOffDays = offDays.map(od => ({
    startDate: od.startDate.toISOString(),
    endDate: od.endDate.toISOString(),
  }));

  const users = rawUsers.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    branch: user.branch,
    secondaryBranch: user.secondaryBranch || null,
    createdAt: user.createdAt.toISOString(),
    activeProgram: user.enrollments?.[0]?.programType || "-",
    programBatch: user.enrollments?.[0]?.programBatch || null,
    startDate: user.enrollments?.[0]?.startDate ? user.enrollments[0].startDate.toISOString() : null,
    endDate: user.enrollments?.[0]?.endDate ? user.enrollments[0].endDate.toISOString() : null,
    durationOption: user.enrollments?.[0]?.durationOption || null,
    batchSchedule: user.enrollments?.[0]?.batchSchedule || null,
    totalLeaves: user.enrollments?.[0]?.leaveUsed ?? 0,
    referralCode: user.referralCode || null,
  }));

  return <UsersClientView initialUsers={users} activeBranch={branchFilter.branch} offDays={serializedOffDays} />;
}
