'use client';

import { useState, useRef, useEffect } from 'react';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { Download, Smartphone, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function InstallButton() {
  const { isInstallable, isInstalled, isStandalone, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('pwa-install-dismissed');
  });
  const [installing, setInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (isStandalone || isInstalled || !isInstallable || dismissed) return null;

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await promptInstall();
    setInstalling(false);
    if (accepted) {
      setShowSuccess(true);
      timerRef.current = setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-20 right-4 z-50 sm:bottom-6"
      >
        <div className="relative bg-white border border-emerald-200 rounded-2xl shadow-lg shadow-emerald-100/50 p-4 max-w-xs">
          <button
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 w-6 h-6 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3 text-slate-500" />
          </button>

          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <CheckCircle className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-emerald-700">Application installée !</p>
                  <p className="text-xs text-muted-foreground">Accédez-y depuis l'écran d'accueil</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Installer QR Domotik</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Accès rapide depuis l'écran d'accueil
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleInstall}
                  disabled={installing}
                  className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="sm"
                >
                  {installing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Installation...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5" />
                      Installer l'application
                    </span>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
