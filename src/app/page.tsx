"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import QRCodeDisplay from "./components/QRCodeDisplay";
import { supabase } from "@/lib/supabase";
import { 
  ScanLine, Cuboid, Zap, 
  Layers, Globe2, Box, Cloud, MonitorSmartphone,
  Mail, Camera, User, Heart, Play, Compass, Crosshair
} from "lucide-react";

export default function Home() {
  const [arUrl, setArUrl] = useState<string>("");
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Generate the AR URL dynamically based on the current domain
    setArUrl(`${window.location.origin}/ar`);
    
    // Check auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
                <div className="status-dot"></div>
                SISTEM ONLINE // WEB_AR SIAP
              </motion.div>

              <motion.h1 variants={fadeInUp} className="game-title">
                AUGMENTED<br/><span className="text-cyan">REALITY</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="game-desc">
                Pindai kode portal untuk masuk ke dimensi 3D interaktif. Akses instan. Tanpa perlu instalasi aplikasi.
              </motion.p>

              <motion.div variants={fadeInUp} className="menu-actions">
                <Link href="/ar" className="action-btn-main">
                  <Play size={20} fill="currentColor" />
                  MULAI PENGALAMAN
                  <div className="btn-glow"></div>
                </Link>
                
                <Link href="#missions" className="action-btn-sub">
                  <Compass size={16} />
                  LIHAT TUTORIAL
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: QR Portal */}
            <motion.div 
              className="menu-portal"
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="portal-container">
                <div className="portal-header">
                  <Crosshair size={14} /> <span>PORTAL_AKSES</span>
                </div>
                <div className="portal-core">
                  {arUrl ? (
                    <QRCodeDisplay url={arUrl} />
                  ) : (
                    <div className="portal-loading">
                      <div className="spinner"></div>
                      <span>MEMUAT...</span>
                    </div>
                  )}
                </div>
                <div className="portal-footer">PINDAI UNTUK TERHUBUNG</div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ===== PROGRESSION / TUTORIAL ===== */}
        <section id="missions" className="progression-section">
          <div className="section-header">
            <h2 className="section-title">MISI_TUTORIAL</h2>
            <div className="title-line"></div>
          </div>
          
          <div className="mission-path">
            <div className="path-line"></div>
            
            {[
              { num: "01", icon: ScanLine, title: "PINDAI PORTAL", desc: "Arahkan kamera untuk memindai QR Code" },
              { num: "02", icon: Globe2, title: "BUKA TAUTAN", desc: "Akses web secara instan tanpa aplikasi" },
              { num: "03", icon: Camera, title: "AKSES KAMERA", desc: "Berikan izin untuk membuka kamera" },
              { num: "04", icon: Cuboid, title: "INTERAKSI 3D", desc: "Lihat objek melayang di dunia nyata" }
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
            <h2 className="section-title">KEMAMPUAN_SISTEM</h2>
            <div className="title-line"></div>
          </div>

          <div className="ability-grid">
            {[
              { icon: Zap, title: "AR_REAL_TIME", desc: "Mesin pelacakan presisi tanpa jeda waktu", type: "pasif" },
              { icon: Layers, title: "PELACAKAN_GAMBAR", desc: "Ubah poster/kartu fisik menjadi marker 3D", type: "aktif" },
              { icon: Box, title: "RENDER_3D", desc: "Dukungan GLB/GLTF dengan visual berkualitas tinggi", type: "pasif" },
              { icon: MonitorSmartphone, title: "LINTAS_PLATFORM", desc: "Berjalan lancar di ponsel, tablet, maupun PC", type: "pasif" },
              { icon: Cloud, title: "SINKRONISASI_CLOUD", desc: "Penyimpanan aset terpusat di Vercel Blob", type: "aktif" }
            ].map((ability, idx) => (
              <motion.div 
                key={idx}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                className={"ability-card " + (ability.type === "aktif" ? "active-ability" : "passive-ability")}
              >
                <div className="ability-icon-wrapper">
                  <ability.icon size={24} className="ability-icon" />
                </div>
                <div className="ability-details">
                  <div className="ability-type">SKILL {ability.type.toUpperCase()}</div>
                  <h3 className="ability-name">{ability.title}</h3>
                  <p className="ability-desc">{ability.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* ===== COMPACT FOOTER ===== */}
      <footer className="hud-footer">
        <div className="footer-inner">
          <div className="footer-sys-info">
            <Cuboid size={14} className="text-cyan" />
            <span>AR_SIAMPEL_v1.0 // KKN BEDAGUNG 26</span>
          </div>
          <div className="footer-links">
            <Link href="https://www.instagram.com/kkn_bedagung26/" target="_blank" className="f-link">INSTAGRAM</Link>
            <Link href="https://www.tiktok.com/@kknbedagung26" target="_blank" className="f-link">TIKTOK</Link>
          </div>
        </div>
      </footer>

      <style>{`
        :root {
          --bg-base: #030712;
          --hud-cyan: #06b6d4;
          --hud-cyan-dim: rgba(6, 182, 212, 0.2);
          --hud-purple: #c026d3;
          --hud-purple-dim: rgba(192, 38, 211, 0.2);
          --hud-text: #e2e8f0;
          --hud-muted: #64748b;
          --hud-dark: rgba(15, 23, 42, 0.7);
        }

        .game-hub {
          position: relative; z-index: 10;
          font-family: ui-sans-serif, system-ui, sans-serif;
          background: var(--bg-base); color: var(--hud-text);
          min-height: 100vh; display: flex; flex-direction: column;
        }

        /* Ambient Background */
        .hub-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .hub-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px); background-size: 40px 40px; transform: perspective(1000px) rotateX(60deg) scale(2.5); transform-origin: top center; }
        .hub-glow-cyan { position: absolute; top: -20%; left: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%); filter: blur(60px); }
        .hub-glow-purple { position: absolute; bottom: -20%; right: -10%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(192, 38, 211, 0.1) 0%, transparent 70%); filter: blur(60px); }

        /* HUD Navbar */
        .hud-navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          background: var(--hud-dark); backdrop-filter: blur(12px); border-bottom: 1px solid var(--hud-cyan-dim);
        }
        .hud-nav-inner {
          max-width: 1400px; margin: 0 auto; padding: 12px 24px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .hud-brand {
          display: flex; align-items: center; gap: 10px;
          font-family: monospace; font-weight: 800; font-size: 1.1rem; color: #fff; letter-spacing: 2px;
        }
        .brand-icon { color: var(--hud-cyan); }
        .hud-nav-links { display: flex; gap: 16px; align-items: center; }
        
        .hud-btn-outline, .hud-btn-primary {
          display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 4px;
          font-family: monospace; font-weight: 700; font-size: 0.85rem; text-decoration: none; transition: 0.2s;
        }
        .hud-btn-outline { background: transparent; border: 1px solid var(--hud-cyan-dim); color: var(--hud-cyan); }
        .hud-btn-outline:hover { background: var(--hud-cyan-dim); color: #fff; border-color: var(--hud-cyan); }
        .hud-btn-primary { background: var(--hud-cyan-dim); border: 1px solid var(--hud-cyan); color: #fff; box-shadow: inset 0 0 10px var(--hud-cyan-dim); }
        .hud-btn-primary:hover { background: var(--hud-cyan); color: #000; box-shadow: 0 0 15px var(--hud-cyan); }

        .hub-main { position: relative; z-index: 10; flex: 1; }
        .text-cyan { color: var(--hud-cyan); }

        /* Section Headers */
        .section-header { margin-bottom: 40px; display: flex; align-items: center; gap: 16px; max-width: 1400px; margin-left: auto; margin-right: auto; padding: 0 24px; }
        .section-title { font-family: monospace; font-size: 1.5rem; font-weight: 800; margin: 0; color: #fff; letter-spacing: 2px; }
        .title-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--hud-cyan-dim), transparent); }

        /* Hero / Menu */
        .menu-section { min-height: 90vh; display: flex; align-items: center; padding: 120px 24px 60px; }
        .menu-container { max-width: 1400px; margin: 0 auto; width: 100%; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; align-items: center; }
        
        .sys-status { display: inline-flex; align-items: center; gap: 8px; font-family: monospace; font-size: 0.8rem; color: var(--hud-cyan); margin-bottom: 24px; background: var(--hud-cyan-dim); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(6,182,212,0.3); }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--hud-cyan); animation: blink 1.5s infinite; }
        
        .game-title { font-size: clamp(3rem, 6vw, 5rem); font-weight: 900; line-height: 1.1; margin: 0 0 24px 0; letter-spacing: -1px; text-transform: uppercase; }
        .game-desc { font-size: 1.1rem; color: var(--hud-muted); line-height: 1.6; max-width: 480px; margin: 0 0 40px 0; font-family: monospace; }
        
        .menu-actions { display: flex; gap: 20px; flex-wrap: wrap; }
        .action-btn-main {
          position: relative; display: flex; align-items: center; gap: 10px; padding: 16px 32px;
          background: var(--hud-cyan); color: #000; font-family: monospace; font-weight: 800; font-size: 1.1rem;
          text-decoration: none; border: none; clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
          transition: 0.2s;
        }
        .action-btn-main:hover { transform: scale(1.05); color: #000; }
        .btn-glow { position: absolute; inset: 0; box-shadow: 0 0 20px var(--hud-cyan); opacity: 0; transition: 0.2s; pointer-events: none; }
        .action-btn-main:hover .btn-glow { opacity: 1; }

        .action-btn-sub {
          display: flex; align-items: center; gap: 8px; padding: 16px 24px;
          background: transparent; color: var(--hud-text); border: 1px solid var(--hud-cyan-dim);
          font-family: monospace; font-weight: 700; font-size: 1rem; text-decoration: none; transition: 0.2s;
          clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
        }
        .action-btn-sub:hover { background: var(--hud-cyan-dim); border-color: var(--hud-cyan); color: #fff; }

        /* QR Portal */
        .menu-portal { display: flex; justify-content: center; }
        .portal-container {
          width: 100%; max-width: 320px; background: rgba(0,0,0,0.5); border: 1px solid var(--hud-cyan-dim);
          padding: 16px; border-radius: 8px; backdrop-filter: blur(8px);
          box-shadow: 0 0 30px rgba(6,182,212,0.1), inset 0 0 20px rgba(6,182,212,0.05);
        }
        .portal-header { display: flex; align-items: center; gap: 8px; font-family: monospace; font-size: 0.8rem; color: var(--hud-cyan); margin-bottom: 16px; font-weight: 700; }
        .portal-core { aspect-ratio: 1; background: #fff; border-radius: 4px; padding: 12px; display: flex; justify-content: center; align-items: center; overflow: hidden; position: relative; }
        .portal-core img { width: 100% !important; height: auto !important; }
        .portal-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; color: #000; font-family: monospace; font-weight: 700; }
        .spinner { width: 24px; height: 24px; border: 3px solid #f3f3f3; border-top: 3px solid var(--hud-cyan); border-radius: 50%; animation: spin 1s linear infinite; }
        .portal-footer { text-align: center; font-family: monospace; font-size: 0.75rem; color: var(--hud-muted); margin-top: 16px; letter-spacing: 1px; }

        @media (max-width: 900px) {
          .menu-container { grid-template-columns: 1fr; gap: 40px; text-align: center; }
          .sys-status { margin: 0 auto 24px; }
          .game-desc { margin: 0 auto 40px; }
          .menu-actions { justify-content: center; }
        }

        /* Progression / Tutorial */
        .progression-section { padding: 40px 0 80px; }
        .mission-path {
          max-width: 1400px; margin: 0 auto; padding: 0 24px;
          display: flex; justify-content: space-between; position: relative; gap: 20px;
        }
        .path-line {
          position: absolute; top: 24px; left: 40px; right: 40px; height: 2px;
          background: linear-gradient(90deg, var(--hud-cyan-dim) 0%, rgba(192, 38, 211, 0.2) 100%); z-index: 0;
        }
        
        .mission-node { flex: 1; position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .node-marker { position: relative; margin-bottom: 20px; }
        .node-num { position: absolute; top: -16px; left: -16px; font-family: monospace; font-size: 2rem; font-weight: 900; color: rgba(255,255,255,0.05); }
        .node-icon-box {
          width: 50px; height: 50px; background: var(--bg-base); border: 2px solid var(--hud-cyan);
          border-radius: 50%; display: flex; justify-content: center; align-items: center;
          color: var(--hud-cyan); box-shadow: 0 0 15px var(--hud-cyan-dim);
        }
        .mission-node:nth-child(4) .node-icon-box, .mission-node:nth-child(5) .node-icon-box { border-color: var(--hud-purple); color: var(--hud-purple); box-shadow: 0 0 15px var(--hud-purple-dim); }
        
        .node-info h3 { font-family: monospace; font-size: 1.1rem; font-weight: 800; margin: 0 0 8px 0; color: #fff; }
        .node-info p { font-size: 0.9rem; color: var(--hud-muted); margin: 0; line-height: 1.4; }

        @media (max-width: 800px) {
          .mission-path { flex-direction: column; gap: 40px; }
          .path-line { top: 0; bottom: 0; left: 49px; right: auto; width: 2px; height: auto; background: linear-gradient(180deg, var(--hud-cyan-dim) 0%, rgba(192, 38, 211, 0.2) 100%); }
          .mission-node { flex-direction: row; text-align: left; gap: 20px; }
          .node-marker { margin-bottom: 0; }
          .node-num { top: -10px; left: 40px; }
        }

        /* Abilities / Features */
        .abilities-section { padding: 40px 0 100px; }
        .ability-grid {
          max-width: 1400px; margin: 0 auto; padding: 0 24px;
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;
        }
        
        .ability-card {
          background: rgba(15, 23, 42, 0.5); border: 1px solid var(--hud-cyan-dim);
          border-radius: 8px; padding: 20px; display: flex; gap: 16px; align-items: flex-start;
          transition: 0.2s; cursor: default;
        }
        .ability-card:hover { background: rgba(15, 23, 42, 0.8); border-color: rgba(255,255,255,0.2); transform: translateY(-2px); }
        
        .active-ability { border-left: 3px solid var(--hud-cyan); }
        .passive-ability { border-left: 3px solid var(--hud-purple); }

        .ability-icon-wrapper {
          width: 44px; height: 44px; background: rgba(0,0,0,0.5); border-radius: 8px;
          display: flex; justify-content: center; align-items: center; flex-shrink: 0;
        }
        .active-ability .ability-icon { color: var(--hud-cyan); }
        .passive-ability .ability-icon { color: var(--hud-purple); }

        .ability-details { flex: 1; }
        .ability-type { font-family: monospace; font-size: 0.7rem; font-weight: 800; opacity: 0.5; margin-bottom: 6px; letter-spacing: 1px; }
        .ability-name { font-family: monospace; font-size: 1.1rem; font-weight: 800; margin: 0 0 8px 0; color: #fff; }
        .ability-desc { font-size: 0.9rem; color: var(--hud-muted); margin: 0; line-height: 1.5; }

        /* Compact Footer */
        .hud-footer { border-top: 1px solid var(--hud-cyan-dim); background: rgba(3, 7, 18, 0.9); padding: 16px 24px; }
        .footer-inner { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .footer-sys-info { display: flex; align-items: center; gap: 10px; font-family: monospace; font-size: 0.8rem; color: var(--hud-muted); }
        .footer-links { display: flex; gap: 16px; }
        .f-link { color: var(--hud-muted); text-decoration: none; font-family: monospace; font-size: 0.8rem; font-weight: 700; transition: 0.2s; }
        .f-link:hover { color: var(--hud-cyan); }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
