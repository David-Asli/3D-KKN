"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import QRCodeDisplay from "./components/QRCodeDisplay";
import { 
  ScanLine, Smartphone, Cuboid, Zap, 
  Layers, Globe2, Cpu, Box, Cloud, MonitorSmartphone,
  Mail, ArrowRight, Camera, Code, User
} from "lucide-react";

export default function Home() {
  const [arUrl, setArUrl] = useState<string>("");

  useEffect(() => {
    // Generate the AR URL dynamically based on the current domain
    setArUrl(`${window.location.origin}/ar`);
  }, []);

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <>
      {/* Background Effects */}
      <div className="bg-gradient-animated" />
      <div className="grid-overlay" />
      <div className="noise-overlay" />

      {/* Floating Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div style={{ position: "relative", zIndex: 10 }}>
        {/* ===== NAVBAR ===== */}
        <nav
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0,
            zIndex: 50,
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(5, 8, 22, 0.5)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="container-custom" style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 800, fontSize: "1.2rem" }}>
              <Cuboid color="var(--primary)" size={28} />
              <span className="gradient-text">AR Vision</span>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <Link href="https://github.com/David-Asli/3D-KKN" target="_blank" className="btn-icon">
                <Code size={20} />
              </Link>
            </div>
          </div>
        </nav>

        <main>
          {/* ===== HERO SECTION ===== */}
          <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: "120px", paddingBottom: "80px" }}>
            <div className="container-custom">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "60px", alignItems: "center" }}>
                
                {/* Hero Content */}
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <motion.div variants={fadeInUp} style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                    <div className="hero-badge"><div className="dot"/> AR Ready</div>
                    <div className="hero-badge" style={{ color: "var(--primary)", borderColor: "rgba(59, 130, 246, 0.2)" }}>WebXR</div>
                    <div className="hero-badge" style={{ color: "var(--text-secondary)", borderColor: "rgba(255, 255, 255, 0.1)" }}>No Installation</div>
                  </motion.div>

                  <motion.h1 variants={fadeInUp} style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                    Experience The Future of <br />
                    <span className="gradient-text-primary">Augmented Reality</span>
                  </motion.h1>

                  <motion.p variants={fadeInUp} style={{ fontSize: "1.1rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "500px" }}>
                    Scan QR Code dan nikmati pengalaman 3D interaktif langsung melalui smartphone Anda. Tanpa perlu install aplikasi, instan, dan mendukung lintas platform.
                  </motion.p>

                  <motion.div variants={fadeInUp} style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "10px" }}>
                    <Link href="/create" className="btn-primary">
                      Mulai Buat AR <ArrowRight size={18} />
                    </Link>
                    <Link href="/ar" className="btn-secondary">
                      <Camera size={18} /> Buka Kamera
                    </Link>
                  </motion.div>
                </motion.div>

                {/* Hero QR Card */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, rotateY: 10 }} 
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }} 
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ display: "flex", justifyContent: "center", perspective: "1000px" }}
                >
                  <div style={{ width: "100%", maxWidth: "450px" }}>
                    {arUrl ? (
                      <QRCodeDisplay url={arUrl} />
                    ) : (
                      <div className="glass-card" style={{ padding: "100px", textAlign: "center" }}>
                        <div className="pulse" style={{ width: "30px", height: "30px", background: "var(--primary)", borderRadius: "50%", margin: "0 auto 20px" }} />
                        Initializing AR Engine...
                      </div>
                    )}
                  </div>
                </motion.div>

              </div>
            </div>
          </section>

          {/* ===== HOW IT WORKS ===== */}
          <section style={{ padding: "100px 0", position: "relative" }}>
            <div className="container-custom">
              <div style={{ textAlign: "center", marginBottom: "60px" }}>
                <span className="section-label">Langkah Sederhana</span>
                <h2 style={{ fontSize: "2.5rem", fontWeight: 700 }}>Bagaimana Cara Kerjanya?</h2>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "30px" }}>
                {[
                  { icon: ScanLine, title: "1. Scan QR", desc: "Arahkan kamera HP Anda ke layar laptop untuk scan QR Code." },
                  { icon: Globe2, title: "2. Buka Link", desc: "Klik link yang muncul. Tidak perlu mendownload aplikasi apa pun." },
                  { icon: Camera, title: "3. Arahkan Kamera", desc: "Berikan izin kamera, lalu sorot gambar target yang ditentukan." },
                  { icon: Cuboid, title: "4. 3D Muncul", desc: "Objek 3D akan melayang dan menempel pada gambar dunia nyata!" }
                ].map((step, idx) => (
                  <motion.div 
                    key={idx}
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                    variants={fadeInUp}
                    className="glass-card"
                    style={{ padding: "30px", textAlign: "center" }}
                  >
                    <div style={{ width: "64px", height: "64px", background: "rgba(59, 130, 246, 0.1)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", border: "1px solid rgba(59, 130, 246, 0.2)", color: "var(--accent)" }}>
                      <step.icon size={32} />
                    </div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "12px" }}>{step.title}</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== FEATURES GRID ===== */}
          <section style={{ padding: "100px 0" }}>
            <div className="container-custom">
              <div style={{ textAlign: "center", marginBottom: "60px" }}>
                <span className="section-label">Kemampuan Sistem</span>
                <h2 style={{ fontSize: "2.5rem", fontWeight: 700 }}>Fitur Premium AR</h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                {[
                  { icon: Zap, title: "Real Time AR", desc: "Pelacakan super cepat dan mulus tanpa jeda menggunakan MindAR engine." },
                  { icon: Layers, title: "Image Tracking", desc: "Ubah poster, buku, atau kartu nama fisik menjadi marker AR yang interaktif." },
                  { icon: Box, title: "Model GLB Support", desc: "Mendukung format 3D web-standard (GLB/GLTF) dengan kualitas render tinggi." },
                  { icon: MonitorSmartphone, title: "Cross Platform", desc: "Berjalan sempurna di iOS, Android, maupun Tablet langsung dari browser." },
                  { icon: Cloud, title: "Cloud Integration", desc: "Sistem upload dinamis terhubung ke ImgBB untuk penyajian data lintas perangkat." }
                ].map((feature, idx) => (
                  <motion.div 
                    key={idx}
                    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                    className="glass-card"
                    style={{ padding: "32px", display: "flex", gap: "20px", alignItems: "flex-start" }}
                  >
                    <div className="feature-icon-box">
                      <feature.icon size={28} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>{feature.title}</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== TECH STACK ===== */}
          <section style={{ padding: "80px 0 120px" }}>
            <div className="container-custom">
              <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <p style={{ color: "var(--text-tertiary)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.85rem" }}>
                  Didukung Oleh Teknologi Terdepan
                </p>
              </div>
              
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
                {["Three.js", "WebXR", "MindAR", "Next.js", "React", "TypeScript", "TailwindCSS"].map((tech, i) => (
                  <div key={i} className="glass-card" style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: "8px", borderRadius: "100px", background: "rgba(255,255,255,0.02)" }}>
                    <Cpu size={16} color="var(--primary)" />
                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{tech}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* ===== FOOTER ===== */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(20px)" }}>
          <div className="container-custom" style={{ padding: "60px 24px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "40px" }}>
            <div style={{ maxWidth: "300px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 800, fontSize: "1.5rem", marginBottom: "16px" }}>
                <Cuboid color="var(--primary)" size={32} />
                <span className="gradient-text">AR Vision 3D</span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                Platform inovatif untuk menghidupkan objek fisik ke dalam dimensi 3D melalui teknologi Web AR.
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "40px" }}>
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: "16px", color: "white" }}>Navigasi</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Link href="/create" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem" }}>Buat Target AR</Link>
                  <Link href="/ar" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem" }}>Kamera AR</Link>
                </div>
              </div>
              
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: "16px", color: "white" }}>Sosial</h4>
                <div style={{ display: "flex", gap: "12px" }}>
                  <Link href="#" className="btn-icon" style={{ width: "40px", height: "40px" }}><Code size={18} /></Link>
                  <Link href="#" className="btn-icon" style={{ width: "40px", height: "40px" }}><User size={18} /></Link>
                  <Link href="#" className="btn-icon" style={{ width: "40px", height: "40px" }}><Mail size={18} /></Link>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
            © {new Date().getFullYear()} AR Vision 3D. All rights reserved. | Version 2.0
          </div>
        </footer>
      </div>
    </>
  );
}
