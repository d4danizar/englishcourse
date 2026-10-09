# Analisis Modul Evaluasi Progress Siswa (Tutor Dashboard)

Berdasarkan pemindaian terhadap basis kode, berikut adalah laporan arsitektur dan kapabilitas fitur Evaluasi Siswa saat ini.

---

## 1. Logika Pencarian Siswa (Student Fetching Logic)
**Lokasi Kode:** `src/app/(tutor)/tutor/evaluations/actions.ts` (Fungsi `getStudentsForEvaluation`)

**Status Saat Ini:**
Sistem mengambil data murid melalui Prisma dengan melakukan *filtering* (penyaringan) berdasarkan `endDate` (tanggal kedaluwarsa program). 
Kondisi (`where` clause) saat ini hanya mengizinkan murid yang masih AKTIF:
```typescript
enrollments: {
  some: {
    OR: [
      { endDate: { gte: new Date() } },
      { endDate: null }
    ],
    // ... filter program berdasarkan grup
  }
}
```

**Rencana Modifikasi:**
Untuk memasukkan siswa yang sudah *expired* (lulus/berakhir) dalam waktu **1 bulan (30 hari) terakhir**, kita perlu mengubah kondisi `gte` (Greater Than or Equal) menjadi mundur 30 hari ke belakang dari tanggal hari ini.
```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

// ...
{ endDate: { gte: thirtyDaysAgo } }
```
Hal ini akan secara otomatis menampilkan siswa yang baru saja menyelesaikan kelas dalam satu bulan terakhir di dasbor Tutor.

---

## 2. Struktur Form Evaluasi & Database (Schema)
**Lokasi Kode:** `prisma/schema.prisma` (Model `DescriptiveEvaluation`)

**Kolom Database yang Tersedia Saat Ini:**
- `fluency` (String)
- `pronunciation` (String)
- `vocabulary` (String)
- `notes` (String - Opsional, untuk pesan/catatan Tutor)
- `finalScore` (Int - Opsional, biasa digunakan untuk nilai akhir)
- `listeningScore`, `readingScore`, `writingScore` (Int - Opsional)
- Relasi: `studentId` dan `tutorId`

**Alur Penyimpanan (Submit):**
- Formulir UI saat ini mengirim data tersebut melalui *Server Action* bernama `submitDescriptiveEvaluation` yang berada di `actions.ts`.
- Fungsi ini memvalidasi input wajib (fluency, pronunciation, vocabulary) dan menyimpan baris baru ke tabel `DescriptiveEvaluation` di *database*.

---

## 3. Kapabilitas *Generate* PDF 
**Lokasi Pemeriksaan:** `package.json`

**Library yang Tersedia:**
Saat ini proyek Anda hanya menginstal:
- `pdf-lib` (^1.17.1)
- `@pdf-lib/fontkit` (^1.1.1)

**Analisis & Rekomendasi PDF:**
`pdf-lib` adalah pustaka yang luar biasa tangguh, **TETAPI** pustaka ini bekerja pada level *low-level* (harus menentukan posisi X dan Y secara manual). Pustaka ini sangat cocok jika Anda sudah memiliki **file template PDF kosong/desain baku**, lalu kita tinggal menembakkan teks (nama, nilai) ke atas posisi formulir tersebut.

Namun, jika Anda ingin **membuat PDF dari nol dengan desain HTML/CSS yang cantik** (tanpa template awal), `pdf-lib` akan sangat menyulitkan. 

Opsi yang dapat kita pilih sebelum lanjut:
1. **Opsi 1 (Gunakan `pdf-lib` yang sudah ada):** Anda siapkan *template* desain sertifikat/rapor berupa PDF kosong, lalu sistem akan mengisikan nama dan skornya saja.
2. **Opsi 2 (Instal `@react-pdf/renderer` atau `html2canvas` + `jspdf`):** Jika Anda ingin kita menyusun desain laporan (kop surat, tabel nilai, border) murni menggunakan kode dari awal agar *layout*-nya cantik dan otomatis menyesuaikan.

**Bagaimana Anda ingin melanjutkan proses PDF ini? Silakan tentukan opsi PDF dan saya akan segera mulai menulis kode untuk logika pencarian 1 bulan terakhir dan tombol PDF-nya!**
