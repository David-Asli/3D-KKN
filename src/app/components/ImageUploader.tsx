"use client";

import { useRef, useState, useCallback } from "react";

interface ImageUploaderProps {
  onImageSelected: (file: File, dataUrl: string) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onImageSelected, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Hanya file gambar yang didukung (JPG, PNG, WebP)");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("Ukuran file maksimal 10MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreview(dataUrl);
        setFileName(file.name);
        onImageSelected(file, dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile, disabled]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        position: "relative",
        border: `2px dashed ${isDragOver ? "var(--accent-primary)" : "var(--glass-border)"}`,
        borderRadius: "20px",
        padding: preview ? "16px" : "60px 32px",
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.3s ease",
        background: isDragOver
          ? "rgba(108, 99, 255, 0.08)"
          : "var(--glass-bg)",
        opacity: disabled ? 0.5 : 1,
        overflow: "hidden",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleChange}
        style={{ display: "none" }}
        disabled={disabled}
      />

      {preview ? (
        <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          <img
            src={preview}
            alt="Preview"
            style={{
              maxWidth: "200px",
              maxHeight: "200px",
              borderRadius: "12px",
              objectFit: "contain",
              border: "1px solid var(--glass-border)",
            }}
          />
          <div style={{ textAlign: "left" }}>
            <p style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "4px" }}>
              {fileName}
            </p>
            <p style={{ color: "rgba(232,232,240,0.4)", fontSize: "0.85rem" }}>
              Klik untuk ganti gambar
            </p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📸</div>
          <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>
            Drop gambar di sini atau klik untuk upload
          </p>
          <p style={{ color: "rgba(232,232,240,0.4)", fontSize: "0.85rem" }}>
            Format: JPG, PNG, WebP • Maks 10MB
          </p>
          <p style={{ color: "rgba(232,232,240,0.3)", fontSize: "0.8rem", marginTop: "12px" }}>
            💡 Gunakan gambar dengan kontras tinggi untuk tracking terbaik
          </p>
        </>
      )}
    </div>
  );
}
