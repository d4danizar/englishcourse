"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import imageCompression from "browser-image-compression";
import { supabaseBrowser } from "../../../lib/supabase-browser";
import { submitPaymentProof } from "../../../lib/actions/invoice-actions";

// ── Zod Schema ────────────────────────────────────────────────────────────────
const PROGRAMS = [
  "Regular",
  "Fullday",
  "Asrama",
  "English on Saturday",
  "EFK",
  "EFT",
  "Private",
  "TOEFL",
  "Holiday Kids - Fullday",
  "Holiday Kids - Camp",
  "Holiday Teens - Fullday",
  "Holiday Teens - Camp",
] as const;

const SESSION_OPTIONS = [
  "08:00 - 09:30",
  "10:00 - 11:30",
  "12:30 - 14:00",
  "14:30 - 16:00",
  "18:30 - 20:00",
];

const DURATION_OPTIONS = ["1 Minggu", "2 Minggu", "3 Minggu", "1 Bulan", "2 Bulan"];
const NEEDS_DETAIL = ["Regular", "Fullday", "Asrama"];

const formSchema = z
  .object({
    fullName: z.string().min(3, "Nama lengkap minimal 3 karakter."),
    gender: z.enum(["Laki-laki", "Perempuan"], {
      message: "Silakan pilih jenis kelamin."
    }),
    birthPlace: z.string().min(2, "Tempat lahir wajib diisi."),
    birthDate: z.string().min(1, "Tanggal lahir wajib diisi."),
    startDate: z.string().min(1, "Rencana tanggal mulai wajib diisi."),
    phone: z
      .string()
      .min(9, "Nomor WA minimal 9 digit.")
      .regex(/^[0-9+\-\s]+$/, "Nomor WA hanya boleh berisi angka."),
    email: z.string().email("Masukkan alamat email yang valid."),
    occupation: z.enum(
      ["Sekolah", "Kuliah", "Bekerja", "Mencari Pekerjaan", "Lainnya"],
      { message: "Silakan pilih status kesibukan." }
    ),
    program: z.enum(PROGRAMS as readonly [string, ...string[]], { message: "Silakan pilih program." }),
    programDetail: z.string().optional(),
    discoverySource: z.enum(
      ["Instagram", "TikTok", "Google Maps", "Website", "Teman/Keluarga"],
      { message: "Silakan pilih dari mana Anda mengetahui kami." }
    ),
    address: z.string().min(5, "Alamat lengkap wajib diisi."),
  })
  .superRefine((data, ctx) => {
    const isHoliday = data.program?.includes("Holiday");
    const needsDuration = data.program === "Fullday" || data.program === "Asrama" || isHoliday;
    
    if (
      (data.program === "Regular" || needsDuration) &&
      !data.programDetail
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["programDetail"],
        message:
          data.program === "Regular"
            ? "Silakan pilih sesi."
            : "Silakan pilih durasi program.",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────
const inputCls =
  "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 transition-colors";
const labelCls = "text-xs font-bold text-slate-600 uppercase tracking-widest";
const errorCls = "text-xs text-red-500 mt-1";

function FieldWrap({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CheckoutForm({
  invoiceId,
  programName,
  leadName,
  leadWa,
  paymentChannel = "TRANSFER",
}: {
  invoiceId: string;
  programName: string;
  leadName: string;
  leadWa: string;
  paymentChannel?: "TRANSFER" | "CASH";
}) {
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "compressing" | "uploading" | "done" | "error"
  >("idle");
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [tshirtSize, setTshirtSize] = useState("");
  const [gelombang, setGelombang] = useState("");
  const [infoSource, setInfoSource] = useState("");
  const [alergi, setAlergi] = useState("");
  const [penyakit, setPenyakit] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: leadName,
      phone: leadWa,
      program: (PROGRAMS as readonly string[]).includes(programName)
        ? (programName as FormValues["program"])
        : undefined,
    },
  });

  const selectedProgram = useWatch({ control, name: "program" });
  const isHolidayProgram = selectedProgram?.includes("Holiday") ?? false;

  const excludedPrograms = ["private", "toefl", "efk", "eft"];
  const isTshirtEligible = 
    selectedProgram && 
    !excludedPrograms.some(name => selectedProgram.toLowerCase().includes(name));

  // ── Upload ────────────────────────────────────────────────────────────────
  const uploadProof = async (file: File): Promise<string> => {
    setUploadStatus("compressing");
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });

    setUploadStatus("uploading");
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `proofs/${invoiceId}-${Date.now()}.${ext}`;

    const { error } = await supabaseBrowser.storage
      .from("payment-proofs")
      .upload(path, compressed, { contentType: compressed.type, upsert: true });

    if (error) throw new Error("Upload gagal: " + error.message);

    const { data } = supabaseBrowser.storage
      .from("payment-proofs")
      .getPublicUrl(path);

    setUploadStatus("done");
    return data.publicUrl;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    setServerError(null);

    let proofUrl = "CASH_PAYMENT";

    if (paymentChannel === "TRANSFER") {
      const fileInput = document.getElementById("paymentProof") as HTMLInputElement;
      const file = fileInput?.files?.[0];
      if (!file) {
        setServerError("Bukti transfer wajib diunggah.");
        return;
      }

      try {
        proofUrl = await uploadProof(file);
      } catch (err: any) {
        setUploadStatus("error");
        setServerError(err.message ?? "Gagal mengupload bukti transfer.");
        return;
      }
    }

    const programFull = values.programDetail
      ? `${values.program} — ${values.programDetail}`
      : values.program;

    const studentData: Record<string, string | undefined> = {
      name: values.fullName,
      email: values.email,
      whatsapp: values.phone,
      school: values.occupation,
      program: programFull,
      // Admin Sync Fields
      activeProgram: values.program,
      programBatch: values.program === "Regular" ? values.programDetail : undefined,
      durationOption: ["Fullday", "Asrama"].includes(values.program) ? values.programDetail : undefined,
      batchSchedule: ["EFK", "EFT"].includes(values.program) ? values.programDetail : undefined,
      startDate: values.startDate,
      // Default Info
      gender: values.gender,
      birthPlace: values.birthPlace,
      birthDate: values.birthDate,
      occupation: values.occupation,
      discoverySource: values.discoverySource,
      address: values.address,
      tshirtSize: isTshirtEligible ? tshirtSize : undefined,
      ...(isHolidayProgram && {
         gelombang,
         infoSource,
         alergi,
         penyakit,
      })
    };

    const res = await submitPaymentProof(invoiceId, studentData as any, proofUrl);
    if (res?.success) {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setServerError(res?.error ?? "Gagal mengirim data. Silakan coba lagi.");
    }
  };

  // ── Success ───────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-10 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-emerald-700 mb-2">Pendaftaran Terkirim!</h2>
        <p className="text-slate-600 leading-relaxed">
          Terima kasih! Pembayaran Anda sedang kami verifikasi. Info akun login akan dikirimkan ke{" "}
          <strong>WhatsApp</strong> Anda setelah dikonfirmasi oleh tim kami.
        </p>
        <p className="mt-4 text-xs text-slate-400">
          Proses konfirmasi biasanya selesai dalam 1×24 jam kerja.
        </p>
      </div>
    );
  }

  const isBusy =
    isSubmitting || uploadStatus === "compressing" || uploadStatus === "uploading";

  const submitLabel =
    uploadStatus === "compressing"
      ? "Mengkompres gambar..."
      : uploadStatus === "uploading"
        ? "Mengupload bukti transfer..."
        : isSubmitting
          ? "Mengirim data..."
          : "✅ Kirim Formulir Pendaftaran";

  return (
    <form
      translate="no"
      onSubmit={handleSubmit(onSubmit)}
      className="notranslate bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-8"
    >
      {/* ── 1. Data Diri ────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
          1. Data Diri
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrap label="Nama Lengkap" required error={errors.fullName?.message}>
            <input type="text" {...register("fullName")} placeholder="Sesuai KTP / ijazah" className={inputCls} />
          </FieldWrap>

          <FieldWrap label="Jenis Kelamin" required error={errors.gender?.message}>
            <select {...register("gender")} className={inputCls}>
              <option value="">-- Pilih --</option>
              <option>Laki-laki</option>
              <option>Perempuan</option>
            </select>
          </FieldWrap>

          <FieldWrap label="Tempat Lahir" required error={errors.birthPlace?.message}>
            <input type="text" {...register("birthPlace")} placeholder="Contoh: Surabaya" className={inputCls} />
          </FieldWrap>

          <FieldWrap label="Tanggal Lahir" required error={errors.birthDate?.message}>
            <input type="date" {...register("birthDate")} className={inputCls} />
          </FieldWrap>

          <FieldWrap
            label="Nomor WhatsApp"
            required
            error={errors.phone?.message}
            hint="Nomor ini akan menjadi password awal login Anda."
          >
            <input type="text" {...register("phone")} placeholder="08xxxxxxxxxx" className={inputCls} />
          </FieldWrap>

          <FieldWrap
            label="Email Aktif"
            required
            error={errors.email?.message}
            hint="Email ini akan menjadi username login portal Anda."
          >
            <input type="email" {...register("email")} placeholder="nama@gmail.com" className={inputCls} />
          </FieldWrap>

          <FieldWrap label="Status Kesibukan" required error={errors.occupation?.message}>
            <select {...register("occupation")} className={inputCls}>
              <option value="">-- Pilih --</option>
              {["Sekolah", "Kuliah", "Bekerja", "Mencari Pekerjaan", "Lainnya"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </FieldWrap>

          <FieldWrap
            label="Dari mana Anda mengetahui kami?"
            required
            error={errors.discoverySource?.message}
          >
            <select {...register("discoverySource")} className={inputCls}>
              <option value="">-- Pilih --</option>
              {["Instagram", "TikTok", "Google Maps", "Website", "Teman/Keluarga"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FieldWrap>

          <div className="sm:col-span-2">
            <FieldWrap label="Alamat Lengkap / Tempat Tinggal" required error={errors.address?.message}>
              <textarea 
                id="address" 
                {...register("address")} 
                rows={3} 
                className={inputCls} 
                placeholder="Masukkan alamat domisili lengkap..."
              />
            </FieldWrap>
          </div>
        </div>
      </section>

      {/* ── 2. Pilihan Program ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
          2. Pilihan Program
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrap label="Program" required error={errors.program?.message}>
            <select {...register("program")} className={inputCls}>
              <option value="">-- Pilih program --</option>
              {PROGRAMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </FieldWrap>

          {/* Conditional: Regular → Sesi */}
          {selectedProgram === "Regular" && (
            <FieldWrap label="Pilih Sesi" required error={errors.programDetail?.message}>
              <select {...register("programDetail")} className={inputCls}>
                <option value="">-- Pilih sesi --</option>
                {SESSION_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </FieldWrap>
          )}

          {/* Conditional: Fullday / Asrama / Holiday → Durasi */}
          {(selectedProgram === "Fullday" || selectedProgram === "Asrama" || selectedProgram?.includes("Holiday")) && (
            <FieldWrap label="Durasi Program" required error={errors.programDetail?.message}>
              <select {...register("programDetail")} className={inputCls}>
                <option value="">-- Pilih durasi --</option>
                {DURATION_OPTIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </FieldWrap>
          )}

          <FieldWrap label="Rencana Tanggal Mulai (Senin)" required error={errors.startDate?.message} hint="Kelas dimulai hari Senin.">
            <input type="date" {...register("startDate")} className={inputCls} />
          </FieldWrap>

          {/* Conditional: T-Shirt Size */}
          {isTshirtEligible && (
            <FieldWrap label="Ukuran Kaos (Free Merchandise)" required={isTshirtEligible}>
              <select 
                value={tshirtSize} 
                onChange={(e) => setTshirtSize(e.target.value)}
                required={isTshirtEligible}
                className={inputCls}
              >
                <option value="" disabled>-- Pilih Ukuran --</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </FieldWrap>
          )}

          {/* Conditional: Holiday Program Extra Fields */}
          {isHolidayProgram && (
            <div className="space-y-5 border p-5 rounded-2xl bg-orange-50/50 border-orange-200 col-span-1 md:col-span-2">
               <h3 className="font-bold text-orange-800 text-sm uppercase tracking-widest border-b border-orange-200/60 pb-3">Informasi Khusus Holiday Program</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FieldWrap label="Gelombang (Batch)" required>
                   <select 
                     value={gelombang} 
                     onChange={(e) => setGelombang(e.target.value)} 
                     required={isHolidayProgram}
                     className={inputCls}
                   >
                     <option value="" disabled>-- Pilih Gelombang --</option>
                     <option value="Gel 1 (15 Juni - 20 Juni 2026)">Gel 1 (15 Juni - 20 Juni 2026)</option>
                     <option value="Gel 2 (22 Juni - 27 Juni 2026)">Gel 2 (22 Juni - 27 Juni 2026)</option>
                     <option value="Gel 3 (29 Juni - 4 Juli 2026)">Gel 3 (29 Juni - 4 Juli 2026)</option>
                   </select>
                 </FieldWrap>

                 <FieldWrap label="Info Kampung Inggris Dari" required>
                   <select 
                     value={infoSource} 
                     onChange={(e) => setInfoSource(e.target.value)} 
                     required={isHolidayProgram}
                     className={inputCls}
                   >
                     <option value="" disabled>-- Pilih Sumber Info --</option>
                     <option value="Facebook">Facebook</option>
                     <option value="Instagram">Instagram</option>
                     <option value="Tiktok">Tiktok</option>
                     <option value="Google Maps">Google Maps</option>
                     <option value="Website">Website</option>
                     <option value="Keluarga/teman/kerabat">Keluarga/teman/kerabat</option>
                   </select>
                 </FieldWrap>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FieldWrap label="Alergi Makanan/Obat (Opsional)">
                   <input 
                     type="text" 
                     value={alergi} 
                     onChange={(e) => setAlergi(e.target.value)} 
                     placeholder="Kosongkan jika tidak ada" 
                     className={inputCls}
                   />
                 </FieldWrap>

                 <FieldWrap label="Riwayat Penyakit Khusus (Opsional)">
                   <input 
                     type="text" 
                     value={penyakit} 
                     onChange={(e) => setPenyakit(e.target.value)} 
                     placeholder="Kosongkan jika tidak ada" 
                     className={inputCls}
                   />
                 </FieldWrap>
               </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <p className="font-semibold">ℹ️ Informasi Biaya</p>
          <p className="mt-1">Semua program dikenakan <strong>Biaya Pendaftaran Rp100.000</strong> (sudah termasuk dalam total tagihan invoice).</p>
        </div>
      </section>

      {/* ── 3. Bukti Transfer / Konfirmasi Tunai ──────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
          3. Pembayaran
        </h2>
        
        {paymentChannel === "CASH" ? (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" required className="mt-1 w-4 h-4 accent-orange-600" />
              <span className="text-sm text-orange-800 font-medium">
                Saya mengonfirmasi bahwa saya akan/telah membayar secara tunai (Cash On-Site) di lokasi Kampung Inggris.
              </span>
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>
              Upload Foto Bukti Transfer <span className="text-red-500">*</span>
            </label>
            <input
              id="paymentProof"
              type="file"
              accept="image/*"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 file:font-semibold file:text-xs hover:file:bg-indigo-200 transition-colors"
            />
            <p className="text-xs text-slate-400">
              Gambar dikompres otomatis (maks. 1 MB). Format: JPG, PNG, HEIC.
            </p>
            {uploadStatus === "error" && (
              <span className="text-xs text-red-500 font-medium">Gagal mengupload gambar.</span>
            )}
          </div>
        )}
      </section>

      {/* Error */}
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex gap-2 items-start">
          <span className="shrink-0">⚠️</span>
          <span>{serverError}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isBusy}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
      >
        {isBusy ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            {submitLabel}
          </span>
        ) : submitLabel}
      </button>

      <p className="text-xs text-center text-slate-400">
        Dengan mengirimkan form ini, Anda menyetujui syarat dan ketentuan program Kampung Inggris.
      </p>
    </form>
  );
}
