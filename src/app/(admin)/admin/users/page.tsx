import { prisma } from "../../../../lib/prisma";
import { UsersClientView } from "./UsersClientView";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  // Fetch all users with all student-specific fields
  const rawUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const users = rawUsers.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    activeProgram: user.activeProgram || "-",
    programBatch: user.programBatch || null,
    startDate: user.startDate ? user.startDate.toISOString() : null,
    endDate: user.endDate ? user.endDate.toISOString() : null,
    durationOption: user.durationOption || null,
    batchSchedule: user.batchSchedule || null,
  }));

  return <UsersClientView initialUsers={users} />;
}
