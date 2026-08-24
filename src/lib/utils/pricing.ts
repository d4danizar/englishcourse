/**
 * Pricing Engine — Single Source of Truth for Kampung Inggris.
 *
 * ALL price calculations must go through this file.
 * Do NOT hardcode prices in Server Actions or UI components.
 *
 * Exports:
 *   - REGISTRATION_FEE          → Biaya pendaftaran yang dibebankan ke siswa baru.
 *   - REFERRAL_DISCOUNT         → Potongan untuk kode referral (Membership only).
 *   - calculateInvoiceAmount()  → Legacy helper (kept for backward-compat, wraps calculateFinalPrice).
 *   - calculateFinalPrice()     → Unified function — USE THIS for all new code.
 *   - getMembershipDuration()   → Maps membershipPackage key → canonical duration string.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const REGISTRATION_FEE = 100000;  // Biaya pendaftaran — added for first-time students
export const REFERRAL_DISCOUNT = 100000; // Potongan referral — applied to Membership only

// ─────────────────────────────────────────────────────────────────────────────
// BASE PRICE TABLE
// TODO: UPDATE NEW PRICES HERE
// Base prices do NOT include REGISTRATION_FEE — that is added by calculateFinalPrice().
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the raw base price (without registration fee) for a given program + duration. */
function getBasePrice(program: string, duration?: string): number {
  switch (program) {
    // ── Regular Programs ────────────────────────────────────────────────────
    case "Regular":
      return 750000;

    case "English on Saturday":
      return 850000;

    case "Kelas Private":
    case "Private":
      return 1700000;

    case "TOEFL Prep":
    case "TOEFL":
      return 1000000;

    case "EFK":
    case "EFT":
      return 1700000;

    // ── Duration-based Programs ─────────────────────────────────────────────
    case "Fullday": {
      if (duration === "1 Minggu"  || duration === "1_WEEK")   return 825000;
      if (duration === "2 Minggu"  || duration === "2_WEEKS")  return 1500000;
      if (duration === "3 Minggu"  || duration === "3_WEEKS")  return 1800000;
      if (duration === "1 Bulan"   || duration === "1_MONTH")  return 2100000;
      if (duration === "2 Bulan"   || duration === "2_MONTHS") return 3500000;
      return 0;
    }

    case "Asrama": {
      if (duration === "1 Minggu"  || duration === "1_WEEK")   return 1000000;
      if (duration === "2 Minggu"  || duration === "2_WEEKS")  return 1700000;
      if (duration === "3 Minggu"  || duration === "3_WEEKS")  return 2200000;
      if (duration === "1 Bulan"   || duration === "1_MONTH")  return 2500000;
      if (duration === "2 Bulan"   || duration === "2_MONTHS") return 3950000;
      return 0;
    }

    // ── Holiday Programs ────────────────────────────────────────────────────
    case "Holiday Kids - Fullday":
    case "Holiday Teens - Fullday": {
      const weeks = duration ? parseInt(duration.replace(/\D/g, "")) || 1 : 1;
      if (weeks === 1) return 750000;
      if (weeks === 2) return 1400000;
      if (weeks === 3) return 2150000;
      return 750000;
    }

    case "Holiday Kids - Camp":
    case "Holiday Teens - Camp": {
      const weeks = duration ? parseInt(duration.replace(/\D/g, "")) || 1 : 1;
      if (weeks === 1) return 1100000;
      if (weeks === 2) return 1900000;
      if (weeks === 3) return 4000000;
      return 1100000;
    }

    // ── Membership Programs ─────────────────────────────────────────────────
    // Membership prices are NOT subject to REGISTRATION_FEE.
    // They use their own package key via getMembershipBasePrice().
    case "Membership":
      // Base handled separately via getMembershipBasePrice — return 0 here as sentinel.
      return 0;

    default:
      return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERSHIP PACKAGE PRICES
// TODO: UPDATE NEW PRICES HERE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps the Membership package key to { basePrice, durationKey }.
 * durationKey is the canonical string used for enrollment end-date calculation.
 */
export function getMembershipPackageDetails(packageKey: string): {
  basePrice: number;
  durationKey: string;
} {
  switch (packageKey) {
    case "1_Bulan":
      return { basePrice: 750000,  durationKey: "1_MONTH"  };
    case "3_Plus_1_Bulan":
      return { basePrice: 1250000, durationKey: "4_MONTHS" };
    case "6_Plus_1_Bulan":
      return { basePrice: 1950000, durationKey: "7_MONTHS" };
    case "12_Plus_1_Bulan":
      return { basePrice: 3100000, durationKey: "13_MONTHS" };
    default:
      throw new Error(`Paket Membership tidak valid: "${packageKey}"`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED PRICE CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

export interface CalculateFinalPriceOptions {
  /** Program name as stored in the DB (e.g. "Regular", "Membership", "Fullday"). */
  programName: string;
  /** Duration string required for Fullday / Asrama / Holiday programs. */
  duration?: string;
  /**
   * For Membership: the package key (e.g. "1_Bulan", "3_Plus_1_Bulan").
   * Ignored for non-Membership programs.
   */
  membershipPackage?: string;
  /**
   * Set to `true` when the student already has an account (repeat customer).
   * Repeat orders do NOT pay the registration fee.
   */
  isRepeatOrder?: boolean;
  /**
   * Set to `true` when a valid referral code was supplied.
   * Applies REFERRAL_DISCOUNT to Membership programs only.
   */
  hasReferral?: boolean;
}

export interface CalculateFinalPriceResult {
  /** The final amount the student owes. */
  totalAmount: number;
  /** The resolved canonical duration string (only meaningful for Membership). */
  resolvedDuration: string;
}

/**
 * Calculates the final price for any program.
 *
 * Pricing rules:
 *   1. Start with the base price for the program (+ duration if applicable).
 *   2. If NOT a repeat order → add REGISTRATION_FEE (Rp100.000).
 *   3. If Membership AND hasReferral → deduct REFERRAL_DISCOUNT (Rp100.000).
 *
 * Membership is ALWAYS treated as a repeat-order (no registration fee).
 */
export function calculateFinalPrice({
  programName,
  duration,
  membershipPackage,
  isRepeatOrder = false,
  hasReferral = false,
}: CalculateFinalPriceOptions): CalculateFinalPriceResult {
  const isMembership = programName.toLowerCase().includes("membership");

  let basePrice: number;
  let resolvedDuration = duration ?? "";

  if (isMembership) {
    if (!membershipPackage) {
      throw new Error("membershipPackage wajib diisi untuk program Membership.");
    }
    const details = getMembershipPackageDetails(membershipPackage);
    basePrice = details.basePrice;
    resolvedDuration = details.durationKey;
  } else {
    basePrice = getBasePrice(programName, duration);
  }

  // Step 2: Add registration fee for first-time students only.
  // Membership is always exempt (alumni re-enrolling).
  const applyRegistrationFee = !isRepeatOrder && !isMembership;
  let totalAmount = applyRegistrationFee ? basePrice + REGISTRATION_FEE : basePrice;

  // Step 3: Referral discount — Membership only.
  if (isMembership && hasReferral) {
    totalAmount = Math.max(0, totalAmount - REFERRAL_DISCOUNT);
  }

  return { totalAmount, resolvedDuration };
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY HELPER (Backward-compatible wrapper)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @deprecated Use `calculateFinalPrice()` instead.
 *
 * Kept for backward compatibility with existing call sites that were not
 * refactored yet. Equivalent to: calculateFinalPrice({ programName, duration,
 * isRepeatOrder: false }).totalAmount
 */
export function calculateInvoiceAmount(
  program: string,
  duration?: string
): number {
  return calculateFinalPrice({ programName: program, duration, isRepeatOrder: false }).totalAmount;
}
