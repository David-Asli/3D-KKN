"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { compileImageTarget, imageDataUrlToHTMLImage, resizeImage } from "../lib/compiler";

import { supabase } from "@/lib/supabase";

const ARScene = dynamic(() => import("../components/ARScene"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

function LoadingScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#050510",
        color: "#e8e8f0",
        gap: "20px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          border: "3px solid rgba(108, 99, 255, 0.2)",
          borderTopColor: "#6c63ff",
          animation: "spin 1s linear infinite",
        }}
      />
      <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>Memuat AR Engine...</p>
      <p style={{ fontSize: "0.85rem", color: "rgba(232,232,240,0.4)" }}>
        Pastikan kamu mengizinkan akses kamera
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ARPageContent() {
  const searchParams = useSearchParams();
  const imgUrl = searchParams.get("img");
  const modelUrl = searchParams.get("model");

  const [loading, setLoading] = useState(true);
  const [finalModelUrl, setFinalModelUrl] = useState<string | null>(modelUrl);
  const [finalMindUrl, setFinalMindUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchTarget = async () => {
      try {
        let activeModelUrl = modelUrl;
        let activeMindUrl = null;

        // Ambil data terbaru dari Supabase
        const { data, error } = await supabase
          .from("ar_targets")
          .select("mind_url, model_url")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error("Gagal mengambil data dari Supabase:", error);
        } else if (data) {
          if (data.mind_url) activeMindUrl = data.mind_url;
          if (data.model_url) activeModelUrl = data.model_url;
        }

        if (isCancelled) return;

        if (activeMindUrl) {
          setFinalMindUrl(activeMindUrl);
        }
        if (activeModelUrl) {
          setFinalModelUrl(activeModelUrl);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error("Target fetch error:", err);
        setErrorMsg("Gagal mengambil data target dari Cloud.");
        setLoading(false);
      }
    };

    fetchTarget();

    return () => {
      isCancelled = true;
    };
  }, [imgUrl, modelUrl]);

  if (errorMsg) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#050510",
          color: "#e8e8f0",
          gap: "20px",
          fontFamily: "'Inter', sans-serif",
          padding: "24px",
          textAlign: "center"
        }}
      >
        <div style={{ color: "#ff4444", fontSize: "48px" }}>⚠️</div>
        <h2 style={{ margin: 0 }}>Gagal Memuat</h2>
        <p style={{ color: "rgba(255,255,255,0.7)" }}>{errorMsg}</p>
        <a href="/" style={{
          marginTop: "20px",
          padding: "10px 24px",
          background: "#6c63ff",
          color: "white",
          textDecoration: "none",
          borderRadius: "8px",
          fontWeight: "bold"
        }}>Kembali ke Beranda</a>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  // Jika sukses mendapatkan mind_url dari Supabase, langsung tampilkan
  if (finalMindUrl) {
    return (
      <ARScene
        mindSrc={finalMindUrl}
        modelUrl={finalModelUrl || undefined}
      />
    );
  }

  // Fallback to default demo target
  return <ARScene mindSrc="/targets.mind" modelUrl={finalModelUrl || undefined} />;
}

export default function ARPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ARPageContent />
    </Suspense>
  );
}
