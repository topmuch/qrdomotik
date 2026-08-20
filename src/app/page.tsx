'use client';

import { useSession } from 'next-auth/react';
import { Suspense } from 'react';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
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
import { AdminPanel } from '@/components/landing/AdminPanel';
import { UserPanel } from '@/components/landing/UserPanel';
import { ActivationOverlay } from '@/components/physical-qr/ActivationOverlay';

function ActivationOverlayInner() {
  return <ActivationOverlay />;
}

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
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
      <AdminPanel />
      <UserPanel />
    </div>
  );
}

export default function Page() {
  const { data: session, status } = useSession();

  // Si connecté : dashboard. Sinon : landing page.
  if (status === 'authenticated' && session) {
    return <UserDashboard />;
  }

  return <LandingPage />;
}