import { prisma } from "../../../../lib/prisma";
import { UsersClientView } from "./UsersClientView";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { getBranchFilter } from "@/lib/actions/branch-actions";
import { CollapsibleBulkImport } from "./CollapsibleBulkImport";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  const branchFilter = await getBranchFilter();

  // Fetch all users with all student-specific fields
  const rawUsers = await prisma.user.findMany({
    where: { ...branchFilter, role: "STUDENT" }, // Filter strictly to STUDENT as requested in the prompt
    orderBy: { createdAt: "desc" },
  });

  const students = rawUsers.map(user => ({
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

  return (
    <div className="h-full flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* Header section with Light Mode styling */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-zinc-900 font-sans tracking-tight">Manajemen Siswa</h1>
        <p className="text-zinc-500 text-sm">
          Kelola data pendaftaran siswa. Impor massal siswa baru untuk sinkronisasi cabang secara otomatis.
        </p>
      </div>

      {/* Bulk Import Section - Now Collapsible */}
      <CollapsibleBulkImport />

      {/* Data Table Wrapper */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden mt-2 p-4">
         <h2 className="text-lg font-bold text-zinc-900 mb-4 px-2">Data Siswa</h2>
         {/* We reuse the rich featured table. The table inside UsersClientView is already well structured! */}
         <UsersClientView initialUsers={students} activeBranch={branchFilter.branch} />
      </div>
    </div>
  );
}
