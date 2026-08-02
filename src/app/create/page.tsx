"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, UploadCloud, Loader2, Box, LogOut, Trash2, CheckCircle2 } from "lucide-react";
import QRCodeDisplay from "../components/QRCodeDisplay";
import { supabase } from "@/lib/supabase";

import { compileImageTarget, imageDataUrlToHTMLImage, resizeImage } from "../lib/compiler";

const IMGBB_API_KEY = "4e6c1e8e810c3cea1e4d2003401261ee";

interface ARTarget {
  id: string;
  image_url: string;
  model_url: string | null;
  mind_url: string | null;
  created_at: string;
}

export default function CreateAR() {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Mengunggah ke Cloud...");
  const [arUrl, setArUrl] = useState<string | null>(null);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<File | null>(null);
  
  const [targetImagePreview, setTargetImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<ARTarget[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  const router = useRouter();

  const fetchHistory = async () => {
    setFetchingHistory(true);
    const { data, error } = await supabase
      .from("ar_targets")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setHistory(data);
    setFetchingHistory(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleMakeActive = async (id: string) => {
    const { error } = await supabase
      .from("ar_targets")
      .update({ created_at: new Date().toISOString() })
      .eq("id", id);
      
    if (!error) {
      fetchHistory();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    const { error } = await supabase
      .from("ar_targets")
      .delete()
      .eq("id", id);
      
    if (!error) {
      fetchHistory();
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Failed to logout", err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setTargetImagePreview(URL.createObjectURL(file));
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedModel(file);
  };

  const handleUploadAndGenerate = async () => {
    if (!selectedImage) {
      setError("Silakan pilih gambar target terlebih dahulu.");
      return;
    }

    setLoading(true);
    setLoadingText("Menganalisis dan Membangun Target AR (Sekitar 10 Detik)...");
    setError(null);
    setArUrl(null);

    try {
      let cloudImageUrl = "";
      let cloudModelUrl = "";

      setLoadingText("Mengunggah Poster ke Cloud...");

      // 1. Upload to ImgBB
      const formData = new FormData();
      formData.append("image", selectedImage);
      const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      });
      const imgData = await imgRes.json();
      
      if (!imgData.success) {
        throw new Error("Gagal meng-upload gambar ke server.");
      }
      cloudImageUrl = imgData.data.url;

      // 3. Upload to Vercel Blob (if 3D model is provided)
      if (selectedModel) {
        setLoadingText("Mengunggah 3D Model ke Cloud...");
        const response = await fetch(
          `/api/upload-model?filename=${encodeURIComponent(selectedModel.name)}`,
          {
            method: 'POST',
            body: selectedModel,
          }
        );
        
        if (!response.ok) {
          if (response.status === 413) {
            throw new Error("Gagal upload: Ukuran file 3D terlalu besar (Maksimal 4.5MB untuk server Vercel).");
          }
          throw new Error(`Gagal meng-upload file 3D (Status: ${response.status})`);
        }
        
        const blob = await response.json();
        if (!blob.url) {
          throw new Error(blob.error || "Gagal meng-upload file 3D ke Blob Storage.");
        }
        cloudModelUrl = blob.url;
      }

      setLoadingText("Menyimpan ke Database...");

      // 3. Simpan ke Database Supabase
      const { error: dbError } = await supabase
        .from("ar_targets")
        .insert([
          {
            image_url: cloudImageUrl,
            model_url: cloudModelUrl || null,
          }
        ]);

      if (dbError) {
        console.error("Supabase error:", dbError);
        throw new Error("Gagal menyimpan data ke database Supabase.");
      }

      await fetchHistory();

      // 5. Generate AR URL (fallback jika diperlukan)
      let generatedUrl = `${window.location.origin}/ar?img=${encodeURIComponent(cloudImageUrl)}`;
      if (cloudModelUrl) {
        generatedUrl += `&model=${encodeURIComponent(cloudModelUrl)}`;
      }
      
      setArUrl(generatedUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan jaringan.");
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
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Link href="/" className="btn-icon" style={{ textDecoration: "none" }}>
                <ArrowLeft size={20} />
              </Link>
              <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Kembali ke Beranda</span>
            </div>
            
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: "8px 16px", gap: "8px", fontSize: "0.9rem" }}>
              <LogOut size={16} /> Logout Admin
            </button>
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
                <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}>
                    <ImageIcon size={40} />
                  </div>
                  <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "rgba(0, 212, 255, 0.1)", border: "1px solid rgba(0, 212, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00d4ff" }}>
                    <Box size={40} />
                  </div>
                </div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "24px" }}>
                  Pilih Gambar & Model 3D
                </h2>
                
                {error && (
                  <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "16px", borderRadius: "12px", color: "var(--danger)", marginBottom: "24px", fontSize: "0.95rem" }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px", alignItems: "center" }}>
                  {/* Image Input */}
                  <label className="btn-secondary" style={{ display: "flex", width: "100%", maxWidth: "320px", justifyContent: "center", alignItems: "center", gap: "12px", padding: "14px", cursor: "pointer" }}>
                    <ImageIcon size={20} />
                    {selectedImage ? selectedImage.name : "1. Pilih Gambar Target"}
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} style={{ display: "none" }} />
                  </label>
                  
                  {/* Model Input */}
                  <label className="btn-secondary" style={{ display: "flex", width: "100%", maxWidth: "320px", justifyContent: "center", alignItems: "center", gap: "12px", padding: "14px", cursor: "pointer" }}>
                    <Box size={20} />
                    {selectedModel ? selectedModel.name : "2. Pilih File 3D (.glb) - Opsional"}
                    <input type="file" accept=".glb,.gltf" onChange={handleModelChange} style={{ display: "none" }} />
                  </label>
                </div>

                <button
                  onClick={handleUploadAndGenerate}
                  disabled={loading || !selectedImage}
                  className={loading ? "" : "btn-primary"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "16px 36px",
                    background: loading || !selectedImage ? "rgba(255,255,255,0.05)" : undefined,
                    color: loading || !selectedImage ? "var(--text-tertiary)" : "white",
                    fontWeight: 600,
                    borderRadius: "99px",
                    cursor: loading || !selectedImage ? "not-allowed" : "pointer",
                    border: loading || !selectedImage ? "1px solid rgba(255,255,255,0.1)" : "none",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="spin-animation" /> 
                      {loadingText}
                    </>
                  ) : (
                    <>
                      <UploadCloud size={20} />
                      Generate AR
                    </>
                  )}
                </button>
                
                {loading && (
                  <p style={{ marginTop: "24px", fontSize: "0.9rem", color: "var(--text-tertiary)" }}>
                    Sistem sedang memproses file Anda ke Cloud agar dapat diakses dari mana saja secara instan...
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
                <QRCodeDisplay url={arUrl} targetImage={targetImagePreview || undefined} />
                <button 
                  onClick={() => { setArUrl(null); setSelectedImage(null); setSelectedModel(null); setTargetImagePreview(null); }}
                  className="btn-secondary"
                  style={{ marginTop: "30px", width: "100%" }}
                >
                  <UploadCloud size={18} /> Buat AR Baru
                </button>
              </div>
            )}
          </div>

          {/* GALLERY SECTION */}
          <div style={{ marginTop: "60px", marginBottom: "40px" }}>
            <h2 className="gradient-text-primary" style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "24px", textAlign: "center" }}>
              Riwayat Upload
            </h2>
            
            {fetchingHistory ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                <Loader2 size={32} className="spin-animation" style={{ color: "var(--primary)" }} />
              </div>
            ) : history.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-tertiary)" }}>Belum ada data AR yang di-upload.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                {history.map((item, index) => {
                  const isActive = index === 0;
                  
                  return (
                    <div key={item.id} className="glass-card fade-in" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px", position: "relative" }}>
                      {isActive && (
                        <div style={{ position: "absolute", top: "-12px", right: "-12px", background: "linear-gradient(135deg, #00d4ff, #6c63ff)", color: "white", padding: "4px 12px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", boxShadow: "0 4px 12px rgba(108, 99, 255, 0.4)", zIndex: 2 }}>
                          <CheckCircle2 size={14} /> Sedang Aktif
                        </div>
                      )}
                      
                      <div style={{ position: "relative", width: "100%", height: "200px", borderRadius: "12px", overflow: "hidden", background: "rgba(0,0,0,0.2)" }}>
                        <img src={item.image_url} alt="Target" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {item.model_url && (
                          <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", color: "white", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Box size={12} color="#00d4ff" /> 3D Model
                          </div>
                        )}
                      </div>
                      
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Di-upload: {new Date(item.created_at).toLocaleString("id-ID")}
                      </div>
                      
                      <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                        {!isActive && (
                          <button onClick={() => handleMakeActive(item.id)} className="btn-primary" style={{ flex: 1, padding: "8px", fontSize: "0.85rem", borderRadius: "8px", display: "flex", justifyContent: "center", border: "none", color: "white", cursor: "pointer" }}>
                            Gunakan Ini
                          </button>
                        )}
                        <button onClick={() => handleDelete(item.id)} className="btn-secondary" style={{ padding: "8px", borderRadius: "8px", color: "#ff4444", flex: isActive ? 1 : "unset", display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", border: "none", cursor: "pointer" }}>
                          <Trash2 size={16} /> {isActive && "Hapus"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
