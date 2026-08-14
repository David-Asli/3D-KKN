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
      style={{
        background: "white",
        borderRadius: "20px",
        padding: "32px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
        color: "#1F2937",
        width: "100%",
        maxWidth: "400px",
        margin: "0 auto"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.2rem", fontWeight: 700 }}>
        <CheckCircle2 color="var(--success)" size={24} />
        <span>Pindai untuk Memulai AR</span>
      </div>

      <p style={{ color: "#6B7280", fontSize: "0.95rem", lineHeight: 1.5 }}>
        Pindai kode QR dengan smartphone Anda
      </p>

      {/* QR Code Container */}
      <div
        ref={qrRef}
        style={{
          background: "white",
          padding: "16px",
          borderRadius: "16px",
          display: "inline-block",
          border: "1px solid #F3F4F6",
        }}
      >
        <QRCodeSVG
          value={url}
          size={220}
          level="M"
          bgColor="#ffffff"
          fgColor="#111827"
          includeMargin={false}
        />
      </div>

      {/* Target image preview (jika dipanggil dari halaman Create) */}
      {targetImage && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px",
          background: "#F9FAFB",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          width: "100%",
        }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
            <img
              src={targetImage}
              alt="Target Preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div style={{ textAlign: "left", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ImageIcon size={14} color="var(--primary)" />
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Gambar Target</p>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "2px" }}>
              Arahkan kamera ke gambar ini
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
        <button 
          onClick={handleDownloadQR} 
          style={{ 
            flex: 1, minWidth: "140px", padding: "10px", 
            background: "#F3F4F6", color: "#374151", 
            border: "none", borderRadius: "8px", 
            fontWeight: 500, display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
            cursor: "pointer", transition: "background 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "#E5E7EB"}
          onMouseOut={(e) => e.currentTarget.style.background = "#F3F4F6"}
        >
          <Download size={16} />
          Unduh
        </button>
        <button 
          onClick={handleCopyLink} 
          style={{ 
            flex: 1, minWidth: "140px", padding: "10px", 
            background: "#DBEAFE", color: "#1D4ED8", 
            border: "none", borderRadius: "8px", 
            fontWeight: 500, display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
            cursor: "pointer", transition: "background 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "#BFDBFE"}
          onMouseOut={(e) => e.currentTarget.style.background = "#DBEAFE"}
        >
          <Copy size={16} />
          Salin Link
        </button>
      </div>
    </div>
  );
}
