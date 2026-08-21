"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Box, Loader2, LogOut, Trash2, X, RotateCcw, Eye, Gift, Coffee, Sparkles, Download, CheckCircle2, Trophy, Heart, Medal, Star, Shield, Zap, Target, Smartphone, Layers, Clock, Filter, User } from "lucide-react";
import { toPng } from 'html-to-image';

const ModelViewer = 'model-viewer' as any;

interface SavedTarget {
  id: string; // user_collections ID
  created_at: string;
  ar_targets: {
    id: string;
    image_url: string;
    model_url: string | null;
    rarity?: string | null;
  };
}

const RARITIES = [
  { name: "LEGENDARY", color: "#eab308", glow: "rgba(234, 179, 8, 0.4)", icon: Trophy },
  { name: "EPIC", color: "#db2777", glow: "rgba(219, 39, 119, 0.4)", icon: Star },
  { name: "RARE", color: "#2563eb", glow: "rgba(37, 99, 235, 0.4)", icon: Shield },
  { name: "COMMON", color: "#059669", glow: "rgba(5, 150, 105, 0.4)", icon: Medal },
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

const getTargetName = (id: string) => {
  const prefixes = ["Cyber", "Neon", "Void", "Quantum", "Plasma", "Aero", "Mecha", "Chrono"];
  const suffixes = ["Core", "Pulse", "Wanderer", "Guardian", "Striker", "Phantom", "Spark", "Forge"];
  const hash1 = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hash2 = id.split('').reverse().reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return prefixes[hash1 % prefixes.length] + " " + suffixes[hash2 % suffixes.length];
};

type FilterType = 'ALL' | 'FAVORITES' | 'RECENT' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'COMMON';

export default function CollectionsPage() {
  const [items, setItems] = useState<SavedTarget[]>([]);
  const [totalTargets, setTotalTargets] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [viewingModel, setViewingModel] = useState<string | null>(null);
  const [voucherInfo, setVoucherInfo] = useState<{ claimed: boolean; sequence: number | null }>({ claimed: false, sequence: null });
  const [claimError, setClaimError] = useState("");
  const [checking, setChecking] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [maxVouchers, setMaxVouchers] = useState<number>(20);
  const [voucherCode, setVoucherCode] = useState("SIAMPEL-FREE");
  const router = useRouter();

  const handleClaimVoucher = async () => {
    setChecking(true);
    try {
      const claimedBy = localStorage.getItem("siampel_voucher_claimed_by");
      if (claimedBy && claimedBy !== userEmail) {
        setClaimError("Maaf, perangkat ini sudah mengklaim reward dengan akun lain.");
        setChecking(false);
        return;
      }

      const { data: existingClaim } = await supabase
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

      const { count } = await supabase
        .from("voucher_claims")
        .select("*", { count: 'exact', head: true });

      if (count !== null && count >= maxVouchers) {
        setClaimError(`Maaf, kuota reward (${count}/${maxVouchers}) sudah habis.`);
        setChecking(false);
        return;
      }

      const { data: newClaim, error: insertErr } = await supabase
        .from("voucher_claims")
        .insert([{ user_email: userEmail, device_id: 'browser' }])
        .select("id")
        .single();

      if (insertErr) {
        if (insertErr.code === '23505') {
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
      setClaimError("Gagal mengklaim reward.");
    } finally {
      setChecking(false);
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById("voucher-card");
    if (!element) return;
    try {
      const dataUrl = await toPng(element, { 
        backgroundColor: 'transparent', 
        pixelRatio: 4, 
        skipFonts: false,
        style: { transform: 'none', margin: '0' }
      });
      const link = document.createElement("a");
      link.download = "Reward-Siampel-" + userEmail + ".png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download", err);
      alert("Gagal menyimpan tiket. Silakan coba lagi.");
    }
  };

  const fetchCollections = async (userId: string) => {
    try {
      const { count, error: countError } = await supabase
        .from("ar_targets")
        .select('*', { count: 'exact', head: true });
        
      if (!countError && count !== null) {
        setTotalTargets(count);
      }

      const { data, error } = await supabase
        .from("user_collections")
        .select("id, created_at, ar_targets (id, image_url, model_url, rarity)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) setItems(data as any);
    } catch (err) {
      console.error(err);
    } finally {
      const { data: settingsData } = await supabase
        .from("app_settings")
        .select("*")
        .eq("setting_key", "max_vouchers")
        .single();
        
      if (settingsData && settingsData.setting_value) {
        setMaxVouchers(parseInt(settingsData.setting_value));
      }

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
      const { error } = await supabase.from("user_collections").delete().eq("id", collectionId);
      if (error) throw error;
      setItems(items.filter(item => item.id !== collectionId));
    } catch (err) {
      alert("Gagal menghapus item dari koleksi.");
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (activeFilter === 'FAVORITES') {
      result = result.filter(item => favorites[item.id]);
    } else if (activeFilter === 'RECENT') {
      result = result.slice(0, 10);
    } else if (['LEGENDARY', 'EPIC', 'RARE', 'COMMON'].includes(activeFilter)) {
      result = result.filter(item => getRarity(item.ar_targets?.id || item.id, item.ar_targets?.rarity).name === activeFilter);
    }
    return result;
  }, [items, activeFilter, favorites]);

  const progressPercentage = totalTargets > 0 ? (items.length / totalTargets) * 100 : 0;
  const isComplete = totalTargets > 0 && items.length >= totalTargets;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="hud-loader">
          <div className="loader-ring"></div>
          <Star size={40} className="loader-icon text-yellow-300" />
        </div>
        <p className="loading-text">MEMUAT KOLEKSI...</p>
        <style>{`
          .loading-screen { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #e0f2fe 0%, #dcfce7 100%); }
          .hud-loader { position: relative; width: 100px; height: 100px; display: flex; justify-content: center; align-items: center; margin-bottom: 24px; }
          .loader-ring { position: absolute; inset: 0; border: 6px solid rgba(59,130,246,0.1); border-top-color: #3b82f6; border-right-color: #ec4899; border-radius: 50%; animation: spin 1s linear infinite; }
          .loader-icon { color: #f59e0b; animation: bounce 1s infinite alternate cubic-bezier(0.4, 0, 0.2, 1); filter: drop-shadow(0 0 15px rgba(245,158,11,0.3)); }
          .loading-text { color: #1e3a8a; font-family: var(--font-display); font-weight: 800; font-size: 1.5rem; letter-spacing: 2px; animation: pulse 2s infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; transform: scale(1.05); } }
          @keyframes bounce { 0% { transform: translateY(-5px); } 100% { transform: translateY(5px); } }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js" strategy="afterInteractive" />

      <div className="game-bg">
        <div className="grid-overlay"></div>
        <div className="tech-lines"></div>
      </div>
      
      <div className="game-layout">
        
        {/* HUD Top Nav */}
        <nav className="hud-nav">
          <Link href="/" className="nav-btn text-cyan-400">
            <ArrowLeft size={18} />
            <span className="hide-mobile">EXIT</span>
          </Link>
          
          <div className="nav-center">
            <div className="hud-badge"><Shield size={14} className="badge-icon" /> {userEmail}</div>
          </div>

          <button onClick={handleLogout} className="nav-btn text-red-400">
            <span className="hide-mobile">LOGOUT</span>
            <LogOut size={16} />
          </button>
        </nav>

        <div className="inventory-container">
          
          {/* Sidebar Filters */}
          <aside className="inventory-sidebar">
            {/* User Profile Card */}
            <div className="profile-card">
              <div className="profile-avatar">
                <User size={24} strokeWidth={3} />
              </div>
              <div className="profile-info">
                <div className="profile-name">{userEmail ? userEmail.split('@')[0].toUpperCase() : "PEMAIN AJAIB"}</div>
                <div className="profile-title">Kolektor Siampel</div>
              </div>
            </div>

            <div className="sidebar-header">
              <Filter size={16} /> FILTERS
            </div>
            
            <div className="filter-group">
              <button className={"filter-btn " + (activeFilter === 'ALL' ? 'active' : '')} onClick={() => setActiveFilter('ALL')}>
                <Layers size={16} /> ALL ITEMS <span className="count">{items.length}</span>
              </button>
              <button className={"filter-btn " + (activeFilter === 'FAVORITES' ? 'active' : '')} onClick={() => setActiveFilter('FAVORITES')}>
                <Heart size={16} /> FAVORITES
              </button>
              <button className={"filter-btn " + (activeFilter === 'RECENT' ? 'active' : '')} onClick={() => setActiveFilter('RECENT')}>
                <Clock size={16} /> RECENT
              </button>
            </div>

            <div className="sidebar-header mt-6">
              <Sparkles size={16} /> RARITY
            </div>
            
            <div className="filter-group">
              {RARITIES.map(r => (
                <button 
                  key={r.name}
                  className={"filter-btn " + (activeFilter === r.name as FilterType ? 'active' : '')} 
                  onClick={() => setActiveFilter(r.name as FilterType)}
                  style={{ '--f-color': r.color } as any}
                >
                  <r.icon size={16} color={r.color} /> {r.name}
                </button>
              ))}
            </div>
          </aside>

          {/* Main Grid Area */}
          <section className="inventory-main">
            
            {/* Top Bar: Progress & Reward */}
            <header className="inventory-header">
              <div className="progress-section">
                <div className="progress-labels">
                  <span className="progress-title">KOLEKSIKU</span>
                  <span className={"progress-count " + (isComplete ? "text-gold" : "")}>
                    {items.length} / {totalTargets} {isComplete && "- SEMUA TERKUMPUL!"}
                  </span>
                </div>
                <div className="progress-bar-thick">
                  <div className="progress-fill-thick" style={{ width: Math.min(100, progressPercentage) + "%" }}></div>
                </div>
              </div>
              
              {isComplete && (
                <button className="small-reward-btn" onClick={() => setShowRewardModal(true)}>
                  <Trophy size={20} />
                  <span>AMBIL HADIAH!</span>
                </button>
              )}
            </header>

            {/* Grid Slots */}
            {filteredItems.length === 0 ? (
              <div className="empty-inventory">
                <Box size={48} className="empty-icon" />
                <p>NO ITEMS FOUND</p>
                {activeFilter !== 'ALL' && <button className="reset-btn" onClick={() => setActiveFilter('ALL')}>RESET FILTERS</button>}
              </div>
            ) : (
              <div className="slot-grid">
                {filteredItems.map((item, index) => {
                  const rarity = getRarity(item.ar_targets?.id || item.id, item.ar_targets?.rarity);
                  const itemName = getTargetName(item.ar_targets?.id || item.id);
                  const isFav = favorites[item.id];
                  
                  return (
                    <div 
                      key={item.id} 
                      className="inventory-slot"
                      style={{ '--r-color': rarity.color, '--r-glow': rarity.glow, animationDelay: (0.05 * (index % 10)) + "s" } as any}
                    >
                      <div className="slot-inner">
                        {/* Background Image */}
                        <img 
                          src={"/api/proxy-image?url=" + encodeURIComponent(item.ar_targets?.image_url || "")} 
                          alt="Item" 
                          className="slot-img"
                          loading="lazy"
                        />
                        <div className="slot-vignette"></div>

                        {/* Top Right Mini Actions */}
                        <div className="slot-mini-actions">
                          <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} className={"mini-btn " + (isFav ? 'fav-active' : '')}>
                            <Heart size={14} fill={isFav ? rarity.color : "none"} color={isFav ? rarity.color : "#cbd5e1"} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }} className="mini-btn del-btn">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Bottom Info Overlay */}
                        <div className="slot-info">
                          <div className="slot-name">{itemName}</div>
                          <div className="slot-type">
                            <Box size={10} /> 3D MODEL
                          </div>
                        </div>

                        {/* Hover Overlay Actions */}
                        <div className="slot-hover-overlay">
                          <div className="slot-hover-actions">
                            {item.ar_targets?.model_url && (
                              <button 
                                className="action-circle primary"
                                onClick={() => setViewingModel(item.ar_targets!.model_url)}
                                title="Inspect 3D"
                              >
                                <Eye size={20} />
                              </button>
                            )}
                            <Link href="/ar" className="action-circle secondary" title="Launch AR">
                              <Smartphone size={20} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Empty Filler Slots for realistic look */}
                {Array.from({ length: Math.max(0, 12 - filteredItems.length) }).map((_, i) => (
                  <div key={"empty-"+i} className="inventory-slot empty">
                    <div className="slot-inner"><div className="empty-pattern"></div></div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        
        {/* COMPACT FOOTER */}
        <footer className="hud-footer">
          <div className="footer-inner">
            <div className="footer-sys-info">
              <Box size={14} className="text-cyan" />
              <span>PINUS SIAMPEL // ITSNU PEKALONGAN - KKN BEDAGUNG 2026</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Reward Modal */}
      {showRewardModal && (
        <div className="hud-modal-backdrop" onClick={(e) => { if(e.target === e.currentTarget) setShowRewardModal(false); }}>
          <div className="reward-modal">
            {!voucherInfo.claimed ? (
              <div className="reward-claim-view">
                <Trophy size={64} className="gold-icon pulse-anim" />
                <h2>PENCAPAIAN TERBUKA</h2>
                <p>Anda telah mengumpulkan semua item! Klaim hadiah fisik Anda sekarang.</p>
                <button onClick={handleClaimVoucher} disabled={checking} className={"claim-btn " + (checking ? 'disabled' : '')}>
                  {checking ? <Loader2 className="spin" size={20} /> : <Gift size={20} />}
                  {checking ? "MEMPROSES..." : "KLAIM HADIAH"}
                </button>
                {claimError && <div className="error-text">{claimError}</div>}
              </div>
            ) : (
              <div className="reward-ticket-view">
                <div id="voucher-card" className="golden-reward-card">
                  <div className="grc-inner">
                    <div className="grc-header">
                      <div className="grc-brand"><Coffee size={32} color="#fef08a" /></div>
                      <div className="grc-type">ITEM SPESIAL</div>
                    </div>
                    <div className="grc-body">
                      <h1 className="grc-prize">MINUMAN<br/>GRATIS</h1>
                      <div className="grc-divider"></div>
                      <div className="grc-stats">
                        <div className="stat-block">
                          <span className="stat-label">PEMILIK</span>
                          <span className="stat-value truncate-email">{userEmail}</span>
                        </div>
                        <div className="stat-block text-right">
                          <span className="stat-label">EDISI</span>
                          <span className="stat-value highlight">#{String(voucherInfo.sequence).padStart(2, '0')}/{maxVouchers}</span>
                        </div>
                      </div>
                      <div className="grc-code">
                        <span>{voucherCode || 'SIAMPEL-FREE'}</span>
                      </div>
                    </div>
                    <div className="grc-footer">PINDAI DI KASIR SIAMPEL</div>
                  </div>
                </div>
                <button onClick={handleDownload} className="download-btn"><Download size={16}/> SIMPAN TIKET</button>
              </div>
            )}
            <button className="close-modal-btn" onClick={() => setShowRewardModal(false)}><X size={20}/></button>
          </div>
        </div>
      )}

      {/* 3D Model Viewer Modal */}
      {viewingModel && (
        <div className="hud-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setViewingModel(null); }}>
          <div className="hud-modal">
            <div className="hud-modal-header">
              <div className="modal-title-group">
                <Box size={24} className="text-pink-400" />
                <span>LIHAT KARAKTER</span>
              </div>
              <button onClick={() => setViewingModel(null)} className="hud-close-btn">
                <X size={20} />
              </button>
            </div>
            <div className="hud-modal-body">
              {/* @ts-ignore */}
              <ModelViewer
                src={viewingModel} alt="3D Model" auto-rotate camera-controls touch-action="pan-y" shadow-intensity="1"
                environment-image="neutral" style={{ width: "100%", height: "100%", outline: "none", "--poster-color": "transparent" } as any}
              />
              <div className="hud-scanner-overlay"></div>
            </div>
            <div className="hud-modal-footer">
              <RotateCcw size={16} /> <span>GESER UNTUK MEMUTAR • CUBIT UNTUK ZOOM</span>
            </div>
          </div>
        </div>
      )}

      {/* Game Inventory Styles */}
      <style>{`
        :root {
          --panel-bg: rgba(255, 255, 255, 0.8);
          --hud-border: rgba(59, 130, 246, 0.2);
          --hud-text: #334155;
          --gold: #d97706;
          --primary: #3b82f6;
        }

        /* Layout & Background */
        .game-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: linear-gradient(135deg, #e0f2fe 0%, #e8f5e9 100%);
        }
        .game-bg::before {
          content: ''; position: absolute; top: -10%; left: -10%; width: 50vw; height: 50vw;
          background: radial-gradient(circle, rgba(167, 139, 250, 0.25) 0%, transparent 70%);
          filter: blur(60px);
        }
        .game-bg::after {
          content: ''; position: absolute; bottom: -10%; right: -10%; width: 40vw; height: 40vw;
          background: radial-gradient(circle, rgba(244, 114, 182, 0.25) 0%, transparent 70%);
          filter: blur(60px);
        }
        .grid-overlay {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle at 10px 10px, rgba(59, 130, 246, 0.08) 2px, transparent 0);
          background-size: 40px 40px;
        }
        
        .game-layout { position: relative; z-index: 10; min-height: 100vh; display: flex; flex-direction: column; font-family: var(--font-sans); }

        /* Top HUD Nav */
        .hud-nav {
          position: sticky; top: 0; z-index: 50; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px);
          border-bottom: 2px solid rgba(59, 130, 246, 0.2); padding: 12px 24px; display: flex; justify-content: space-between; align-items: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .nav-btn { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-weight: 700; text-decoration: none; cursor: pointer; background: none; border: none; transition: 0.2s; color: #475569; font-size: 1.1rem; }
        .nav-btn:hover { transform: scale(1.05); color: #1e3a8a; }
        .text-pink-400 { color: #db2777; } .text-red-400 { color: #ef4444; }
        .hud-badge { display: flex; align-items: center; gap: 8px; background: #fff; padding: 8px 16px; border-radius: 50px; font-family: var(--font-display); font-size: 1rem; font-weight: 600; color: #1e3a8a; border: 2px solid rgba(59, 130, 246, 0.2); box-shadow: 0 4px 10px rgba(59,130,246,0.05); }
        
        @media (max-width: 600px) { .hide-mobile { display: none; } }

        /* Main Container */
        .inventory-container {
          display: flex; flex: 1; max-width: 1400px; margin: 0 auto; width: 100%; padding: 32px 24px; gap: 32px;
        }

        /* Sidebar */
        .inventory-sidebar {
          width: 250px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;
        }
        
        .profile-card { background: rgba(255, 255, 255, 0.9); border: 2px solid rgba(59, 130, 246, 0.2); border-radius: 20px; padding: 16px; display: flex; align-items: center; gap: 16px; margin-bottom: 8px; backdrop-filter: blur(10px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .profile-avatar { width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6, #ec4899); border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; border: 2px solid #fff; box-shadow: 0 4px 10px rgba(59,130,246,0.2); flex-shrink: 0; }
        .profile-info { display: flex; flex-direction: column; overflow: hidden; }
        .profile-name { font-family: var(--font-display); font-size: 1rem; font-weight: 800; color: #1e3a8a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
        .profile-title { font-family: var(--font-sans); font-size: 0.75rem; font-weight: 800; color: #78350f; margin: 0; background: #fef08a; padding: 2px 8px; border-radius: 50px; display: inline-block; align-self: flex-start; border: 1.5px solid #f59e0b; }
        
        .sidebar-header { font-family: var(--font-display); font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid rgba(59, 130, 246, 0.2); padding-bottom: 12px; font-size: 1.1rem; }
        .mt-6 { margin-top: 32px; }
        .filter-group { display: flex; flex-direction: column; gap: 8px; }
        
        .filter-btn {
          background: rgba(255, 255, 255, 0.9); border: 2px solid #e2e8f0; color: #475569;
          display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 16px;
          font-family: var(--font-sans); font-weight: 700; font-size: 0.95rem; cursor: pointer; text-align: left; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        .filter-btn:hover { background: #f8fafc; transform: translateX(4px); border-color: #cbd5e1; }
        .filter-btn.active {
          background: #3b82f6; border-color: #2563eb; color: #fff;
          box-shadow: 0 6px 15px rgba(59, 130, 246, 0.2); transform: translateX(8px);
        }
        .filter-btn .count { margin-left: auto; background: rgba(0,0,0,0.1); padding: 4px 8px; border-radius: 50px; font-size: 0.8rem; color: #475569; }
        .filter-btn.active .count { background: rgba(255,255,255,0.25); color: #fff; }

        @media (max-width: 800px) {
          .inventory-container { flex-direction: column; padding: 16px; }
          .inventory-sidebar { width: 100%; }
          .filter-group { flex-direction: row; flex-wrap: wrap; }
          .filter-btn { flex: 1; min-width: 130px; justify-content: center; padding: 10px; }
          .filter-btn .count { display: none; }
          .filter-btn.active { transform: translateY(-4px); }
        }

        /* Main Area */
        .inventory-main { flex: 1; display: flex; flex-direction: column; gap: 24px; min-width: 0; }

        /* Top Progress Bar */
        .inventory-header { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 24px; border-radius: 24px; border: 3px solid #e2e8f0; gap: 20px; flex-wrap: wrap; box-shadow: 0 10px 30px rgba(0,0,0,0.05); backdrop-filter: blur(10px); }
        .progress-section { flex: 1; min-width: 250px; }
        .progress-labels { display: flex; justify-content: space-between; margin-bottom: 12px; font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; }
        .progress-title { color: #1e3a8a; } .progress-count { color: #1e3a8a; } .text-gold { color: #d97706; text-shadow: none; font-weight: 800; }
        
        .progress-bar-thick { height: 24px; background: #f1f5f9; border-radius: 50px; overflow: hidden; border: 2px solid #e2e8f0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
        .progress-fill-thick { height: 100%; background: linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #fde047); background-size: 200% 100%; border-radius: 50px; transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); animation: gradientMove 3s linear infinite; }
        @keyframes gradientMove { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
        
        .small-reward-btn {
          background: linear-gradient(180deg, #fde047, #f59e0b); border: 3px solid #fff; color: #422006;
          padding: 12px 24px; border-radius: 50px; font-family: var(--font-display); font-weight: 700; font-size: 1rem; cursor: pointer;
          display: flex; align-items: center; gap: 8px; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 6px 0 #b45309, 0 10px 20px rgba(245,158,11,0.2);
        }
        .small-reward-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 0 #b45309, 0 15px 30px rgba(245,158,11,0.3); }
        .small-reward-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 #b45309, 0 5px 10px rgba(245,158,11,0.2); }

        /* Slot Grid */
        .slot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 24px;
          align-content: start;
        }
        @media (max-width: 500px) { .slot-grid { grid-template-columns: repeat(1, 1fr); } }
        @media (min-width: 501px) and (max-width: 800px) { .slot-grid { grid-template-columns: repeat(2, 1fr); } }

        /* Character Cards */
        .inventory-slot {
          aspect-ratio: 3 / 4;
          background: #ffffff;
          border: 4px solid var(--r-color, #e2e8f0);
          border-radius: 24px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: slotPopIn 0.4s backwards cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 10px 25px rgba(0,0,0,0.05), inset 0 0 20px rgba(0,0,0,0.02);
          overflow: hidden;
        }
        .inventory-slot.empty { cursor: default; opacity: 0.4; border: 4px dashed #cbd5e1; background: rgba(255,255,255,0.3); box-shadow: none; }
        .empty-pattern { position: absolute; inset: 0; background: radial-gradient(circle, rgba(59, 130, 246, 0.05) 20%, transparent 20%); background-size: 20px 20px; }

        .inventory-slot:not(.empty):hover {
          transform: translateY(-8px) scale(1.02);
          z-index: 10;
          box-shadow: 0 20px 35px rgba(0,0,0,0.08), 0 0 25px var(--r-glow);
        }

        .slot-inner { position: absolute; inset: 0; border-radius: 20px; overflow: hidden; background: radial-gradient(circle at center, #ffffff 0%, #f8fafc 100%); }
        
        .slot-img { width: 100%; height: 100%; object-fit: contain; padding: 20px; transition: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); filter: drop-shadow(0 8px 12px rgba(0,0,0,0.15)); }
        .inventory-slot:hover .slot-img { transform: scale(1.15) translateY(-5px); }
        
        .slot-vignette { position: absolute; inset: 0; background: linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.2) 50%, transparent 100%); pointer-events: none; }

        /* Mini Actions (Top Right) */
        .slot-mini-actions { position: absolute; top: 12px; right: 12px; display: flex; gap: 8px; z-index: 5; }
        .mini-btn { width: 36px; height: 36px; background: rgba(255,255,255,0.8); border: 2px solid #e2e8f0; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: #475569; cursor: pointer; transition: 0.3s; backdrop-filter: blur(4px); box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .mini-btn:hover { background: #fff; transform: scale(1.1); color: #1e3a8a; border-color: #cbd5e1; }
        .mini-btn.fav-active { background: var(--r-color); border-color: #fff; color: #fff; box-shadow: 0 0 10px var(--r-glow); }
        .mini-btn.del-btn:hover { background: #ef4444; border-color: #ef4444; color: #fff; }

        /* Info Overlay (Bottom) */
        .slot-info { position: absolute; bottom: 12px; left: 12px; right: 12px; z-index: 5; pointer-events: none; text-align: center; }
        .slot-name { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; color: #1e3a8a; text-shadow: none; line-height: 1.2; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 6px; }
        .slot-type { display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-family: var(--font-sans); font-size: 0.75rem; color: #fff; font-weight: 800; background: var(--r-color); padding: 4px 12px; border-radius: 50px; border: 2px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }

        /* Hover Overlay Actions (Center) */
        .slot-hover-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; justify-content: center; align-items: center; opacity: 0; transition: 0.3s; backdrop-filter: blur(3px); border-radius: 20px; }
        .inventory-slot:hover .slot-hover-overlay { opacity: 1; }
        
        .slot-hover-actions { display: flex; flex-direction: column; gap: 12px; transform: scale(0.8); transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .inventory-slot:hover .slot-hover-actions { transform: scale(1); }
        
        .action-circle {
          padding: 12px 20px; border-radius: 50px; display: flex; justify-content: center; align-items: center; gap: 8px;
          cursor: pointer; border: 3px solid rgba(255,255,255,0.8); color: #fff; transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); text-decoration: none;
          font-family: var(--font-display); font-weight: 700; font-size: 0.95rem;
        }
        .action-circle.primary { background: linear-gradient(180deg, #60a5fa, #3b82f6); box-shadow: 0 4px 0 #1d4ed8; }
        .action-circle.primary:hover { border-color: #fff; transform: translateY(-2px); box-shadow: 0 6px 0 #1d4ed8, 0 10px 20px rgba(59,130,246,0.3); }
        .action-circle.primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #1d4ed8; }
        
        .action-circle.secondary { background: linear-gradient(180deg, #f472b6, #ec4899); box-shadow: 0 4px 0 #be185d; }
        .action-circle.secondary:hover { border-color: #fff; transform: translateY(-2px); box-shadow: 0 6px 0 #be185d, 0 10px 20px rgba(236,72,153,0.3); }
        .action-circle.secondary:active { transform: translateY(2px); box-shadow: 0 2px 0 #be185d; }

        /* Reward Modal (Treasure Box style) */
        .reward-modal { background: #3b82f6; border: 4px solid #fde047; border-radius: 32px; padding: 40px; position: relative; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.15), inset 0 0 30px rgba(255,255,255,0.2); animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); overflow: hidden; }
        .reward-modal::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: repeating-conic-gradient(from 0deg, rgba(255,255,255,0.05) 0deg 15deg, transparent 15deg 30deg); animation: spin 20s linear infinite; z-index: 0; pointer-events: none; }
        .reward-modal > * { position: relative; z-index: 1; }
        
        .close-modal-btn { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.5); border-radius: 50%; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; color: #fff; cursor: pointer; transition: 0.2s; z-index: 10; }
        .close-modal-btn:hover { background: #ef4444; border-color: #fff; transform: scale(1.1) rotate(90deg); }
        
        .gold-icon { color: #fde047; margin: 0 auto 20px; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.2)); }
        .reward-modal h2 { font-family: var(--font-display); font-size: 2.2rem; margin: 0 0 16px; color: #fde047; text-shadow: 0 4px 0 #b45309; }
        .reward-modal p { color: #fff; margin: 0 0 32px; font-size: 1.2rem; font-family: var(--font-sans); font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        
        .claim-btn { background: linear-gradient(180deg, #fde047, #f59e0b); color: #422006; border: 4px solid #fff; padding: 16px 40px; border-radius: 50px; font-family: var(--font-display); font-weight: 800; font-size: 1.3rem; display: inline-flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 8px 0 #b45309, 0 15px 30px rgba(0,0,0,0.2); }
        .claim-btn:hover { transform: translateY(-4px); box-shadow: 0 12px 0 #b45309, 0 20px 40px rgba(0,0,0,0.3); }
        .claim-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 #b45309, 0 5px 10px rgba(0,0,0,0.2); }
        .claim-btn.disabled { background: #94a3b8; color: #f1f5f9; border-color: #cbd5e1; box-shadow: 0 8px 0 #64748b; cursor: not-allowed; }
        .error-text { background: rgba(239, 68, 68, 0.9); color: #fff; padding: 12px; border-radius: 12px; margin-top: 24px; font-family: var(--font-sans); font-weight: 700; border: 2px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }

        .reward-ticket-view { display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .download-btn { background: rgba(255,255,255,0.2); color: #fff; border: 2px solid rgba(255,255,255,0.5); padding: 12px 24px; border-radius: 50px; font-family: var(--font-display); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s; font-size: 1.1rem; }
        .download-btn:hover { background: #3b82f6; border-color: #fff; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.15); }

        /* Ticket Design */
        .golden-reward-card { background: linear-gradient(135deg, #fef08a, #f59e0b); padding: 8px; border-radius: 24px; width: 350px; max-width: 100%; margin: 0 auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3); color: #422006; border: 2px solid #fff; }
        .grc-inner { background: #fff; border: 4px solid #fde047; border-radius: 16px; padding: 24px; text-align: center; box-shadow: inset 0 0 20px rgba(245,158,11,0.1); }
        .grc-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 16px; }
        .grc-brand { width: 60px; height: 60px; background: #f59e0b; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin-bottom: 12px; border: 4px solid #fde047; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .grc-type { font-family: var(--font-display); font-weight: 800; letter-spacing: 1px; font-size: 1rem; color: #b45309; }
        .grc-prize { font-size: 3rem; font-weight: 900; line-height: 1; margin: 0 0 20px 0; font-family: var(--font-display); color: #422006; text-shadow: 2px 2px 0 #fde047; }
        .grc-divider { height: 0; border-bottom: 4px dashed #f59e0b; margin: 0 0 20px 0; border-radius: 2px; }
        .grc-stats { display: flex; justify-content: space-between; margin-bottom: 24px; text-align: left; background: #fef3c7; padding: 12px; border-radius: 12px; border: 2px dashed #f59e0b; }
        .stat-block { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
        .stat-label { font-family: var(--font-display); font-size: 0.75rem; font-weight: 800; color: #b45309; text-transform: uppercase; }
        .stat-value { font-weight: 800; font-size: 0.9rem; font-family: var(--font-sans); }
        .truncate-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .stat-value.highlight { font-size: 1.2rem; color: #d97706; }
        .grc-code { background: #422006; color: #fde047; padding: 16px; border-radius: 16px; font-family: monospace; font-size: 1.5rem; font-weight: 900; letter-spacing: 4px; box-shadow: inset 0 4px 10px rgba(0,0,0,0.6); border: 2px solid #b45309; }
        .grc-footer { margin-top: 20px; font-family: var(--font-display); font-size: 0.8rem; font-weight: 700; color: #b45309; letter-spacing: 1px; }

        /* Empty State */
        .empty-inventory { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; background: #fff; border: 4px dashed #cbd5e1; border-radius: 24px; color: #1e3a8a; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
        .empty-icon { opacity: 0.7; margin-bottom: 24px; color: #f59e0b; }
        .empty-inventory p { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 16px; color: #1e3a8a; }
        .reset-btn { background: #fff; border: 2px solid #cbd5e1; color: #475569; padding: 10px 24px; border-radius: 50px; font-family: var(--font-sans); font-weight: 700; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 0 #e2e8f0; }
        .reset-btn:hover { background: #3b82f6; border-color: #2563eb; color: #fff; box-shadow: 0 4px 0 #1d4ed8; transform: translateY(-2px); }

        /* Modal HUD (Viewer) */
        .hud-modal-backdrop { position: fixed; inset: 0; z-index: 999; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; padding: 24px; animation: fadeIn 0.3s; }
        .hud-modal { width: 100%; max-width: 900px; height: 85vh; max-height: 800px; background: #fff; border: 4px solid #3b82f6; border-radius: 24px; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.15); animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); overflow: hidden; }
        .hud-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: #eff6ff; border-bottom: 4px solid #bfdbfe; }
        .modal-title-group { display: flex; align-items: center; gap: 12px; font-family: var(--font-display); font-weight: 800; color: #1e3a8a; font-size: 1.2rem; }
        .hud-close-btn { background: #fff; border: 2px solid #cbd5e1; color: #475569; width: 36px; height: 36px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.3s; }
        .hud-close-btn:hover { background: #ef4444; border-color: #ef4444; color: #fff; transform: scale(1.1) rotate(90deg); }
        .hud-modal-body { flex: 1; position: relative; background: radial-gradient(circle at center, #ffffff 0%, #f0fdf4 100%); }
        .hud-scanner-overlay { position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(circle at 10px 10px, rgba(59,130,246,0.04) 2px, transparent 0); background-size: 40px 40px; box-shadow: inset 0 0 100px rgba(0,0,0,0.05); }
        .hud-modal-footer { padding: 16px 24px; background: #eff6ff; border-top: 4px solid #bfdbfe; display: flex; justify-content: center; align-items: center; gap: 12px; color: #475569; font-family: var(--font-sans); font-size: 0.9rem; font-weight: 700; }

        /* Compact Footer */
        .hud-footer { border-top: 4px dashed #bfdbfe; background: #3b82f6; padding: 40px 24px; margin-top: auto; position: relative; z-index: 10; }
        .footer-inner { max-width: 1400px; margin: 0 auto; display: flex; justify-content: center; align-items: center; }
        .footer-sys-info { display: flex; align-items: center; gap: 12px; font-family: var(--font-display); font-size: 1.1rem; color: #fff; font-weight: 800; }
        .text-cyan { color: #fde047; }

        /* Utilities & Anim */
        .spin { animation: spin 1s linear infinite; }
        .pulse-anim { animation: pulseAnim 2s infinite alternate cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulseAnim { 0% { transform: scale(0.9); } 100% { transform: scale(1.1); filter: drop-shadow(0 0 20px #fde047); } }
        @keyframes slotPopIn { from { opacity: 0; transform: scale(0.5) translateY(50px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.8) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
