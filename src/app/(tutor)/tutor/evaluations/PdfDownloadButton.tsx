"use client";

import React, { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { EvaluationPdfTemplate, type PdfData } from "./EvaluationPdfTemplate";

export default function PdfDownloadButton({ 
  student, 
  data,
  disabled 
}: { 
  student: any, 
  data: PdfData,
  disabled: boolean
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      // Dynamically import to avoid Next.js SSR issues with Node APIs in react-pdf
      const { pdf } = await import('@react-pdf/renderer');
      
      const blob = await pdf(<EvaluationPdfTemplate data={data} />).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${student?.name ? student.name.replace(/\s+/g, '_') : "Student"}_Evaluation.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Gagal membuat PDF. Periksa console log.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || isGenerating}
      className="px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
    >
      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      Download PDF
    </button>
  );
}
