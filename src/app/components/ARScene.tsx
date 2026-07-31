"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type ARStatus = "loading" | "scanning" | "found";

interface ARSceneProps {
  mindSrc?: string; // URL to .mind file (for default)
  mindData?: ArrayBuffer; // Direct .mind data (from IndexedDB)
  targetImageSrc?: string; // Target image preview
  modelUrl?: string; // Custom 3D model URL
}

export default function ARScene({ mindSrc, mindData, targetImageSrc, modelUrl }: ARSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ARStatus>("loading");
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const sceneInitialized = useRef(false);
  const [mindBlobUrl, setMindBlobUrl] = useState<string | null>(null);

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
        setScriptsLoaded(true);
      } catch (error) {
        console.error("Error loading AR scripts:", error);
      }
    };

    loadAllScripts();
  }, []);

  // Determine the target source URL
  const targetSource = mindBlobUrl || mindSrc || "/targets.mind";

  // Initialize AR Scene once scripts are loaded
  const initScene = useCallback(() => {
    if (!scriptsLoaded || !containerRef.current || sceneInitialized.current) return;
    // Wait for blob URL if mindData was provided
    if (mindData && !mindBlobUrl) return;
    sceneInitialized.current = true;

    const container = containerRef.current;

    // Create A-Frame scene
    const scene = document.createElement("a-scene");
    // Menggunakan default filter MindAR, tapi kita fokus ke optimasi grafis (FPS)
    scene.setAttribute(
      "mindar-image",
      `imageTargetSrc: ${targetSource}; autoStart: true; uiLoading: no; uiError: no; uiScanning: no; missTolerance: 5;`
    );
    scene.setAttribute("color-space", "sRGB");
    // Mematikan antialias dan menurunkan presisi render agar FPS naik drastis di HP
    scene.setAttribute("renderer", "antialias: false; colorManagement: true; physicallyCorrectLights: true; precision: medium;");
    scene.setAttribute("vr-mode-ui", "enabled: false");
    scene.setAttribute("device-orientation-permission-ui", "enabled: false");
    scene.setAttribute("embedded", "");
    scene.style.position = "absolute";
    scene.style.top = "0";
    scene.style.left = "0";
    scene.style.width = "100%";
    scene.style.height = "100%";

    // Camera
    const camera = document.createElement("a-camera");
    camera.setAttribute("position", "0 0 0");
    camera.setAttribute("look-controls", "enabled: false");
    scene.appendChild(camera);

    // Target entity
    const target = document.createElement("a-entity");
    target.setAttribute("mindar-image-target", "targetIndex: 0");

    // Custom 3D Model
    const model = document.createElement("a-gltf-model");
    model.setAttribute("src", modelUrl || "/Kursi.glb");
    
    // Sesuaikan scale, position, dan rotasi sesuai kebutuhan
    model.setAttribute("scale", "0.5 0.5 0.5");
    model.setAttribute("position", "0 0 0");
    model.setAttribute("rotation", "0 0 0");
    
    // (Tambahan) mainkan animasi bawaan (skeletal/keyframe) dari file .glb jika ada
    model.setAttribute("animation-mixer", "loop: repeat");
    
    target.appendChild(model);

    // Lights
    const ambientLight = document.createElement("a-light");
    ambientLight.setAttribute("type", "ambient");
    ambientLight.setAttribute("color", "#ffffff");
    ambientLight.setAttribute("intensity", "0.6");
    scene.appendChild(ambientLight);

    const dirLight = document.createElement("a-light");
    dirLight.setAttribute("type", "directional");
    dirLight.setAttribute("color", "#ffffff");
    dirLight.setAttribute("intensity", "0.8");
    dirLight.setAttribute("position", "1 2 1");
    scene.appendChild(dirLight);

    scene.appendChild(target);

    // Event listeners
    scene.addEventListener("arReady", () => {
      setStatus("scanning");
    });

    target.addEventListener("targetFound", () => {
      setStatus("found");
    });

    target.addEventListener("targetLost", () => {
      setStatus("scanning");
    });

    container.appendChild(scene);

    setTimeout(() => {
      setStatus((prev) => (prev === "loading" ? "scanning" : prev));
    }, 5000);
  }, [scriptsLoaded, targetSource, mindData, mindBlobUrl, modelUrl]);

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
          background: "#000",
        }}
      />

      {/* Back Button */}
      <a href="/" className="ar-back-btn">
        ← Kembali
      </a>

      {/* Target Preview */}
      {(targetImageSrc || !mindData) && (
        <div className="target-preview">
          <img src={targetImageSrc || "/target.png"} alt="Target" />
          <div className="label">TARGET</div>
        </div>
      )}

      {/* Status Bar */}
      <div className={`ar-status ${status === "found" ? "found" : ""}`}>
        <div className="pulse" />
        {status === "loading" && "Memuat AR Engine..."}
        {status === "scanning" && "Arahkan kamera ke gambar target"}
        {status === "found" && "✓ Target terdeteksi!"}
      </div>
    </>
  );
}
