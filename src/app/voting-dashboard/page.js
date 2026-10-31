"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/session";
import { getMembers, getVotingResults, resetVotes } from "@/lib/db";
import {
  BarChart2, Trophy, Users, LogOut, ArrowLeft,
  Trash2, RefreshCw, CheckCircle, XCircle, Download
} from "lucide-react";

const RANK_WEIGHTS = [5, 4, 3, 2, 1];
const SUPER_ADMIN_NIM = "103112400101";

// Medal colors for top 3
const medalColors = [
  "bg-[#FFBE0B] text-black border-[#d4a00a]",
  "bg-[#C0C0C0] text-black border-[#9e9e9e]",
  "bg-[#CD7F32] text-white border-[#a0622a]",
];

export default function VotingDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [results, setResults]         = useState(null);
  const [allMembers, setAllMembers]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeView, setActiveView]   = useState("results"); // "results" | "detail"
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetStep, setResetStep]     = useState(1); // double-confirm

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const members = await getMembers();
      setAllMembers(members);
      const r = await getVotingResults(members);
      setResults(r);
    } catch (err) {
      console.error("Dashboard load error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function initDashboard() {
      const session = getSession();
      if (!session || session.nim !== SUPER_ADMIN_NIM) {
        router.replace("/");
        return;
      }
      try {
        const members = await getMembers();
        if (!isMounted) return;
        setCurrentUser(session);
        setAllMembers(members);
        const r = await getVotingResults(members);
        setResults(r);
      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    initDashboard();
    return () => { isMounted = false; };
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  const handleReset = async () => {
    if (resetStep === 1) {
      setResetStep(2);
      return;
    }
    await resetVotes();
    setResetConfirm(false);
    setResetStep(1);
    await loadData();
  };

  // Export results as CSV
  const exportCSV = () => {
    if (!results) return;
    const header = "Rank,Nama,NIM,Total Poin,Vote Rank1,Vote Rank2,Vote Rank3,Vote Rank4,Vote Rank5,Total Vote\n";
    const rows = results.candidates.map((c, i) =>
      `${i + 1},${c.candidateNama},${c.candidateNim},${c.totalScore},${c.rankBreakdown[1] || 0},${c.rankBreakdown[2] || 0},${c.rankBreakdown[3] || 0},${c.rankBreakdown[4] || 0},${c.rankBreakdown[5] || 0},${c.voteCount}`
    ).join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `voting_kahim_wakahim_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen y2k-mesh-bg flex items-center justify-center">
        <div className="bg-white border-4 border-black p-6 rounded-xl shadow-neo-md text-center">
          <div className="w-12 h-12 border-4 border-t-[#3A86FF] border-black rounded-full animate-spin mx-auto mb-4" />
          <p className="font-lexend font-black">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const candidateResults  = results?.candidates  || [];
  const allVotes          = results?.allVotes     || [];
  const totalEligible     = results?.totalEligibleVoters || 0;
  const totalVoted        = allVotes.length;
  const notVoted          = totalEligible - totalVoted;
  const participation     = totalEligible > 0 ? Math.round((totalVoted / totalEligible) * 100) : 0;
  const maxScore          = candidateResults[0]?.totalScore || 1;

  // Split members: who voted, who hasn't
  const votedSet = new Set(allVotes.map(v => v.voter_id).concat(allVotes.map(v => v.voter_nim)));

  return (
    <div className="min-h-screen y2k-mesh-bg flex flex-col">

      {/* ── Header ── */}
      <header className="bg-[#1A1D20] border-b-4 border-[#FFBE0B] p-3 sm:p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="bg-white text-black border-2 border-[#FFBE0B] rounded-lg p-1.5 cursor-pointer hover:bg-[#FFBE0B] transition-colors"
            title="Kembali ke Voting"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hmif_logo.png" alt="HMIF" className="w-8 h-8 object-contain" />
          <div>
            <p className="font-lilita text-sm uppercase text-[#FFBE0B] leading-none">📊 Dashboard Voting</p>
            <p className="font-lexend text-[9px] text-gray-400 font-semibold">Super Admin: {currentUser.nama}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={exportCSV}
            disabled={candidateResults.length === 0}
            className="bg-[#06D6A0] text-black font-lexend font-black px-2 sm:px-3 py-1.5 border-2 border-[#06D6A0] rounded-lg text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={loadData}
            className="bg-[#3A86FF] text-white font-lexend font-black px-2 sm:px-3 py-1.5 border-2 border-[#3A86FF] rounded-lg text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => { setResetConfirm(true); setResetStep(1); }}
            className="bg-[#FF6B6B] text-white font-lexend font-black px-2 sm:px-3 py-1.5 border-2 border-[#FF6B6B] rounded-lg text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Reset Vote</span>
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-700 text-gray-200 font-lexend font-black px-2 sm:px-3 py-1.5 border-2 border-gray-600 rounded-lg text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full p-3 sm:p-6 space-y-4 sm:space-y-6">

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Total Anggota",  value: totalEligible, icon: Users,       color: "bg-[#3A86FF] text-white" },
            { label: "Sudah Vote",     value: totalVoted,    icon: CheckCircle,  color: "bg-[#06D6A0] text-black" },
            { label: "Belum Vote",     value: notVoted,      icon: XCircle,      color: "bg-[#FF6B6B] text-black" },
            { label: "Partisipasi",    value: `${participation}%`, icon: BarChart2, color: "bg-[#FFBE0B] text-black" },
          ].map((stat, i) => (
            <div key={i} className={`${stat.color} border-4 border-black rounded-xl p-3 sm:p-4 shadow-neo-md`}>
              <stat.icon className="w-5 h-5 mb-1 opacity-80" />
              <p className="font-lilita text-3xl leading-none">{stat.value}</p>
              <p className="font-lexend font-bold text-[9px] sm:text-[10px] uppercase opacity-80">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Participation bar */}
        <div className="bg-white border-4 border-black rounded-xl p-3 shadow-neo-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-lexend font-black text-xs uppercase text-gray-600">Tingkat Partisipasi</span>
            <span className="font-lilita text-lg text-black">{participation}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 border-2 border-black">
            <div
              className="bg-[#06D6A0] h-full rounded-full border-r-2 border-black transition-all duration-700"
              style={{ width: `${participation}%` }}
            />
          </div>
          <p className="font-lexend text-[9px] text-gray-400 mt-1">{totalVoted} dari {totalEligible} anggota sudah vote</p>
        </div>

        {/* ── View Tabs ── */}
        <div className="flex border-4 border-black rounded-xl overflow-hidden shadow-neo-sm">
          {[
            { key: "results", label: "Hasil Voting", icon: Trophy },
            { key: "detail",  label: "Detail Voter", icon: Users  },
          ].map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`flex-1 py-3 font-lexend font-black text-xs sm:text-sm uppercase flex items-center justify-center gap-2 transition-all
                ${activeView === tab.key ? "bg-[#FFBE0B] text-black" : "bg-white text-black hover:bg-gray-50"}
                ${i === 0 ? "border-r-4 border-black" : ""}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Results View ── */}
        {activeView === "results" && (
          <div className="space-y-2.5">
            {candidateResults.length === 0 ? (
              <div className="bg-white border-4 border-black rounded-2xl p-10 text-center shadow-neo-md">
                <Trophy className="w-14 h-14 mx-auto text-gray-200 mb-3" />
                <p className="font-lexend font-extrabold text-xl text-black">Belum ada vote masuk</p>
                <p className="font-lexend text-gray-500 text-sm mt-1">
                  Hasil akan ditampilkan di sini setelah anggota melakukan voting.
                </p>
              </div>
            ) : (
              candidateResults.map((cand, idx) => {
                const member   = allMembers.find(m => m.id === cand.candidateId);
                const barWidth = Math.round((cand.totalScore / maxScore) * 100);
                const isMedal  = idx < 3;

                return (
                  <div
                    key={cand.candidateId}
                    className={`bg-white border-4 rounded-2xl p-3 sm:p-4 shadow-neo-md flex items-center gap-3 sm:gap-4 transition-all
                      ${isMedal ? "border-black" : "border-gray-300 shadow-neo-sm"}`}
                    style={isMedal ? { borderColor: ["#d4a00a", "#9e9e9e", "#a0622a"][idx] } : {}}
                  >
                    {/* Rank medal */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-3 border-black flex items-center justify-center font-lilita text-xl sm:text-2xl flex-shrink-0 shadow-neo-sm
                      ${isMedal ? medalColors[idx] : "bg-gray-100 text-gray-700 border-gray-300"}`}>
                      {idx < 3 ? ["🥇","🥈","🥉"][idx] : idx + 1}
                    </div>

                    {/* Photo */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member?.foto_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${cand.candidateNama}`}
                      alt={cand.candidateNama}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-3 border-black object-cover flex-shrink-0"
                    />

                    {/* Info block */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-lexend font-black text-sm sm:text-base text-black leading-tight truncate">{cand.candidateNama}</p>
                          <p className="font-lexend text-[10px] text-gray-500 uppercase truncate">{member?.jabatan} · NIM {cand.candidateNim}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-lilita text-2xl sm:text-3xl text-[#FF006E] leading-none">{cand.totalScore}</p>
                          <p className="font-lexend text-[9px] text-gray-400 uppercase">poin</p>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="w-full bg-gray-100 rounded-full h-2.5 border-2 border-black mb-2">
                        <div
                          className={`h-full rounded-full border-r-2 border-black transition-all duration-700
                            ${idx === 0 ? "bg-[#FFBE0B]" : idx === 1 ? "bg-[#C0C0C0]" : idx === 2 ? "bg-[#CD7F32]" : "bg-[#3A86FF]"}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      {/* Rank breakdown badges */}
                      <div className="flex flex-wrap gap-1">
                        {RANK_WEIGHTS.map((_, rankIdx) => {
                          const count = cand.rankBreakdown[rankIdx + 1] || 0;
                          if (count === 0) return null;
                          return (
                            <span key={rankIdx} className="bg-gray-100 border border-black rounded-md px-1.5 py-0.5 text-[9px] font-lexend font-bold">
                              Rank {rankIdx + 1}: {count}× (+{RANK_WEIGHTS[rankIdx] * count}pt)
                            </span>
                          );
                        })}
                        <span className="bg-[#FF006E]/10 border border-[#FF006E] rounded-md px-1.5 py-0.5 text-[9px] font-lexend font-bold text-[#FF006E]">
                          {cand.voteCount} vote
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Detail Per Voter View ── */}
        {activeView === "detail" && (
          <div className="space-y-2">
            {/* Header row */}
            <div className="flex gap-2 items-center bg-[#1A1D20] text-white border-4 border-black rounded-xl px-4 py-2.5">
              <CheckCircle className="w-4 h-4 text-[#06D6A0]" />
              <span className="font-lexend font-black text-xs uppercase flex-1">Sudah Vote: {totalVoted}</span>
              <XCircle className="w-4 h-4 text-[#FF6B6B]" />
              <span className="font-lexend font-black text-xs uppercase">Belum: {notVoted}</span>
            </div>

            {allMembers.map(member => {
              const vote    = allVotes.find(v => v.voter_id === member.id || (v.voter_nim && v.voter_nim === member.nim));
              const hasVote = votedSet.has(member.id) || (member.nim && votedSet.has(member.nim));

              return (
                <div
                  key={member.id}
                  className={`bg-white border-3 rounded-xl overflow-hidden transition-all
                    ${hasVote ? "border-black shadow-neo-sm" : "border-gray-200 opacity-60"}`}
                >
                  {/* Member row */}
                  <div className="flex items-center gap-3 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member.foto_url}
                      alt={member.nama}
                      className="w-10 h-10 rounded-full border-2 border-black object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-lexend font-black text-sm text-black leading-none truncate">{member.nama}</p>
                      <p className="font-lexend text-[9px] text-gray-500 uppercase">
                        {member.nim} · {(member.departemen || "").split(" & ")[0]}
                      </p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg border-2 border-black text-[9px] font-lexend font-black flex-shrink-0 flex items-center gap-1
                      ${hasVote ? "bg-[#06D6A0] text-black" : "bg-gray-100 text-gray-500"}`}>
                      {hasVote ? <><CheckCircle className="w-3 h-3" /> Sudah Vote</> : <><XCircle className="w-3 h-3" /> Belum Vote</>}
                    </div>
                  </div>

                  {/* Vote choices */}
                  {vote && (
                    <div className="border-t-2 border-black/10 px-3 pb-3 pt-2">
                      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                        {Array.isArray(vote.votes) && vote.votes.map((v, idx) => {
                          const cand = allMembers.find(m => m.id === v.candidate_id);
                          return (
                            <div key={idx} className="flex items-center gap-1.5 bg-gray-50 border border-black rounded-lg p-1.5">
                              <div className={`w-5 h-5 rounded-full border border-black flex items-center justify-center font-lilita text-[9px] flex-shrink-0
                                ${idx === 0 ? "bg-[#FFBE0B]" : idx === 1 ? "bg-[#C0C0C0]" : idx === 2 ? "bg-[#CD7F32] text-white" : "bg-gray-100"}`}>
                                {idx + 1}
                              </div>
                              <p className="font-lexend font-black text-[9px] leading-tight line-clamp-2 text-black min-w-0">
                                {v.candidate_nama || cand?.nama || "?"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <p className="font-lexend text-[8px] text-gray-400 mt-1.5">
                        {new Date(vote.submitted_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Reset Confirm Modal ── */}
      {resetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#FFFDF0] border-4 border-black rounded-2xl shadow-neo-xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className={`w-14 h-14 ${resetStep === 1 ? "bg-[#FF6B6B]" : "bg-[#1A1D20]"} border-4 border-black rounded-full flex items-center justify-center mx-auto mb-3 shadow-neo-sm`}>
                <Trash2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-lilita text-xl uppercase">
                {resetStep === 1 ? "Reset Semua Vote?" : "⚠️ Yakin Yakin?"}
              </h3>
              <p className="font-lexend text-xs text-gray-600 mt-1">
                {resetStep === 1
                  ? "Semua data voting akan dihapus permanen. Tindakan ini TIDAK DAPAT diurungkan!"
                  : `Ini akan menghapus ${totalVoted} data vote secara permanen. Ketik OK untuk konfirmasi terakhir.`
                }
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setResetConfirm(false); setResetStep(1); }}
                className="flex-1 bg-white border-3 border-black rounded-xl py-2.5 font-lexend font-black text-sm cursor-pointer hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleReset}
                className={`flex-1 ${resetStep === 1 ? "bg-[#FF6B6B]" : "bg-[#1A1D20]"} text-white border-3 border-black rounded-xl py-2.5 font-lexend font-black text-sm cursor-pointer`}
              >
                {resetStep === 1 ? "Lanjutkan ›" : "Hapus Semua!"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
