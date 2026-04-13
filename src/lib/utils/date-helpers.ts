import { addWeeks, addMonths, addDays } from "date-fns";

export function calculateEndDate(startDate: Date, durationStr: string): Date {
  const normalizedStr = durationStr.toLowerCase().trim();

  // Handle months
  if (normalizedStr.includes("month") || normalizedStr.includes("bulan")) {
    const match = normalizedStr.match(/(\d+)/);
    const num = match ? parseInt(match[1], 10) : 1;
    return addMonths(startDate, num);
  }

  // Handle weeks
  if (normalizedStr.includes("week") || normalizedStr.includes("minggu")) {
    const match = normalizedStr.match(/(\d+)/);
    const num = match ? parseInt(match[1], 10) : 1;
    return addWeeks(startDate, num);
  }

  // Handle days fallback
  if (normalizedStr.includes("day") || normalizedStr.includes("hari")) {
    const match = normalizedStr.match(/(\d+)/);
    const num = match ? parseInt(match[1], 10) : 1;
    return addDays(startDate, num);
  }

  // Default fallback (1 month) if not recognized
  return addMonths(startDate, 1);
}
