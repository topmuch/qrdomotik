import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

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
  title: 'QR Domotik — Maison intelligente avec des QR codes | Gratuit',
  description: 'Transformez votre maison en maison intelligente avec des QR codes dynamiques. Wi-Fi invités, liste de courses, portier virtuel... Sans application. Gratuit pour toujours.',
  keywords: ['QR Domotik', 'QR code', 'maison intelligente', 'domotique', 'Wi-Fi invités', 'liste de courses', 'portier virtuel', 'gratuit', 'sans application'],
  manifest: '/manifest.json',
  icons: {
    icon: '/qr-domotik-logo.png',
    apple: '/pwa-icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QR Domotik',
  },
  openGraph: {
    type: 'website',
    title: 'QR Domotik — Maison intelligente avec des QR codes',
    description: 'Transformez votre maison en maison intelligente avec des QR codes dynamiques. Sans application. Gratuit pour toujours.',
    siteName: 'QR Domotik',
    locale: 'fr_FR',
    images: [{ url: '/qr-domotik-hero.png', width: 1344, height: 768, alt: 'QR Domotik - Maison intelligente' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR Domotik — Maison intelligente avec des QR codes',
    description: 'Sans application. Gratuit pour toujours. 15+ modules pour votre maison.',
    images: ['/qr-domotik-hero.png'],
  },
  robots: {
    index: true,
    follow: true,
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
        {/* Kill any old service worker and clear caches */}
        <script dangerouslySetInnerHTML={{ __html: '(function(){try{if("serviceWorker" in navigator){navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(reg){reg.unregister()})})}if("caches" in window){caches.keys().then(function(names){names.forEach(function(n){caches.delete(n)})})}}catch(e){}})()' }} />
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}