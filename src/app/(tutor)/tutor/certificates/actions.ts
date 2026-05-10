"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ALLOWED_ROLES = ["HEAD_TUTOR", "SUPER_ADMIN", "MANAGER", "CS"];

export async function approveCertificate(enrollmentId: string, finalScore: number) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userRole = session.user.role as string;
  if (!ALLOWED_ROLES.includes(userRole)) {
    return { error: "Unauthorized. You do not have permission to approve certificates." };
  }

  try {
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        certificateScore: finalScore,
        isCertificateApproved: true,
      }
    });

    return { success: true, enrollment: updatedEnrollment };
  } catch (error: any) {
    console.error("[approveCertificate] Error:", error);
    return { error: "Failed to approve certificate." };
  }
}
