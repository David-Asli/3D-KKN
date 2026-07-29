"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon, UploadCloud, Loader2 } from "lucide-react";
import QRCodeDisplay from "../components/QRCodeDisplay";

const IMGBB_API_KEY = "4e6c1e8e810c3cea1e4d2003401261ee";

export default function CreateAR() {
  const [loading, setLoading] = useState(false);
  const [arUrl, setArUrl] = useState<string | null>(null);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setArUrl(null);

    // Create a local preview immediately
    const localUrl = URL.createObjectURL(file);
    setTargetImage(localUrl);

    try {
      // Prepare form data for ImgBB
      const formData = new FormData();
      formData.append("image", file);

      // Upload to ImgBB
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const cloudImageUrl = data.data.url;
        // Generate the dynamic AR URL
        const generatedUrl = `${window.location.origin}/ar?img=${encodeURIComponent(cloudImageUrl)}`;
        setArUrl(generatedUrl);
      } else {
        setError("Gagal meng-upload gambar ke server. Coba lagi.");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan jaringan.");
    }

    setLoading(false);
  };

  return (
    <>
      <div className="bg-gradient-animated" />
      <div className="grid-overlay" />
      <div className="noise-overlay" />
      
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", padding: "40px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" }}>
            <Link href="/" className="btn-icon" style={{ textDecoration: "none" }}>
              <ArrowLeft size={20} />
            </Link>
            <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Kembali ke Beranda</span>
          </div>

          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 className="gradient-text-primary" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, marginBottom: "16px", letterSpacing: "-0.02em" }}>
              Cloud AR Studio
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "500px", margin: "0 auto" }}>
              Upload poster atau gambar Anda ke sistem Cloud kami untuk menghasilkan target 3D secara instan.
            </p>
          </div>

          <div className="glass-card fade-in" style={{ padding: "50px 30px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
            {!arUrl ? (
              <>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                  <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}>
                    <ImageIcon size={40} />
                  </div>
                </div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "24px" }}>
                  Pilih Gambar Target
                </h2>
                
                {error && (
                  <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "16px", borderRadius: "12px", color: "var(--danger)", marginBottom: "24px", fontSize: "0.95rem" }}>
                    {error}
                  </div>
                )}

                <label
                  className={loading ? "" : "btn-primary"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "16px 36px",
                    background: loading ? "rgba(255,255,255,0.05)" : undefined,
                    color: loading ? "var(--text-tertiary)" : "white",
                    fontWeight: 600,
                    borderRadius: "99px",
                    cursor: loading ? "not-allowed" : "pointer",
                    border: loading ? "1px solid rgba(255,255,255,0.1)" : "none",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="spin-animation" /> 
                      Mengunggah ke Cloud...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={20} />
                      Upload Gambar Target
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                    disabled={loading}
                  />
                </label>
                
                {loading && (
                  <p style={{ marginTop: "24px", fontSize: "0.9rem", color: "var(--text-tertiary)" }}>
                    Sistem sedang memproses gambar Anda melalui jaringan ImgBB agar dapat diakses secara global...
                  </p>
                )}
                
                <style>{`
                  .spin-animation {
                    animation: spin 1s linear infinite;
                  }
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </>
            ) : (
              <div className="fade-in">
                <QRCodeDisplay url={arUrl} targetImage={targetImage || undefined} />
                <button 
                  onClick={() => { setArUrl(null); setTargetImage(null); }}
                  className="btn-secondary"
                  style={{ marginTop: "30px", width: "100%" }}
                >
                  <UploadCloud size={18} /> Buat AR Baru
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
