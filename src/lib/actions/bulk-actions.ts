"use server";

import { z } from "zod";
import { prisma } from "../prisma";
import { getBranchFilter } from "./branch-actions";
import { sanitizePhoneNumber, calculateLeaveQuota } from "@/lib/formatters";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { revalidatePath } from "next/cache";
import { calculateEndDate } from "@/lib/utils/date-helpers";

const ImportRowSchema = z.object({
  Name: z.string().min(1, "Name is required"),
  Email: z.string().email("Invalid email"),
  WhatsApp: z.union([z.string(), z.number()]),
  Program: z.string().min(1, "Program is required"),
  Session: z.union([z.string(), z.number()]).optional(), // Kolom opsional: "Sesi 1", "08:00 - 09:30", dll
  JoinedDate: z.any().optional(), // Nilai tanggal dari Excel/CSV
  Duration: z.string().optional(), // Tambahan untuk deteksi endDate (misal: "1 week", "1 month")
});

export async function processBulkImport(rawData: any[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Sesi tidak valid. Harap login kembali." };
    }

    // SECURITY CHECK: Dapatkan filter cabang manajer yang sedang aktif
    const branchFilter = await getBranchFilter();

    const validData = [];

    // Validasi per baris menggunakan Zod, mengabaikan yang tak sesuai schema
    for (const row of rawData) {
      const parsed = ImportRowSchema.safeParse(row);
      if (parsed.success) {
        validData.push(parsed.data);
      }
    }

    if (validData.length === 0) {
      return {
        success: false,
        error: "Tidak ada data yang valid ditemukan. Cek ejaan judul kolom (Name, Email, WhatsApp, Program, Session[opsional])."
      };
    }

    // --- Pre-hash passwords per-row (WA number as password) ---
    const dbPayload = await Promise.all(validData.map(async (student) => {
      const cleanPhone = sanitizePhoneNumber(String(student.WhatsApp));
      const passwordHash = await bcrypt.hash(cleanPhone, 10);

      // Sinkronisasi Tanggal
      // Jika file hanya memiliki satu kolom tanggal (misal: JoinedDate), konversi dengan benar.
      // Jika tidak ada fallback ke now.
      let parsedDate = new Date();
      if (student.JoinedDate) {
        if (typeof student.JoinedDate === "number") {
          // Konversi dari format Excel Serial Date ke JS Date.
          parsedDate = new Date(Math.round((student.JoinedDate - 25569) * 86400 * 1000));
        } else {
          // Format standar string Date
          parsedDate = new Date(student.JoinedDate);
        }
        
        // Cek fallback jika invalid string
        if (isNaN(parsedDate.getTime())) {
          parsedDate = new Date();
        }
      }

      // Hitung endDate jika ada kolom Duration
      const endDateVal = student.Duration 
        ? calculateEndDate(parsedDate, student.Duration)
        : null;

      return {
        name: student.Name,
        email: student.Email,
        phoneNumber: cleanPhone,
        role: "STUDENT" as const,
        activeProgram: student.Program,
        programBatch: student.Session ? String(student.Session) : null,
        branch: branchFilter.branch,
        passwordHash,
        leaveQuota: calculateLeaveQuota(student.Program, null),
        leaveUsed: 0,
        // Pastikan startDate dan joined/createdAt persis identik 
        startDate: parsedDate,
        programStartDate: parsedDate, 
        createdAt: parsedDate,
        // Hitungan Akhir
        endDate: endDateVal,
      };
    }));

    // --- Batch create all students (skipDuplicates for safety) ---
    const result = await prisma.user.createMany({
      data: dbPayload,
      skipDuplicates: true,
    });

    // --- Post-create: Auto-assign "English on Saturday" students to ClassGroup ---
    const saturdayStudents = validData.filter(
      (s) => s.Program === "English on Saturday"
    );

    if (saturdayStudents.length > 0) {
      // Find an existing ClassGroup for "English on Saturday" in the active branch
      const saturdayClassGroup = await prisma.classGroup.findFirst({
        where: {
          program: "English on Saturday",
          branch: branchFilter.branch,
        },
      });

      if (saturdayClassGroup) {
        // Fetch the newly created students by their emails
        const saturdayEmails = saturdayStudents.map((s) => s.Email);
        const createdSaturdayUsers = await prisma.user.findMany({
          where: {
            email: { in: saturdayEmails },
            branch: branchFilter.branch,
            role: "STUDENT",
          },
          select: { id: true },
        });

        // Connect each student to the ClassGroup
        if (createdSaturdayUsers.length > 0) {
          await prisma.user.updateMany({
            where: {
              id: { in: createdSaturdayUsers.map((u) => u.id) },
            },
            data: {
              classGroupId: saturdayClassGroup.id,
            },
          });
        }
      }
    }

    revalidatePath("/admin/users");

    return { success: true, count: result.count };
  } catch (error: any) {
    console.error("[processBulkImport] Error:", error);
    return { success: false, error: "Gagal memproses file. Silakan coba lagi nanti." };
  }
}
