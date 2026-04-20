import { getDurationBaseDays } from "./utils/academic-calendar";

export function calculateEndDate(
  startDate: Date,
  durationStr: string | null,
  offDays: { startDate: Date; endDate: Date }[],
  programType?: string | null,
  excusedAbsences: number = 0
): Date {
  // 1. Dapatkan durasi dasar (misal 2_MONTHS -> 40 hari)
  const baseDays = getDurationBaseDays(durationStr); 
  
  // 2. Clone tanggal agar tidak merusak data asli
  const resultDate = new Date(startDate);
  // Kunci di jam 12 siang untuk menghindari anomali zona waktu yang melompat hari
  resultDate.setHours(12, 0, 0, 0);

  // 3. Hitung target hari kerja yang harus dicapai
  const targetDaysCount = (baseDays > 0 ? baseDays - 1 : 0) + excusedAbsences;
  
  let daysAdded = 0;
  
  // Deteksi program (Sangat krusial karena di log tercatat 'Fullday')
  const program = programType?.toUpperCase() || "REGULAR";
  // Asumsi: Regular & Fullday libur Sabtu-Minggu. 
  const isRegularOrFullday = program === "REGULAR" || program === "FULLDAY";

  // Fungsi helper: Mengambil angka murni kalender tanpa peduli jam/UTC
  const getPureDate = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };

  // 4. Perulangan pencarian hari
  while (daysAdded < targetDaysCount) {
    // Maju 1 hari
    resultDate.setDate(resultDate.getDate() + 1);
    
    const currentDayOfWeek = resultDate.getDay(); // 0 = Minggu, 6 = Sabtu
    const currentPureTime = getPureDate(resultDate);

    // Cek apakah hari ini adalah Tanggal Merah
    const isOffDay = offDays.some((offDay) => {
      const startPureTime = getPureDate(new Date(offDay.startDate));
      const endPureTime = getPureDate(new Date(offDay.endDate));
      return currentPureTime >= startPureTime && currentPureTime <= endPureTime;
    });

    // JIKA INI TANGGAL MERAH -> Langsung lompati, JANGAN tambah daysAdded
    if (isOffDay) {
      continue; 
    }

    // JIKA BUKAN TANGGAL MERAH -> Baru kita cek apakah ini hari kerja
    if (isRegularOrFullday) {
      if (currentDayOfWeek !== 0 && currentDayOfWeek !== 6) {
        daysAdded++; // Tambah hari aktif (Senin-Jumat)
      }
    } else {
      if (currentDayOfWeek !== 0) {
        daysAdded++; // Tambah hari aktif (Senin-Sabtu)
      }
    }
  }

  // 5. Set jam berakhir (disesuaikan dengan kebutuhan DB, misal 17:00)
  resultDate.setHours(17, 0, 0, 0); 
  return resultDate;
}
