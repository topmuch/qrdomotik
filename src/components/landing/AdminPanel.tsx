'use client';

import { useSession } from 'next-auth/react';
import { X, QrCode, ShieldCheck, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePanelStore } from '@/store/panel-store';
import { BatchGenerator } from '@/components/admin/BatchGenerator';
import { PhysicalQrManager } from '@/components/admin/PhysicalQrManager';

export function AdminPanel() {
  const { adminOpen, closeAdmin } = usePanelStore();
  const { data: session } = useSession();
  const isAdmin = session && (session.user as Record<string, unknown>).role === 'superadmin';

  if (!adminOpen) return null;
  if (!session) return null;
  if (!isAdmin) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-900">Back-office Superadmin</span>
          </div>
          <Button variant="ghost" size="icon" onClick={closeAdmin}><X className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="generate">
          <TabsList className="mb-6">
            <TabsTrigger value="generate" className="gap-1.5"><QrCode className="w-4 h-4" /> Générer un lot</TabsTrigger>
            <TabsTrigger value="manage" className="gap-1.5"><Settings className="w-4 h-4" /> Gérer les codes</TabsTrigger>
          </TabsList>
          <TabsContent value="generate"><BatchGenerator /></TabsContent>
          <TabsContent value="manage"><PhysicalQrManager /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
