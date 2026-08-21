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
  { name: "LEGENDARY", color: "#fde047", glow: "rgba(253, 224, 71, 0.6)", icon: Trophy },
  { name: "EPIC", color: "#f472b6", glow: "rgba(244, 114, 182, 0.6)", icon: Star },
  { name: "RARE", color: "#60a5fa", glow: "rgba(96, 165, 250, 0.6)", icon: Shield },
  { name: "COMMON", color: "#34d399", glow: "rgba(52, 211, 153, 0.6)", icon: Medal },
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
  const [settingsStatus, setSettingsStatus] = useState<{msg: string, type: 'success'|'error'} | null>(null);

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
    setSettingsStatus(null);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ setting_key: "max_vouchers", setting_value: maxVouchers });
    
    setSavingSettings(false);
    if (error) {
      setSettingsStatus({ msg: "Gagal menyimpan pengaturan: " + error.message, type: 'error' });
    } else {
      setSettingsStatus({ msg: "Pengaturan kuota berhasil disimpan!", type: 'success' });
      setTimeout(() => setSettingsStatus(null), 3000);
    }
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

  const handleUpdateRarity = async (id: string, current: string) => {
    const levels = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];
    const nextIndex = (levels.indexOf(current) + 1) % levels.length;
    const nextRarity = levels[nextIndex];

    // Optimistic UI update
    setHistory(prev => prev.map(item => item.id === id ? { ...item, rarity: nextRarity } : item));

    const { error } = await supabase
      .from("ar_targets")
      .update({ rarity: nextRarity })
      .eq("id", id);
      
    if (error) {
      alert("Gagal merubah kelangkaan: " + error.message);
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
      setError("SYSTEM ERR: Silakan pilih gambar target terlebih dahulu.");
      return;
    }

    setLoading(true);
    setLoadingText("Menyiapkan Karakter AR... (Sekitar 10 Detik)");
    setError(null);
    setArUrl(null);

    try {
      let cloudImageUrl = "";
      let cloudModelUrl = "";

      setLoadingText("Mengunggah Gambar ke Awan...");

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
        setLoadingText("Mengunggah 3D Model ke Awan...");
        
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

      setLoadingText("Menyimpan ke Daftar Koleksi...");

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
            <div className="hud-badge"><Cpu size={14} className="badge-icon" /> ADMIN PINUS SIAMPEL</div>
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
            
            {settingsStatus && (
              <div className={settingsStatus.type === 'success' ? "success-box" : "error-box"} style={{ marginTop: '8px' }}>
                {settingsStatus.msg}
              </div>
            )}
            
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
                              className="action-circle"
                              style={{ background: 'rgba(255,255,255,0.1)', color: rarity.color, borderColor: rarity.color }}
                              onClick={(e) => { e.stopPropagation(); handleUpdateRarity(item.id, item.rarity || 'COMMON'); }}
                              title="Ubah Kelangkaan"
                            >
                              <rarity.icon size={20} />
                            </button>
                            <button 
                              className="action-circle danger"
                              onClick={(e) => { e.stopPropagation(); setItemToDelete(item.id); }}
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
          --panel-bg: rgba(255, 255, 255, 0.1);
          --hud-border: rgba(255, 255, 255, 0.2);
          --hud-text: #e2e8f0;
          --gold: #f59e0b;
        }

        /* Layout & Background */
        .game-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .grid-overlay { position: absolute; inset: 0; background-image: radial-gradient(circle at 10px 10px, rgba(255,255,255,0.05) 2px, transparent 0); background-size: 40px 40px; }
        
        .game-layout { position: relative; z-index: 10; min-height: 100vh; display: flex; flex-direction: column; font-family: var(--font-sans); }

        /* Top HUD Nav */
        .hud-nav {
          position: sticky; top: 0; z-index: 50; background: rgba(30, 27, 75, 0.9); backdrop-filter: blur(10px);
          border-bottom: 2px solid rgba(255,255,255,0.1); padding: 12px 24px; display: flex; justify-content: space-between; align-items: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .nav-btn { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-weight: 700; text-decoration: none; cursor: pointer; background: none; border: none; transition: 0.2s; color: white; font-size: 1.1rem; }
        .nav-btn:hover { transform: scale(1.05); }
        .text-cyan-400 { color: #60a5fa; } .text-red-400 { color: #f87171; }
        .hud-badge { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 50px; font-family: var(--font-display); font-size: 1rem; font-weight: 600; color: white; border: 2px solid rgba(255,255,255,0.2); }
        
        @media (max-width: 600px) { .hide-mobile { display: none; } }

        /* Main Container */
        .inventory-container {
          display: flex; flex: 1; max-width: 1400px; margin: 0 auto; width: 100%; padding: 32px 24px; gap: 32px;
        }

        /* Sidebar (Upload Form) */
        .inventory-sidebar { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; background: var(--panel-bg); padding: 24px; border-radius: 24px; border: 3px solid rgba(255,255,255,0.1); height: fit-content; box-shadow: 0 10px 30px rgba(0,0,0,0.2); backdrop-filter: blur(10px); }
        .sidebar-header { font-family: var(--font-display); font-weight: 700; color: #fff; letter-spacing: 0.5px; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 12px; font-size: 1.2rem; }
        .sidebar-desc { font-size: 0.9rem; color: var(--hud-text); line-height: 1.5; margin: 0; font-family: var(--font-sans); font-weight: 600; }
        
        .error-box { background: rgba(239, 68, 68, 0.9); border: 2px solid #fff; color: #fff; padding: 12px; font-size: 0.85rem; font-family: var(--font-sans); font-weight: 700; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .success-box { background: rgba(34, 197, 94, 0.9); border: 2px solid #fff; color: #fff; padding: 12px; font-size: 0.85rem; font-family: var(--font-sans); font-weight: 700; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        
        .upload-group { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
        .upload-slot { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); border: 2px dashed rgba(255,255,255,0.3); padding: 16px; border-radius: 16px; cursor: pointer; transition: 0.2s; }
        .upload-slot:hover { border-color: #3b82f6; background: rgba(255,255,255,0.1); transform: translateY(-2px); }
        .slot-icon { color: var(--hud-text); }
        .upload-slot:hover .slot-icon { color: #60a5fa; }
        .slot-text { display: flex; flex-direction: column; overflow: hidden; flex: 1; }
        .slot-label { font-family: var(--font-display); font-size: 0.8rem; font-weight: 700; color: #fff; }
        .slot-val { font-size: 0.85rem; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--font-sans); }
        .text-cyan { color: #60a5fa; }
        .text-purple { color: #f472b6; }
        .text-gold { color: #fde047; }
        .rarity-select { width: 100%; background: rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.2); color: #fff; padding: 10px; border-radius: 12px; font-family: var(--font-sans); font-weight: 700; outline: none; margin-top: 4px; cursor: pointer; transition: 0.2s; }
        .rarity-select:focus { border-color: #3b82f6; }
        
        .btn-generate { background: linear-gradient(180deg, #60a5fa, #3b82f6); color: #fff; border: 3px solid rgba(255,255,255,0.4); padding: 14px; border-radius: 50px; font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); margin-top: 16px; box-shadow: 0 6px 0 #1d4ed8; }
        .btn-generate:hover:not(.disabled) { transform: translateY(-2px); box-shadow: 0 8px 0 #1d4ed8, 0 10px 20px rgba(59,130,246,0.5); border-color: #fff; }
        .btn-generate:active:not(.disabled) { transform: translateY(4px); box-shadow: 0 2px 0 #1d4ed8; }
        .btn-generate.disabled { background: #64748b; border-color: #94a3b8; box-shadow: 0 6px 0 #475569; color: #cbd5e1; cursor: not-allowed; }
        
        @media (max-width: 800px) {
          .inventory-container { flex-direction: column; padding: 16px; }
          .inventory-sidebar { width: 100%; }
        }

        /* Main Area */
        .inventory-main { flex: 1; display: flex; flex-direction: column; gap: 24px; min-width: 0; }

        /* Top Progress Bar */
        .inventory-header { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 24px; border-radius: 24px; border: 3px solid rgba(255,255,255,0.1); gap: 20px; flex-wrap: wrap; box-shadow: 0 10px 30px rgba(0,0,0,0.2); backdrop-filter: blur(10px); }
        .progress-section { flex: 1; min-width: 250px; }
        .progress-labels { display: flex; justify-content: space-between; margin-bottom: 12px; font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; }
        .progress-title { color: #fff; } .progress-count { color: #fff; }
        
        .progress-bar-thin { height: 24px; background: rgba(0,0,0,0.3); border-radius: 50px; overflow: hidden; border: 2px solid rgba(255,255,255,0.1); box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); }
        .progress-fill-thin { height: 100%; background: linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #fde047); background-size: 200% 100%; border-radius: 50px; transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); animation: gradientMove 3s linear infinite; }
        @keyframes gradientMove { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

        /* Loading & Empty States */
        .loading-state { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px; color: #fde047; font-family: var(--font-display); font-size: 1.2rem; gap: 16px; font-weight: 700; letter-spacing: 1px; }
        .empty-inventory { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; background: rgba(255,255,255,0.05); border: 4px dashed rgba(255,255,255,0.2); border-radius: 24px; color: #fff; text-align: center; }
        .empty-icon { opacity: 0.5; margin-bottom: 24px; color: #fde047; }
        .empty-inventory p { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; letter-spacing: 1px; margin-bottom: 16px; }

        /* Slot Grid */
        .slot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 24px;
          align-content: start;
        }
        @media (max-width: 500px) { .slot-grid { grid-template-columns: repeat(1, 1fr); } }

        /* Character Cards */
        .inventory-slot {
          aspect-ratio: 3 / 4;
          background: rgba(255,255,255,0.05);
          border: 4px solid var(--r-color, rgba(255,255,255,0.2));
          border-radius: 24px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: slotPopIn 0.4s backwards cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 8px 15px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.05);
          overflow: hidden;
        }
        
        .inventory-slot:hover {
          transform: translateY(-8px) scale(1.02);
          z-index: 10;
          box-shadow: 0 15px 30px rgba(0,0,0,0.4), 0 0 30px var(--r-glow), inset 0 0 20px var(--r-glow);
        }

        .slot-inner { position: absolute; inset: 0; border-radius: 20px; overflow: hidden; background: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.4) 100%); }
        
        .slot-img { width: 100%; height: 100%; object-fit: contain; padding: 20px; transition: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5)); }
        .inventory-slot:hover .slot-img { transform: scale(1.15) translateY(-5px); }
        
        .slot-vignette { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 30%, transparent 70%); pointer-events: none; }

        /* Top Layer & Actions */
        .slot-top-layer { position: absolute; top: 12px; left: 12px; right: 12px; display: flex; justify-content: space-between; align-items: flex-start; z-index: 5; pointer-events: none; }
        .active-badge { background: rgba(16, 185, 129, 0.9); border: 2px solid #fff; color: #fff; padding: 4px 10px; border-radius: 50px; font-family: var(--font-sans); font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4); }
        .rarity-badge { background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); padding: 6px 12px; border-radius: 50px; font-family: var(--font-sans); font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; gap: 6px; border: 2px solid; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        
        .slot-mini-actions { margin-left: auto; opacity: 0; transition: 0.2s; pointer-events: auto; }
        .inventory-slot:hover .slot-mini-actions { opacity: 1; }
        .mini-btn { width: 36px; height: 36px; background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; justify-content: center; align-items: center; color: #fff; cursor: pointer; transition: 0.3s; backdrop-filter: blur(4px); }
        .mini-btn.del-btn:hover { background: #ef4444; border-color: #fff; transform: scale(1.1); }

        /* Info Overlay (Bottom) */
        .slot-info { position: absolute; bottom: 12px; left: 12px; right: 12px; z-index: 5; pointer-events: none; text-align: center; }
        .slot-name { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.8); line-height: 1.2; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
        .slot-type { display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-family: var(--font-sans); font-size: 0.75rem; font-weight: 800; background: var(--r-color); color: #fff; padding: 4px 10px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 2px 5px rgba(0,0,0,0.5); }
        .slot-date { font-family: var(--font-sans); font-size: 0.7rem; color: #cbd5e1; margin-top: 6px; font-weight: 600; }

        /* Hover Overlay Actions (Center) */
        .slot-hover-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; opacity: 0; transition: 0.3s; backdrop-filter: blur(3px); border-radius: 20px; }
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
