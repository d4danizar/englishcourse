import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Always return 200 so Wablas stops retrying. */
const ok = () => NextResponse.json({ success: true }, { status: 200 });

// ── POST Handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // ── Step 1: Branch resolution ─────────────────────────────────────────────
    const url        = new URL(req.url);
    const branchName = url.searchParams.get("branch") || "KARTASURA";
    const validBranch = (["KARTASURA", "CABANG_2", "CABANG_3"] as const).includes(
      branchName as any
    )
      ? (branchName as "KARTASURA" | "CABANG_2" | "CABANG_3")
      : ("KARTASURA" as const);

    // ── Step 2: Payload parsing ───────────────────────────────────────────────
    let body: Record<string, any> = {};
    try {
      const rawText = await req.text();
      body = JSON.parse(rawText);
      console.log("📦 [Wablas v2] RAW PAYLOAD:", JSON.stringify(body));
    } catch {
      // Unparseable body — acknowledge and exit
      return ok();
    }

    const sender  = body.phone || body.sender || body.viewer;
    const message = (body.message || body.text || "").toString().trim();

    // ── Step 3: Validation — drop silently on missing sender or empty message ─
    if (!sender || !message) {
      console.log("⏭️  [Wablas v2] Skipped — no sender or no message.");
      return ok();
    }

    // ── Step 4: Noise filtering — drop group messages ─────────────────────────
    // Wablas group senders contain "-" (e.g. "6281234567890-1234567890")
    // or "@g.us" suffix common in WA group JIDs.
    const senderStr = sender.toString();
    if (senderStr.includes("-") || senderStr.includes("@g.us")) {
      console.log(`⏭️  [Wablas v2] Skipped — group message from: ${senderStr}`);
      return ok();
    }

    // ── Step 5: Phone sanitisation ────────────────────────────────────────────
    const cleanPhoneNumber = senderStr.replace(/\D/g, "");
    if (cleanPhoneNumber.length < 10) {
      console.log(`⏭️  [Wablas v2] Skipped — invalid phone number: "${cleanPhoneNumber}"`);
      return ok();
    }

    // ── Step 6: Fetch existing notes (needed for atomic append) ───────────────
    // A single lightweight SELECT by the unique `whatsapp` field.
    // This read + the upsert below cannot race on *create* because the DB
    // unique constraint on `whatsapp` ensures only one row is ever created.
    const existing = await prisma.lead.findUnique({
      where:  { whatsapp: cleanPhoneNumber },
      select: { notes: true },
    });

    // ── Step 7: Build note strings ────────────────────────────────────────────
    const timestamp = new Date().toLocaleString("id-ID");

    const createNotes = `[Pesan Awal - ${timestamp}]: ${message}`;

    const appendedNotes = existing
      ? `${existing.notes ?? ""}\n\n[Pesan Baru - ${timestamp}]: ${message}`.trim()
      : createNotes;

    // ── Step 8: Atomic upsert ─────────────────────────────────────────────────
    // CREATE  → triggered when no lead with this whatsapp exists.
    // UPDATE  → triggered when the lead already exists.
    //           Only `notes` is updated; `name`, `status`, and `branch` are
    //           intentionally preserved to avoid overwriting admin edits.
    await prisma.lead.upsert({
      where: { whatsapp: cleanPhoneNumber },
      create: {
        name:     `Lead WA - ${cleanPhoneNumber}`,
        whatsapp: cleanPhoneNumber,
        status:   "NEW",
        branch:   validBranch,
        notes:    createNotes,
      },
      update: {
        notes: appendedNotes,
      },
    });

    const action = existing ? "♻️  LEAD DIPERBARUI" : "🚀 LEAD BARU";
    console.log(`${action} [${validBranch}]: ${cleanPhoneNumber} — "${message.slice(0, 60)}"`);

    return ok();

  } catch (error) {
    // Log the error but still return 200 to prevent Wablas from retrying
    // indefinitely and flooding the logs with duplicate leads.
    console.error("[Wablas v2] Webhook error:", error);
    return ok();
  }
}
