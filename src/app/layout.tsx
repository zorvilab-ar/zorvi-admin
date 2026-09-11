import type { Metadata, Viewport } from "next";
import { Lilita_One, Nunito, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/app-chrome";
import { Toaster } from "@/components/ui/sonner";

const display = Lilita_One({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const sans = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zorvi Admin",
  description: "Contabilidad y costos — Lámparas 3D",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBEFD9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${sans.variable} ${display.variable} ${mono.variable} font-sans antialiased`}
      >
        <AppChrome>{children}</AppChrome>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
