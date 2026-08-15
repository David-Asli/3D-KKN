"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        router.push("/collections");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        setMessage("Registrasi berhasil! Silakan periksa email Anda untuk verifikasi, atau login jika email tidak memerlukan verifikasi.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-animated" />
      <div className="grid-overlay" />
      <div className="noise-overlay" />
      
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass-card"
          style={{ width: "100%", maxWidth: "440px", padding: "48px 40px", borderRadius: "24px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset" }}
        >
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px", letterSpacing: "-0.02em" }}>
              {isLogin ? "Selamat Datang" : "Buat Akun"}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
              {isLogin ? "Masuk untuk melihat koleksi 3D Anda" : "Daftar untuk mulai mengoleksi model 3D"}
            </p>
          </div>

          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ padding: "14px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "12px", color: "#f87171", fontSize: "0.95rem", textAlign: "center", fontWeight: 500 }}>
                {error}
              </motion.div>
            )}

            {message && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ padding: "14px", background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "12px", color: "#4ade80", fontSize: "0.95rem", textAlign: "center", fontWeight: 500 }}>
                {message}
              </motion.div>
            )}
            
            <div>
              <label style={{ display: "block", marginBottom: "10px", fontSize: "0.95rem", color: "var(--text-secondary)", fontWeight: 600 }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} color="var(--text-tertiary)" style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)" }} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  style={{
                    width: "100%",
                    padding: "16px 20px 16px 48px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "14px",
                    color: "white",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--primary)";
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.target.style.background = "rgba(255, 255, 255, 0.03)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "10px", fontSize: "0.95rem", color: "var(--text-secondary)", fontWeight: 600 }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} color="var(--text-tertiary)" style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)" }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={{
                    width: "100%",
                    padding: "16px 20px 16px 48px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "14px",
                    color: "white",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--primary)";
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.target.style.background = "rgba(255, 255, 255, 0.03)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary" 
              style={{ 
                width: "100%", 
                marginTop: "16px", 
                padding: "16px", 
                justifyContent: "center", 
                fontSize: "1.05rem",
                borderRadius: "14px",
                boxShadow: "0 8px 20px -6px rgba(59, 130, 246, 0.5)"
              }}
            >
              {loading ? "Memproses..." : (
                <>{isLogin ? "Masuk" : "Daftar"} <ArrowRight size={20} /></>
              )}
            </button>

            <div style={{ textAlign: "center", marginTop: "8px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
                <button 
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }}
                  style={{ 
                    background: "none", 
                    border: "none", 
                    color: "var(--primary)", 
                    fontWeight: 600, 
                    cursor: "pointer", 
                    fontSize: "0.95rem",
                    padding: 0
                  }}
                >
                  {isLogin ? "Daftar Sekarang" : "Masuk"}
                </button>
              </p>
            </div>

            <div style={{ textAlign: "center", marginTop: "8px" }}>
              <Link href="/" style={{ color: "var(--text-tertiary)", fontSize: "0.95rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", transition: "color 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
              >
                <ArrowLeft size={16} /> Kembali ke Beranda
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}
