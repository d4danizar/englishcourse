"use server";

import { prisma } from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";

export type EvaluationGroup = "Conversation" | "EFK" | "EFT" | "Private";

export async function getStudentsForEvaluation(group: EvaluationGroup, tutorId: string) {
  const programInFilter = group === "Conversation" 
    ? ["Regular", "Fullday", "Asrama", "English on Saturday"]
    : [group];

  // Get tutor's branch for strict isolation
  const tutor = await prisma.user.findUnique({
    where: { id: tutorId },
    select: { branch: true }
  });
  const tutorBranch = tutor?.branch;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(tutorBranch ? { branch: tutorBranch } : {}),
      enrollments: {
        some: {
          OR: [
            { endDate: { gte: thirtyDaysAgo } },
            { endDate: null }
          ],
          ...(group === "EFK" || group === "EFT" || group === "Private"
            ? { programType: { contains: group, mode: "insensitive" } }
            : { programType: { in: programInFilter } })
        }
      }
    },
    select: {
      id: true,
      name: true,
      enrollments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          programType: true,
          programBatch: true,
          batchSchedule: true,
          endDate: true,
        }
      },
      StudentEvaluations: {
        where: { tutorId },
        orderBy: { createdAt: "desc" },
        take: 1,
      }
    },
    orderBy: { name: "asc" },
  });

  return students.map(student => ({
    ...student,
    activeProgram: student.enrollments?.[0]?.programType || "No Program",
    programBatch: student.enrollments?.[0]?.programBatch || null,
    batchSchedule: student.enrollments?.[0]?.batchSchedule || null,
  }));
}

export async function submitDescriptiveEvaluation(formData: FormData) {
  try {
    const tutorId = formData.get("tutorId") as string;
    const studentId = formData.get("studentId") as string;

    const parseScore = (key: string) => {
      const val = formData.get(key) as string;
      return val ? parseFloat(val) : null;
    };

    const data = {
      tutorId,
      studentId,
      listeningScore: parseScore("listeningScore"),
      speakingScore: parseScore("speakingScore"),
      readingScore: parseScore("readingScore"),
      pronunciationScore: parseScore("pronunciationScore"),
      vocabularyScore: parseScore("vocabularyScore"),
      
      listeningNote: (formData.get("listeningNote") as string) || null,
      speakingNote: (formData.get("speakingNote") as string) || null,
      readingNote: (formData.get("readingNote") as string) || null,
      pronunciationNote: (formData.get("pronunciationNote") as string) || null,
      vocabularyNote: (formData.get("vocabularyNote") as string) || null,

      strengths: (formData.get("strengths") as string) || null,
      improvements: (formData.get("improvements") as string) || null,
      nextTarget: (formData.get("nextTarget") as string) || null,
      tutorNote: (formData.get("tutorNote") as string) || null,
    };

    if (!tutorId || !studentId) {
      return { error: "Data tutor atau siswa tidak lengkap." };
    }

    await prisma.descriptiveEvaluation.create({
      data: data
    });

    revalidatePath("/tutor/evaluations");
    return { success: true };
  } catch (error: any) {
    console.error("submitDescriptiveEvaluation error:", error);
    return { error: error.message || "Gagal menyimpan evaluasi." };
  }
}
