"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import QRCode from "qrcode";
import { compileImageTarget } from "../lib/compiler";

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
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [compiledData, setCompiledData] = useState<ArrayBuffer | null>(null);
  const [compiledImageSrc, setCompiledImageSrc] = useState<string | null>(null);

  // Generate QR Code dynamically and compile it into a target
  useEffect(() => {
    let isCancelled = false;

    const prepareTarget = async () => {
      try {
        const url = `${window.location.origin}/ar`;
        
        // Generate QR code data URL
        const dataUrl = await QRCode.toDataURL(url, {
          width: 512,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });

        if (isCancelled) return;
        setCompiledImageSrc(dataUrl);

        // Load into HTML Image
        const img = new Image();
        img.onload = async () => {
          if (isCancelled) return;
          try {
            // Compile to .mind format
            const mindBuffer = await compileImageTarget(img, (p) => {
              setProgress(Math.round(p * 100));
            });
            
            if (isCancelled) return;
            setCompiledData(mindBuffer);
            setLoading(false);
          } catch (err) {
            console.error("Compile error:", err);
            setLoading(false);
          }
        };
        img.src = dataUrl;
      } catch (err) {
        console.error("QR Code generation error:", err);
        setLoading(false);
      }
    };

    prepareTarget();

    return () => {
      isCancelled = true;
    };
  }, []);

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
          Menganalisis QR Code... {progress}%
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

  // Render AR Scene
  if (compiledData) {
    return (
      <ARScene
        mindData={compiledData}
        targetImageSrc={compiledImageSrc || undefined}
      />
    );
  }

  // Fallback if something failed
  return <LoadingScreen />;
}

export default function ARPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ARPageContent />
    </Suspense>
  );
}
