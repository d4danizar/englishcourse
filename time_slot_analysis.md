# Laporan Analisis Penambahan Jadwal (Time Slot 16:30)

Berdasarkan pemindaian menyeluruh ke seluruh sistem, berikut adalah laporan arsitektur penempatan waktu jadwal (Time Slot) saat ini, serta titik kritis yang akan terdampak jika kita menambahkan slot `16:30` (16:30 - 18:00).

## 1. Database Schema (`schema.prisma`)
Waktu kelas **tidak disimpan sebagai `enum`**. 
Di model `Session`, field ini disimpan hanya sebagai tipe **`String`** biasa:
```prisma
model Session {
  id               String         @id @default(cuid())
  date             DateTime?
  timeSlot         String?        // <-- Disimpan sebagai string, misal: "08:00 - 09:30"
  ...
}
```
**Kesimpulan:** Tidak perlu ada migrasi atau perubahan skema *database*. Kita hanya perlu mengelola konsistensi string di sisi kode.

## 2. Constants / Global Config
**TIDAK ADA file konfigurasi terpusat tunggal** (seperti `constants.ts`). 
Saat ini array jadwal di-*hardcode* dan didefinisikan ulang secara terpisah di banyak tempat. File `src/constants/syllabus.ts` menyimpan *mapping* modul, namun array jadwalnya menyebar di:
- `src/app/(admin)/admin/classes/WeeklyRosterBuilder.tsx`
- `src/app/(admin)/admin/classes/ActiveSessionsView.tsx`
- `src/app/(admin)/admin/classes/CreateSessionModal.tsx`
- `src/app/pay/[invoiceNumber]/CheckoutForm.tsx` (Digunakan siswa saat pembayaran)

**Rekomendasi:** Saat kita menambahkan `16:30 - 18:00`, kita wajib menyisirkannya ke masing-masing array di file tersebut.

## 3. Admin Class Creation UI
Pada halaman operasional Admin, UI bergantung pada array hardcode maupun `<select>` murni.
Titik yang harus diubah:
1. **`WeeklyRosterBuilder.tsx`**: Ada konstanta `TIME_SLOTS` yang menggunakan format objek `{ time: "16:30 - 18:00", program: "Conversation" }`. 
2. **`ManageIndependentClassModal.tsx`**: Pilihan jam dibikin manual dalam tag `<option>` (harus ditambah baris `<option value="16:30 - 18:00">16:30 - 18:00</option>`).
3. **`UsersClientView.tsx`**: Sama seperti di atas, ada tag `<select>` manual.
4. **`ActiveSessionsView.tsx`**: Array konstan yang dipakai untuk membangun tampilan grid jadwal per minggu.

## 4. Tutor & Student Impact (Sangat Kritis ⚠️)
Penambahan jam ini akan memicu *bug* pada akses siswa jika satu file *backend logic* tidak disesuaikan.
**File Kritis: `src/lib/student-pool.ts`**
File ini mengatur izin akses siswa (*Fullday* vs *Regular*) ke suatu kelas. Saat ini sistem memetakan string jam ke nama Sesi secara kaku:
```typescript
let currentSessionName = "Sesi 1";
if (safeTimeSlot.includes("10:00")) currentSessionName = "Sesi 2";
if (safeTimeSlot.includes("12:30")) currentSessionName = "Sesi 3";
if (safeTimeSlot.includes("14:30")) currentSessionName = "Sesi 4";
if (safeTimeSlot.includes("18:30")) currentSessionName = "Sesi 5";
```
Selain itu, ada `const isSesi1to4 = ["08:00 - 09:30", "10:00 - 11:30", "12:30 - 14:00", "14:30 - 16:00"]`.
Jika jadwal `16:30 - 18:00` ditambahkan, kita harus memutuskan:
- Apakah `16:30` menjadi `Sesi 5`, dan `18:30` turun menjadi `Sesi 6`?
- Apakah anak *Fullday* punya akses ke `16:30`? (Saat ini *Fullday* diizinkan di Sesi 1 sampai 4 saja).

Ada juga file `src/app/(student)/student/schedules/actions.ts` yang melempar Sesi "18:30 - 20:00" sebagai filter spesifik, ini harus diperiksa kesesuaiannya dengan jadwal baru.

---
**Langkah Selanjutnya:** 
Sebelum saya mengubah kode-kode ini, mohon konfirmasi untuk bagian logikanya:
1. Secara nomenklatur, apakah `16:30 - 18:00` akan disebut sebagai **Sesi 5** (dan jam malam/20:00 mundur jadi Sesi 6)?
2. Apakah anak program **Fullday** boleh masuk (memiliki akses) ke jadwal baru 16:30 ini?
