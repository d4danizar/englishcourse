import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function POST(req: Request) {
  try {
    // 1. Tangkap Cabang dari URL
    const url = new URL(req.url);
    const branchName = url.searchParams.get("branch") || "KARTASURA";

    // Format ke enum BranchLocation Prisma
    const validBranch = ["KARTASURA", "CABANG_2", "CABANG_3"].includes(branchName) 
      ? branchName as any 
      : "KARTASURA";

    const rawText = await req.text();
    let body;
    try {
      body = JSON.parse(rawText);
      console.log("📦 RAW PAYLOAD WABLAS:", body);
    } catch {
      body = {};
    }

    const sender = body.phone || body.sender || body.viewer;
    const message = body.message || body.text || "";

    if (!sender) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const cleanPhoneNumber = sender.toString().replace(/\D/g, '');

    // 2. Cek Database (Perbaikan Skema: Menggunakan 'whatsapp' bukan 'phoneNumber')
    const existingLead = await prisma.lead.findFirst({
      where: { whatsapp: cleanPhoneNumber },
    });

    if (!existingLead) {
      // SKENARIO 1: LEAD BARU (Simpan pesan awal ke notes)
      await prisma.lead.create({
        data: {
          name: `WA Lead - ${cleanPhoneNumber}`,
          whatsapp: cleanPhoneNumber,
          status: "NEW",
          branch: validBranch,
          notes: message ? `[Pesan Awal]: ${message}` : "",
        },
      });
      console.log(`🚀 [${validBranch}] LEAD BARU MASUK: ${cleanPhoneNumber}`);

    } else {
      // SKENARIO 2: LEAD LAMA (Tumpuk pesan baru ke notes & update nama jika masih default)
      
      const newNoteEntry = message ? `\n\n[Pesan Baru - ${new Date().toLocaleString('id-ID')}]: ${message}` : "";
      const appendedNotes = existingLead.notes 
        ? `${existingLead.notes}${newNoteEntry}`
        : newNoteEntry.trim();

      // Check if we also need to update the name (if they sent a message and still have the default name)
      const isDefaultName = existingLead.name.includes("WA Lead");
      const updatedName = (isDefaultName && message) ? message.trim() : existingLead.name;

      await prisma.lead.update({
        where: { id: existingLead.id },
        data: { 
          name: updatedName,
          notes: appendedNotes 
        },
      });
      
      console.log(`♻️ [${validBranch}] CHAT LEAD LAMA DIPERBARUI: ${cleanPhoneNumber}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Wablas Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
