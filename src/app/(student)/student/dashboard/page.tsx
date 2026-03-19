import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { getStudentProfile, getStudentAttendances, getStudentEvaluations } from "./actions";
import { StudentDashboardClient } from "./StudentDashboardClient";

export default async function StudentDashboardPage() {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser?.user?.id) {
    redirect("/login");
  }

  const studentId = sessionUser.user.id;

  // Concurrent data fetching
  const [profile, attendances, evaluations] = await Promise.all([
    getStudentProfile(studentId),
    getStudentAttendances(studentId),
    getStudentEvaluations(studentId),
  ]);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <h2 className="text-xl font-bold text-slate-800">Profil tidak ditemukan</h2>
        <p className="text-sm text-slate-500 mt-2">Gagal memuat data pelajar.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pt-6 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 text-balance">
            Lihat masa aktif program, riwayat kehadiran, dan evaluasi belajarmu di sini.
          </p>
        </div>

        {/* Client Component */}
        <StudentDashboardClient 
          profile={profile}
          attendances={attendances}
          evaluations={evaluations}
        />

      </div>
    </div>
  );
}
