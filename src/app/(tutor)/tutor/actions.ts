"use server";

import { prisma } from "../../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitAttendance(formData: FormData) {
  try {
    const sessionId = formData.get("sessionId") as string;
    const studentIds = formData.getAll("studentId") as string[];
    const statuses = formData.getAll("status") as string[];
    const pronunciations = formData.getAll("pronunciation") as string[];
    const fluencies = formData.getAll("fluency") as string[];
    const vocabularies = formData.getAll("vocabulary") as string[];
    const tutorNotes = formData.get("tutorNotes") as string;
    const rescheduleNotes = formData.get("rescheduleNotes") as string;

    if (!sessionId || studentIds.length === 0) {
      return { error: "Session ID and at least one student are required." };
    }

    // Use a transaction to atomically create attendance records AND mark session complete
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < studentIds.length; i++) {
        const studentId = studentIds[i];
        let status = (statuses[i] || "PRESENT") as "PRESENT" | "ABSENT" | "EXCUSED" | "SICK";
        const pronunciation = parseInt(pronunciations[i]) || null;
        const fluency = parseInt(fluencies[i]) || null;
        const vocabulary = parseInt(vocabularies[i]) || null;

        // 1. Check existing attendance
        const existing = await tx.attendance.findFirst({
          where: { sessionId, studentId },
        });

        // ==========================================================
        // 2. LOGIKA KUOTA IZIN & AUTO-ALPA
        // ==========================================================
        const isIzin = status === "EXCUSED" || status === "SICK";
        const wasAlreadyIzin = existing && (existing.status === "EXCUSED" || existing.status === "SICK");

        if (isIzin && !wasAlreadyIzin) {
          // Fetch data murid untuk cek kuota pada enrollment terbarunya
          const studentEnrollmentRaw = await tx.user.findUnique({
            where: { id: studentId },
            include: {
              enrollments: {
                orderBy: { createdAt: "desc" },
                take: 1
              }
            }
          });

          const enrollment = studentEnrollmentRaw?.enrollments[0];

          if (enrollment && enrollment.endDate) {
            if (enrollment.leaveUsed < enrollment.leaveQuota) {
              // KUOTA MASIH ADA: Geser endDate +1 Hari
              let newEndDate = new Date(enrollment.endDate);
              newEndDate.setDate(newEndDate.getDate() + 1); // Tambah 1 hari
              
              if (newEndDate.getDay() === 0) {
                // Jika jatuh pada hari Minggu (0), geser 1 hari lagi ke Senin
                newEndDate.setDate(newEndDate.getDate() + 1);
              }

              await tx.enrollment.update({
                where: { id: enrollment.id },
                data: {
                  leaveUsed: enrollment.leaveUsed + 1,
                  endDate: newEndDate
                }
              });
            } else {
              // KUOTA HABIS: Paksa jadi ABSENT (Alpa)
              status = "ABSENT";
            }
          }
        }
        // ==========================================================

        // 3. Simpan atau Update Absensi
        if (existing) {
          await tx.attendance.update({
            where: { id: existing.id },
            data: {
              status,
              pronunciation,
              fluency,
              vocabulary,
              tutorNotes: tutorNotes || null,
              rescheduleNotes: rescheduleNotes || null,
            },
          });
        } else {
          await tx.attendance.create({
            data: {
              sessionId,
              studentId,
              status,
              pronunciation,
              fluency,
              vocabulary,
              tutorNotes: tutorNotes || null,
              rescheduleNotes: rescheduleNotes || null,
            },
          });
        }
      }

      // 4. Mark the session as completed
      await tx.session.update({
        where: { id: sessionId },
        data: { isCompleted: true },
      });
    });

    revalidatePath("/tutor");
    revalidatePath("/tutor/dashboard");
    revalidatePath("/admin/users"); // Refresh data user di admin
    return { success: true };
  } catch (error: any) {
    console.error("submitAttendance error:", error);
    return { error: error.message || "Failed to submit attendance." };
  }
}

export async function searchStudentsForAttendance(
  programName: string,
  batch: string,
  query: string = ""
) {
  try {
    const isSearching = query && query.trim() !== "";
    
    const studentsRaw = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        enrollments: {
          some: {
            endDate: { gte: new Date() }, // Masih aktif
            // LOGIKA BERCABANG (beralih ke enrollment)
            ...(isSearching
              ? {} // Kalau cari nama, filter program diabaikan
              : {
                  programType: programName,
                  programBatch: { contains: batch, mode: "insensitive" },
                }),
          }
        },
        ...(isSearching
          ? {
              // Pencarian spesifik nama lintas batch & program
              name: { contains: query.trim(), mode: "insensitive" },
            }
          : {}),
      },
      take: query && query.trim() !== "" ? 10 : undefined,
      select: { 
        id: true, 
        name: true, 
        enrollments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { programType: true }
        }
      },
      orderBy: { name: "asc" },
    });

    return studentsRaw.map(s => ({
      ...s,
      activeProgram: s.enrollments?.[0]?.programType || null
    }));
  } catch (error) {
    console.error("searchStudentsForAttendance lookup error:", error);
    return [];
  }
}
