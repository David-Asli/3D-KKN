"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { getTarget, type ARTarget } from "../lib/storage";
import {
  compileImageTarget,
  imageFileToHTMLImage,
  fileToDataUrl,
} from "../lib/compiler";

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
  const targetId = searchParams.get("id");

  const [target, setTarget] = useState<ARTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compiledData, setCompiledData] = useState<ArrayBuffer | null>(null);
  const [compiledImageSrc, setCompiledImageSrc] = useState<string | null>(null);

  // Load target from IndexedDB
  useEffect(() => {
    const loadTarget = async () => {
      if (!targetId) {
        // No ID — use default demo target
        setLoading(false);
        return;
      }

      try {
        const result = await getTarget(targetId);
        if (result) {
          setTarget(result);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Error loading target:", err);
        setNotFound(true);
      }
      setLoading(false);
    };

    loadTarget();
  }, [targetId]);

  // Handle fallback upload (when target not found in IndexedDB)
  const handleFallbackUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setCompiling(true);
        setProgress(0);

        const dataUrl = await fileToDataUrl(file);
        setCompiledImageSrc(dataUrl);

        const img = await imageFileToHTMLImage(file);
        const mindBuffer = await compileImageTarget(img, (p) => {
          setProgress(Math.round(p * 100));
        });

        setCompiledData(mindBuffer);
        setNotFound(false);
        setCompiling(false);
      } catch (err) {
        console.error("Compile error:", err);
        alert("Gagal compile gambar. Coba lagi.");
        setCompiling(false);
      }
    },
    []
  );

  // Loading state
  if (loading) {
    return <LoadingScreen />;
  }

  // Compiling fallback image
  if (compiling) {
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
              width: "100px",
              height: "100px",
              objectFit: "cover",
              borderRadius: "12px",
              border: "2px solid rgba(108,99,255,0.3)",
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
          Compiling AR Target... {progress}%
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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Target not found — show upload fallback
  if (notFound && !compiledData) {
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
          gap: "24px",
          fontFamily: "'Inter', sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "4rem" }}>📸</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Upload Gambar Target
        </h2>
        <p
          style={{
            color: "rgba(232,232,240,0.5)",
            maxWidth: "400px",
            lineHeight: 1.6,
          }}
        >
          AR target tidak ditemukan di perangkat ini. Upload gambar target yang
          sama untuk memulai AR experience.
        </p>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "16px 32px",
            background: "linear-gradient(135deg, #6c63ff, #00d4ff)",
            color: "white",
            fontWeight: 600,
            borderRadius: "14px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          📁 Pilih Gambar
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFallbackUpload}
            style={{ display: "none" }}
          />
        </label>
        <a
          href="/"
          style={{
            color: "rgba(232,232,240,0.4)",
            fontSize: "0.9rem",
            textDecoration: "none",
          }}
        >
          ← Kembali ke beranda
        </a>
      </div>
    );
  }

  // Render AR Scene
  // Priority: compiled data (from fallback upload) → target from IndexedDB → default
  if (compiledData) {
    return (
      <ARScene
        mindData={compiledData}
        targetImageSrc={compiledImageSrc || undefined}
      />
    );
  }

  if (target) {
    return (
      <ARScene
        mindData={target.mindData}
        targetImageSrc={target.imageDataUrl}
      />
    );
  }

  // Default — use demo target
  return <ARScene mindSrc="/targets.mind" />;
}

export default function ARPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ARPageContent />
    </Suspense>
  );
}
