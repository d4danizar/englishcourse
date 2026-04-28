export const getProgramGradingScale = (programName?: string | null) => {
  const cleanName = String(programName || "").toUpperCase();
  const isExamScale = cleanName.includes('EFK') || cleanName.includes('EFT');
  return {
    maxScore: isExamScale ? 100 : 5,
    isExamScale
  };
};

export const calculatePredicate = (score: number, programName?: string | null) => {
  const { isExamScale } = getProgramGradingScale(programName);
  
  if (isExamScale) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
  } else {
    // Standard 1-5 scale
    if (score >= 4.5) return 'A';
    if (score >= 3.5) return 'B';
    if (score >= 2.5) return 'C';
    if (score >= 1.5) return 'D';
    return 'E';
  }
};
