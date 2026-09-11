import type { Metadata } from "next";
import { Lilita_One, Nunito, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
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
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex-1 overflow-x-auto px-6 py-6 lg:px-10">
            {children}
          </main>
        </div>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
