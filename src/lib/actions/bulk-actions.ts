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
  "Start Date": z.any().optional(), // Tambahkan header wajib sesuai instruksi UI
  JoinedDate: z.any().optional(), // Fallback legacy CSV
  Duration: z.union([z.string(), z.number()]), // Kolom Wajib
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
      // Coba gunakan "Start Date" terlebih dahulu, jika gagal mundur ke "JoinedDate"
      const dateField = student["Start Date"] || student.JoinedDate;
      let parsedDate = new Date();

      if (dateField) {
        if (typeof dateField === "number") {
          // Konversi dari format Excel Serial Date ke JS Date.
          parsedDate = new Date(Math.round((dateField - 25569) * 86400 * 1000));
        } else {
          // Format standar string Date
          parsedDate = new Date(dateField);
        }
        
        // Cek fallback jika invalid string
        if (isNaN(parsedDate.getTime())) {
          parsedDate = new Date();
        }
      }

      // Format Duration untuk perhitungan endDate & Database Mapping
      let mappedDuration = "1_MONTH"; // fallback standar
      if (student.Duration) {
        let cleanStr = String(student.Duration).trim().toUpperCase();
        if (cleanStr.includes('1 WEEK')) mappedDuration = '1_WEEK';
        else if (cleanStr.includes('2 WEEK')) mappedDuration = '2_WEEKS';
        else if (cleanStr.includes('3 WEEK')) mappedDuration = '3_WEEKS';
        else if (cleanStr.includes('1 MONTH')) mappedDuration = '1_MONTH';
        else if (cleanStr.includes('2 MONTH')) mappedDuration = '2_MONTHS';
        else if (cleanStr.includes('3 MONTH')) mappedDuration = '3_MONTHS';
        else if (cleanStr.includes('6 MONTH')) mappedDuration = '6_MONTHS';
        else mappedDuration = cleanStr.replace(/\s+/g, '_');
      }

      // Hitung endDate berbekal duration Enum yang spesifik
      const endDateVal = calculateEndDate(parsedDate, mappedDuration);

      // Kembalikan DUA objek: Data Profil User dan Data Paket Belajar (Enrollment)
      return {
        userProfile: {
          name: student.Name,
          email: student.Email,
          phoneNumber: cleanPhone,
          role: "STUDENT" as const,
          branch: branchFilter.branch,
          passwordHash,
          createdAt: parsedDate,
        },
        enrollmentData: {
          programType: student.Program,
          programBatch: student.Session ? String(student.Session) : null,
          startDate: parsedDate,
          endDate: endDateVal,
          durationOption: mappedDuration,
          leaveQuota: calculateLeaveQuota(student.Program, null),
          leaveUsed: 0,
          status: "ACTIVE"
        }
      };
    }));

    // --- Eksekusi Database yang Kuat & Bebas Duplikat ---
    // Karena kita memakai struktur Relasional, gunakan upsert/create berturut-turut untuk setiap user
    // agar Enrollments bisa terkait persis dengan ID murid masing-masing.
    let importedCount = 0;

    for (const payload of dbPayload) {
      // Upsert User agar email duplikat tidak crash, ia hanya akan memperbarui info dasar
      const savedUser = await prisma.user.upsert({
        where: { email: payload.userProfile.email },
        update: {
          name: payload.userProfile.name,
          phoneNumber: payload.userProfile.phoneNumber, // update WA yang terbaru jika berubah
        },
        create: payload.userProfile
      });

      // Lalu buatkan set tiket masuk kelas (Enrollments) yang baru untuk user ini
      await prisma.enrollment.create({
        data: {
          userId: savedUser.id,
          ...payload.enrollmentData
        }
      });

      importedCount++;
    }

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

    return { success: true, count: importedCount };
  } catch (error: any) {
    console.error("[processBulkImport] Error:", error);
    return { success: false, error: "Gagal memproses file. Silakan coba lagi nanti." };
  }
}
