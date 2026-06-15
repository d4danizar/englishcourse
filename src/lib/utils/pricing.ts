/**
 * Pricing Engine module for Kampung Inggris.
 *
 * Calculates base price for a given program and duration,
 * and adds the mandatory registration fee (Rp100.000).
 */

export const REGISTRATION_FEE = 100000;

export function calculateInvoiceAmount(
  program: string,
  duration?: string
): number {
  let basePrice = 0;

  switch (program) {
    case "Regular":
      basePrice = 750000;
      break;
    case "English on Saturday":
      basePrice = 850000;
      break;
    case "Kelas Private":
    case "Private":
      basePrice = 1700000;
      break;
    case "TOEFL Prep":
    case "TOEFL":
      basePrice = 1000000;
      break;
    case "EFK":
    case "EFT":
      basePrice = 1700000;
      break;
    case "Fullday":
      if (duration === "1 Minggu" || duration === "1_WEEK") basePrice = 825000;
      else if (duration === "2 Minggu" || duration === "2_WEEKS") basePrice = 1500000;
      else if (duration === "3 Minggu" || duration === "3_WEEKS") basePrice = 1800000;
      else if (duration === "1 Bulan" || duration === "1_MONTH") basePrice = 2100000;
      else if (duration === "2 Bulan" || duration === "2_MONTHS") basePrice = 3500000;
      break;
    case "Asrama":
      if (duration === "1 Minggu" || duration === "1_WEEK") basePrice = 1000000;
      else if (duration === "2 Minggu" || duration === "2_WEEKS") basePrice = 1700000;
      else if (duration === "3 Minggu" || duration === "3_WEEKS") basePrice = 2200000;
      else if (duration === "1 Bulan" || duration === "1_MONTH") basePrice = 2500000;
      else if (duration === "2 Bulan" || duration === "2_MONTHS") basePrice = 3950000;
      break;
    case "Holiday Kids - Fullday":
    case "Holiday Teens - Fullday": {
      const durationWeeks = duration ? parseInt(duration.replace(/\D/g, '')) || 1 : 1;
      if (durationWeeks === 1) basePrice = 750000;
      else if (durationWeeks === 2) basePrice = 1400000;
      else if (durationWeeks === 3) basePrice = 2150000;
      else basePrice = 750000;
      break;
    }
    case "Holiday Kids - Camp":
    case "Holiday Teens - Camp": {
      const durationWeeks = duration ? parseInt(duration.replace(/\D/g, '')) || 1 : 1;
      if (durationWeeks === 1) basePrice = 1100000;
      else if (durationWeeks === 2) basePrice = 1900000;
      else if (durationWeeks === 3) basePrice = 4000000;
      else basePrice = 1100000;
      break;
    }
    default:
      basePrice = 0;
  }

  // Base price + Biaya Pendaftaran Rp100.000
  return basePrice + REGISTRATION_FEE;
}
