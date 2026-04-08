"use server";

import { z } from "zod";
import { prisma } from "../prisma";
import { getBranchFilter } from "./branch-actions";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { revalidatePath } from "next/cache";

const ImportRowSchema = z.object({
  Name: z.string().min(1, "Name is required"),
  Email: z.string().email("Invalid email"),
  WhatsApp: z.union([z.string(), z.number()]),
  Program: z.string().min(1, "Program is required"),
});

export async function processBulkImport(rawData: any[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Sesi tidak valid. Harap login kembali." };
    }

    // SECURITY CHECK: Dapatkan filter cabang manajer yang sedang aktif
    const branchFilter = await getBranchFilter();
    
    // Default password menggunakan bcrypt
    const defaultPassword = await bcrypt.hash("P4ssw0rd!", 10);
    
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
        error: "Tidak ada data yang valid ditemukan. Cek ejaan judul kolom (Name, Email, WhatsApp, Program)." 
      };
    }

    // Mapping payload untuk Prisma (Inject Cabang!)
    const dbPayload = validData.map(student => ({
      name: student.Name,
      email: student.Email,
      phoneNumber: String(student.WhatsApp),
      role: "STUDENT" as const,
      activeProgram: student.Program,
      branch: branchFilter.branch, // <--- INJEKSI KTP CABANG DI SINI
      passwordHash: defaultPassword
    }));

    // Eksekusi Massal (skipDuplicates mencegah blockir total jika ada record kembar)
    const result = await prisma.user.createMany({
      data: dbPayload,
      skipDuplicates: true,
    });

    revalidatePath("/admin/users");
    
    return { success: true, count: result.count };
  } catch (error: any) {
    console.error("[processBulkImport] Error:", error);
    return { success: false, error: "Gagal memproses file. Silakan coba lagi nanti." };
  }
}
