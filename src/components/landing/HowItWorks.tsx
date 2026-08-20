'use client';
import { Palette, Printer, Smartphone } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

const steps = [
  {
    number: 1,
    icon: Palette,
    title: 'Créez vos QR codes',
    description:
      "Choisissez parmi 15+ modules : Wi-Fi, liste de courses, livre d'or, portier virtuel...",
  },
  {
    number: 2,
    icon: Printer,
    title: 'Imprimez et collez',
    description:
      "Téléchargez en PNG/SVG. Imprimez. Collez où vous voulez. Design élégant garanti.",
  },
  {
    number: 3,
    icon: Smartphone,
    title: 'Scannez et profitez',
    description:
      "Vos invités scannent avec leur appareil photo. Accès instantané. Aucune app à installer.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 md:py-32 bg-white" aria-label="Comment ça marche">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
              3 étapes. Zéro application. 100% magique.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="mt-4 text-gray-600 text-lg">
              Créez, collez, scannez. C'est tout.
            </p>
          </ScrollReveal>
        </div>

        {/* Steps grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connecting lines (desktop only) */}
          <div
            className="hidden md:block absolute top-[56px] left-[calc(33.33%+16px)] right-[calc(33.33%+16px)] h-0 border-t-2 border-dashed border-gray-200"
            aria-hidden="true"
          />
          <div
            className="hidden md:block absolute top-[56px] left-[calc(66.66%+16px)] right-[calc(0%+16px)] h-0 border-t-2 border-dashed border-gray-200"
            aria-hidden="true"
          />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={step.number} delay={index * 0.15}>
                <div className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
                  {/* Step number */}
                  <div className="bg-gradient-to-br from-blue-600 to-emerald-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold mb-6">
                    {step.number}
                  </div>
                  {/* Icon */}
                  <Icon className="w-12 h-12 text-blue-500" aria-hidden="true" />
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mt-4">
                    {step.title}
                  </h3>
                  {/* Description */}
                  <p className="text-gray-600 mt-2 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
