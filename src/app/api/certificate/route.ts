import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatScore(score: number) {
  return Number.isInteger(score) ? score.toString() : score.toFixed(1).replace('.', ',');
}

function convertScore(tutorScore: number) {
  if (tutorScore > 10) {
    const score10 = Math.round((tutorScore / 10) * 10) / 10;
    let grade = "E";
    if (tutorScore >= 85) grade = "A";
    else if (tutorScore >= 70) grade = "B";
    else if (tutorScore >= 55) grade = "C";
    else if (tutorScore >= 40) grade = "D";
    return { score: score10, grade };
  }
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized. Harap login kembali.", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enrollmentIdParam = searchParams.get("enrollmentId");

    // =====================================================================
    // 1. FETCH CERTIFICATE & ENROLLMENT FROM DATABASE
    // =====================================================================
    let certificate = await prisma.certificate.findFirst({
      where: enrollmentIdParam
        ? { enrollmentId: enrollmentIdParam }
        : { enrollment: { userId: session.user.id } },
      orderBy: { issuedAt: "desc" },
      include: {
        enrollment: {
          include: {
            user: {
              include: {
                attendances: {
                  where: { status: "PRESENT" },
                },
              },
            },
          },
        },
      },
    });

    // Fallback: if enrollment was approved before Certificate table existed, auto-create the Certificate record
    if (!certificate) {
      const approvedEnrollment = await prisma.enrollment.findFirst({
        where: enrollmentIdParam
          ? { id: enrollmentIdParam, isCertificateApproved: true }
          : { userId: session.user.id, isCertificateApproved: true },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            include: {
              attendances: {
                where: { status: "PRESENT" },
              },
            },
          },
        },
      });

      if (!approvedEnrollment) {
        return new NextResponse("E-Certificate belum tersedia untuk Anda.", { status: 403 });
      }

      const branchName = (approvedEnrollment.user?.branch || "KARTASURA").toUpperCase().substring(0, 3);
      const dateStr = new Date().toISOString().slice(2, 7).replace('-', '');
      const count = (await prisma.certificate.count()) + 1;
      const certNumber = `KIS/${branchName}/${dateStr}/${count.toString().padStart(4, '0')}`;

      certificate = await prisma.certificate.create({
        data: {
          enrollmentId: approvedEnrollment.id,
          certificateNumber: certNumber,
          finalScore: approvedEnrollment.certificateScore ?? 0,
        },
        include: {
          enrollment: {
            include: {
              user: {
                include: {
                  attendances: {
                    where: { status: "PRESENT" },
                  },
                },
              },
            },
          },
        },
      });
    }

    const enrollment = certificate.enrollment;
    const student = enrollment.user;

    // Security check: if user is a STUDENT, ensure they own this certificate
    if (session.user.role === "STUDENT" && enrollment.userId !== session.user.id) {
      return new NextResponse("Forbidden.", { status: 403 });
    }

    // =====================================================================
    // 2. CALCULATE COMPONENT SCORES & GRADES
    // =====================================================================
    let sumFluency = 0;
    let sumPronunciation = 0;
    let sumVocabulary = 0;
    let validEvaluationCount = 0;

    student.attendances.forEach((att) => {
      const hasScores =
        (att.fluency && att.fluency > 0) ||
        (att.pronunciation && att.pronunciation > 0) ||
        (att.vocabulary && att.vocabulary > 0);

      if (hasScores) {
        sumFluency += att.fluency || 0;
        sumPronunciation += att.pronunciation || 0;
        sumVocabulary += att.vocabulary || 0;
        validEvaluationCount++;
      }
    });

    const avgFluency =
      certificate.fluencyScore ??
      (validEvaluationCount > 0 ? sumFluency / validEvaluationCount : 0);
    const avgPronunciation =
      certificate.pronunciationScore ??
      (validEvaluationCount > 0 ? sumPronunciation / validEvaluationCount : 0);
    const avgVocab =
      certificate.vocabularyScore ??
      (validEvaluationCount > 0 ? sumVocabulary / validEvaluationCount : 0);

    // =====================================================================
    // 3. LOAD PDF TEMPLATE & FONTS
    // =====================================================================
    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      "certificate-template.pdf"
    );

    let pdfDoc: PDFDocument;

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

    const drawCenter = (
      text: string,
      centerX: number,
      y: number,
      size: number,
      textFont: any,
      textColor = rgb(0, 0, 0)
    ) => {
      const textWidth = textFont.widthOfTextAtSize(text, size);
      page.drawText(text, { x: centerX - textWidth / 2, y, size, font: textFont, color: textColor });
    };

    // =====================================================================
    // 4. DRAW STUDENT INFO — A4 Portrait (595 x 842)
    // =====================================================================

    // 1. NAMA MURID
    drawCenter(student.name, pageWidth / 2, 590, 24, font);

    // 2. NOMOR REGISTRASI / SERTIFIKAT
    page.drawText(certificate.certificateNumber, {
      x: 268,
      y: 551,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    // 3. NAMA PROGRAM
    const rawProgramName = enrollment.programType || "General Program";
    const displayProgramName =
      rawProgramName.toLowerCase() === "asrama" ? "English Camp" : rawProgramName;

    drawCenter(displayProgramName, pageWidth / 2, 495, 22, font);

    // =====================================================================
    // 5. DRAW SCORE TABLE
    // =====================================================================
    const colScoreCenterX = 270;
    const scoreSize = 15;

    const prog = rawProgramName.toUpperCase();
    const isExamScale = prog.includes("EFK") || prog.includes("EFT");

    let pronDisplay: string;
    let vocabDisplay: string;
    let fluencyDisplay: string;
    let totalDisplay: string;

    if (isExamScale) {
      const getExamGrade = (score: number) => {
        if (score >= 90) return "A";
        if (score >= 80) return "B";
        if (score >= 70) return "C";
        if (score >= 60) return "D";
        return "E";
      };

      const pScore = Math.round(avgPronunciation || certificate.finalScore);
      const vScore = Math.round(avgVocab || certificate.finalScore);
      const fScore = Math.round(avgFluency || certificate.finalScore);
      const totalVal = certificate.finalScore > 0 ? Math.round(certificate.finalScore) : Math.round((pScore + vScore + fScore) / 3);

      pronDisplay = `${formatScore(pScore)} / ${getExamGrade(pScore)}`;
      vocabDisplay = `${formatScore(vScore)} / ${getExamGrade(vScore)}`;
      fluencyDisplay = `${formatScore(fScore)} / ${getExamGrade(fScore)}`;
      totalDisplay = `${formatScore(totalVal)} / ${getExamGrade(totalVal)}`;
    } else {
      const pronScore = convertScore(avgPronunciation);
      const vocabScore = convertScore(avgVocab);
      const fluencyScore = convertScore(avgFluency);

      const getGrade10 = (score: number) => {
        if (score >= 8) return "A";
        if (score >= 6) return "B";
        if (score >= 4) return "C";
        if (score > 0) return "D";
        return "E";
      };

      const totalConverted =
        certificate.finalScore && certificate.finalScore >= 1 && certificate.finalScore <= 5
          ? convertScore(certificate.finalScore)
          : {
              score: Math.round((pronScore.score + vocabScore.score + fluencyScore.score) / 3),
              grade: getGrade10(Math.round((pronScore.score + vocabScore.score + fluencyScore.score) / 3)),
            };

      pronDisplay = `${formatScore(pronScore.score)} / ${pronScore.grade}`;
      vocabDisplay = `${formatScore(vocabScore.score)} / ${vocabScore.grade}`;
      fluencyDisplay = `${formatScore(fluencyScore.score)} / ${fluencyScore.grade}`;
      totalDisplay = `${formatScore(totalConverted.score)} / ${totalConverted.grade}`;
    }

    drawCenter(pronDisplay, colScoreCenterX, 400, scoreSize, font);
    drawCenter(vocabDisplay, colScoreCenterX, 362, scoreSize, font);
    drawCenter(fluencyDisplay, colScoreCenterX, 325, scoreSize, font);

    // Total Score (White text inside dark badge)
    drawCenter(totalDisplay, colScoreCenterX, 287, scoreSize, font, rgb(1, 1, 1));

    // =====================================================================
    // 6. TANGGAL CETAK (ISSUED AT)
    // =====================================================================
    const issueDate = certificate.issuedAt ? new Date(certificate.issuedAt) : new Date();
    const printDate = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(issueDate);

    page.drawText(printDate, {
      x: 286,
      y: 232.3,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // =====================================================================
    // 7. SERIALIZE & RETURN BUFFER
    // =====================================================================
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Sertifikat_${student.name.replace(/\s+/g, "_")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Error:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
