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

    // ── Step 3: Validation & Delivery Report Filtering ─────────────────────────
    // If it's a delivery report or an outbound message ping, drop it immediately.
    if (body.status || body.is_outbound) {
      console.log("⏭️  [Wablas v2] Skipped — outbound message or delivery report.");
      return ok();
    }

    const sender  = body.phone || body.sender || body.viewer;
    const message = (body.message || body.text || "").toString().trim();

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
    if (cleanPhoneNumber.length < 10 || cleanPhoneNumber.length > 14) {
      console.log(`⏭️  [Wablas v2] Skipped — invalid phone number length (likely a system ID): "${cleanPhoneNumber}"`);
      return NextResponse.json({ success: true, message: "Ignored: Invalid phone number length (likely a system ID)" }, { status: 200 });
    }

    // ── Step 6: Check for existing lead ──────────────────────────────────────
    // `whatsapp` is not @unique in the schema so we use findFirst (not
    // findUnique / upsert). The update targets the PK `id`, which is always
    // unique, so there is no ambiguity on the update path.
    const existingLead = await prisma.lead.findFirst({
      where:  { whatsapp: cleanPhoneNumber },
      select: { id: true, notes: true },
    });

    // ── Step 7: Build note strings ────────────────────────────────────────────
    const timestamp = new Date().toLocaleString("id-ID");

    // ── Step 8: Create or update ──────────────────────────────────────────────
    // UPDATE: only `notes` is written — `name`, `status`, and `branch` are
    //         intentionally left untouched to preserve any admin edits.
    // CREATE: sets a safe placeholder name; admin can rename from the CRM.
    if (existingLead) {
      const appendedNotes =
        `${existingLead.notes ?? ""}\n\n[Pesan Baru - ${timestamp}]: ${message}`.trim();

      await prisma.lead.update({
        where: { id: existingLead.id },
        data:  { notes: appendedNotes },
      });
    } else {
      await prisma.lead.create({
        data: {
          name:     `Lead WA - ${cleanPhoneNumber}`,
          whatsapp: cleanPhoneNumber,
          status:   "NEW",
          branch:   validBranch,
          notes:    `[Pesan Awal - ${timestamp}]: ${message}`,
        },
      });
    }

    const action = existingLead ? "♻️  LEAD DIPERBARUI" : "🚀 LEAD BARU";
    console.log(`${action} [${validBranch}]: ${cleanPhoneNumber} — "${message.slice(0, 60)}"`);

    return ok();

  } catch (error) {
    // Log the error but still return 200 to prevent Wablas from retrying
    // indefinitely and flooding the logs with duplicate leads.
    console.error("[Wablas v2] Webhook error:", error);
    return ok();
  }
}
