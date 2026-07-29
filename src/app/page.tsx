"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCodeDisplay from "./components/QRCodeDisplay";

export default function Home() {
  const [arUrl, setArUrl] = useState<string>("");

  useEffect(() => {
    // Generate the AR URL dynamically based on the current domain
    setArUrl(`${window.location.origin}/ar`);
  }, []);

  return (
    <>
      {/* Background Effects */}
      <div className="bg-gradient-animated" />
      <div className="grid-overlay" />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ===== NAVBAR ===== */}
        <nav
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            padding: "16px 24px",
            display: "flex",
            justifyContent: "center", // Centered for simplicity
            alignItems: "center",
            background: "rgba(5, 5, 16, 0.7)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: 700,
              fontSize: "1.15rem",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>🔮</span>
            <span className="gradient-text">AR Vision 3D</span>
          </div>
        </nav>

        {/* ===== HERO SECTION ===== */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "100px 24px 80px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Floating Orbs */}
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />

          <div
            style={{
              maxWidth: "820px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "32px",
            }}
          >
            {/* Title */}
            <h1
              className="fade-in"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              Scan QR Code Ini, <br />
              <span className="gradient-text">Lihat 3D Muncul</span>
            </h1>

            {/* Description */}
            <p
              className="fade-in fade-in-delay-1"
              style={{
                fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
                color: "rgba(232, 232, 240, 0.8)",
                lineHeight: 1.6,
                maxWidth: "600px",
                marginBottom: "10px",
              }}
            >
              1. Arahkan kamera HP Anda ke QR Code di bawah. <br />
              2. Link akan terbuka, lalu arahkan kembali kamera HP Anda ke arah layar (ke gambar QR Code). <br />
              3. Objek 3D akan melayang langsung dari dalam layar Anda!
            </p>

            {/* QR CODE DISPLAY */}
            <div className="fade-in fade-in-delay-2" style={{ width: "100%", maxWidth: "450px" }}>
              {arUrl ? (
                <QRCodeDisplay url={arUrl} />
              ) : (
                <div style={{ padding: "100px", background: "rgba(255,255,255,0.05)", borderRadius: "16px" }}>
                  Memuat QR Code...
                </div>
              )}
            </div>
            
            {/* Manual button for testing on mobile */}
            <div className="fade-in fade-in-delay-3" style={{ marginTop: "20px", display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
              <Link href="/create" className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.9rem" }}>
                📸 Buat AR Anda
              </Link>
              <Link href="/ar" className="btn-secondary" style={{ padding: "10px 24px", fontSize: "0.9rem" }}>
                Buka Kamera AR
              </Link>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer
          style={{
            padding: "24px",
            textAlign: "center",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            color: "rgba(232,232,240,0.3)",
            fontSize: "0.85rem",
          }}
        >
          <p>
            © 2025 AR Vision 3D — QR Tracker
          </p>
        </footer>
      </div>
    </>
  );
}
