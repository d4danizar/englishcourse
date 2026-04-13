export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return "";
  return phone.replace(/\D/g, ""); // Remove all non-numeric characters
}

/**
 * Calculate leave quota based on program and duration.
 * Business Rules:
 * - Regular: 5x
 * - English on Saturday: 5x
 * - Fullday/Asrama: 1W=1, 2W=2, 3W=3, 1M=5, 2M=10
 * - EFK/EFT: 10x (6 month programs)
 * - Others (Private, TOEFL): 0
 */
export function calculateLeaveQuota(program: string | null, durationOption: string | null): number {
  if (!program) return 0;

  switch (program) {
    case "Regular":
    case "English on Saturday":
      return 5;

    case "Fullday":
    case "Asrama": {
      if (!durationOption) return 0;
      switch (durationOption) {
        case "1_WEEK":   return 1;
        case "2_WEEKS":  return 2;
        case "3_WEEKS":  return 3;
        case "1_MONTH":  return 5;
        case "2_MONTHS": return 10;
        default: return 0;
      }
    }

    case "EFK":
    case "EFT":
      return 10;

    default:
      return 0;
  }
}
