export type EvaluationAspect =
  | "listening"
  | "speaking"
  | "reading"
  | "pronunciation"
  | "vocabulary";

export const SCORE_OPTIONS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0] as const;

export const GENERAL_GRADES: Record<string, { label: string; description: string }> = {
  "1.0": { label: "Absolute Beginner", description: "Mulai belajar bahasa Inggris dari nol." },
  "1.5": { label: "Beginner", description: "Mulai mengenali kemampuan dan kosakata dasar." },
  "2.0": { label: "Basic", description: "Mampu menggunakan kemampuan sederhana." },
  "2.5": { label: "Basic Developing", description: "Mulai berkembang, tetapi belum konsisten." },
  "3.0": { label: "Intermediate", description: "Mampu berkomunikasi dalam situasi umum." },
  "3.5": { label: "Intermediate Developing", description: "Semakin lancar dan mandiri." },
  "4.0": { label: "Upper Intermediate", description: "Lancar dan cukup akurat." },
  "4.5": { label: "Advanced", description: "Sangat lancar dengan sedikit kekurangan." },
  "5.0": { label: "Excellent / Proficient", description: "Sangat fasih, akurat, dan hampir tanpa kesalahan." },
};

export const EVALUATION_RUBRIC: Record<EvaluationAspect, Record<string, string>> = {
  listening: {
    "1.0": "Mulai memiliki pemahaman terhadap beberapa kata dasar, dan ini menjadi langkah awal yang baik untuk meningkatkan kemampuan listening.",
    "1.5": "Menguasai beberapa kata dan ungkapan sederhana dalam bahasa Inggris, meskipun masih membutuhkan pengulangan saat mendengarkan.",
    "2.0": "Memahami kata dan kalimat sederhana, terutama ketika disampaikan dengan tempo yang perlahan.",
    "2.5": "Memahami percakapan sederhana dengan topik yang familiar, meskipun terkadang masih membutuhkan pengulangan.",
    "3.0": "Sudah cukup mampu memahami percakapan sehari-hari dengan tempo normal, meskipun beberapa kosakata baru masih menjadi tantangan.",
    "3.5": "Kemampuan listening siswa semakin berkembang dan sudah bisa mengikuti sebagian besar percakapan dengan topik yang beragam. Juga mulai lebih mudah memahami informasi tanpa harus terlalu sering meminta pengulangan.",
    "4.0": "Siswa memiliki kemampuan listening yang baik dan mampu memahami percakapan dengan berbagai topik. Perkembangan terlihat dari kemampuan menangkap informasi secara lebih detail serta memahami ungkapan yang lebih bervariasi.",
    "4.5": "Siswa sudah mampu memahami percakapan yang cukup kompleks dengan baik, termasuk ketika menggunakan kosakata atau ungkapan yang kurang familiar. Kemampuan menangkap detail dan memahami maksud pembicaraan juga sudah sangat baik.",
    "5.0": "Siswa menunjukkan kemampuan listening yang sangat baik dan mampu memahami percakapan bahasa Inggris secara alami dalam berbagai situasi. Pemahaman terhadap detail, konteks, dan maksud pembicaraan juga sudah sangat konsisten.",
  },
  speaking: {
    "1.0": "Mampu menggunakan kata dan ungkapan sederhana untuk memperkenalkan diri serta menyampaikan kebutuhan dasar.",
    "1.5": "Siswa mampu menggunakan beberapa ungkapan sederhana, meskipun masih membutuhkan banyak arahan untuk menyusun kalimat. Keberanian untuk mencoba berbicara juga mulai terlihat.",
    "2.0": "Siswa sudah mulai mampu membuat kalimat sederhana untuk menyampaikan informasi dasar, meskipun masih terdapat beberapa kesalahan dalam pemilihan kata.",
    "2.5": "Siswa sudah bisa mengikuti percakapan sederhana dan mulai mampu menyampaikan pendapat pribadi. Kelancaran berbicara masih perlu ditingkatkan, tetapi perkembangan dalam merespons pertanyaan sudah mulai terlihat.",
    "3.0": "Sudah cukup mampu berkomunikasi dalam situasi sehari-hari dan menyampaikan ide dengan kalimat yang lebih terstruktur. Kepercayaan diri dan kemampuan merespons lawan bicara juga semakin berkembang.",
    "3.5": "Kelancaran saat menyampaikan pendapat sudah cukup baik dan mampu menyampaikan pendapat dengan lebih jelas. Kemampuan mengembangkan jawaban dan mempertahankan percakapan juga mengalami peningkatan.",
    "4.0": "Siswa sudah mampu berbicara dengan cukup lancar dan percaya diri dalam berbagai topik pembicaraan. Penyampaian ide semakin terstruktur, dengan susunan kata dan vocabulary yang semakin baik.",
    "4.5": "Siswa menunjukkan kemampuan speaking yang sangat baik dan mampu mengikuti percakapan dengan lancar serta natural. Siswa juga semakin terampil dalam mengembangkan ide dan membahas topik yang lebih kompleks.",
    "5.0": "Siswa memiliki kemampuan speaking yang sangat fasih, natural, dan terstruktur. Siswa mampu menyampaikan berbagai ide dengan percaya diri, pemilihan kata yang tepat, serta kesalahan penyusunan kalimat yang sangat minim.",
  },
  reading: {
    "1.0": "Mengenali beberapa kata sederhana dari topik yang dibahas di kelas.",
    "1.5": "Siswa mulai mampu mengenali beberapa kosakata umum, meskipun masih membutuhkan bantuan untuk memahami kalimat sederhana. Kemampuan membaca kata dan ungkapan pendek juga mulai berkembang.",
    "2.0": "Siswa sudah mulai memahami kalimat sederhana dan bacaan pendek dengan kosakata yang familiar. Kemampuan menemukan informasi dasar dari sebuah teks juga semakin baik.",
    "2.5": "Siswa mulai bisa memahami bacaan pendek dengan topik yang familiar, meskipun beberapa kosakata baru masih menjadi tantangan.",
    "3.0": "Siswa sudah cukup mampu memahami isi teks singkat dan pertanyaan yang didiskusikan di kelas serta memberikan respon yang sesuai.",
    "3.5": "Siswa menunjukkan pemahaman bacaan yang semakin baik dan mulai mampu memahami teks dengan struktur kalimat yang lebih bervariasi. Kemampuan menemukan detail serta menyimpulkan informasi dari bacaan juga mengalami peningkatan.",
    "4.0": "Siswa sudah memiliki kemampuan reading yang baik, memahami isi teks bacaan dengan cukup baik dan minim memerlukan bantuan.",
    "4.5": "Siswa sudah memiliki kemampuan reading yang baik, memahami isi teks bacaan dengan cukup baik dan minim memerlukan bantuan, serta mampu menyampaikan isi teks dengan bahasa sendiri.",
    "5.0": "Siswa menunjukkan kemampuan reading yang sangat baik serta mampu menangkap detail, menyimpulkan informasi, dan memahami makna tersirat secara mandiri.",
  },
  pronunciation: {
    "1.0": "Pengucapan beberapa kata sederhana masih perlu diulang kembali dan latihan secara konsisten akan sangat membantu perkembangan.",
    "1.5": "Siswa mulai bisa mengucapkan beberapa kosakata sederhana, meskipun masih terdapat kesulitan pada bunyi tertentu.",
    "2.0": "Siswa sudah mampu mengucapkan banyak kosakata dasar, meskipun beberapa pengucapan masih terdengar seperti penulisannya. Ada perkembangan dalam kejelasan pengucapan kata-kata yang sering digunakan.",
    "2.5": "Pengucapan siswa mulai terdengar lebih jelas dan sebagian besar kosakata familiar sudah bisa diucapkan dengan cukup baik. Beberapa bunyi, penekanan kata, dan intonasi masih perlu dilatih agar komunikasi semakin mudah dipahami.",
    "3.0": "Pengucapan yang cukup jelas dan dapat dipahami dalam percakapan sehari-hari. Perkembangan terlihat dari pengucapan kata yang semakin konsisten, meskipun beberapa bagian masih perlu diperbaiki.",
    "3.5": "Pengucapan semakin baik dan mulai terdengar lebih natural saat berbicara. Penggunaan penekanan kata dan intonasi juga menunjukkan perkembangan.",
    "4.0": "Siswa memiliki pengucapan yang baik dan mampu menyampaikan kalimat dengan cukup jelas serta natural. Penguasaan bunyi, penekanan kata, dan intonasi juga semakin konsisten.",
    "4.5": "Siswa menunjukkan kemampuan pronunciation yang sangat baik dengan pengucapan yang jelas dan natural. Kesalahan pada bunyi, penekanan kata, maupun intonasi sudah sangat minim.",
    "5.0": "Siswa memiliki kemampuan pronunciation yang sangat baik dengan pengucapan yang akurat, jelas, dan natural. Penggunaan bunyi, ritme, serta intonasi sudah sangat konsisten sehingga komunikasi dapat berlangsung dengan lancar.",
  },
  vocabulary: {
    "1.0": "Masih mengenal kosakata dasar bahasa Inggris dari awal. Sudah mulai mempelajari beberapa kata sederhana yang dapat digunakan dalam aktivitas sehari-hari.",
    "1.5": "Siswa mulai mengenali dan mengingat beberapa kosakata umum, meskipun jumlahnya masih terbatas. Mampu menggunakan beberapa kata tersebut dalam kalimat sederhana.",
    "2.0": "Sudah memiliki dasar kosakata yang cukup untuk menyampaikan informasi sederhana. Kemampuan mengingat dan menggunakan kata-kata yang sering dijumpai juga semakin berkembang.",
    "2.5": "Kosakata mulai bertambah dan sudah bisa digunakan untuk membahas beberapa topik familiar. Siswa masih perlu berlatih agar lebih mudah menemukan kata yang tepat ketika berbicara.",
    "3.0": "Siswa sudah memiliki kosakata yang cukup untuk mengikuti percakapan sehari-hari dan menyampaikan pendapat sederhana. Penggunaan variasi kata dan ungkapan juga mulai berkembang.",
    "3.5": "Penguasaan kosakata sudah cukup baik dan mulai mampu menggunakan pilihan kata yang lebih bervariasi. Siswa juga semakin mudah menyampaikan ide tanpa terlalu sering mengulang kata yang sama.",
    "4.0": "Penguasaan vocabulary yang baik dan mampu menggunakan kosakata sesuai dengan konteks pembicaraan. Perkembangan terlihat dari penggunaan kata dan ungkapan yang semakin beragam serta tepat.",
    "4.5": "Siswa sudah memiliki perbendaharaan kosakata yang luas dan mampu menggunakan ungkapan yang lebih bervariasi. Pemilihan kata juga semakin tepat sehingga penyampaian ide terdengar lebih natural.",
    "5.0": "Siswa menunjukkan penguasaan vocabulary yang sangat baik dengan pilihan kata yang luas, tepat, dan natural. Siswa mampu menggunakan berbagai ungkapan sesuai konteks serta menyampaikan ide yang kompleks dengan sangat baik.",
  },
};

export function getRubricDescription(aspect: EvaluationAspect, score: number): string {
  const key = (Math.round(score * 2) / 2).toFixed(1);
  return EVALUATION_RUBRIC[aspect]?.[key] ?? "";
}

export function getGeneralGrade(averageScore: number) {
  const key = (Math.round(averageScore * 2) / 2).toFixed(1);
  return GENERAL_GRADES[key] ?? { label: "-", description: "" };
}
