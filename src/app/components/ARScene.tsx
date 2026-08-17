"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type ARStatus = "loading" | "scanning" | "found";

interface ARSceneProps {
  mindSrc?: string; // URL to .mind file (for default)
  mindData?: ArrayBuffer; // Direct .mind data (from IndexedDB)
  targetImageSrc?: string; // Target image preview
  models?: string[]; // Array of Custom 3D model URLs
  targetIds?: string[]; // Array of database Target IDs
}

export default function ARScene({ mindSrc, mindData, targetImageSrc, models = [], targetIds = [] }: ARSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ARStatus>("loading");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [session, setSession] = useState<any>(null);
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const sceneInitialized = useRef(false);
  const [mindBlobUrl, setMindBlobUrl] = useState<string | null>(null);
  const router = useRouter();

  // Create blob URL from mindData if provided
  useEffect(() => {
    if (mindData) {
      const blob = new Blob([mindData]);
      const url = URL.createObjectURL(blob);
      setMindBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [mindData]);

  // Load external scripts (A-Frame + MindAR)
  useEffect(() => {
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load: ${src}`));
        document.head.appendChild(script);
      });
    };

    const loadAllScripts = async () => {
      try {
        await loadScript("https://aframe.io/releases/1.5.0/aframe.min.js");
        await loadScript("https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.2.0/dist/aframe-extras.min.js");
        await loadScript(
          "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"
        );
        // Script untuk mendeteksi sentuhan/geser (gestures)
        await loadScript("https://raw.githack.com/fcor/arjs-gestures/master/dist/gestures.js");
        setScriptsLoaded(true);
      } catch (error) {
        console.error("Error loading AR scripts:", error);
      }
    };

    loadAllScripts();

    // Check user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const handleSaveToCollection = async () => {
    if (!session) {
      setShowLoginPrompt(true);
      return;
    }

    if (activeIndex === null || activeIndex >= targetIds.length) return;
    
    setSavingStatus("saving");
    try {
      const targetId = targetIds[activeIndex];
      const { error } = await supabase
        .from("user_collections")
        .insert([{ user_id: session.user.id, target_id: targetId }]);
        
      if (error) {
        // If it's a unique constraint error (23505), it means already saved
        if (error.code === '23505') {
          setSavingStatus("saved");
        } else {
          throw error;
        }
      } else {
        setSavingStatus("saved");
      }
    } catch (err) {
      console.error(err);
      setSavingStatus("error");
    }
  };

  // Determine the target source URL
  const targetSource = mindBlobUrl || mindSrc || "/targets.mind";

  // Initialize AR Scene once scripts are loaded
  const initScene = useCallback(() => {
    if (!scriptsLoaded || !containerRef.current || sceneInitialized.current) return;
    // Wait for blob URL if mindData was provided
    if (mindData && !mindBlobUrl) return;
    sceneInitialized.current = true;

    const container = containerRef.current;

    // Daftarkan komponen fix material jika belum ada (untuk mencegah model GLTF terlihat hitam)
    if (window.AFRAME && !window.AFRAME.components["model-material-fix"]) {
      window.AFRAME.registerComponent("model-material-fix", {
        init: function () {
          this.el.addEventListener("model-loaded", () => {
            const obj = this.el.getObject3D("mesh");
            if (obj) {
              obj.traverse((node: any) => {
                if (node.isMesh && node.material) {
                  // Kurangi metalness agar tidak memantulkan warna hitam (jika tidak ada envMap)
                  if (node.material.metalness > 0.5) {
                    node.material.metalness = 0.1;
                    node.material.roughness = 0.8;
                  }
                  // Pastikan warna vertex muncul
                  node.material.needsUpdate = true;
                }
              });
            }
          });
        }
      });
    }

    // Create A-Frame scene
    const scene = document.createElement("a-scene");
    // Menggunakan default filter MindAR, tapi kita fokus ke optimasi grafis (FPS)
    scene.setAttribute(
      "mindar-image",
      `imageTargetSrc: ${targetSource}; autoStart: true; uiLoading: no; uiError: no; uiScanning: no; missTolerance: 5; filterMinCF: 0.0001; filterBeta: 0.001; warmupTolerance: 5;`
    );
    scene.setAttribute("color-space", "sRGB");
    // Mengaktifkan colorManagement agar warna model tidak pudar, dan
    // Menggunakan settingan mediump & antialias false untuk mendongkrak FPS (mencegah patah-patah) di HP.
    scene.setAttribute("renderer", "colorManagement: true; antialias: true; physicallyCorrectLights: true; logarithmicDepthBuffer: false; alpha: true;");
    scene.setAttribute("vr-mode-ui", "enabled: false");
    scene.setAttribute("device-orientation-permission-ui", "enabled: false");
    scene.setAttribute("embedded", "");
    // Menambahkan gesture-detector ke scene agar bisa mendeteksi sentuhan
    scene.setAttribute("gesture-detector", "");
    
    scene.style.position = "absolute";
    scene.style.top = "0";
    scene.style.left = "0";
    scene.style.width = "100%";
    scene.style.height = "100%";

    // Camera (dengan fitur raycaster agar bisa disentuh/diputar)
    const camera = document.createElement("a-camera");
    camera.setAttribute("position", "0 0 0");
    camera.setAttribute("look-controls", "enabled: false");
    camera.setAttribute("cursor", "fuse: false; rayOrigin: mouse;");
    // Gunakan interval 100 (ms) agar raycaster tidak mengecek setiap frame (sangat berat untuk CPU di HP)
    camera.setAttribute("raycaster", "objects: .clickable; interval: 100;");
    scene.appendChild(camera);

    // Multi-Target Setup
    // Fallback if models array is empty (for demo/default)
    const activeModels = models.length > 0 ? models : ["/lowo.glb"];

    activeModels.forEach((modelUrl, index) => {
      const target = document.createElement("a-entity");
      target.setAttribute("mindar-image-target", `targetIndex: ${index}`);

      const model = document.createElement("a-gltf-model");
      model.setAttribute("src", modelUrl);
      
      model.setAttribute("scale", "0.5 0.5 0.5");
      model.setAttribute("position", "0 0 0");
      model.setAttribute("rotation", "0 0 0");
      model.setAttribute("animation-mixer", "loop: repeat; timeScale: 0.75");
      
      model.setAttribute("class", "clickable");
      model.setAttribute("gesture-handler", "minScale: 0.1; maxScale: 10");
      model.setAttribute("model-material-fix", "");

      target.appendChild(model);

      // TEST BOX: Menambahkan kotak merah untuk mengecek apakah lighting A-Frame berfungsi
      const testBox = document.createElement("a-box");
      testBox.setAttribute("position", "1 0 0");
      testBox.setAttribute("scale", "0.2 0.2 0.2");
      testBox.setAttribute("color", "red");
      target.appendChild(testBox);

      target.addEventListener("targetFound", () => {
        setStatus("found");
        setActiveIndex(index);
        setSavingStatus("idle");
      });

      target.addEventListener("targetLost", () => {
        setStatus("scanning");
        setActiveIndex(null);
      });

      scene.appendChild(target);
    });

    // Tambahkan decoder draco & meshopt jika file .glb dikompresi dari Blender
    scene.setAttribute("gltf-model", "dracoDecoderPath: https://www.gstatic.com/draco/v1/decoders/; meshoptDecoderPath: https://unpkg.com/meshoptimizer/meshopt_decoder.js;");

    // Pencahayaan Ambient agar tidak ada bagian yang hitam pekat
    const ambientLight = document.createElement("a-light");
    ambientLight.setAttribute("type", "ambient");
    ambientLight.setAttribute("color", "#ffffff");
    ambientLight.setAttribute("intensity", "1.5");
    scene.appendChild(ambientLight);

    // Pencahayaan Hemisphere (Sangat efektif untuk menampilkan warna material PBR/GLTF yang gelap)
    const hemiLight = document.createElement("a-light");
    hemiLight.setAttribute("type", "hemisphere");
    hemiLight.setAttribute("color", "#ffffff");
    hemiLight.setAttribute("groundColor", "#444444");
    hemiLight.setAttribute("intensity", "2"); 
    scene.appendChild(hemiLight);

    const dirLight = document.createElement("a-light");
    dirLight.setAttribute("type", "directional");
    dirLight.setAttribute("color", "#ffffff");
    dirLight.setAttribute("intensity", "1.5");
    dirLight.setAttribute("position", "-1 2 1");
    scene.appendChild(dirLight);

    // Event listeners
    scene.addEventListener("arReady", () => {
      setStatus("scanning");
    });

    container.appendChild(scene);

    setTimeout(() => {
      setStatus((prev) => (prev === "loading" ? "scanning" : prev));
    }, 5000);
  }, [scriptsLoaded, targetSource, mindData, mindBlobUrl, models]);

  useEffect(() => {
    initScene();
  }, [initScene]);

  return (
    <>
      {/* AR Scene Container */}
      <div
        ref={containerRef}
        className="ar-container"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "transparent",
        }}
      />

      {/* Back Button */}
      <a href="/" className="ar-back-btn">
        ← Kembali
      </a>

      {/* Target Preview dihapus sesuai permintaan agar tampilan layar bersih */}

      {/* Save Button Overlay */}
      {status === "found" && activeIndex !== null && activeIndex < targetIds.length && !showLoginPrompt && (
        <div style={{
          position: "fixed",
          bottom: "100px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 110,
        }}>
          <button 
            onClick={handleSaveToCollection}
            disabled={savingStatus === "saving" || savingStatus === "saved"}
            style={{
              padding: "12px 24px",
              background: savingStatus === "saved" ? "#4ade80" : "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "99px",
              fontWeight: 600,
              fontSize: "1rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              cursor: savingStatus === "saving" || savingStatus === "saved" ? "default" : "pointer",
              transition: "all 0.2s"
            }}
          >
            {savingStatus === "idle" && "❤ Simpan ke Koleksi"}
            {savingStatus === "saving" && "Menyimpan..."}
            {savingStatus === "saved" && "✓ Tersimpan"}
            {savingStatus === "error" && "Gagal Menyimpan"}
          </button>
        </div>
      )}

      {/* Status Bar */}
      <div className={`ar-status ${status === "found" ? "found" : ""}`}>
        <div className="pulse" />
        {status === "loading" && "Memuat AR Engine..."}
        {status === "scanning" && "Arahkan kamera ke gambar target"}
        {status === "found" && "✓ Target terdeteksi!"}
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(5px)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "rgba(30,30,40,0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "32px 24px",
            borderRadius: "20px",
            maxWidth: "360px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
          }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "12px", color: "white" }}>
              Anda Belum Login
            </h3>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "24px" }}>
              Silakan daftar akun atau login terlebih dahulu agar model 3D ini bisa tersimpan selamanya di koleksi Anda!
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button 
                onClick={() => router.push("/auth")}
                style={{
                  background: "var(--primary)",
                  color: "white",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "1rem",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Login / Daftar Sekarang
              </button>
              <button 
                onClick={() => setShowLoginPrompt(false)}
                style={{
                  background: "transparent",
                  color: "rgba(255,255,255,0.7)",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontWeight: 600,
                  fontSize: "1rem",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Batal (Tetap Lanjutkan AR)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
