"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Box, Loader2, LogOut, Trash2, X, RotateCcw, Eye, Gift, Coffee, Sparkles, Download } from "lucide-react";
import html2canvas from "html2canvas";

const ModelViewer = 'model-viewer' as any;

interface SavedTarget {
  id: string; // user_collections ID
  created_at: string;
  ar_targets: {
    id: string;
    image_url: string;
    model_url: string | null;
  };
}

export default function CollectionsPage() {
  const [items, setItems] = useState<SavedTarget[]>([]);
  const [totalTargets, setTotalTargets] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [viewingModel, setViewingModel] = useState<string | null>(null);
  const [voucherInfo, setVoucherInfo] = useState<{ claimed: boolean; sequence: number | null }>({ claimed: false, sequence: null });
  const [claimError, setClaimError] = useState("");
  const [checking, setChecking] = useState(false);
  const router = useRouter();

  const handleClaimVoucher = async () => {
    setChecking(true);
    try {
      const claimedBy = localStorage.getItem("siampel_voucher_claimed_by");
      if (claimedBy && claimedBy !== userEmail) {
        setClaimError("Maaf, perangkat (HP) ini sudah pernah mengklaim voucher menggunakan akun lain.");
        setChecking(false);
        return;
      }

      // Check if user already claimed in DB
      const { data: existingClaim, error: fetchErr } = await supabase
        .from("voucher_claims")
        .select("id")
        .eq("user_email", userEmail)
        .single();

      if (existingClaim) {
        localStorage.setItem("siampel_voucher_claimed_by", userEmail);
        setVoucherInfo({ claimed: true, sequence: existingClaim.id });
        setClaimError("");
        setChecking(false);
        return;
      }

      // If not claimed, check global quota
      const { count, error: countErr } = await supabase
        .from("voucher_claims")
        .select("*", { count: 'exact', head: true });

      if (count !== null && count >= 20) {
        setClaimError("Maaf, kuota voucher (0/20) sudah habis diklaim.");
        setChecking(false);
        return;
      }

      // Try to claim
      const { data: newClaim, error: insertErr } = await supabase
        .from("voucher_claims")
        .insert([{ user_email: userEmail, device_id: 'browser' }])
        .select("id")
        .single();

      if (insertErr) {
        if (insertErr.code === '23505') { // unique violation
          const { data: retryClaim } = await supabase.from("voucher_claims").select("id").eq("user_email", userEmail).single();
          if (retryClaim) {
            localStorage.setItem("siampel_voucher_claimed_by", userEmail);
            setVoucherInfo({ claimed: true, sequence: retryClaim.id });
          }
        } else {
          throw insertErr;
        }
      } else if (newClaim) {
        localStorage.setItem("siampel_voucher_claimed_by", userEmail);
        setVoucherInfo({ claimed: true, sequence: newClaim.id });
        setClaimError("");
      }

    } catch (e) {
      console.error(e);
      setClaimError("Terjadi kesalahan saat mengklaim voucher.");
    } finally {
      setChecking(false);
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById("voucher-card");
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { backgroundColor: null, scale: 2 });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Voucher-Siampel-${userEmail}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download voucher", err);
    }
  };

  const fetchCollections = async (userId: string) => {
    try {
      // Ambil total semua target AR yang ada di database
      const { count, error: countError } = await supabase
        .from("ar_targets")
        .select('*', { count: 'exact', head: true });
        
      if (!countError && count !== null) {
        setTotalTargets(count);
      }

      // Fetch user_collections with ar_targets data
      const { data, error } = await supabase
        .from("user_collections")
        .select(`
          id,
          created_at,
          ar_targets (
            id,
            image_url,
            model_url
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching collections:", error);
      } else if (data) {
        setItems(data as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth");
        return;
      }

      setUserEmail(session.user.email || "");
      fetchCollections(session.user.id);
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleRemove = async (collectionId: string) => {
    try {
      const { error } = await supabase
        .from("user_collections")
        .delete()
        .eq("id", collectionId);
        
      if (error) throw error;
      
      // Update state locally
      setItems(items.filter(item => item.id !== collectionId));
    } catch (err) {
      console.error("Failed to remove item", err);
      alert("Gagal menghapus item dari koleksi.");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#050510" }}>
        <Loader2 size={40} className="spin-animation" style={{ color: "var(--primary)" }} />
        <style>{`
          .spin-animation { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {/* Load Google Model Viewer */}
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        strategy="afterInteractive"
      />

      <div className="bg-gradient-animated" />
      <div className="grid-overlay" />
      
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", padding: "40px 24px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Link href="/" className="btn-icon" style={{ textDecoration: "none" }}>
                <ArrowLeft size={20} />
              </Link>
              <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Kembali ke Beranda</span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{userEmail}</span>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: "8px 16px", gap: "8px", fontSize: "0.9rem" }}>
                <LogOut size={16} /> Keluar
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "40px" }}>
            <h1 className="gradient-text-primary" style={{ fontSize: "clamp(2rem, 3vw, 2.5rem)", fontWeight: 800, marginBottom: "8px", letterSpacing: "-0.02em" }}>
              Koleksi 3D Saya
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
              Kumpulan objek AR dan model 3D favorit yang Anda temukan.
            </p>
          </div>

          {/* VOUCHER UI */}
          {totalTargets > 0 && items.length >= totalTargets && (
            <div className="fade-in" style={{ marginBottom: "40px" }}>
              <div id="voucher-card" style={{
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                borderRadius: "20px",
                padding: "2px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 20px 40px -15px rgba(234, 179, 8, 0.3)"
              }}>
                {/* Animated glowing border effect */}
                <div style={{
                  position: "absolute",
                  top: "-50%",
                  left: "-50%",
                  width: "200%",
                  height: "200%",
                  background: "conic-gradient(from 0deg, transparent 0 340deg, #eab308 360deg)",
                  animation: "spin 4s linear infinite",
                  zIndex: 0
                }} />
                
                <div style={{
                  background: "linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98))",
                  backdropFilter: "blur(10px)",
                  borderRadius: "18px",
                  padding: "32px 24px",
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  border: "1px solid rgba(234, 179, 8, 0.2)"
                }}>
                  <div style={{
                    background: "rgba(234, 179, 8, 0.1)",
                    padding: "16px",
                    borderRadius: "50%",
                    marginBottom: "16px",
                    color: "#eab308",
                    border: "1px solid rgba(234, 179, 8, 0.3)"
                  }}>
                    <Coffee size={40} />
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <Sparkles size={20} color="#eab308" />
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#eab308", margin: 0 }}>
                      Koleksi Lengkap!
                    </h2>
                    <Sparkles size={20} color="#eab308" />
                  </div>
                  
                  <p style={{ color: "var(--text-primary)", fontSize: "1.1rem", marginBottom: "24px", maxWidth: "500px" }}>
                    Selamat! Anda telah menemukan semua karakter 3D. Tunjukkan layar ini ke kasir Siampel untuk mengklaim <strong>Voucher Gratis Minum</strong> Anda.
                  </p>
                  
                  {!voucherInfo.claimed ? (
                    <>
                      <button 
                        onClick={handleClaimVoucher}
                        disabled={checking}
                        style={{
                          background: checking ? "gray" : "linear-gradient(135deg, #eab308, #ca8a04)",
                          color: "#0f172a",
                          border: "none",
                          padding: "16px 32px",
                          borderRadius: "12px",
                          fontSize: "1.1rem",
                          fontWeight: 800,
                          cursor: checking ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          boxShadow: checking ? "none" : "0 4px 12px rgba(234, 179, 8, 0.4)",
                          transition: "transform 0.2s"
                        }}
                        onMouseOver={(e) => { if(!checking) e.currentTarget.style.transform = "scale(1.05)"; }}
                        onMouseOut={(e) => { if(!checking) e.currentTarget.style.transform = "scale(1)"; }}
                      >
                        {checking ? <Loader2 size={20} className="spin-animation" /> : <Gift size={20} />}
                        {checking ? "Memproses..." : "Klaim Voucher Sekarang"}
                      </button>
                      {claimError && (
                        <p style={{ color: "#ef4444", marginTop: "16px", fontSize: "0.95rem", fontWeight: 600, background: "rgba(239, 68, 68, 0.1)", padding: "12px", borderRadius: "8px" }}>
                          {claimError}
                        </p>
                      )}
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                      <div style={{
                        background: "rgba(0,0,0,0.5)",
                        border: "2px dashed rgba(234, 179, 8, 0.5)",
                        padding: "16px 32px",
                        borderRadius: "12px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <Gift size={24} color="#eab308" />
                          <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "white", letterSpacing: "2px" }}>
                            SIAMPEL-FREE
                          </span>
                        </div>
                        <div style={{ fontSize: "1rem", color: "#eab308", fontWeight: 600 }}>
                          Voucher #{String(voucherInfo.sequence).padStart(2, '0')} / 20
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                          {userEmail}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Download Button outside the card so it doesn't get captured in the image */}
              {voucherInfo.claimed && (
                <button 
                  onClick={handleDownload}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.2)",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    margin: "16px auto 0",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                >
                  <Download size={18} />
                  Unduh Gambar Voucher
                </button>
              )}
            </div>
          )}

          {items.length === 0 ? (
            <div className="glass-card fade-in" style={{ padding: "60px 20px", textAlign: "center", background: "rgba(255,255,255,0.02)" }}>
              <Box size={48} color="var(--text-tertiary)" style={{ margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "8px" }}>Belum ada koleksi</h2>
              <p style={{ color: "var(--text-secondary)", maxWidth: "400px", margin: "0 auto 24px" }}>
                Gunakan kamera AR untuk memindai target, lalu simpan model 3D favorit Anda ke dalam koleksi ini.
              </p>
              <Link href="/ar" className="btn-primary" style={{ display: "inline-flex", padding: "12px 24px" }}>
                Buka Kamera AR
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "24px" }}>
              {items.map((item) => (
                <div key={item.id} className="glass-card fade-in" style={{ display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", padding: 0 }}>
                  <div style={{ width: "100%", height: "220px", background: "rgba(0,0,0,0.4)", position: "relative" }}>
                    <img 
                      src={`/api/proxy-image?url=${encodeURIComponent(item.ar_targets?.image_url || "")}`} 
                      alt="Target" 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                    
                    {item.ar_targets?.model_url && (
                      <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "6px 10px", borderRadius: "8px", fontSize: "0.8rem", color: "white", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Box size={14} color="#00d4ff" /> 3D Model
                      </div>
                    )}
                  </div>
                  
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                        Disimpan: {new Date(item.created_at).toLocaleDateString("id-ID")}
                      </span>
                      <button 
                        onClick={() => handleRemove(item.id)}
                        style={{ background: "rgba(239, 68, 68, 0.1)", border: "none", color: "#ff4444", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                        title="Hapus dari koleksi"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                      {item.ar_targets?.model_url && (
                        <button
                          onClick={() => setViewingModel(item.ar_targets.model_url)}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "12px",
                            background: "linear-gradient(135deg, #6c63ff, #00d4ff)",
                            color: "white",
                            border: "none",
                            borderRadius: "10px",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            boxShadow: "0 4px 12px rgba(108, 99, 255, 0.3)"
                          }}
                        >
                          <Eye size={16} /> Lihat 3D
                        </button>
                      )}
                      <Link 
                        href="/ar"
                        className="btn-primary" 
                        style={{ flex: 1, justifyContent: "center", padding: "12px", fontSize: "0.9rem", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", gap: "8px" }}
                      >
                        <RotateCcw size={16} /> AR
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3D Model Viewer Modal */}
      {viewingModel && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(12px)",
            padding: "20px",
            animation: "modalFadeIn 0.3s ease-out"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingModel(null);
          }}
        >
          <div style={{
            width: "100%",
            maxWidth: "700px",
            height: "80vh",
            maxHeight: "600px",
            background: "rgba(20, 20, 30, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "24px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(108, 99, 255, 0.15)"
          }}>
            {/* Modal Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Box size={20} color="#00d4ff" />
                <span style={{ fontWeight: 600, fontSize: "1rem", color: "white" }}>3D Model Viewer</span>
              </div>
              <button
                onClick={() => setViewingModel(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  color: "white",
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s"
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Model Viewer */}
            <div style={{ flex: 1, position: "relative", background: "radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a14 100%)" }}>
              {/* @ts-ignore */}
              <ModelViewer
                src={viewingModel}
                alt="3D Model"
                auto-rotate
                camera-controls
                touch-action="pan-y"
                shadow-intensity="1"
                shadow-softness="0.5"
                exposure="1.2"
                environment-image="neutral"
                style={{
                  width: "100%",
                  height: "100%",
                  outline: "none",
                  // @ts-ignore
                  "--poster-color": "transparent",
                }}
              >
                <div slot="progress-bar" style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: "rgba(255,255,255,0.05)"
                }}>
                  <div style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #6c63ff, #00d4ff)",
                    animation: "loadProgress 2s ease-in-out infinite"
                  }} />
                </div>
              </ModelViewer>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "14px 24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              color: "var(--text-tertiary)",
              fontSize: "0.85rem"
            }}>
              <RotateCcw size={14} />
              <span>Geser untuk memutar • Cubit untuk zoom</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes loadProgress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .spin-animation { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
