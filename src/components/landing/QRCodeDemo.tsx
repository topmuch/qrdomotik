'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const demos = [
  { key: 'wifi', url: 'https://qrdomotik.com/demo/wifi-guest', label: 'Wi-Fi Invités' },
  { key: 'list', url: 'https://qrdomotik.com/demo/shopping-list', label: 'Liste de Courses' },
  { key: 'porte', url: 'https://qrdomotik.com/demo/virtual-porter', label: 'Portier Virtuel' },
  { key: 'menu', url: 'https://qrdomotik.com/demo/daily-menu', label: 'Menu du Jour' },
];

type DemoKey = (typeof demos)[number]['key'];

const TOAST_MESSAGES = [
  'Marie vient de scanner un QR code il y a 2min',
  'Thomas a créé un QR Wi-Fi il y a 5min',
  'Sophie a partagé une liste de courses il y a 1min',
  'Lucas a imprimé un QR Portier il y a 3min',
];

export function QRCodeDemo() {
  const [currentDemo, setCurrentDemo] = useState(0);
  const [count, setCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const cycleDemo = useCallback(() => {
    setCurrentDemo((prev) => (prev + 1) % demos.length);
  }, []);

  // Count-up animation
  useEffect(() => {
    const target = 1247;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, []);

  // Toast notification
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setToastMessage(TOAST_MESSAGES[0]);
      setShowToast(true);
      const hideTimer = setTimeout(() => {
        setShowToast(false);
      }, 4000);
      return () => clearTimeout(hideTimer);
    }, 2000);
    return () => clearTimeout(showTimer);
  }, []);

  const demo = demos[currentDemo];

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
    >
      {/* Pulsing card */}
      <motion.div
        className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <h3 className="text-center font-semibold text-gray-900 text-lg mb-6">
          Scannez ce QR code !
        </h3>

        {/* QR Code container */}
        <div className="relative flex justify-center mb-6">
          <div className="rounded-2xl overflow-hidden p-4 bg-white shadow-inner">
            <AnimatePresence mode="wait">
              <motion.div
                key={demo.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <QRCode
                  value={demo.url}
                  size={240}
                  className="w-[240px] h-[240px] md:w-[280px] md:h-[280px]"
                  fgColor="#111827"
                  bgColor="white"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Centered Home icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
              <Home className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          {/* Scan line animation */}
          <div className="absolute inset-4 overflow-hidden rounded-xl pointer-events-none">
            <div
              className="w-full h-[2px]"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, #2563EB 30%, #2563EB 70%, transparent 100%)',
                animation: 'scanLine 3s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        {/* Demo label + button */}
        <div className="flex flex-col items-center gap-4">
          <Badge variant="outline" className="text-sm px-3 py-1">
            Démo : {demo.label}
          </Badge>
          <Button
            variant="outline"
            onClick={cycleDemo}
            className="gap-2 rounded-full hover:bg-gray-50"
            aria-label="Changer de démo"
          >
            <RefreshCw className="w-4 h-4" />
            Changer de démo
          </Button>
        </div>

        {/* Counter */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {count.toLocaleString('fr-FR')} QR codes générés aujourd&apos;hui
        </p>

        {/* Toast notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute bottom-4 left-4 right-4 bg-white rounded-xl border border-gray-100 shadow-lg p-3 flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <p className="text-xs text-gray-600 truncate">{toastMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Scan line keyframes */}
      <style>{`
        @keyframes scanLine {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </motion.div>
  );
}
