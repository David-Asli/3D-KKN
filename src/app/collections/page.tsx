"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Box, Loader2, LogOut, Trash2, X, RotateCcw, Eye, Gift, Coffee, Sparkles, Download, CheckCircle2, Trophy, Heart, Medal, Star, Shield, Zap, Target, Smartphone, Layers, Clock, Filter } from "lucide-react";
import html2canvas from "html2canvas";

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
      const canvas = await html2canvas(element, { backgroundColor: null, scale: 3 });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "Reward-Siampel-" + userEmail + ".png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download", err);
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
          <Zap size={32} className="loader-icon" />
        </div>
        <p className="loading-text">SYNCING INVENTORY...</p>
        <style>{`
          .loading-screen { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #030712; }
          .hud-loader { position: relative; width: 80px; height: 80px; display: flex; justify-content: center; align-items: center; margin-bottom: 20px; }
          .loader-ring { position: absolute; inset: 0; border: 3px solid transparent; border-top-color: #06b6d4; border-right-color: #c026d3; border-radius: 50%; animation: spin 1s linear infinite; }
          .loader-icon { color: #fff; animation: pulse 1.5s infinite; filter: drop-shadow(0 0 10px #06b6d4); }
          .loading-text { color: #06b6d4; font-family: monospace; font-weight: 700; font-size: 1.2rem; letter-spacing: 4px; animation: pulse 2s infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
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
                  <span className="progress-title">COLLECTION PROGRESS</span>
                  <span className={"progress-count " + (isComplete ? "text-gold" : "")}>
                    {items.length} / {totalTargets} {isComplete && "- COMPLETE!"}
                  </span>
                </div>
                <div className="progress-bar-thin">
                  <div className="progress-fill-thin" style={{ width: Math.min(100, progressPercentage) + "%" }}></div>
                </div>
              </div>
              
              {isComplete && (
                <button className="small-reward-btn" onClick={() => setShowRewardModal(true)}>
                  <Trophy size={18} />
                  <span>VIEW REWARD</span>
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
      </div>

      {/* Reward Modal */}
      {showRewardModal && (
        <div className="hud-modal-backdrop" onClick={(e) => { if(e.target === e.currentTarget) setShowRewardModal(false); }}>
          <div className="reward-modal">
            {!voucherInfo.claimed ? (
              <div className="reward-claim-view">
                <Trophy size={64} className="gold-icon pulse-anim" />
                <h2>ACHIEVEMENT UNLOCKED</h2>
                <p>You collected all items! Claim your physical reward.</p>
                <button onClick={handleClaimVoucher} disabled={checking} className={"claim-btn " + (checking ? 'disabled' : '')}>
                  {checking ? <Loader2 className="spin" size={20} /> : <Gift size={20} />}
                  {checking ? "PROCESSING..." : "CLAIM REWARD"}
                </button>
                {claimError && <div className="error-text">{claimError}</div>}
              </div>
            ) : (
              <div className="reward-ticket-view">
                <div id="voucher-card" className="golden-reward-card">
                  <div className="grc-inner">
                    <div className="grc-header">
                      <div className="grc-brand"><Coffee size={32} color="#fef08a" /></div>
                      <div className="grc-type">LEGENDARY DROP</div>
                    </div>
                    <div className="grc-body">
                      <h1 className="grc-prize">FREE<br/>DRINK</h1>
                      <div className="grc-divider"></div>
                      <div className="grc-stats">
                        <div className="stat-block">
                          <span className="stat-label">OWNER</span>
                          <span className="stat-value truncate-email">{userEmail}</span>
                        </div>
                        <div className="stat-block text-right">
                          <span className="stat-label">EDITION</span>
                          <span className="stat-value highlight">#{String(voucherInfo.sequence).padStart(2, '0')}/{maxVouchers}</span>
                        </div>
                      </div>
                      <div className="grc-code">
                        <span>{voucherCode || 'SIAMPEL-FREE'}</span>
                      </div>
                    </div>
                    <div className="grc-footer">SCAN AT SIAMPEL TERMINAL</div>
                  </div>
                </div>
                <button onClick={handleDownload} className="download-btn"><Download size={16}/> SAVE REWARD</button>
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
                <Box size={20} className="text-cyan-400" />
                <span>INSPECTION_MODE</span>
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
              <RotateCcw size={14} /> <span>DRAG TO ROTATE // PINCH TO ZOOM</span>
            </div>
          </div>
        </div>
      )}

      {/* Game Inventory Styles */}
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

        /* Sidebar */
        .inventory-sidebar {
          width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;
        }
        .sidebar-header { font-family: monospace; font-weight: 800; color: #fff; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; font-size: 0.9rem; }
        .mt-6 { margin-top: 24px; }
        .filter-group { display: flex; flex-direction: column; gap: 4px; }
        
        .filter-btn {
          background: transparent; border: 1px solid transparent; color: var(--hud-text);
          display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 6px;
          font-family: monospace; font-weight: 600; font-size: 0.85rem; cursor: pointer; text-align: left; transition: 0.2s;
        }
        .filter-btn:hover { background: rgba(255,255,255,0.05); }
        .filter-btn.active {
          background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: #fff;
          box-shadow: inset 2px 0 0 var(--f-color, var(--neon-cyan));
        }
        .filter-btn .count { margin-left: auto; background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; }

        @media (max-width: 800px) {
          .inventory-container { flex-direction: column; }
          .inventory-sidebar { width: 100%; }
          .filter-group { flex-direction: row; flex-wrap: wrap; }
          .filter-btn { flex: 1; min-width: 120px; justify-content: center; }
          .filter-btn .count { display: none; }
        }

        /* Main Area */
        .inventory-main { flex: 1; display: flex; flex-direction: column; gap: 24px; min-width: 0; }

        /* Top Progress Bar */
        .inventory-header { display: flex; justify-content: space-between; align-items: center; background: var(--panel-bg); padding: 16px 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); gap: 16px; flex-wrap: wrap; }
        .progress-section { flex: 1; min-width: 200px; }
        .progress-labels { display: flex; justify-content: space-between; margin-bottom: 8px; font-family: monospace; font-size: 0.85rem; font-weight: 700; }
        .progress-title { color: var(--hud-text); } .progress-count { color: #fff; } .text-gold { color: var(--gold); text-shadow: 0 0 8px var(--gold); }
        
        .progress-bar-thin { height: 4px; background: rgba(0,0,0,0.5); border-radius: 2px; overflow: hidden; }
        .progress-fill-thin { height: 100%; background: var(--neon-cyan); box-shadow: 0 0 10px var(--neon-cyan); transition: 0.5s; }
        
        .small-reward-btn {
          background: rgba(245, 158, 11, 0.1); border: 1px solid var(--gold); color: var(--gold);
          padding: 8px 16px; border-radius: 4px; font-family: monospace; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; gap: 8px; transition: 0.2s;
        }
        .small-reward-btn:hover { background: var(--gold); color: #000; box-shadow: 0 0 15px rgba(245,158,11,0.5); }

        /* Slot Grid */
        .slot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          align-content: start;
        }
        @media (max-width: 500px) { .slot-grid { grid-template-columns: repeat(2, 1fr); } }

        /* Slot Item */
        .inventory-slot {
          aspect-ratio: 1 / 1;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          position: relative;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: slotPopIn 0.3s backwards;
        }
        .inventory-slot.empty { cursor: default; opacity: 0.5; border: 1px dashed rgba(255,255,255,0.1); }
        .empty-pattern { position: absolute; inset: 0; background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px); }

        .inventory-slot:not(.empty):hover {
          transform: scale(1.05);
          z-index: 10;
          border-color: var(--r-color);
          box-shadow: 0 0 20px var(--r-glow), inset 0 0 15px var(--r-glow);
        }

        .slot-inner { position: absolute; inset: 4px; border-radius: 4px; overflow: hidden; background: #000; }
        
        .slot-img { width: 100%; height: 100%; object-fit: cover; transition: 0.3s; }
        .inventory-slot:hover .slot-img { transform: scale(1.1); filter: brightness(1.2); }
        
        .slot-vignette { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%); pointer-events: none; }

        /* Mini Actions (Top Right) */
        .slot-mini-actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 4px; z-index: 5; opacity: 0; transition: 0.2s; }
        .inventory-slot:hover .slot-mini-actions { opacity: 1; }
        .mini-btn { width: 24px; height: 24px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; display: flex; justify-content: center; align-items: center; color: #fff; cursor: pointer; transition: 0.2s; }
        .mini-btn:hover { background: rgba(255,255,255,0.2); }
        .mini-btn.fav-active { opacity: 1; background: rgba(0,0,0,0.8); border-color: var(--r-color); }
        .mini-btn.del-btn:hover { background: #ef4444; border-color: #f87171; }
        .inventory-slot .fav-active { opacity: 1; } /* Always show if active */

        /* Info Overlay (Bottom) */
        .slot-info { position: absolute; bottom: 8px; left: 8px; right: 8px; z-index: 5; pointer-events: none; }
        .slot-name { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 0.95rem; font-weight: 800; color: #fff; text-shadow: 0 1px 4px #000; line-height: 1.2; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .slot-type { display: flex; align-items: center; gap: 4px; font-family: monospace; font-size: 0.65rem; color: var(--r-color, var(--neon-cyan)); font-weight: 700; margin-top: 2px; }

        /* Hover Overlay Actions (Center) */
        .slot-hover-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; opacity: 0; transition: 0.2s; backdrop-filter: blur(2px); }
        .inventory-slot:hover .slot-hover-overlay { opacity: 1; }
        
        .slot-hover-actions { display: flex; gap: 12px; transform: translateY(10px); transition: 0.3s; }
        .inventory-slot:hover .slot-hover-actions { transform: translateY(0); }
        
        .action-circle {
          width: 44px; height: 44px; border-radius: 50%; display: flex; justify-content: center; align-items: center;
          cursor: pointer; border: none; color: #fff; transition: 0.2s; text-decoration: none;
        }
        .action-circle.primary { background: rgba(6, 182, 212, 0.3); border: 2px solid var(--neon-cyan); color: var(--neon-cyan); }
        .action-circle.primary:hover { background: var(--neon-cyan); color: #000; box-shadow: 0 0 15px var(--neon-cyan); transform: scale(1.1); }
        .action-circle.secondary { background: rgba(192, 38, 211, 0.3); border: 2px solid #e879f9; color: #e879f9; }
        .action-circle.secondary:hover { background: #e879f9; color: #000; box-shadow: 0 0 15px #e879f9; transform: scale(1.1); }

        /* Reward Modal */
        .reward-modal { background: #0f172a; border: 2px solid var(--gold); border-radius: 12px; padding: 40px; position: relative; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(245,158,11,0.2); animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .close-modal-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; color: var(--hud-text); cursor: pointer; transition: 0.2s; }
        .close-modal-btn:hover { color: #fff; transform: scale(1.1); }
        
        .gold-icon { color: var(--gold); margin: 0 auto 20px; filter: drop-shadow(0 0 15px var(--gold)); }
        .reward-modal h2 { font-family: monospace; font-size: 1.8rem; margin: 0 0 12px; color: #fff; letter-spacing: 1px; }
        .reward-modal p { color: var(--hud-text); margin: 0 0 32px; font-size: 1.1rem; }
        
        .claim-btn { background: var(--gold); color: #000; border: none; padding: 14px 32px; border-radius: 6px; font-family: monospace; font-weight: 800; font-size: 1.1rem; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.2s; box-shadow: 0 0 20px rgba(245,158,11,0.4); }
        .claim-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 25px rgba(245,158,11,0.6); }
        .claim-btn.disabled { background: #334155; color: #94a3b8; box-shadow: none; cursor: not-allowed; }
        .error-text { color: #ef4444; margin-top: 16px; font-family: monospace; }

        .reward-ticket-view { display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .download-btn { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 4px; font-family: monospace; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .download-btn:hover { background: rgba(255,255,255,0.2); border-color: #fff; }

        /* Ticket Design (Reused from previous) */
        .golden-reward-card { background: linear-gradient(135deg, #fbbf24, #fef08a, #d97706, #fde047, #b45309); padding: 4px; border-radius: 12px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.6); color: #422006; }
        .grc-inner { background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5)); border: 1px solid rgba(255,255,255,0.8); border-radius: 8px; padding: 24px; text-align: center; }
        .grc-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 16px; }
        .grc-brand { width: 50px; height: 50px; background: #422006; border-radius: 8px; display: flex; justify-content: center; align-items: center; margin-bottom: 8px; transform: rotate(45deg); box-shadow: inset 0 2px 4px rgba(255,255,255,0.2); }
        .grc-brand > * { transform: rotate(-45deg); }
        .grc-type { font-family: monospace; font-weight: 800; letter-spacing: 2px; font-size: 0.8rem; }
        .grc-prize { font-size: 2.8rem; font-weight: 900; line-height: 0.9; margin: 0 0 16px 0; }
        .grc-divider { height: 2px; background: rgba(66, 32, 6, 0.2); margin: 0 0 16px 0; }
        .grc-stats { display: flex; justify-content: space-between; margin-bottom: 20px; text-align: left; }
        .stat-block { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
        .stat-label { font-family: monospace; font-size: 0.6rem; font-weight: 800; opacity: 0.6; }
        .stat-value { font-weight: 700; font-size: 0.85rem; }
        .truncate-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .stat-value.highlight { font-size: 1.1rem; font-weight: 900; }
        .grc-code { background: #422006; color: #fef08a; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 1.2rem; font-weight: 900; letter-spacing: 3px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5); }
        .grc-footer { margin-top: 16px; font-family: monospace; font-size: 0.65rem; font-weight: 700; opacity: 0.7; letter-spacing: 1px; }

        /* Empty State */
        .empty-inventory { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; background: rgba(0,0,0,0.2); border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; color: var(--hud-text); text-align: center; }
        .empty-icon { opacity: 0.3; margin-bottom: 16px; }
        .empty-inventory p { font-family: monospace; font-size: 1.2rem; font-weight: 700; letter-spacing: 2px; }
        .reset-btn { margin-top: 16px; background: transparent; border: 1px solid var(--hud-text); color: var(--hud-text); padding: 8px 16px; border-radius: 4px; font-family: monospace; cursor: pointer; transition: 0.2s; }
        .reset-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

        /* Modal HUD (Viewer) */
        .hud-modal-backdrop { position: fixed; inset: 0; z-index: 999; background: rgba(3, 7, 18, 0.9); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s; }
        .hud-modal { width: 100%; max-width: 900px; height: 85vh; max-height: 750px; background: #0f172a; border: 1px solid var(--neon-cyan); display: flex; flex-direction: column; box-shadow: 0 0 50px rgba(6, 182, 212, 0.1), inset 0 0 30px rgba(0,0,0,0.8); animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .hud-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: rgba(6, 182, 212, 0.1); border-bottom: 1px solid rgba(6, 182, 212, 0.3); }
        .modal-title-group { display: flex; align-items: center; gap: 10px; font-family: monospace; font-weight: 800; color: #fff; letter-spacing: 1px; }
        .hud-close-btn { background: transparent; border: 1px solid var(--neon-cyan); color: var(--neon-cyan); width: 28px; height: 28px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; }
        .hud-close-btn:hover { background: var(--neon-cyan); color: #000; box-shadow: 0 0 10px var(--neon-cyan); }
        .hud-modal-body { flex: 1; position: relative; background: radial-gradient(circle at center, #1e293b 0%, #020617 100%); }
        .hud-scanner-overlay { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px) 0 0 / 50px 50px, linear-gradient(0deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px) 0 0 / 50px 50px; box-shadow: inset 0 0 100px rgba(0,0,0,0.8); }
        .hud-modal-footer { padding: 8px 20px; background: rgba(0,0,0,0.5); border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: center; align-items: center; gap: 10px; color: var(--neon-cyan); font-family: monospace; font-size: 0.75rem; letter-spacing: 2px; }

        /* Utilities & Anim */
        .spin { animation: spin 1s linear infinite; }
        .pulse-anim { animation: pulseAnim 2s infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulseAnim { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes slotPopIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
