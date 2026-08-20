"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Image as ImageIcon, UploadCloud, Loader2, Box, LogOut, 
  Trash2, CheckCircle2, ShieldAlert, Cpu, Zap, Download, X,
  Trophy, Star, Shield, Medal, Settings
} from "lucide-react";
import QRCodeDisplay from "../components/QRCodeDisplay";
import { supabase } from "@/lib/supabase";

const RARITIES = [
  { name: "LEGENDARY", color: "#f59e0b", glow: "rgba(245, 158, 11, 0.6)", icon: Trophy },
  { name: "EPIC", color: "#c026d3", glow: "rgba(192, 38, 211, 0.6)", icon: Star },
  { name: "RARE", color: "#06b6d4", glow: "rgba(6, 182, 212, 0.6)", icon: Shield },
  { name: "COMMON", color: "#10b981", glow: "rgba(16, 185, 129, 0.6)", icon: Medal },
];

const getRarity = (id: string, customRarity?: string | null) => {
  if (customRarity && customRarity !== 'AUTO') {
    const found = RARITIES.find(r => r.name === customRarity);
    if (found) return found;
  }
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const val = hash % 100;
  if (val > 85) return RARITIES[0]; // Legendary 15%
  if (val > 60) return RARITIES[1]; // Epic 25%
  if (val > 25) return RARITIES[2]; // Rare 35%
  return RARITIES[3]; // Common 25%
};

const IMGBB_API_KEY = "4e6c1e8e810c3cea1e4d2003401261ee";

interface ARTarget {
  id: string;
  image_url: string;
  model_url: string | null;
  mind_url: string | null;
  created_at: string;
  rarity: string | null;
}

export default function CreateAR() {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("MENGUNGGAH KE CLOUD...");
  const [arUrl, setArUrl] = useState<string | null>(null);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<File | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<string>("AUTO");
  
  const [targetImagePreview, setTargetImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [history, setHistory] = useState<ARTarget[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  const [maxVouchers, setMaxVouchers] = useState<string>("20");
  const [savingSettings, setSavingSettings] = useState(false);

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

  const fetchSettings = async () => {
    const { data } = await supabase.from("app_settings").select("*").eq("setting_key", "max_vouchers").single();
    if (data) setMaxVouchers(data.setting_value);
  };

  useEffect(() => {
    fetchHistory();
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ setting_key: "max_vouchers", setting_value: maxVouchers });
    
    setSavingSettings(false);
    if (error) alert("Gagal menyimpan pengaturan: " + error.message);
    else alert("Pengaturan kuota berhasil disimpan!");
  };

  const handleDelete = async (id: string) => {
    setItemToDelete(null);
    const { error } = await supabase
      .from("ar_targets")
      .delete()
      .eq("id", id);
      
    if (!error) {
      fetchHistory();
    } else {
      alert("Gagal menghapus: " + error.message);
      console.error(error);
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
      setError("SYSTEM ERR: Silakan pilih gambar target terlebih dahulu.");
      return;
    }

    setLoading(true);
    setLoadingText("Menganalisis & Build Target AR (Sekitar 10 Detik)...");
    setError(null);
    setArUrl(null);

    try {
      let cloudImageUrl = "";
      let cloudModelUrl = "";

      setLoadingText("Mengunggah Poster ke Node Cloud...");

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

      if (selectedModel) {
        setLoadingText("Mengunggah Model 3D ke Storage...");
        
        try {
          const { upload } = await import('@vercel/blob/client');
          const blob = await upload(selectedModel.name, selectedModel, {
            access: 'public',
            handleUploadUrl: '/api/upload-model',
          });
          cloudModelUrl = blob.url;
        } catch (uploadError: any) {
          throw new Error("Gagal meng-upload file 3D: " + (uploadError.message || "Unknown error"));
        }
      }

      setLoadingText("Menyimpan ke Core Database...");

      const { error: dbError } = await supabase
        .from("ar_targets")
        .insert([
          {
            image_url: cloudImageUrl,
            model_url: cloudModelUrl || null,
            rarity: selectedRarity
          }
        ]);

      if (dbError) {
        throw new Error("Gagal menyimpan data ke database Supabase.");
      }

      await fetchHistory();

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
      <div className="game-bg">
        <div className="grid-overlay"></div>
        <div className="tech-lines"></div>
      </div>
      
      <div className="game-layout">
        
        {/* HUD Top Nav */}
        <nav className="hud-nav">
          <Link href="/" className="nav-btn text-cyan-400">
            <ArrowLeft size={18} />
            <span className="hide-mobile">KEMBALI KE BERANDA</span>
          </Link>
          
          <div className="nav-center">
            <div className="hud-badge"><Cpu size={14} className="badge-icon" /> ADMIN CLOUD STUDIO</div>
          </div>

          <button onClick={handleLogout} className="nav-btn text-red-400">
            <span className="hide-mobile">LOGOUT ADMIN</span>
            <LogOut size={16} />
          </button>
        </nav>

        <div className="inventory-container">
          
          {/* Sidebar Upload Form */}
          <aside className="inventory-sidebar upload-sidebar">
            <div className="sidebar-header">
              <UploadCloud size={16} /> TARGET AR BARU
            </div>
            
            <p className="sidebar-desc">
              Unggah aset gambar dan model 3D (opsional) untuk menambahkan target AR baru ke sistem Cloud.
            </p>

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <div className="upload-group">
              <label className="upload-slot">
                <div className="slot-icon"><ImageIcon size={18} /></div>
                <div className="slot-text">
                  <div className="slot-label text-cyan">GAMBAR TARGET (WAJIB)</div>
                  <div className="slot-val">{selectedImage ? selectedImage.name : "Pilih File (.jpg/.png)"}</div>
                </div>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} style={{ display: "none" }} />
              </label>

              <label className="upload-slot">
                <div className="slot-icon"><Box size={18} /></div>
                <div className="slot-text">
                  <div className="slot-label text-purple">MODEL 3D (OPSIONAL)</div>
                  <div className="slot-val">{selectedModel ? selectedModel.name : "Pilih File (.glb)"}</div>
                </div>
                <input type="file" accept=".glb" onChange={handleModelChange} style={{ display: "none" }} />
              </label>

              <div className="upload-slot" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8, cursor: "default" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div className="slot-icon"><Trophy size={18} /></div>
                  <div className="slot-label text-gold">RARITY / KELANGKAAN</div>
                </div>
                <select 
                  className="rarity-select"
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                >
                  <option value="AUTO">🎲 Otomatis (Gacha)</option>
                  <option value="LEGENDARY">🟡 LEGENDARY</option>
                  <option value="EPIC">🟣 EPIC</option>
                  <option value="RARE">🔵 RARE</option>
                  <option value="COMMON">🟢 COMMON</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleUploadAndGenerate}
              disabled={loading || !selectedImage}
              className={"btn-generate " + (loading || !selectedImage ? 'disabled' : '')}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> 
                  <span className="loading-txt">{loadingText}</span>
                </>
              ) : (
                <>
                  <Zap size={16} /> GENERATE TARGET AR
                </>
              )}
            </button>

            {/* Settings Area */}
            <div className="sidebar-header" style={{ marginTop: '24px' }}>
              <Settings size={16} /> PENGATURAN SISTEM
            </div>
            
            <div className="upload-group">
              <label className="upload-slot" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8, cursor: "default" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div className="slot-icon"><Trophy size={18} /></div>
                  <div className="slot-label text-gold">KUOTA MAKSIMAL VOUCHER</div>
                </div>
                <input 
                  type="number"
                  className="rarity-select"
                  value={maxVouchers}
                  onChange={(e) => setMaxVouchers(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.8)' }}
                />
              </label>
              <button 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="btn-generate"
                style={{ background: "transparent", border: "1px solid var(--gold)", color: "var(--gold)", marginTop: 0 }}
              >
                {savingSettings ? "MENYIMPAN..." : "SIMPAN KUOTA"}
              </button>
            </div>
            
          </aside>

          {/* Main Grid Area (History) */}
          <section className="inventory-main">
            
            {/* Top Bar: Progress */}
            <header className="inventory-header">
              <div className="progress-section">
                <div className="progress-labels">
                  <span className="progress-title">TARGET INVENTORY</span>
                  <span className="progress-count">
                    {history.length} TARGETS
                  </span>
                </div>
                <div className="progress-bar-thin">
                  <div className="progress-fill-thin" style={{ width: Math.min(100, (history.length / 50) * 100) + "%" }}></div>
                </div>
              </div>
            </header>

            {fetchingHistory ? (
              <div className="loading-state">
                <Loader2 size={32} className="spin text-cyan-400" />
                <p>SYNCING DATABASE...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="empty-inventory">
                <Box size={48} className="empty-icon" />
                <p>NO TARGETS UPLOADED YET</p>
              </div>
            ) : (
              <div className="slot-grid">
                {history.map((item, index) => {
                  const rarity = getRarity(item.id, item.rarity);
                  const rColor = rarity.color;
                  const rGlow = rarity.glow;
                  
                  return (
                    <div 
                      key={item.id} 
                      className="inventory-slot"
                      style={{ '--r-color': rColor, '--r-glow': rGlow, animationDelay: (0.05 * (index % 10)) + "s" } as any}
                    >
                      <div className="slot-inner">
                        {/* Background Image */}
                        <img 
                          src={"/api/proxy-image?url=" + encodeURIComponent(item.image_url)} 
                          alt="Item" 
                          className="slot-img"
                          loading="lazy"
                        />
                        <div className="slot-vignette"></div>

                        {/* Top Action / Badge */}
                        <div className="slot-top-layer">
                          <div className="rarity-badge" style={{ color: rarity.color, borderColor: rarity.color }}>
                            <rarity.icon size={12} /> {rarity.name}
                          </div>
                          <div className="slot-mini-actions">
                            <button onClick={(e) => { e.stopPropagation(); setItemToDelete(item.id); }} className="mini-btn del-btn">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Info Overlay */}
                        <div className="slot-info">
                          <div className="slot-name">TARGET_{item.id.substring(0,6).toUpperCase()}</div>
                          <div className="slot-type" style={{ color: rColor }}>
                            {item.model_url ? <><Box size={10} /> 3D MODEL</> : <><ImageIcon size={10} /> IMAGE ONLY</>}
                          </div>
                          <div className="slot-date">
                            {new Date(item.created_at).toLocaleString("id-ID")}
                          </div>
                        </div>

                        {/* Hover Overlay Actions */}
                        <div className="slot-hover-overlay">
                          <div className="slot-hover-actions">
                            <button 
                              className="action-circle danger"
                              onClick={() => setItemToDelete(item.id)}
                              title="Hapus Target"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Success Modal (QR Code) */}
      {arUrl && (
        <div className="hud-modal-backdrop">
          <div className="success-modal">
            <CheckCircle2 size={48} className="success-icon" />
            <h2 className="success-title">TARGET GENERATED!</h2>
            <div className="qr-box">
              <QRCodeDisplay url={arUrl} targetImage={targetImagePreview || undefined} />
            </div>
            <button 
              onClick={() => { setArUrl(null); setSelectedImage(null); setSelectedModel(null); setTargetImagePreview(null); setSelectedRarity("AUTO"); }}
              className="btn-close-success"
            >
              SELESAI
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="hud-modal-backdrop" style={{ zIndex: 999 }}>
          <div className="delete-modal">
            <div className="delete-icon"><ShieldAlert size={32} /></div>
            <h2>KONFIRMASI PENGHAPUSAN</h2>
            <p>Target AR ini akan dihapus dari Cloud Storage. Pengguna tidak akan bisa memindai gambar ini lagi. Lanjutkan?</p>
            <div className="delete-actions">
              <button onClick={() => setItemToDelete(null)} className="btn-cancel">BATAL</button>
              <button onClick={() => handleDelete(itemToDelete)} className="btn-confirm-del">YA, HAPUS</button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Game Inventory Styles */}
      <style>{`
        :root {
          --bg-game: #050b14;
          --panel-bg: rgba(15, 23, 42, 0.6);
          --hud-border: rgba(6, 182, 212, 0.3);
          --hud-text: #cbd5e1;
          --neon-cyan: #06b6d4;
          --gold: #f59e0b;
        }

        /* Layout & Background */
        .game-bg { position: fixed; inset: 0; z-index: 0; background: radial-gradient(circle at 50% 50%, #0f172a 0%, var(--bg-game) 80%); overflow: hidden; pointer-events: none; }
        .grid-overlay { position: absolute; inset: 0; background-image: linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px); background-size: 30px 30px; opacity: 0.5; }
        
        .game-layout { position: relative; z-index: 10; min-height: 100vh; display: flex; flex-direction: column; font-family: ui-sans-serif, system-ui, sans-serif; }

        /* Top HUD Nav */
        .hud-nav {
          position: sticky; top: 0; z-index: 50; background: rgba(5, 11, 20, 0.8); backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--hud-border); padding: 12px 24px; display: flex; justify-content: space-between; align-items: center;
        }
        .nav-btn { display: flex; align-items: center; gap: 8px; font-family: monospace; font-weight: 700; text-decoration: none; cursor: pointer; background: none; border: none; transition: 0.2s; }
        .nav-btn:hover { text-shadow: 0 0 8px currentColor; }
        .text-cyan-400 { color: #22d3ee; } .text-red-400 { color: #f87171; }
        .hud-badge { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 4px; font-family: monospace; font-size: 0.85rem; color: var(--hud-text); border: 1px solid rgba(255,255,255,0.1); }
        
        @media (max-width: 600px) { .hide-mobile { display: none; } }

        /* Main Container */
        .inventory-container {
          display: flex; flex: 1; max-width: 1400px; margin: 0 auto; width: 100%; padding: 24px; gap: 24px;
        }

        /* Sidebar (Upload Form) */
        .inventory-sidebar { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; background: var(--panel-bg); padding: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); height: fit-content; }
        .sidebar-header { font-family: monospace; font-weight: 800; color: #fff; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; font-size: 0.95rem; }
        .sidebar-desc { font-size: 0.85rem; color: var(--hud-text); line-height: 1.5; margin: 0; }
        
        .error-box { background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; color: #fca5a5; padding: 12px; font-size: 0.85rem; font-family: monospace; border-radius: 4px; }
        
        .upload-group { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
        .upload-slot { display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.5); border: 1px dashed rgba(255,255,255,0.2); padding: 12px; border-radius: 6px; cursor: pointer; transition: 0.2s; }
        .upload-slot:hover { border-color: var(--neon-cyan); background: rgba(255,255,255,0.05); }
        .slot-icon { color: var(--hud-text); }
        .upload-slot:hover .slot-icon { color: var(--neon-cyan); }
        .slot-text { display: flex; flex-direction: column; overflow: hidden; flex: 1; }
        .slot-label { font-family: monospace; font-size: 0.7rem; font-weight: 800; }
        .slot-val { font-size: 0.85rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .text-cyan { color: var(--neon-cyan); }
        .text-purple { color: #c026d3; }
        .text-gold { color: var(--gold); }
        .rarity-select { width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px; border-radius: 4px; font-family: monospace; outline: none; margin-top: 4px; cursor: pointer; }
        .rarity-select:focus { border-color: var(--gold); }
        
        .btn-generate { background: var(--neon-cyan); color: #000; border: none; padding: 14px; border-radius: 6px; font-family: monospace; font-weight: 800; font-size: 0.95rem; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: 0.2s; margin-top: 12px; }
        .btn-generate:hover:not(.disabled) { box-shadow: 0 0 15px var(--neon-cyan); transform: translateY(-2px); }
        .btn-generate.disabled { background: rgba(255,255,255,0.1); color: var(--hud-text); cursor: not-allowed; }
        
        @media (max-width: 800px) {
          .inventory-container { flex-direction: column; }
          .inventory-sidebar { width: 100%; }
        }

        /* Main Area */
        .inventory-main { flex: 1; display: flex; flex-direction: column; gap: 24px; min-width: 0; }

        /* Top Progress Bar */
        .inventory-header { display: flex; justify-content: space-between; align-items: center; background: var(--panel-bg); padding: 16px 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); gap: 16px; flex-wrap: wrap; }
        .progress-section { flex: 1; min-width: 200px; }
        .progress-labels { display: flex; justify-content: space-between; margin-bottom: 8px; font-family: monospace; font-size: 0.85rem; font-weight: 700; }
        .progress-title { color: var(--hud-text); } .progress-count { color: #fff; }
        
        .progress-bar-thin { height: 4px; background: rgba(0,0,0,0.5); border-radius: 2px; overflow: hidden; }
        .progress-fill-thin { height: 100%; background: var(--neon-cyan); box-shadow: 0 0 10px var(--neon-cyan); transition: 0.5s; }

        /* Loading & Empty States */
        .loading-state { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px; color: var(--neon-cyan); font-family: monospace; font-size: 1.1rem; gap: 16px; font-weight: 700; }
        .empty-inventory { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; background: rgba(0,0,0,0.2); border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; color: var(--hud-text); text-align: center; }
        .empty-icon { opacity: 0.3; margin-bottom: 16px; }
        .empty-inventory p { font-family: monospace; font-size: 1rem; font-weight: 700; letter-spacing: 1px; margin: 0; }

        /* Slot Grid */
        .slot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          align-content: start;
        }
        @media (max-width: 500px) { .slot-grid { grid-template-columns: repeat(2, 1fr); } }

        /* Slot Item */
        .inventory-slot {
          aspect-ratio: 1 / 1.1; /* slightly taller for date */
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          position: relative;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: slotPopIn 0.3s backwards;
        }
        
        .inventory-slot:hover {
          transform: scale(1.05);
          z-index: 10;
          border-color: var(--r-color);
          box-shadow: 0 0 20px var(--r-glow), inset 0 0 15px var(--r-glow);
        }

        .slot-inner { position: absolute; inset: 4px; border-radius: 4px; overflow: hidden; background: #000; }
        
        .slot-img { width: 100%; height: 100%; object-fit: cover; transition: 0.3s; }
        .inventory-slot:hover .slot-img { transform: scale(1.1); filter: brightness(1.2); }
        
        .slot-vignette { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 30%, transparent 70%); pointer-events: none; }

        /* Top Layer & Actions */
        .slot-top-layer { position: absolute; top: 8px; left: 8px; right: 8px; display: flex; justify-content: space-between; align-items: flex-start; z-index: 5; pointer-events: none; }
        .active-badge { background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #10b981; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 0.65rem; font-weight: 800; display: flex; align-items: center; gap: 4px; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
        .rarity-badge { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 0.6rem; font-weight: 800; display: flex; align-items: center; gap: 4px; border: 1px solid; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        
        .slot-mini-actions { margin-left: auto; opacity: 0; transition: 0.2s; pointer-events: auto; }
        .inventory-slot:hover .slot-mini-actions { opacity: 1; }
        .mini-btn { width: 24px; height: 24px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; display: flex; justify-content: center; align-items: center; color: #fff; cursor: pointer; transition: 0.2s; }
        .mini-btn.del-btn:hover { background: #ef4444; border-color: #f87171; }

        /* Info Overlay (Bottom) */
        .slot-info { position: absolute; bottom: 12px; left: 12px; right: 12px; z-index: 5; pointer-events: none; }
        .slot-name { font-family: monospace; font-size: 0.9rem; font-weight: 800; color: #fff; text-shadow: 0 1px 4px #000; line-height: 1.2; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .slot-type { display: flex; align-items: center; gap: 4px; font-family: monospace; font-size: 0.65rem; font-weight: 700; }
        .slot-date { font-family: monospace; font-size: 0.6rem; color: var(--hud-text); margin-top: 4px; opacity: 0.8; }

        /* Hover Overlay Actions (Center) */
        .slot-hover-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; opacity: 0; transition: 0.2s; backdrop-filter: blur(2px); }
        .inventory-slot:hover .slot-hover-overlay { opacity: 1; }
        
        .slot-hover-actions { display: flex; gap: 12px; transform: translateY(10px); transition: 0.3s; }
        .inventory-slot:hover .slot-hover-actions { transform: translateY(0); }
        
        .action-circle {
          width: 44px; height: 44px; border-radius: 50%; display: flex; justify-content: center; align-items: center;
          cursor: pointer; border: none; color: #fff; transition: 0.2s; text-decoration: none;
        }
        .action-circle.primary { background: rgba(16, 185, 129, 0.3); border: 2px solid #10b981; color: #10b981; }
        .action-circle.primary:hover { background: #10b981; color: #000; box-shadow: 0 0 15px #10b981; transform: scale(1.1); }
        .action-circle.danger { background: rgba(239, 68, 68, 0.3); border: 2px solid #ef4444; color: #ef4444; }
        .action-circle.danger:hover { background: #ef4444; color: #fff; box-shadow: 0 0 15px #ef4444; transform: scale(1.1); }

        /* Modals */
        .hud-modal-backdrop { position: fixed; inset: 0; z-index: 999; background: rgba(3, 7, 18, 0.9); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s; }
        
        .success-modal { background: #0f172a; border: 2px solid var(--neon-cyan); border-radius: 12px; padding: 32px; text-align: center; max-width: 400px; width: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(6, 182, 212, 0.2); animation: popIn 0.3s; }
        .success-icon { color: var(--neon-cyan); margin: 0 auto 16px; filter: drop-shadow(0 0 10px var(--neon-cyan)); }
        .success-title { font-family: monospace; font-size: 1.5rem; color: #fff; margin: 0 0 24px; letter-spacing: 1px; }
        .qr-box { background: #fff; padding: 16px; border-radius: 8px; display: inline-block; margin-bottom: 24px; }
        .btn-close-success { background: var(--neon-cyan); color: #000; border: none; width: 100%; padding: 12px; border-radius: 6px; font-family: monospace; font-weight: 800; cursor: pointer; transition: 0.2s; }
        .btn-close-success:hover { background: #fff; box-shadow: 0 0 15px var(--neon-cyan); }

        .delete-modal { background: #0f172a; border: 2px solid var(--danger); border-radius: 12px; padding: 32px; text-align: center; max-width: 400px; width: 100%; animation: popIn 0.3s; }
        .delete-icon { width: 64px; height: 64px; background: rgba(239, 68, 68, 0.1); color: var(--danger); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 16px; }
        .delete-modal h2 { font-family: monospace; color: var(--danger); margin: 0 0 12px; }
        .delete-modal p { color: var(--hud-text); font-size: 0.9rem; line-height: 1.5; margin: 0 0 24px; }
        .delete-actions { display: flex; gap: 12px; }
        .btn-cancel { flex: 1; background: transparent; border: 1px solid var(--hud-text); color: var(--hud-text); padding: 12px; border-radius: 6px; font-family: monospace; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-cancel:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .btn-confirm-del { flex: 1; background: var(--danger); color: #fff; border: none; padding: 12px; border-radius: 6px; font-family: monospace; font-weight: 700; cursor: pointer; transition: 0.2s; box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
        .btn-confirm-del:hover { background: #dc2626; box-shadow: 0 0 20px rgba(239, 68, 68, 0.6); }

        /* Animations */
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes slotPopIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
