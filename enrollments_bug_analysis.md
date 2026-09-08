# Laporan Arsitektur & Analisis *Bug*: Fitur *Repeat Order* / Renewal 

Berdasarkan penelusuran pada modul `Enrollments`, berikut adalah arsitektur aliran data dan akar penyebab dari *runtime error* `"membershipPackage wajib diisi untuk program Membership"` yang dialami saat admin mencoba memperbarui (renew) siswa.

---

## 1. Page & Tabs Structure (`src/app/(admin)/admin/enrollments/page.tsx`)
Halaman ini bertugas sebagai *Server Component* yang menyuplai data ke UI Tabs:
- **`dpInvoices`**: Diambil langsung dari `prisma.invoice` untuk semua invoice yang berstatus `"DP_PAID"`. 
- **Pemisahan Siswa**: Sistem mengambil 500 pengguna berstatus `"STUDENT"`. Jika siswa tersebut sudah masuk ke dalam daftar DP (dicek via email), maka mereka di-skip dari tab lain.
- **`activeStudents` & `expiredStudents`**: Sisa siswa tadi dipisahkan berdasarkan status *enrollment* terakhir mereka. Jika ada yang `"ACTIVE"`, dimasukkan ke `activeStudents`. Jika tidak ada yang aktif, otomatis masuk ke `expiredStudents`.
- Semua data ini diteruskan sebagai *props* ke *Client Component* `<EnrollmentTabs>`.

## 2. UI Form Renewal Modal (`EnrollmentTabs.tsx`)
Komponen ini mengelola *state* formulir secara lokal menggunakan React `useState`. State yang relevan antara lain:
- `renewProgram` (misal: "Regular", "Fullday", "Membership")
- `renewDuration` 
- `membershipPackage` (menyimpan kunci paket seperti `"1_Bulan"`, `"3_Plus_1_Bulan"`)
- `renewReferralCode`

**Analisis Form Membership:**
UI sebenarnya sudah **sangat benar**. Ketika admin memilih `renewProgram === "Membership"`, UI dengan benar menampilkan *dropdown* tambahan untuk mengisi `membershipPackage`. 
Bahkan, UI berhasil memanggil `calculateFinalPrice` dengan *parameter* lengkap (`programName`, `membershipPackage`, dan `hasReferral`) untuk menampilkan "Ringkasan Tagihan Live" di bawah *dropdown*.

## 3. Akar Masalah (The Bug)
Masalahnya murni terjadi di dalam fungsi **`handleRenewSubmit`** saat tombol *Submit* ditekan.

Saat form di-submit, sistem mencoba menghitung ulang total harga sebelum mengirim *payload* ke fungsi *server action* (`renewStudent`). Mari perhatikan potongan kode dari `EnrollmentTabs.tsx` baris ke-91:

```typescript
const { totalAmount: repeatOrderAmount } = calculateFinalPrice({
  programName: renewProgram,
  duration: renewDuration,
  isRepeatOrder: true, 
  // ❌ FATAL FLAW: membershipPackage tidak dikirim di sini!
  // ❌ hasReferral juga tidak dikirim!
});
```

Di sisi lain, fungsi `calculateFinalPrice` (yang berada di `src/lib/utils/pricing.ts`) memiliki mekanisme pertahanan yang ketat:
```typescript
// pricing.ts (baris 182-185)
if (isMembership) {
  if (!membershipPackage) {
    throw new Error("membershipPackage wajib diisi untuk program Membership.");
  }
  // ...
}
```

**Aliran Kegagalan (Failure Flow):**
1. Admin menekan submit.
2. Kode masuk ke `handleRenewSubmit` dan memanggil `calculateFinalPrice` tanpa menyertakan `membershipPackage`.
3. Fungsi *pricing* mendeteksi bahwa programnya adalah "Membership".
4. Fungsi *pricing* melihat bahwa `membershipPackage` adalah `undefined` pada objek parameter yang dilempar kepadanya.
5. Fungsi *pricing* langsung melempar (throw) **Error: "membershipPackage wajib diisi..."**.
6. Fungsi *Error* ini membunuh eksekusi secara lokal (Client-side), sehingga fungsi `renewStudent` tidak pernah terpanggil ke server.

---

## Solusi Perbaikan (Fix)
Kita hanya perlu menyisipkan `membershipPackage` dan status `hasReferral` ke dalam argumen pemanggilan `calculateFinalPrice` di dalam `handleRenewSubmit`.

Perbaikannya cukup dengan mengubahnya menjadi seperti ini:
```typescript
const { totalAmount: repeatOrderAmount } = calculateFinalPrice({
  programName: renewProgram,
  duration: renewDuration,
  isRepeatOrder: true,
  membershipPackage: renewProgram === "Membership" ? membershipPackage : undefined,
  hasReferral: renewProgram === "Membership" && renewReferralCode.trim().length > 0,
});
```
Dengan tambahan parameter tersebut, *Pricing Engine* akan sanggup menghitung harga final paket Membership dengan benar, tidak lagi melempar *error*, dan proses ke server (`renewStudent`) akan dilanjutkan dengan sempurna.
