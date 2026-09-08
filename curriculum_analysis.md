# Laporan Analisis Logika Kurikulum (Topic Sequencing)

Berdasarkan pemindaian basis kode, berikut adalah laporan mengenai cara kerja sistem kurikulum saat ini beserta penyebab *bug* reset mingguan.

## 1. Lokasi Data Kurikulum (Topik Materi)
Semua array topik dan pemetaannya disimpan secara terpusat di dalam file konfigurasi konstan:
- **File:** `src/constants/syllabus.ts`
- **Isi:** Array data seperti `TOPIC_DISCUSSION_1`, `LISTENING`, `TELLING_PICTURE`, dan `TOPIC_DISCUSSION_2`. Di file inilah total ada 40 topik per kategori disimpan.

## 2. Logika Mapping Sesi ke Modul (Sesi 1 -> TD 1, Sesi 2 -> LST, dst)
Pemetaan antara waktu sesi (Sesi 1-6) dan modul mana yang harus dipakai (TD1, Listening, dll.) terletak di file yang sama:
- **File:** `src/constants/syllabus.ts` 
- **Variabel:** `SESSION_MODULE_MAP`.
```typescript
export const SESSION_MODULE_MAP: Record<number, { name: string, shortName: string, data: string[] }> = {
  1: { name: "Topic Discussion 1", shortName: "TD1", data: TOPIC_DISCUSSION_1 },
  2: { name: "Listening", shortName: "LST", data: LISTENING },
  3: { name: "Telling Picture", shortName: "TP", data: TELLING_PICTURE },
  4: { name: "Topic Discussion 2", shortName: "TD2", data: TOPIC_DISCUSSION_2 },
  5: { name: "Topic Discussion 1", shortName: "TD1", data: TOPIC_DISCUSSION_1 },
  6: { name: "Listening", shortName: "LST", data: LISTENING }, // Saat ini map ke Listening
};
```
*Catatan: Sesi 6 saat ini me-mapping ulang ke Modul 2 (Listening), nanti kita perlu membuat variabel `TOPIC_DISCUSSION_3` dan mengganti Sesi 6 untuk mengarah ke sana sesuai *requirement* Anda.*

## 3. Analisis Logika Sequencing (Penyebab Reset Mingguan)
Fungsi utama yang menghitung topik mana yang harus diambil pada hari itu adalah:
- **File:** `src/lib/syllabus-helpers.ts` (Fungsi `getTodayTopic`)

**Kenapa selalu kembali ke Topik #1 setiap awal minggu?**
Sistem ternyata menghitung indeks topik berdasarkan perhitungan matematis murni menggunakan **Indeks Hari dalam Seminggu** (Senin = 0, Selasa = 1, dst), alih-alih melacak durasi sejak dimulainya *batch*!

Jika kita telusuri file UI (contohnya dasbor Tutor di `src/app/(tutor)/tutor/dashboard/page.tsx` atau Dasbor Siswa), pemanggilannya selalu di-hardcode seperti ini:
```typescript
const dayOfWeek = d.getDay(); // 1 = Senin, 2 = Selasa, ...
const dayIndex = dayOfWeek >= 1 && dayOfWeek <= 6 ? dayOfWeek - 1 : 0;
// Pemanggilan:
getTodayTopic(s.timeSlot, 1, (s.topicOffset || 0) + dayIndex, s.date)
```
- Parameter `meetingCount` **selalu di-hardcode bernilai `1`**.
- Parameter `offset` menggunakan `dayIndex` (0 untuk Senin, 4 untuk Jumat).

**Bagaimana sistem mengetahui "Start Date"?**
Sayangnya, sistem **TIDAK tahu** kapan kelas itu dimulai! Entitas `Session` saat ini bersifat *standalone* yang dihasilkan oleh Admin setiap minggunya melalui `WeeklyRosterBuilder`. Karena setiap minggu Admin men-generate baris *Session* baru di *database*, sesi-sesi tersebut tidak memiliki "Tanggal Mulai Batch", dan field `topicOffset` bawaannya selalu *default* ke `0`. 

Karena `dayIndex` akan selalu berulang kembali ke `0` setiap hari Senin, kalkulasi modulonya `((1 + 0 + dayIndex) - 1) % 40` pasti akan selalu menghasilkan indeks `0` (Topik Pertama) setiap hari Senin secara absolut.

---
**Rencana Perbaikan:**
Untuk memperbaiki hal ini tanpa merombak total *database schema*, kita bisa:
1. Memanfaatkan `createdAt` dari pengguna (Siswa) atau grup jika ada referensinya, **ATAU**
2. Kita bisa mendeteksi selisih minggu sebenarnya antara *hari ini* (tanggal `session.date`) dengan sebuah tanggal *base start date* (misal: "Hari Senin Pertama saat gelombang 10 atau 25 tiap bulannya dimulai", karena ini kursus pare yang lazimnya dimulai tanggal 10/25).
3. Setelah selisih minggu diketahui, kita tambahkan ke matematika perhitungan topiknya (misal: `Minggu Ke-2 hari Senin = Topik ke 6`).
4. Memasukkan array baru `TOPIC_DISCUSSION_3` ke dalam modul dan memetakannya ke `Sesi 6`.

Bagaimana Anda ingin melacak tanggal dimulainya topik kelas ini? Apakah ada referensi *"Start Date"* tertentu (misal tanggal masuk siswa/batch period)?
