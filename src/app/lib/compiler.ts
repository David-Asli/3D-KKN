"use client";

// MindAR Compiler wrapper - compiles images to .mind format in the browser

declare global {
  interface Window {
    MINDAR?: {
      IMAGE?: {
        Compiler: new () => MindARCompiler;
      };
    };
  }
}

interface MindARCompiler {
  compileImageTargets(
    images: HTMLImageElement[],
    progressCallback: (progress: number) => void
  ): Promise<unknown[]>;
  exportData(): Promise<ArrayBuffer>;
}

let compilerLoaded = false;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.type = "module";
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(script);
  });
}

export async function loadCompiler(): Promise<void> {
  if (compilerLoaded) return;
  await loadScript(
    "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js"
  );
  compilerLoaded = true;
}

export function imageFileToHTMLImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function imageDataUrlToHTMLImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

export async function compileImageTarget(
  image: HTMLImageElement,
  onProgress: (progress: number) => void
): Promise<ArrayBuffer> {
  await loadCompiler();

  const Compiler = window.MINDAR?.IMAGE?.Compiler;
  if (!Compiler) {
    throw new Error("MindAR Compiler not available");
  }

  const compiler = new Compiler();
  await compiler.compileImageTargets([image], onProgress);
  const buffer = await compiler.exportData();
  return buffer;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
