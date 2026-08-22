'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { PopularModules } from '@/components/landing/PopularModules';
import { LiveDemo } from '@/components/landing/LiveDemo';
import { PhysicalQrSection } from '@/components/landing/PhysicalQrSection';
import { Advantages } from '@/components/landing/Advantages';
import { Testimonials } from '@/components/landing/Testimonials';
import { Pricing } from '@/components/landing/Pricing';
import { FAQ } from '@/components/landing/FAQ';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';
import { CursorGlow } from '@/components/landing/CursorGlow';
import { AuthDialog } from '@/components/landing/AuthDialog';
import { ActivationOverlay } from '@/components/physical-qr/ActivationOverlay';
import { LayoutDashboard } from 'lucide-react';

function ActivationOverlayInner() {
  return <ActivationOverlay />;
}

function LandingPage({ onGoDashboard }: { onGoDashboard: () => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-white relative">
      <CursorGlow />
      <Navbar />
      <Suspense>
        <ActivationOverlayInner />
      </Suspense>
      <main className="flex-1">
        <HeroSection />
        <HowItWorks />
        <PopularModules />
        <LiveDemo />
        <PhysicalQrSection />
        <Advantages />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <AuthDialog />
      {/* Floating admin access button */}
      <button
        onClick={onGoDashboard}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        title="Accéder au tableau de bord"
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">Dashboard</span>
      </button>
    </div>
  );
}

export default function Page() {
  const { data: session } = useSession();
  const [showDashboard, setShowDashboard] = useState(false);

  if (showDashboard || (session?.user as Record<string, unknown>)?.role === 'superadmin') {
    return <DashboardLayout />;
  }

  return <LandingPage onGoDashboard={() => setShowDashboard(true)} />;
}
