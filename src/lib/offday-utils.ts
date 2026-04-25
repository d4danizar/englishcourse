import { getDurationBaseDays } from "./utils/academic-calendar";

export function calculateEndDate(
  startDate: Date | string,
  durationOption: string | null,
  offDays: any[] = [],
  programType?: string | null,
  leaveUsed: number = 0
): Date {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0); // Normalisasi ke tengah malam

  // 1. Map Duration to Exact Calendar Days
  const durationMap: Record<string, number> = {
    '1_WEEK': 7,
    '2_WEEKS': 14,
    '3_WEEKS': 21,
    '1_MONTH': 30,
    '2_MONTHS': 60,
    '6_MONTHS': 180,
  };
  
  // Fallback if not found (default to 30)
  let baseDays = durationMap[(durationOption || "").toUpperCase()] || 30; 

  // OVERRIDE for EFT and EFK natively across the app
  const cleanProgram = String(programType || "").toUpperCase().trim();
  if (cleanProgram.includes('EFT') || cleanProgram.includes('EFK')) {
    baseDays = 180; // Exactly 6 months equivalent
  }

  // === SMART CALENDAR FOR ENGLISH ON SATURDAY ===
  // 8 Saturday sessions, skipping holidays. Early return.
  if (cleanProgram.includes('ENGLISH ON SATURDAY') || cleanProgram.includes('SATURDAY')) {
    const TOTAL_SESSIONS = 8 + (leaveUsed || 0); // Base 8 sessions + missed sessions (izin)
    let sessionCount = 1; // Start date = Session 1
    let calculatedDate = new Date(start);

    while (sessionCount < TOTAL_SESSIONS) {
      // Jump to the next Saturday (7 days)
      calculatedDate.setDate(calculatedDate.getDate() + 7);

      // Normalize for comparison
      const checkDate = new Date(
        calculatedDate.getFullYear(),
        calculatedDate.getMonth(),
        calculatedDate.getDate()
      ).getTime();

      // Check against the same offDays array used by the rest of the system
      const isOffDay = offDays.some(holiday => {
        const hStart = new Date(holiday.startDate).setHours(0, 0, 0, 0);
        const hEnd = holiday.endDate ? new Date(holiday.endDate).setHours(0, 0, 0, 0) : hStart;
        return checkDate >= hStart && checkDate <= hEnd;
      });

      // Only count the session if it's NOT a holiday
      if (!isOffDay) {
        sessionCount++;
      }
    }

    return calculatedDate;
  }
  // === END ENGLISH ON SATURDAY ===

  // 2. Set the target days to loop (Base Duration + Leaves)
  // We subtract 1 because the startDate itself counts as Day 1.
  let targetDays = (baseDays + leaveUsed) - 1; 
  if (targetDays < 0) targetDays = 0;

  let currentDate = new Date(start);
  let daysCounted = 0;

  // 3. Loop Day by Day
  while (daysCounted < targetDays) {
    currentDate.setDate(currentDate.getDate() + 1);

    // Normalisasi currentDate untuk komparasi akurat
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();

    // Cek apakah hari ini masuk dalam rentang tanggal merah (OffDays)
    const isOffDay = offDays.some(holiday => {
      const hStart = new Date(holiday.startDate).setHours(0,0,0,0);
      const hEnd = holiday.endDate ? new Date(holiday.endDate).setHours(0,0,0,0) : hStart;
      return checkDate >= hStart && checkDate <= hEnd;
    });

    // Jika hari ini tanggal merah, JANGAN hitung (masa belajar diperpanjang)
    if (isOffDay) {
      continue; 
    }

    // Hari normal (termasuk Minggu), hitungan berjalan
    daysCounted++;
  }

  return currentDate;
}
