"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const ALLOWED_ROLES = ["HEAD_TUTOR", "SUPER_ADMIN", "MANAGER", "CS"];

export async function approveCertificate(
  enrollmentId: string,
  scores: {
    fluencyScore: number;
    pronunciationScore: number;
    vocabularyScore: number;
    finalScore: number;
  }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userRole = session.user.role as string;
  if (!ALLOWED_ROLES.includes(userRole)) {
    return { error: "Unauthorized. You do not have permission to approve certificates." };
  }

  const { fluencyScore, pronunciationScore, vocabularyScore, finalScore } = scores;
  if (
    fluencyScore < 1 || fluencyScore > 5 ||
    pronunciationScore < 1 || pronunciationScore > 5 ||
    vocabularyScore < 1 || vocabularyScore > 5 ||
    finalScore < 1 || finalScore > 5
  ) {
    return { error: "Nilai harus berada dalam skala 1 sampai 5." };
  }

  try {
    // 1. Fetch enrollment to get Branch Location from user
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { user: { select: { branch: true } } }
    });

    if (!enrollment) {
      return { error: "Enrollment not found" };
    }

    // 2. Generate a clean Certificate Number
    const branchName = (enrollment.user?.branch || "KARTASURA").toUpperCase().substring(0, 3);
    const dateStr = new Date().toISOString().slice(2, 7).replace('-', ''); // e.g., 2610
    const count = (await prisma.certificate.count()) + 1;
    const certNumber = `KIS/${branchName}/${dateStr}/${count.toString().padStart(4, '0')}`;

    // 3. Prisma Transaction
    await prisma.$transaction([
      prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          isCertificateApproved: true,
          certificateScore: finalScore, // Keep this here if needed for backward compatibility
        }
      }),
      prisma.certificate.create({
        data: {
          enrollmentId,
          certificateNumber: certNumber,
          finalScore: finalScore,
          fluencyScore: fluencyScore,
          pronunciationScore: pronunciationScore,
          vocabularyScore: vocabularyScore,
        }
      })
    ]);

    revalidatePath('/tutor/certificates');
    return { success: true };
  } catch (error: any) {
    console.error("[approveCertificate] Error:", error);
    return { error: "Failed to approve certificate." };
  }
}
