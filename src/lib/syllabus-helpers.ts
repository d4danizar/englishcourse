import { SESSION_MODULE_MAP, TIMESLOT_TO_SESSION } from "@/constants/syllabus";

export type TodayTopic = {
  moduleName: string;
  shortName: string;
  topicNumber: number;   // 1-indexed (e.g. "Pertemuan ke-3")
  topicTitle: string;
  totalTopics: number;   // Total topik di modul ini
  sessionNumber: number; // 1-5
};

/**
 * Determine today's topic based on the session's timeSlot and how many
 * meetings the class has had so far (meetingCount).
 *
 * @param timeSlot  - e.g. "08:00 - 09:30"
 * @param meetingCount - how many meetings have occurred (1-indexed).
 *                       If 0 or not provided, defaults to 1 (first meeting).
 * @param offset - offset value
 * @param date - the specific Date object or ISODate string
 * @returns The module name and topic for today, or null if the timeSlot
 *          doesn't map to a known session.
 */
export function getTodayTopic(
  timeSlot: string,
  meetingCount: number = 1,
  offset: number = 0,
  date?: string | Date | null
): TodayTopic | null {
  let sessionNumber = TIMESLOT_TO_SESSION[timeSlot];

  // Regex fallback handling if standard map fails
  if (!sessionNumber) {
    const rawLower = timeSlot.toLowerCase();
    if (rawLower.includes("08:") || rawLower.includes("session 1") || rawLower.includes("sesi 1") || rawLower.includes("06:") || rawLower.includes("07:")) sessionNumber = 1;
    else if (rawLower.includes("09:") || rawLower.includes("10:") || rawLower.includes("session 2") || rawLower.includes("sesi 2")) sessionNumber = 2;
    else if (rawLower.includes("12:") || rawLower.includes("13:") || rawLower.includes("session 3") || rawLower.includes("sesi 3")) sessionNumber = 3;
    else if (rawLower.includes("14:") || rawLower.includes("15:") || rawLower.includes("session 4") || rawLower.includes("sesi 4")) sessionNumber = 4;
    else if (rawLower.includes("16:") || rawLower.includes("17:") || rawLower.includes("18:") || rawLower.includes("19:") || rawLower.includes("session 5") || rawLower.includes("sesi 5")) sessionNumber = 5;
    else sessionNumber = 1; // absolute fallback
  }

  // Dynamic logic for Sesi 5 based on Day of Week
  // If no date is provided, we can't do dynamic logic, so fallback to modulo or default to session 5 map.
  let activeModuleId = sessionNumber;
  if (sessionNumber === 5 && date) {
    const d = new Date(date);
    const day = d.getDay(); // 0:Sun, 1:Mon, 2:Tue, 3:Wed, 4:Thu, 5:Fri, 6:Sat
    if (day === 1 || day === 5) activeModuleId = 1; // TD1
    else if (day === 2) activeModuleId = 3; // TP
    else if (day === 3) activeModuleId = 4; // TD2
    else if (day === 4) activeModuleId = 2; // Listening
    else activeModuleId = 1; // fallback
  }

  const moduleInfo = SESSION_MODULE_MAP[activeModuleId];
  if (!moduleInfo) return null;

  const { name, shortName, data } = moduleInfo;
  
  // Adjusted meeting count includes the offset
  const adjustedMeetingCount = meetingCount + offset;
  const safeCount = Math.max(1, adjustedMeetingCount);
  const index = (safeCount - 1) % data.length; // Modulo rotation

  return {
    moduleName: name,
    shortName,
    topicNumber: index + 1,
    topicTitle: data[index],
    totalTopics: data.length,
    sessionNumber,
  };
}

/**
 * Get session number from a timeSlot string.
 * Returns null if not a recognized slot.
 */
export function getSessionNumber(timeSlot: string): number | null {
  const num = TIMESLOT_TO_SESSION[timeSlot];
  if (num) return num;
  
  const rawLower = timeSlot.toLowerCase();
  if (rawLower.includes("08:") || rawLower.includes("session 1") || rawLower.includes("sesi 1") || rawLower.includes("06:") || rawLower.includes("07:")) return 1;
  else if (rawLower.includes("09:") || rawLower.includes("10:") || rawLower.includes("session 2") || rawLower.includes("sesi 2")) return 2;
  else if (rawLower.includes("12:") || rawLower.includes("13:") || rawLower.includes("session 3") || rawLower.includes("sesi 3")) return 3;
  else if (rawLower.includes("14:") || rawLower.includes("15:") || rawLower.includes("session 4") || rawLower.includes("sesi 4")) return 4;
  else if (rawLower.includes("16:") || rawLower.includes("17:") || rawLower.includes("18:") || rawLower.includes("19:") || rawLower.includes("session 5") || rawLower.includes("sesi 5")) return 5;
  
  return null;
}
