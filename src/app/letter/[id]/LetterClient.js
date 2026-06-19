"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Crown, 
  Zap, 
  Sparkles, 
  Download, 
  Send, 
  Lock, 
  ArrowLeft,
  Image as ImageIcon,
  CheckCircle,
  EyeOff,
  UserCheck
} from "lucide-react";
import { getMemberById, addFeedback, updateMember, getMembers } from "@/lib/db";
import { getSession, isAdmin } from "@/lib/session";

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

export default function LetterClient({ memberId, initialMember, initialKoorName }) {
  const router = useRouter();

  // Refs for PDF Export
  const photoboxRef = useRef(null);

  // States
  const [currentUser, setCurrentUser] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Unboxing Envelope State
  // 'closed' -> 'opening' -> 'open'
  const [envelopeState, setEnvelopeState] = useState("closed");
  
  // Letter Canvas State
  // Determine default active tab based on member role
  const getDefaultTab = (m) => {
    if (!m) return "fatir";
    if (m.nama === 'Fatir Gibran' || m.jabatan === 'Chairman') return 'aedil';
    if (m.nama === 'Aedil Riski Ansyah' || m.jabatan === 'Vice Chairman') return 'fatir';
    return 'fatir';
  };
  const [activeTab, setActiveTab] = useState("fatir"); // 'fatir', 'aedil', 'koor'
  const [koorName, setKoorName] = useState("");
  
  // Photobox Editor State
  const [frameTemplate, setFrameTemplate] = useState("y2k"); // 'y2k', 'checker', 'checker_mono', 'pastel', 'holo', 'comic', 'comic_mint', 'vintage', 'vintage_kraft', 'synthwave', 'grunge', 'stripes', 'polaroid'
  const [photoboxLayout, setPhotoboxLayout] = useState("vertical_strip"); // 'vertical_strip', 'classic_polaroid', 'double_stack', 'trio_strip', 'asymmetric_collage'
  const [photoboxFont, setPhotoboxFont] = useState("handwriting"); // 'handwriting', 'lexend', 'lilita', 'mono'
  const [photoFilter, setPhotoFilter] = useState("normal"); // 'normal', 'grayscale', 'sepia', 'cool', 'vivid', 'vhs'
  const [showStampsOverlay, setShowStampsOverlay] = useState(true);
  const [customBadge, setCustomBadge] = useState("MEMBER OF THE YEAR");
  const [customBadgeText, setCustomBadgeText] = useState("BEST MEMBER");
  const [customSubtitleText, setCustomSubtitleText] = useState("");
  const [customQuote, setCustomQuote] = useState("Dedikasi Tanpa Batas!");
  const [customQuoteTitle, setCustomQuoteTitle] = useState("QUOTES APRESIASI");
  const [slot1Emoji, setSlot1Emoji] = useState("⭐");
  const [slot1EmojiInput, setSlot1EmojiInput] = useState("");
  const [slot2Emoji, setSlot2Emoji] = useState("❤️");
  const [slot2EmojiInput, setSlot2EmojiInput] = useState("");
  const [slot3Emoji, setSlot3Emoji] = useState("✨");
  const [slot3EmojiInput, setSlot3EmojiInput] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [photoSource, setPhotoSource] = useState("profile"); // 'profile', 'kabinet', 'departemen'

  // Letter Souvenir Print State
  const letterPrintRef = useRef(null);
  const [printLayout, setPrintLayout] = useState("grid"); // 'grid', 'vertical', 'bulletin', 'single', 'timeline', 'bento', 'magazine', 'greeting'
  const [printTheme, setPrintTheme] = useState("cream"); // 'cream', 'pastel', 'carbon', 'neon', 'kraft', 'blueprint', 'lined', 'newspaper'
  const [isExportingLetter, setIsExportingLetter] = useState(false);

  // Feedback Form State
  const [tujuan, setTujuan] = useState("chairman"); // 'chairman', 'vice_chairman', or 'koor'
  const [isAnonim, setIsAnonim] = useState(false);
  const [isiBalasan, setIsiBalasan] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Load user session and member details
  useEffect(() => {
    async function init() {
      const session = getSession();
      setCurrentUser(session);

      if (!session) {
        setLoading(false);
        return; // Redirect handled in render/auth guard
      }

      try {
        let data = initialMember;
        if (!data) {
          data = await getMemberById(memberId);
        }
        
        if (data) {
          setMember(data);
          // Set default active tab based on member role
          if (data.nama === 'Fatir Gibran' || data.jabatan === 'Chairman') {
            setActiveTab('aedil');
          } else if (data.nama === 'Aedil Riski Ansyah' || data.jabatan === 'Vice Chairman') {
            setActiveTab('fatir');
          }
          // Security check: Only Admin OR the member themselves can view this page
          if (session.role === "admin" || session.id === data.id) {
            setIsAuthorized(true);
          }

          // Fetch coordinator name for the member's department
          if (initialKoorName) {
            setKoorName(initialKoorName);
          } else {
            try {
              const deptMems = await getMembers(data.departemen);
              const koorMember = deptMems.find(m => m.role === 'koor');
              if (koorMember) {
                setKoorName(koorMember.nama);
              }
            } catch (koorErr) {
              console.error("Failed to load coordinator name", koorErr);
            }
          }
        }
      } catch (err) {
        console.error("Error loading member data", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [memberId, initialMember, initialKoorName]);

  // Trigger Confetti when envelope is opened
  const handleOpenEnvelope = () => {
    setEnvelopeState("opening");
    
    // Simulate flap opening, then slide out
    setTimeout(() => {
      setEnvelopeState("open");
      
      // Trigger canvas confetti
      import("canvas-confetti").then((confetti) => {
        // First burst
        confetti.default({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        
        // Second burst after 400ms
        setTimeout(() => {
          confetti.default({
            particleCount: 80,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
          confetti.default({
            particleCount: 80,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 400);
      });
    }, 1200);
  };

  // Handle feedback form submit
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!isiBalasan.trim()) return;

    if (currentUserIsEBSecretaryOrTreasurer && tujuan === 'koor') {
      alert("Sekretaris dan Bendahara Executive Board hanya dapat mengirim umpan balik ke Chairman dan Vice Chairman.");
      return;
    }

    setFeedbackLoading(true);
    try {
      await addFeedback({
        pengirim_id: currentUser.id,
        tujuan: tujuan,
        departemen_pengirim: currentUser.departemen,
        isi_balasan: isiBalasan,
        is_anonim: isAnonim
      });
      setFeedbackSuccess(true);
      setIsiBalasan("");
      setTimeout(() => setFeedbackSuccess(false), 5000);
    } catch (err) {
      alert("Gagal mengirim feedback: " + err.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Handle PDF Export
  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const element = photoboxRef.current;
      if (!element) return;

      // Wait for all custom web fonts to be fully loaded
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }

      // Scan target HTML element with high scale for printing quality
      const canvas = await html2canvas(element, {
        scale: 5, // High DPI rendering (extremely sharp)
        useCORS: true, // Allow cross-origin images
        allowTaint: true,
        backgroundColor: null,
        onclone: (clonedDoc) => {
          // Copy fonts from main document to cloned document for correct character measurements
          if (typeof document !== "undefined" && document.fonts && clonedDoc.fonts) {
            document.fonts.forEach((font) => {
              try {
                clonedDoc.fonts.add(font);
              } catch (e) {
                console.error("Error copying font to cloned document", e);
              }
            });
          }

          // 1. Remove all scale and transform styles from parent elements in the cloned DOM to prevent layout distortion
          const strip = clonedDoc.getElementById("photobox-strip");
          if (strip) {
            let parent = strip.parentElement;
            while (parent) {
              parent.style.transform = "none";
              parent.style.scale = "none";
              parent.style.zoom = "1";
              parent = parent.parentElement;
            }

            // 2. Prevent space character collapse/overlapping by forcing positive letter-spacing and disabling ligatures
            const textNodes = strip.querySelectorAll("span, div, p, h4, h3, h2");
            textNodes.forEach((node) => {
              node.style.letterSpacing = "0.3px";
              node.style.wordSpacing = "normal";
              node.style.fontVariantLigatures = "none";
              node.style.fontFeatureSettings = '"liga" 0';
            });
          }
        }
      });

      const imgData = canvas.toDataURL("image/png");
      
      // Photobox aspect ratio is roughly 1:4 (e.g. 100mm x 400mm)
      // Create a PDF with custom size that fits the strip perfectly
      const pdfWidth = 100; // mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, "", "FAST");
      pdf.save(`photobox_${member.nama.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Gagal mengunduh PDF: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle PDF Export for the entire letter pages
  const handleExportLetterPDF = async () => {
    setIsExportingLetter(true);
    
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const element = letterPrintRef.current;
      if (!element) return;

      // Wait for all custom web fonts to be fully loaded
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }

      // Scan target HTML element with high scale for printing quality
      const canvas = await html2canvas(element, {
        scale: 4, // High DPI rendering (extremely sharp)
        useCORS: true, // Allow cross-origin images
        allowTaint: true,
        backgroundColor: null,
        onclone: (clonedDoc) => {
          // Copy fonts from main document to cloned document for correct character measurements
          if (typeof document !== "undefined" && document.fonts && clonedDoc.fonts) {
            document.fonts.forEach((font) => {
              try {
                clonedDoc.fonts.add(font);
              } catch (e) {
                console.error("Error copying font to cloned document", e);
              }
            });
          }

          // 1. Remove all scale and transform styles from parent elements in the cloned DOM to prevent layout distortion
          const card = clonedDoc.getElementById("letter-souvenir-card");
          if (card) {
            let parent = card.parentElement;
            while (parent) {
              parent.style.transform = "none";
              parent.style.scale = "none";
              parent.style.zoom = "1";
              parent = parent.parentElement;
            }

            // 2. Prevent space character collapse/overlapping by forcing positive letter-spacing and disabling ligatures
            const textNodes = card.querySelectorAll("span, div, p, h4, h3, h2");
            textNodes.forEach((node) => {
              node.style.letterSpacing = "0.3px";
              node.style.wordSpacing = "normal";
              node.style.fontVariantLigatures = "none";
              node.style.fontFeatureSettings = '"liga" 0';
            });
          }
        }
      });

      const imgData = canvas.toDataURL("image/png");
      
      const pdfWidth = 210; // mm (A4 width)
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, "", "FAST");
      pdf.save(`surat_evaluasi_${member.nama.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("Failed to generate Letter PDF", err);
      alert("Gagal mengunduh PDF: " + err.message);
    } finally {
      setIsExportingLetter(false);
    }
  };

  // ----------------------------------------------------
  // CONDITIONAL RENDER: Loading / Auth Guards
  // ----------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen y2k-mesh-bg flex items-center justify-center">
        <div className="bg-white border-4 border-black p-6 rounded-xl shadow-neo-md text-center max-w-sm">
          <div className="w-12 h-12 border-4 border-t-brand-cc border-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-lexend font-black">Memuat lembar surat...</p>
        </div>
      </div>
    );
  }

  // Not Logged In Guard
  if (!currentUser) {
    return (
      <div className="min-h-screen y2k-mesh-bg flex items-center justify-center p-4">
        <div className="bg-[#FF6B6B] border-4 border-black p-8 rounded-2xl max-w-md text-center shadow-neo-lg rotate-[-1deg]">
          <Lock className="w-16 h-16 mx-auto text-black mb-4 animate-bounce" />
          <h2 className="font-lilita text-2xl uppercase text-black mb-2">Akses Terkunci</h2>
          <p className="font-lexend font-semibold text-black/90 mb-6">
            Anda harus masuk (log in) terlebih dahulu untuk membaca surat evaluasi kepengurusan HMIF.
          </p>
          <button 
            onClick={() => router.push("/")}
            className="w-full bg-[#FFFDF0] hover:bg-white text-black font-lexend font-black py-3 border-3 border-black rounded-lg shadow-neo-sm flex items-center justify-center gap-2 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Galeri Polaroid
          </button>
        </div>
      </div>
    );
  }

  // Unauthorized Access Guard
  if (!isAuthorized) {
    return (
      <div className="min-h-screen y2k-mesh-bg flex items-center justify-center p-4">
        <div className="bg-[#FF6B6B] border-4 border-black p-8 rounded-2xl max-w-md text-center shadow-neo-lg rotate-[1deg]">
          <EyeOff className="w-16 h-16 mx-auto text-black mb-4" />
          <h2 className="font-lilita text-2xl uppercase text-black mb-2">Kerahasiaan Terjamin</h2>
          <p className="font-lexend font-semibold text-black/95 mb-6">
            Maaf, demi menjaga kerahasiaan evaluasi organisasi, Anda tidak diizinkan membaca surat evaluasi anggota lain.
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => router.push("/")}
              className="flex-1 bg-white hover:bg-gray-100 text-black font-lexend font-black py-2.5 border-3 border-black rounded-lg shadow-neo-sm text-sm active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              Kembali
            </button>
            <button 
              onClick={() => router.push(`/letter/${currentUser.id}`)}
              className="flex-1 bg-[#06D6A0] hover:bg-[#05ba8c] text-black font-lexend font-black py-2.5 border-3 border-black rounded-lg shadow-neo-sm text-sm active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              Surat Saya
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Tab Message Selection
  const getTabMessage = () => {
    switch (activeTab) {
      case "aedil": return member.pesan_aedil || "Belum ada pesan evaluasi dari Vice Chairman.";
      case "koor": return member.pesan_koor || `Belum ada pesan evaluasi dari ${koorName || "Koordinator Departemen"}.`;
      case "fatir":
      default:
        return member.pesan_fatir || "Belum ada pesan evaluasi dari Chairman.";
    }
  };

  // Determine which tabs to show based on member role
  const isFatir = member.nama === 'Fatir Gibran' || member.jabatan === 'Chairman';
  const isAedil = member.nama === 'Aedil Riski Ansyah' || member.jabatan === 'Vice Chairman';
  const isEBSecretaryOrTreasurer = member.departemen === 'Executive Board' && (member.jabatan?.includes('Secretary') || member.jabatan?.includes('Treasure'));
  const showFatirTab = !isFatir; // Fatir doesn't see their own tab
  const showAedilTab = !isAedil; // Aedil doesn't see their own tab
  const showKoorTab = !isFatir && !isAedil && !isEBSecretaryOrTreasurer && member.role !== 'koor'; // EB members and coordinators don't see Koor tab

  // Check if member is Chairman or Vice Chairman (hide feedback for them)
  const isMemberEB = isFatir || isAedil;

  // Check if current user is EB (Chairman or Vice Chairman) to disable feedback sending
  const currentUserIsEB = currentUser && (
    currentUser.nama === 'Fatir Gibran' || 
    currentUser.nama === 'Aedil Riski Ansyah' || 
    currentUser.jabatan === 'Chairman' || 
    currentUser.jabatan === 'Vice Chairman'
  );

  // Check if current user is EB Secretary or Treasurer
  const currentUserIsEBSecretaryOrTreasurer = currentUser && 
    currentUser.departemen === 'Executive Board' && 
    (currentUser.jabatan?.includes('Secretary') || currentUser.jabatan?.includes('Treasure'));

  // Whether the current user is allowed to send feedback to their Koor
  const canSendToKoor = !!(currentUser && currentUser.role !== 'koor' && !currentUserIsEBSecretaryOrTreasurer);

  // Frame background class resolver for the theme variants
  // Get CSS filter style string based on current selection
  const getFilterStyle = () => {
    switch (photoFilter) {
      case "grayscale": return "grayscale(100%)";
      case "sepia": return "sepia(100%)";
      case "cool": return "saturate(130%) hue-rotate(180deg) brightness(95%)";
      case "vivid": return "saturate(200%) contrast(120%)";
      case "vhs": return "contrast(85%) brightness(110%) saturate(90%) sepia(20%)";
      case "normal":
      default:
        return "none";
    }
  };

  // Stamp Badge Overlay Renderer for Photobox Slots
  const renderSlotStamps = (stampsStr) => {
    if (!stampsStr || !showStampsOverlay) return null;
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
      <div className="absolute top-1 left-1 flex flex-col gap-0.5 z-20 pointer-events-none scale-75 origin-top-left">
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
              className={`px-1 py-0.5 border-1.5 ${style.border || 'border-black'} ${style.bg} ${style.text} font-lilita text-[8px] uppercase tracking-wider shadow-sm rotate-[-3deg] rounded-sm flex items-center gap-0.5`}
            >
              <span>{parsed.emoji}</span>
              <span>{parsed.text}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Frame background class resolver for the theme variants
  const getFrameBgClass = () => {
    switch (frameTemplate) {
      case "checker": return "bg-[#ffbe0b]";
      case "checker_mono": return "bg-white";
      case "pastel": return "bg-[#e0e7ff]";
      case "holo": return "bg-gradient-to-br from-pink-300 via-purple-300 via-indigo-200 to-yellow-100";
      case "comic": return "bg-[#FFBE0B]";
      case "comic_mint": return "bg-[#06D6A0]";
      case "vintage": return "bg-[#F5EBE0] border-amber-900/10";
      case "vintage_kraft": return "bg-[#D0B49F] border-amber-950/20";
      case "synthwave": return "bg-gradient-to-br from-[#1d0a34] via-[#5d0e41] to-[#e4007f]";
      case "grunge": return "bg-[#16191e]";
      case "stripes": return "bg-[#ffd6ff]";
      case "polaroid": return "bg-[#f4f3ef]";
      case "y2k":
      default:
        return "bg-y2k-cyber";
    }
  };

  // Photobox background pattern overlay
  const getPhotoboxPattern = () => {
    switch (frameTemplate) {
      case "checker_mono": {
        const squares = [];
        // Width is 240px (asymmetric is 320px). Cover up to 16 columns (320px).
        // Height is dynamic but let's cover up to 1200px (60 rows).
        for (let row = 0; row < 60; row++) {
          for (let col = 0; col < 16; col++) {
            if ((row + col) % 2 === 1) {
              squares.push(
                <div 
                  key={`sq-${row}-${col}`}
                  className="absolute bg-black pointer-events-none"
                  style={{
                    width: "20px",
                    height: "20px",
                    left: `${col * 20}px`,
                    top: `${row * 20}px`
                  }}
                />
              );
            }
          }
        }
        return <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">{squares}</div>;
      }
      case "checker": {
        const squares = [];
        // Width is 320px (11 columns of 30px). Height is up to 1200px (40 rows).
        for (let row = 0; row < 40; row++) {
          for (let col = 0; col < 12; col++) {
            if ((row + col) % 2 === 1) {
              squares.push(
                <div 
                  key={`sq-${row}-${col}`}
                  className="absolute bg-[#ff006e] pointer-events-none"
                  style={{
                    width: "30px",
                    height: "30px",
                    left: `${col * 30}px`,
                    top: `${row * 30}px`
                  }}
                />
              );
            }
          }
        }
        return <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">{squares}</div>;
      }
      case "synthwave":
        return (
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[linear-gradient(rgba(18,4,30,0)_95%,#ff007f_95%),linear-gradient(90deg,rgba(18,4,30,0)_95%,#ff007f_95%)] bg-[length:25px_25px] opacity-30"
          />
        );
      case "grunge":
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-15">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,#39ff14_25%,transparent_25%),linear-gradient(-45deg,#39ff14_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#39ff14_75%),linear-gradient(-45deg,transparent_75%,#39ff14_75%)] bg-[length:10px_10px] bg-[position:0_0,0_5px,5px_-5px,5px_0px]"></div>
          </div>
        );
      case "stripes":
        return (
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[linear-gradient(45deg,#ffd6ff_25%,#f1e1f5_25%,#f1e1f5_50%,#ffd6ff_50%,#ffd6ff_75%,#f1e1f5_75%,#f1e1f5_100%)] bg-[length:30px_30px]"
          />
        );
      case "polaroid":
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#f4f3ef]">
            <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.05)] border-4 border-white"></div>
          </div>
        );
      case "y2k":
        return <div className="absolute inset-0 bg-[#0000000a] overlay-polka-dot pointer-events-none z-0"></div>;
      case "holo":
        return <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px] pointer-events-none z-0"></div>;
      case "comic":
        return <div className="absolute inset-0 bg-repeat bg-[linear-gradient(45deg,#00000012_25%,transparent_25%,transparent_75%,#00000012_75%,#00000012),linear-gradient(45deg,#00000012_25%,transparent_25%,transparent_75%,#00000012_75%,#00000012)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] pointer-events-none z-0"></div>;
      default:
        return null;
    }
  };

  // Slot inner styling resolver
  const getSlotBgClass = () => {
    if (frameTemplate === 'vintage' || frameTemplate === 'vintage_kraft') return 'bg-[#FFFDF0] text-amber-950 border-amber-900/20';
    if (frameTemplate === 'grunge') return 'bg-[#22252a] text-[#39ff14] border-[#39ff14]';
    if (frameTemplate === 'synthwave') return 'bg-[#1a082e] text-[#f15bb5] border-[#00f0ff]';
    if (frameTemplate === 'polaroid') return 'bg-white text-black border-gray-200 shadow-sm';
    return 'bg-white text-black border-black';
  };

  // Font class resolver
  const getFontClass = () => {
    switch (photoboxFont) {
      case "lexend": return "font-lexend";
      case "lilita": return "font-lilita";
      case "mono": return "font-mono";
      case "handwriting":
      default:
        return "font-handwriting";
    }
  };

  // Dynamic width resolver based on layout
  const getPhotoboxWidthClass = () => {
    switch (photoboxLayout) {
      case "classic_polaroid": return "w-[240px]";
      case "double_stack": return "w-[240px]";
      case "asymmetric_collage": return "w-[320px] h-[520px]";
      case "trio_strip":
      case "vertical_strip":
      default:
        return "w-[240px]";
    }
  };

  // Get department photo
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

  // Get photobox photo URL based on active source selection
  const getPhotoboxPhotoUrl = () => {
    if (photoSource === "kabinet") return "/Foto Kabinet.webp";
    if (photoSource === "departemen") return getDeptPhotoUrl(member?.departemen);
    return member?.foto_url;
  };

  // Render photo slot
  const renderPhotoSlot = (extraClass = "") => {
    const finalSlot1Emoji = slot1Emoji === "custom" ? slot1EmojiInput : slot1Emoji;
    const isGroupPhoto = photoSource === "kabinet" || photoSource === "departemen";
    
    return (
      <div className={`w-[190px] aspect-square border-3 p-1.5 flex flex-col justify-between shadow-md relative ${getSlotBgClass()} ${extraClass}`}>
        <div className={`w-full aspect-square border border-black overflow-hidden relative ${isGroupPhoto ? 'bg-white' : 'bg-gray-100'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={getPhotoboxPhotoUrl()} 
            alt="photobox-avatar" 
            className={`w-full h-full animate-fade-in ${isGroupPhoto ? 'object-contain' : 'object-cover'}`} 
            style={{ filter: getFilterStyle() }}
          />
          
          {/* Floating Sticker Emoji */}
          {finalSlot1Emoji && finalSlot1Emoji !== "none" && (
            <div className="absolute top-1.5 right-1.5 bg-white/85 border-2 border-black rounded-full w-8 h-8 flex items-center justify-center text-base shadow-sm select-none z-10">
              {finalSlot1Emoji}
            </div>
          )}
          {/* Stamp Overlays */}
          {photoSource === "profile" && renderSlotStamps(member.stamps)}
        </div>
        <div className={`${getFontClass()} font-bold text-[10px] text-center py-0.5 leading-none overflow-hidden text-ellipsis whitespace-nowrap`}>
          {member.nama}
        </div>
      </div>
    );
  };

  // Render department photo slot
  const renderDepartmentPhotoSlot = (extraClass = "") => {
    const finalSlot2Emoji = slot2Emoji === "custom" ? slot2EmojiInput : slot2Emoji;
    const deptPhotoUrl = getDeptPhotoUrl(member?.departemen);
    const labelText = member?.departemen === "Executive Board" ? "Executive Board" : member?.departemen;

    return (
      <div className={`w-[190px] aspect-square border-3 p-1.5 flex flex-col justify-between shadow-md relative ${getSlotBgClass()} ${extraClass}`}>
        <div className="w-full aspect-square border border-black overflow-hidden bg-white relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={deptPhotoUrl} 
            alt="department-photo" 
            className="w-full h-full object-contain animate-fade-in" 
            style={{ filter: getFilterStyle() }}
          />
          
          {/* Floating Sticker Emoji */}
          {finalSlot2Emoji && finalSlot2Emoji !== "none" && (
            <div className="absolute top-1.5 right-1.5 bg-white/85 border-2 border-black rounded-full w-8 h-8 flex items-center justify-center text-base shadow-sm select-none z-10">
              {finalSlot2Emoji}
            </div>
          )}
        </div>
        <div className={`${getFontClass()} font-bold text-[9px] text-center py-0.5 leading-none overflow-hidden text-ellipsis whitespace-nowrap`}>
          {labelText}
        </div>
      </div>
    );
  };

  // Render cabinet photo slot
  const renderCabinetPhotoSlot = (extraClass = "") => {
    const finalSlot3Emoji = slot3Emoji === "custom" ? slot3EmojiInput : slot3Emoji;
    
    return (
      <div className={`w-[190px] aspect-square border-3 p-1.5 flex flex-col justify-between shadow-md relative ${getSlotBgClass()} ${extraClass}`}>
        <div className="w-full aspect-square border border-black overflow-hidden bg-white relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/Foto Kabinet.webp" 
            alt="cabinet-photo" 
            className="w-full h-full object-contain animate-fade-in" 
            style={{ filter: getFilterStyle() }}
          />
          
          {/* Floating Sticker Emoji */}
          {finalSlot3Emoji && finalSlot3Emoji !== "none" && (
            <div className="absolute top-1.5 right-1.5 bg-white/85 border-2 border-black rounded-full w-8 h-8 flex items-center justify-center text-base shadow-sm select-none z-10">
              {finalSlot3Emoji}
            </div>
          )}
        </div>
        <div className={`${getFontClass()} font-bold text-[9px] text-center py-0.5 leading-none overflow-hidden text-ellipsis whitespace-nowrap`}>
          Kabinet Astravia 2026
        </div>
      </div>
    );
  };

  // Render badge slot
  const renderBadgeSlot = (extraClass = "") => {
    const finalSlot2Emoji = slot2Emoji === "custom" ? slot2EmojiInput : slot2Emoji;
    const subtitle = customSubtitleText || `Departemen ${member.departemen === "Executive Board" ? "EB" : member.departemen.split(" & ")[0]}`;
    
    return (
      <div className={`w-[190px] h-[95px] border-3 p-2 flex flex-col justify-center items-center text-center shadow-md relative ${getSlotBgClass()} ${extraClass}`}>
        {finalSlot2Emoji && <span className="text-3xl mb-1 select-none leading-none">{finalSlot2Emoji}</span>}
        <div className={`${photoboxFont === 'handwriting' ? 'font-lexend font-black' : getFontClass() + ' font-black'} text-[10px] uppercase leading-none`}>
          {customBadgeText}
        </div>
        <div className={`${getFontClass()} font-bold text-[9px] text-[#FF006E] mt-1 leading-none`}>
          {subtitle}
        </div>
      </div>
    );
  };

  // Render quote slot
  const renderQuoteSlot = (extraClass = "") => {
    const finalSlot3Emoji = slot3Emoji === "custom" ? slot3EmojiInput : slot3Emoji;
    
    return (
      <div className={`w-[190px] h-[95px] border-3 p-2 flex flex-col justify-center items-center text-center shadow-md relative ${getSlotBgClass()} ${extraClass}`}>
        {finalSlot3Emoji && <span className="text-3xl mb-1 select-none leading-none">{finalSlot3Emoji}</span>}
        <div className={`${photoboxFont === 'handwriting' ? 'font-lexend font-black text-gray-400' : getFontClass() + ' font-black text-gray-400'} text-[8px] uppercase mb-0.5`}>
          {customQuoteTitle}
        </div>
        <div className={`${getFontClass()} font-bold text-[10px] leading-tight italic px-1 line-clamp-2`}>
          &ldquo;{customQuote || "Semangat selalu!"}&rdquo;
        </div>
      </div>
    );
  };

  // Render watermark/footer slot
  const renderWatermarkSlot = (extraClass = "", isLight = false) => {
    let bgClass = isLight ? 'bg-transparent' : 'bg-black border-2.5 border-black';
    let textTitle = isLight ? 'text-black' : 'text-white';
    let textSub = isLight ? 'text-[#3A86FF]' : 'text-[#FFBE0B]';
    
    if (!isLight) {
      if (frameTemplate === 'grunge') {
        bgClass = 'bg-[#16191e] border-2.5 border-[#39ff14]';
        textTitle = 'text-[#39ff14]';
        textSub = 'text-white';
      } else if (frameTemplate === 'synthwave') {
        bgClass = 'bg-[#1a082e] border-2.5 border-[#00f0ff]';
        textTitle = 'text-[#00f0ff]';
        textSub = 'text-[#f15bb5]';
      }
    }

    return (
      <div className={`w-[190px] py-2 ${bgClass} text-center flex flex-col justify-center items-center select-none shadow-sm rounded-sm relative z-10 ${extraClass}`}>
        <div className="flex items-center gap-3 mb-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hmif_logo.png" alt="HMIF Logo" className="w-5 h-5 object-contain" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kabinet_logo.png" alt="Cabinet Logo" className="w-5 h-5 object-contain" />
        </div>
        <div className={`font-lilita text-[11px] ${textTitle} tracking-wider leading-none`}>
          HMIF 2026
        </div>
        <div className={`text-[6.5px] font-lexend font-black ${textSub} tracking-widest uppercase mt-0.5`}>
          KABINET ASTRAVIA
        </div>
      </div>
    );
  };

  // Printable letter theme resolver
  const getPrintThemeClass = () => {
    switch (printTheme) {
      case "pastel": return "bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-200 text-purple-950 border-black";
      case "carbon": return "bg-[#1E293B] text-white border-white/60";
      case "neon": return "bg-[#FF006E] text-white border-black";
      case "kraft": return "bg-[#C9A96E] text-amber-950 border-amber-900";
      case "blueprint": return "bg-[#1a3a5c] text-blue-100 border-blue-300";
      case "lined": return "bg-white text-gray-900 border-gray-400";
      case "newspaper": return "bg-[#F5F0E8] text-gray-900 border-gray-600";
      case "cream":
      default:
        return "bg-[#FAF7F0] text-black border-black";
    }
  };

  // Printable letter theme background pattern overlay
  const getPrintThemePattern = () => {
    switch (printTheme) {
      case "kraft": {
        const lines = [];
        // Horizontal lines: 100 lines (covers up to 2000px height)
        for (let i = 0; i < 100; i++) {
          lines.push(
            <div 
              key={`h-${i}`} 
              className="absolute left-0 right-0 border-t border-amber-900/40 pointer-events-none" 
              style={{ top: `${i * 20}px` }} 
            />
          );
        }
        // Vertical lines: 32 lines (covers 640px width)
        for (let i = 0; i < 32; i++) {
          lines.push(
            <div 
              key={`v-${i}`} 
              className="absolute top-0 bottom-0 border-l border-amber-900/15 pointer-events-none" 
              style={{ left: `${i * 20}px` }} 
            />
          );
        }
        return <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">{lines}</div>;
      }
      case "blueprint": {
        const lines = [];
        // Horizontal lines: 100 lines
        for (let i = 0; i < 100; i++) {
          lines.push(
            <div 
              key={`h-${i}`} 
              className="absolute left-0 right-0 border-t border-blue-400/50 pointer-events-none" 
              style={{ top: `${i * 20}px` }} 
            />
          );
        }
        // Vertical lines: 32 lines
        for (let i = 0; i < 32; i++) {
          lines.push(
            <div 
              key={`v-${i}`} 
              className="absolute top-0 bottom-0 border-l border-blue-400/50 pointer-events-none" 
              style={{ left: `${i * 20}px` }} 
            />
          );
        }
        return <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">{lines}</div>;
      }
      case "lined": {
        const lines = [];
        // Horizontal lines every 27px, starting at top offset (36px)
        for (let i = 0; i < 75; i++) {
          lines.push(
            <div 
              key={`h-${i}`} 
              className="absolute left-0 right-0 border-t border-blue-200 pointer-events-none" 
              style={{ top: `${36 + i * 27}px` }} 
            />
          );
        }
        return <div className="absolute inset-0 pointer-events-none overflow-hidden">{lines}</div>;
      }
      case "newspaper": {
        const lines = [];
        // Horizontal lines every 14px
        for (let i = 0; i < 150; i++) {
          lines.push(
            <div 
              key={`h-${i}`} 
              className="absolute left-0 right-0 border-t border-gray-600/30 pointer-events-none" 
              style={{ top: `${i * 14}px` }} 
            />
          );
        }
        return <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden">{lines}</div>;
      }
      default:
        return null;
    }
  };

  // Printable letter card inner resolver
  const getPrintCardBgClass = () => {
    switch (printTheme) {
      case "carbon": return "bg-[#0F172A] text-white border-white/30";
      case "cream": return "bg-white text-black border-black/15";
      case "pastel": return "bg-white/80 backdrop-blur-sm text-[#1E1B4B] border-purple-300";
      case "neon": return "bg-black text-white border-white";
      case "kraft": return "bg-[#E8D5B0] text-amber-950 border-amber-800/40";
      case "blueprint": return "bg-[#0f2744] text-blue-100 border-blue-400/40";
      case "lined": return "bg-blue-50 text-gray-800 border-blue-200";
      case "newspaper": return "bg-white/70 text-gray-900 border-gray-300";
      default:
        return "bg-white text-black border-black/15";
    }
  };

  // Theme specific colors for the letter page environment
  const deptColor = DEPARTMENTS[member.departemen]?.color || "#FF6B6B";
  const badgeClass = DEPARTMENTS[member.departemen]?.badge || "bg-black text-white";

  return (
    <div className="min-h-screen animated-gradient flex flex-col pb-20 relative overflow-x-hidden">
      
      {/* Top Header Bar */}
      <div className="max-w-6xl w-full mx-auto px-4 pt-6 flex justify-between items-center z-10">
        <button 
          onClick={() => router.push("/")}
          className="bg-[#FFFDF0] hover:bg-white text-black font-lexend font-black px-4 py-2 border-3 border-black rounded-lg shadow-neo-sm text-sm flex items-center gap-1.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Galeri Polaroid
        </button>

        {/* Logos in Center */}
        <div className="flex items-center gap-2 select-none bg-white/45 backdrop-blur-sm border-3 border-black px-3.5 py-1.5 rounded-full shadow-neo-sm rotate-[-1deg] hidden sm:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hmif_logo.png" alt="HMIF Logo" className="w-6 h-6 object-contain" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kabinet_logo.png" alt="Cabinet Logo" className="w-6 h-6 object-contain" />
          <span className="text-[10px] font-lexend font-black text-black tracking-widest uppercase ml-1">KABINET ASTRAVIA</span>
        </div>

        {isAdmin() ? (
          <span className="bg-[#FF006E] text-white font-lexend font-black text-xs uppercase px-3 py-1.5 border-3 border-black rounded-lg shadow-neo-sm flex items-center gap-1.5 rotate-[2deg]">
            <UserCheck className="w-3.5 h-3.5" />
            Mode Admin (Melihat Semua)
          </span>
        ) : (
          <div className="w-10 h-10 hidden sm:block"></div>
        )}
      </div>

      {/* ----------------------------------------------------
          UNBOXING ENVELOPE STAGE (Closed or Opening)
          ---------------------------------------------------- */}
      {envelopeState !== "open" && (
        <div className="flex-grow flex flex-col items-center justify-center p-4 z-10 min-h-[70vh]">
          <h2 className="font-lilita text-3xl md:text-4xl text-black uppercase tracking-tight text-center mb-6 drop-shadow-[2px_2px_0px_#fff]">
            Surat Untuk {member.nama}
          </h2>

          <div className="relative w-full max-w-lg aspect-[5/3] bg-[#E0D8C8] border-4 border-black rounded-xl shadow-neo-lg flex items-center justify-center overflow-hidden">
            {/* Pattern/Lines on Envelope base */}
            <div className="absolute inset-0 bg-[#E0D8C8] overlay-polka-dot opacity-40"></div>
            
            {/* Retro Border Diagonal Strip */}
            <div className="absolute inset-x-0 top-0 h-4 bg-repeat-x" style={{ backgroundImage: "repeating-linear-gradient(45deg, #FF6B6B 0px, #FF6B6B 10px, #FFFDF0 10px, #FFFDF0 20px, #3A86FF 20px, #3A86FF 30px, #FFFDF0 30px, #FFFDF0 40px)" }}></div>
            <div className="absolute inset-x-0 bottom-0 h-4 bg-repeat-x" style={{ backgroundImage: "repeating-linear-gradient(45deg, #FF6B6B 0px, #FF6B6B 10px, #FFFDF0 10px, #FFFDF0 20px, #3A86FF 20px, #3A86FF 30px, #FFFDF0 30px, #FFFDF0 40px)" }}></div>

            {/* Envelope flap animations */}
            <AnimatePresence>
              {envelopeState === "closed" ? (
                // Closed state Wax Seal
                <motion.div 
                  className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
                  onClick={handleOpenEnvelope}
                  whileHover={{ scale: 1.1, rotate: [-1, 1, -1, 0] }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Wax Seal Wax Outer */}
                  <div className="w-16 h-16 bg-[#FF6B6B] border-4 border-black rounded-full shadow-neo-sm flex items-center justify-center relative sticker-shake">
                    {/* Stamp Crown */}
                    <Crown className="w-8 h-8 text-black fill-yellow-400" />
                  </div>
                  <span className="bg-[#FFFDF0] border-2.5 border-black px-2.5 py-0.5 rounded-md text-[10px] font-lexend font-black mt-2 uppercase shadow-neo-sm rotate-[-2deg]">
                    Klik untuk Membuka
                  </span>
                </motion.div>
              ) : (
                // Opening animation state
                <motion.div 
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 0.8, 1.2, 0], rotate: [0, -10, 15, -45] }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  className="absolute z-20 w-16 h-16 bg-[#FF6B6B] border-4 border-black rounded-full flex items-center justify-center"
                >
                  <Crown className="w-8 h-8 text-black fill-yellow-400" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Simulated Envelope Wings/Folds (Brutalism Lines) */}
            <div className="absolute inset-0 border-t-2 border-black/20 pointer-events-none" style={{ clipPath: "polygon(0 0, 50% 50%, 100% 0)" }}></div>
            <div className="absolute inset-0 border-b-2 border-black/20 pointer-events-none" style={{ clipPath: "polygon(0 100%, 50% 50%, 100% 100%)" }}></div>
            <div className="absolute inset-0 border-l-2 border-black/20 pointer-events-none" style={{ clipPath: "polygon(0 0, 50% 50%, 0 100%)" }}></div>
            <div className="absolute inset-0 border-r-2 border-black/20 pointer-events-none" style={{ clipPath: "polygon(100% 0, 50% 50%, 100% 100%)" }}></div>
            
            {/* Visual Flap Opening animation */}
            {envelopeState === "opening" && (
              <motion.div 
                initial={{ transformOrigin: "top", rotateX: 0 }}
                animate={{ rotateX: -180 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-x-0 top-0 h-1/2 bg-[#B8AF9F] border-b-4 border-black z-10"
              />
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          ACTIVE OPEN LETTER STAGE
          ---------------------------------------------------- */}
      {envelopeState === "open" && (
        <div className="max-w-4xl w-full mx-auto px-4 mt-8 z-10 flex flex-col gap-10">
          
          {/* Section 1: Member Card Info */}
          <div className="flex flex-col md:flex-row items-center gap-6 bg-white border-4 border-black p-6 rounded-2xl shadow-neo-md">
            <div className="w-24 h-24 rounded-2xl border-4 border-black bg-white overflow-hidden shadow-neo-sm relative flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={member.foto_url} alt={member.nama} className="w-full h-full object-cover" />
            </div>
            <div className="text-center md:text-left flex-grow">
              <span className={`inline-block text-xs uppercase px-2.5 py-0.5 border-2.5 border-black rounded-md font-bold mb-2 ${badgeClass}`}>
                {member.departemen}
              </span>
              <h2 className="font-lilita text-2xl md:text-3xl text-black leading-none mb-1">{member.nama}</h2>
              <p className="font-lexend font-bold text-gray-500 uppercase text-xs">{member.jabatan} • NIM {member.nim}</p>
            </div>
          </div>

          {/* Section 2: Interactive Letter Canvas */}
          <motion.div 
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="relative flex flex-col md:flex-row gap-4 items-start"
          >
            {/* The Ruled Letter Box */}
            <div className="flex-grow w-full bg-[#FFFDF0] border-4 border-black rounded-2xl shadow-neo-lg overflow-hidden relative">
              {/* Ribbon Rainbow Border on left side */}
              <div className="absolute left-0 inset-y-0 w-3 bg-repeat-y" style={{ backgroundImage: "repeating-linear-gradient(0deg, #FF6B6B 0px, #FF6B6B 10px, #FFFDF0 10px, #FFFDF0 20px, #3A86FF 20px, #3A86FF 30px, #FFFDF0 30px, #FFFDF0 40px)" }}></div>
              
              <div className="pl-8 pr-6 py-6 md:py-8">
                {/* Letter Header */}
                <div className="border-b-2.5 border-dashed border-black/30 pb-4 mb-4 flex justify-between items-center">
                  <h3 className="font-lilita uppercase text-brand-carbon text-lg md:text-xl tracking-tight flex items-center gap-1.5">
                    {activeTab === 'fatir' && <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />}
                    {activeTab === 'aedil' && <Zap className="w-5 h-5 text-blue-500 fill-blue-400" />}
                    {activeTab === 'koor' && <Sparkles className="w-5 h-5 text-pink-500 fill-pink-400" />}
                    Sedikit Pesan Singkat
                  </h3>
                  <span className="font-handwriting font-bold text-xs text-gray-400 select-none">Purwokerto, Juni 2026</span>
                </div>

                {/* Notebook ruled page content area */}
                <div className="ruled-paper font-handwriting text-[#1A1D20] text-base md:text-lg pl-2 leading-[2.25rem] min-h-[14rem] overflow-hidden">
                  <p className="font-bold text-brand-carbon mb-2 text-sm uppercase tracking-wide">
                    {activeTab === "fatir" ? "Dari: Fatir Gibran (Chairman)" : activeTab === "aedil" ? "Dari: Aedil Riski Ansyah (Vice Chairman)" : `Dari: ${koorName ? `${koorName} (Koordinator Departemen)` : `Koordinator Departemen ${member.departemen.split(' & ')[0]}`}`}
                  </p>
                  
                  {/* Dynamic letter body content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-pre-wrap leading-relaxed py-1"
                    >
                      {getTabMessage()}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="border-t-2.5 border-dashed border-black/30 pt-4 mt-6 flex justify-between items-center text-xs font-handwriting font-bold text-gray-500">
                  <span>Salam Hangat, HMIF 2026</span>
                  <span className="px-2 py-0.5 bg-black text-white text-[10px] uppercase font-lexend rounded">Rahasia</span>
                </div>
              </div>
            </div>

            {/* Neon Funky Index Tabs (Right Side navigation) */}
            <div className="flex md:flex-col flex-row gap-2 w-full md:w-auto relative z-10">
              
              {/* Tab 1: Fatir (Chairman) */}
              {showFatirTab && (
              <button
                onClick={() => setActiveTab("fatir")}
                className={`flex-1 md:flex-none py-2.5 md:py-4 px-3 border-3 border-black rounded-xl font-lilita text-xs md:text-sm uppercase tracking-wider text-black flex items-center justify-center md:justify-start gap-1.5 cursor-pointer shadow-neo-sm rotate-[1deg] transition-all
                  ${activeTab === "fatir" ? "bg-[#FF6B6B] translate-x-1 shadow-none" : "bg-white hover:bg-gray-50"}
                `}
              >
                <Crown className="w-4 h-4 fill-yellow-400" />
                <span>FATIR</span>
              </button>
              )}

              {/* Tab 2: Aedil (Vice Chairman) */}
              {showAedilTab && (
              <button
                onClick={() => setActiveTab("aedil")}
                className={`flex-1 md:flex-none py-2.5 md:py-4 px-3 border-3 border-black rounded-xl font-lilita text-xs md:text-sm uppercase tracking-wider text-black flex items-center justify-center md:justify-start gap-1.5 cursor-pointer shadow-neo-sm rotate-[-1deg] transition-all
                  ${activeTab === "aedil" ? "bg-[#3A86FF] text-white translate-x-1 shadow-none" : "bg-white hover:bg-gray-50"}
                `}
              >
                <Zap className="w-4 h-4 fill-yellow-300 text-yellow-400" />
                <span>AEDIL</span>
              </button>
              )}

              {/* Tab 3: Coordinator */}
              {showKoorTab && (
              <button
                onClick={() => setActiveTab("koor")}
                className={`flex-1 md:flex-none py-2.5 md:py-4 px-3 border-3 border-black rounded-xl font-lilita text-xs md:text-sm uppercase tracking-wider text-black flex items-center justify-center md:justify-start gap-1.5 cursor-pointer shadow-neo-sm rotate-[2deg] transition-all
                  ${activeTab === "koor" ? "translate-x-1 shadow-none" : "bg-white hover:bg-gray-50"}
                `}
                style={{ backgroundColor: activeTab === "koor" ? deptColor : '#FFFFFF', color: activeTab === "koor" ? (activeTab === "koor" && (member.departemen === "Talent Development & Innovation" || member.departemen === "Finance & Enterprise Development" || member.departemen === "Creative Content & Outreach" || member.departemen === "External Relations & Advocacy") ? '#FFFFFF' : '#1A1D20') : '#1A1D20' }}
              >
                <Sparkles className="w-4 h-4" />
                <span>{koorName ? koorName.split(' ')[0].toUpperCase() : "KOOR"}</span>
              </button>
              )}
            </div>
          </motion.div>

          {/* Section 3: Photobox Frame "Gen-Z Style" Generator */}
          <div className="bg-[#FFFDF0] border-4 border-black p-6 rounded-2xl shadow-neo-lg">
            <div className="flex items-center gap-2 mb-6">
              <ImageIcon className="w-6 h-6 text-[#FF006E]" />
              <h3 className="font-lilita uppercase text-xl text-black">Photobox Frame Generator (Siap Cetak)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Photobox Settings Panel */}
              <div className="space-y-4 font-lexend">
                <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                  Bikin photobox polaroid digital Anda sendiri! Kustomisasi grid, label teks, emticon/emoji, pilih tema bingkai, lalu unduh PDF cetak kualitas tinggi.
                </p>

                {/* 1. Choose Grid Layout (5 Varian) */}
                <div>
                  <label className="block font-bold text-xs uppercase text-gray-700 mb-1.5">1. Pilih Tata Letak Grid (5 Varian)</label>
                  <select
                    value={photoboxLayout}
                    onChange={(e) => setPhotoboxLayout(e.target.value)}
                    className="w-full px-3 py-2 border-2.5 border-black rounded-lg text-xs font-bold text-black bg-white focus:outline-none focus:ring-3 focus:ring-[#FF006E]/30 cursor-pointer"
                  >
                    <option value="vertical_strip">Classic Strip (Vertikal 1x4)</option>
                    <option value="classic_polaroid">Classic Polaroid (Single Frame)</option>
                    <option value="double_stack">Double Stack (Vertikal 1x2)</option>
                    <option value="trio_strip">Trio Strip (Vertikal 1x3)</option>
                    <option value="asymmetric_collage">Asymmetric Collage (Artistik Miring)</option>
                  </select>
                </div>

                {/* 2. Choose Font style */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-xs uppercase text-gray-700 mb-1.5">2. Pilih Gaya Huruf</label>
                    <select
                      value={photoboxFont}
                      onChange={(e) => setPhotoboxFont(e.target.value)}
                      className="w-full px-3 py-2 border-2.5 border-black rounded-lg text-xs text-black bg-white focus:outline-none focus:ring-3 focus:ring-[#FF006E]/30 cursor-pointer"
                    >
                      <option value="handwriting">Handwriting (Tulis Tangan)</option>
                      <option value="lexend">Sleek Lexend (Modern)</option>
                      <option value="lilita">Lilita One (Pop Retro)</option>
                      <option value="mono">Space Mono (Tech)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-xs uppercase text-gray-700 mb-1.5">Badge Header Atas</label>
                    <input 
                      type="text" 
                      value={customBadge}
                      onChange={(e) => setCustomBadge(e.target.value.toUpperCase())}
                      maxLength={20}
                      className="w-full px-3 py-1.5 border-2.5 border-black rounded-lg text-xs font-bold text-black focus:outline-none focus:ring-3 focus:ring-[#FF006E]/30 bg-white"
                      placeholder="APRESIASI 2026"
                    />
                  </div>
                </div>

                {/* 3. Slot Title Overrides */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-xs uppercase text-gray-700 mb-1">Judul Kartu 2 (Badge)</label>
                    <input 
                      type="text" 
                      value={customBadgeText}
                      onChange={(e) => setCustomBadgeText(e.target.value)}
                      maxLength={18}
                      className="w-full px-3 py-1.5 border-2.5 border-black rounded-lg text-xs text-black focus:outline-none focus:ring-3 focus:ring-[#FF006E]/30 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-xs uppercase text-gray-700 mb-1">Judul Kartu 3 (Quotes)</label>
                    <input 
                      type="text" 
                      value={customQuoteTitle}
                      onChange={(e) => setCustomQuoteTitle(e.target.value)}
                      maxLength={18}
                      className="w-full px-3 py-1.5 border-2.5 border-black rounded-lg text-xs text-black focus:outline-none focus:ring-3 focus:ring-[#FF006E]/30 bg-white"
                    />
                  </div>
                </div>

                {/* 4. Text Customizations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-xs uppercase text-gray-700 mb-1">Isi Quotes Apresiasi</label>
                    <input 
                      type="text" 
                      value={customQuote}
                      onChange={(e) => setCustomQuote(e.target.value)}
                      maxLength={45}
                      className="w-full px-3 py-1.5 border-2.5 border-black rounded-lg text-xs text-black focus:outline-none focus:ring-3 focus:ring-[#FF006E]/30 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-xs uppercase text-gray-700 mb-1">Sub-judul Kustom (Opsional)</label>
                    <input 
                      type="text" 
                      value={customSubtitleText}
                      onChange={(e) => setCustomSubtitleText(e.target.value)}
                      placeholder={`Departemen ${member.departemen === "Executive Board" ? "EB" : member.departemen.split(" & ")[0]}`}
                      className="w-full px-3 py-1.5 border-2.5 border-black rounded-lg text-xs text-black focus:outline-none focus:ring-3 focus:ring-[#FF006E]/30 bg-white"
                    />
                  </div>
                </div>

                {/* 5. Emoticons/Stickers Customization with Custom Text Inputs */}
                <div className="space-y-2.5 p-3 bg-white border-2 border-black rounded-lg shadow-neo-sm">
                  <span className="block font-black text-xs uppercase text-black border-b pb-1">🎨 Kustomisasi Stiker & Emoticon</span>
                  
                  {/* Slot 1 Emoji (Floating on Photo) */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-700 w-20 flex-shrink-0">Foto Sticker:</span>
                    <select
                      value={slot1Emoji}
                      onChange={(e) => { setSlot1Emoji(e.target.value); setSlot1EmojiInput(""); }}
                      className="flex-grow px-2 py-1 border-2 border-black rounded-md text-xs text-black bg-white cursor-pointer"
                    >
                      <option value="⭐">⭐ Bintang</option>
                      <option value="👑">👑 Mahkota</option>
                      <option value="❤️">❤️ Cinta</option>
                      <option value="🔥">🔥 Hot</option>
                      <option value="😎">😎 Keren</option>
                      <option value="✨">✨ Kilau</option>
                      <option value="🍀">🍀 Beruntung</option>
                      <option value="none">Kosong</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Ketik sendiri"
                      value={slot1EmojiInput}
                      onChange={(e) => { setSlot1EmojiInput(e.target.value); if(e.target.value) setSlot1Emoji("custom"); }}
                      className="w-24 px-2 py-1 border-2 border-black rounded-md text-xs text-black"
                    />
                  </div>

                  {/* Slot 2 Emoji */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-700 w-20 flex-shrink-0">Stiker Kartu 2:</span>
                    <select
                      value={slot2Emoji}
                      onChange={(e) => { setSlot2Emoji(e.target.value); setSlot2EmojiInput(""); }}
                      className="flex-grow px-2 py-1 border-2 border-black rounded-md text-xs text-black bg-white cursor-pointer"
                    >
                      <option value="❤️">❤️ Love</option>
                      <option value="✨">✨ Sparkles</option>
                      <option value="👑">👑 Crown</option>
                      <option value="🔥">🔥 Fire</option>
                      <option value="😎">😎 Cool</option>
                      <option value="🚀">🚀 Rocket</option>
                      <option value="👾">👾 Game</option>
                      <option value="🎉">🎉 Party</option>
                      <option value="⭐">⭐ Star</option>
                      <option value="🍀">🍀 Clover</option>
                      <option value="🐱">🐱 Cat</option>
                      <option value="💡">💡 Idea</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Ketik sendiri"
                      value={slot2EmojiInput}
                      onChange={(e) => { setSlot2EmojiInput(e.target.value); if(e.target.value) setSlot2Emoji("custom"); }}
                      className="w-24 px-2 py-1 border-2 border-black rounded-md text-xs text-black"
                    />
                  </div>

                  {/* Slot 3 Emoji */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-700 w-20 flex-shrink-0">Stiker Kartu 3:</span>
                    <select
                      value={slot3Emoji}
                      onChange={(e) => { setSlot3Emoji(e.target.value); setSlot3EmojiInput(""); }}
                      className="flex-grow px-2 py-1 border-2 border-black rounded-md text-xs text-black bg-white cursor-pointer"
                    >
                      <option value="✨">✨ Sparkles</option>
                      <option value="❤️">❤️ Love</option>
                      <option value="👑">👑 Crown</option>
                      <option value="🔥">🔥 Fire</option>
                      <option value="😎">😎 Cool</option>
                      <option value="🚀">🚀 Rocket</option>
                      <option value="👾">👾 Game</option>
                      <option value="🎉">🎉 Party</option>
                      <option value="⭐">⭐ Star</option>
                      <option value="🍀">🍀 Clover</option>
                      <option value="💡">💡 Idea</option>
                      <option value="💬">💬 Chat</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Ketik sendiri"
                      value={slot3EmojiInput}
                      onChange={(e) => { setSlot3EmojiInput(e.target.value); if(e.target.value) setSlot3Emoji("custom"); }}
                      className="w-24 px-2 py-1 border-2 border-black rounded-md text-xs text-black"
                    />
                  </div>
                </div>

                {/* 6. Pilih Foto Photobox */}
                <div>
                  <label className="block font-bold text-xs uppercase text-gray-700 mb-1.5">6. Pilih Foto Photobox</label>
                  <select
                    value={photoSource}
                    onChange={(e) => setPhotoSource(e.target.value)}
                    className="w-full px-3 py-2 border-2.5 border-black rounded-lg text-xs text-black bg-white focus:outline-none focus:ring-3 focus:ring-[#FF006E]/30 cursor-pointer mb-4"
                  >
                    <option value="profile">Foto Profil Anggota</option>
                    <option value="kabinet">Foto Bersama Kabinet</option>
                    <option value="departemen">Foto Departemen ({member?.departemen === "Executive Board" ? "EB" : member?.departemen.split(" & ")[0]})</option>
                  </select>
                </div>

                {/* 6.5. Filter Foto & Stempel Prestasi */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block font-bold text-xs uppercase text-gray-700 mb-1.5">Pilih Filter Foto</label>
                    <select
                      value={photoFilter}
                      onChange={(e) => setPhotoFilter(e.target.value)}
                      className="w-full px-3 py-2 border-2.5 border-black rounded-lg text-xs text-black bg-white focus:outline-none focus:ring-3 focus:ring-[#FF006E]/30 cursor-pointer"
                    >
                      <option value="normal">Normal (Asli)</option>
                      <option value="grayscale">Grayscale (B&W)</option>
                      <option value="sepia">Sepia (Retro Hangat)</option>
                      <option value="cool">Cool Cyan (Y2K Tint)</option>
                      <option value="vivid">Vivid (Warna Tajam)</option>
                      <option value="vhs">Vintage VHS (Pudar)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-xs uppercase text-gray-700 mb-1.5">Stempel Prestasi</label>
                    <label className="flex items-center gap-2 px-3 py-2 border-2.5 border-black rounded-lg text-xs text-black bg-white focus:outline-none focus:ring-3 focus:ring-[#FF006E]/30 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showStampsOverlay}
                        onChange={(e) => setShowStampsOverlay(e.target.checked)}
                        className="w-4 h-4 cursor-pointer accent-[#FFBE0B]"
                      />
                      <span>Tampilkan</span>
                    </label>
                  </div>
                </div>

                {/* 7. Theme Color Select */}
                <div>
                  <label className="block font-bold text-xs uppercase text-gray-700 mb-2">7. Pilih Skema Bingkai & Tema</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: "y2k", label: "Y2K Cyber", class: "bg-y2k-cyber text-white" },
                      { key: "checker", label: "Retro Chess Pink", class: "bg-checkerboard-color text-white" },
                      { key: "checker_mono", label: "Retro Chess BW", class: "bg-checkerboard text-black border border-black" },
                      { key: "pastel", label: "Pastel", class: "bg-[#e0e7ff] text-indigo-900" },
                      { key: "holo", label: "Aura Holo", class: "bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 text-purple-950" },
                      { key: "comic", label: "Comic Yellow", class: "bg-[#FFBE0B] text-black" },
                      { key: "comic_mint", label: "Comic Mint", class: "bg-[#06D6A0] text-black" },
                      { key: "vintage", label: "Vintage Cream", class: "bg-[#F5EBE0] text-amber-950" },
                      { key: "vintage_kraft", label: "Vintage Kraft", class: "bg-[#D0B49F] text-amber-950" },
                      { key: "synthwave", label: "Synthwave Dream", class: "bg-gradient-to-br from-[#1d0a34] via-[#5d0e41] to-[#e4007f] text-white" },
                      { key: "grunge", label: "Cyber Grunge", class: "bg-[#16191e] text-[#39ff14] border border-[#39ff14]/30" },
                      { key: "stripes", label: "Lollipop Stripes", class: "bg-[#ffd6ff] text-indigo-950" },
                      { key: "polaroid", label: "Classic Polaroid", class: "bg-[#f4f3ef] text-black border border-gray-300" }
                    ].map((theme) => (
                      <button
                        key={theme.key}
                        onClick={() => setFrameTemplate(theme.key)}
                        type="button"
                        className={`p-2 py-2.5 rounded-lg border-2 border-black font-lexend font-bold text-[9px] uppercase tracking-wide cursor-pointer text-center relative transition-all duration-150 active:scale-95
                          ${theme.class}
                          ${frameTemplate === theme.key ? "ring-3 ring-black/45 scale-[1.03]" : "opacity-80 hover:opacity-100"}
                        `}
                      >
                        {theme.label}
                        {frameTemplate === theme.key && (
                          <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-black rounded-full border border-white flex items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Download PDF Button */}
                <div className="pt-2">
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="w-full bg-[#06D6A0] hover:bg-[#05bb8c] text-black font-lexend font-black py-3 border-3 border-black rounded-xl shadow-neo-md text-base flex items-center justify-center gap-2 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                    {isExporting ? "Membuat PDF..." : "Unduh PDF Photobox (Siap Cetak)"}
                  </button>
                  <span className="block text-center text-[10px] text-gray-400 mt-2">
                    Resolusi cetak 300 DPI, dioptimalkan otomatis menyesuaikan tata letak.
                  </span>
                </div>
              </div>

              {/* Photobox Preview Node */}
              <div className="flex justify-center items-center w-full overflow-x-auto bg-gray-800 p-4 border-3 border-black rounded-2xl shadow-inner">
                <div className="origin-center transition-all duration-300">
                  
                  {/* High resolution element exported by html2canvas */}
                  <div 
                    ref={photoboxRef}
                    id="photobox-strip"
                    className={`py-6 px-4 flex flex-col items-center gap-4 border-4 border-black mx-auto relative overflow-hidden select-none transition-all duration-300
                      ${getFrameBgClass()}
                      ${getPhotoboxWidthClass()}
                    `}
                    style={{ minHeight: photoboxLayout === "asymmetric_collage" ? "520px" : "auto" }}
                  >
                    {/* Background Pattern Overlays */}
                    {getPhotoboxPattern()}
                    
                    {/* Retro Stamp */}
                    {photoboxLayout !== "classic_polaroid" && photoboxLayout !== "double_stack" && (
                      <div className="bg-black text-white font-lilita text-[10px] px-2.5 py-0.5 border-1.5 border-white rounded uppercase transform rotate-[4deg] shadow-sm select-none z-10">
                        {customBadge || "APRESIASI 2026"}
                      </div>
                    )}

                    {/* Dynamic Layout Rendering */}
                    {photoboxLayout === "vertical_strip" && (
                      <div className="flex flex-col items-center gap-4 relative z-10">
                        {renderPhotoSlot("rotate-[-2deg]")}
                        {renderDepartmentPhotoSlot("rotate-[1.5deg]")}
                        {renderCabinetPhotoSlot("rotate-[-1deg]")}
                        {renderWatermarkSlot()}
                      </div>
                    )}

                    {photoboxLayout === "trio_strip" && (
                      <div className="flex flex-col items-center gap-4 relative z-10">
                        {renderPhotoSlot("rotate-[-1deg]")}
                        {renderCabinetPhotoSlot("rotate-[1.5deg]")}
                        {renderWatermarkSlot()}
                      </div>
                    )}

                    {photoboxLayout === "double_stack" && (
                      <div className="flex flex-col items-center gap-4 relative z-10">
                        {renderPhotoSlot("rotate-[-1.5deg]")}
                        {renderDepartmentPhotoSlot("rotate-[1.5deg]")}
                        {renderWatermarkSlot()}
                      </div>
                    )}

                    {photoboxLayout === "classic_polaroid" && (
                      <div className={`w-[210px] p-3 border-3 flex flex-col justify-between items-center shadow-lg rounded-sm relative z-10 ${getSlotBgClass()}`}>
                        {/* Top Photo */}
                        <div className={`w-full aspect-square border border-black overflow-hidden relative ${photoSource !== 'profile' ? 'bg-white' : 'bg-gray-100'}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={getPhotoboxPhotoUrl()} 
                            alt="photobox-avatar" 
                            className={`w-full h-full ${photoSource !== 'profile' ? 'object-contain' : 'object-cover'}`} 
                            style={{ filter: getFilterStyle() }}
                          />
                          {slot1Emoji && slot1Emoji !== "none" && (
                            <div className="absolute top-1 right-1 bg-white/80 border border-black rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-sm select-none">
                              {slot1Emoji === "custom" ? slot1EmojiInput : slot1Emoji}
                            </div>
                          )}
                          {photoSource === "profile" && renderSlotStamps(member.stamps)}
                        </div>
                        {/* bottom text area */}
                        <div className="w-full text-center mt-3 pt-3 border-t-2 border-dashed border-black/15 flex flex-col gap-2">
                          <h4 className={`${getFontClass()} font-lilita text-xs leading-none`}>{member.nama}</h4>
                          <span className="text-[7.5px] font-lexend font-black uppercase text-gray-500 tracking-wider">
                            {customBadgeText} • {customSubtitleText || `DEPT ${member.departemen === "Executive Board" ? "EB" : member.departemen.split(" & ")[0].toUpperCase()}`}
                          </span>
                          <p className={`${getFontClass()} text-[9px] leading-snug italic text-gray-600 px-1 border-t border-black/5 pt-1.5`}>
                            &ldquo;{customQuote || "Semangat selalu!"}&rdquo;
                          </p>
                          {renderWatermarkSlot("scale-90 border-0 p-0 shadow-none mt-1", true)}
                        </div>
                      </div>
                    )}

                    {photoboxLayout === "asymmetric_collage" && (
                      <div className="w-[300px] h-[480px] relative z-10">
                        <div className="absolute top-2 left-2 z-10">
                          {renderPhotoSlot("rotate-[-3deg] shadow-lg")}
                        </div>
                        <div className="absolute top-[180px] right-2 z-20">
                          {renderBadgeSlot("rotate-[4deg] scale-[0.9] shadow-lg")}
                        </div>
                        <div className="absolute top-[280px] left-2 z-30">
                          {renderQuoteSlot("rotate-[-2deg] scale-[0.9] shadow-lg")}
                        </div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40">
                          {renderWatermarkSlot("rotate-[1deg] scale-[0.95]")}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 3.5: Lembar Cetak Surat Apresiasi (Souvenir Cetak) */}
          <div className="bg-[#FFFDF0] border-4 border-black p-6 rounded-2xl shadow-neo-lg animate-in fade-in slide-in-from-bottom-6 duration-300">
            <div className="flex items-center gap-2 mb-6 border-b-2.5 border-black/10 pb-3">
              <Sparkles className="w-6 h-6 text-[#3A86FF] fill-[#3A86FF]" />
              <h3 className="font-lilita uppercase text-xl text-black">Cetak Souvenir Surat Apresiasi</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Settings Panel */}
              <div className="lg:col-span-1 space-y-5">
                <p className="text-xs font-lexend text-gray-600 font-semibold leading-relaxed bg-white border-2 border-black p-3 rounded-lg shadow-neo-sm">
                  🎨 Kustomisasi tampilan surat evaluasi kepengurusan Anda! Pilih tata letak grid, skema warna tema, lalu unduh PDF resolusi tinggi siap cetak sebagai kenang-kenangan.
                </p>

                {/* Layout Selector */}
                <div>
                  <label className="block font-lexend font-bold text-xs uppercase text-gray-700 mb-2">Pilih Tata Letak (8 Grid)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "grid", label: "Multi Kolom" },
                      { key: "vertical", label: "Tumpuk Vertikal" },
                      { key: "bulletin", label: "Mading Pinned" },
                      { key: "single", label: "Fokus Tunggal" },
                      { key: "timeline", label: "Aliran Timeline" },
                      { key: "bento", label: "Brutalist Bento" },
                      { key: "scrapbook", label: "Scrapbook Collage" },
                      { key: "greeting", label: "Greeting Card" }
                    ].map((lay) => (
                      <button
                        key={lay.key}
                        onClick={() => setPrintLayout(lay.key)}
                        type="button"
                        className={`p-2 py-2.5 rounded-lg border-2 border-black font-lexend font-bold text-[10px] uppercase cursor-pointer text-center transition-all duration-150 active:scale-95
                          ${printLayout === lay.key ? "bg-[#3A86FF] text-white shadow-neo-sm -translate-y-0.5" : "bg-white hover:bg-gray-50 text-black shadow-none"}
                        `}
                      >
                        {lay.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="block font-lexend font-bold text-xs uppercase text-gray-700 mb-2">Pilih Tema Visual (8 Tema)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "cream",     label: "Classic Cream",    cls: "bg-[#FAF7F0] text-black" },
                      { key: "pastel",    label: "Soft Pastel",      cls: "bg-gradient-to-r from-indigo-200 to-pink-200 text-purple-950" },
                      { key: "carbon",    label: "Dark Carbon",      cls: "bg-[#1E293B] text-white" },
                      { key: "neon",      label: "Neon Pop",         cls: "bg-[#FF006E] text-white" },
                      { key: "kraft",     label: "Kraft Paper Lines",cls: "bg-[#C9A96E] text-amber-950" },
                      { key: "blueprint", label: "Blueprint Grid",   cls: "bg-[#1a3a5c] text-blue-100" },
                      { key: "lined",     label: "Lined Notebook",   cls: "bg-white text-gray-800 border border-blue-300" },
                      { key: "newspaper", label: "Newspaper Print",  cls: "bg-[#F5F0E8] text-gray-900" }
                    ].map((th) => (
                      <button
                        key={th.key}
                        onClick={() => setPrintTheme(th.key)}
                        type="button"
                        className={`p-2.5 rounded-lg border-2 border-black font-lexend font-bold text-[9px] uppercase cursor-pointer text-center transition-all duration-150 active:scale-95 ${th.cls}
                          ${printTheme === th.key ? "ring-2 ring-black scale-[1.03] shadow-neo-sm" : "opacity-80 hover:opacity-100"}
                        `}
                      >
                        {th.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Button */}
                <div className="pt-2">
                  <button
                    onClick={handleExportLetterPDF}
                    disabled={isExportingLetter}
                    className="w-full bg-[#06D6A0] hover:bg-[#05bb8c] text-black font-lexend font-black py-4 border-3 border-black rounded-xl shadow-neo-md text-base flex items-center justify-center gap-2 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                    {isExportingLetter ? "Memproses PDF..." : "Unduh PDF Surat Cetak"}
                  </button>
                  <span className="block text-center text-[10px] font-lexend text-gray-400 mt-2">
                    Lembar dioptimalkan otomatis untuk ukuran kertas standar A4.
                  </span>
                </div>
              </div>

              {/* Live Preview Panel */}
              <div className="lg:col-span-2 flex justify-center items-center bg-gray-800 p-6 rounded-2xl border-3 border-black max-w-full overflow-x-auto shadow-inner">
                <div className="min-w-[500px] md:min-w-[620px] max-w-full scale-75 md:scale-90 lg:scale-[0.85] origin-center transition-all duration-300">
                  
                  {/* Target element for html2canvas */}
                  <div 
                    ref={letterPrintRef}
                    id="letter-souvenir-card"
                    className={`w-[640px] p-8 border-4 border-black relative select-none rounded-sm overflow-hidden flex flex-col justify-between transition-all duration-300
                      ${getPrintThemeClass()}
                    `}
                    style={{ minHeight: "480px" }}
                  >
                    {/* Texture/pattern overlay for paper-texture themes – always behind content */}
                    {getPrintThemePattern()}
                    {/* Content wrapper – positioned above the pattern */}
                    <div className="relative z-10 flex flex-col flex-grow justify-between">
                    <div className="flex justify-between items-center border-b-3 border-black/20 pb-4 mb-6">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/hmif_logo.png" alt="HMIF Logo" className="w-12 h-12 object-contain" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/kabinet_logo.png" alt="Kabinet Logo" className="w-12 h-12 object-contain" />
                        <div className="pl-1">
                          <h4 className="font-lilita text-base tracking-wide leading-none">LEMBAR APRESIASI ANGGOTA</h4>
                          <p className="text-[8px] font-lexend font-black text-gray-400 uppercase tracking-widest mt-1">KABINET ASTRAVIA • HMIF 2026</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-handwriting font-bold text-xs text-gray-500">Purwokerto, Juni 2026</span>
                      </div>
                    </div>

                    {/* Member Profile Info */}
                    <div className="flex items-center gap-4 mb-6 bg-white/10 p-3 rounded-lg border-2 border-dashed border-black/10">
                      <div className="w-12 h-12 rounded-full border-2 border-black overflow-hidden bg-white shadow-sm flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={member.foto_url} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-lilita text-lg leading-none">{member.nama}</h4>
                        <p className="text-[9px] font-lexend font-bold text-gray-500 uppercase mt-1">{member.jabatan} • {member.departemen}</p>
                      </div>
                    </div>

                    {/* Content Section: Dynamic Grid layouts */}
                    <div className="flex-grow flex flex-col justify-center mb-6">
                      
                      {/* Layout 1: Grid (Multi-Column) */}
                      {printLayout === 'grid' && (
                        <div className={`grid grid-cols-1 md:grid-cols-${showKoorTab ? 3 : 2} gap-4`}>
                          {/* Fatir (Chairman) Column */}
                          {showFatirTab && (
                            <div className={`p-4 border-2 border-black rounded-lg shadow-sm relative flex flex-col justify-between ${getPrintCardBgClass()}`}>
                              <span className="absolute -top-2 left-4 px-2 py-0.5 bg-[#FF6B6B] border border-black font-lilita text-[8px] text-black rounded uppercase shadow-sm">Chairman</span>
                              <div className="font-handwriting text-xs leading-relaxed italic mt-2 whitespace-pre-wrap min-h-[100px]">
                                &ldquo;{member.pesan_fatir || "Belum ada pesan evaluasi."}&rdquo;
                              </div>
                              <div className="text-[8px] font-lexend font-bold text-right text-gray-400 mt-2 border-t border-black/5 pt-1">Dari: Fatir Gibran</div>
                            </div>
                          )}

                          {/* Aedil (Vice Chairman) Column */}
                          {showAedilTab && (
                            <div className={`p-4 border-2 border-black rounded-lg shadow-sm relative flex flex-col justify-between ${getPrintCardBgClass()}`}>
                              <span className="absolute -top-2 left-4 px-2 py-0.5 bg-[#3A86FF] border border-black font-lilita text-[8px] text-white rounded uppercase shadow-sm">Vice Chairman</span>
                              <div className="font-handwriting text-xs leading-relaxed italic mt-2 whitespace-pre-wrap min-h-[100px]">
                                &ldquo;{member.pesan_aedil || "Belum ada pesan evaluasi."}&rdquo;
                              </div>
                              <div className="text-[8px] font-lexend font-bold text-right text-gray-400 mt-2 border-t border-black/5 pt-1">Dari: Aedil Riski</div>
                            </div>
                          )}

                          {/* Koor Column */}
                          {showKoorTab && (
                            <div className={`p-4 border-2 border-black rounded-lg shadow-sm relative flex flex-col justify-between ${getPrintCardBgClass()}`}>
                              <span className="absolute -top-2 left-4 px-2 py-0.5 bg-[#FFBE0B] border border-black font-lilita text-[8px] text-black rounded uppercase shadow-sm">{koorName ? koorName.split(' ')[0] : "Koor"}</span>
                              <div className="font-handwriting text-xs leading-relaxed italic mt-2 whitespace-pre-wrap min-h-[100px]">
                                &ldquo;{member.pesan_koor || "Belum ada pesan evaluasi."}&rdquo;
                              </div>
                              <div className="text-[8px] font-lexend font-bold text-right text-gray-400 mt-2 border-t border-black/5 pt-1">Dari: {koorName || "Koordinator"}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Layout 2: Vertical Stack */}
                      {printLayout === 'vertical' && (
                        <div className="space-y-4">
                          {showFatirTab && (
                            <div className={`p-4 border-2 border-black rounded-lg ${getPrintCardBgClass()}`}>
                              <span className="font-lilita text-[10px] text-[#FF6B6B] uppercase tracking-wide">Dari: Fatir Gibran (Chairman)</span>
                              <p className="font-handwriting text-xs leading-relaxed italic mt-1.5 whitespace-pre-wrap">&ldquo;{member.pesan_fatir}&rdquo;</p>
                            </div>
                          )}
                          {showAedilTab && (
                            <div className={`p-4 border-2 border-black rounded-lg ${getPrintCardBgClass()}`}>
                              <span className="font-lilita text-[10px] text-[#3A86FF] uppercase tracking-wide">Dari: Aedil Riski Ansyah (Vice Chairman)</span>
                              <p className="font-handwriting text-xs leading-relaxed italic mt-1.5 whitespace-pre-wrap">&ldquo;{member.pesan_aedil}&rdquo;</p>
                            </div>
                          )}
                          {showKoorTab && (
                            <div className={`p-4 border-2 border-black rounded-lg ${getPrintCardBgClass()}`}>
                              <span className="font-lilita text-[10px] text-[#FFBE0B] uppercase tracking-wide">Dari: {koorName || "Koordinator"}</span>
                              <p className="font-handwriting text-xs leading-relaxed italic mt-1.5 whitespace-pre-wrap">&ldquo;{member.pesan_koor}&rdquo;</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Layout 3: Pinned corkboard bulletin layout */}
                      {printLayout === 'bulletin' && (
                        <div className="bg-[#D7CCC8] p-4 border-3 border-amber-950/20 rounded-xl shadow-inner min-h-[240px] flex flex-wrap gap-4 items-center justify-center relative">
                          {/* Cork background overlay pattern */}
                          <div className="absolute inset-0 opacity-20 bg-repeat bg-[radial-gradient(circle_at_center,black_1.5px,transparent_1px)] bg-[length:12px_12px] pointer-events-none"></div>

                          {showFatirTab && (
                            <div className="w-[170px] bg-[#FFF9C4] text-black border-2 border-black p-3 rounded-sm shadow-md rotate-[-2deg] relative flex flex-col justify-between min-h-[140px]">
                              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-sm pointer-events-none">📌</span>
                              <h5 className="font-lilita text-[9px] text-[#FF6B6B] uppercase leading-none border-b border-black/10 pb-1">Chairman</h5>
                              <p className="font-handwriting text-[9px] leading-snug italic mt-1.5 whitespace-pre-wrap line-clamp-6">&ldquo;{member.pesan_fatir}&rdquo;</p>
                              <p className="font-handwriting text-[8px] text-right font-bold text-gray-500 mt-1 border-t border-black/5 pt-0.5">Fatir Gibran</p>
                            </div>
                          )}

                          {showAedilTab && (
                            <div className="w-[170px] bg-[#E1F5FE] text-black border-2 border-black p-3 rounded-sm shadow-md rotate-[2deg] relative flex flex-col justify-between min-h-[140px]">
                              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-sm pointer-events-none">📌</span>
                              <h5 className="font-lilita text-[9px] text-[#3A86FF] uppercase leading-none border-b border-black/10 pb-1">Vice Chairman</h5>
                              <p className="font-handwriting text-[9px] leading-snug italic mt-1.5 whitespace-pre-wrap line-clamp-6">&ldquo;{member.pesan_aedil}&rdquo;</p>
                              <p className="font-handwriting text-[8px] text-right font-bold text-gray-500 mt-1 border-t border-black/5 pt-0.5">Aedil Riski</p>
                            </div>
                          )}

                          {showKoorTab && (
                            <div className="w-[170px] bg-[#F1F8E9] text-black border-2 border-black p-3 rounded-sm shadow-md rotate-[-1deg] relative flex flex-col justify-between min-h-[140px]">
                              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-sm pointer-events-none">📌</span>
                              <h5 className="font-lilita text-[9px] text-[#81C784] uppercase leading-none border-b border-black/10 pb-1">Koor {member.departemen === "Executive Board" ? "EB" : member.departemen.split(" & ")[0]}</h5>
                              <p className="font-handwriting text-[9px] leading-snug italic mt-1.5 whitespace-pre-wrap line-clamp-6">&ldquo;{member.pesan_koor}&rdquo;</p>
                              <p className="font-handwriting text-[8px] text-right font-bold text-gray-500 mt-1 border-t border-black/5 pt-0.5">{koorName ? koorName.split(' ')[0] : "Koor"}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Layout 4: Single focus message card */}
                      {printLayout === 'single' && (
                        <div className={`p-6 border-3 border-black rounded-xl shadow-md relative text-center max-w-md w-full mx-auto ${getPrintCardBgClass()}`}>
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-black text-white font-lilita text-[9px] rounded uppercase border border-white">
                            {activeTab === 'fatir' ? "Pesan Chairman" : activeTab === 'aedil' ? "Pesan Vice Chairman" : "Pesan Koordinator"}
                          </span>
                          
                          <p className="font-handwriting text-sm md:text-base leading-relaxed italic pt-2 whitespace-pre-wrap">
                            &ldquo;{getTabMessage()}&rdquo;
                          </p>

                          <div className="border-t border-black/10 pt-3 mt-4 flex justify-between items-center text-[10px] font-handwriting font-bold text-gray-500">
                            <span>Salam hangat,</span>
                            <span>{activeTab === 'fatir' ? "Fatir Gibran" : activeTab === 'aedil' ? "Aedil Riski Ansyah" : (koorName || "Koordinator")}</span>
                          </div>
                        </div>
                      )}

                      {/* Layout 5: Timeline Flow */}
                      {printLayout === 'timeline' && (
                        <div className="relative pl-6 border-l-3 border-dashed border-black/30 space-y-8 py-2">
                          {showFatirTab && (
                            <div className="relative">
                              {/* Timeline dot */}
                              <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-[#FF6B6B] border-2 border-black rounded-full shadow-sm"></div>
                              <div className={`p-4 border-2 border-black rounded-lg shadow-sm ${getPrintCardBgClass()}`}>
                                <span className="font-lilita text-[10px] text-[#FF6B6B] uppercase tracking-wide">Langkah 1: Amanah dari Chairman</span>
                                <p className="font-handwriting text-xs leading-relaxed italic mt-1 whitespace-pre-wrap">&ldquo;{member.pesan_fatir}&rdquo;</p>
                                <span className="text-[8px] font-lexend font-bold text-gray-400 block mt-1 text-right">— Fatir Gibran</span>
                              </div>
                            </div>
                          )}
                          {showAedilTab && (
                            <div className="relative">
                              {/* Timeline dot */}
                              <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-[#3A86FF] border-2 border-black rounded-full shadow-sm"></div>
                              <div className={`p-4 border-2 border-black rounded-lg shadow-sm ${getPrintCardBgClass()}`}>
                                <span className="font-lilita text-[10px] text-[#3A86FF] uppercase tracking-wide">Langkah 2: Arahan dari Vice Chairman</span>
                                <p className="font-handwriting text-xs leading-relaxed italic mt-1 whitespace-pre-wrap">&ldquo;{member.pesan_aedil}&rdquo;</p>
                                <span className="text-[8px] font-lexend font-bold text-gray-400 block mt-1 text-right">— Aedil Riski</span>
                              </div>
                            </div>
                          )}
                          {showKoorTab && (
                            <div className="relative">
                              {/* Timeline dot */}
                              <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-[#FFBE0B] border-2 border-black rounded-full shadow-sm"></div>
                              <div className={`p-4 border-2 border-black rounded-lg shadow-sm ${getPrintCardBgClass()}`}>
                                <span className="font-lilita text-[10px] text-[#FFBE0B] uppercase tracking-wide">Langkah 3: Bimbingan dari Koor Departemen</span>
                                <p className="font-handwriting text-xs leading-relaxed italic mt-1 whitespace-pre-wrap">&ldquo;{member.pesan_koor}&rdquo;</p>
                                <span className="text-[8px] font-lexend font-bold text-gray-400 block mt-1 text-right">— {koorName || "Koordinator"}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Layout 6: Brutalist Bento */}
                      {printLayout === 'bento' && (
                        <div className="grid grid-cols-6 gap-3">
                          {showFatirTab && (
                            <div className={`col-span-3 p-4 border-2.5 border-black rounded-xl shadow-neo-sm relative flex flex-col justify-between ${getPrintCardBgClass()} min-h-[140px]`}>
                              <h5 className="font-lilita text-[10px] text-[#FF6B6B] uppercase tracking-wider mb-1.5">★ CHAIRMAN WORDS</h5>
                              <p className="font-handwriting text-[11px] leading-relaxed italic whitespace-pre-wrap flex-grow">&ldquo;{member.pesan_fatir}&rdquo;</p>
                              <div className="text-[8px] font-lexend font-bold text-right text-gray-400 mt-2">Fatir Gibran</div>
                            </div>
                          )}
                          {showAedilTab && (
                            <div className={`col-span-3 p-4 border-2.5 border-black rounded-xl shadow-neo-sm relative flex flex-col justify-between ${getPrintCardBgClass()} min-h-[140px]`}>
                              <h5 className="font-lilita text-[10px] text-[#3A86FF] uppercase tracking-wider mb-1.5">⚡ VICE CHAIRMAN WORDS</h5>
                              <p className="font-handwriting text-[11px] leading-relaxed italic whitespace-pre-wrap flex-grow">&ldquo;{member.pesan_aedil}&rdquo;</p>
                              <div className="text-[8px] font-lexend font-bold text-right text-gray-400 mt-2">Aedil Riski</div>
                            </div>
                          )}
                          {showKoorTab && (
                            <div className={`col-span-6 p-4 border-2.5 border-black rounded-xl shadow-neo-sm relative flex flex-col justify-between ${getPrintCardBgClass()} min-h-[100px] mt-1`}>
                              <h5 className="font-lilita text-[10px] text-[#FFBE0B] uppercase tracking-wider mb-1.5">✨ DEPARTMENT FEEDBACK</h5>
                              <p className="font-handwriting text-[11px] leading-relaxed italic whitespace-pre-wrap flex-grow">&ldquo;{member.pesan_koor}&rdquo;</p>
                              <div className="text-[8px] font-lexend font-bold text-right text-gray-400 mt-2">Koor: {koorName || "Koordinator"}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Layout 7: Scrapbook Collage */}
                      {printLayout === 'scrapbook' && (
                        <div className="relative min-h-[260px] flex flex-wrap gap-3 items-start justify-center p-2">
                          {showFatirTab && (
                            <div className={`w-[175px] p-3.5 border-2 border-black shadow-md rotate-[-2.5deg] relative flex flex-col justify-between min-h-[150px] ${getPrintCardBgClass()}`}>
                              {/* Tape strip on top */}
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 bg-amber-200/70 border border-amber-400 opacity-80 rounded-sm"></div>
                              <div>
                                <h5 className="font-lilita text-[9px] text-[#FF6B6B] uppercase leading-none border-b border-black/10 pb-1.5 mb-1.5">Chairman</h5>
                                <p className="font-handwriting text-[9px] leading-snug italic whitespace-pre-wrap line-clamp-6">&ldquo;{member.pesan_fatir}&rdquo;</p>
                              </div>
                              <p className="font-handwriting text-[8px] text-right font-bold text-gray-400 mt-1.5 border-t border-black/5 pt-0.5">— Fatir Gibran</p>
                            </div>
                          )}
                          {showAedilTab && (
                            <div className={`w-[175px] p-3.5 border-2 border-black shadow-md rotate-[2deg] relative flex flex-col justify-between min-h-[150px] mt-4 ${getPrintCardBgClass()}`}>
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 bg-blue-200/70 border border-blue-300 opacity-80 rounded-sm"></div>
                              <div>
                                <h5 className="font-lilita text-[9px] text-[#3A86FF] uppercase leading-none border-b border-black/10 pb-1.5 mb-1.5">Vice Chairman</h5>
                                <p className="font-handwriting text-[9px] leading-snug italic whitespace-pre-wrap line-clamp-6">&ldquo;{member.pesan_aedil}&rdquo;</p>
                              </div>
                              <p className="font-handwriting text-[8px] text-right font-bold text-gray-400 mt-1.5 border-t border-black/5 pt-0.5">— Aedil Riski</p>
                            </div>
                          )}
                          {showKoorTab && (
                            <div className={`w-[175px] p-3.5 border-2 border-black shadow-md rotate-[-1deg] relative flex flex-col justify-between min-h-[130px] ${getPrintCardBgClass()}`}>
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 bg-yellow-200/70 border border-yellow-300 opacity-80 rounded-sm"></div>
                              <div>
                                <h5 className="font-lilita text-[9px] text-[#FFBE0B] uppercase leading-none border-b border-black/10 pb-1.5 mb-1.5">Koor Dept.</h5>
                                <p className="font-handwriting text-[9px] leading-snug italic whitespace-pre-wrap line-clamp-5">&ldquo;{member.pesan_koor}&rdquo;</p>
                              </div>
                              <p className="font-handwriting text-[8px] text-right font-bold text-gray-400 mt-1.5 border-t border-black/5 pt-0.5">— {koorName ? koorName.split(' ')[0] : "Koor"}</p>
                            </div>
                          )}
                          {/* decorative doodle star */}
                          <div className="absolute bottom-2 right-3 text-2xl opacity-30 select-none rotate-12">⭐</div>
                        </div>
                      )}

                      {/* Layout 8: Greeting Card */}
                      {printLayout === 'greeting' && (
                        <div className={`p-6 border-3 border-black rounded-2xl relative shadow-md text-center max-w-lg w-full mx-auto ${getPrintCardBgClass()}`}>
                          <h4 className="font-lilita text-lg uppercase tracking-wider mb-4 border-b-2.5 border-dashed border-black/15 pb-2">Kumpulan Apresiasi & Pesan</h4>
                          
                          <div className="space-y-4 text-left">
                            {showFatirTab && (
                              <div className="pb-3 border-b border-dashed border-black/10">
                                <span className="font-lilita text-[9px] text-red-500 uppercase tracking-wider">Pesan Chairman:</span>
                                <p className="font-handwriting text-xs leading-relaxed italic mt-1 whitespace-pre-wrap">&ldquo;{member.pesan_fatir}&rdquo;</p>
                              </div>
                            )}
                            {showAedilTab && (
                              <div className="pb-3 border-b border-dashed border-black/10">
                                <span className="font-lilita text-[9px] text-blue-500 uppercase tracking-wider">Pesan Vice Chairman:</span>
                                <p className="font-handwriting text-xs leading-relaxed italic mt-1 whitespace-pre-wrap">&ldquo;{member.pesan_aedil}&rdquo;</p>
                              </div>
                            )}
                            {showKoorTab && (
                              <div>
                                <span className="font-lilita text-[9px] text-amber-500 uppercase tracking-wider">Pesan Koordinator ({koorName || "Koor"}):</span>
                                <p className="font-handwriting text-xs leading-relaxed italic mt-1 whitespace-pre-wrap">&ldquo;{member.pesan_koor}&rdquo;</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-[8px] font-lexend font-black text-center text-gray-400 mt-6 border-t border-black/10 pt-2.5 uppercase tracking-widest">
                            Terima kasih atas kontribusimu di HMIF!
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Watermark/Footer */}
                    <div className="border-t border-black/10 pt-4 text-center select-none">
                      <p className="text-[8px] font-lexend font-black text-gray-400 uppercase tracking-widest">
                        HMIF Evaluasi & Apresiasi Kepengurusan © 2026 • KABINET ASTRAVIA
                      </p>
                    </div>{/* /Watermark/Footer */}
                    </div>{/* /relative z-10 content wrapper */}

                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Memo Feedback Form "Candy Feedback" */}
          {!isMemberEB && !currentUserIsEB && (
          <div className="relative">
            {/* The Post-it styled form, miring slightly for a retro pop bulletin feel */}
            <motion.div
              initial={{ rotate: -1.5 }}
              whileHover={{ rotate: 0 }}
              className="bg-[#FF006E] border-4 border-brand-carbon p-6 md:p-8 rounded-2xl shadow-neo-lg rotate-[-1.5deg] relative"
            >
              {/* Sticker Pin decoration */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#FFBE0B] border-3 border-black rounded-full shadow-neo-sm flex items-center justify-center font-bold text-xs rotate-[15deg]">
                📌
              </div>

              <h3 className="font-lilita uppercase text-2xl text-white tracking-tight mb-2 drop-shadow-[2px_2px_0px_#000] text-center">
                Tinggalkan Umpan Balik (Feedback Loop)
              </h3>

              <p className="text-xs font-lexend text-white/90 font-bold mb-6 text-center max-w-lg mx-auto">
                Kirim tanggapan balik atau pesan balasan Anda secara langsung kepada Chairman &amp; Vice Chairman atau Koordinator Departemen Anda.
              </p>

              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                
                {/* 1. Destination Radio Buttons */}
                <div>
                  <label className="block font-lilita text-xs uppercase text-white mb-2 tracking-wide">Penerima Pesan</label>
                  <div className={`grid grid-cols-1 gap-2 ${canSendToKoor ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                    <label className={`p-3 border-2.5 border-black rounded-lg font-lexend font-black text-xs uppercase flex items-center gap-2 cursor-pointer transition-all
                      ${tujuan === 'chairman' ? 'bg-[#FFFDF0] text-black shadow-neo-sm' : 'bg-[#FF006E] text-white border-white/40 hover:bg-[#e60063]'}
                    `}>
                      <input 
                        type="radio" 
                        name="tujuan" 
                        value="chairman" 
                        checked={tujuan === 'chairman'} 
                        onChange={() => setTujuan('chairman')}
                        className="accent-brand-carbon cursor-pointer"
                      />
                      <span>Fatir Gibran (Chairman)</span>
                    </label>

                    <label className={`p-3 border-2.5 border-black rounded-lg font-lexend font-black text-xs uppercase flex items-center gap-2 cursor-pointer transition-all
                      ${tujuan === 'vice_chairman' ? 'bg-[#FFFDF0] text-black shadow-neo-sm' : 'bg-[#FF006E] text-white border-white/40 hover:bg-[#e60063]'}
                    `}>
                      <input 
                        type="radio" 
                        name="tujuan" 
                        value="vice_chairman" 
                        checked={tujuan === 'vice_chairman'} 
                        onChange={() => setTujuan('vice_chairman')}
                        className="accent-brand-carbon cursor-pointer"
                      />
                      <span>Aedil Riski (Vice Chairman)</span>
                    </label>

                    {/* Show Koor option only if user is NOT a coordinator themselves and NOT an EB Secretary/Treasurer */}
                    {canSendToKoor && (
                    <label className={`p-3 border-2.5 border-black rounded-lg font-lexend font-black text-xs uppercase flex items-center gap-2 cursor-pointer transition-all
                      ${tujuan === 'koor' ? 'bg-[#FFFDF0] text-black shadow-neo-sm' : 'bg-[#FF006E] text-white border-white/40 hover:bg-[#e60063]'}
                    `}>
                      <input 
                        type="radio" 
                        name="tujuan" 
                        value="koor" 
                        checked={tujuan === 'koor'} 
                        onChange={() => setTujuan('koor')}
                        className="accent-brand-carbon cursor-pointer"
                      />
                      <span>{koorName ? `${koorName.split(' ')[0]} (Koor)` : "Koordinator"}</span>
                    </label>
                    )}
                  </div>
                </div>

                {/* 2. Text Area Message */}
                <div>
                  <label className="block font-lilita text-xs uppercase text-white mb-1.5 tracking-wide">Pesan Balasan</label>
                  <textarea 
                    rows={4}
                    placeholder="Tuliskan pesan balasan, ucapan terima kasih, atau saran Anda..."
                    value={isiBalasan}
                    onChange={(e) => setIsiBalasan(e.target.value)}
                    required
                    className="w-full p-4 border-3 border-black rounded-lg font-lexend font-medium text-black focus:outline-none focus:ring-4 focus:ring-[#FFBE0B]/40 bg-white placeholder-gray-400"
                  />
                </div>

                {/* 3. Anonim Checkbox & Submit */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 font-lexend font-black text-xs uppercase text-white cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={isAnonim} 
                      onChange={(e) => setIsAnonim(e.target.checked)}
                      className="w-5 h-5 border-2.5 border-black rounded bg-white text-[#FF006E] focus:ring-0 accent-black cursor-pointer"
                    />
                    <span className="flex items-center gap-1">
                      Kirim secara Anonim (Sembunyikan Identitas)
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={feedbackLoading}
                    className="bg-[#FFBE0B] hover:bg-[#e6ab0a] text-black font-lexend font-black px-6 py-3 border-3 border-black rounded-xl shadow-neo-sm text-sm flex items-center justify-center gap-2 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer w-full sm:w-auto disabled:opacity-50"
                  >
                    <span>{feedbackLoading ? "Mengirim..." : "Kirim Umpan Balik"}</span>
                    <Send className="w-4 h-4 transform group-hover:translate-x-1" />
                  </button>
                </div>

              </form>

              {/* Feedback Success Popup */}
              {feedbackSuccess && (
                <div className="absolute inset-0 bg-[#06D6A0] border-4 border-black rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in duration-200">
                  <CheckCircle className="w-16 h-16 text-black mb-2 animate-bounce" />
                  <h3 className="font-lilita text-2xl uppercase text-black">Tanggapan Dikirim!</h3>
                  <p className="font-lexend font-bold text-black/90 text-sm max-w-sm mt-1 mb-4">
                    Terima kasih telah memberikan umpan balik untuk kepengurusan ini. Tanggapan Anda telah tercatat dengan aman.
                  </p>
                  <button 
                    onClick={() => setFeedbackSuccess(false)}
                    className="bg-white hover:bg-gray-50 text-black font-lexend font-black px-4 py-2 border-3 border-black rounded-lg shadow-neo-sm text-xs cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </motion.div>
          </div>
          )}

        </div>
      )}
    </div>
  );
}
