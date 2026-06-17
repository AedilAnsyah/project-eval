"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Lock, 
  LogOut, 
  User, 
  Sparkles, 
  Heart, 
  ArrowRight,
  Smile
} from "lucide-react";
import { getMembers, signIn } from "@/lib/db";
import { getSession, clearSession, setSession } from "@/lib/session";

// Department configuration for colors and branding
const DEPARTMENTS = {
  "Semua": { color: "#1A1D20", text: "text-white", bg: "bg-[#1A1D20]" },
  "Executive Board": { color: "#FF6B6B", text: "text-black", bg: "bg-[#FF6B6B]", badge: "bg-[#FF6B6B] text-black" },
  "Human Capital & Character Building": { color: "#FFBE0B", text: "text-black", bg: "bg-[#FFBE0B]", badge: "bg-[#FFBE0B] text-black" },
  "Talent Development & Innovation": { color: "#3A86FF", text: "text-white", bg: "bg-[#3A86FF]", badge: "bg-[#3A86FF] text-white" },
  "Humanity Impact & Development": { color: "#06D6A0", text: "text-black", bg: "bg-[#06D6A0]", badge: "bg-[#06D6A0] text-black" },
  "Finance & Enterprise Development": { color: "#8338EC", text: "text-white", bg: "bg-[#8338EC]", badge: "bg-[#8338EC] text-white" },
  "Creative Content & Outreach": { color: "#FF006E", text: "text-white", bg: "bg-[#FF006E]", badge: "bg-[#FF006E] text-white" },
  "External Relations & Advocacy": { color: "#FB5607", text: "text-white", bg: "bg-[#FB5607]", badge: "bg-[#FB5607] text-white" }
};

export default function Home() {
  const router = useRouter();
  
  // States
  const [allMembers, setAllMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("Semua");
  const [currentUser, setCurrentUser] = useState(null);
  
  // Login Modal State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [targetMember, setTargetMember] = useState(null);
  const [loginNim, setLoginNim] = useState("");
  const [loginDob, setLoginDob] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper for department photo URLs
  const getDeptPhotoUrl = (dept) => {
    switch (dept) {
      case "Human Capital & Character Building":
        return "/HCCB.jpg";
      case "Talent Development & Innovation":
        return "/TDI.jpg";
      case "Humanity Impact & Development":
        return "/HID.jpg";
      case "Finance & Enterprise Development":
        return "/FED.jpg";
      case "Creative Content & Outreach":
        return "/CCO.jpg";
      case "External Relations & Advocacy":
        return "/ERA.jpg";
      case "Executive Board":
      default:
        return "/Foto Kabinet.jpg";
    }
  };

  // Load members and session on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getMembers();
        setAllMembers(data);
      } catch (err) {
        console.error("Failed to load members", err);
      }
      
      const session = getSession();
      setCurrentUser(session);
    }
    loadData();
  }, []);

  // Get filtered members directly during render to prevent double-renders and lint errors
  const filteredMembers = allMembers.filter((m) => {
    // Filter by department
    if (selectedDept !== "Semua" && m.departemen !== selectedDept) {
      return false;
    }
    // Filter by name query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      return (
        m.nama.toLowerCase().includes(query) || 
        m.jabatan.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    router.refresh();
  };

  const handleCardClick = (member) => {
    // If not logged in, open the login modal pre-filled for this member
    if (!currentUser) {
      setTargetMember(member);
      setLoginNim(member.nim);
      setLoginDob(""); // Let them type the date of birth
      setLoginPassword("");
      setLoginError("");
      setLoginModalOpen(true);
    } else {
      // If logged in, check permission
      // Admin can view any letter. Regular members/coords can only view their own.
      if (currentUser.role === 'admin' || currentUser.id === member.id) {
        router.push(`/letter/${member.id}`);
      } else {
        alert(`Kerahasiaan Terjamin! Anda hanya dapat membaca surat evaluasi Anda sendiri.`);
      }
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);

    try {
      const user = await signIn(loginNim, loginDob, loginPassword);
      // Save session
      setSession(user);
      setCurrentUser(user);
      setLoginModalOpen(false);
      
      // Load confetti effect (directly in browser)
      import("canvas-confetti").then((confetti) => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      });

      // Redirect to their letter
      router.push(`/letter/${user.id}`);
    } catch (err) {
      setLoginError(err.message || "Gagal masuk. Periksa kembali NIM & Tanggal Lahir.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMemberInModal = allMembers.find(m => m.nim === loginNim) || targetMember;
  const requiresPassword = !!(currentMemberInModal && (currentMemberInModal.role === 'admin' || currentMemberInModal.role === 'koor'));

  return (
    <div className="min-h-screen polka-dot-bg flex flex-col relative overflow-hidden pb-16">
      
      {/* Decorative Stickers (Neon Brutalism Elements) */}
      <div className="absolute top-8 left-6 w-24 h-24 bg-white rounded-full border-4 border-black rotate-[-12deg] shadow-neo-md flex items-center justify-center select-none hidden md:flex sticker-shake z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hmif_logo.png" alt="HMIF Logo" className="w-full h-full p-1 object-contain rounded-full" />
      </div>
      <div className="absolute top-12 right-12 w-24 h-24 bg-white rounded-lg border-4 border-black rotate-[15deg] shadow-neo-md flex items-center justify-center select-none hidden lg:flex sticker-shake z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kabinet_logo.png" alt="Cabinet Logo" className="w-full h-full p-2.5 object-contain" />
      </div>

 
      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-8 flex-grow">
        
        {/* Header Section */}
        <header className="text-center my-8 relative">

          <div className="inline-block relative">
            <h1 className="text-4xl md:text-6xl font-lilita uppercase tracking-tight text-[#1A1D20] drop-shadow-[4px_4px_0px_#000] leading-none mb-2">
              Evaluasi & Apresiasi
            </h1>
            <div className="flex justify-center items-center gap-2">
              <span className="text-2xl md:text-4xl font-lilita bg-[#3A86FF] text-white px-4 py-1 border-4 border-black rotate-[-2deg] shadow-neo-sm uppercase">
                Anggota HMIF 2026
              </span>
            </div>
          </div>
          
          <p className="max-w-xl mx-auto mt-6 text-sm md:text-base font-lexend font-medium text-gray-700 bg-white border-3 border-black p-3 rounded-lg shadow-neo-sm rotate-[1deg] inline-block">
            🎁 Papan mading digital apresiasi triwulan dua. Cari polaroid foto Anda, masukkan NIM & tanggal lahir, lalu buka surat apresiasi Anda!
          </p>
        </header>

        {/* User Session Bar */}
        <div className="mb-8 max-w-4xl mx-auto">
          {currentUser ? (
            <div className="bg-[#FFFDF0] border-4 border-black p-4 rounded-xl shadow-neo-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-3 border-black bg-white flex items-center justify-center overflow-hidden shadow-neo-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={currentUser.foto_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${currentUser.nama}`} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-lexend font-extrabold text-lg text-black leading-tight flex items-center gap-2">
                    {currentUser.nama}
                    <span className="text-xs uppercase px-2 py-0.5 border-2 border-black rounded-md bg-[#FFBE0B] font-bold">
                      {currentUser.role}
                    </span>
                  </h3>
                  <p className="text-xs font-lexend font-semibold text-gray-500 uppercase">{currentUser.jabatan} • {currentUser.departemen}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                <button 
                  onClick={() => router.push(`/letter/${currentUser.id}`)}
                  className="bg-[#06D6A0] hover:bg-[#05b889] text-black font-lexend font-black px-4 py-2 border-3 border-black rounded-lg shadow-neo-sm text-sm flex items-center gap-1.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  Buka Surat Saya
                </button>
                
                {(currentUser.role === 'admin' || currentUser.role === 'koor') && (
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="bg-[#3A86FF] hover:bg-[#206be6] text-white font-lexend font-black px-4 py-2 border-3 border-black rounded-lg shadow-neo-sm text-sm flex items-center gap-1.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  >
                    Dashboard Pengurus
                  </button>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="bg-[#FF6B6B] hover:bg-[#e05656] text-black font-lexend font-black px-3 py-2 border-3 border-black rounded-lg shadow-neo-sm text-sm flex items-center gap-1.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#FFFDF0] border-4 border-black p-3 rounded-xl shadow-neo-md text-center">
              <p className="font-lexend font-extrabold text-sm text-black flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-[#FF006E]" />
                Halaman Terkunci. Silakan klik kartu polaroid Anda di bawah untuk masuk.
              </p>
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="max-w-5xl mx-auto mb-10 bg-white border-4 border-black p-4 rounded-xl shadow-neo-md">
          {/* Search Box */}
          <div className="relative mb-4">
            <input 
              type="text" 
              placeholder="Cari nama anggota atau jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-3 border-black rounded-lg font-lexend font-semibold text-black placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-[#3A86FF]/30 focus:border-[#3A86FF] transition-all bg-[#F9F6F0]"
            />
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
          </div>

          {/* Department Filters */}
          <div className="flex flex-wrap gap-2 pt-2 border-t-2 border-black/10">
            {Object.keys(DEPARTMENTS).map((deptName) => {
              const active = selectedDept === deptName;
              const deptInfo = DEPARTMENTS[deptName];
              
              return (
                <button
                  key={deptName}
                  onClick={() => setSelectedDept(deptName)}
                  style={{ backgroundColor: active ? deptInfo.color : '#FFFFFF' }}
                  className={`px-3 py-2 border-2.5 border-black rounded-lg font-lexend font-bold text-xs uppercase cursor-pointer transition-all duration-150
                    ${active ? `${deptInfo.text} scale-105 shadow-neo-sm -translate-y-0.5` : 'bg-white hover:bg-gray-100 text-[#1A1D20] shadow-none'}
                  `}
                >
                  {deptName === "Semua" ? "Semua Departemen" : deptName === "Executive Board" ? "Executive Board" : deptName}
                </button>
              );
            })}
          </div>

          {/* Department Photo Preview Panel */}
          <div className="mt-4 border-4 border-black p-4 rounded-xl bg-[#FFFDF0] flex flex-col md:flex-row items-center gap-6 shadow-neo-sm transition-all duration-200">
            <div className="w-full md:w-[240px] aspect-[4/3] bg-white border-3 border-black p-1.5 rounded shadow-neo-sm overflow-hidden relative group flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={getDeptPhotoUrl(selectedDept)} 
                alt={selectedDept} 
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.03] select-none"
              />
            </div>
            <div className="flex-grow space-y-2 text-left">
              <span className="text-[10px] uppercase font-black px-2 py-0.5 border-2 border-black rounded bg-white text-black select-none">
                {selectedDept === 'Semua' ? 'Foto Bersama' : 'Foto Departemen'}
              </span>
              <h3 className="font-lilita text-xl text-black uppercase leading-none mt-1">
                {selectedDept === 'Semua' ? 'Kabinet Astravia 2026' : selectedDept}
              </h3>
              <p className="font-lexend text-xs text-gray-600 font-semibold leading-relaxed">
                {selectedDept === 'Semua' 
                  ? 'Foto bersama seluruh jajaran pengurus Kabinet Astravia HMIF. Solid, bersinergi, dan berdedikasi tinggi demi memajukan organisasi.'
                  : `Dokumentasi kebersamaan dan kerja keras seluruh anggota di bawah naungan Departemen ${selectedDept}.`}
              </p>
            </div>
          </div>
        </div>

        {/* Polaroid Grid Layout */}
        <main className="max-w-6xl mx-auto">
          {filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredMembers.map((member, index) => {
                const deptColor = DEPARTMENTS[member.departemen]?.color || "#FFFFFF";
                // Alternate rotation angles for polaroids to look organic on a mading board
                const rotation = index % 4 === 0 ? "hover:rotate-[4deg]" : index % 4 === 1 ? "hover:rotate-[-4deg]" : index % 4 === 2 ? "hover:rotate-[2deg]" : "hover:rotate-[-2deg]";
                
                return (
                  <div
                    key={member.id}
                    onClick={() => handleCardClick(member)}
                    style={{ backgroundColor: deptColor }}
                    className={`relative p-3 border-4 border-black rounded-sm shadow-neo-md transition-all duration-300 transform hover:scale-[1.03] cursor-pointer flex flex-col justify-between select-none ${rotation}`}
                  >
                    {/* Tape sticker on top of polaroid */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 h-7 bg-amber-200/80 border-2 border-black/20 rotate-[-3deg] shadow-sm flex items-center justify-center font-handwriting text-[9px] font-bold text-amber-900 pointer-events-none uppercase">
                      ★ HMIF ★
                    </div>
                    
                    {/* Photo container */}
                    <div className="bg-white border-3 border-black w-full aspect-square relative overflow-hidden mt-1 mb-3 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={member.foto_url} 
                        alt={member.nama} 
                        loading="lazy"
                        className="w-full h-full object-cover select-none"
                      />
                    </div>
                    
                    {/* Polaroid Text Area */}
                    <div className="bg-[#FFFDF0] border-2 border-black p-2 rounded-sm text-center flex-grow flex flex-col justify-center">
                      <h4 className="font-handwriting font-bold text-[#1A1D20] text-sm leading-tight line-clamp-2 mb-1">
                        {member.nama}
                      </h4>
                      <p className="font-lexend font-black uppercase text-[9px] tracking-wide text-gray-500 leading-none">
                        {member.jabatan}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border-4 border-black rounded-2xl shadow-neo-md max-w-lg mx-auto">
              <Smile className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h3 className="font-lexend font-extrabold text-xl text-black">Anggota tidak ditemukan</h3>
              <p className="font-lexend text-gray-500 text-sm mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          )}
        </main>
      </div>



      {/* LOGIN MODAL */}
      {loginModalOpen && targetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/50 overlay-polka-dot transition-all duration-300">
          <div className="bg-[#FFFDF0] border-4 border-black p-6 rounded-2xl max-w-md w-full relative shadow-neo-xl animate-in scale-in duration-200">
            {/* Modal Sticker Decorator */}
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#FFBE0B] border-4 border-black rounded-full shadow-neo-sm rotate-[12deg] flex items-center justify-center font-lilita text-black text-xs p-1 text-center select-none">
              SECURE LOGIN
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full border-3 border-black bg-white overflow-hidden shadow-neo-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={targetMember.foto_url} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-lexend font-black text-xl text-black leading-tight">Verifikasi Akses</h3>
                <p className="text-xs font-lexend font-bold text-gray-500 uppercase">{targetMember.nama}</p>
              </div>
            </div>

            <p className="text-xs font-lexend font-semibold text-gray-700 mb-4 bg-yellow-100 border-2 border-yellow-400 p-2 rounded-lg leading-relaxed">
              🔑 Sistem ini bersifat internal terdaftar. Masukkan NIM dan Tanggal Lahir Anda yang terdaftar pada organisasi untuk membuktikan identitas.
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* NIM Field */}
              <div>
                <label className="block font-lexend font-bold text-xs uppercase text-gray-600 mb-1">NIM Anggota (Identifier)</label>
                <input 
                  type="text" 
                  value={loginNim}
                  onChange={(e) => setLoginNim(e.target.value)}
                  placeholder="Masukkan NIM Anda"
                  required
                  className="w-full px-3 py-2 border-3 border-black rounded-lg font-lexend font-bold text-black focus:outline-none focus:ring-4 focus:ring-[#FFBE0B]/30 focus:border-[#FFBE0B] bg-white text-sm"
                />
              </div>

              {/* Tanggal Lahir Field */}
              <div>
                <label className="block font-lexend font-bold text-xs uppercase text-gray-600 mb-1">Tanggal Lahir (Login DOB)</label>
                <input 
                  type="text" 
                  value={loginDob}
                  onChange={(e) => setLoginDob(e.target.value)}
                  placeholder="YYYY-MM-DD (Contoh: 2004-01-01)"
                  required
                  className="w-full px-3 py-2 border-3 border-black rounded-lg font-lexend font-bold text-black focus:outline-none focus:ring-4 focus:ring-[#FFBE0B]/30 focus:border-[#FFBE0B] bg-white text-sm"
                />
              </div>

              {/* Password Field for Chairman, Vice Chairman, and Koor */}
              {requiresPassword && (
                <div>
                  <label className="block font-lexend font-bold text-xs uppercase text-gray-600 mb-1">Password Akses</label>
                  <input 
                    type="password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan Password Anda"
                    required
                    className="w-full px-3 py-2 border-3 border-black rounded-lg font-lexend font-bold text-black focus:outline-none focus:ring-4 focus:ring-[#FFBE0B]/30 focus:border-[#FFBE0B] bg-white text-sm"
                  />
                </div>
              )}

              {loginError && (
                <div className="bg-[#FF6B6B] border-3 border-black p-3 rounded-lg text-xs font-lexend font-black text-black shadow-neo-sm animate-bounce">
                  ⚠️ {loginError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(false)}
                  className="flex-1 bg-white hover:bg-gray-100 text-black font-lexend font-black py-2.5 border-3 border-black rounded-lg shadow-neo-sm text-sm active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#FFBE0B] hover:bg-[#e6ab0a] text-black font-lexend font-black py-2.5 border-3 border-black rounded-lg shadow-neo-sm text-sm flex items-center justify-center gap-1.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Memuat..." : (
                    <>
                      Masuk
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
