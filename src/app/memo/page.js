"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Pin, Plus, Trash2, Sparkles, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getStickyNotes, addStickyNote, deleteStickyNote } from "@/lib/db";
import { getSession } from "@/lib/session";

export default function MemoPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [stickyNotes, setStickyNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteColor, setNewNoteColor] = useState("bg-[#FFFFB5]"); // Y2K neon yellow default
  const [noteLoading, setNoteLoading] = useState(false);
  const [previewNote, setPreviewNote] = useState(null);

  // Load session and notes on mount
  useEffect(() => {
    async function loadData() {
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

  return (
    <div className="min-h-screen y2k-mesh-bg relative overflow-hidden pb-32 text-[#1A1D20] font-sans">
      
      {/* Absolute Decorative Grid Elements for Y2K Scrapbook Feeling */}
      <motion.div 
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
        className="absolute top-24 left-[3%] w-14 h-14 bg-[#FFBE0B] border-3 border-black rounded-full shadow-neo-sm rotate-[12deg] flex items-center justify-center text-xl select-none z-0 pointer-events-none"
      >
        ⭐
      </motion.div>
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
        className="absolute top-[15%] right-[5%] w-16 h-16 bg-[#FAF7F0] border-3 border-black rounded-full shadow-neo-sm flex items-center justify-center text-2xl select-none z-0 pointer-events-none"
      >
        💿
      </motion.div>
      <motion.div 
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut" }}
        className="absolute top-[25%] left-[5%] w-12 h-12 bg-[#3A86FF] border-3 border-black rounded shadow-neo-sm rotate-[-8deg] flex items-center justify-center text-xl select-none z-0 pointer-events-none"
      >
        📁
      </motion.div>
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
        className="absolute top-[35%] right-[4%] text-3xl select-none z-0 pointer-events-none"
      >
        ✨
      </motion.div>
      <motion.div 
        animate={{ rotate: [-8, 8, -8] }}
        transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
        className="absolute top-[48%] left-[4%] w-12 h-12 bg-[#06D6A0] border-3 border-black rounded shadow-neo-sm flex items-center justify-center text-xl select-none z-0 pointer-events-none"
      >
        💾
      </motion.div>
      <motion.div 
        animate={{ y: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
        className="absolute top-[60%] right-[6%] w-14 h-14 bg-[#FF006E] border-3 border-black rounded-full shadow-neo-sm rotate-[15deg] flex items-center justify-center text-xl select-none z-0 pointer-events-none"
      >
        ⚡
      </motion.div>
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 32, ease: "linear" }}
        className="absolute top-[75%] left-[3%] w-14 h-14 bg-[#FAF7F0] border-3 border-black rounded-full shadow-neo-sm flex items-center justify-center text-2xl select-none z-0 pointer-events-none"
      >
        🪐
      </motion.div>

      {/* WIN95 STYLE BACK BUTTON BAR */}
      <div className="sticky top-0 z-40 bg-[#1A1D20]/95 backdrop-blur-sm text-white border-b-4 border-black px-4 py-3 flex justify-between items-center shadow-lg">
        <Link 
          href="/"
          className="bg-white hover:bg-gray-100 text-black font-lexend font-black px-2.5 py-1 sm:px-3.5 sm:py-1.5 border-2.5 border-black rounded-lg shadow-neo-sm text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer select-none"
        >
          <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" />
          Kembali ke Mading
        </Link>
        <div className="flex items-center gap-1.5 font-lilita uppercase tracking-wider text-[10px] xs:text-xs sm:text-sm select-none pr-1 text-right justify-end leading-tight flex-1 max-w-[60%] sm:max-w-none">
          <Sparkles className="w-3.5 h-3.5 text-[#FFBE0B] animate-spin-slow flex-shrink-0" />
          <span>Papan Aspirasi Pengurus HMIF</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 relative">
        {/* Header Intro */}
        <header className="text-center mb-12 relative z-10 select-none">
          <span className="font-lilita text-xs bg-[#FF006E] text-white px-3 py-1 border-3 border-black rounded uppercase shadow-neo-sm rotate-[-1.5deg] inline-block mb-3">
            Papan Aspirasi Digital
          </span>
          <h1 className="text-4xl sm:text-6xl font-lilita uppercase text-black drop-shadow-[3px_3px_0px_#000] leading-none mb-4">
            HMIF Sticky Notes Board
          </h1>
          <p className="max-w-xl mx-auto text-xs sm:text-sm font-lexend font-semibold text-gray-700 bg-white border-3 border-black p-4 rounded-xl shadow-neo-sm rotate-[0.5deg]">
            📌 Tinggalkan catatan semangat, candaan, kritik, saran, atau kesan pesan Anda selama kepengurusan Kabinet Astravia secara langsung dan bebas!
          </p>
        </header>

        {/* Corkboard Layout */}
        <div className="bg-[#FAF7F0] border-4 border-black p-4 sm:p-8 rounded-2xl shadow-neo-lg relative overflow-hidden z-10">
          {/* Decorative corkboard tape */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-amber-800/20 border-b-2 border-black/10"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pt-4">
            
            {/* Left Column: Form to post note */}
            <div className="lg:col-span-1 bg-white border-3 border-black p-4 sm:p-5 rounded-xl shadow-neo-md h-fit relative">
              {/* Tape decor */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-amber-100/90 border-2 border-black/20 rotate-[-1deg] shadow-sm flex items-center justify-center font-handwriting text-[8px] font-bold text-amber-900 pointer-events-none uppercase">
                ★ TEMPEL MEMO ★
              </div>
              
              <h3 className="font-lilita text-sm text-black uppercase mb-3 mt-1.5">Tulis Aspirasi Baru</h3>
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <textarea
                    rows={6}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Tulis pesan penyemangat atau kesan di sini..."
                    required
                    maxLength={150}
                    className="w-full p-3 border-2.5 border-black rounded-lg font-lexend text-xs text-black focus:outline-none focus:ring-3 focus:ring-[#FFBE0B]/30 bg-white placeholder-gray-400"
                  />
                  <div className="text-[10px] text-gray-400 font-lexend text-right mt-1">
                    {newNoteText.length}/150 karakter
                  </div>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block font-lilita text-[10px] uppercase text-gray-500 mb-2">Pilih Warna Memo</label>
                  <div className="flex gap-2 justify-start">
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
                        className={`w-8 h-8 rounded-full border-2.5 border-black cursor-pointer transition-transform ${c.class} ${
                          newNoteColor === c.class ? "scale-110 ring-2.5 ring-black/40" : "hover:scale-105"
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-[#FFFDF0] border-2 border-black/10 p-2.5 rounded text-left text-[10px] font-lexend text-gray-500 mb-2">
                  <p className="font-bold text-gray-600 mb-0.5">Penulis memo:</p>
                  <p className="truncate font-black text-black">
                    👤 {currentUser ? currentUser.nama : "Anonim (Silakan masuk di mading jika ingin memakai nama)"}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={noteLoading}
                  className="w-full bg-[#FFBE0B] hover:bg-[#e6ab0a] text-black font-lexend font-black py-2.5 border-2.5 border-black rounded-lg shadow-neo-sm text-xs flex items-center justify-center gap-1 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {noteLoading ? "Menempel..." : "Tempel Memo"}
                </button>
              </form>
            </div>

            {/* Right Column: Interactive Corkboard Display */}
            <div className="lg:col-span-4 min-h-[500px] border-3 border-dashed border-black/30 bg-[#FFFDF8] rounded-xl p-4 sm:p-6 relative flex flex-wrap gap-4 sm:gap-6 items-start content-start overflow-y-auto max-h-[800px] shadow-inner">
              {stickyNotes.length > 0 ? (
                stickyNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={(e) => {
                      if (e.target.closest('.delete-btn')) return;
                      setPreviewNote(note);
                    }}
                    className={`p-4 border-2.5 border-black w-[calc(50%-8px)] sm:w-[190px] h-[170px] sm:h-[190px] flex flex-col justify-between shadow-neo-sm transition-all duration-200 hover:scale-105 hover:-translate-y-1 hover:shadow-neo-md cursor-pointer select-none relative ${note.color}`}
                    style={{ transform: `rotate(${note.rotation || 0}deg)` }}
                  >
                    {/* Tiny visual pin at the top center */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full border border-black/50 shadow-sm flex items-center justify-center font-bold text-[8px] text-white">
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

                    <div className="font-handwriting font-bold text-xs sm:text-sm leading-snug text-gray-800 line-clamp-5 sm:line-clamp-6 pt-1">
                      {note.content}
                    </div>

                    <div className="border-t border-black/10 pt-1.5 mt-1.5 flex flex-col justify-end text-left select-none">
                      <span className="font-lexend font-black text-[9px] sm:text-[10px] text-gray-600 truncate uppercase leading-none">
                        ~ {note.sender_name}
                      </span>
                      <span className="font-lexend text-[7px] sm:text-[8px] text-gray-400 leading-none mt-1">
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
                <div className="w-full flex flex-col items-center justify-center py-24 text-center select-none">
                  <span className="text-5xl mb-3 animate-bounce">📌</span>
                  <h4 className="font-lexend font-black text-base text-gray-400">Papan Aspirasi Masih Kosong</h4>
                  <p className="font-lexend text-xs text-gray-400 mt-1">Jadilah yang pertama menempelkan memo penyemangat!</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* MEMO PREVIEW MODAL */}
      <AnimatePresence>
        {previewNote && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 overlay-polka-dot cursor-zoom-out"
            onClick={() => setPreviewNote(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, rotate: -2 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.9, rotate: 2 }}
              transition={{ type: "spring", damping: 20 }}
              className={`p-6 sm:p-8 border-4 border-black w-[92vw] sm:w-[360px] min-h-[320px] sm:min-h-[360px] flex flex-col justify-between shadow-neo-xl relative cursor-default ${previewNote.color}`}
              onClick={(e) => e.stopPropagation()}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
