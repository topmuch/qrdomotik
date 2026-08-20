'use client';

import { Heart, RefreshCw, ShieldCheck, Zap, Palette, Smartphone, BarChart3, Users } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

const advantages = [
  {
    title: '100% gratuit',
    description: 'Pour les particuliers. Sans carte bancaire. Pour toujours.',
    bigText: '0€/mois',
    icon: Heart,
    iconColor: 'text-emerald-600',
    bgClass: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    colSpan: 'md:col-span-2',
  },
  {
    title: 'Contenu dynamique',
    description: 'Changez le contenu sans réimprimer le QR code',
    icon: RefreshCw,
    iconColor: 'text-blue-600',
    bgClass: 'bg-blue-50',
    colSpan: 'col-span-1',
  },
  {
    title: 'Vos données à vous',
    description: 'Chiffrées. Sécurisées. RGPD compliant.',
    icon: ShieldCheck,
    iconColor: 'text-amber-600',
    bgClass: 'bg-amber-50',
    colSpan: 'col-span-1',
  },
  {
    title: 'Ultra rapide',
    description: 'Pages qui chargent en < 1 seconde',
    icon: Zap,
    iconColor: 'text-yellow-500',
    bgClass: 'bg-white',
    colSpan: 'col-span-1',
  },
  {
    title: 'Design élégant',
    description: 'QR codes personnalisables et modernes',
    icon: Palette,
    iconColor: 'text-purple-600',
    bgClass: 'bg-white',
    colSpan: 'col-span-1',
  },
  {
    title: 'Fonctionne partout',
    description: 'iOS et Android. Aucune application à installer. Juste scannez.',
    icon: Smartphone,
    iconColor: 'text-blue-600',
    bgClass: 'bg-gradient-to-r from-blue-50 to-purple-50',
    colSpan: 'md:col-span-2',
  },
  {
    title: 'Stats en temps réel',
    description: 'Suivez les scans de vos QR codes',
    icon: BarChart3,
    iconColor: 'text-green-600',
    bgClass: 'bg-white',
    colSpan: 'col-span-1',
  },
  {
    title: 'Partagez en famille',
    description: 'Conjoint, enfants, colocs. Gérez ensemble votre maison.',
    icon: Users,
    iconColor: 'text-orange-600',
    bgClass: 'bg-gradient-to-r from-orange-50 to-amber-50',
    colSpan: 'lg:col-span-2',
  },
] as const;

export function Advantages() {
  return (
    <section className="py-24 md:py-32 bg-white" aria-labelledby="advantages-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2
              id="advantages-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900"
            >
              Pourquoi choisir QR Domotik ?
            </h2>
            <p className="text-gray-500 text-lg mt-4">
              La solution la plus simple pour votre maison connectée
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {advantages.map((item, index) => {
            const Icon = item.icon;
            return (
              <ScrollReveal
                key={index}
                delay={index * 0.07}
                className={item.colSpan}
              >
                <div
                  className={`${item.bgClass} rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 h-full`}
                >
                  <Icon className={`w-8 h-8 ${item.iconColor} mb-4`} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                    {item.description}
                  </p>
                  {item.bigText && (
                    <p className="text-3xl font-bold text-gray-900 mt-4">
                      {item.bigText}
                    </p>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
