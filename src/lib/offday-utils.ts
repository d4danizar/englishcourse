import { getDurationBaseDays } from "./utils/academic-calendar";

export function getRequiredClassDays(durationOption: string): number {
  const normalized = (durationOption || "").toLowerCase();
  if (normalized.includes("1_minggu") || normalized === "1 minggu" || normalized.includes("1_week")) return 5;
  if (normalized.includes("2_minggu") || normalized === "2 minggu" || normalized.includes("2_weeks")) return 10;
  if (normalized.includes("3_minggu") || normalized === "3 minggu" || normalized.includes("3_weeks")) return 15;
  if (normalized.includes("4_minggu") || normalized === "4 minggu" || normalized.includes("4_weeks")) return 20;
  
  // 1 Bulan = 4 weeks = 20 active days
  if (normalized.includes("1_bulan") || normalized === "1 bulan" || normalized.includes("1_month")) return 20;
  if (normalized.includes("2_bulan") || normalized === "2 bulan" || normalized.includes("2_months")) return 40;
  if (normalized.includes("3_bulan") || normalized === "3 bulan" || normalized.includes("3_months")) return 60;
  if (normalized.includes("4_bulan") || normalized === "4 bulan" || normalized.includes("4_months")) return 80;
  if (normalized.includes("6_bulan") || normalized === "6 bulan" || normalized.includes("6_months")) return 120;
  
  return 20; // Default fallback to 1 month
}

function getHolidayWeeks(durationOption: string | null): number {
  const norm = (durationOption || "").toLowerCase();
  if (norm.includes("4")) return 4;
  if (norm.includes("3")) return 3;
  if (norm.includes("2")) return 2;
  return 1;
}

export function calculateEndDate(
  startDate: Date | string,
  durationOption: string | null,
  offDays: any[] = [],
  programType?: string | null,
  leaveUsed: number = 0
): Date {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0); // Normalisasi ke tengah malam

  const cleanProgram = String(programType || "").toUpperCase().trim();

  // === FIXED CALENDAR FOR HOLIDAY PROGRAMS (Monday–Saturday per Batch) ===
  // Ensures fixed batch end dates (e.g., Dec 21–26 2026 and Dec 28 2026–Jan 2 2027)
  // are exact and not shifted across year boundaries by global OffDay logic.
  if (cleanProgram.includes("HOLIDAY")) {
    const weeks = getHolidayWeeks(durationOption);
    const holidayEnd = new Date(start);
    holidayEnd.setDate(holidayEnd.getDate() + (weeks * 7 - 2) + (leaveUsed || 0));
    return holidayEnd;
  }

  // OVERRIDE for EFT and EFK natively across the app
  let requiredDays = getRequiredClassDays(durationOption || "");
  if (cleanProgram.includes('EFT') || cleanProgram.includes('EFK')) {
    requiredDays = 120; // Exactly 6 months equivalent in active days
  }

  // === SMART CALENDAR FOR ENGLISH ON SATURDAY ===
  if (cleanProgram.includes('ENGLISH ON SATURDAY') || cleanProgram.includes('SATURDAY')) {
    const TOTAL_SESSIONS = 8 + (leaveUsed || 0); 
    let sessionCount = 1; 
    let calculatedDate = new Date(start);

    while (sessionCount < TOTAL_SESSIONS) {
      calculatedDate.setDate(calculatedDate.getDate() + 7);
      const checkDate = new Date(calculatedDate.getFullYear(), calculatedDate.getMonth(), calculatedDate.getDate()).getTime();
      const isOffDay = offDays.some(holiday => {
        const hStart = new Date(holiday.startDate).setHours(0, 0, 0, 0);
        const hEnd = holiday.endDate ? new Date(holiday.endDate).setHours(0, 0, 0, 0) : hStart;
        return checkDate >= hStart && checkDate <= hEnd;
      });

      if (!isOffDay) {
        sessionCount++;
      }
    }
    return calculatedDate;
  }
  // === END ENGLISH ON SATURDAY ===

  const resultDate = new Date(start);
  
  // Base required days + leave Used
  const totalRequiredDays = requiredDays + (leaveUsed || 0);
  
  // if 0 days needed, just return start date
  if (totalRequiredDays <= 0) return resultDate;

  let activeDaysCount = 0;

  // We loop day by day.
  while (activeDaysCount < totalRequiredDays) {
    const dayOfWeek = resultDate.getDay();
    
    // Normalisasi currentDate untuk komparasi akurat
    const checkDate = new Date(resultDate.getFullYear(), resultDate.getMonth(), resultDate.getDate()).getTime();

    // Cek apakah hari ini masuk dalam rentang tanggal merah (OffDays)
    const isOffDay = offDays.some(holiday => {
      const hStart = new Date(holiday.startDate).setHours(0,0,0,0);
      const hEnd = holiday.endDate ? new Date(holiday.endDate).setHours(0,0,0,0) : hStart;
      return checkDate >= hStart && checkDate <= hEnd;
    });
    
    // 0 = Sunday, 6 = Saturday. Skip weekends and offDays
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isOffDay) {
      activeDaysCount++;
    }
    
    // Only move to the next day IF we haven't reached the required days yet
    if (activeDaysCount < totalRequiredDays) {
      resultDate.setDate(resultDate.getDate() + 1);
    }
  }

  return resultDate;
}
