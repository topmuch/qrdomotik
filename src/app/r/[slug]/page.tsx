'use client';

import { useEffect, useState, useCallback } from 'react';
import { QrCode, Home, MapPin, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PinGate } from '@/components/modules/PinGate';
import { InactiveQr } from '@/components/modules/InactiveQr';
import { WifiModule } from '@/components/modules/WifiModule';
import { LinkModule } from '@/components/modules/LinkModule';
import { InfoModule } from '@/components/modules/InfoModule';
import { PostitModule } from '@/components/modules/PostitModule';
import { ShoppingListModule } from '@/components/modules/ShoppingListModule';
import { DoormanModule } from '@/components/modules/DoormanModule';
import { MedicationModule } from '@/components/modules/MedicationModule';
import { ChoresModule } from '@/components/modules/ChoresModule';
import { StockDlcModule } from '@/components/modules/StockDlcModule';
import { DailyMenuModule } from '@/components/modules/DailyMenuModule';
import { TodoListModule } from '@/components/modules/TodoListModule';
import { GuestbookModule } from '@/components/modules/GuestbookModule';
import { EnergyCounterModule } from '@/components/modules/EnergyCounterModule';
import { KeysTrackerModule } from '@/components/modules/KeysTrackerModule';
import { DeepCleaningModule } from '@/components/modules/DeepCleaningModule';
import type { QrType } from '@/types';
import { QR_TYPE_LABELS } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────

interface QrPublicData {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  hasPin: boolean;
  isPresentMode?: boolean;
  homeName: string;
  homeAddress: string | null;
  roomName: string | null;
  contentJson: string | null;
  contentUpdatedAt: string | null;
}

// ─── Module router ─────────────────────────────────────────────────────────

function ModuleRouter({
  type,
  contentJson,
  slug,
}: {
  type: QrType;
  contentJson: string;
  slug: string;
}) {
  let content: any;
  try {
    content = JSON.parse(contentJson);
  } catch {
    content = {};
  }

  // Inject isPresentMode for Doorman
  if (type === 'doorman' && content) {
    // isPresentMode is stored on the QR record, not contentJson
    // It will be injected by the parent via content prop
  }

  switch (type) {
    case 'wifi':
      return <WifiModule content={content} slug={slug} />;
    case 'link':
      return <LinkModule content={content} slug={slug} />;
    case 'info':
      return <InfoModule content={content} slug={slug} />;
    case 'postit':
      return <PostitModule content={content} slug={slug} />;
    case 'shopping_list':
      return <ShoppingListModule content={content} slug={slug} />;
    case 'doorman':
      return <DoormanModule content={content} slug={slug} />;
    case 'medication':
      return <MedicationModule content={content} slug={slug} />;
    case 'chores':
      return <ChoresModule content={content} slug={slug} />;
    case 'stock_dlc':
      return <StockDlcModule content={content} slug={slug} />;
    case 'daily_menu':
      return <DailyMenuModule content={content} slug={slug} />;
    case 'todo_list':
      return <TodoListModule content={content} slug={slug} />;
    case 'guestbook':
      return <GuestbookModule content={content} slug={slug} />;
    case 'energy_counter':
      return <EnergyCounterModule content={content} slug={slug} />;
    case 'keys_tracker':
      return <KeysTrackerModule content={content} slug={slug} />;
    case 'deep_cleaning':
      return <DeepCleaningModule content={content} slug={slug} />;
    default:
      return (
        <div className="text-center text-muted-foreground py-8">
          Module non reconnu
        </div>
      );
  }
}

// ─── Page Component ────────────────────────────────────────────────────────

export default function PublicQrPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState('');
  const [data, setData] = useState<QrPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlockedContent, setUnlockedContent] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const fetchQrData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/r/${slug}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'QR code introuvable');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchQrData();
  }, [fetchQrData]);

  const handlePinUnlock = (contentJson: string) => {
    setUnlockedContent(contentJson);
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-3" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // ─── Error (404 etc.) ───
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <QrCode className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold mb-2 text-slate-700">QR introuvable</h1>
          <p className="text-sm text-muted-foreground">
            Ce QR code n&apos;existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  // ─── Inactive QR ───
  if (!data.isActive) {
    return <InactiveQr qrName={data.name} homeName={data.homeName} />;
  }

  // ─── PIN Required ───
  if (data.hasPin && unlockedContent === null) {
    return <PinGate slug={slug} onUnlock={handlePinUnlock} />;
  }

  // ─── Main Content ───
  const contentJson = unlockedContent || data.contentJson || '{}';
  const qrType = data.type as QrType;

  // For doorman, inject isPresentMode into content
  const finalContentJson =
    qrType === 'doorman'
      ? JSON.stringify({
          ...JSON.parse(contentJson),
          isPresentMode: data.isPresentMode,
        })
      : contentJson;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <QrCode className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-sm text-emerald-700 tracking-tight">
                QR Domotik
              </span>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {QR_TYPE_LABELS[qrType] || data.type}
            </Badge>
          </div>

          {/* Home & room info */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {data.homeName && (
              <span className="flex items-center gap-1 truncate">
                <Home className="w-3 h-3 shrink-0" />
                <span className="truncate">{data.homeName}</span>
              </span>
            )}
            {data.roomName && (
              <span className="truncate">&middot; {data.roomName}</span>
            )}
          </div>

          {/* QR name */}
          <h1 className="text-lg font-bold text-slate-800 mt-2 truncate">
            {data.name}
          </h1>
        </div>
      </header>

      {/* Module content */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto">
          <ModuleRouter
            type={qrType}
            contentJson={finalContentJson}
            slug={slug}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>Propulsé par QR Domotik</span>
          {data.homeAddress && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              {data.homeAddress}
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
