'use client';

import { useSession } from 'next-auth/react';
import { X, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePanelStore } from '@/store/panel-store';
import { UserPhysicalQrPanel } from '@/components/physical-qr/UserPhysicalQrPanel';

export function UserPanel() {
  const { userPanelOpen, closeUserPanel } = usePanelStore();
  const { data: session } = useSession();

  if (!userPanelOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-white overflow-y-auto">
      <div className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-900">Mes QR Codes Physiques</span>
          </div>
          <Button variant="ghost" size="icon" onClick={closeUserPanel}><X className="w-5 h-5" /></Button>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <UserPhysicalQrPanel />
      </div>
    </div>
  );
}
