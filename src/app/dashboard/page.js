"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Inbox, 
  Users, 
  Edit3, 
  Lock, 
  Check, 
  X, 
  Calendar,
  User,
  Shield,
  MessageSquare,
  RefreshCw,
  Search,
  Trash2
} from "lucide-react";
import { getMembers, getFeedbacks, updateMember, deleteFeedback } from "@/lib/db";
import { getSession } from "@/lib/session";

export default function DashboardPage() {
  const router = useRouter();

  // Core States
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("inbox"); // "inbox" or "members"
  const [members, setMembers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editNim, setEditNim] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editPesanFatir, setEditPesanFatir] = useState("");
  const [editPesanAedil, setEditPesanAedil] = useState("");
  const [editPesanKoor, setEditPesanKoor] = useState("");
  const [editFotoUrl, setEditFotoUrl] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editDept, setEditDept] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Cropper Modal States
  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState("");
  const [cropperZoom, setCropperZoom] = useState(1);
  const [cropperOffset, setCropperOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });



  // Authentication and Data Loading
  useEffect(() => {
    async function loadDashboard() {
      const session = getSession();
      setCurrentUser(session);

      if (!session || (session.role !== "admin" && session.role !== "koor")) {
        setLoading(false);
        return; // Non-admin/koor will be blocked in render
      }

      try {
        await refreshData(session);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const refreshData = async (user = currentUser) => {
    if (!user) return;
    
    // Determine filters based on user role to minimize payload (highly optimizes performance)
    let mems;
    let feeds;

    if (user.role === "admin") {
      // Admins load all members to manage them
      mems = await getMembers();
      
      // Load only relevant feedbacks for Chairman / Vice Chairman to optimize download size
      if (user.nama === 'Fatir Gibran' || user.jabatan === 'Chairman') {
        feeds = await getFeedbacks("chairman");
      } else if (user.nama === 'Aedil Riski Ansyah' || user.jabatan === 'Vice Chairman') {
        feeds = await getFeedbacks("vice_chairman");
      } else {
        feeds = await getFeedbacks();
      }
    } else if (user.role === "koor") {
      // Coordinators only load members of their own department to save bandwidth (base64 image size is large)
      mems = await getMembers(user.departemen);
      
      // Coordinators only load feedback sent to 'koor' from their own department
      feeds = await getFeedbacks("koor", user.departemen);
    } else {
      mems = [];
      feeds = [];
    }
    
    setMembers(mems);
    setFeedbacks(feeds);
  };

  // Open Edit Modal for a Member
  const handleOpenEdit = (member) => {
    // Access guard: Fatir (Chairman) cannot edit Aedil (Vice Chairman)
    const isFatir = currentUser?.nama === 'Fatir Gibran' || currentUser?.jabatan === 'Chairman' || currentUser?.nim === '103112430153';
    const isTargetAedil = member?.nama === 'Aedil Riski Ansyah' || member?.jabatan === 'Vice Chairman' || member?.nim === '103112400101';
    
    if (isFatir && isTargetAedil) {
      alert("Akses ditolak: Chairman tidak diperbolehkan mengedit data Vice Chairman.");
      return;
    }

    // Access guard: Koor cannot edit themselves
    if (currentUser?.role === "koor" && member?.id === currentUser?.id) {
      alert("Akses ditolak: Koordinator tidak diperbolehkan mengedit data diri sendiri.");
      return;
    }

    setEditingMember(member);
    setEditNim(member.nim || "");
    setEditDob(member.tanggal_lahir || "");
    setEditPesanFatir(member.pesan_fatir || "");
    setEditPesanAedil(member.pesan_aedil || "");
    setEditPesanKoor(member.pesan_koor || "");
    setEditFotoUrl(member.foto_url || "");
    setEditRole(member.role || "staff");
    setEditDept(member.departemen || "");
    setEditModalOpen(true);
  };

  // Handle Photo Upload with Client-Side Compression (webp, max 600px width)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        setCropperImageSrc(event.target.result);
        setCropperZoom(1);
        setCropperOffset({ x: 0, y: 0 });
        setCropperModalOpen(true);
      };
      img.src = event.target.result;
      
      // Reset input value so it can trigger onChange again for the same file
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };


  // Pointer drag events for cropping
  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropperOffset.x, y: e.clientY - cropperOffset.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setCropperOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Execute Canvas Crop & WebP Compression
  const executeCrop = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 600; // Output square size (600x600 px)
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      // Calculate proportional cover dimensions
      let drawWidth = size;
      let drawHeight = size;

      if (img.width > img.height) {
        // Landscape
        drawHeight = size;
        drawWidth = img.width * (size / img.height);
      } else {
        // Portrait
        drawWidth = size;
        drawHeight = img.height * (size / img.width);
      }

      // Apply zoom factor
      const zoomedWidth = drawWidth * cropperZoom;
      const zoomedHeight = drawHeight * cropperZoom;

      // Base offset to center the image on the canvas
      const x0 = (size - zoomedWidth) / 2;
      const y0 = (size - zoomedHeight) / 2;

      // Scale multiplier (mapping 300px viewport dragging to 600px canvas coordinates)
      const scaleMultiplier = size / 300; 
      const dx = cropperOffset.x * scaleMultiplier;
      const dy = cropperOffset.y * scaleMultiplier;

      // Draw onto canvas
      ctx.fillStyle = "#FFFFFF"; // Safety background
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, x0 + dx, y0 + dy, zoomedWidth, zoomedHeight);

      // Convert to compressed WebP Data URL
      const webpDataUrl = canvas.toDataURL("image/webp", 0.85);
      setEditFotoUrl(webpDataUrl);
      setCropperModalOpen(false);
    };
    img.src = cropperImageSrc;
  };



  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      // Access guard: Fatir (Chairman) cannot edit Aedil (Vice Chairman)
      const isFatir = currentUser?.nama === 'Fatir Gibran' || currentUser?.jabatan === 'Chairman' || currentUser?.nim === '103112430153';
      const isTargetAedil = editingMember?.nama === 'Aedil Riski Ansyah' || editingMember?.jabatan === 'Vice Chairman' || editingMember?.nim === '103112400101';
      
      if (isFatir && isTargetAedil) {
        throw new Error("Chairman tidak memiliki akses untuk mengedit data Vice Chairman.");
      }

      // Access guard: Koor cannot edit themselves
      if (currentUser?.role === "koor" && editingMember?.id === currentUser?.id) {
        throw new Error("Koordinator tidak diperbolehkan mengedit data diri sendiri.");
      }

      const updatedFields = {};

      if (currentUser.role === "admin") {
        // Admin can edit everything
        updatedFields.nim = editNim;
        updatedFields.tanggal_lahir = editDob;
        updatedFields.pesan_fatir = editPesanFatir;
        updatedFields.pesan_aedil = editPesanAedil;
        updatedFields.pesan_koor = editPesanKoor;
        updatedFields.foto_url = editFotoUrl;
        updatedFields.role = editRole;
        updatedFields.departemen = editDept;
      } else if (currentUser.role === "koor") {
        // Koor can ONLY edit pesan_koor and foto_url for staff in their own department
        if (editingMember.departemen !== currentUser.departemen) {
          throw new Error("Anda hanya bisa mengubah data staf di departemen Anda sendiri.");
        }
        updatedFields.pesan_koor = editPesanKoor;
        updatedFields.foto_url = editFotoUrl;
      }

      await updateMember(editingMember.id, updatedFields);
      setEditModalOpen(false);
      await refreshData();
      alert("Data berhasil diperbarui!");
    } catch (err) {
      alert("Gagal memperbarui: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete Feedback response (for Chairman & Vice Chairman / Admin)
  const handleDeleteFeedback = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pesan feedback ini?")) return;
    
    try {
      await deleteFeedback(id);
      await refreshData();
      alert("Pesan feedback berhasil dihapus!");
    } catch (err) {
      alert("Gagal menghapus feedback: " + err.message);
    }
  };

  // ----------------------------------------------------
  // CONDITIONAL RENDER: Loading / Role Guards
  // ----------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen polka-dot-bg flex items-center justify-center">
        <div className="bg-white border-4 border-black p-6 rounded-xl shadow-neo-md text-center max-w-sm">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 text-[#3A86FF]" />
          <p className="font-lexend font-black">Memuat halaman pengurus...</p>
        </div>
      </div>
    );
  }

  // Denied Access Guard
  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "koor")) {
    return (
      <div className="min-h-screen polka-dot-bg flex items-center justify-center p-4">
        <div className="bg-[#FF6B6B] border-4 border-black p-8 rounded-2xl max-w-md text-center shadow-neo-lg">
          <Lock className="w-16 h-16 mx-auto text-black mb-4" />
          <h2 className="font-lilita text-2xl uppercase text-black mb-2">Akses Ditolak</h2>
          <p className="font-lexend font-semibold text-black/95 mb-6">
            Halaman ini khusus untuk Chairman, Vice Chairman, dan Koordinator Departemen untuk mengelola evaluasi kepengurusan.
          </p>
          <button 
            onClick={() => router.push("/")}
            className="w-full bg-[#FFFDF0] hover:bg-white text-black font-lexend font-black py-3 border-3 border-black rounded-lg shadow-neo-sm flex items-center justify-center gap-2 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // Filter members list based on role and search query
  const getVisibleMembers = () => {
    let result = members;
    
    // Coords only see members in their own department
    if (currentUser.role === "koor") {
      result = result.filter(m => m.departemen === currentUser.departemen);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.nama.toLowerCase().includes(q) || 
        m.jabatan.toLowerCase().includes(q)
      );
    }
    
    return result;
  };

  const visibleMembers = getVisibleMembers();

  return (
    <div className="min-h-screen polka-dot-bg pb-20">
      
      {/* Top Header Bar */}
      <div className="bg-white border-b-4 border-black py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/")}
              className="bg-[#F9F6F0] hover:bg-gray-100 text-black font-lexend font-black p-2 border-3 border-black rounded-lg shadow-neo-sm active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1.5 bg-gray-50 border-2.5 border-black px-2 py-1 rounded-lg shadow-neo-sm hidden md:flex">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hmif_logo.png" alt="HMIF" className="w-8 h-8 object-contain" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kabinet_logo.png" alt="Astravia" className="w-8 h-8 object-contain" />
            </div>

            <div>
              <h1 className="font-lilita text-2xl text-black flex items-center gap-2">
                DASHBOARD PENGURUS
                <span className="text-xs uppercase bg-[#FFBE0B] text-black px-2 py-0.5 border-2 border-black rounded font-bold">
                  {currentUser.role}
                </span>
              </h1>
              <p className="text-xs font-lexend font-semibold text-gray-500 uppercase">
                {currentUser.nama} — {currentUser.departemen === "Executive Board" ? "Executive Board (Chairman/Vice Chairman)" : currentUser.departemen}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveSubTab("inbox")}
              className={`px-4 py-2 border-3 border-black rounded-lg font-lexend font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-neo-sm transition-all
                ${activeSubTab === "inbox" ? "bg-[#3A86FF] text-white -translate-y-0.5" : "bg-white hover:bg-gray-50"}
              `}
            >
              <Inbox className="w-4 h-4" />
              Inbox Surat Balasan ({feedbacks.length})
            </button>
            <button
              onClick={() => setActiveSubTab("members")}
              className={`px-4 py-2 border-3 border-black rounded-lg font-lexend font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-neo-sm transition-all
                ${activeSubTab === "members" ? "bg-[#06D6A0] text-black -translate-y-0.5" : "bg-white hover:bg-gray-50"}
              `}
            >
              <Users className="w-4 h-4" />
              Kelola Evaluasi ({visibleMembers.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8">
        
        {/* TAB 1: INBOX SURAT BALASAN (FEEDBACK) */}
        {activeSubTab === "inbox" && (
          <div className="space-y-6">
            <div className="bg-[#FFFDF0] border-4 border-black p-4 rounded-xl shadow-neo-sm flex items-center justify-between">
              <h3 className="font-lilita text-lg uppercase text-black flex items-center gap-2">
                <Inbox className="w-5 h-5 text-[#3A86FF]" />
                Kotak Masuk Surat Balasan
              </h3>
              <button 
                onClick={() => refreshData()}
                className="bg-white hover:bg-gray-50 p-2 border-2.5 border-black rounded-lg shadow-neo-sm text-xs font-lexend font-black flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Segarkan
              </button>
            </div>

            {feedbacks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {feedbacks.map((feed) => {
                  const isToKoor = feed.tujuan === "koor";
                  
                  return (
                    <div 
                      key={feed.id} 
                      className={`border-4 border-black p-5 rounded-2xl shadow-neo-md relative bg-white rotate-[${feed.id % 2 === 0 ? '-0.5deg' : '0.5deg'}]`}
                    >
                      <div className="flex justify-between items-start gap-4 mb-3 pb-2.5 border-b-2 border-black/10">
                        <div>
                          {feed.is_anonim ? (
                            <span className="bg-[#FF006E] text-white font-lexend font-black text-[10px] uppercase px-2.5 py-0.5 border-2 border-black rounded-md">
                              🔒 ANONIM (DEPARTEMEN)
                            </span>
                          ) : (
                            <div>
                              <h4 className="font-lexend font-extrabold text-sm text-black">
                                {feed.anggota?.nama || "Anggota"}
                              </h4>
                              <p className="text-[10px] font-lexend text-gray-500 font-bold uppercase mt-0.5">
                                NIM {feed.anggota?.nim}
                              </p>
                            </div>
                          )}
                          <p className="text-[9px] font-lexend text-gray-400 font-semibold uppercase mt-1">
                            Pengirim: {feed.departemen_pengirim}
                          </p>
                        </div>

                        <span className={`text-[9px] font-lexend font-black uppercase px-2 py-0.5 border-2 border-black rounded-md 
                          ${feed.tujuan === 'koor' ? "bg-[#FFBE0B] text-black" : feed.tujuan === 'chairman' ? "bg-[#FF6B6B] text-black" : "bg-[#3A86FF] text-white"}`}
                        >
                          Ke: {feed.tujuan === 'chairman' ? "Chairman" : feed.tujuan === 'vice_chairman' ? "Vice Chairman" : "Koordinator"}
                        </span>
                      </div>

                      <div className="font-handwriting text-[#1A1D20] text-sm leading-relaxed min-h-[4rem] bg-[#FFFDF0] border-2 border-black/5 p-3 rounded-lg italic">
                        &ldquo;{feed.isi_balasan}&rdquo;
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-lexend text-gray-400 font-bold mt-4 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(feed.created_at).toLocaleString("id-ID", { 
                            dateStyle: "short", 
                            timeStyle: "short" 
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>ID #{feed.id}</span>
                          {currentUser.role === "admin" && (
                            <button
                              type="button"
                              onClick={() => handleDeleteFeedback(feed.id)}
                              className="p-1 text-[#FF6B6B] hover:bg-red-50 hover:border-red-400 border border-transparent rounded cursor-pointer transition-all active:scale-95"
                              title="Hapus Feedback"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border-4 border-black rounded-2xl shadow-neo-md max-w-md mx-auto">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <h3 className="font-lexend font-extrabold text-lg text-black">Belum ada umpan balik</h3>
                <p className="font-lexend text-gray-500 text-xs mt-1">
                  Kotak masuk masih kosong. Belum ada anggota yang mengirimkan surat balasan.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANAJEMEN ANGGOTA / EVALUASI */}
        {activeSubTab === "members" && (
          <div className="space-y-6">
            {/* Filter/Search Panel */}
            <div className="bg-[#FFFDF0] border-4 border-black p-4 rounded-xl shadow-neo-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Users className="w-5 h-5 text-[#06D6A0]" />
                <h3 className="font-lilita text-lg uppercase text-black">
                  Kelola Surat Evaluasi & Kredensial Anggota
                </h3>
              </div>
              
              <div className="relative w-full md:w-80">
                <input 
                  type="text" 
                  placeholder="Cari nama anggota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border-2.5 border-black rounded-lg font-lexend font-semibold text-xs text-black focus:outline-none focus:ring-3 focus:ring-[#06D6A0]/30"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              </div>
            </div>

            {/* Members List Table */}
            <div className="bg-white border-4 border-black rounded-xl shadow-neo-md overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1A1D20] text-white border-b-4 border-black text-xs font-lexend uppercase tracking-wider">
                    <th className="p-3 text-center w-12">No</th>
                    <th className="p-3">Nama Anggota</th>
                    <th className="p-3">Departemen & Jabatan</th>
                    <th className="p-3 w-32">NIM</th>
                    <th className="p-3 w-36">Tanggal Lahir</th>
                    {currentUser.role === "admin" && <th className="p-3 w-24">Role</th>}
                    <th className="p-3 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-lexend text-xs">
                  {visibleMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/80 transition-all">
                      <td className="p-3 font-bold text-center border-r-2 border-black/5">{m.no_urut}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full border-2 border-black overflow-hidden bg-[#FFFDF0]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.foto_url} alt="avatar" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="font-extrabold text-black block">{m.nama}</span>
                            <span className="text-[10px] text-gray-400 capitalize">{m.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold block">{m.jabatan}</span>
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">{m.departemen}</span>
                      </td>
                      <td className="p-3 font-mono font-bold">{m.nim}</td>
                      <td className="p-3 font-mono">{m.tanggal_lahir}</td>
                      {currentUser.role === "admin" && (
                        <td className="p-3">
                          <span className="uppercase text-[10px] font-black px-2 py-0.5 bg-gray-100 border border-black/20 rounded">
                            {m.role}
                          </span>
                        </td>
                      )}
                      <td className="p-3 text-center border-l-2 border-black/5">
                        {/* Access check: Fatir (Chairman) cannot edit Aedil (Vice Chairman) OR Koor cannot edit themselves */}
                        {(((currentUser?.nama === 'Fatir Gibran' || currentUser?.jabatan === 'Chairman' || currentUser?.nim === '103112430153') && 
                          (m.nama === 'Aedil Riski Ansyah' || m.jabatan === 'Vice Chairman' || m.nim === '103112400101')) ||
                          (currentUser?.role === "koor" && m.id === currentUser?.id)) ? (
                          <div className="flex items-center gap-1 mx-auto justify-center text-gray-400 font-bold bg-gray-100 border-2 border-dashed border-gray-300 px-3 py-1.5 rounded-md w-max select-none">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Terkunci</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="bg-[#FFBE0B] hover:bg-[#e6ab0a] text-black font-black px-3 py-1.5 border-2 border-black rounded-md shadow-neo-sm active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {visibleMembers.length === 0 && (
                    <tr>
                      <td colSpan={currentUser.role === "admin" ? 7 : 6} className="p-8 text-center text-gray-400 font-extrabold">
                        Tidak ada anggota terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------
          EDIT MEMBER MODAL
          ---------------------------------------------------- */}
      {editModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/50 overlay-polka-dot">
          <div className="bg-[#FFFDF0] border-4 border-black p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-neo-xl">
            
            <div className="flex justify-between items-start border-b-2.5 border-black/10 pb-3 mb-4">
              <div>
                <h3 className="font-lilita text-xl text-black uppercase">Edit Data Evaluasi</h3>
                <p className="text-xs font-lexend font-bold text-gray-500 uppercase">
                  {editingMember.nama} — {editingMember.jabatan}
                </p>
              </div>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="bg-white hover:bg-gray-100 border-2 border-black p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {currentUser.role === "admin" ? (
                // ADMIN INTERFACE (Can edit credentials, departments, roles, messages)
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-lexend font-bold text-xs uppercase text-gray-700 mb-1">NIM Anggota (Login ID)</label>
                      <input 
                        type="text" 
                        value={editNim}
                        onChange={(e) => setEditNim(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 border-2.5 border-black rounded-lg font-lexend text-xs text-black bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-lexend font-bold text-xs uppercase text-gray-700 mb-1">Tanggal Lahir (Login DOB)</label>
                      <input 
                        type="text" 
                        value={editDob}
                        onChange={(e) => setEditDob(e.target.value)}
                        placeholder="YYYY-MM-DD"
                        required
                        className="w-full px-3 py-1.5 border-2.5 border-black rounded-lg font-lexend text-xs text-black bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-lexend font-bold text-xs uppercase text-gray-700 mb-1">Role Akses</label>
                      <select 
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full px-3 py-1.5 border-2.5 border-black rounded-lg font-lexend text-xs text-black bg-white"
                      >
                        <option value="staff">Staff (Anggota Biasa)</option>
                        <option value="koor">Coordinator (Koordinator)</option>
                        <option value="admin">Admin (Chairman & Vice Chairman)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-lexend font-bold text-xs uppercase text-gray-700 mb-1">Departemen</label>
                      <input 
                        type="text" 
                        value={editDept}
                        onChange={(e) => setEditDept(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 border-2.5 border-black rounded-lg font-lexend text-xs text-black bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-lexend font-bold text-xs uppercase text-gray-700 mb-1">Foto Profil</label>
                    <div className="flex flex-col sm:flex-row gap-3 items-center bg-white border-2.5 border-black p-3 rounded-lg">
                      <div className="w-16 h-16 rounded-xl border-2.5 border-black bg-white overflow-hidden shadow-neo-sm relative flex-shrink-0">
                        {editFotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={editFotoUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400">Preview</div>
                        )}
                      </div>
                      <div className="flex-grow w-full space-y-2">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-2 file:border-black file:text-[10px] file:font-black file:bg-[#FFBE0B] file:text-black hover:file:bg-[#e6ab0a] file:cursor-pointer cursor-pointer"
                        />
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] text-gray-500 font-semibold flex-shrink-0">Atau URL:</span>
                          <input 
                            type="text" 
                            value={editFotoUrl}
                            onChange={(e) => setEditFotoUrl(e.target.value)}
                            placeholder="https://... atau data:image/..."
                            className="flex-grow px-2 py-1 border-2 border-black rounded-md font-lexend text-[10px] text-black bg-white focus:outline-none focus:border-[#FFBE0B]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>


                  <div className="space-y-3 pt-2 border-t-2 border-black/5">
                    <div>
                      <label className="block font-lexend font-bold text-xs uppercase text-amber-700 mb-1 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 fill-amber-300" />
                        Pesan Evaluasi Fatir (Chairman)
                      </label>
                      <textarea 
                        rows={3}
                        value={editPesanFatir}
                        onChange={(e) => setEditPesanFatir(e.target.value)}
                        placeholder="Tulis pesan evaluasi dari Fatir..."
                        className="w-full p-3 border-2.5 border-black rounded-lg font-lexend text-xs text-black bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-lexend font-bold text-xs uppercase text-blue-700 mb-1 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 fill-blue-300" />
                        Pesan Evaluasi Aedil (Vice Chairman)
                      </label>
                      <textarea 
                        rows={3}
                        value={editPesanAedil}
                        onChange={(e) => setEditPesanAedil(e.target.value)}
                        placeholder="Tulis pesan evaluasi dari Aedil..."
                        className="w-full p-3 border-2.5 border-black rounded-lg font-lexend text-xs text-black bg-white"
                      />
                    </div>
                    {editingMember?.departemen !== 'Executive Board' && (
                      <div>
                        <label className="block font-lexend font-bold text-xs uppercase text-pink-700 mb-1 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 fill-pink-300" />
                          Pesan Evaluasi dari {
                            members.find(m => m.departemen === editingMember.departemen && m.role === 'koor')?.nama || "Koordinator"
                          }
                        </label>
                        <textarea 
                          rows={3}
                          value={editPesanKoor}
                          onChange={(e) => setEditPesanKoor(e.target.value)}
                          placeholder={`Tulis pesan evaluasi dari ${members.find(m => m.departemen === editingMember.departemen && m.role === 'koor')?.nama || "Koordinator"}...`}
                          className="w-full p-3 border-2.5 border-black rounded-lg font-lexend text-xs text-black bg-white"
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // COORDINATOR INTERFACE (Can edit pesan_koor and foto_url of staff in their department)
                <div className="space-y-4">
                  <div className="bg-blue-50 border-2 border-blue-400 p-3 rounded-lg text-xs text-blue-700 font-semibold leading-relaxed">
                    💡 Sebagai Koordinator Departemen <strong>{currentUser.departemen}</strong>, Anda berhak menulis atau mengedit pesan evaluasi (Pesan Koor) serta mengubah foto profil staf di departemen Anda. Data kredensial (NIM, DOB) hanya bisa diedit oleh Admin (Chairman/Vice Chairman).
                  </div>

                  <div>
                    <label className="block font-lexend font-bold text-xs uppercase text-gray-700 mb-1">Foto Profil Staf</label>
                    <div className="flex flex-col sm:flex-row gap-3 items-center bg-white border-2.5 border-black p-3 rounded-lg">
                      <div className="w-16 h-16 rounded-xl border-2.5 border-black bg-white overflow-hidden shadow-neo-sm relative flex-shrink-0">
                        {editFotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={editFotoUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400">Preview</div>
                        )}
                      </div>
                      <div className="flex-grow w-full space-y-2">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-2 file:border-black file:text-[10px] file:font-black file:bg-[#FFBE0B] file:text-black hover:file:bg-[#e6ab0a] file:cursor-pointer cursor-pointer"
                        />
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] text-gray-500 font-semibold flex-shrink-0">Atau URL:</span>
                          <input 
                            type="text" 
                            value={editFotoUrl}
                            onChange={(e) => setEditFotoUrl(e.target.value)}
                            placeholder="https://... atau data:image/..."
                            className="flex-grow px-2 py-1 border-2 border-black rounded-md font-lexend text-[10px] text-black bg-white focus:outline-none focus:border-[#FFBE0B]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-lexend font-bold text-xs uppercase text-black mb-1">
                      Pesan Evaluasi dari {currentUser.nama} ({currentUser.departemen})
                    </label>
                    <textarea 
                      rows={4}
                      value={editPesanKoor}
                      onChange={(e) => setEditPesanKoor(e.target.value)}
                      placeholder="Tulis pesan evaluasi/apresiasi tim internal untuk staf ini..."
                      required
                      className="w-full p-4 border-2.5 border-black rounded-lg font-lexend text-xs text-black bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t-2 border-black/10">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 bg-white hover:bg-gray-100 text-black font-lexend font-black py-2.5 border-3 border-black rounded-lg shadow-neo-sm text-xs cursor-pointer active:translate-y-0.5 active:shadow-none transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-[#06D6A0] hover:bg-[#05ba8c] text-black font-lexend font-black py-2.5 border-3 border-black rounded-lg shadow-neo-sm text-xs flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                >
                  {isUpdating ? "Memperbarui..." : (
                    <>
                      <Check className="w-4 h-4" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CROPPER MODAL (Interactive Pangkas Foto) */}
      {cropperModalOpen && cropperImageSrc && (() => {
        // Calculate base size inside 300x300 viewport
        let baseWidth = 300;
        let baseHeight = 300;

        if (imageSize.width > 0 && imageSize.height > 0) {
          if (imageSize.width > imageSize.height) {
            // Landscape: fit height to 300, scale width proportionally
            baseHeight = 300;
            baseWidth = imageSize.width * (300 / imageSize.height);
          } else {
            // Portrait: fit width to 300, scale height proportionally
            baseWidth = 300;
            baseHeight = imageSize.height * (300 / imageSize.width);
          }
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 overlay-polka-dot">
            <div className="bg-[#FFFDF0] border-4 border-black p-6 rounded-2xl max-w-md w-full relative shadow-neo-xl">
              
              <div className="border-b-2.5 border-black/10 pb-3 mb-4 text-center">
                <h3 className="font-lilita text-lg text-black uppercase">Sesuaikan & Pangkas Foto</h3>
                <p className="text-[10px] font-lexend font-semibold text-gray-500">
                  Seret gambar untuk mengatur posisi, gunakan slider untuk zoom.
                </p>
              </div>

              {/* Viewport Box (Aspect Square, 300x300 px) */}
              <div className="flex justify-center my-4">
                <div 
                  className="w-[300px] h-[300px] border-4 border-black relative overflow-hidden bg-gray-200 shadow-inner select-none cursor-move rounded-lg"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  style={{ touchAction: "none" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={cropperImageSrc} 
                    alt="Crop preview" 
                    className="absolute pointer-events-none max-w-none origin-center"
                    style={{
                      width: `${baseWidth}px`,
                      height: `${baseHeight}px`,
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) translate(${cropperOffset.x}px, ${cropperOffset.y}px) scale(${cropperZoom})`,
                      transition: isDragging ? "none" : "transform 0.1s ease-out"
                    }}
                  />
                  
                  {/* Centered square grid guide - matches the exact viewport boundary */}
                  <div className="absolute inset-0 border-3 border-dashed border-white/40 pointer-events-none"></div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-2 h-2 bg-white rounded-full border border-black"></div>
                  </div>
                </div>
              </div>

              {/* Zoom Slider Control */}
              <div className="space-y-1 my-4">
                <div className="flex justify-between items-center text-xs font-lexend font-bold text-gray-700">
                  <span>Perbesar (Zoom)</span>
                  <span>{cropperZoom.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="3" 
                  step="0.05"
                  value={cropperZoom}
                  onChange={(e) => setCropperZoom(parseFloat(e.target.value))}
                  className="w-full h-2.5 bg-gray-200 border-2 border-black rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t-2 border-black/10">
                <button
                  type="button"
                  onClick={() => {
                    setCropperModalOpen(false);
                    setCropperImageSrc("");
                  }}
                  className="flex-1 bg-white hover:bg-gray-100 text-black font-lexend font-black py-2 border-3 border-black rounded-lg shadow-neo-sm text-xs cursor-pointer active:translate-y-0.5 active:shadow-none transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeCrop}
                  className="flex-1 bg-[#06D6A0] hover:bg-[#05ba8c] text-black font-lexend font-black py-2 border-3 border-black rounded-lg shadow-neo-sm text-xs cursor-pointer active:translate-y-0.5 active:shadow-none transition-all"
                >
                  Selesai & Potong
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}

