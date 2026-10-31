"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Trophy, Search, ArrowUp, ArrowDown, X,
  CheckCircle, BarChart2, Vote, Users, Lock, Info, RotateCcw, Trash2
} from "lucide-react";
import { getMembers, signIn, submitVote, getMyVote, resetMyVote, resetVotes } from "@/lib/db";
import { getSession, setSession, clearSession } from "@/lib/session";
import { useRouter } from "next/navigation";

// Bobot ranking: index 0 → rank 1 = 5 poin, dst.
const RANK_WEIGHTS = [5, 4, 3, 2, 1];

// NIM super admin (Aedil)
const SUPER_ADMIN_NIM = "103112400101";

export default function VotingPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser]       = useState(null);
  const [allMembers, setAllMembers]         = useState([]);
  const [candidates, setCandidates]         = useState([]);
  const [selectedVotes, setSelectedVotes]   = useState([]); // [{id, nama, nim, foto_url, jabatan, departemen}]
  const [existingVote, setExistingVote]     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [username, setUsername]             = useState("");
  const [password, setPassword]             = useState("");
  const [loginError, setLoginError]         = useState("");
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  const [confirmModal, setConfirmModal]     = useState(false);
  const [activeTab, setActiveTab]           = useState("candidates"); // mobile: "candidates" | "ranking"
  const [showHelp, setShowHelp]             = useState(false);

  // ─── Init ───────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const session = getSession();
        const members = await getMembers();
        setAllMembers(members);

        if (session) {
          setCurrentUser(session);
          setCandidates(buildCandidates(session, members));
          const vote = await getMyVote(session.id);
          setExistingVote(vote);
        }
      } catch (err) {
        console.error("Init error", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // ─── Helpers ────────────────────────────────────────────────
  /**
   * Build the list of candidates the given user can choose.
   * - All voters: can only pick angkatan 25 (NIM starts with "109")
   * - Cannot pick themselves
   */
  function buildCandidates(user, members) {
    return members.filter(m => {
      if (!m.nim.startsWith("109")) return false; // Only ang25 as candidates
      if (m.id === user.id) return false;          // Not self
      return true;
    });
  }

  // ─── Auth ───────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);
    try {
      const user = await signIn(username, password);
      setSession(user);
      setCurrentUser(user);
      setCandidates(buildCandidates(user, allMembers));
      const vote = await getMyVote(user.id);
      setExistingVote(vote);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setSelectedVotes([]);
    setExistingVote(null);
    setUsername("");
    setPassword("");
    setLoginError("");
  };

  // ─── Voting actions ─────────────────────────────────────────
  const addToRanking = (candidate) => {
    if (selectedVotes.length >= 5) return;
    if (selectedVotes.some(v => v.id === candidate.id)) return;
    setSelectedVotes(prev => [...prev, candidate]);
  };

  const removeFromRanking = (id) => {
    setSelectedVotes(prev => prev.filter(v => v.id !== id));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const arr = [...selectedVotes];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    setSelectedVotes(arr);
  };

  const moveDown = (index) => {
    if (index === selectedVotes.length - 1) return;
    const arr = [...selectedVotes];
    [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
    setSelectedVotes(arr);
  };

  const handleSubmit = async () => {
    if (selectedVotes.length < 3) return;
    setIsSubmitting(true);
    try {
      const votes = selectedVotes.map((v, i) => ({
        candidate_id:   v.id,
        candidate_nim:  v.nim,
        candidate_nama: v.nama,
        rank:           i + 1,
      }));
      const result = await submitVote(currentUser.id, currentUser.nim, votes);
      setExistingVote(result);
      setConfirmModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetMyVote = async () => {
    if (!currentUser) return;
    if (confirm("Reset vote Anda? Anda akan dapat mengulang pemilihan kandidat dari awal untuk uji coba/testing.")) {
      await resetMyVote(currentUser.id);
      setExistingVote(null);
      setSelectedVotes([]);
      setActiveTab("candidates");
    }
  };

  const handleResetAllVotes = async () => {
    if (!currentUser || currentUser.nim !== SUPER_ADMIN_NIM) return;
    if (confirm("⚠️ HAPUS SEMUA DATA VOTE SELURUH ANGGOTA? Tindakan ini akan mengosongkan seluruh data voting.")) {
      await resetVotes();
      setExistingVote(null);
      setSelectedVotes([]);
      setActiveTab("candidates");
      alert("Semua data voting berhasil direset!");
    }
  };

  const filteredCandidates = candidates.filter(c =>
    c.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.departemen || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const isSelected = (id) => selectedVotes.some(v => v.id === id);

  // ─── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen y2k-mesh-bg flex items-center justify-center">
        <div className="bg-white border-4 border-black p-6 rounded-xl shadow-neo-md text-center">
          <div className="w-12 h-12 border-4 border-t-[#FFBE0B] border-black rounded-full animate-spin mx-auto mb-4" />
          <p className="font-lexend font-black">Memuat sistem voting...</p>
        </div>
      </div>
    );
  }

  // ─── LOGIN SCREEN ────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen y2k-mesh-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-[#FFFDF0] border-4 border-black rounded-2xl shadow-neo-xl p-8 w-full max-w-md relative"
        >
          {/* Top Badge */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#FF006E] text-white font-lilita text-xs uppercase px-4 py-1.5 border-3 border-black shadow-neo-sm rotate-[-1deg] rounded-md whitespace-nowrap select-none">
            🗳️ VOTING KAHIM / WAKAHIM 2026
          </div>

          <div className="text-center mb-6 mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hmif_logo.png" alt="HMIF" className="w-16 h-16 mx-auto mb-3 object-contain" />
            <h1 className="font-lilita text-3xl uppercase text-black leading-none">VOTING</h1>
            <p className="font-lilita text-xl text-[#3A86FF] uppercase leading-tight">Kahim &amp; Wakahim</p>
            <p className="font-lexend text-xs text-gray-500 mt-1 font-semibold">Kabinet Astravia HMIF 2026</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-lexend font-bold text-xs uppercase text-gray-600 mb-1.5">
                Username (NIM Anggota)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: 103112400101"
                autoComplete="username"
                className="w-full px-3 py-2.5 border-3 border-black rounded-lg font-lexend font-bold text-black focus:outline-none focus:ring-4 focus:ring-[#FFBE0B]/30 focus:border-[#FFBE0B] bg-white text-sm"
              />
            </div>

            <div>
              <label className="block font-lexend font-bold text-xs uppercase text-gray-600 mb-1.5">
                Password (NIM + Tanggal Lahir DDMMYYYY)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contoh: 10311240010124062006"
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 border-3 border-black rounded-lg font-lexend font-bold text-black focus:outline-none focus:ring-4 focus:ring-[#FFBE0B]/30 focus:border-[#FFBE0B] bg-white text-sm tracking-wider"
              />
            </div>

            {/* Help Box */}
            <div className="bg-amber-50 border-2 border-amber-400 p-3 rounded-lg">
              <button
                type="button"
                onClick={() => setShowHelp(h => !h)}
                className="flex items-center gap-1.5 font-lexend font-bold text-xs text-amber-700 w-full cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                Cara membuat password voting
                <span className="ml-auto">{showHelp ? "▲" : "▼"}</span>
              </button>
              {showHelp && (
                <div className="mt-2 text-[11px] font-lexend text-amber-800 space-y-1 leading-relaxed">
                  <p>Password = <strong>NIM</strong> + <strong>Tanggal Lahir (DDMMYYYY)</strong></p>
                  <p className="bg-white border border-amber-300 px-2 py-1 rounded font-mono text-xs">
                    NIM: 103112400101<br />
                    Lahir: 24 Juni 2006 → 24062006<br />
                    <strong>Password: 10311240010124062006</strong>
                  </p>
                </div>
              )}
            </div>

            {loginError && (
              <div className="bg-[#FF6B6B] border-3 border-black p-3 rounded-lg text-xs font-lexend font-black text-black shadow-neo-sm">
                ⚠️ {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full bg-[#FFBE0B] hover:bg-[#FFD000] text-black font-lexend font-black py-3 border-3 border-black rounded-xl shadow-neo-md text-base flex items-center justify-center gap-2 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-black border-black/30 rounded-full animate-spin" />
                  Memuat...
                </>
              ) : (
                <>
                  <Vote className="w-5 h-5" />
                  Masuk &amp; Vote
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ─── ALREADY VOTED SCREEN ─────────────────────────────────────
  if (existingVote) {
    return (
      <div className="min-h-screen y2k-mesh-bg flex flex-col">
        {/* Header */}
        <header className="bg-white border-b-4 border-black p-3 sm:p-4 flex items-center justify-between sticky top-0 z-10 shadow-neo-sm">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hmif_logo.png" alt="HMIF" className="w-8 h-8 object-contain" />
            <div>
              <p className="font-lilita text-sm uppercase text-black leading-none">🗳️ Voting Kahim/Wakahim</p>
              <p className="font-lexend text-[9px] text-gray-500 font-semibold">{currentUser.nama} · {currentUser.nim}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUser.nim === SUPER_ADMIN_NIM && (
              <button
                onClick={() => router.push("/voting-dashboard")}
                className="bg-[#3A86FF] text-white font-lexend font-black px-3 py-1.5 border-3 border-black rounded-lg shadow-neo-sm text-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#206be6] transition-colors"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Dashboard
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-[#FF6B6B] text-black font-lexend font-black px-3 py-1.5 border-3 border-black rounded-lg shadow-neo-sm text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FFFDF0] border-4 border-black rounded-2xl shadow-neo-xl p-6 w-full max-w-lg"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#06D6A0] border-4 border-black rounded-full flex items-center justify-center mx-auto mb-3 shadow-neo-sm">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-lilita text-2xl uppercase text-black">Vote Terkunci!</h2>
              <p className="font-lexend text-sm text-gray-600 mt-1">
                Halo <strong>{currentUser.nama}</strong>, pilihan kamu sudah diterima dan dikunci.
              </p>
            </div>

            <p className="font-lexend font-black text-xs uppercase text-gray-500 text-center mb-3">
              Pilihan kamu (tidak dapat diubah)
            </p>

            <div className="space-y-2 mb-5">
              {existingVote.votes.map((v, idx) => {
                const cand = allMembers.find(m => m.id === v.candidate_id);
                const rankColors = ["bg-[#FFBE0B]", "bg-[#C0C0C0]", "bg-[#CD7F32]", "bg-gray-100", "bg-gray-100"];
                return (
                  <div key={v.candidate_id} className="flex items-center gap-3 bg-white border-2 border-black p-2.5 rounded-xl shadow-neo-sm">
                    <div className={`w-9 h-9 rounded-full border-3 border-black flex items-center justify-center font-lilita text-sm font-bold flex-shrink-0 ${rankColors[idx]}`}>
                      {idx + 1}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cand?.foto_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${v.candidate_nama}`}
                      alt={v.candidate_nama}
                      className="w-10 h-10 rounded-full border-2 border-black object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-lexend font-black text-sm text-black leading-none truncate">{v.candidate_nama}</p>
                      <p className="font-lexend text-[10px] text-gray-500 uppercase mt-0.5">
                        {cand?.jabatan || "Anggota"}
                      </p>
                    </div>
                    <div className="bg-[#FFBE0B] border-2 border-black rounded-lg px-2 py-0.5 text-xs font-lexend font-black flex-shrink-0 shadow-neo-sm">
                      +{RANK_WEIGHTS[idx]} poin
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50 border-2 border-[#3A86FF] rounded-xl p-3 text-xs font-lexend text-[#3A86FF] font-semibold text-center mb-4">
              📅 Divote pada:{" "}
              {new Date(existingVote.submitted_at).toLocaleString("id-ID", {
                timeZone: "Asia/Jakarta",
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })} WIB
            </div>

            {/* Reset Vote for Testing Mode */}
            <div className="pt-3 border-t-2 border-dashed border-black/20 flex flex-col gap-2">
              <button
                onClick={handleResetMyVote}
                className="w-full bg-[#FFBE0B] hover:bg-[#ffd000] text-black font-lexend font-black py-2.5 px-4 border-3 border-black rounded-xl shadow-neo-sm text-xs sm:text-sm flex items-center justify-center gap-2 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Vote Saya (Ulangi Vote untuk Testing)
              </button>
              {currentUser.nim === SUPER_ADMIN_NIM && (
                <button
                  onClick={handleResetAllVotes}
                  className="w-full bg-[#FF6B6B] hover:bg-[#ff5252] text-black font-lexend font-black py-2 px-3 border-2 border-black rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset Semua Vote Seluruh Anggota (Super Admin)
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── VOTING SCREEN ────────────────────────────────────────────
  return (
    <div className="min-h-screen y2k-mesh-bg flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-4 border-black p-3 sm:p-4 flex items-center justify-between sticky top-0 z-10 shadow-neo-sm">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hmif_logo.png" alt="HMIF" className="w-7 h-7 sm:w-8 sm:h-8 object-contain flex-shrink-0" />
          <div>
            <p className="font-lilita text-xs sm:text-sm uppercase text-black leading-none">🗳️ Voting Kahim/Wakahim</p>
            <p className="font-lexend text-[9px] text-gray-500 font-semibold truncate max-w-[120px] sm:max-w-none">
              {currentUser.nama}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {currentUser.nim === SUPER_ADMIN_NIM && (
            <button
              onClick={() => router.push("/voting-dashboard")}
              className="bg-[#3A86FF] text-white font-lexend font-black px-2 sm:px-3 py-1.5 border-3 border-black rounded-lg shadow-neo-sm text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer hover:bg-[#206be6] transition-colors"
            >
              <BarChart2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}
          <div className="bg-[#FFBE0B] border-2 border-black rounded-lg px-2 py-1 text-[9px] sm:text-[10px] font-lexend font-black whitespace-nowrap">
            {selectedVotes.length}/5
          </div>
          <button
            onClick={handleLogout}
            className="bg-[#FF6B6B] text-black font-lexend font-black px-2 sm:px-3 py-1.5 border-3 border-black rounded-lg shadow-neo-sm text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Instructions Banner */}
      <div className="bg-[#3A86FF] border-b-4 border-black px-4 py-2.5 text-center">
        <p className="font-lexend font-black text-white text-xs sm:text-sm">
          Pilih <strong>3–5 calon</strong> Kahim/Wakahim. Urutan pilihan menentukan bobot nilai!
        </p>
        <p className="font-lexend text-blue-100 text-[9px] sm:text-[10px] mt-0.5">
          Pilihan ke-1 = 5 poin · ke-2 = 4 poin · ke-3 = 3 poin · ke-4 = 2 poin · ke-5 = 1 poin
        </p>
      </div>

      {/* Mobile Tabs */}
      <div className="flex sm:hidden border-b-4 border-black bg-white flex-shrink-0">
        <button
          onClick={() => setActiveTab("candidates")}
          className={`flex-1 py-2.5 font-lexend font-black text-[11px] uppercase flex items-center justify-center gap-1.5 transition-all border-r-2 border-black
            ${activeTab === "candidates" ? "bg-[#FFBE0B]" : "bg-white"}`}
        >
          <Users className="w-3.5 h-3.5" />
          Kandidat ({filteredCandidates.length})
        </button>
        <button
          onClick={() => setActiveTab("ranking")}
          className={`flex-1 py-2.5 font-lexend font-black text-[11px] uppercase flex items-center justify-center gap-1.5 transition-all
            ${activeTab === "ranking" ? "bg-[#FFBE0B]" : "bg-white"} ${selectedVotes.length >= 3 ? "relative" : ""}`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Ranking ({selectedVotes.length}/5)
          {selectedVotes.length >= 3 && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-[#FF006E] rounded-full" />
          )}
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">

        {/* ── Candidates Panel ── */}
        <div className={`flex-1 overflow-y-auto p-3 sm:p-4 ${activeTab === "ranking" ? "hidden sm:block" : "block"}`}>
          {/* Search */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Cari kandidat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border-3 border-black rounded-lg font-lexend font-semibold text-sm focus:outline-none focus:ring-4 focus:ring-[#3A86FF]/30 focus:border-[#3A86FF] bg-white"
            />
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
          </div>

          {/* Candidate Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {filteredCandidates.map((cand) => {
              const selected = isSelected(cand.id);
              const rank     = selectedVotes.findIndex(v => v.id === cand.id);
              const isFull   = selectedVotes.length >= 5;
              return (
                <motion.div
                  key={cand.id}
                  layout
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (selected) {
                      removeFromRanking(cand.id);
                    } else if (!isFull) {
                      addToRanking(cand);
                      if (typeof window !== "undefined" && window.innerWidth < 640) {
                        setActiveTab("ranking");
                      }
                    }
                  }}
                  className={`relative p-2 border-3 rounded-xl cursor-pointer transition-all duration-150 select-none
                    ${selected
                      ? "border-[#06D6A0] bg-[#06D6A0]/10 shadow-[0_0_0_2px_#06D6A0] scale-[1.02]"
                      : isFull
                        ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                        : "border-black bg-white hover:shadow-neo-sm hover:-translate-y-0.5 hover:scale-[1.01]"
                    }`}
                >
                  {/* Rank Badge */}
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-[#06D6A0] border-2 border-black rounded-full flex items-center justify-center font-lilita text-sm text-black z-10 shadow-neo-sm"
                    >
                      {rank + 1}
                    </motion.div>
                  )}

                  {/* Photo */}
                  <div className="w-full aspect-square bg-gray-100 border-2 border-black rounded-lg overflow-hidden mb-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cand.foto_url}
                      alt={cand.nama}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <p className="font-handwriting font-bold text-[#1A1D20] text-[10px] sm:text-xs leading-tight line-clamp-2 text-center">
                    {cand.nama}
                  </p>
                  <p className="font-lexend font-black text-[7px] sm:text-[8px] text-gray-400 uppercase text-center leading-none mt-0.5 line-clamp-1">
                    {(cand.departemen || "").split(" & ")[0]}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {filteredCandidates.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-lexend font-semibold">Tidak ada kandidat ditemukan</p>
            </div>
          )}
        </div>

        {/* ── Ranking Panel ── */}
        <div
          className={`w-full sm:w-80 lg:w-96 sm:border-l-4 border-black bg-[#FFFDF0] flex flex-col flex-shrink-0
            ${activeTab === "candidates" ? "hidden sm:flex" : "flex"}`}
        >
          {/* Panel Header */}
          <div className="border-b-3 border-black p-3 sm:p-4 flex items-start justify-between">
            <div>
              <h2 className="font-lilita text-xl uppercase text-black flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#FFBE0B]" />
                Ranking Pilihan
              </h2>
              <p className="font-lexend text-[10px] text-gray-500 mt-0.5">
                Klik kandidat untuk menambah/hapus. Gunakan ↑↓ untuk atur urutan.
              </p>
            </div>
            {selectedVotes.length > 0 && (
              <button
                onClick={() => setSelectedVotes([])}
                className="text-[10px] font-lexend font-bold text-gray-500 hover:text-red-600 underline cursor-pointer ml-2 flex-shrink-0"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Rankings List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selectedVotes.length === 0 && (
              <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
                <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-lexend text-xs font-semibold">Belum ada pilihan</p>
                <p className="font-lexend text-[10px] mt-0.5 opacity-70">Pilih kandidat dari panel kiri</p>
              </div>
            )}

            <AnimatePresence>
              {selectedVotes.map((v, idx) => {
                const rankColors = ["bg-[#FFBE0B] text-black", "bg-[#C0C0C0] text-black", "bg-[#CD7F32] text-white", "bg-gray-100 text-gray-700", "bg-gray-100 text-gray-700"];
                return (
                  <motion.div
                    key={v.id}
                    layout
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2 bg-white border-2 border-black p-2 rounded-xl shadow-neo-sm"
                  >
                    {/* Rank number */}
                    <div className={`w-7 h-7 rounded-full border-2 border-black flex items-center justify-center font-lilita text-sm flex-shrink-0 ${rankColors[idx]}`}>
                      {idx + 1}
                    </div>
                    {/* Photo */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.foto_url} alt={v.nama} className="w-8 h-8 rounded-full border-2 border-black object-cover flex-shrink-0" />
                    {/* Name + points */}
                    <div className="flex-1 min-w-0">
                      <p className="font-lexend font-black text-[10px] sm:text-xs text-black leading-none truncate">{v.nama}</p>
                      <p className="font-lexend text-[8px] text-[#FF006E] font-bold">+{RANK_WEIGHTS[idx]} poin</p>
                    </div>
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="w-5 h-5 border border-black rounded flex items-center justify-center disabled:opacity-25 hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === selectedVotes.length - 1}
                        className="w-5 h-5 border border-black rounded flex items-center justify-center disabled:opacity-25 hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Remove */}
                    <button
                      onClick={() => removeFromRanking(v.id)}
                      className="w-6 h-6 border-2 border-black rounded-md flex items-center justify-center hover:bg-red-100 cursor-pointer flex-shrink-0 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty slot indicators */}
            {selectedVotes.length < 3 && Array.from({ length: 3 - selectedVotes.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-2 bg-gray-50 border-2 border-dashed border-gray-300 p-2 rounded-xl"
              >
                <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center font-lilita text-sm text-gray-300 flex-shrink-0">
                  {selectedVotes.length + i + 1}
                </div>
                <p className="font-lexend text-[10px] text-gray-300 italic">Wajib dipilih...</p>
              </div>
            ))}
          </div>

          {/* Submit Section */}
          <div className="border-t-3 border-black p-3 sm:p-4">
            {selectedVotes.length < 3 && (
              <p className="font-lexend text-[10px] text-amber-600 font-bold text-center mb-2 bg-amber-50 border border-amber-300 rounded-lg py-1.5 px-2">
                ⚠️ Minimal pilih {3 - selectedVotes.length} kandidat lagi
              </p>
            )}
            <button
              onClick={() => setConfirmModal(true)}
              disabled={selectedVotes.length < 3}
              className="w-full bg-[#FF006E] hover:bg-[#d4005e] text-white font-lexend font-black py-3 border-3 border-black rounded-xl shadow-neo-md text-base flex items-center justify-center gap-2 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Vote className="w-5 h-5" />
              Submit Vote ({selectedVotes.length}/5)
            </button>
            <p className="font-lexend text-[9px] text-gray-400 text-center mt-1.5">
              ⚠️ Vote <strong>tidak dapat diubah</strong> setelah dikirim
            </p>
          </div>
        </div>
      </div>

      {/* ── Confirm Modal ── */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#FFFDF0] border-4 border-black rounded-2xl shadow-neo-xl p-6 w-full max-w-sm"
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-[#FFBE0B] border-4 border-black rounded-full flex items-center justify-center mx-auto mb-3 shadow-neo-sm">
                  <Vote className="w-8 h-8 text-black" />
                </div>
                <h3 className="font-lilita text-2xl uppercase">Konfirmasi Vote</h3>
                <p className="font-lexend text-xs text-gray-600 mt-1">
                  Pastikan pilihan sudah benar. <strong>Vote tidak dapat diubah!</strong>
                </p>
              </div>

              <div className="space-y-1.5 mb-4 max-h-52 overflow-y-auto">
                {selectedVotes.map((v, idx) => (
                  <div key={v.id} className="flex items-center gap-2 bg-white border-2 border-black p-2 rounded-xl">
                    <div className={`w-7 h-7 rounded-full border-2 border-black flex items-center justify-center font-lilita text-xs flex-shrink-0
                      ${idx === 0 ? "bg-[#FFBE0B]" : idx === 1 ? "bg-[#C0C0C0]" : idx === 2 ? "bg-[#CD7F32] text-white" : "bg-gray-100"}`}>
                      {idx + 1}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.foto_url} alt={v.nama} className="w-8 h-8 rounded-full border-2 border-black object-cover flex-shrink-0" />
                    <p className="font-lexend font-black text-[11px] text-black flex-1 leading-tight min-w-0 truncate">{v.nama}</p>
                    <span className="font-lexend font-black text-[10px] text-[#FF006E] flex-shrink-0">+{RANK_WEIGHTS[idx]}pt</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmModal(false)}
                  className="flex-1 bg-white border-3 border-black rounded-xl py-2.5 font-lexend font-black text-sm shadow-neo-sm cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  ← Cek Lagi
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#FF006E] text-white border-3 border-black rounded-xl py-2.5 font-lexend font-black text-sm shadow-neo-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 hover:bg-[#d4005e] transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-t-white border-white/30 rounded-full animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Vote className="w-4 h-4" />
                      Kirim Vote!
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
