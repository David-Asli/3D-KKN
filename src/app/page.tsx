"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import QRCodeDisplay from "./components/QRCodeDisplay";
import { supabase } from "@/lib/supabase";
import { toPng } from 'html-to-image';
import { 
  ScanLine, Cuboid, Zap, 
  Layers, Globe2, Box, Cloud, MonitorSmartphone,
  Mail, Camera, User, Heart, Play, Compass, Crosshair, Star, Coffee, Download
} from "lucide-react";

export default function Home() {
  const [arUrl, setArUrl] = useState<string>("");
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Generate the AR URL dynamically based on the current domain
    setArUrl(`${window.location.origin}/ar`);
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDownloadQR = async () => {
    const element = document.getElementById("qr-portal");
    if (!element) return;
    try {
      const dataUrl = await toPng(element, { 
        backgroundColor: 'transparent', 
        pixelRatio: 4, 
        style: { transform: 'none', margin: '0' }
      });
      const link = document.createElement("a");
      link.download = "Portal-Ajaib-Siampel.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download", err);
      alert("Gagal mengunduh gambar.");
    }
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="game-hub">
      {/* Background Ambience */}
      <div className="hub-bg">
        <div className="hub-grid"></div>
        <div className="hub-glow-cyan"></div>
        <div className="hub-glow-purple"></div>
      </div>

      {/* ===== HUD NAVBAR ===== */}
      <nav className="hud-navbar">
        <div className="hud-nav-inner">
          <div className="hud-brand">
            <Cuboid className="brand-icon" size={20} />
            <span>AR_SIAMPEL</span>
          </div>
          <div className="hud-nav-links">
            {session ? (
              <Link href="/collections" className="hud-btn-outline">
                <Heart size={14} /> KOLEKSI
              </Link>
            ) : (
              <Link href="/auth" className="hud-btn-outline">
                MASUK_SISTEM
              </Link>
            )}
            <Link href="/create" className="hud-btn-primary">
              <Box size={14} /> BUAT_AR
            </Link>
          </div>
        </div>
      </nav>

      <main className="hub-main">
        {/* ===== HERO / MAIN MENU ===== */}
        <section className="menu-section">
          <div className="menu-container">
            
            {/* Left: Titles & Actions */}
            <motion.div 
              className="menu-content"
              initial="hidden" animate="visible" variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="sys-status">
                <Star size={16} fill="currentColor" className="text-yellow-400" />
                <span>🌟 SIAP BERMAIN! 🌟</span>
              </motion.div>

              <motion.h1 variants={fadeInUp} className="game-title">
                MAIN AR <span className="text-cyan">3D SERU!</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="game-desc">
                Ayo mulai petualangan ajaibmu! Pindai kode portal di bawah ini untuk melihat karakter 3D lucu muncul langsung di sekitarmu!
              </motion.p>

              <motion.div variants={fadeInUp} className="menu-actions">
                <Link href="/ar" className="action-btn-main">
                  <Play size={24} fill="currentColor" />
                  MULAI PETUALANGAN
                  <div className="btn-glow"></div>
                </Link>
                
                <Link href="#missions" className="action-btn-sub">
                  <Compass size={18} />
                  CARA BERMAIN
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: QR Portal */}
            <motion.div 
              className="menu-portal"
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }} 
              animate={{ opacity: 1, scale: 1, rotate: 0 }} 
              transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
            >
              <div id="qr-portal" className="portal-container">
                <div className="portal-header">
                  <Star size={16} className="text-yellow-400" /> <span>PORTAL AJAIB</span>
                </div>
                <div className="portal-core">
                  {arUrl ? (
                    <QRCodeDisplay url={arUrl} />
                  ) : (
                    <div className="portal-loading">
                      <div className="spinner"></div>
                      <span>MEMUAT KEAJAIBAN...</span>
                    </div>
                  )}
                </div>
                <button onClick={handleDownloadQR} className="portal-footer">
                  <Download size={16} /> UNDUH PORTAL
                </button>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ===== PROGRESSION / TUTORIAL ===== */}
        <section id="missions" className="progression-section">
          <div className="section-header">
            <h2 className="section-title">CARA BERMAIN</h2>
            <div className="title-line"></div>
          </div>
          
          <div className="mission-path">
            <div className="path-line"></div>
            
            {[
              { num: "01", icon: ScanLine, title: "PINDAI KODE", desc: "Arahkan kameramu ke kode ajaib" },
              { num: "02", icon: Globe2, title: "MASUK PORTAL", desc: "Langsung main tanpa perlu install" },
              { num: "03", icon: Camera, title: "BUKA KAMERA", desc: "Klik izinkan agar keajaiban muncul" },
              { num: "04", icon: Cuboid, title: "MAIN 3D!", desc: "Lihat karakter lucu di dunia nyata" }
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                variants={fadeInUp}
                className="mission-node"
              >
                <div className="node-marker">
                  <span className="node-num">{step.num}</span>
                  <div className="node-icon-box">
                    <step.icon size={20} />
                  </div>
                </div>
                <div className="node-info">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== FEATURES / ABILITIES ===== */}
        <section className="abilities-section">
          <div className="section-header">
            <h2 className="section-title">FITUR SERU!</h2>
            <div className="title-line"></div>
          </div>

          <div className="ability-grid">
            {[
              { icon: Zap, title: "KAMERA CEPAT", desc: "Karakter 3D langsung muncul seketika tanpa nunggu lama!", type: "keren" },
              { icon: Layers, title: "KARTU AJAIB", desc: "Arahkan kamera ke kartu fisik untuk memunculkan karakter!", type: "spesial" },
              { icon: Box, title: "KARAKTER 3D", desc: "Kumpulkan teman 3D berkualitas tinggi yang bisa bergerak!", type: "keren" },
              { icon: MonitorSmartphone, title: "MAIN DI MANA AJA", desc: "Bisa dimainkan di HP atau tablet secara instan!", type: "keren" },
              { icon: Cloud, title: "KOLEKSI AMAN", desc: "Koleksi karaktermu akan tersimpan aman selamanya!", type: "spesial" },
              { icon: Coffee, title: "VOUCHER GRATIS", desc: "Kumpulkan semua karakternya dan dapatkan minuman gratis!", type: "spesial" }
            ].map((ability, idx) => (
              <motion.div 
                key={idx}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                className={"ability-card " + (ability.type === "spesial" ? "active-ability" : "passive-ability")}
              >
                <div className="ability-icon-wrapper">
                  <ability.icon size={24} className="ability-icon" />
                </div>
                <div className="ability-details">
                  <div className="ability-type">FITUR {ability.type.toUpperCase()}</div>
                  <h3 className="ability-name">{ability.title}</h3>
                  <p className="ability-desc">{ability.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== TEAM SECTION / KREATOR ===== */}
        <section className="team-section">
          <div className="section-header">
            <h2 className="section-title">KREATOR PORTAL</h2>
            <div className="title-line"></div>
          </div>
          
          <div className="team-container">
            <motion.div 
              className="team-photo-wrapper"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            >
              <div className="polaroid-card">
                <img src="/poto.jpeg" alt="KKN Bedagung 26" className="polaroid-image" />
                <div className="polaroid-caption">
                  <span className="caption-title">KKN BEDAGUNG 26</span>
                  <span className="caption-subtitle">Desa Bedagung, 2026</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="team-info-card"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            >
              <div className="team-badge">
                <Heart size={14} fill="currentColor" className="text-pink" />
                <span>PENGABDIAN MASYARAKAT</span>
              </div>
              <h3 className="team-card-title">Halo dari Tim KKN Bedagung 26! 👋</h3>
              <p className="team-card-desc">
                Kami adalah kelompok mahasiswa Kuliah Kerja Nyata (KKN) Bedagung 26. Melalui proyek Augmented Reality <strong>Pinus Siampel</strong> ini, kami berharap dapat memperkenalkan dan mempromosikan keindahan alam serta potensi wisata hutan Pinus Siampel dengan cara yang interaktif, modern, dan menyenangkan.
              </p>
              <p className="team-card-subdesc">
                Ayo bantu kami menyebarkan keajaiban ini! Ambil foto keseruanmu bermain AR di Pinus Siampel dan bagikan ke media sosial.
              </p>
              
              <div className="team-social-box">
                <span className="social-label">Ikuti Keseruan Kami:</span>
                <div className="social-buttons">
                  <Link href="https://www.instagram.com/kkn_bedagung26/" target="_blank" className="social-btn instagram">
                    INSTAGRAM
                  </Link>
                  <Link href="https://www.tiktok.com/@kknbedagung26" target="_blank" className="social-btn tiktok">
                    TIKTOK
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ===== COMPACT FOOTER ===== */}
      <footer className="hud-footer">
        <div className="footer-inner">
          <div className="footer-sys-info">
            <Cuboid size={14} className="text-cyan" />
            <span>PINUS SIAMPEL // ITSNU PEKALONGAN - KKN BEDAGUNG 2026</span>
          </div>
          <div className="footer-links">
            <Link href="https://www.instagram.com/pinussiampel?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==" target="_blank" className="f-link">INSTAGRAM</Link>
            <Link href="https://www.tiktok.com/@desawisatabedagung?is_from_webapp=1&sender_device=pc" target="_blank" className="f-link">TIKTOK</Link>
          </div>
        </div>
      </footer>

      <style>{`
        :root {
          --bg-base: #f0fdf4;
          --hud-cyan: #3b82f6;
          --hud-cyan-dim: rgba(59, 130, 246, 0.2);
          --hud-purple: #ec4899;
          --hud-purple-dim: rgba(236, 72, 153, 0.2);
          --hud-text: #1e293b;
          --hud-muted: #64748b;
          --hud-dark: rgba(255, 255, 255, 0.9);
        }

        .game-hub {
          position: relative; z-index: 10;
          font-family: var(--font-sans);
          background: #e0f2fe; color: var(--hud-text);
          min-height: 100vh; display: flex; flex-direction: column;
        }

        /* Ambient Background */
        .hub-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%); }
        .hub-grid { position: absolute; inset: 0; background-image: radial-gradient(circle at 20px 20px, rgba(59, 130, 246, 0.1) 4px, transparent 0); background-size: 60px 60px; }
        .hub-glow-cyan { position: absolute; top: -20%; left: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(167, 139, 250, 0.4) 0%, transparent 70%); filter: blur(60px); }
        .hub-glow-purple { position: absolute; bottom: -20%; right: -10%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(244, 114, 182, 0.4) 0%, transparent 70%); filter: blur(60px); }

        /* HUD Navbar */
        .hud-navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); border-bottom: 2px solid rgba(59, 130, 246, 0.2);
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .hud-nav-inner {
          max-width: 1400px; margin: 0 auto; padding: 12px 24px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .hud-brand {
          display: flex; align-items: center; gap: 10px;
          font-family: var(--font-display); font-weight: 800; font-size: 1.3rem; color: #1e40af; letter-spacing: 1px;
        }
        .brand-icon { color: #f59e0b; }
        .hud-nav-links { display: flex; gap: 16px; align-items: center; }
        
        .hud-btn-outline, .hud-btn-primary {
          display: flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 50px;
          font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; text-decoration: none; transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .hud-btn-outline { background: #f8fafc; border: 2px solid #cbd5e1; color: #475569; box-shadow: 0 4px 0 #cbd5e1; }
        .hud-btn-outline:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #cbd5e1; color: #1e293b; }
        .hud-btn-outline:active { transform: translateY(4px); box-shadow: 0 0 0 #cbd5e1; }
        
        .hud-btn-primary { background: #3b82f6; border: 2px solid #2563eb; color: #fff; box-shadow: 0 4px 0 #1d4ed8; }
        .hud-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #1d4ed8, 0 10px 20px rgba(59, 130, 246, 0.4); }
        .hud-btn-primary:active { transform: translateY(4px); box-shadow: 0 0 0 #1d4ed8; }

        .hub-main { position: relative; z-index: 10; flex: 1; }
        .text-cyan { color: #ec4899; }

        /* Section Headers */
        .section-header { margin-bottom: 40px; display: flex; align-items: center; gap: 20px; max-width: 1400px; margin-left: auto; margin-right: auto; padding: 0 24px; }
        .section-title { font-family: var(--font-display); font-size: 2rem; font-weight: 800; margin: 0; color: #1e40af; letter-spacing: 1px; text-shadow: 2px 2px 0 #bfdbfe; }
        .title-line { flex: 1; height: 4px; background: linear-gradient(90deg, #3b82f6, #ec4899, transparent); border-radius: 4px; }

        /* Hero / Menu */
        .menu-section { min-height: 90vh; display: flex; align-items: center; padding: 120px 24px 60px; }
        .menu-container { max-width: 1400px; margin: 0 auto; width: 100%; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; align-items: center; }
        
        .sys-status { display: inline-flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 700; font-size: 1rem; color: #15803d; margin-bottom: 24px; background: #bbf7d0; padding: 8px 16px; border-radius: 50px; border: 2px solid #4ade80; box-shadow: 0 4px 10px rgba(74, 222, 128, 0.3); }
        
        .game-title { font-family: var(--font-display); font-size: clamp(3rem, 6vw, 5rem); font-weight: 900; line-height: 1.1; margin: 0 0 24px 0; color: #1e3a8a; text-shadow: 4px 4px 0 #93c5fd; }
        .game-desc { font-size: 1.2rem; color: #475569; line-height: 1.6; max-width: 480px; margin: 0 0 40px 0; font-family: var(--font-sans); font-weight: 600; }
        
        .menu-actions { display: flex; gap: 24px; flex-wrap: wrap; }
        .action-btn-main {
          position: relative; display: flex; align-items: center; gap: 12px; padding: 16px 32px;
          background: linear-gradient(180deg, #fde047, #f59e0b); color: #78350f; font-family: var(--font-display); font-weight: 800; font-size: 1.2rem;
          text-decoration: none; border: 3px solid #fff; border-radius: 50px;
          transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 8px 0 #d97706, 0 15px 30px rgba(245, 158, 11, 0.4);
        }
        .action-btn-main:hover { transform: translateY(-4px); box-shadow: 0 12px 0 #d97706, 0 20px 40px rgba(245, 158, 11, 0.5); }
        .action-btn-main:active { transform: translateY(8px); box-shadow: 0 0 0 #d97706; }
        .btn-glow { position: absolute; inset: 0; box-shadow: 0 0 20px rgba(253, 224, 71, 0.8); opacity: 0; transition: 0.2s; pointer-events: none; border-radius: 50px; }
        .action-btn-main:hover .btn-glow { opacity: 1; }

        .action-btn-sub {
          display: flex; align-items: center; gap: 10px; padding: 16px 28px;
          background: #fff; color: #3b82f6; border: 3px solid #3b82f6; border-radius: 50px;
          font-family: var(--font-display); font-weight: 800; font-size: 1.1rem; text-decoration: none; transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 6px 0 #2563eb;
        }
        .action-btn-sub:hover { background: #eff6ff; transform: translateY(-4px); box-shadow: 0 10px 0 #2563eb; }
        .action-btn-sub:active { transform: translateY(6px); box-shadow: 0 0 0 #2563eb; }

        /* QR Portal */
        .menu-portal { display: flex; justify-content: center; position: relative; }
        .portal-container {
          width: 100%; max-width: 340px; background: #fff; border: 4px solid #3b82f6;
          padding: 24px; border-radius: 32px;
          box-shadow: 0 20px 40px rgba(37, 99, 235, 0.2), inset 0 0 0 4px #eff6ff;
          position: relative; z-index: 2;
        }
        .portal-container::after { content: ''; position: absolute; top: -15px; right: -15px; width: 60px; height: 60px; background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23fde047" stroke="%23eab308" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>') no-repeat; transform: rotate(15deg); }
        .portal-header { display: flex; align-items: center; justify-content: center; gap: 8px; font-family: var(--font-display); font-size: 1.1rem; color: #1e3a8a; margin-bottom: 20px; font-weight: 800; }
        .portal-core { aspect-ratio: 1; background: #f8fafc; border: 3px dashed #94a3b8; border-radius: 20px; padding: 16px; display: flex; justify-content: center; align-items: center; overflow: hidden; position: relative; transition: 0.3s; }
        .portal-container:hover .portal-core { border-color: #3b82f6; background: #eff6ff; }
        .portal-core img { width: 100% !important; height: auto !important; border-radius: 12px; }
        .portal-loading { display: flex; flex-direction: column; align-items: center; gap: 16px; color: #3b82f6; font-family: var(--font-display); font-weight: 800; }
        .spinner { width: 40px; height: 40px; border: 4px solid #bfdbfe; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
        .portal-footer { display: flex; align-items: center; justify-content: center; gap: 8px; text-align: center; font-family: var(--font-display); font-size: 1rem; color: #ec4899; margin-top: 20px; font-weight: 800; background: #fce7f3; padding: 10px; border-radius: 50px; border: 2px solid transparent; cursor: pointer; transition: 0.2s; width: 100%; box-shadow: 0 4px 10px rgba(236,72,153,0.1); }
        .portal-footer:hover { background: #fbcfe8; border-color: #ec4899; transform: scale(1.05); }

        @media (max-width: 900px) {
          .menu-container { grid-template-columns: 1fr; gap: 40px; text-align: center; }
          .sys-status { margin: 0 auto 24px; }
          .game-desc { margin: 0 auto 40px; }
          .menu-actions { justify-content: center; }
        }

        /* Progression / Tutorial */
        .progression-section { padding: 60px 0 100px; }
        .mission-path {
          max-width: 1400px; margin: 0 auto; padding: 0 24px;
          display: flex; justify-content: space-between; position: relative; gap: 24px;
        }
        .path-line {
          position: absolute; top: 32px; left: 40px; right: 40px; height: 6px;
          background: #e2e8f0; border-radius: 6px; z-index: 0;
        }
        
        .mission-node { flex: 1; position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .node-marker { position: relative; margin-bottom: 24px; transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .mission-node:hover .node-marker { transform: translateY(-10px) scale(1.1); }
        .node-num { position: absolute; top: -12px; left: -12px; font-family: var(--font-display); font-size: 1.5rem; font-weight: 900; color: #fff; background: #ec4899; width: 36px; height: 36px; display: flex; justify-content: center; align-items: center; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(236,72,153,0.4); z-index: 2; }
        .node-icon-box {
          width: 70px; height: 70px; background: #fff; border: 4px solid #3b82f6;
          border-radius: 50%; display: flex; justify-content: center; align-items: center;
          color: #3b82f6; box-shadow: 0 8px 20px rgba(59,130,246,0.2), inset 0 0 10px #eff6ff;
          position: relative; z-index: 1;
        }
        .mission-node:nth-child(even) .node-icon-box { border-color: #8b5cf6; color: #8b5cf6; }
        .mission-node:nth-child(even) .node-num { background: #3b82f6; box-shadow: 0 4px 10px rgba(59,130,246,0.4); }
        
        .node-info h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; margin: 0 0 8px 0; color: #1e293b; }
        .node-info p { font-family: var(--font-sans); font-size: 1rem; color: #64748b; margin: 0; line-height: 1.5; font-weight: 600; }

        @media (max-width: 800px) {
          .mission-path { flex-direction: column; gap: 40px; }
          .path-line { top: 0; bottom: 0; left: 59px; right: auto; width: 6px; height: auto; }
          .mission-node { flex-direction: row; text-align: left; gap: 24px; }
          .node-marker { margin-bottom: 0; }
          .node-num { top: -5px; left: 45px; }
        }

        /* Abilities / Features */
        .abilities-section { padding: 40px 0 120px; }
        .ability-grid {
          max-width: 1400px; margin: 0 auto; padding: 0 24px;
          display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px;
        }
        
        .ability-card {
          background: #fff; border: 3px solid #e2e8f0;
          border-radius: 24px; padding: 24px; display: flex; gap: 20px; align-items: flex-start;
          transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); cursor: default;
          box-shadow: 0 10px 20px rgba(0,0,0,0.05); position: relative; overflow: hidden;
        }
        .ability-card:hover { border-color: #3b82f6; transform: translateY(-8px); box-shadow: 0 20px 40px rgba(59,130,246,0.15); }
        .ability-card::after { content: ''; position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
        
        .active-ability { border-bottom: 6px solid #3b82f6; }
        .passive-ability { border-bottom: 6px solid #ec4899; }

        .ability-icon-wrapper {
          width: 56px; height: 56px; background: #eff6ff; border-radius: 16px;
          display: flex; justify-content: center; align-items: center; flex-shrink: 0;
          border: 2px solid #bfdbfe;
        }
        .passive-ability .ability-icon-wrapper { background: #fdf2f8; border-color: #fbcfe8; }
        
        .active-ability .ability-icon { color: #3b82f6; }
        .passive-ability .ability-icon { color: #ec4899; }

        .ability-details { flex: 1; }
        .ability-type { font-family: var(--font-display); font-size: 0.8rem; font-weight: 800; color: #94a3b8; margin-bottom: 8px; letter-spacing: 1px; background: #f1f5f9; padding: 4px 10px; border-radius: 50px; display: inline-block; }
        .ability-name { font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; margin: 0 0 8px 0; color: #1e293b; }
        .ability-desc { font-family: var(--font-sans); font-size: 1rem; color: #64748b; margin: 0; line-height: 1.5; font-weight: 600; }

        /* Team Section / Kreator */
        .team-section { padding: 40px 0 100px; }
        .team-container {
          max-width: 1400px; margin: 0 auto; padding: 0 24px;
          display: grid; grid-template-columns: 1fr 1.2fr; gap: 48px; align-items: center;
        }
        
        .team-photo-wrapper { display: flex; justify-content: center; }
        .polaroid-card {
          background: #fff; padding: 16px 16px 24px; border-radius: 20px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.1); border: 2px solid #e2e8f0;
          transform: rotate(-2deg); transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-width: 480px; width: 100%;
        }
        .polaroid-card:hover { transform: rotate(1deg) translateY(-8px); box-shadow: 0 25px 50px rgba(0,0,0,0.15); }
        .polaroid-image { width: 100%; height: auto; border-radius: 12px; border: 1px solid #cbd5e1; }
        .polaroid-caption {
          margin-top: 16px; text-align: center; display: flex; flex-direction: column; gap: 4px;
        }
        .caption-title { font-family: var(--font-display); font-weight: 800; font-size: 1.2rem; color: #1e3a8a; }
        .caption-subtitle { font-family: var(--font-sans); font-weight: 700; font-size: 0.9rem; color: #64748b; }
        
        .team-info-card {
          background: #fff; border: 3px solid #e2e8f0; border-radius: 24px;
          padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          display: flex; flex-direction: column; gap: 20px;
        }
        .team-badge {
          display: inline-flex; align-items: center; gap: 8px; align-self: flex-start;
          font-family: var(--font-display); font-weight: 800; font-size: 0.85rem; color: #db2777;
          background: #fce7f3; border: 2px solid #fbcfe8; padding: 6px 16px; border-radius: 50px;
        }
        .text-pink { color: #ec4899; }
        .team-card-title { font-family: var(--font-display); font-weight: 800; font-size: 1.8rem; color: #1e3a8a; margin: 0; }
        .team-card-desc { font-family: var(--font-sans); font-size: 1.05rem; color: #475569; line-height: 1.6; margin: 0; font-weight: 600; }
        .team-card-desc strong { color: #2563eb; }
        .team-card-subdesc { font-family: var(--font-sans); font-size: 0.95rem; color: #64748b; line-height: 1.6; margin: 0; font-style: italic; font-weight: 600; }
        
        .team-social-box {
          margin-top: 10px; display: flex; flex-direction: column; gap: 12px;
          border-top: 2px dashed #e2e8f0; padding-top: 20px;
        }
        .social-label { font-family: var(--font-display); font-weight: 800; font-size: 0.95rem; color: #475569; }
        .social-buttons { display: flex; gap: 16px; flex-wrap: wrap; }
        .social-btn {
          display: inline-flex; align-items: center; justify-content: center; padding: 10px 24px;
          font-family: var(--font-display); font-weight: 800; font-size: 0.95rem; text-decoration: none;
          border-radius: 50px; border: 3px solid #fff; transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .social-btn.instagram { background: #fdf2f8; color: #db2777; border-color: #fbcfe8; box-shadow: 0 4px 0 #fbcfe8; }
        .social-btn.instagram:hover { background: #db2777; color: #fff; border-color: #db2777; transform: translateY(-3px); box-shadow: 0 6px 0 #db2777; }
        .social-btn.tiktok { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; box-shadow: 0 4px 0 #bfdbfe; }
        .social-btn.tiktok:hover { background: #2563eb; color: #fff; border-color: #2563eb; transform: translateY(-3px); box-shadow: 0 6px 0 #2563eb; }
        
        @media (max-width: 900px) {
          .team-container { grid-template-columns: 1fr; gap: 40px; }
          .polaroid-card { max-width: 100%; transform: none; }
          .polaroid-card:hover { transform: translateY(-6px); }
          .team-info-card { padding: 24px; }
        }

        /* Compact Footer */
        .hud-footer { border-top: 4px dashed #bfdbfe; background: #3b82f6; padding: 40px 24px; margin-top: auto; position: relative; z-index: 10; }
        .footer-inner { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
        .footer-sys-info { display: flex; align-items: center; gap: 12px; font-family: var(--font-display); font-size: 1.1rem; color: #fff; font-weight: 800; }
        .footer-sys-info .text-cyan { color: #fde047; }
        .footer-links { display: flex; gap: 20px; }
        .f-link { color: #1e3a8a; text-decoration: none; font-family: var(--font-display); font-size: 1rem; font-weight: 800; transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); background: #bfdbfe; padding: 10px 20px; border-radius: 50px; border: 3px solid #fff; box-shadow: 0 4px 0 #2563eb; }
        .f-link:hover { background: #fde047; color: #78350f; transform: translateY(-4px); box-shadow: 0 8px 0 #2563eb; }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
