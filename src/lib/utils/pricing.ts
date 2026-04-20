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
      if (duration === "1 Minggu") basePrice = 825000;
      else if (duration === "2 Minggu") basePrice = 1500000;
      else if (duration === "3 Minggu") basePrice = 1800000;
      else if (duration === "1 Bulan") basePrice = 2100000;
      else if (duration === "2 Bulan") basePrice = 3500000;
      break;
    case "Asrama":
      if (duration === "1 Minggu") basePrice = 1000000;
      else if (duration === "2 Minggu") basePrice = 1700000;
      else if (duration === "3 Minggu") basePrice = 2200000;
      else if (duration === "1 Bulan") basePrice = 2500000;
      else if (duration === "2 Bulan") basePrice = 3950000;
      break;
    default:
      basePrice = 0;
  }

  // Base price + Biaya Pendaftaran Rp100.000
  return basePrice + REGISTRATION_FEE;
}
