"use client";

import { useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Copy, CheckCircle2, Image as ImageIcon } from "lucide-react";

interface QRCodeDisplayProps {
  url: string;
  targetImage?: string;
}

export default function QRCodeDisplay({ url, targetImage }: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link berhasil di-copy!");
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      alert("Link berhasil di-copy!");
    }
  }, [url]);

  const handleDownloadQR = useCallback(() => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 512, 512);
        ctx.drawImage(img, 0, 0, 512, 512);
      }
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = "ar-qrcode.png";
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  return (
    <div
      className="glass-card"
      style={{
        padding: "40px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        position: "relative"
      }}
    >
      {/* Decorative Glow */}
      <div style={{
        position: "absolute",
        top: "-50px", left: "50%", transform: "translateX(-50%)",
        width: "150px", height: "150px",
        background: "var(--accent-glow)",
        filter: "blur(60px)",
        borderRadius: "50%",
        zIndex: 0, pointerEvents: "none"
      }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "10px", fontSize: "1.3rem", fontWeight: 700 }}>
        <CheckCircle2 color="var(--success)" size={28} />
        <span className="gradient-text-primary">AR Experience Siap</span>
      </div>

      {/* QR Code Container */}
      <div
        ref={qrRef}
        style={{
          position: "relative",
          zIndex: 1,
          background: "white",
          padding: "24px",
          borderRadius: "24px",
          display: "inline-block",
          boxShadow: "0 0 40px rgba(0, 229, 255, 0.3)",
          border: "4px solid rgba(255,255,255,0.1)"
        }}
      >
        <QRCodeSVG
          value={url}
          size={240}
          level="M"
          bgColor="#ffffff"
          fgColor="#050816"
        />
      </div>

      <p style={{ position: "relative", zIndex: 1, color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "400px", lineHeight: 1.6 }}>
        Scan QR code ini dengan smartphone Anda untuk membuka pengalaman AR. Arahkan kamera ke gambar target.
      </p>

      {/* Target image preview */}
      {targetImage && (
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "16px",
          background: "rgba(59, 130, 246, 0.08)",
          borderRadius: "16px",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          width: "100%",
          maxWidth: "400px"
        }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }}>
            <img
              src={targetImage}
              alt="Target Preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div style={{ textAlign: "left", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ImageIcon size={14} color="var(--accent)" />
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "white" }}>Gambar Target Aktif</p>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              Arahkan kamera AR ke gambar ini
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
        <button onClick={handleDownloadQR} className="btn-primary" style={{ flex: 1, minWidth: "160px" }}>
          <Download size={18} />
          Download QR
        </button>
        <button onClick={handleCopyLink} className="btn-secondary" style={{ flex: 1, minWidth: "160px" }}>
          <Copy size={18} />
          Copy Link
        </button>
      </div>

      {/* Link display */}
      <div
        style={{
          position: "relative", zIndex: 1,
          width: "100%",
          padding: "16px",
          background: "rgba(0,0,0,0.4)",
          borderRadius: "14px",
          fontSize: "0.8rem",
          color: "var(--text-tertiary)",
          wordBreak: "break-all",
          fontFamily: "monospace",
          border: "1px solid rgba(255,255,255,0.05)"
        }}
      >
        {url}
      </div>
    </div>
  );
}
