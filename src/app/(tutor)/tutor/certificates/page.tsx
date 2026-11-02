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
  const rawPending = await prisma.enrollment.findMany({
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
              listeningScore: true,
              speakingScore: true,
              readingScore: true,
              pronunciationScore: true,
              vocabularyScore: true,
            },
          },
          attendances: {
            where: { status: "PRESENT" },
            select: {
              fluency: true,
              pronunciation: true,
              vocabulary: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "asc" },
  });

  const pendingCertificates = rawPending.map((cert) => {
    const evals = cert.user.StudentEvaluations || [];
    const atts = cert.user.attendances || [];

    const roundHalf = (val: number) => Math.round(val * 2) / 2;

    // 1. Check DescriptiveEvaluations (raw 1-5 scale across 5 skills)
    let evalAvg: number | null = null;
    if (evals.length > 0) {
      let totalPoints = 0;
      let countParams = 0;
      evals.forEach((e) => {
        const scores = [
          e.listeningScore,
          e.speakingScore,
          e.readingScore,
          e.pronunciationScore,
          e.vocabularyScore,
        ].filter((s): s is number => typeof s === "number" && s > 0);
        totalPoints += scores.reduce((a, b) => a + b, 0);
        countParams += scores.length;
      });
      if (countParams > 0) {
        evalAvg = roundHalf(totalPoints / countParams);
      }
    }

    // 2. Check Weekly/Session Attendance evaluations (raw 1-5 scale: fluency, pronunciation, vocabulary)
    let attAvg: number | null = null;
    let avgFluency: number | null = null;
    let avgPronunciation: number | null = null;
    let avgVocabulary: number | null = null;

    const scoredAtts = atts.filter(
      (a) =>
        (a.fluency && a.fluency > 0) ||
        (a.pronunciation && a.pronunciation > 0) ||
        (a.vocabulary && a.vocabulary > 0)
    );

    if (scoredAtts.length > 0) {
      const fSum = scoredAtts.reduce((sum, a) => sum + (a.fluency || 0), 0);
      const pSum = scoredAtts.reduce((sum, a) => sum + (a.pronunciation || 0), 0);
      const vSum = scoredAtts.reduce((sum, a) => sum + (a.vocabulary || 0), 0);

      avgFluency = roundHalf(fSum / scoredAtts.length);
      avgPronunciation = roundHalf(pSum / scoredAtts.length);
      avgVocabulary = roundHalf(vSum / scoredAtts.length);
      attAvg = roundHalf((avgFluency + avgPronunciation + avgVocabulary) / 3);
    }

    const examAverage = evalAvg ?? attAvg;

    return {
      id: cert.id,
      programType: cert.programType,
      finalVideoLink: cert.finalVideoLink,
      examAverage,
      suggestedScores: {
        fluency: avgFluency,
        pronunciation: avgPronunciation,
        vocabulary: avgVocabulary,
      },
      user: {
        name: cert.user.name,
        email: cert.user.email,
      },
    };
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
