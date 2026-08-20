'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogEntry {
  id: string;
  actionType: string;
  actionLabel: string;
  visitorName: string | null;
  userName: string | null;
  qrCode: { name: string; type: string; publicSlug: string } | null;
  detail: any;
  createdAt: string;
}

export function ActivityLogs({ homeId, qrCodeId }: { homeId: string; qrCodeId?: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ homeId });
      if (qrCodeId) params.set('qrCodeId', qrCodeId);
      const res = await fetch(`/api/activity-logs?${params}`);
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [homeId, qrCodeId]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold">Journal d'activité</h3>
          {logs.length > 0 && <Badge variant="secondary" className="text-xs">{logs.length}</Badge>}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refresh} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading && logs.length === 0 ? (
        <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /></div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Aucune activité enregistrée</p>
      ) : (
        <ScrollArea className="max-h-80">
          <div className="space-y-1.5">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <span className="text-sm mt-0.5 shrink-0">{log.actionLabel.split(' ')[0]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm">{log.actionLabel.substring(log.actionLabel.indexOf(' ') + 1)}</span>
                    {log.visitorName && <Badge variant="outline" className="text-xs">{log.visitorName}</Badge>}
                  </div>
                  {log.qrCode && <p className="text-xs text-muted-foreground">{log.qrCode.name}</p>}
                  {log.detail?.name && <p className="text-xs text-muted-foreground">{log.detail.name}</p>}
                  {log.detail?.message && <p className="text-xs text-muted-foreground italic">&quot;{log.detail.message}&quot;</p>}
                  {log.detail?.instruction && <p className="text-xs text-muted-foreground">→ {log.detail.instruction}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{formatTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
