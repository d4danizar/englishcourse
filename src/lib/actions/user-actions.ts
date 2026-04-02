"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function updateUserPassword(
  userId: string,
  newPassword: string,
  currentPassword?: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (newPassword.length < 6) {
      return { success: false, message: "Password minimal 6 karakter." };
    }

    // Jika ada currentPassword, verifikasi dulu
    if (currentPassword) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return { success: false, message: "User tidak ditemukan." };

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return { success: false, message: "Password lama tidak sesuai." };
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true, message: "Password berhasil diperbarui." };
  } catch (error) {
    console.error("[updateUserPassword]", error);
    return { success: false, message: "Terjadi kesalahan server." };
  }
}
