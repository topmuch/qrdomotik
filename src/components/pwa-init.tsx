'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/sw-register';
import { InstallButton } from '@/components/dashboard/InstallButton';
import { toast } from 'sonner';

export function PwaInit() {
  useEffect(() => {
    registerServiceWorker();

    // Listen for SW updates
    const handleUpdate = () => {
      toast('Mise à jour disponible', {
        description: 'Une nouvelle version est disponible. Rechargez la page.',
        action: {
          label: 'Recharger',
          onClick: () => window.location.reload(),
        },
        duration: 8000,
      });
    };

    window.addEventListener('sw-updated', handleUpdate);
    return () => window.removeEventListener('sw-updated', handleUpdate);
  }, []);

  return <InstallButton />;
}
