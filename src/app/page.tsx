import Link from "next/link";

export default function Home() {
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
            justifyContent: "space-between",
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
          <Link href="/ar" className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.9rem" }}>
            Mulai AR ✨
          </Link>
        </nav>

        {/* ===== HERO SECTION ===== */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "120px 24px 80px",
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
            {/* Badge */}
            <div className="hero-badge fade-in">
              <span className="dot" />
              WebAR — Tanpa Install Aplikasi
            </div>

            {/* Title */}
            <h1
              className="fade-in fade-in-delay-1"
              style={{
                fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              Scan Gambar,{" "}
              <span className="gradient-text">Lihat 3D</span>{" "}
              Muncul di Layar
            </h1>

            {/* Description */}
            <p
              className="fade-in fade-in-delay-2"
              style={{
                fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
                color: "rgba(232, 232, 240, 0.6)",
                lineHeight: 1.7,
                maxWidth: "600px",
              }}
            >
              Arahkan kamera HP ke gambar target dan saksikan objek 3D muncul
              langsung di layar kamu. Pengalaman Augmented Reality premium,
              langsung di browser.
            </p>

            {/* CTA Buttons */}
            <div
              className="fade-in fade-in-delay-3"
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <Link href="/create" className="btn-primary">
                📸 Buat AR Kamu
              </Link>
              <Link href="/ar" className="btn-secondary">
                🚀 Coba Demo AR
              </Link>
            </div>

            {/* 3D Cube Preview */}
            <div className="fade-in fade-in-delay-4" style={{ marginTop: "20px" }}>
              <div className="cube-container">
                <div className="cube">
                  <div className="cube-face front">🎯</div>
                  <div className="cube-face back">📸</div>
                  <div className="cube-face right">🔮</div>
                  <div className="cube-face left">✨</div>
                  <div className="cube-face top">🌟</div>
                  <div className="cube-face bottom">📱</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CARA PAKAI ===== */}
        <section
          id="cara-pakai"
          style={{
            padding: "100px 24px",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <div className="section-label fade-in">Panduan</div>
            <h2
              className="fade-in fade-in-delay-1"
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              Cara <span className="gradient-text-2">Menggunakan</span>
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Step 1 */}
            <div className="glass-card fade-in fade-in-delay-1" style={{ padding: "32px 28px" }}>
              <div className="step-number" style={{ marginBottom: "20px" }}>1</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "10px" }}>
                Buka AR Camera
              </h3>
              <p style={{ color: "rgba(232,232,240,0.5)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                Klik tombol &ldquo;Mulai AR&rdquo; dan izinkan akses kamera pada perangkat kamu.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card fade-in fade-in-delay-2" style={{ padding: "32px 28px" }}>
              <div className="step-number" style={{ marginBottom: "20px" }}>2</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "10px" }}>
                Scan Gambar Target
              </h3>
              <p style={{ color: "rgba(232,232,240,0.5)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                Arahkan kamera ke gambar target yang sudah disediakan. Sistem akan mendeteksi gambar secara otomatis.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card fade-in fade-in-delay-3" style={{ padding: "32px 28px" }}>
              <div className="step-number" style={{ marginBottom: "20px" }}>3</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "10px" }}>
                Lihat 3D Muncul!
              </h3>
              <p style={{ color: "rgba(232,232,240,0.5)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                Objek 3D akan muncul di atas gambar. Gerakkan HP untuk melihat dari berbagai sudut.
              </p>
            </div>
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section
          style={{
            padding: "60px 24px 100px",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <div className="section-label fade-in">Fitur</div>
            <h2
              className="fade-in fade-in-delay-1"
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              Kenapa <span className="gradient-text-2">AR Vision 3D</span>?
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {[
              {
                icon: "🌐",
                title: "Langsung di Browser",
                desc: "Tidak perlu install aplikasi. Buka link, scan, selesai.",
              },
              {
                icon: "⚡",
                title: "Real-time Tracking",
                desc: "Pendeteksian gambar super cepat dengan teknologi machine learning.",
              },
              {
                icon: "📱",
                title: "Mobile Friendly",
                desc: "Dirancang untuk pengalaman terbaik di smartphone kamu.",
              },
              {
                icon: "🎨",
                title: "3D Interaktif",
                desc: "Objek 3D yang bisa dilihat dari berbagai sudut pandang.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`glass-card fade-in fade-in-delay-${i + 1}`}
                style={{
                  padding: "28px",
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <div>
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      marginBottom: "6px",
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      color: "rgba(232,232,240,0.5)",
                      lineHeight: 1.6,
                      fontSize: "0.9rem",
                    }}
                  >
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== BUAT AR KAMU ===== */}
        <section
          style={{
            padding: "80px 24px",
            textAlign: "center",
          }}
        >
          <div
            className="glass-card fade-in"
            style={{
              maxWidth: "700px",
              margin: "0 auto",
              padding: "60px 40px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div className="scan-line" />
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📸</div>
            <h2
              style={{
                fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                fontWeight: 800,
                marginBottom: "16px",
                letterSpacing: "-0.02em",
              }}
            >
              Buat <span className="gradient-text">AR Kamu</span> Sendiri
            </h2>
            <p
              style={{
                color: "rgba(232,232,240,0.5)",
                marginBottom: "32px",
                fontSize: "1.05rem",
                lineHeight: 1.6,
                maxWidth: "500px",
                margin: "0 auto 32px",
              }}
            >
              Upload gambar apapun, kami buatkan QR code-nya. Siapapun yang scan QR bisa melihat objek 3D muncul di atas gambar!
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/create" className="btn-primary">
                🎯 Buat Sekarang
              </Link>
              <Link href="/ar" className="btn-secondary">
                Coba Demo
              </Link>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer
          style={{
            padding: "32px 24px",
            textAlign: "center",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            color: "rgba(232,232,240,0.3)",
            fontSize: "0.85rem",
          }}
        >
          <p>
            © 2025 AR Vision 3D — Powered by{" "}
            <span className="gradient-text-2" style={{ fontWeight: 600 }}>
              MindAR.js
            </span>
          </p>
        </footer>
      </div>
    </>
  );
}
