import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fungsi Helper untuk mengirim balasan via Wablas dengan Token Dinamis
async function sendWablasMessage(phone: string, message: string, branch: string) {
  let domain = "";
  let token = "";

  // Pilih Token berdasarkan cabang (Format Enum: "CABANG_2")
  if (branch === "CABANG_2") {
    domain = process.env.WABLAS_DOMAIN_CABANG2 || "";
    token = process.env.WABLAS_TOKEN_CABANG2 || "";
  } else {
    // Default fallback ke KARTASURA
    domain = process.env.WABLAS_DOMAIN_KARTASURA || "";
    token = process.env.WABLAS_TOKEN_KARTASURA || "";
  }
  
  if (!domain || !token) {
    console.warn(`⚠️ Kredensial Wablas untuk cabang ${branch} belum di-set di .env`);
    return;
  }

  try {
    await fetch(`${domain}/api/send-message`, {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ phone, message })
    });
  } catch (error) {
    console.error(`Gagal mengirim balasan Wablas untuk ${branch}:`, error);
  }
}

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

    const sender = body.phone || body.sender;
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
      // SKENARIO 1: LEAD BARU
      await prisma.lead.create({
        data: {
          name: `WA Lead - ${cleanPhoneNumber}`,
          whatsapp: cleanPhoneNumber,
          status: "NEW",
          branch: validBranch,
        },
      });
      console.log(`🚀 [${validBranch}] LEAD BARU MASUK: ${cleanPhoneNumber}`);
      
      // Kirim auto-reply meminta nama (menggunakan token spesifik cabang)
      await sendWablasMessage(
        cleanPhoneNumber, 
        `Halo Kak! 👋 Terima kasih sudah menghubungi pendaftaran cabang ${validBranch}. Agar kami bisa mendata dengan baik, boleh disebutkan *Nama Lengkapnya*, Kak?`,
        validBranch
      );

    } else if (existingLead.name.includes("WA Lead")) {
      // SKENARIO 2: MENANGKAP NAMA LENGKAP
      await prisma.lead.update({
        where: { id: existingLead.id },
        data: { name: message.trim() },
      });
      console.log(`✨ [${validBranch}] LEAD UPDATE NAMA: ${cleanPhoneNumber} -> ${message.trim()}`);
      
      await sendWablasMessage(
        cleanPhoneNumber, 
        `Terima kasih, Kak ${message.trim()}! Admin kami akan segera merespons pertanyaan Kakak. Mohon ditunggu ya! 🙏`,
        validBranch
      );

    } else {
      // SKENARIO 3: LEAD LAMA
      console.log(`♻️ [${validBranch}] CHAT LEAD LAMA (${existingLead.name}): ${message.substring(0,20)}...`);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Wablas Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
