"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Box, Loader2, LogOut, Trash2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  const fetchCollections = async (userId: string) => {
    try {
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
      <div className="bg-gradient-animated" />
      <div className="grid-overlay" />
      
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", padding: "40px 24px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
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
                  
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
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
                    
                    <Link 
                      href={`/ar`}
                      className="btn-primary" 
                      style={{ marginTop: "auto", width: "100%", justifyContent: "center", padding: "12px" }}
                    >
                      Lihat di AR
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
