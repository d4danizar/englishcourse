import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

// Grade conversion (scale 1-10)
function getGrade(score: number): string {
  if (score >= 8) return "A";
  if (score >= 6) return "B";
  if (score >= 4) return "C";
  return "D";
}

export async function GET() {
  try {
    // =====================================================================
    // 1. MOCK DATA
    // =====================================================================
    const mockData = {
      name: "BIMA ARYA PRATAMA",
      regNumber: "REG-2026-0042",
      program: "Conversation (Regular)",
    };

    // Mock Friday Evaluation Scores (Weekly)
    const weeklyScores = [
      { week: 1, pronunciation: 8, vocabulary: 7, fluency: 8 },
      { week: 2, pronunciation: 8, vocabulary: 8, fluency: 7 },
      { week: 3, pronunciation: 9, vocabulary: 7, fluency: 8 },
      { week: 4, pronunciation: 9, vocabulary: 8, fluency: 9 },
    ];

    // =====================================================================
    // 2. CALCULATE AVERAGES & GRADES
    // =====================================================================
    const avg = (key: "pronunciation" | "vocabulary" | "fluency") =>
      weeklyScores.reduce((sum, week) => sum + week[key], 0) / weeklyScores.length;

    const finalScores = {
      pronunciation: avg("pronunciation"),
      vocabulary: avg("vocabulary"),
      fluency: avg("fluency"),
    };

    const totalScore =
      (finalScores.pronunciation + finalScores.vocabulary + finalScores.fluency) / 3;

    function getGrade(score: number) {
      if (score >= 8) return "A";
      if (score >= 6) return "B";
      if (score >= 4) return "C";
      return "D";
    }

    function formatScore(score: number) {
      // Jika angka bulat (misal 8.0), kembalikan "8". 
      // Jika desimal (misal 8.5), kembalikan "8,5".
      return Number.isInteger(score) ? score.toString() : score.toFixed(1).replace('.', ',');
    }

    // =====================================================================
    // 3. LOAD PDF TEMPLATE
    // =====================================================================
    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      "certificate-template.pdf"
    );

    let pdfDoc: any; // Type as needed, using any for simplicity here

    if (fs.existsSync(templatePath)) {
      const existingPdfBytes = fs.readFileSync(templatePath);
      pdfDoc = await PDFDocument.load(existingPdfBytes);
    } else {
      // Fallback: blank A4 portrait
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([595.28, 841.89]);
    }

    // 1. Daftarkan Fontkit ke pdfDoc (WAJIB untuk custom font)
    pdfDoc.registerFontkit(fontkit);

    // 2. Baca file font dari direktori public/fonts
    const regularFontPath = path.join(process.cwd(), "public", "fonts", "PlusJakartaSans-Regular.ttf");
    const boldFontPath = path.join(process.cwd(), "public", "fonts", "PlusJakartaSans-Bold.ttf");

    const regularFontBytes = fs.readFileSync(regularFontPath);
    const boldFontBytes = fs.readFileSync(boldFontPath);

    // 3. Embed font ke dalam PDF
    const normalFont = await pdfDoc.embedFont(regularFontBytes);
    const font = await pdfDoc.embedFont(boldFontBytes); // Digunakan sebagai bold font

    const page = pdfDoc.getPages()[0];
    const { width: pageWidth } = page.getSize();

    // --- HELPER UNTUK RATA TENGAH ---
    // Tambahkan parameter textColor dengan default hitam rgb(0,0,0)
    const drawCenter = (text: string, centerX: number, y: number, size: number, textFont: any, textColor = rgb(0, 0, 0)) => {
      const textWidth = textFont.widthOfTextAtSize(text, size);
      // Ubah color di bawah ini menjadi parameter textColor
      page.drawText(text, { x: centerX - (textWidth / 2), y, size, font: textFont, color: textColor });
    };

    // =====================================================================
    // 4. DRAW STUDENT INFO — A4 Portrait (595 x 842)
    // =====================================================================

    // 1. NAMA MURID (Sudah menggunakan helper Center otomatis)
    drawCenter(mockData.name, pageWidth / 2, 590, 24, font);

    // 2. NOMOR REGISTRASI (Koordinat aslimu)
    page.drawText(mockData.regNumber, {
      x: 268,
      y: 552,
      size: 14,
      font: normalFont,
      color: rgb(0, 0, 0),
    });

    // 3. NAMA PROGRAM (Diubah jadi Dinamis Rata Tengah!)
    // Asumsi: Karena X aslimu 180, dan panjang teks "Conversation" lumayan panjang, 
    // titik tengah kertas (pageWidth / 2) biasanya pas untuk teks yang ada di tengah paragraf.
    // Jika masih kurang ke kanan/kiri, cukup ubah angka `(pageWidth / 2)` di bawah ini menjadi angka pastimu misal `280`.
    drawCenter(mockData.program, pageWidth / 2, 495, 22, font);

    // =====================================================================
    // 5. DRAW SCORE TABLE 
    // =====================================================================
    // Ini adalah tebakan titik tengah kotak kuning/biru. User akan mengkalibrasi angka ini.
    const colScoreCenterX = 270;
    const scoreSize = 12;

    // Pronunciation, Vocabulary, dan Fluency biarkan saja (otomatis akan hitam)
    drawCenter(`${formatScore(finalScores.pronunciation)} / ${getGrade(finalScores.pronunciation)}`, colScoreCenterX, 400, scoreSize, font);
    drawCenter(`${formatScore(finalScores.vocabulary)} / ${getGrade(finalScores.vocabulary)}`, colScoreCenterX, 362, scoreSize, font);
    drawCenter(`${formatScore(finalScores.fluency)} / ${getGrade(finalScores.fluency)}`, colScoreCenterX, 325, scoreSize, font);

    // Total Score: Tambahkan rgb(1, 1, 1) di parameter terakhir!
    drawCenter(`${formatScore(totalScore)} / ${getGrade(totalScore)}`, colScoreCenterX, 287, scoreSize, font, rgb(1, 1, 1));

    // =====================================================================
    // 6. TANGGAL CETAK (DYNAMIC)
    // =====================================================================
    const today = new Date();
    const printDate = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(today);

    // X dan Y tetap menggunakan koordinat asli yang sudah presisi
    page.drawText(printDate, {
      x: 285, y: 232, size: 12, font, color: rgb(0, 0, 0),
    });

    // =====================================================================
    // 7. SERIALIZE & RETURN
    // =====================================================================
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="test-certificate.pdf"',
      },
    });
  } catch (error) {
    console.error("PDF Error:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
