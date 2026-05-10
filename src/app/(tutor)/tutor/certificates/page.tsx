import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CertificatesClient from "./CertificatesClient";

const ALLOWED_ROLES = ["HEAD_TUTOR", "SUPER_ADMIN", "MANAGER", "CS"];

export default async function CertificateVerificationPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // 🔒 STRICT GATEKEEPER
  const userRole = session.user.role as string;
  if (!ALLOWED_ROLES.includes(userRole)) {
    redirect("/tutor/dashboard");
  }

  // Fetch enrollments that have submitted a video but aren't approved yet
  const pendingCertificates = await prisma.enrollment.findMany({
    where: {
      finalVideoLink: { not: null },
      isCertificateApproved: false,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          StudentEvaluations: {
            select: {
              finalScore: true
            }
          }
        }
      },
    },
    orderBy: { updatedAt: "asc" }
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">🎓 Verifikasi Sertifikat</h1>
        <p className="text-slate-500 mt-1">Review tugas akhir siswa dan setujui penerbitan sertifikat.</p>
      </div>
      
      <CertificatesClient pendingCertificates={pendingCertificates as any} />
    </div>
  );
}
