"use client";

import { useState } from "react";
import Link from "next/link";
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
      
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", padding: "40px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" }}>
            <Link href="/" style={{ color: "rgba(232,232,240,0.5)", textDecoration: "none" }}>
              ← Kembali
            </Link>
          </div>

          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 className="gradient-text" style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "16px" }}>
              Buat AR Anda
            </h1>
            <p style={{ color: "rgba(232,232,240,0.7)", fontSize: "1.1rem" }}>
              Upload poster/gambar Anda. Kami akan mengubahnya menjadi target 3D.
            </p>
          </div>

          <div className="glass-card fade-in" style={{ padding: "40px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
            {!arUrl ? (
              <>
                <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🖼️</div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>
                  Pilih Gambar Target
                </h2>
                
                {error && (
                  <div style={{ background: "rgba(255, 50, 50, 0.1)", padding: "12px", borderRadius: "8px", color: "#ff8888", marginBottom: "20px", fontSize: "0.9rem" }}>
                    {error}
                  </div>
                )}

                <label
                  style={{
                    display: "inline-block",
                    padding: "16px 32px",
                    background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #6c63ff, #00d4ff)",
                    color: "white",
                    fontWeight: 600,
                    borderRadius: "14px",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.3s",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "Meng-upload ke Internet..." : "📁 Upload Gambar"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                    disabled={loading}
                  />
                </label>
                
                {loading && (
                  <p style={{ marginTop: "20px", fontSize: "0.9rem", color: "rgba(232,232,240,0.5)" }}>
                    Sedang memproses gambar Anda agar bisa diakses dari HP mana pun...
                  </p>
                )}
              </>
            ) : (
              <div className="fade-in">
                <QRCodeDisplay url={arUrl} targetImage={targetImage || undefined} />
                <button 
                  onClick={() => { setArUrl(null); setTargetImage(null); }}
                  className="btn-secondary"
                  style={{ marginTop: "20px", width: "100%" }}
                >
                  Buat AR Lainnya
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
