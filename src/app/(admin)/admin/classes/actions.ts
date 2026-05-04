"use server";

import { prisma } from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";
import { getBranchFilter } from "@/lib/actions/branch-actions";

export async function createSession(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const date = formData.get("date") as string;
    const timeSlot = formData.get("timeSlot") as string;
    const programType = formData.get("programType") as string;
    const tutorId = formData.get("tutorId") as string;

    if (!title || !date || !timeSlot || !programType || !tutorId) {
      return { error: "All fields are required: Title, Date, Time Slot, Program Type, and Tutor." };
    }

    const branchFilter = await getBranchFilter();

    await prisma.session.create({
      data: {
        title,
        date: new Date(date),
        timeSlot,
        programType,
        tutorId,
        branch: branchFilter.branch,
      },
    });

    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create session." };
  }
}

export async function deleteSession(sessionId: string) {
  try {
    // Attendance records will cascade delete due to onDelete: Cascade in schema
    await prisma.session.delete({
      where: { id: sessionId },
    });

    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete session." };
  }
}

export async function updateSession(formData: FormData) {
  try {
    const sessionId = formData.get("sessionId") as string;
    const title = formData.get("title") as string;
    const date = formData.get("date") as string;
    const timeSlot = formData.get("timeSlot") as string;
    const programType = formData.get("programType") as string;
    const tutorId = formData.get("tutorId") as string;

    if (!sessionId) return { error: "Session ID is required." };

    const data: Record<string, unknown> = {};
    if (title) data.title = title;
    if (date) data.date = new Date(date);
    if (timeSlot) data.timeSlot = timeSlot;
    if (programType) data.programType = programType;
    if (tutorId) data.tutorId = tutorId;

    await prisma.session.update({
      where: { id: sessionId },
      data,
    });

    revalidatePath("/admin/classes");
    revalidatePath("/tutor/dashboard");
    revalidatePath("/tutor/schedules");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update session." };
  }
}

export async function createIndependentClass(data: {
  name: string;
  program: string;
  tutorId: string;
  studentIds: string[]; // Array of selected student IDs
  totalSessions: number;
}) {
  try {
    const branchFilter = await getBranchFilter();

    await prisma.$transaction(async (tx) => {
      // 1. Create the ClassGroup (Wadah Induk)
      const newClass = await tx.classGroup.create({
        data: {
          name: data.name,
          program: data.program,
          classType: "INDEPENDENT",
          totalSessions: data.totalSessions,
          branch: branchFilter.branch,
          students: {
            connect: data.studentIds.map(id => ({ id }))
          }
        }
      });

      // 2. Loop to create 'totalSessions' empty/TBD Sessions (Slot Kosong)
      for (let i = 1; i <= data.totalSessions; i++) {
        await tx.session.create({
          data: {
            title: `Pertemuan ${i}`,
            programType: data.program,
            tutorId: data.tutorId,
            classGroupId: newClass.id,
            branch: branchFilter.branch,
            date: null,     // TBD Slot
            timeSlot: null, // TBD Slot
            assignedStudents: {
              connect: data.studentIds.map(id => ({ id }))
            }
          }
        });
      }
    });

    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating independent class:", error);
    return { error: error.message || "Failed to create independent class." };
  }
}

export async function updateSessionSchedule(data: {
  sessionId: string;
  date: string;
  timeSlot: string; // e.g., "14:00 - 15:30"
}) {
  try {
    await prisma.session.update({
      where: { id: data.sessionId },
      data: {
        date: new Date(data.date),
        timeSlot: data.timeSlot
      }
    });
    
    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating session:", error);
    return { error: error.message || "Failed to update session." };
  }
}
