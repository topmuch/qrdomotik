'use client';
import { motion } from 'framer-motion';
import { ArrowRight, Apple, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingParticles } from './FloatingParticles';
import { QRCodeDemo } from './QRCodeDemo';
import { useAuthStore } from '@/store/auth-store';

function handleScrollToDemo(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  const target = document.querySelector('#demo');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export function HeroSection() {
  const { openAuth } = useAuthStore();

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-white"
      aria-label="Section principale"
    >
      {/* Gradient blob decorations */}
      <div
        className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-100/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-emerald-100/50 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-amber-100/40 blur-3xl"
        aria-hidden="true"
      />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left side */}
          <motion.div
            className="flex-1 lg:w-[60%]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-4 py-1.5 text-sm font-medium">
                🚀 Nouveau : Version 2 disponible
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              variants={itemVariants}
              className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
            >
              Transformez votre maison en maison
              <br className="hidden sm:block" /> intelligente...{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500">
                sans application
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="mt-6 text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed"
            >
              Collez des QR codes chez vous. Scannez. C&apos;est magique.
              Gratuit pour toujours.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openAuth('register')}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-xl hover:shadow-xl hover:shadow-blue-500/25 transition-all font-semibold"
              >
                Créer mon premier QR code gratuit
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-4">
              <a
                href="#demo"
                onClick={handleScrollToDemo}
                className="text-blue-600 hover:text-blue-700 font-medium inline-block transition-colors"
              >
                Voir la démo ↓
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={itemVariants} className="mt-6">
              <p className="text-sm text-gray-500">
                ⭐⭐⭐⭐⭐ 4.9/5 par 1,247 utilisateurs
              </p>
            </motion.div>

            {/* Platform badges */}
            <motion.div
              variants={itemVariants}
              className="mt-4 flex items-center gap-3"
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1.5">
                <Apple className="w-3.5 h-3.5" />
                Compatible iOS
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                Compatible Android
              </span>
            </motion.div>
          </motion.div>

          {/* Right side */}
          <div className="flex-1 lg:w-[40%] flex justify-center">
            <QRCodeDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
