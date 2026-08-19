'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, BellRing, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

function getInitialPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission;
}

function getInitialDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('notif-permission-dismissed');
}

export function NotificationPermission() {
  const permission = getInitialPermission();
  const [dismissed, setDismissed] = useState(getInitialDismissed);
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Show banner after delay if permission is default and not dismissed
  useEffect(() => {
    if (permission === 'default' && !dismissed) {
      timerRef.current = setTimeout(() => setVisible(true), 3000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [permission, dismissed]);

  // Derived: don't show if permission is no longer default
  const showBanner = visible && permission === 'default';

  const handleRequest = useCallback(async () => {
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        await fetch('/api/push/subscribe', { method: 'POST' });
      }
    } catch {
      // ignore
    }
    setRequesting(false);
    setVisible(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setVisible(false);
    localStorage.setItem('notif-permission-dismissed', '1');
  }, []);

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3"
        >
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <BellRing className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-amber-800">Activer les notifications ?</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Recevez les alertes DLC, sonnette, et rappels de corvées en temps réel.
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                onClick={handleRequest}
                disabled={requesting}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs"
              >
                <Bell className="w-3 h-3 mr-1" />
                Activer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-7 text-xs text-amber-600"
              >
                Plus tard
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-amber-400 hover:text-amber-600 transition-colors -mt-0.5 -mr-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
