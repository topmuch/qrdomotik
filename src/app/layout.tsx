import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QR Domotik — Maison Phygital via QR Codes Dynamiques",
  description:
    "QR Domotik rend votre maison intelligente avec des QR codes dynamiques. Modifiez le contenu à distance sans réimprimer.",
  keywords: [
    "QR Domotik",
    "QR code dynamique",
    "maison intelligente",
    "domotique",
    "phygital",
    "SaaS",
  ],
  authors: [{ name: "QR Domotik Team" }],
  icons: {
    icon: "/qr-domotik-logo.png",
  },
  openGraph: {
    title: "QR Domotik — Maison Phygital",
    description: "Transformez chaque pièce avec des QR codes dynamiques modifiables à distance.",
    siteName: "QR Domotik",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
