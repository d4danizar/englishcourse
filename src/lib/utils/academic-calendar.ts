export function getDurationBaseDays(durationType: string | null): number {
  if (!durationType) return 20; // Default 1 Bulan

  const fLabel = durationType.toLowerCase();
  
  if (fLabel.includes("1 bulan") || fLabel.includes("1 month") || fLabel.includes("1_month")) return 20;
  if (fLabel.includes("2 bulan") || fLabel.includes("2 month") || fLabel.includes("2_month")) return 40;
  if (fLabel.includes("3 bulan") || fLabel.includes("3 month") || fLabel.includes("3_month")) return 60;
  if (fLabel.includes("6 bulan") || fLabel.includes("6 month") || fLabel.includes("6_month")) return 120;
  
  if (fLabel.includes("3 minggu") || fLabel.includes("3 week") || fLabel.includes("3_week")) return 15;
  if (fLabel.includes("2 minggu") || fLabel.includes("2 week") || fLabel.includes("2_week")) return 10;
  if (fLabel.includes("1 minggu") || fLabel.includes("1 week") || fLabel.includes("1_week")) return 5;
  
  return 20;
}

export function calculateExtendedEndDate(
  startDate: Date,
  durationType: string | null,
  totalLeaves: number,
  programType: string | null
): Date {
  // 1. Dapatkan base durasi aktif dalam jumlah "hari masuk/kursus"
  const baseDays = getDurationBaseDays(durationType);
  
  // 2. Tambahkan kompensasi izin
  const targetDays = baseDays + totalLeaves;

  const resultDate = new Date(startDate);
  // Normalize jam ke midnight agar aman
  resultDate.setHours(0, 0, 0, 0);

  let daysAdded = 0;
  
  // Kurangi 1 karena hari H (startDate) dihitung sebagai hari pertama pertemuan
  const daysToProcess = targetDays > 0 ? targetDays - 1 : 0;
  
  const isRegular = programType?.toUpperCase() === "REGULAR";

  while (daysAdded < daysToProcess) {
    resultDate.setDate(resultDate.getDate() + 1);
    const dayOfWeek = resultDate.getDay(); // 0 = Minggu, 6 = Sabtu
    
    if (isRegular) {
      // REGULAR: Skip Sabtu & Minggu
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    } else {
      // ASRAMA / FULLDAY / LAINNYA: Skip Minggu saja
      if (dayOfWeek !== 0) {
        daysAdded++;
      }
    }
  }

  return resultDate;
}
