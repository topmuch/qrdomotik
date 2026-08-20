'use client';
import { useEffect, useState } from 'react';
import { QrCode, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#modules' },
  { label: 'Démo', href: '#demo' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

function handleSmoothScroll(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  e.preventDefault();
  const target = document.querySelector(href);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { openAuth } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/50 transition-shadow duration-300 ${
        scrolled ? 'shadow-sm' : ''
      }`}
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2 group"
            aria-label="QR Domotik - Accueil"
          >
            <QrCode className="w-7 h-7 text-blue-600 group-hover:text-blue-700 transition-colors" />
            <span className="text-xl font-bold text-gray-900">
              QR Domotik
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => openAuth('login')}
              className="rounded-full px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium text-sm transition-all"
            >
              Connexion
            </Button>
            <Button
              onClick={() => openAuth('register')}
              className="rounded-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all font-medium text-sm"
            >
              Commencer gratuitement
            </Button>
          </div>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-600" />
                  QR Domotik
                </SheetTitle>
                <SheetDescription>Navigation</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-4 px-4">
                {NAV_LINKS.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <a
                      href={link.href}
                      onClick={(e) => handleSmoothScroll(e, link.href)}
                      className="text-gray-700 hover:text-gray-900 font-medium text-lg py-2 transition-colors"
                    >
                      {link.label}
                    </a>
                  </SheetClose>
                ))}
                <div className="border-t border-gray-200 my-2" />
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    onClick={() => openAuth('login')}
                    className="w-full rounded-full font-medium"
                  >
                    Connexion
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    onClick={() => openAuth('register')}
                    className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all font-medium"
                  >
                    Commencer gratuitement
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
