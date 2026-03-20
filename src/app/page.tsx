"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Users, Award, Star, CheckSquare, Menu, X } from "lucide-react";

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-900 selection:text-white">
      {/* 1. HEADER */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group z-50">
            <span className="text-xl md:text-2xl font-black tracking-tighter text-black uppercase decoration-2 underline-offset-4 group-hover:underline">
              Kampung<span className="text-gray-400">Inggris</span>
            </span>
          </Link>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
            <Link href="#program" className="hover:text-black transition-colors">Program</Link>
            <Link href="#keunggulan" className="hover:text-black transition-colors">Keunggulan</Link>
            <Link href="#testimoni" className="hover:text-black transition-colors">Testimoni</Link>
            <Link href="#faq" className="hover:text-black transition-colors">FAQ</Link>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-bold text-black border-2 border-black hover:bg-gray-50 transition-colors"
            >
              Sign In Siswa
            </Link>
            <Link
              href="#daftar"
              className="px-5 py-2.5 text-sm font-bold text-white bg-black hover:bg-gray-800 transition-colors shadow-xl shadow-black/10"
            >
              Daftar Sekarang
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 -mr-2 text-gray-600 hover:text-black transition-colors z-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[64px] left-0 w-full bg-white border-b border-gray-200 shadow-2xl flex flex-col p-4 animate-in slide-in-from-top-2 duration-200 z-40">
            <nav className="flex flex-col gap-4 mb-6">
              <Link href="#program" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-bold text-gray-800 py-2 border-b border-gray-100">Program</Link>
              <Link href="#keunggulan" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-bold text-gray-800 py-2 border-b border-gray-100">Keunggulan</Link>
              <Link href="#testimoni" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-bold text-gray-800 py-2 border-b border-gray-100">Testimoni</Link>
            </nav>
            <div className="flex flex-col gap-3">
              <Link 
                href="/login" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center px-5 py-3 text-base font-bold text-black border-2 border-black hover:bg-gray-50 transition-colors"
              >
                Sign In Siswa
              </Link>
              <Link 
                href="#daftar" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center px-5 py-3 text-base font-bold text-white bg-black hover:bg-gray-800 transition-colors shadow-lg shadow-black/10"
              >
                Daftar Sekarang
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-black leading-[1.1] mb-5 md:mb-6">
            Kuasai Bahasa Inggris.<br />
            Buka Pintu Dunia.
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-500 mb-8 md:mb-10 max-w-2xl mx-auto md:mx-0 leading-relaxed font-medium">
            Program intensif yang dirancang oleh para ahli untuk memastikan Anda lancar berbicara dengan percaya diri dalam waktu lebih singkat.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            <Link
              href="#program"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-black hover:-translate-y-1 transition-transform flex items-center justify-center gap-2"
            >
              Lihat Program Kami
              <ArrowRight className="w-5 h-5 text-indigo-400" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-black bg-white border-2 border-gray-200 hover:border-black transition-colors flex items-center justify-center sm:hidden"
            >
              Sign In Siswa
            </Link>
          </div>
        </div>

        {/* Hero Image Container */}
        <div className="flex-1 w-full max-w-lg relative group">
          <div className="absolute inset-0 bg-gray-100 translate-x-4 translate-y-4 border border-gray-200" />
          <div className="relative aspect-[4/5] bg-gray-50 border-2 border-gray-900 overflow-hidden group-hover:-translate-y-2 transition-transform duration-500 ease-out flex items-center justify-center">
            {/* Colorful Abstract Graphic / Image Placeholder */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-700" />
            <div className="absolute inset-0 bg-black/10" />
          </div>
        </div>
      </section>

      {/* 3. VALUE PROPOSITION */}
      <section id="keunggulan" className="py-16 md:py-24 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">Lebih Dari Sekadar Teori</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">

            {/* Feature 1 */}
            <div className="bg-white p-8 border border-gray-200 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group">
              <div className="w-14 h-14 bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Metode Teruji</h3>
              <p className="text-gray-500 leading-relaxed font-medium">Kurikulum praktis berbasis percakapan yang dirancang khusus untuk mematahkan keraguan Anda saat berbicara.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 border border-gray-200 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all group">
              <div className="w-14 h-14 bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Tutor Berpengalaman</h3>
              <p className="text-gray-500 leading-relaxed font-medium">Dibimbing langsung oleh praktisi bahasa Inggris yang menguasai teknik penyampaian interaktif & menyenangkan.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 border border-gray-200 hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-500/10 transition-all group">
              <div className="w-14 h-14 bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Sertifikat Resmi</h3>
              <p className="text-gray-500 leading-relaxed font-medium">Lulus dengan E-Certificate yang dilengkapi rincian nilai komprehensif untuk mendongkrak karir profesional Anda.</p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. FEATURED PROGRAMS */}
      <section id="program" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-4 md:gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-black tracking-tight mb-3 md:mb-4">Pilih Jenjangmu.</h2>
            <p className="text-base md:text-lg text-gray-500 max-w-xl font-medium">Program unggulan dengan jadwal fleksibel yang siap membantu Anda dari dasar hingga mahir.</p>
          </div>
          <Link href="#semua-program" className="text-black font-bold border-b-2 border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors w-max">Lihat Semua Program</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

          {/* Card 1 */}
          <div className="flex flex-col border-2 border-gray-200 hover:border-black transition-colors bg-white">
            <div className="p-8 flex-1">
              <h3 className="text-2xl font-black text-black mb-2">Regular Class</h3>
              <p className="text-sm font-bold text-indigo-500 tracking-widest uppercase mb-6">Paling Diminati</p>
              <p className="text-gray-500 mb-8 font-medium">Kelas intensif harian (Conversation) yang menstimulasi Anda berpikir dan berbicara langsung dalam bahasa Inggris.</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3"><CheckSquare className="w-5 h-5 text-gray-900 shrink-0" /><span className="text-sm text-gray-600 font-medium">1x Sesi per Hari (90 Menit)</span></li>
                <li className="flex items-start gap-3"><CheckSquare className="w-5 h-5 text-gray-900 shrink-0" /><span className="text-sm text-gray-600 font-medium">Max 15 Siswa per Kelas</span></li>
                <li className="flex items-start gap-3"><CheckSquare className="w-5 h-5 text-gray-900 shrink-0" /><span className="text-sm text-gray-600 font-medium">Materi Praktis Sehari-hari</span></li>
              </ul>
            </div>
            <div className="p-8 border-t border-gray-100 bg-gray-50 mt-auto">
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-black">Rp 500k</span>
                <span className="text-sm text-gray-500 font-medium">/ 2 Minggu</span>
              </div>
              <button className="w-full py-3 text-sm font-bold text-white bg-black hover:bg-gray-800 transition-colors">Daftar Regular</button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col border-2 border-black bg-black text-white relative shadow-2xl">
            <div className="absolute top-0 right-0 bg-yellow-400 text-black text-xs font-black px-3 py-1 uppercase tracking-wider transform translate-x-2 -translate-y-3">
              VIP EXPERIENCES
            </div>
            <div className="p-8 flex-1">
              <h3 className="text-2xl font-black mb-2">Private Course</h3>
              <p className="text-sm font-bold text-yellow-400 tracking-widest uppercase mb-6">Eksklusif</p>
              <p className="text-gray-400 mb-8 font-medium">Sesi eksklusif 1-on-1 dengan jadwal dinamis. Cocok untuk profesional yang memiliki fleksibilitas terbatas.</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3"><CheckSquare className="w-5 h-5 text-yellow-500 shrink-0" /><span className="text-sm text-gray-300 font-medium">Jadwal Bebas Tentukan</span></li>
                <li className="flex items-start gap-3"><CheckSquare className="w-5 h-5 text-yellow-500 shrink-0" /><span className="text-sm text-gray-300 font-medium">Materi Custom Sesuai Kebutuhan</span></li>
                <li className="flex items-start gap-3"><CheckSquare className="w-5 h-5 text-yellow-500 shrink-0" /><span className="text-sm text-gray-300 font-medium">Evaluasi Rinci Tiap Sesi</span></li>
              </ul>
            </div>
            <div className="p-8 border-t border-gray-800 bg-gray-900 mt-auto">
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-white">Rp 1.5M</span>
                <span className="text-sm text-gray-500 font-medium">/ Bulan</span>
              </div>
              <button className="w-full py-3 text-sm font-bold text-black bg-white hover:bg-gray-100 transition-colors">Ambil Kuota VIP</button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col border-2 border-gray-200 hover:border-black transition-colors bg-white lg:col-span-1 md:col-span-2 lg:col-auto">
            <div className="p-8 flex-1">
              <h3 className="text-2xl font-black text-black mb-2">TOEFL Prep</h3>
              <p className="text-sm font-bold text-red-500 tracking-widest uppercase mb-6">Akademis</p>
              <p className="text-gray-500 mb-8 font-medium">Fokus pada bedah soal lanjutan untuk mengejar target skor institusi maupun persiapan beasiswa ke luar negeri.</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3"><CheckSquare className="w-5 h-5 text-gray-900 shrink-0" /><span className="text-sm text-gray-600 font-medium">Simulasi Tes Berkala</span></li>
                <li className="flex items-start gap-3"><CheckSquare className="w-5 h-5 text-gray-900 shrink-0" /><span className="text-sm text-gray-600 font-medium">Strategi Menjawab Cepat</span></li>
                <li className="flex items-start gap-3"><CheckSquare className="w-5 h-5 text-gray-900 shrink-0" /><span className="text-sm text-gray-600 font-medium">Tutor Skor 600+</span></li>
              </ul>
            </div>
            <div className="p-8 border-t border-gray-100 bg-gray-50 mt-auto">
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-black">Rp 850k</span>
                <span className="text-sm text-gray-500 font-medium">/ 1 Bulan</span>
              </div>
              <button className="w-full py-3 text-sm font-bold text-white bg-black hover:bg-gray-800 transition-colors">Kejar Skor TOEFL</button>
            </div>
          </div>

        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section id="testimoni" className="py-16 md:py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-center mb-12 md:mb-16 tracking-tight">Kisah Alumni Kece</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Review 1 */}
            <div className="p-10 border border-gray-700 bg-gray-800 hover:border-gray-500 transition-colors">
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-xl md:text-2xl font-medium leading-normal mb-10 text-gray-300">
                &quot;Gampang banget nangkep materinya karena fokus ke praktek langsung. Sesi private-nya ngebantu banget perbaiki logat aku!&quot;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-700 rounded-full overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://i.pravatar.cc/150?img=47" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-white uppercase tracking-wide">Dian Sastro</p>
                  <p className="text-sm text-gray-400">Alumni Private Course</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="p-10 border border-gray-700 bg-gray-800 hover:border-gray-500 transition-colors hidden md:block">
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-xl md:text-2xl font-medium leading-normal mb-10 text-gray-300">
                &quot;Modul TOEFL-nya gila sih, langsung kena ke jebakan-jebakan tes. Ambil kursus ini memang gak akan salah pilih.&quot;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-700 rounded-full overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-white uppercase tracking-wide">Reza Rahadian</p>
                  <p className="text-sm text-gray-400">Alumni TOEFL Prep</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section id="daftar" className="py-20 md:py-32 bg-gray-100 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-black tracking-tight mb-6 md:mb-8">
            Siap Mulai Perjalananmu?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-10 md:mb-12 font-medium px-2">
            Tidak perlu menunggu besok untuk berubah. Daftar secara registrasi online sekarang, dapatkan akses ke Student Dashboard, dan wujudkan bahasa Inggrismu!
          </p>
          <Link
            href="https://wa.me/placeholder"
            target="_blank"
            className="inline-flex w-full sm:w-auto items-center justify-center px-8 md:px-10 py-4 md:py-5 text-base md:text-lg font-black text-white bg-black hover:scale-105 transition-transform shadow-2xl shadow-black/20"
          >
            Daftar Online & Hubungi Admin
          </Link>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="py-10 md:py-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg md:text-xl font-black tracking-tighter text-black uppercase">
              Kampung<span className="text-gray-400">Inggris</span>
            </span>
          </div>
          <div className="text-xs md:text-sm text-gray-500 font-medium text-center">
            &copy; {new Date().getFullYear()} LMS MVP Edition. All rights reserved.
          </div>
          <div className="flex gap-4 md:gap-6 text-xs md:text-sm font-bold text-gray-500">
            <Link href="#terms" className="hover:text-black transition-colors">Syarat & Ketentuan</Link>
            <Link href="#privacy" className="hover:text-black transition-colors">Privasi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
