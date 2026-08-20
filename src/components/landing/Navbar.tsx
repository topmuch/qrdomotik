'use client';
import { useEffect, useState } from 'react';
import { QrCode, Menu, ShieldCheck, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { useAuthStore } from '@/store/auth-store';
import { usePanelStore } from '@/store/panel-store';

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#modules' },
  { label: 'QR Physiques', href: '#physical-qr' },
  { label: 'Démo', href: '#demo' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

function handleSmoothScroll(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  e.preventDefault();
  const target = document.querySelector(href);
  if (target) target.scrollIntoView({ behavior: 'smooth' });
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { openAuth } = useAuthStore();
  const { openAdmin, openUserPanel } = usePanelStore();
  const { data: session } = useSession();
  const isAdmin = (session?.user as Record<string, unknown>)?.role === 'superadmin';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/50 transition-shadow duration-300 ${scrolled ? 'shadow-sm' : ''}`} role="navigation" aria-label="Navigation principale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#" className="flex items-center gap-2 group" aria-label="QR Domotik - Accueil">
            <QrCode className="w-7 h-7 text-blue-600 group-hover:text-blue-700 transition-colors" />
            <span className="text-xl font-bold text-gray-900">QR Domotik</span>
          </a>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={(e) => handleSmoothScroll(e, link.href)} className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm">{link.label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={openAdmin} className="text-xs gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin
              </Button>
            )}
            {session && (
              <Button variant="outline" size="sm" onClick={openUserPanel} className="text-xs gap-1">
                <Tag className="w-3.5 h-3.5" /> Mes QR
              </Button>
            )}
            {!session && <Button variant="ghost" onClick={() => openAuth('login')} className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium text-sm">Connexion</Button>}
            <Button onClick={() => openAuth('register')} className="rounded-full px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all font-medium text-sm">
              {session ? 'Mon compte' : 'Commencer gratuitement'}
            </Button>
          </div>

          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Ouvrir le menu"><Menu className="w-6 h-6" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2"><QrCode className="w-5 h-5 text-blue-600" />QR Domotik</SheetTitle>
                <SheetDescription>Navigation</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-4 px-4">
                {NAV_LINKS.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <a href={link.href} onClick={(e) => handleSmoothScroll(e, link.href)} className="text-gray-700 hover:text-gray-900 font-medium text-lg py-2">{link.label}</a>
                  </SheetClose>
                ))}
                <div className="border-t border-gray-200 my-2" />
                {isAdmin && (
                  <SheetClose asChild><Button variant="outline" onClick={openAdmin} className="gap-2"><ShieldCheck className="w-4 h-4" /> Admin</Button></SheetClose>
                )}
                {session && (
                  <SheetClose asChild><Button variant="outline" onClick={openUserPanel} className="gap-2"><Tag className="w-4 h-4" /> Mes QR</Button></SheetClose>
                )}
                <SheetClose asChild><Button onClick={() => openAuth('login')} variant="outline" className="w-full">Connexion</Button></SheetClose>
                <SheetClose asChild><Button onClick={() => openAuth('register')} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Commencer gratuitement</Button></SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
