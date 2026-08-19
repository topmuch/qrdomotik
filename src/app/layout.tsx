import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { PwaInit } from "@/components/pwa-init";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://qrdomotik.com'),
  title: "QR Domotik — Maison Phygital via QR Codes Dynamiques",
  description: "Transformez votre maison en espace phygital avec des QR codes dynamiques.",
  keywords: ["QR Domotik", "QR code dynamique", "maison intelligente", "phygital", "SaaS"],
  manifest: "/manifest.json",
  icons: {
    icon: "/qr-domotik-logo.png",
    apple: "/pwa-icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QR Domotik",
  },
  openGraph: {
    type: "website",
    title: "QR Domotik — Maison Phygital",
    description: "Transformez votre maison en espace phygital avec des QR codes dynamiques.",
    siteName: "QR Domotik",
    images: [{ url: "/qr-domotik-hero.png", width: 1344, height: 768 }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/pwa-icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <Providers>
          <PwaInit />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}