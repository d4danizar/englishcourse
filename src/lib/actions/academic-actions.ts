"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

const STAFF_ALLOWED = ["SUPER_ADMIN", "MANAGER", "CS"];

export async function assignStudentToSession(userId: string, sessionId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !STAFF_ALLOWED.includes(session.user.role as string)) {
      return { error: "Sesi tidak valid atau akses ditolak." };
    }

    await (prisma as any).user.update({
      where: { id: userId },
      data: { sessionId },
    });
    
    revalidatePath("/admin/academic/pool");
    return { success: true };
  } catch (err: any) {
    console.error("[assignStudentToSession]", err);
    return { error: "Gagal mengatur alokasi kelas." };
  }
}

export async function assignStudentsToClassGroup(userIds: string[], classGroupId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !STAFF_ALLOWED.includes(session.user.role as string)) {
      return { error: "Sesi tidak valid atau akses ditolak." };
    }

    await (prisma as any).user.updateMany({
      where: { id: { in: userIds } },
      data: { classGroupId },
    });
    
    revalidatePath("/admin/academic/pool");
    return { success: true };
  } catch (err: any) {
    console.error("[assignStudentsToClassGroup]", err);
    return { error: "Gagal mendaftarkan siswa secara massal ke Rombel." };
  }
}

export async function getSessionAttendance(sessionId: string) {
  try {
    const sessionDoc = await (prisma as any).session.findUnique({
      where: { id: sessionId },
      include: { classGroup: true }
    });

    if (!sessionDoc) return { error: "Sesi tidak ditemukan" };

    // 1. Regular students
    let regularStudents: any[] = [];
    if (sessionDoc.classGroupId) {
      regularStudents = await (prisma as any).user.findMany({
        where: { classGroupId: sessionDoc.classGroupId, role: "STUDENT" },
        select: { id: true, name: true, activeProgram: true, phoneNumber: true }
      });
    }

    // 2. Sit-in students (Guests)
    const sitInRecords = await (prisma as any).attendance.findMany({
      where: { sessionId, isGuest: true },
      include: { student: { select: { id: true, name: true, activeProgram: true, phoneNumber: true } } }
    });

    const sitInStudents = sitInRecords.map((r: any) => ({ ...r.student, isGuest: true }));

    return { 
      success: true, 
      session: sessionDoc,
      regularStudents,
      sitInStudents,
      allParticipants: [...regularStudents, ...sitInStudents]
    };
  } catch (err) {
    console.error("[getSessionAttendance]", err);
    return { error: "Gagal menarik data peserta" };
  }
}

export async function searchGuestStudents(program: string, currentSessionId: string) {
  try {
    const sessionDoc = await (prisma as any).session.findUnique({
      where: { id: currentSessionId }
    });

    const students = await (prisma as any).user.findMany({
      where: {
        role: "STUDENT",
        activeProgram: program,
        OR: [
          { classGroupId: null },
          { classGroupId: { not: sessionDoc?.classGroupId || "" } }
        ]
      },
      select: { id: true, name: true, classGroup: { select: { name: true } } }
    });

    return { success: true, students };
  } catch (err) {
    console.error("[searchGuestStudents]", err);
    return { error: "Gagal mencari siswa sit-in" };
  }
}

export async function addGuestToSession(userId: string, sessionId: string) {
  try {
    // Upsert to handle if they already exist as guest or regular, but we assume guest here
    await (prisma as any).attendance.create({
      data: {
        studentId: userId,
        sessionId: sessionId,
        status: "PRESENT",
        isGuest: true,
      }
    });

    revalidatePath(`/tutor/sessions/${sessionId}`);
    return { success: true };
  } catch (err) {
    console.error("[addGuestToSession]", err);
    return { error: "Gagal menambahkan siswa sit-in" };
  }
}

export async function createClassGroup(name: string, program: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !STAFF_ALLOWED.includes(session.user.role as string)) {
      return { error: "Sesi tidak valid atau akses ditolak." };
    }

    const newGroup = await (prisma as any).classGroup.create({
      data: { name, program }
    });

    revalidatePath("/admin/academic/pool");
    return { success: true, classGroup: newGroup };
  } catch (err) {
    console.error("[createClassGroup]", err);
    return { error: "Gagal membuat Rombel." };
  }
}
