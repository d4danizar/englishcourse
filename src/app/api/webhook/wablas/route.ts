import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fungsi Helper untuk mengirim balasan via Wablas
async function sendWablasMessage(phone: string, message: string) {
  const domain = process.env.WABLAS_DOMAIN;
  const token = process.env.WABLAS_TOKEN;
  
  if (!domain || !token) {
    console.warn("⚠️ WABLAS_DOMAIN atau WABLAS_TOKEN belum di-set di .env");
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
    console.error("Gagal mengirim balasan Wablas:", error);
  }
}

export async function POST(req: Request) {
  try {
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

    // Cek Database (Perbaikan Skema: Menggunakan 'whatsapp' bukan 'phoneNumber')
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
        },
      });
      console.log(`🚀 [WABLAS] LEAD BARU MASUK: ${cleanPhoneNumber}. Mengirim auto-reply...`);
      
      // Kirim pesan balasan meminta nama
      await sendWablasMessage(
        cleanPhoneNumber, 
        "Halo Kak! 👋 Terima kasih sudah menghubungi kami. Agar kami bisa melayani dengan lebih baik, boleh disebutkan *Nama Lengkapnya*, Kak?"
      );

    } else if (existingLead.name.includes("WA Lead")) {
      // SKENARIO 2: MENANGKAP NAMA LENGKAP
      await prisma.lead.update({
        where: { id: existingLead.id },
        data: { name: message.trim() },
      });
      console.log(`✨ [WABLAS] LEAD UPDATE NAMA: ${cleanPhoneNumber} -> ${message.trim()}`);
      
      // Opsional: Balas ucapan terima kasih
      await sendWablasMessage(
        cleanPhoneNumber, 
        `Terima kasih, Kak ${message.trim()}! Admin kami akan segera merespons pertanyaan Kakak. Mohon ditunggu ya! 🙏`
      );

    } else {
      // SKENARIO 3: LEAD LAMA CHAT LAGI (Abaikan atau update log notes)
      console.log(`♻️ [WABLAS] CHAT DARI LEAD LAMA (${existingLead.name}): ${message.substring(0,20)}...`);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Wablas Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
