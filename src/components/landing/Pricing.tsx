'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollReveal } from './ScrollReveal';

const freeFeatures = [
  'QR codes illimités',
  '15+ modules',
  'Scans illimités',
  'Design personnalisable',
  'Support email',
];

const proFeatures = [
  'QR codes illimités',
  '15+ modules',
  'Scans illimités',
  'Design personnalisable',
  'Support email',
  'Stats avancées',
  'QR codes privés (PIN)',
  'Domaine personnalisé',
  'Support prioritaire',
  'Export PDF',
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="py-24 md:py-32 bg-white"
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2
              id="pricing-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900"
            >
              Un prix. Simple. Transparent.
            </h2>
            <p className="text-gray-500 text-lg mt-4">
              Commencez gratuitement, évoluez quand vous voulez
            </p>
          </div>
        </ScrollReveal>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <ScrollReveal>
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 h-full flex flex-col">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Gratuit</h3>
                <p className="text-gray-500 text-sm mt-1">pour toujours</p>
              </div>

              <div className="mt-6">
                <span className="text-5xl font-bold text-gray-900">0€</span>
                <span className="text-gray-500 ml-1">/mois</span>
              </div>

              <Separator className="my-6" />

              <ul className="space-y-3 flex-1" role="list">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="outline"
                className="w-full mt-8 border-blue-600 text-blue-600 hover:bg-blue-50"
                aria-label="Commencer gratuitement"
              >
                Commencer gratuitement
              </Button>
            </div>
          </ScrollReveal>

          {/* Pro Plan */}
          <ScrollReveal delay={0.15}>
            <div className="bg-white rounded-2xl p-8 border-2 border-blue-600 relative h-full flex flex-col">
              <Badge
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white rounded-full px-4 py-1 text-sm border-0"
              >
                Recommandé
              </Badge>

              <div>
                <h3 className="text-xl font-bold text-gray-900">Pro</h3>
              </div>

              <div className="mt-6">
                <span className="text-5xl font-bold text-gray-900">9,90€</span>
                <span className="text-gray-500 ml-1">/mois</span>
              </div>

              <Separator className="my-6" />

              <ul className="space-y-3 flex-1" role="list">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white"
                aria-label="Essai gratuit 14 jours"
              >
                Essai gratuit 14 jours
              </Button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Annulation à tout moment. Sans carte bancaire pour l&apos;essai.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
