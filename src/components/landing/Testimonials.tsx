'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Star } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

interface Testimonial {
  name: string;
  location: string;
  quote: string;
  since: string;
  gradient: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Marie L.',
    location: 'Lyon',
    quote: "J'ai imprimé 12 QR codes en 10 minutes. Mes invités adorent le Wi-Fi instantané. Mes enfants adorent les corvées gamifiées. Génial !",
    since: '3 mois',
    gradient: 'from-blue-500 to-emerald-500',
  },
  {
    name: 'Thomas D.',
    location: 'Paris',
    quote: 'Le portier virtuel a changé ma vie. Plus de colis perdus, plus de livreurs qui sonnent pour rien. Simple et efficace.',
    since: '6 mois',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Sophie M.',
    location: 'Bordeaux',
    quote: "La liste de courses partagée avec mon mari, c'est le paradis. Plus jamais de \"tu as pris le lait ?\". On recommande à tout le monde.",
    since: '2 mois',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    name: 'Pierre R.',
    location: 'Marseille',
    quote: "En tant que pro de la domotique, je suis impressionné par la simplicité. Pas d'app, pas de config complexe. Juste du QR.",
    since: '8 mois',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    name: 'Claire B.',
    location: 'Toulouse',
    quote: "Le livre d'or pour nos soirées, c'est devenu indispensable. Nos invités adorent laisser un petit mot avant de partir.",
    since: '4 mois',
    gradient: 'from-rose-500 to-red-500',
  },
  {
    name: 'Lucas V.',
    location: 'Nantes',
    quote: 'Le suivi de médicaments pour ma grand-mère. Rassurant et simple. Elle peut même l\'utiliser seule avec son téléphone.',
    since: '1 mois',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

export function Testimonials() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    skipSnaps: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollTo = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const handleSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', handleSelect);
    return () => {
      emblaApi.off('select', handleSelect);
    };
  }, [emblaApi, handleSelect]);

  useEffect(() => {
    if (isPaused || !emblaApi) return;

    intervalRef.current = setInterval(() => {
      if (emblaApi) {
        emblaApi.scrollNext();
      }
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, emblaApi]);

  return (
    <section
      className="py-24 md:py-32 bg-gray-50/50"
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2
              id="testimonials-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900"
            >
              Ils ont transformé leur maison
            </h2>
            <p className="text-gray-500 text-lg mt-4">
              Plus de 1,200 familles nous font confiance
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div
            className="overflow-hidden max-w-5xl mx-auto"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="flex gap-6" ref={emblaRef}>
              <div className="flex">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 min-w-[300px] md:min-w-[400px] pl-[1px]"
                  >
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 h-full">
                      {/* Stars */}
                      <div className="flex gap-0.5" aria-label="5 étoiles">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>

                      {/* Quote */}
                      <p className="text-gray-700 text-base leading-relaxed mt-4">
                        &ldquo;{testimonial.quote}&rdquo;
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-3 mt-6">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-lg shrink-0`}
                          aria-hidden="true"
                        >
                          {testimonial.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {testimonial.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {testimonial.location}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Utilise depuis {testimonial.since}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div
              className="flex justify-center gap-2 mt-8"
              role="tablist"
              aria-label="Navigation des témoignages"
            >
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  role="tab"
                  aria-selected={index === selectedIndex}
                  aria-label={`Témoignage ${index + 1}`}
                  onClick={() => scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === selectedIndex
                      ? 'bg-blue-600 w-6'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
