'use client';

import { QrCode, Twitter, Linkedin, Instagram, Mail } from 'lucide-react';

const productLinks = [
  { label: 'Fonctionnalités', href: '#modules' },
  { label: 'Démo', href: '#demo' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const legalLinks = [
  { label: "Conditions d'utilisation", href: '#' },
  { label: 'Confidentialité', href: '#' },
  { label: 'Cookies', href: '#' },
];

const socialLinks = [
  { icon: Twitter, label: 'Twitter' },
  { icon: Linkedin, label: 'LinkedIn' },
  { icon: Instagram, label: 'Instagram' },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Logo + Description */}
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-xl">QR Domotik</span>
            </div>
            <p className="text-sm mt-3 leading-relaxed">
              Transformez votre maison en espace phygital avec des QR codes
              dynamiques.
            </p>
            <div className="flex gap-3 mt-5">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href="#"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:text-white transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Col 2: Produit */}
          <div>
            <h3 className="text-white font-semibold mb-4">Produit</h3>
            <nav aria-label="Liens produit">
              {productLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm hover:text-white transition-colors py-1"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Col 3: Légal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Légal</h3>
            <nav aria-label="Liens légaux">
              {legalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm hover:text-white transition-colors py-1"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Col 4: Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <a
              href="mailto:contact@qrdomotik.com"
              className="flex items-center gap-2 text-sm hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" />
              contact@qrdomotik.com
            </a>
            <p className="text-sm mt-4">Fait avec ❤️ en France</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <p className="text-sm">
            © 2025 QR Domotik. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
