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
  const [progress, setProgress] = useState(0);
  const [compiledData, setCompiledData] = useState<ArrayBuffer | null>(null);
  const [compiledImageSrc, setCompiledImageSrc] = useState<string | null>(null);
  const [finalModelUrl, setFinalModelUrl] = useState<string | null>(modelUrl);
  const [compilationError, setCompilationError] = useState<string | null>(null);

  // Generate or Load target dynamically
  useEffect(() => {
    let isCancelled = false;

    const prepareTarget = async () => {
      try {
        let activeImgUrl = imgUrl;
        let activeModelUrl = modelUrl;

        if (!activeImgUrl) {
          // Jika tidak ada URL khusus, ambil data terbaru dari Supabase
          const { data, error } = await supabase
            .from("ar_targets")
            .select("image_url, model_url")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (error) {
            console.error("Gagal mengambil data dari Supabase:", error);
            // Fallback ke default demo target
            setLoading(false);
            return;
          }
          
          if (data) {
            activeImgUrl = data.image_url;
            if (data.model_url) {
              activeModelUrl = data.model_url;
              setFinalModelUrl(activeModelUrl);
            }
          } else {
            // No data in DB
            setLoading(false);
            return;
          }
        }

        setCompiledImageSrc(activeImgUrl);

        // Fetch through proxy to avoid strict mobile CORS tracking prevention
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(activeImgUrl)}`;
        const img = await imageDataUrlToHTMLImage(proxyUrl);
        if (isCancelled) return;

        // Resize the image down to save memory (prevents WebGL crash on mobile devices)
        const resizedImg = await resizeImage(img, 800);
        if (isCancelled) return;

        // Compile to .mind format
        const mindBuffer = await compileImageTarget(resizedImg, (p) => {
          setProgress(Math.round(p * 100));
        });
        
        if (isCancelled) return;
        setCompiledData(mindBuffer);
        setLoading(false);
      } catch (err: any) {
        console.error("Target compilation error:", err);
        setCompilationError(err.message || "Gagal memproses gambar target. HP mungkin kehabisan memori atau koneksi terputus.");
        setLoading(false);
      }
    };

    prepareTarget();

    return () => {
      isCancelled = true;
    };
  }, [imgUrl, modelUrl]);

  // Show error if compilation fails
  if (compilationError) {
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
        <h2 style={{ margin: 0 }}>Gagal Memuat Target</h2>
        <p style={{ color: "rgba(255,255,255,0.7)" }}>{compilationError}</p>
        <p style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.5)" }}>
          Sistem gagal memproses target pada perangkat ini. Cobalah menggunakan HP dengan spesifikasi lebih tinggi, atau pastikan koneksi internet stabil.
        </p>
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

  // Show compiling progress
  if (loading) {
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
        }}
      >
        {compiledImageSrc && (
          <img
            src={compiledImageSrc}
            alt="Target"
            style={{
              width: "120px",
              height: "120px",
              objectFit: "cover",
              borderRadius: "12px",
              border: "2px solid rgba(108,99,255,0.3)",
              background: "white",
            }}
          />
        )}
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
        <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>
          Menganalisis Gambar Target... {progress}%
        </p>
        <div
          style={{
            width: "280px",
            height: "6px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(135deg, #6c63ff, #00d4ff)",
              borderRadius: "3px",
              transition: "width 0.3s",
            }}
          />
        </div>
        <p style={{ fontSize: "0.85rem", color: "rgba(232,232,240,0.4)" }}>
          Membuat pelacak 3D (hanya butuh waktu sebentar)
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (compiledData) {
    return (
      <ARScene
        mindData={compiledData}
        targetImageSrc={compiledImageSrc || undefined}
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
