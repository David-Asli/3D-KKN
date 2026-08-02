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
    img.crossOrigin = "anonymous";
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

export async function compileMultipleImageTargets(
  images: HTMLImageElement[],
  onProgress: (progress: number) => void
): Promise<ArrayBuffer> {
  await loadCompiler();

  const Compiler = window.MINDAR?.IMAGE?.Compiler;
  if (!Compiler) {
    throw new Error("MindAR Compiler not available");
  }

  const compiler = new Compiler();
  await compiler.compileImageTargets(images, onProgress);
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

export function resizeImage(img: HTMLImageElement, maxSize: number = 1000): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > maxSize) {
        height = Math.round(height * (maxSize / width));
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = Math.round(width * (maxSize / height));
        height = maxSize;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
    }

    const resizedImg = new Image();
    resizedImg.onload = () => resolve(resizedImg);
    resizedImg.src = canvas.toDataURL("image/jpeg", 0.8);
  });
}

