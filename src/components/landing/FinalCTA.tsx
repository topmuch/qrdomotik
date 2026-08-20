'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { FloatingParticles } from './FloatingParticles';
import { useAuthStore } from '@/store/auth-store';

export function FinalCTA() {
  const { openAuth } = useAuthStore();

  return (
    <section className="py-24 md:py-32 relative overflow-hidden" aria-label="Appel à l'action final">
      <style>{`
        @keyframes cta-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .cta-gradient {
          background: linear-gradient(135deg, #2563EB, #1D4ED8, #059669, #2563EB);
          background-size: 300% 300%;
          animation: cta-gradient-shift 12s ease infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cta-gradient {
            animation: none;
            background: linear-gradient(135deg, #2563EB, #1D4ED8, #059669);
          }
        }
      `}</style>
      <div className="cta-gradient absolute inset-0" />
      <FloatingParticles className="z-0" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <ScrollReveal>
          <h2 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold">
            Prêt à rendre votre maison magique ?
          </h2>
          <p className="text-blue-100 text-lg mt-4">
            Rejoignez 1,247 familles qui ont déjà simplifié leur quotidien.
          </p>

          <div className="mt-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openAuth('register')}
              className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl px-10 py-4 text-lg font-semibold shadow-xl transition-colors"
              aria-label="Créer mon compte gratuit"
            >
              Créer mon compte gratuit
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>

          <a
            href="#demo"
            className="inline-block text-white/80 hover:text-white underline mt-6 text-base transition-colors"
          >
            Essayer la démo interactive
          </a>

          <p className="text-white/70 text-sm mt-8">
            ✓ Sans carte bancaire&nbsp;&nbsp;&nbsp;✓ Annulation à tout moment
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
