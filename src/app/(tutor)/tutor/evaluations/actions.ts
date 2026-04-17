"use server";

import { prisma } from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";

export type EvaluationGroup = "Conversation" | "EFK" | "EFT" | "Private";

export async function getStudentsForEvaluation(group: EvaluationGroup, tutorId: string) {
  const programInFilter = group === "Conversation" 
    ? ["Regular", "Fullday", "Asrama", "English on Saturday"]
    : [group];

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      enrollments: {
        some: {
          OR: [
            { endDate: { gte: new Date() } },
            { endDate: null }
          ],
          programType: {
            in: programInFilter
          }
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
