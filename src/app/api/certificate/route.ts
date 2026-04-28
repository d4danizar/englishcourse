import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateCertificateData } from "@/app/(student)/student/certificate/actions";

const BRANCH_CODES: Record<string, string> = {
  'Kartasura': '01',
  'Serengan': '02',
  'Nusukan': '03',
};

const PROGRAM_CODES: Record<string, string> = {
  'Conversation Regular Class': '01',
  'Conversation Fullday Class': '02',
  'English Camp Programme': '03',
  'English Camp': '03',
  'Camp': '03',
  'Asrama': '03',
  'English On Saturday': '04',
  'TOEFL Preparation': '11',
  'English Private Class': '12',
  'English For Kids': '21',
  'EFK': '21',
  'English For Teens': '22',
  'EFT': '22',
  'Gapyear Program 6 bulan': '31',
  'English Camp 1 Tahun': '32',
  'English Holiday': '41',
  'English Workshop': '42',
  'English Fun Day': '99',
  'TOEFL Test': '88'
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized. Harap login kembali.", { status: 401 });
    }

    // =====================================================================
    // 1. DYNAMIC DATA FETCH
    // =====================================================================
    const data = await generateCertificateData(session.user.id);

    if (!data.isEligible) {
      return new NextResponse("E-Certificate belum tersedia untuk Anda.", { status: 403 });
    }

    const { student, scores } = data;

    function formatScore(score: number) {
      return Number.isInteger(score) ? score.toString() : score.toFixed(1).replace('.', ',');
    }

    function convertScore(tutorScore: number) {
      const roundedScore = Math.round(tutorScore);
      switch (roundedScore) {
        case 5: return { score: 9, grade: 'A' };
        case 4: return { score: 7, grade: 'B' };
        case 3: return { score: 5, grade: 'C' };
        case 2: return { score: 3, grade: 'D' };
        case 1: return { score: 1, grade: 'E' };
        default: return { score: 0, grade: '-' };
      }
    }

    // =====================================================================
    // 2. DYNAMIC CERTIFICATE NUMBER GENERATOR
    // =====================================================================
    const certDate = new Date(student.endDate || new Date());
    const dd = String(certDate.getDate()).padStart(2, '0');
    const mm = String(certDate.getMonth() + 1).padStart(2, '0');
    const yy = String(certDate.getFullYear()).slice(-2);

    const rawBranch = student.branch || "KARTASURA";
    const rawProgram = student.activeProgram || "";

    // Normalize branch from enum (e.g. KARTASURA -> Kartasura)
    const formattedBranch = rawBranch.charAt(0).toUpperCase() + rawBranch.slice(1).toLowerCase();
    const branchCode = BRANCH_CODES[formattedBranch] || '00';

    let programCode = '00';
    for (const [key, code] of Object.entries(PROGRAM_CODES)) {
      if (rawProgram.toLowerCase().includes(key.toLowerCase())) {
        programCode = code;
        break;
      }
    }

    const sequence = String(student.id.replace(/\D/g, '').slice(-4)).padStart(4, '0');
    const certificateNumber = `${dd}${mm}${yy}${branchCode}${programCode}${sequence}`;

    // =====================================================================
    // 2. LOAD PDF TEMPLATE
    // =====================================================================
    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      "certificate-template.pdf"
    );

    let pdfDoc: any;

    if (fs.existsSync(templatePath)) {
      const existingPdfBytes = fs.readFileSync(templatePath);
      pdfDoc = await PDFDocument.load(existingPdfBytes);
    } else {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([595.28, 841.89]);
    }

    pdfDoc.registerFontkit(fontkit);

    const regularFontPath = path.join(process.cwd(), "public", "fonts", "PlusJakartaSans-Regular.ttf");
    const boldFontPath = path.join(process.cwd(), "public", "fonts", "PlusJakartaSans-Bold.ttf");

    const regularFontBytes = fs.readFileSync(regularFontPath);
    const boldFontBytes = fs.readFileSync(boldFontPath);

    const normalFont = await pdfDoc.embedFont(regularFontBytes);
    const font = await pdfDoc.embedFont(boldFontBytes);

    const page = pdfDoc.getPages()[0];
    const { width: pageWidth } = page.getSize();

    const drawCenter = (text: string, centerX: number, y: number, size: number, textFont: any, textColor = rgb(0, 0, 0)) => {
      const textWidth = textFont.widthOfTextAtSize(text, size);
      page.drawText(text, { x: centerX - (textWidth / 2), y, size, font: textFont, color: textColor });
    };

    // =====================================================================
    // 3. DRAW STUDENT INFO
    // =====================================================================
    drawCenter(student.name, pageWidth / 2, 590, 24, font);

    // ID REGISTRASI
    page.drawText(certificateNumber, {
      x: 268,
      y: 551,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    // --- PROGRAM MAPPER ---
    const rawProgramName = student.activeProgram || "General Program";
    const displayProgramName = rawProgramName.toLowerCase() === "asrama"
      ? "English Camp"
      : rawProgramName;

    drawCenter(displayProgramName, pageWidth / 2, 495, 22, font);

    // =====================================================================
    // 4. DRAW SCORE TABLE 
    // =====================================================================
    const colScoreCenterX = 270;
    const scoreSize = 15;

    // === SCORE RADAR (remove after debugging) ===
    console.log("=== 🎯 CERT SCORE RADAR ===", {
      rawPronunciation: scores.pronunciation,
      rawVocabulary: scores.vocabulary,
      rawFluency: scores.fluency,
      rawOverall: scores.overall,
      rawPredicate: scores.predicate,
      typeCheck: typeof scores.pronunciation,
    });

    const safePronunciation = Number(scores.pronunciation) || 0;
    const safeVocabulary = Number(scores.vocabulary) || 0;
    const safeFluency = Number(scores.fluency) || 0;

    const prog = (student.activeProgram || "").toUpperCase();
    const isExamScale = prog.includes("EFK") || prog.includes("EFT");

    let pronScore, vocabScore, fluencyScore, rawTotal, totalGrade;

    if (isExamScale) {
      const getExamGrade = (score: number) => {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'E';
      };
      
      pronScore = { score: Math.round(safePronunciation), grade: getExamGrade(safePronunciation) };
      vocabScore = { score: Math.round(safeVocabulary), grade: getExamGrade(safeVocabulary) };
      fluencyScore = { score: Math.round(safeFluency), grade: getExamGrade(safeFluency) };
      rawTotal = Math.round(scores.overall || 0);
      totalGrade = scores.predicate || 'E';
    } else {
      pronScore = convertScore(safePronunciation);
      vocabScore = convertScore(safeVocabulary);
      fluencyScore = convertScore(safeFluency);
      rawTotal = Math.round((pronScore.score + vocabScore.score + fluencyScore.score) / 3);
      totalGrade = 'E';
      if (rawTotal >= 8) totalGrade = 'A';
      else if (rawTotal >= 6) totalGrade = 'B';
      else if (rawTotal >= 4) totalGrade = 'C';
      else if (rawTotal > 0) totalGrade = 'D';
    }

    drawCenter(`${pronScore.score} / ${pronScore.grade}`, colScoreCenterX, 400, scoreSize, font);
    drawCenter(`${vocabScore.score} / ${vocabScore.grade}`, colScoreCenterX, 362, scoreSize, font);
    drawCenter(`${fluencyScore.score} / ${fluencyScore.grade}`, colScoreCenterX, 325, scoreSize, font);

    // Total Score (using newly mapped 1-9 scale)
    drawCenter(`${rawTotal} / ${totalGrade}`, colScoreCenterX, 287, scoreSize, font, rgb(1, 1, 1));

    // =====================================================================
    // 5. PRINT DATE
    // =====================================================================
    const completionDate = student.endDate ? new Date(student.endDate) : new Date();
    const printDate = new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(completionDate).replace(',', '');

    page.drawText(printDate, {
      x: 286, y: 232.3, size: 12, font, color: rgb(0, 0, 0),
    });

    // =====================================================================
    // 6. SERIALIZE & RETURN
    // =====================================================================
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="e-certificate-${student.name.replace(/\s+/g, '-')}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Error:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
