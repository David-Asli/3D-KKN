"use client";

import { useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";

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
      }}
    >
      <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>
        ✅ AR Experience Siap!
      </div>

      {/* QR Code */}
      <div
        ref={qrRef}
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "16px",
          display: "inline-block",
        }}
      >
        <QRCodeSVG
          value={url}
          size={220}
          level="M"
          bgColor="#ffffff"
          fgColor="#050510"
        />
      </div>

      <p style={{ color: "rgba(232,232,240,0.5)", fontSize: "0.9rem", maxWidth: "400px" }}>
        Scan QR code ini dengan HP untuk membuka AR experience. Arahkan kamera ke gambar target untuk melihat 3D.
      </p>

      {/* Target image preview */}
      {targetImage && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          background: "rgba(108, 99, 255, 0.08)",
          borderRadius: "12px",
          border: "1px solid rgba(108, 99, 255, 0.15)",
        }}>
          <img
            src={targetImage}
            alt="Target"
            style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover" }}
          />
          <div style={{ textAlign: "left" }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 600 }}>Gambar Target</p>
            <p style={{ fontSize: "0.7rem", color: "rgba(232,232,240,0.4)" }}>
              Cetak atau tampilkan gambar ini untuk di-scan
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={handleDownloadQR} className="btn-primary" style={{ padding: "12px 24px", fontSize: "0.9rem" }}>
          ⬇️ Download QR
        </button>
        <button onClick={handleCopyLink} className="btn-secondary" style={{ padding: "12px 24px", fontSize: "0.9rem" }}>
          🔗 Copy Link
        </button>
      </div>

      {/* Link display */}
      <div
        style={{
          width: "100%",
          padding: "12px 16px",
          background: "rgba(0,0,0,0.3)",
          borderRadius: "10px",
          fontSize: "0.8rem",
          color: "rgba(232,232,240,0.5)",
          wordBreak: "break-all",
          fontFamily: "monospace",
        }}
      >
        {url}
      </div>
    </div>
  );
}
