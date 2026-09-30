# Laporan Analisis Alur Pendaftaran & Harga (Repeat Order)

Berdasarkan penelusuran pada seluruh modul pendaftaran dan mesin penentuan harga (*Pricing Engine*), berikut adalah analisis mendalam mengenai penambahan program **"English on Saturday"** pada formulir *Repeat Order* / Renewal.

---

## 1. Program Dropdown (`renewProgram` UI)
- **Lokasi:** File `src/app/(admin)/admin/enrollments/EnrollmentTabs.tsx` (sekitar baris 348).
- **Status Saat Ini:** Daftar pilihan program saat ini berupa array tag `<option>` yang di-*hardcode* langsung di dalam komponen `<select>`. Tidak diambil dari konstanta pusat maupun database.
- **Tindakan yang Diperlukan:** Kita harus menambahkan baris `<option value="English on Saturday">English on Saturday</option>` secara manual ke dalam formulir tersebut agar admin bisa memilihnya.

## 2. Pricing Engine (`calculateFinalPrice` di `pricing.ts`)
- **Lokasi:** File `src/lib/utils/pricing.ts`.
- **Status Saat Ini:** Berita baik! Mesin harga **sudah mendukung** program "English on Saturday". Terdapat blok kode bawaan (logika *switch-case*) yang akan otomatis mengembalikan harga *base price* sebesar **Rp 850.000**.
- **Kebutuhan Parameter:** Blok harga untuk program ini mandiri; ia tidak memerlukan parameter ekstra seperti `duration` (durasi bulan/minggu) ataupun `membershipPackage` (paket membership).

## 3. State & Validation (Kondisi Kritis)
- **Validasi UI Saat Ini:** Pada fungsi `handleRenewSubmit` di `EnrollmentTabs.tsx`, terdapat aturan ketat:
  ```typescript
  if (renewProgram !== "Membership" && (!renewDuration)) {
    alert("Harap lengkapi durasi.");
    return;
  }
  ```
  Ini berarti **semua program selain Membership saat ini diwajibkan mengisi durasi**. Jika admin memilih "English on Saturday", sistem akan memblokir *submit* dan memaksa admin untuk memilih durasi palsu (misalnya "1 Bulan").
- **Logika Backend (Sangat Aman):** Meskipun UI memaksa durasi, fungsi `calculateEndDate` di `src/lib/offday-utils.ts` ternyata sudah memiliki blok *Smart Calendar* khusus untuk "English on Saturday". Sistem akan secara otomatis mengabaikan input durasi dari UI dan menghitung tanggal kedaluwarsa (*end date*) tepat 8 pertemuan (melompati hari libur).
- **Tindakan yang Diperlukan:** Saat kita memodifikasi UI nanti, kita harus mengecualikan "English on Saturday" dari kewajiban mengisi `renewDuration`, serta menyembunyikan kolom (dropdown) durasi jika program ini dipilih.

## 4. Database Enum (`schema.prisma`)
- **Status Saat Ini:** Program *Type* atau *Name* pada model `Enrollment` dan `Invoice` di dalam database disimpan murni sebagai teks biasa (`String`). Tidak ada batasan `Enum` yang kaku pada level *database*.
- **Tindakan yang Diperlukan:** **Nihil.** Kita tidak perlu menjalankan perintah *migrate* database apa pun.

---

### Kesimpulan & Rekomendasi Eksekusi
Infrastruktur *backend* (harga dan kalender) sudah 100% siap untuk menampung program "English on Saturday". Perubahan yang harus kita lakukan murni hanya di sisi **Frontend (UI)** pada file `EnrollmentTabs.tsx`, yaitu:
1. Menyisipkan "English on Saturday" ke dalam `<select>` opsi program.
2. Menyembunyikan *dropdown* Durasi jika "English on Saturday" dipilih.
3. Melonggarkan baris validasi *submit* agar tidak meminta durasi untuk program ini. 

Jika Anda setuju dengan analisis ini, beri tahu saya agar saya dapat langsung mengaplikasikan kodenya pada `EnrollmentTabs.tsx`!
