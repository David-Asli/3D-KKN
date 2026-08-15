"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { compileMultipleImageTargets, imageDataUrlToHTMLImage, resizeImage } from "../lib/compiler";

import { supabase } from "@/lib/supabase";

const ARScene = dynamic(() => import("../components/ARScene"), {
  ssr: false,
});

function ARPageContent() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [compiledData, setCompiledData] = useState<ArrayBuffer | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchTarget = async () => {
      try {
        // Ambil maksimal 5 data terbaru dari Supabase untuk Pameran Multi-Target
        const { data, error } = await supabase
          .from("ar_targets")
          .select("id, image_url, model_url")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error || !data || data.length === 0) {
          console.error("Gagal mengambil data dari Supabase:", error);
          setLoading(false);
          return;
        }

        const modelUrls: string[] = [];
        const tIds: string[] = [];
        const htmlImages: HTMLImageElement[] = [];

        for (const target of data) {
          modelUrls.push(target.model_url || "");
          tIds.push(target.id);
          // Ambil gambar melalui proxy agar tidak terkena error CORS di HP
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(target.image_url)}`;
          const img = await imageDataUrlToHTMLImage(proxyUrl);
          const resized = await resizeImage(img, 800);
          htmlImages.push(resized);
        }

        if (isCancelled) return;

        // Compile semua gambar sekaligus ke dalam 1 file .mind
        const mindBuffer = await compileMultipleImageTargets(htmlImages, (p) => {
          setProgress(Math.round(p * 100));
        });

        if (isCancelled) return;

        setCompiledData(mindBuffer);
        setModels(modelUrls);
        setTargetIds(tIds);
        setLoading(false);
      } catch (err: any) {
        console.error("Target fetch error:", err);
        setErrorMsg("Gagal memproses gambar target. HP mungkin kehabisan memori atau internet terputus.");
        setLoading(false);
      }
    };

    fetchTarget();

    return () => {
      isCancelled = true;
    };
  }, []);

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
          Menyiapkan Pameran AR... {progress}%
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
        <p style={{ fontSize: "0.85rem", color: "rgba(232,232,240,0.4)", textAlign: "center", maxWidth: "300px" }}>
          Sistem sedang memuat banyak gambar sekaligus agar kamera Anda bisa mengenali semuanya.
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (compiledData) {
    return (
      <ARScene
        mindData={compiledData}
        models={models}
        targetIds={targetIds}
      />
    );
  }

  // Fallback to default demo target
  return <ARScene mindSrc="/targets.mind" models={[]} targetIds={[]} />;
}

export default function ARPage() {
  return (
    <Suspense fallback={null}>
      <ARPageContent />
    </Suspense>
  );
}
