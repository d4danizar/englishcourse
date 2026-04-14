"use server";

import { prisma } from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";

export type EvaluationGroup = "Conversation" | "EFK" | "EFT" | "Private";

export async function getStudentsForEvaluation(group: EvaluationGroup, tutorId: string) {
  // Common where clause to only fetch active students
  const activeStudentWhere = {
    role: "STUDENT" as const,
    enrollments: {
      some: {
        OR: [
          { endDate: { gte: new Date() } },
          { endDate: null }
        ],
        ...(group === "Conversation" ? {
          programType: {
            in: ["Regular", "Fullday", "Asrama", "English on Saturday"]
          }
        } : {
          programType: group
        })
      }
    }
  };

  // Fetch students matching the group
  const studentsRaw = await prisma.user.findMany({
    where: activeStudentWhere,
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
        }
      },
      StudentEvaluations: {
        where: { tutorId },
        orderBy: { createdAt: "desc" },
        take: 1, // Get latest evaluation by this tutor
      }
    },
    orderBy: { name: "asc" },
  });

  return studentsRaw.map(s => ({
    ...s,
    activeProgram: s.enrollments?.[0]?.programType || null,
    programBatch: s.enrollments?.[0]?.programBatch || null,
    batchSchedule: s.enrollments?.[0]?.batchSchedule || null,
  }));
}

export async function submitDescriptiveEvaluation(formData: FormData) {
  try {
    const tutorId = formData.get("tutorId") as string;
    const studentId = formData.get("studentId") as string;
    const fluency = formData.get("fluency") as string;
    const pronunciation = formData.get("pronunciation") as string;
    const vocabulary = formData.get("vocabulary") as string;
    const notes = formData.get("notes") as string;

    if (!tutorId || !studentId || !fluency || !pronunciation || !vocabulary) {
      return { error: "Semua indikator penilaian wajid diisi." };
    }

    await prisma.descriptiveEvaluation.create({
      data: {
        tutorId,
        studentId,
        fluency,
        pronunciation,
        vocabulary,
        notes: notes || null,
      }
    });

    revalidatePath("/tutor/evaluations");
    return { success: true };
  } catch (error: any) {
    console.error("submitDescriptiveEvaluation error:", error);
    return { error: error.message || "Gagal menyimpan evaluasi." };
  }
}
