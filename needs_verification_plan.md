# Analisis Data Model & Rencana Implementasi Fitur "Butuh Verifikasi"

## 1. Analisis Data Model (`schema.prisma`)
Berdasarkan pengecekan pada `schema.prisma`, siklus status Lead dan verifikasi pembayaran dicatat secara relasional antara model `Lead` dan `Invoice`.

Transisi state dari A (Dikirim Link) ke B (Sudah Mengisi) ke C (Terverifikasi) bekerja sebagai berikut:
- **State A (Link Dikirim):** `Lead` memiliki status `FOLLOW_UP` atau `NEGOTIATION`. Saat sistem membuatkan link pembayaran, sebuah `Invoice` dibuat dengan `status: PENDING`.
- **State B (Needs Verification):** Saat siswa mengunggah bukti bayar, sistem akan mengubah status `Invoice` tersebut menjadi `WAITING_CONFIRMATION` (dan mengisi atribut `paymentProof`). Posisi `Lead.status` mungkin masih `NEGOTIATION`.
- **State C (Verified):** Saat Admin menyetujui, `Invoice.status` berubah menjadi `PAID` atau `DP_PAID`, lalu `Lead.status` diupdate menjadi `CLOSED_WON`.

**Kesimpulan Model:** 
Lead yang "Butuh Verifikasi" dapat diidentifikasi secara pasti dengan mencari Lead yang memiliki relasi `Invoice` dengan `status == "WAITING_CONFIRMATION"`.

## 2. Rencana Implementasi UI/UX

Mengubah `orderBy` (sorting) di Prisma agar mengutamakan relasi bersyarat sangat membebani *database* dan hampir tidak mungkin dilakukan tanpa *Raw SQL* yang rumit (merusak sistem pagination yang baru kita buat). 

**Solusi Terbaik:** Kita akan membuat Tab Filter baru yang didedikasikan khusus sebagai *"Inbox"* bagi admin untuk membersihkan antrean verifikasi.

### Langkah-langkah Implementasi:

1. **Update Tab Filter di Client (`CRMTable.tsx`):**
   Tambahkan tab baru di daftar `STATUS_FILTERS` (di sebelah "Semua Lead"):
   ```typescript
   { id: "WAITING_CONFIRMATION", label: "🚨 Butuh Verifikasi" }
   ```

2. **Update Logika Pencarian Server (`page.tsx`):**
   Tangkap apabila `statusStr === "WAITING_CONFIRMATION"`. Ubah logika `whereClause` dari sekadar mengecek status `Lead` menjadi pengecekan relasi `invoices`:
   ```typescript
   if (statusStr === "WAITING_CONFIRMATION") {
     whereClause.invoices = {
       some: { status: "WAITING_CONFIRMATION" }
     };
   } else if (statusStr) {
     whereClause.status = statusStr;
   }
   ```

3. **Penanda Visual (Opsional namun sangat disarankan):**
   - Di dalam komponen `CRMTable.tsx`, saat me-render baris tabel, kita beri penanda khusus (seperti dot merah atau *badge*) pada nama Lead jika salah satu dari `invoices`-nya berstatus `WAITING_CONFIRMATION`, sehingga admin yang berada di tab "Semua Lead" tetap bisa menyadari keberadaan mereka.

Pendekatan ini menjamin database tetap ringan (Data Diet dan Pagination tetap terjaga) sembari memberikan alur kerja (UX) yang sangat jelas bagi Admin untuk menyelesaikan tugas *bottleneck* (verifikasi).
