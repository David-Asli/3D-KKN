"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import ImageUploader from "../components/ImageUploader";
import QRCodeDisplay from "../components/QRCodeDisplay";
import {
  compileImageTarget,
  imageFileToHTMLImage,
  fileToDataUrl,
} from "../lib/compiler";
import { saveTarget, generateId } from "../lib/storage";

type CreateStep = "upload" | "compiling" | "done";

export default function CreatePage() {
  const [step, setStep] = useState<CreateStep>("upload");
  const [progress, setProgress] = useState(0);
  const [arUrl, setArUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleImageSelected = useCallback(
    async (file: File) => {
      try {
        setStep("compiling");
        setProgress(0);
        setError(null);

        // Get data URL for preview/storage
        const dataUrl = await fileToDataUrl(file);
        setImageDataUrl(dataUrl);

        // Convert to HTMLImageElement for compiler
        const img = await imageFileToHTMLImage(file);

        // Compile image to .mind
        const mindBuffer = await compileImageTarget(img, (p) => {
          setProgress(Math.round(p * 100));
        });

        // Generate unique ID and save to IndexedDB
        const id = generateId();
        await saveTarget({
          id,
          mindData: mindBuffer,
          imageDataUrl: dataUrl,
          imageName: file.name,
          createdAt: Date.now(),
        });

        // Generate AR URL
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/ar?id=${id}`;
        setArUrl(url);
        setStep("done");
      } catch (err) {
        console.error("Compilation error:", err);
        setError(
          err instanceof Error ? err.message : "Gagal compile gambar. Coba lagi."
        );
        setStep("upload");
      }
    },
    []
  );

  return (
    <>
      {/* Background Effects */}
      <div className="bg-gradient-animated" />
      <div className="grid-overlay" />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Navbar */}
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
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: 700,
              fontSize: "1.15rem",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>🔮</span>
            <span className="gradient-text">AR Vision 3D</span>
          </Link>
          <Link
            href="/ar"
            className="btn-secondary"
            style={{ padding: "10px 20px", fontSize: "0.85rem" }}
          >
            Demo AR →
          </Link>
        </nav>

        {/* Main Content */}
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "120px 24px 80px",
          }}
        >
          <div style={{ maxWidth: "600px", width: "100%" }}>
            {/* Header */}
            <div
              style={{ textAlign: "center", marginBottom: "40px" }}
              className="fade-in"
            >
              <div className="section-label">Buat AR Experience</div>
              <h1
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  marginBottom: "12px",
                }}
              >
                Upload Gambar,{" "}
                <span className="gradient-text">Dapatkan QR</span>
              </h1>
              <p
                style={{
                  color: "rgba(232,232,240,0.5)",
                  fontSize: "1rem",
                  lineHeight: 1.6,
                }}
              >
                Upload gambar target, kami compile menjadi AR marker, dan
                generate QR code. Siapapun yang scan QR bisa melihat 3D!
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: "14px 20px",
                  background: "rgba(255, 59, 48, 0.1)",
                  border: "1px solid rgba(255, 59, 48, 0.2)",
                  borderRadius: "12px",
                  color: "#ff6b6b",
                  fontSize: "0.9rem",
                  marginBottom: "20px",
                  textAlign: "center",
                }}
              >
                ❌ {error}
              </div>
            )}

            {/* Step: Upload */}
            {step === "upload" && (
              <div className="fade-in fade-in-delay-1">
                <ImageUploader onImageSelected={handleImageSelected} />

                {/* Tips */}
                <div
                  className="glass-card"
                  style={{
                    marginTop: "24px",
                    padding: "24px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      marginBottom: "12px",
                    }}
                  >
                    💡 Tips untuk gambar target terbaik:
                  </h3>
                  <ul
                    style={{
                      color: "rgba(232,232,240,0.5)",
                      fontSize: "0.85rem",
                      lineHeight: 1.8,
                      paddingLeft: "20px",
                    }}
                  >
                    <li>Gunakan gambar dengan <strong style={{ color: "var(--foreground)" }}>kontras tinggi</strong></li>
                    <li>Hindari gambar yang terlalu gelap atau terlalu terang</li>
                    <li>Gambar dengan <strong style={{ color: "var(--foreground)" }}>banyak detail/pattern</strong> lebih mudah di-track</li>
                    <li>Hindari gambar dengan area kosong/solid besar</li>
                    <li>Resolusi minimal <strong style={{ color: "var(--foreground)" }}>300x300px</strong> direkomendasikan</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step: Compiling */}
            {step === "compiling" && (
              <div
                className="glass-card fade-in"
                style={{
                  padding: "48px 32px",
                  textAlign: "center",
                }}
              >
                {/* Preview */}
                {imageDataUrl && (
                  <img
                    src={imageDataUrl}
                    alt="Target"
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "16px",
                      margin: "0 auto 24px",
                      border: "2px solid var(--glass-border)",
                    }}
                  />
                )}

                {/* Spinner */}
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    margin: "0 auto 20px",
                    borderRadius: "50%",
                    border: "3px solid rgba(108, 99, 255, 0.2)",
                    borderTopColor: "var(--accent-primary)",
                    animation: "spin 1s linear infinite",
                  }}
                />

                <h3
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    marginBottom: "8px",
                  }}
                >
                  Compiling AR Target...
                </h3>
                <p
                  style={{
                    color: "rgba(232,232,240,0.4)",
                    fontSize: "0.9rem",
                    marginBottom: "24px",
                  }}
                >
                  Menganalisis gambar dan membuat AR marker. Ini mungkin
                  memakan waktu beberapa detik.
                </p>

                {/* Progress bar */}
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "4px",
                    overflow: "hidden",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: "var(--gradient-2)",
                      borderRadius: "4px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <p
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--accent-secondary)",
                  }}
                >
                  {progress}%
                </p>

                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Step: Done */}
            {step === "done" && (
              <div className="fade-in">
                <QRCodeDisplay url={arUrl} targetImage={imageDataUrl} />

                {/* Create another */}
                <div style={{ textAlign: "center", marginTop: "24px" }}>
                  <button
                    onClick={() => {
                      setStep("upload");
                      setProgress(0);
                      setArUrl("");
                      setImageDataUrl("");
                    }}
                    className="btn-secondary"
                    style={{ padding: "12px 24px", fontSize: "0.9rem" }}
                  >
                    ➕ Buat Lagi
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
