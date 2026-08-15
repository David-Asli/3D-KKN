"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import QRCodeDisplay from "./components/QRCodeDisplay";
import { supabase } from "@/lib/supabase";
import { 
  ScanLine, Cuboid, Zap, 
  Layers, Globe2, Box, Cloud, MonitorSmartphone,
  Mail, ArrowRight, Camera, Code, User, LogOut, Heart
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
    <div style={{ position: "relative", zIndex: 10 }}>
      {/* ===== NAVBAR ===== */}
      <nav
        className="navbar-container"
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 50,
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--background)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="container-custom" style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="nav-brand" style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700, fontSize: "1.1rem" }}>
            <Cuboid color="var(--primary)" size={24} />
            <span style={{ color: "var(--text-primary)" }}>AR SIAMPEL</span>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {session ? (
              <Link href="/collections" className="btn-secondary nav-btn" style={{ padding: "8px 16px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <Heart size={16} /> Koleksi
              </Link>
            ) : (
              <Link href="/auth" className="btn-secondary nav-btn" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
                Masuk
              </Link>
            )}
            <Link href="/create" className="btn-primary nav-btn" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
              Buat AR
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ===== HERO SECTION ===== */}
        <section style={{ minHeight: "90vh", display: "flex", alignItems: "center", paddingTop: "100px", paddingBottom: "60px" }}>
          <div className="container-custom">
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
              gap: "40px", 
              alignItems: "center" 
            }}>
              
              {/* Hero Content - Kolom Kiri */}
              <motion.div initial="hidden" animate="visible" variants={staggerContainer} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <motion.div variants={fadeInUp}>
                  <span style={{ 
                    display: "inline-block", 
                    padding: "6px 12px", 
                    background: "rgba(59, 130, 246, 0.1)", 
                    color: "var(--primary)", 
                    borderRadius: "100px", 
                    fontSize: "0.85rem", 
                    fontWeight: 600,
                    marginBottom: "8px"
                  }}>
                    <span style={{ color: "var(--primary)", fontWeight: 600 }}>WebAR • Tanpa Instalasi</span>
                  </span>
                </motion.div>

                <motion.h1 variants={fadeInUp} style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: "24px" }}>
                  Pengalaman Augmented Reality
                </motion.h1>

                <motion.p variants={fadeInUp} style={{ fontSize: "1.05rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "480px" }}>
                  Scan QR Code dan nikmati pengalaman 3D interaktif langsung melalui smartphone Anda. Instan, ringan, dan mendukung lintas platform.
                </motion.p>

                <motion.div variants={fadeInUp}>
                  <div className="mobile-col" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    <Link href="/ar" className="btn-primary hero-btn" style={{ padding: "16px 32px", fontSize: "1.1rem" }}>
                      Mulai Pengalaman AR
                    </Link>
                    <Link href="#features" className="btn-secondary hero-btn" style={{ padding: "16px 32px", fontSize: "1.1rem" }}>
                      Pelajari Lebih Lanjut
                    </Link>
                  </div>
                </motion.div>
              </motion.div>

              {/* Hero QR Card - Kolom Kanan */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                style={{ display: "flex", justifyContent: "center" }}
              >
                <div style={{ width: "100%", maxWidth: "380px" }}>
                  {arUrl ? (
                    <QRCodeDisplay url={arUrl} />
                  ) : (
                    <div className="glass-card" style={{ padding: "60px", textAlign: "center", background: "white", color: "#333" }}>
                      Memuat QR Code...
                    </div>
                  )}
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section style={{ padding: "80px 0", background: "var(--bg-secondary)" }}>
          <div className="container-custom">
            <div style={{ textAlign: "center", marginBottom: "50px" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)" }}>Cara Kerjanya</h2>
              <p style={{ color: "var(--text-tertiary)", marginTop: "10px" }}>Langkah sederhana memulai WebAR</p>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
              {[
                { icon: ScanLine, title: "1. Scan QR", desc: "Arahkan kamera HP ke layar untuk scan QR Code." },
                { icon: Globe2, title: "2. Buka Link", desc: "Akses link dari browser tanpa download aplikasi." },
                { icon: Camera, title: "3. Izinkan Kamera", desc: "Berikan izin kamera, lalu sorot gambar target." },
                { icon: Cuboid, title: "4. Interaksi", desc: "Objek 3D akan melayang dan bisa disentuh!" }
              ].map((step, idx) => (
                <motion.div 
                  key={idx}
                  initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                  variants={fadeInUp}
                  className="glass-card"
                  style={{ padding: "30px", textAlign: "left", background: "var(--background)" }}
                >
                  <div style={{ color: "var(--primary)", marginBottom: "20px" }}>
                    <step.icon size={32} />
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "10px" }}>{step.title}</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FEATURES GRID ===== */}
        <section style={{ padding: "80px 0" }}>
          <div className="container-custom">
            <div style={{ textAlign: "center", marginBottom: "50px" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)" }}>Fitur Utama</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
              {[
                { icon: Zap, title: "Real Time AR", desc: "Pelacakan cepat dan mulus tanpa jeda dengan MindAR." },
                { icon: Layers, title: "Image Tracking", desc: "Ubah poster atau kartu fisik menjadi marker interaktif." },
                { icon: Box, title: "3D Model Support", desc: "Mendukung format standar GLB/GLTF dengan render kualitas tinggi." },
                { icon: MonitorSmartphone, title: "Cross Platform", desc: "Berjalan di iOS, Android, dan Tablet langsung melalui browser." },
                { icon: Cloud, title: "Cloud Integration", desc: "Sistem upload terpusat berbasis cloud menggunakan Vercel Blob." }
              ].map((feature, idx) => (
                <motion.div 
                  key={idx}
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                  className="glass-card"
                  style={{ padding: "24px", display: "flex", gap: "20px", alignItems: "flex-start" }}
                >
                  <div style={{ color: "var(--accent)" }}>
                    <feature.icon size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>{feature.title}</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "var(--bg-secondary)" }}>
        <div className="container-custom mobile-col" style={{ padding: "40px 24px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "30px" }}>
          <div style={{ maxWidth: "280px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "1.2rem", marginBottom: "12px" }}>
              <Cuboid color="var(--primary)" size={24} />
              <span>AR SIAMPEL 3D</span>
            </div>
            <p style={{ color: "var(--text-tertiary)", fontSize: "0.85rem", lineHeight: 1.6 }}>
              Platform minimalis untuk pengalaman Web Augmented Reality yang cepat dan responsif.
            </p>
          </div>
          
          <div className="mobile-col" style={{ display: "flex", gap: "40px" }}>
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: "12px", color: "white", fontSize: "0.95rem" }}>Navigasi</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link href="/create" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem" }}>Buat Target AR</Link>
                <Link href="/ar" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem" }}>Kamera AR</Link>
              </div>
            </div>
            
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: "12px", color: "white", fontSize: "0.95rem" }}>Sosial</h4>
              <div style={{ display: "flex", gap: "8px" }}>
                <Link href="https://www.instagram.com/kkn_bedagung26/" target="_blank" rel="noopener noreferrer" className="btn-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </Link>
                <Link href="https://www.tiktok.com/@kknbedagung26" target="_blank" rel="noopener noreferrer" className="btn-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                </Link>
                <Link href="#" className="btn-icon"><User size={16} /></Link>
                <Link href="#" className="btn-icon"><Mail size={16} /></Link>
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "16px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.8rem" }}>
          © {new Date().getFullYear()} AR SIAMPEL. KKN DESA BEDAGUNG | ITSNU PEKALONGAN
        </div>
      </footer>
    </div>
  );
}
