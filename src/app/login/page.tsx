"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, KeyRound, ArrowRight, ArrowLeft, ShieldAlert, Terminal } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Redirect to admin creation tool
        router.push("/create");
        router.refresh();
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      {/* Game Menu Background Ambience */}
      <div className="admin-bg">
        <div className="bg-grid"></div>
        <div className="bg-glow"></div>
      </div>

      <div className="admin-container">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="admin-panel"
        >
          {/* Header Section */}
          <div className="panel-header">
            <div className="security-icon-wrapper">
              <ShieldAlert size={28} className="security-icon" />
            </div>
            <h1 className="panel-title">LOGIN ADMIN</h1>
            <p className="panel-desc">
              Masukkan kredensial untuk mengakses Pusat Kontrol AR.
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleLogin} className="panel-form">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="sys-msg error-msg">
                {error}
              </motion.div>
            )}
            
            <div className="input-group">
              <label className="input-label">USERNAME</label>
              <div className="input-slot">
                <div className="slot-icon"><User size={16} /></div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  required
                  className="slot-field"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">KATA SANDI</label>
              <div className="input-slot">
                <div className="slot-icon"><KeyRound size={16} /></div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="slot-field"
                />
              </div>
            </div>

            <div className="action-group">
              <button 
                type="submit" 
                disabled={loading}
                className={"btn-enter " + (loading ? 'loading' : '')}
              >
                {loading ? (
                  <span className="btn-text">MEMPROSES...</span>
                ) : (
                  <>
                    <Terminal size={18} />
                    <span className="btn-text">MASUK</span>
                    <ArrowRight size={18} className="btn-arrow" />
                  </>
                )}
                <div className="btn-scanline"></div>
              </button>

              <Link href="/" className="btn-back">
                <ArrowLeft size={14} /> KEMBALI KE BERANDA
              </Link>
            </div>
          </form>
        </motion.div>
      </div>

      <style>{`
        :root {
          --admin-bg: #020617;
          --admin-panel: rgba(15, 23, 42, 0.75);
          --admin-cyan: #06b6d4;
          --admin-cyan-dim: rgba(6, 182, 212, 0.2);
          --admin-text: #e2e8f0;
          --admin-muted: #64748b;
          --admin-border: rgba(6, 182, 212, 0.3);
          --admin-error: #ef4444;
          --admin-success: #10b981;
        }

        .admin-layout {
          position: relative; z-index: 10;
          font-family: ui-sans-serif, system-ui, sans-serif;
          background: var(--admin-bg); color: var(--admin-text);
          min-height: 100vh; display: flex; flex-direction: column;
        }

        /* Ambient Background */
        .admin-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; background: radial-gradient(circle at 50% 0%, #0f172a 0%, var(--admin-bg) 70%); }
        .bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(6, 182, 212, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.04) 1px, transparent 1px); background-size: 50px 50px; opacity: 0.6; }
        .bg-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80vw; height: 80vw; background: radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 60%); filter: blur(80px); }

        /* Centered Container */
        .admin-container {
          position: relative; z-index: 10;
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }

        /* Login Panel */
        .admin-panel {
          width: 100%; max-width: 400px;
          background: var(--admin-panel); backdrop-filter: blur(16px);
          border: 1px solid var(--admin-border);
          border-radius: 4px; /* Sharp corners for sci-fi look */
          padding: 40px 32px;
          box-shadow: 0 0 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(6, 182, 212, 0.05);
          position: relative;
          overflow: hidden;
        }
        
        /* Subtle corner accents */
        .admin-panel::before, .admin-panel::after {
          content: ''; position: absolute; width: 10px; height: 10px; border: 2px solid var(--admin-cyan);
        }
        .admin-panel::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
        .admin-panel::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

        /* Header */
        .panel-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 40px; text-align: center; }
        .security-icon-wrapper {
          width: 56px; height: 56px; background: rgba(0,0,0,0.5);
          border: 1px solid var(--admin-cyan); border-radius: 50%;
          display: flex; justify-content: center; align-items: center;
          color: var(--admin-cyan); margin-bottom: 16px;
          box-shadow: 0 0 15px var(--admin-cyan-dim), inset 0 0 10px var(--admin-cyan-dim);
          animation: pulse 2s infinite;
        }
        .panel-title { font-family: monospace; font-size: 1.4rem; font-weight: 800; color: #fff; letter-spacing: 2px; margin: 0 0 8px 0; }
        .panel-desc { font-family: monospace; font-size: 0.85rem; color: var(--admin-muted); margin: 0; line-height: 1.5; }

        /* Form & Messages */
        .panel-form { display: flex; flex-direction: column; gap: 24px; }
        
        .sys-msg { padding: 12px 16px; border-radius: 4px; font-family: monospace; font-size: 0.85rem; text-align: center; font-weight: 700; letter-spacing: 0.5px; border-left: 3px solid; }
        .error-msg { background: rgba(239, 68, 68, 0.1); border-color: var(--admin-error); color: #fca5a5; }

        /* Input Slots */
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-label { font-family: monospace; font-size: 0.75rem; font-weight: 700; color: var(--admin-cyan); letter-spacing: 1px; }
        
        .input-slot {
          display: flex; align-items: center;
          background: rgba(0,0,0,0.6);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          height: 48px;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .input-slot:focus-within { border-color: var(--admin-cyan); box-shadow: 0 0 10px var(--admin-cyan-dim); }
        
        .slot-icon { width: 48px; display: flex; justify-content: center; align-items: center; color: var(--admin-muted); border-right: 1px solid rgba(255,255,255,0.05); }
        .input-slot:focus-within .slot-icon { color: var(--admin-cyan); border-color: var(--admin-cyan-dim); }
        
        .slot-field {
          flex: 1; height: 100%; background: transparent; border: none; color: #fff;
          padding: 0 16px; font-size: 1rem; font-family: monospace; outline: none;
        }
        .slot-field::placeholder { color: rgba(255,255,255,0.2); }

        /* Actions */
        .action-group { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }
        
        .btn-enter {
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; height: 54px;
          background: var(--admin-cyan-dim); border: 1px solid var(--admin-cyan);
          color: var(--admin-cyan); font-family: monospace; font-size: 1.1rem; font-weight: 800; letter-spacing: 1px;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-enter:hover:not(.loading) { background: var(--admin-cyan); color: #000; box-shadow: 0 0 20px var(--admin-cyan-dim); }
        .btn-enter.loading { background: rgba(0,0,0,0.5); border-color: var(--admin-muted); color: var(--admin-muted); cursor: not-allowed; }
        
        .btn-text { z-index: 2; position: relative; }
        .btn-arrow { transition: transform 0.2s; z-index: 2; position: relative; }
        .btn-enter:hover:not(.loading) .btn-arrow { transform: translateX(4px); }
        
        .btn-scanline {
          position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent);
          height: 10px; opacity: 0; transition: opacity 0.2s;
        }
        .btn-enter:hover:not(.loading) .btn-scanline { opacity: 1; animation: scan 1.5s linear infinite; }

        .btn-back {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 8px;
          color: var(--admin-muted); font-family: monospace; font-size: 0.75rem; font-weight: 700;
          text-decoration: none; transition: 0.2s; letter-spacing: 1px;
        }
        .btn-back:hover { color: #fff; }

        @keyframes pulse { 0%, 100% { box-shadow: 0 0 15px var(--admin-cyan-dim), inset 0 0 10px var(--admin-cyan-dim); } 50% { box-shadow: 0 0 25px rgba(6, 182, 212, 0.4), inset 0 0 15px rgba(6, 182, 212, 0.4); } }
        @keyframes scan { 0% { transform: translateY(-20px); } 100% { transform: translateY(60px); } }

        @media (max-width: 480px) {
          .admin-container {
            padding: 16px;
          }
          .admin-panel {
            padding: 32px 20px;
          }
        }
      `}</style>
    </div>
  );
}
