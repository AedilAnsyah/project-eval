"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Sparkles, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Timeline events representing Cabinet Astravia's half-year journey
const TIMELINE_EVENTS = [
  {
    id: "firstmeet",
    title: "First Meet",
    emoji: "🤝",
    date: "2 Januari 2026",
    desc: "Pertemuan pertama pengurus Kabinet Astravia. Langkah awal untuk saling mengenal, menyatukan visi, dan merancang masa depan HMIF yang lebih baik.",
    img: "/timeline/firstmeet.jpg",
    tilt: "rotate-[-2deg]"
  },
  {
    id: "sertijab",
    title: "Sertijab Kabinet Astravia",
    emoji: "👑",
    date: "11 Januari 2026",
    desc: "Prosesi serah terima jabatan pengurus lama ke pengurus baru menandai awal perjuangan Kabinet Astravia HMIF 2026. Langkah awal kita dengan visi besar dan semangat baru!",
    img: "/timeline/sertijabkabinetastravia.jpg",
    tilt: "rotate-[1.5deg]"
  },
  {
    id: "mlb",
    title: "Musyawarah Luar Biasa",
    emoji: "⚖️",
    date: "15 Januari 2026",
    desc: "Musyawarah luar biasa untuk membahas hal-hal krusial demi kelancaran dan legalitas roda organisasi HMIF ke depan.",
    img: "/timeline/musyawarahluarbiasa.jpg",
    tilt: "rotate-[-1deg]"
  },
  {
    id: "muswil",
    title: "Muswil Permikomnas",
    emoji: "🌍",
    date: "6-8 Februari 2026",
    desc: "Partisipasi HMIF dalam Musyawarah Wilayah Permikomnas. Menjalin relasi, bertukar ide, dan berkolaborasi dengan mahasiswa informatika se-wilayah.",
    img: "/timeline/muswilpermikomnas.jpg",
    tilt: "rotate-[2deg]"
  },
  {
    id: "rabulfeb",
    title: "Rabul Februari",
    emoji: "📅",
    date: "21 Februari 2026",
    desc: "Rapat Bulanan pertama di bulan Februari. Tempat koordinasi perkembangan program kerja antar divisi dan evaluasi awal kabinet.",
    img: "/timeline/rabulfebruari.jpg",
    tilt: "rotate-[-2.5deg]"
  },
  {
    id: "ldk",
    title: "LDK HMIF 2026",
    emoji: "🛡️",
    date: "22 Februari 2026",
    desc: "Latihan Dasar Kepemimpinan untuk membekali pengurus dengan jiwa kepemimpinan, tanggung jawab, dan soliditas organisasi yang kuat.",
    img: "/timeline/ldkhmif2026.jpg",
    tilt: "rotate-[1deg]"
  },
  {
    id: "ngafirmatics",
    title: "NGAFIRMATICS 5.0",
    emoji: "🍿",
    date: "28 Februari 2026",
    desc: "Keseruan acara Ngaprak Informatics edisi kelima. Ajang berkumpul, bermain, dan mempererat tali persaudaraan keluarga besar HMIF.",
    img: "/timeline/ngafirmatics5.jpg",
    tilt: "rotate-[-1.5deg]"
  },
  {
    id: "sosialberbagi",
    title: "Sosial Berbagi",
    emoji: "❤️",
    date: "6 Maret 2026",
    desc: "Aksi sosial nyata pengurus HMIF untuk berbagi keceriaan dan bantuan kepada sesama yang membutuhkan. Kepedulian yang menghangatkan.",
    img: "/timeline/sosialberbagi.jpg",
    tilt: "rotate-[2deg]"
  },
  {
    id: "lcc",
    title: "Lomba Cerdas Cermat HMIF",
    emoji: "💡",
    date: "26 Maret 2026",
    desc: "Kompetisi cerdas cermat yang mengasah wawasan akademik, sportivitas, dan kerja tim di bidang informatika.",
    img: "/timeline/lombacerdascermat.jpg",
    tilt: "rotate-[-2deg]"
  },
  {
    id: "akrobat",
    title: "Akrobat with HMTB",
    emoji: "🎭",
    date: "29 Maret 2026",
    desc: "Kolaborasi seru acara Akrobat bersama HMTB. Sinergi antar himpunan yang dipenuhi keceriaan dan diskusi interaktif.",
    img: "/timeline/akrobatwithhmtb.jpg",
    tilt: "rotate-[1.5deg]"
  },
  {
    id: "rabulmar",
    title: "Rabul Maret & Evaluasi TW1",
    emoji: "📊",
    date: "29 Maret 2026",
    desc: "Rapat bulanan sekaligus evaluasi triwulan pertama. Menganalisis progress dan hambatan proker demi performa yang lebih baik.",
    img: "/timeline/rabulmaret&evaluasitw1.jpg",
    tilt: "rotate-[-1.5deg]"
  },
  {
    id: "fotopengurus",
    title: "Foto Pengurus",
    emoji: "📸",
    date: "18 April 2026",
    desc: "Sesi pemotretan pengurus Kabinet Astravia. Senyum terbaik dan seragam kebanggaan, bukti kesiapan kita mengabdi satu periode penuh.",
    img: "/timeline/fotopengurus.jpg",
    tilt: "rotate-[2deg]"
  },
  {
    id: "uts",
    title: "ResponsIF UTS Genap 2026",
    emoji: "📝",
    date: "18-19 April 2026",
    desc: "Program ResponsIF UTS untuk membantu mahasiswa mempersiapkan diri menghadapi ujian tengah semester genap melalui latihan soal dan tutorial.",
    img: "/timeline/responsifutsgenap2026.jpg",
    tilt: "rotate-[-1deg]"
  },
  {
    id: "upgrading",
    title: "UPGRADING HMIF 2026",
    emoji: "⚡",
    date: "25-26 April 2026",
    desc: "Kegiatan peningkatan kapasitas diri pengurus dengan materi kepemimpinan, kerja sama tim, dan refreshing bersama untuk menyegarkan pikiran.",
    img: "/timeline/upgradinghmif2026.jpg",
    tilt: "rotate-[2.5deg]"
  },
  {
    id: "shortmovie",
    title: "Short Movie",
    emoji: "🎬",
    date: "9-10 Mei 2026",
    desc: "Proses kreatif pembuatan film pendek HMIF. Kolaborasi seni dan teknologi, mengekspresikan ide kreatif lewat karya visual.",
    img: "/timeline/shortmovie.jpg",
    tilt: "rotate-[-2deg]"
  },
  {
    id: "fitfun",
    title: "Fit & Fun",
    emoji: "🏃‍♂️",
    date: "15 Mei 2026",
    desc: "Kegiatan olahraga bersama untuk menjaga kebugaran tubuh, melepas kepenatan rutinitas, dan menjalin kebersamaan santai.",
    img: "/timeline/fit&fun.jpg",
    tilt: "rotate-[1.5deg]"
  },
  {
    id: "rakerwil",
    title: "Rakerwil Cilacap",
    emoji: "🏢",
    date: "16-17 Mei 2026",
    desc: "Kehadiran delegasi HMIF dalam Rapat Kerja Wilayah di Cilacap, menyelaraskan program kerja dan memperluas jejaring organisasi.",
    img: "/timeline/rakerwilcilacap.jpg",
    tilt: "rotate-[-1.5deg]"
  },
  {
    id: "kuliahumum1",
    title: "Kuliah Umum 1",
    emoji: "🎓",
    date: "20 Mei 2026",
    desc: "Kuliah umum perdana dengan narasumber ahli, memperluas wawasan mahasiswa mengenai perkembangan teknologi terkini.",
    img: "/timeline/kuliahumum1.jpg",
    tilt: "rotate-[2deg]"
  },
  {
    id: "talkshow",
    title: "Talkshow Kewirausahaan",
    emoji: "💰",
    date: "23 Mei 2026",
    desc: "Talkshow inspiratif kewirausahaan, memotivasi mahasiswa untuk menggali potensi bisnis di era digital.",
    img: "/timeline/talkshowkewirausahaan.jpg",
    tilt: "rotate-[-2.5deg]"
  },
  {
    id: "sosialmengajar",
    title: "Sosial Mengajar",
    emoji: "🏫",
    date: "25 Mei 2026",
    desc: "Kegiatan pengabdian masyarakat melalui program mengajar, membagikan ilmu komputer dasar kepada anak-anak sekolah.",
    img: "/timeline/sosialmengajar.jpg",
    tilt: "rotate-[1deg]"
  },
  {
    id: "kuliahumum2",
    title: "Kuliah Umum 2",
    emoji: "🔬",
    date: "25 Mei 2026",
    desc: "Kuliah umum kedua yang mengupas tuntas implementasi teknologi industri dan peluang karir di masa depan.",
    img: "/timeline/kuliahumum2.jpg",
    tilt: "rotate-[-1.5deg]"
  },
  {
    id: "workshopobs",
    title: "Workshop OBS",
    emoji: "🎥",
    date: "30 Mei 2026",
    desc: "Workshop praktis penggunaan OBS Studio untuk kebutuhan streaming, recording, dan produksi konten digital.",
    img: "/timeline/workshopobs.jpg",
    tilt: "rotate-[2deg]"
  },
  {
    id: "podcast",
    title: "Podcast Informatics",
    emoji: "🎙️",
    date: "6 Juni 2026",
    desc: "Rekaman podcast seru HMIF yang membahas kehidupan kampus, tips akademik, dan obrolan menarik seputar dunia IT.",
    img: "/timeline/podcastinformatics.jpg",
    tilt: "rotate-[-2deg]"
  },
  {
    id: "uas",
    title: "ResponsIF UAS",
    emoji: "✍️",
    date: "13-14 Juni 2026",
    desc: "Program belajar bersama menyambut Ujian Akhir Semester genap, memberikan bimbingan materi kuliah intensif bagi mahasiswa.",
    img: "/timeline/responsiuasganjil2026.jpg",
    tilt: "rotate-[1.5deg]"
  },
  {
    id: "kuliahumum3",
    title: "Kuliah Umum 3",
    emoji: "🌐",
    date: "18 Juni 2026",
    desc: "Kuliah umum edisi ketiga, menghadirkan topik mutakhir untuk mempersiapkan kompetensi lulusan di dunia kerja.",
    img: "/timeline/kuliahumum3.jpg",
    tilt: "rotate-[-1.5deg]"
  },
  {
    id: "webinar",
    title: "Webinar UPGRADE IF",
    emoji: "💻",
    date: "20 Juni 2026",
    desc: "Webinar peningkatan kapasitas akademik dan profesional mahasiswa informatika.",
    img: null,
    tilt: "rotate-[2deg]"
  }
];

export default function JourneyPage() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Simulate Windows 95/Y2K preloader boot progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 300); // Small buffer for smoother entry
          return 100;
        }
        // Organic randomized progression
        const step = Math.floor(Math.random() * 15) + 5;
        return Math.min(prev + step, 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1A1D20] flex items-center justify-center p-4">
        {/* Win95 Preloader Dialogue Box */}
        <div className="bg-[#c0c0c0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black p-1 w-full max-w-sm shadow-2xl text-black font-mono select-none">
          {/* Header Bar */}
          <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between font-bold text-xs uppercase">
            <span>⚙️ Booting Astravia.exe</span>
            <div className="flex gap-0.5">
              <span className="w-4 h-4 bg-[#c0c0c0] border-t border-l border-white border-b border-r border-gray-600 text-black flex items-center justify-center text-[8px] font-bold">_</span>
              <span className="w-4 h-4 bg-[#c0c0c0] border-t border-l border-white border-b border-r border-gray-600 text-black flex items-center justify-center text-[8px] font-bold">X</span>
            </div>
          </div>
          
          {/* Body Content */}
          <div className="p-4 space-y-4">
            <div className="text-xs space-y-1">
              <p className="text-blue-800 font-bold">HMIF ASTRAVIA OS 2026</p>
              <p className="text-gray-600">Checking timeline logs...</p>
              <p className="text-green-700">✓ Converted HEIC assets loaded</p>
              <p className="text-green-700">✓ Compressed image weights (Saved 62MB)</p>
              <p className="text-pink-600 animate-pulse">Initializing flashback engine...</p>
            </div>

            {/* Progress Bar Container */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-700 font-bold uppercase">
                <span>Loading Memories...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-[#808080] border-b border-r border-white border-t border-l border-black p-0.5 h-6">
                <div 
                  className="bg-[#000080] h-full transition-all duration-100 ease-out flex items-center justify-end pr-1 text-[9px] text-white font-bold"
                  style={{ width: `${progress}%` }}
                >
                  {progress > 15 && `${progress}%`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen y2k-mesh-bg relative overflow-hidden pb-32 text-[#1A1D20] font-sans">
      
      {/* Absolute Decorative Grid Elements for Y2K Scrapbook Feeling */}
      <div className="absolute top-20 left-10 w-16 h-16 border-2 border-black/5 rounded-full rotate-[12deg] flex items-center justify-center text-4xl select-none opacity-20 pointer-events-none">
        ⭐
      </div>
      <div className="absolute top-96 right-8 w-20 h-20 border-2 border-black/5 rounded-lg rotate-[-15deg] flex items-center justify-center text-5xl select-none opacity-25 pointer-events-none">
        🎨
      </div>
      <div className="absolute bottom-40 left-16 w-24 h-24 border-2 border-black/5 rounded-full rotate-[20deg] flex items-center justify-center text-6xl select-none opacity-20 pointer-events-none">
        🚀
      </div>

      {/* WIN95 STYLE BACK BUTTON BAR */}
      <div className="sticky top-0 z-40 bg-[#1A1D20]/95 backdrop-blur-sm text-white border-b-4 border-black px-4 py-3 flex justify-between items-center shadow-lg">
        <Link 
          href="/"
          className="bg-white hover:bg-gray-100 text-black font-lexend font-black px-3.5 py-1.5 border-2.5 border-black rounded-lg shadow-neo-sm text-xs flex items-center gap-1.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer select-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Mading
        </Link>
        <div className="flex items-center gap-2 font-lilita uppercase tracking-wider text-xs sm:text-sm select-none pr-1">
          <Sparkles className="w-4 h-4 text-[#FFBE0B] animate-spin-slow" />
          <span>Kilas Balik Setengah Tahun HMIF</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 relative">
        
        {/* Timeline Header Intro */}
        <header className="text-center mb-20 relative select-none">
          <span className="font-lilita text-xs bg-[#06D6A0] text-black px-3 py-1 border-3 border-black rounded uppercase shadow-neo-sm rotate-[-1.5deg] inline-block mb-3">
            Kabinet Astravia 2026
          </span>
          <h1 className="text-4xl sm:text-6xl font-lilita uppercase text-black drop-shadow-[3px_3px_0px_#000] leading-none mb-4">
            Perjalanan Kita Sejauh Ini
          </h1>
          <p className="max-w-xl mx-auto text-xs sm:text-sm font-lexend font-semibold text-gray-700 bg-white border-3 border-black p-4 rounded-xl shadow-neo-sm rotate-[0.5deg]">
            Setiap langkah adalah cerita, setiap rapat adalah karya. Dari awal perjumpaan hingga proker penutup triwulan ini. 
            Semua terekam indah dalam lembaran kenangan kita! 🌟
          </p>
        </header>

        {/* Vertical Path road line (dashed roadmap style with footprints background) */}
        <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-48 bottom-48 w-2 bg-transparent border-l-4 border-dashed border-black/35 z-0"></div>

        {/* Milestones mapped */}
        <div className="space-y-20 relative z-10">
          {TIMELINE_EVENTS.map((event, index) => {
            const isLeft = index % 2 === 0;
            return (
              <div 
                key={event.id}
                className={`flex flex-col md:flex-row items-start md:items-center w-full ${
                  isLeft ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Placeholder space on opposite side for desktop */}
                <div className="hidden md:block w-1/2"></div>

                {/* The timeline node dot with active emoji */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#FFBE0B] border-3 border-black flex items-center justify-center shadow-neo-sm z-20 group hover:scale-110 hover:bg-[#FF006E] transition-all cursor-default">
                  <span className="text-sm select-none group-hover:scale-125 transition-transform">{event.emoji}</span>
                </div>

                {/* Content Card with Framer Motion scroll triggers */}
                <motion.div 
                  initial={{ opacity: 0, x: isLeft ? 40 : -40, y: 30 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 80 }}
                  className={`w-[calc(100%-48px)] ml-12 md:ml-0 md:w-[45%] bg-white border-3 border-black p-4 sm:p-5 rounded-2xl shadow-neo-md relative group hover:scale-[1.02] hover:shadow-neo-lg transition-all ${event.tilt}`}
                >
                  
                  {/* Decorative tape sticker on top of polaroid */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-[#FFFDF0]/90 border-2 border-black/30 rotate-[-2deg] shadow-sm flex items-center justify-center font-handwriting text-[9px] font-bold text-amber-900 pointer-events-none uppercase tracking-widest select-none z-10">
                    ★ KABINET AST R AVIA ★
                  </div>

                  {/* Event Photo with Polaroid styling */}
                  <div className="bg-[#FAF7F0] border-2.5 border-black p-2.5 rounded shadow-inner mb-4 relative overflow-hidden bg-dot-pattern">
                    {event.img ? (
                      <div className="relative overflow-hidden border border-black/10 rounded bg-white aspect-[4/3] flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={event.img} 
                          alt={event.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-[4/3] border-3 border-dashed border-gray-400 rounded bg-gray-50 flex flex-col items-center justify-center text-gray-500 gap-2 select-none">
                        <span className="text-4xl animate-bounce">📸</span>
                        <span className="font-lexend font-black text-[10px] uppercase tracking-wider text-gray-400">
                          Foto Menyusul
                        </span>
                      </div>
                    )}

                    {/* Date label inside photo frame (looks like polaroid pen write-in) */}
                    <div className="mt-3.5 flex items-center justify-between border-t border-black/5 pt-2 select-none">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-[#FF006E] flex-shrink-0" />
                        <span className="font-handwriting font-black text-xs">
                          {event.date}
                        </span>
                      </div>
                      <span className="font-lilita text-[10px] uppercase text-[#3A86FF] bg-[#3A86FF]/10 px-2 py-0.5 border border-[#3A86FF]/20 rounded-md">
                        {event.id.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Title and description */}
                  <div className="text-left">
                    <h4 className="font-lilita text-lg sm:text-xl text-[#1A1D20] uppercase leading-tight mb-2 flex items-center gap-1.5">
                      <span className="text-lg">{event.emoji}</span>
                      {event.title}
                    </h4>
                    <p className="font-lexend text-xs text-gray-600 leading-relaxed font-semibold">
                      {event.desc}
                    </p>
                  </div>

                  {/* Scrapbook Visual Ornament badge inside card */}
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#FF006E] border-2 border-black rounded-full shadow-neo-sm rotate-[15deg] items-center justify-center hidden group-hover:flex text-white text-[9px] font-lilita uppercase select-none">
                    ★
                  </div>

                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Outro Card at the bottom */}
        <div className="mt-28 relative z-10 flex justify-center">
          <div className="absolute left-6 md:left-1/2 -translate-x-1/2 -top-12 w-10 h-10 rounded-full bg-[#06D6A0] border-3 border-black flex items-center justify-center shadow-neo-sm z-20">
            <span className="text-sm select-none">🏁</span>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            onViewportEnter={() => {
              // Trigger beautiful confetti shower when user scrolls to bottom
              import("canvas-confetti").then((confetti) => {
                const duration = 2.5 * 1000;
                const end = Date.now() + duration;

                (function frame() {
                  confetti.default({
                    particleCount: 4,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#FF006E', '#FFBE0B', '#3A86FF', '#06D6A0']
                  });
                  confetti.default({
                    particleCount: 4,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#FF006E', '#FFBE0B', '#3A86FF', '#06D6A0']
                  });

                  if (Date.now() < end) {
                    requestAnimationFrame(frame);
                  }
                }());
              });
            }}
            transition={{ duration: 0.5, type: "spring" }}
            className="w-[calc(100%-48px)] ml-12 md:ml-0 md:max-w-lg bg-[#FFBE0B] border-4 border-black p-6 sm:p-8 rounded-2xl shadow-neo-lg text-center relative rotate-[-1deg]"
          >
            <div className="absolute -top-5 -left-5 w-12 h-12 bg-[#FF006E] border-3 border-black rounded-full flex items-center justify-center rotate-[-12deg] shadow-neo-sm text-lg select-none">
              💖
            </div>

            <h3 className="font-lilita text-2xl sm:text-4xl text-black uppercase leading-none mb-4 tracking-wider">
              Setengah Perjalanan Terlewati!
            </h3>
            
            <div className="space-y-4 font-lexend font-extrabold text-sm sm:text-base text-black bg-white/40 border-2.5 border-black/25 p-4 rounded-xl mb-6 select-text leading-relaxed">
              <p>“Tetap Semangat untuk setengah perjalanan Berikutnya!” 🚀</p>
              <p className="text-[#FF006E] text-base sm:text-lg">“Selamat Liburan Guys!! 🎉🏖️”</p>
            </div>

            <div className="flex gap-3 justify-center">
              <Link
                href="/"
                className="px-5 py-2.5 bg-[#1A1D20] text-white hover:bg-black font-lexend font-black text-xs uppercase tracking-wider border-2.5 border-black rounded-lg shadow-neo-sm active:translate-y-0.5 active:shadow-none transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Mading
              </Link>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
