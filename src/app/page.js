"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Lock, 
  LogOut, 
  User, 
  Sparkles, 
  Heart, 
  ArrowRight,
  Smile,
  Pin,
  Plus,
  Trash2
} from "lucide-react";
import { getMembers, signIn, getStickyNotes, addStickyNote, deleteStickyNote } from "@/lib/db";
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
  
  // Pagination State for Polaroid Gallery
  const [visibleCount, setVisibleCount] = useState(16);
  
  // Sticky Notes States
  const [stickyNotes, setStickyNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteColor, setNewNoteColor] = useState("bg-[#FFFFB5]"); // Y2K neon yellow default
  const [noteLoading, setNoteLoading] = useState(false);
  const [previewNote, setPreviewNote] = useState(null);

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
        return "/HCCB.webp";
      case "Talent Development & Innovation":
        return "/TDI.webp";
      case "Humanity Impact & Development":
        return "/HID.webp";
      case "Finance & Enterprise Development":
        return "/FED.webp";
      case "Creative Content & Outreach":
        return "/CCO.webp";
      case "External Relations & Advocacy":
        return "/ERA.webp";
      case "Executive Board":
      default:
        return "/Foto Kabinet.webp";
    }
  };

  // Load members, session, and sticky notes on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getMembers();
        setAllMembers(data);
      } catch (err) {
        console.error("Failed to load members", err);
      }
      
      try {
        const notes = await getStickyNotes();
        setStickyNotes(notes);
      } catch (err) {
        console.error("Failed to load sticky notes", err);
      }
      
      const session = getSession();
      setCurrentUser(session);
    }
    loadData();
  }, []);

  // Reset pagination count on search or filter change
  useEffect(() => {
    setVisibleCount(16);
  }, [selectedDept, searchQuery]);

  // Sticky Notes Handlers
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || noteLoading) return;

    setNoteLoading(true);
    try {
      const newNote = await addStickyNote({
        content: newNoteText,
        color: newNoteColor,
        sender_name: currentUser ? currentUser.nama : "Anonim"
      });
      setStickyNotes(prev => [...prev, newNote]);
      setNewNoteText("");
    } catch (err) {
      alert("Gagal menambahkan memo: " + err.message);
    } finally {
      setNoteLoading(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!confirm("Hapus memo aspirasi ini?")) return;
    try {
      await deleteStickyNote(id);
      setStickyNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      alert("Gagal menghapus memo: " + err.message);
    }
  };

  // Stamp Badge Overlay Renderer
  const renderStamps = (stampsStr) => {
    if (!stampsStr) return null;
    const list = stampsStr.split(",").map(s => s.trim()).filter(Boolean);
    
    const STAMP_STYLES = {
      "Bintang Utama": { bg: "bg-[#FFBE0B]", text: "text-black", border: "border-black", emoji: "⭐" },
      "Sangat Aktif": { bg: "bg-[#FF006E]", text: "text-white", border: "border-black", emoji: "🔥" },
      "Inovatif": { bg: "bg-[#3A86FF]", text: "text-white", border: "border-black", emoji: "💡" },
      "Team Player": { bg: "bg-[#06D6A0]", text: "text-black", border: "border-black", emoji: "🤝" }
    };

    const COLORS = [
      { bg: "bg-[#FFBE0B]", text: "text-black" },
      { bg: "bg-[#FF006E]", text: "text-white" },
      { bg: "bg-[#3A86FF]", text: "text-white" },
      { bg: "bg-[#06D6A0]", text: "text-black" }
    ];

    const parseStamp = (stampStr) => {
      const trimmed = stampStr.trim();
      const spaceIdx = trimmed.indexOf(" ");
      if (spaceIdx === -1) {
        if (STAMP_STYLES[trimmed]) {
          return { emoji: STAMP_STYLES[trimmed].emoji, text: trimmed };
        }
        return { emoji: "📌", text: trimmed };
      }
      const firstToken = trimmed.slice(0, spaceIdx);
      const remaining = trimmed.slice(spaceIdx + 1).trim();
      const isWord = /^[A-Za-z0-9]+$/.test(firstToken);
      if (isWord) {
        if (STAMP_STYLES[trimmed]) {
          return { emoji: STAMP_STYLES[trimmed].emoji, text: trimmed };
        }
        return { emoji: "📌", text: trimmed };
      }
      return { emoji: firstToken, text: remaining };
    };
    
    return (
      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
        {list.map((stampStr, idx) => {
          const parsed = parseStamp(stampStr);
          const style = STAMP_STYLES[parsed.text] || { 
            ...COLORS[idx % COLORS.length], 
            border: "border-black", 
            emoji: parsed.emoji 
          };
          return (
            <div 
              key={idx} 
              className={`px-1.5 py-0.5 border-2 ${style.border || 'border-black'} ${style.bg} ${style.text} font-lilita text-[8px] uppercase tracking-wider shadow-neo-sm rotate-[-4deg] rounded-sm flex items-center gap-0.5`}
            >
              <span>{parsed.emoji}</span>
              <span>{parsed.text}</span>
            </div>
          );
        })}
      </div>
    );
  };

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
        (m.nama || "").toLowerCase().includes(query) || 
        (m.jabatan || "").toLowerCase().includes(query)
      );
    }
    return true;
  });

  const visibleMembers = filteredMembers.slice(0, visibleCount);

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
    <div className="min-h-screen y2k-mesh-bg flex flex-col relative overflow-hidden pb-16">
      
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
        <header className="flex flex-col items-center text-center my-8 relative gap-4">

          <div className="relative">
            <h1 className="text-4xl md:text-6xl font-lilita uppercase tracking-tight text-[#1A1D20] drop-shadow-[4px_4px_0px_#000] leading-none mb-2">
              Evaluasi & Apresiasi
            </h1>
            <div className="flex justify-center items-center gap-2">
              <span className="text-2xl md:text-4xl font-lilita bg-[#3A86FF] text-white px-4 py-1 border-4 border-black rotate-[-2deg] shadow-neo-sm uppercase">
                Anggota HMIF 2026
              </span>
            </div>
          </div>
          
          <p className="max-w-xl mt-4 text-sm md:text-base font-lexend font-medium text-gray-700 bg-white border-3 border-black p-3 rounded-lg shadow-neo-sm rotate-[1deg]">
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
          <div className="flex overflow-x-auto md:flex-wrap gap-2 pb-2 md:pb-0 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 pt-2 border-t-2 border-black/10">
            {Object.keys(DEPARTMENTS).map((deptName) => {
              const active = selectedDept === deptName;
              const deptInfo = DEPARTMENTS[deptName];
              
              return (
                <button
                  key={deptName}
                  onClick={() => setSelectedDept(deptName)}
                  style={{ backgroundColor: active ? deptInfo.color : '#FFFFFF' }}
                  className={`flex-shrink-0 px-3 py-2 border-2.5 border-black rounded-lg font-lexend font-bold text-xs uppercase cursor-pointer transition-all duration-150
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
            <div className="space-y-10">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
                {visibleMembers.map((member, index) => {
                  const deptColor = DEPARTMENTS[member.departemen]?.color || "#FFFFFF";
                  // Alternate rotation angles for polaroids to look organic on a mading board
                  const rotation = index % 4 === 0 ? "hover:rotate-[4deg]" : index % 4 === 1 ? "hover:rotate-[-4deg]" : index % 4 === 2 ? "hover:rotate-[2deg]" : "hover:rotate-[-2deg]";
                  
                  return (
                    <div
                      key={member.id}
                      onClick={() => handleCardClick(member)}
                      style={{ backgroundColor: deptColor }}
                      className={`relative p-2.5 sm:p-3 border-3 sm:border-4 border-black rounded-sm shadow-neo-sm sm:shadow-neo-md transition-all duration-300 transform hover:scale-[1.03] cursor-pointer flex flex-col justify-between select-none ${rotation}`}
                    >
                      {/* Tape sticker on top of polaroid */}
                      <div className="absolute -top-2.5 sm:-top-3.5 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-5.5 sm:h-7 bg-amber-200/80 border-2 border-black/20 rotate-[-3deg] shadow-sm flex items-center justify-center font-handwriting text-[7px] sm:text-[9px] font-bold text-amber-900 pointer-events-none uppercase">
                        ★ HMIF ★
                      </div>
                      
                      {/* Photo container */}
                      <div className="bg-white border-2 sm:border-3 border-black w-full aspect-square relative overflow-hidden mt-1 mb-2 sm:mb-3 shadow-inner">
                        {renderStamps(member.stamps)}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={member.foto_url} 
                          alt={member.nama} 
                          loading="lazy"
                          className="w-full h-full object-cover select-none"
                        />
                      </div>
                      
                      {/* Polaroid Text Area */}
                      <div className="bg-[#FFFDF0] border-2 border-black p-1.5 sm:p-2 rounded-sm text-center flex-grow flex flex-col justify-center">
                        <h4 className="font-handwriting font-bold text-[#1A1D20] text-xs sm:text-sm leading-tight line-clamp-2 mb-1">
                          {member.nama}
                        </h4>
                        <p className="font-lexend font-black uppercase text-[8px] sm:text-[9px] tracking-wide text-gray-500 leading-none">
                          {member.jabatan}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {filteredMembers.length > visibleCount && (
                <div className="flex justify-center mt-12 mb-6">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="px-6 py-3 border-4 border-black rounded-xl bg-[#FFBE0B] text-black font-lilita text-lg uppercase cursor-pointer hover:bg-[#FFD000] hover:scale-105 active:scale-95 transition-all duration-150 shadow-neo-md"
                  >
                    📂 Tampilkan Lebih Banyak ({filteredMembers.length - visibleCount} Anggota Tersisa)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border-4 border-black rounded-2xl shadow-neo-md max-w-lg mx-auto">
              <Smile className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h3 className="font-lexend font-extrabold text-xl text-black">Anggota tidak ditemukan</h3>
              <p className="font-lexend text-gray-500 text-sm mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          )}
        </main>

        {/* Sticky Notes Wall / Papan Aspirasi */}
        <section className="max-w-[95%] mx-auto mt-16 mb-8 px-4">
          <div className="bg-[#FAF7F0] border-4 border-black p-6 rounded-2xl shadow-neo-lg relative overflow-hidden">
            {/* Decorative corkboard tape */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-amber-800/20 border-b-2 border-black/10"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-4 select-none">
              <div>
                <h2 className="font-lilita text-3xl text-black uppercase tracking-tight flex items-center gap-2">
                  <Pin className="w-6 h-6 text-[#FF006E] rotate-[-25deg]" />
                  Papan Aspirasi Pengurus HMIF
                </h2>
                <p className="font-lexend text-xs text-gray-500 font-bold mt-1">
                  📌 Tinggalkan catatan semangat, candaan, atau kesan pesan Anda selama kepengurusan Kabinet Astravia!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Sticky Note Form */}
              <div className="lg:col-span-1 bg-white border-3 border-black p-4 rounded-xl shadow-neo-sm h-fit">
                <h3 className="font-lilita text-sm text-black uppercase mb-3">Tulis Aspirasi Baru</h3>
                <form onSubmit={handleAddNote} className="space-y-4">
                  <div>
                    <textarea
                      rows={4}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Tulis pesan penyemangat atau kesan di sini..."
                      required
                      maxLength={150}
                      className="w-full p-2.5 border-2.5 border-black rounded-lg font-lexend text-xs text-black focus:outline-none focus:ring-3 focus:ring-[#FFBE0B]/30 bg-white placeholder-gray-400"
                    />
                    <div className="text-[10px] text-gray-400 font-lexend text-right mt-1">
                      {newNoteText.length}/150 karakter
                    </div>
                  </div>

                  {/* Color Selector */}
                  <div>
                    <label className="block font-lilita text-[10px] uppercase text-gray-500 mb-2">Pilih Warna Memo</label>
                    <div className="flex gap-2">
                      {[
                        { class: "bg-[#FFFFB5]", label: "Kuning" },
                        { class: "bg-[#FFD1DC]", label: "Pink" },
                        { class: "bg-[#C1F0F6]", label: "Biru" },
                        { class: "bg-[#D0F8B3]", label: "Hijau" }
                      ].map((c) => (
                        <button
                          type="button"
                          key={c.class}
                          onClick={() => setNewNoteColor(c.class)}
                          className={`w-7 h-7 rounded-full border-2 border-black cursor-pointer transition-transform ${c.class} ${
                            newNoteColor === c.class ? "scale-110 ring-2 ring-black/40" : "hover:scale-105"
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={noteLoading}
                    className="w-full bg-[#FFBE0B] hover:bg-[#e6ab0a] text-black font-lexend font-black py-2 border-2.5 border-black rounded-lg shadow-neo-sm text-xs flex items-center justify-center gap-1 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {noteLoading ? "Menempel..." : "Tempel Memo"}
                  </button>
                </form>
              </div>

              {/* Corkboard Display Area */}
              <div className="lg:col-span-4 min-h-[450px] border-3 border-dashed border-black/30 bg-[#FFFDF8] rounded-xl p-3 sm:p-4 relative flex flex-wrap gap-3 sm:gap-4 items-start content-start overflow-y-auto max-h-[650px]">
                {stickyNotes.length > 0 ? (
                  stickyNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={(e) => {
                        if (e.target.closest('.delete-btn')) return;
                        setPreviewNote(note);
                      }}
                      className={`p-3 sm:p-4 border-2.5 border-black w-[calc(50%-6px)] sm:w-[180px] h-[160px] sm:h-[180px] flex flex-col justify-between shadow-neo-sm transition-all duration-200 hover:scale-105 hover:-translate-y-1 hover:shadow-neo-md cursor-pointer select-none relative ${note.color}`}
                      style={{ transform: `rotate(${note.rotation || 0}deg)` }}
                    >
                      {/* Tiny visual pin at the top center */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-red-500 rounded-full border border-black/50 shadow-sm flex items-center justify-center font-bold text-[7px] text-white">
                        📍
                      </div>
                      
                      {/* Admin delete button */}
                      {currentUser && currentUser.role === "admin" && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="delete-btn absolute top-1.5 right-1.5 text-gray-500 hover:text-red-500 transition-colors cursor-pointer z-10"
                          title="Hapus Memo (Admin Only)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="font-handwriting font-bold text-[11px] sm:text-[13px] leading-snug text-gray-800 line-clamp-5 sm:line-clamp-6 pt-1">
                        {note.content}
                      </div>

                      <div className="border-t border-black/10 pt-1 mt-1 sm:pt-1.5 sm:mt-1.5 flex flex-col justify-end text-left select-none">
                        <span className="font-lexend font-black text-[8px] sm:text-[9px] text-gray-600 truncate uppercase leading-none">
                          ~ {note.sender_name}
                        </span>
                        <span className="font-lexend text-[6px] sm:text-[7px] text-gray-400 leading-none mt-0.5 sm:mt-1">
                          {new Date(note.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full flex flex-col items-center justify-center py-16 text-center select-none">
                    <span className="text-4xl mb-2">📌</span>
                    <h4 className="font-lexend font-black text-sm text-gray-400">Papan Aspirasi Masih Kosong</h4>
                    <p className="font-lexend text-[11px] text-gray-400 mt-0.5">Jadilah yang pertama menempelkan memo penyemangat!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>




      {/* LOGIN MODAL */}
      {loginModalOpen && targetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/50 overlay-polka-dot transition-all duration-300">
          <div className="bg-[#FFFDF0] border-4 border-black p-6 rounded-2xl max-w-md w-full relative shadow-neo-xl animate-in scale-in duration-200">
            {/* Modal Sticker Decorator */}
            <div className="absolute -top-4 -right-2 sm:-top-6 sm:-right-6 w-12 sm:w-16 h-12 sm:h-16 bg-[#FFBE0B] border-3 sm:border-4 border-black rounded-full shadow-neo-sm rotate-[12deg] flex items-center justify-center font-lilita text-black text-[9px] sm:text-xs p-1 text-center select-none z-10">
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

      {/* MEMO PREVIEW MODAL */}
      {previewNote && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 overlay-polka-dot transition-all duration-300"
          onClick={() => setPreviewNote(null)}
        >
          <div 
            className={`p-6 sm:p-8 border-4 border-black w-[92vw] sm:w-[350px] min-h-[320px] sm:min-h-[350px] flex flex-col justify-between shadow-neo-xl relative animate-in zoom-in duration-200 cursor-default ${previewNote.color}`}
            onClick={(e) => e.stopPropagation()}
            style={{ transform: 'rotate(0.5deg)' }}
          >
            {/* Y2K Header Tag */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-8 bg-amber-100/90 border-2 border-black rotate-[-2deg] shadow-sm flex items-center justify-center font-handwriting text-xs font-bold text-amber-900 select-none uppercase">
              📌 Aspirasi
            </div>

            {/* Y2K styled cross button */}
            <button
              onClick={() => setPreviewNote(null)}
              className="absolute -top-3.5 -right-3.5 w-8 h-8 rounded-full bg-red-500 text-white font-lilita border-3 border-black shadow-[2px_2px_0px_#000] hover:bg-red-600 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-sm"
              title="Tutup"
            >
              ✕
            </button>

            {/* Memo Content */}
            <div className="font-handwriting font-bold text-lg leading-relaxed text-gray-800 pt-3 select-text overflow-y-auto max-h-[220px] pr-1 scrollbar-thin">
              {previewNote.content}
            </div>

            {/* Footer */}
            <div className="border-t-2 border-black/10 pt-4 mt-4 flex justify-between items-end select-none">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-lexend font-black uppercase text-gray-500 leading-none">Dikirim Oleh</span>
                <span className="font-lexend font-black text-sm text-black mt-1 uppercase">
                  {previewNote.sender_name}
                </span>
                <span className="font-lexend text-[9px] text-gray-400 leading-none mt-1">
                  {new Date(previewNote.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>

              {/* Admin delete from modal */}
              {currentUser && currentUser.role === "admin" && (
                <button
                  onClick={() => {
                    handleDeleteNote(previewNote.id);
                    setPreviewNote(null);
                  }}
                  className="px-3 py-1.5 rounded bg-red-100 hover:bg-red-200 border-2 border-red-600 text-red-700 font-lexend font-black text-[10px] uppercase cursor-pointer flex items-center gap-1 transition-all"
                  title="Hapus Memo Selamanya (Admin)"
                >
                  <Trash2 className="w-3 h-3" />
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
