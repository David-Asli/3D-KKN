import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AR SIAMPEL 3D — Experience The Future",
  description:
    "Arahkan kamera HP ke gambar target dan lihat objek 3D muncul di layar. Pengalaman Augmented Reality langsung di browser, tanpa install aplikasi.",
  keywords: ["AR", "augmented reality", "3D", "web AR", "scan gambar", "MindAR"],
  openGraph: {
    title: "AR SIAMPEL 3D",
    description: "Scan gambar, lihat objek 3D muncul di layar HP kamu.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
