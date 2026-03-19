"use server";

import { prisma } from "../../../../lib/prisma";

export async function getStudentDescriptiveEvaluations(studentId: string) {
  const evaluations = await prisma.descriptiveEvaluation.findMany({
    where: { studentId },
    include: {
      tutor: { select: { name: true } }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return evaluations;
}
