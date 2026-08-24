export const CLASS_TIME_SLOTS = [
  "08:00 - 09:30",
  "10:00 - 11:30",
  "12:30 - 14:00",
  "14:30 - 16:00",
  "16:30 - 18:00",
  "18:30 - 20:00"
];

export function getSessionName(timeSlot: string): string {
  const safeTime = timeSlot.trim().toLowerCase();
  if (safeTime.includes("08:00")) return "Sesi 1";
  if (safeTime.includes("10:00")) return "Sesi 2";
  if (safeTime.includes("12:30")) return "Sesi 3";
  if (safeTime.includes("14:30")) return "Sesi 4";
  if (safeTime.includes("16:30")) return "Sesi 5";
  if (safeTime.includes("18:30")) return "Sesi 6";
  return "Sesi Ekstra";
}
