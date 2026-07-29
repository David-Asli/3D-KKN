"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type ARStatus = "loading" | "scanning" | "found";

interface ARSceneProps {
  mindSrc?: string; // URL to .mind file (for default)
  mindData?: ArrayBuffer; // Direct .mind data (from IndexedDB)
  targetImageSrc?: string; // Target image preview
}

export default function ARScene({ mindSrc, mindData, targetImageSrc }: ARSceneProps) {
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
    scene.setAttribute(
      "mindar-image",
      `imageTargetSrc: ${targetSource}; autoStart: true; uiLoading: no; uiError: no; uiScanning: no;`
    );
    scene.setAttribute("color-space", "sRGB");
    scene.setAttribute("renderer", "colorManagement: true; physicallyCorrectLights: true;");
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

    // Main box
    const box = document.createElement("a-box");
    box.setAttribute("position", "0 0.15 0");
    box.setAttribute("scale", "0.3 0.3 0.3");
    box.setAttribute("color", "#6c63ff");
    box.setAttribute("opacity", "0.9");
    box.setAttribute("animation", "property: rotation; to: 0 360 0; loop: true; dur: 4000; easing: linear;");
    box.setAttribute("animation__scale", "property: scale; from: 0.3 0.3 0.3; to: 0.35 0.35 0.35; loop: true; dur: 2000; dir: alternate; easing: easeInOutSine;");
    target.appendChild(box);

    // Floating sphere 1
    const sphere1 = document.createElement("a-sphere");
    sphere1.setAttribute("position", "0.4 0.3 0");
    sphere1.setAttribute("radius", "0.08");
    sphere1.setAttribute("color", "#00d4ff");
    sphere1.setAttribute("opacity", "0.8");
    sphere1.setAttribute("animation", "property: position; to: 0.4 0.45 0; loop: true; dur: 2000; dir: alternate; easing: easeInOutSine;");
    target.appendChild(sphere1);

    // Floating sphere 2
    const sphere2 = document.createElement("a-sphere");
    sphere2.setAttribute("position", "-0.4 0.3 0");
    sphere2.setAttribute("radius", "0.06");
    sphere2.setAttribute("color", "#ff6b9d");
    sphere2.setAttribute("opacity", "0.8");
    sphere2.setAttribute("animation", "property: position; to: -0.4 0.5 0; loop: true; dur: 2500; dir: alternate; easing: easeInOutSine;");
    target.appendChild(sphere2);

    // Ring
    const ring = document.createElement("a-entity");
    ring.setAttribute("geometry", "primitive: torus; radius: 0.35; radiusTubular: 0.01;");
    ring.setAttribute("material", "color: #6c63ff; opacity: 0.4;");
    ring.setAttribute("position", "0 0.15 0");
    ring.setAttribute("animation", "property: rotation; from: 90 0 0; to: 90 360 0; loop: true; dur: 6000; easing: linear;");
    target.appendChild(ring);

    // Second ring
    const ring2 = document.createElement("a-entity");
    ring2.setAttribute("geometry", "primitive: torus; radius: 0.45; radiusTubular: 0.008;");
    ring2.setAttribute("material", "color: #00d4ff; opacity: 0.25;");
    ring2.setAttribute("position", "0 0.15 0");
    ring2.setAttribute("rotation", "60 0 0");
    ring2.setAttribute("animation", "property: rotation; from: 60 0 0; to: 60 360 0; loop: true; dur: 8000; easing: linear;");
    target.appendChild(ring2);

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
  }, [scriptsLoaded, targetSource, mindData, mindBlobUrl]);

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
