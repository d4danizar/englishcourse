import { prisma } from "../../../../lib/prisma";
import { UsersClientView } from "./UsersClientView";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { getBranchFilter } from "@/lib/actions/branch-actions";
import { CollapsibleBulkImport } from "./CollapsibleBulkImport";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  const branchFilter = await getBranchFilter();

  // Fetch all users (all roles) for this branch
  const rawUsers = await prisma.user.findMany({
    where: { ...branchFilter },
    include: {
      enrollments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      }
    },
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
    activeProgram: user.enrollments?.[0]?.programType || "-",
    programBatch: user.enrollments?.[0]?.programBatch || null,
    startDate: user.enrollments?.[0]?.startDate ? user.enrollments[0].startDate.toISOString() : null,
    endDate: user.enrollments?.[0]?.endDate ? user.enrollments[0].endDate.toISOString() : null,
    durationOption: user.enrollments?.[0]?.durationOption || null,
    batchSchedule: user.enrollments?.[0]?.batchSchedule || null,
    totalLeaves: user.enrollments?.[0]?.totalLeaves || 0,
  }));

  return (
    <div className="h-full flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* Header section with Light Mode styling */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-zinc-900 font-sans tracking-tight">Manajemen Pengguna</h1>
        <p className="text-zinc-500 text-sm">
          Kelola seluruh data pengguna di cabang ini. Impor massal siswa baru via file Excel.
        </p>
      </div>

      {/* Bulk Import Section - Now Collapsible */}
      <CollapsibleBulkImport />

      {/* Data Table Wrapper */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden mt-2 p-4">
         <h2 className="text-lg font-bold text-zinc-900 mb-4 px-2">Data Pengguna</h2>
         <UsersClientView initialUsers={users} activeBranch={branchFilter.branch} />
      </div>
    </div>
  );
}
