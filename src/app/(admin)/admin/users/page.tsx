import { prisma } from "../../../../lib/prisma";
import { UsersClientView } from "./UsersClientView";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { getBranchFilter } from "@/lib/actions/branch-actions";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  const branchFilter = await getBranchFilter();

  // Fetch all users with all student-specific fields
  const rawUsers = await prisma.user.findMany({
    where: { ...branchFilter },
    orderBy: { createdAt: "desc" },
  });

  const users = rawUsers.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    branch: user.branch,
    createdAt: user.createdAt.toISOString(),
    activeProgram: user.activeProgram || "-",
    programBatch: user.programBatch || null,
    startDate: user.startDate ? user.startDate.toISOString() : null,
    endDate: user.endDate ? user.endDate.toISOString() : null,
    durationOption: user.durationOption || null,
    batchSchedule: user.batchSchedule || null,
  }));

  return <UsersClientView initialUsers={users} activeBranch={branchFilter.branch} />;
}
