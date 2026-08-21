'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, RefreshCw, Filter, CalendarDays, QrCode, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────

interface HomeData { id: string; name: string; }

interface LogEntry {
  id: string;
  actionType: string;
  actionLabel: string;
  visitorName: string | null;
  userName: string | null;
  qrCode: { name: string; type: string; publicSlug: string } | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Date presets ─────────────────────────────────────────────────────────

const DATE_PRESETS = [
  { label: 'Tout', value: 'all' },
  { label: "Aujourd'hui", value: 'today' },
  { label: '7 derniers jours', value: '7d' },
  { label: '30 derniers jours', value: '30d' },
] as const;

function filterByDate(logs: LogEntry[], preset: string): LogEntry[] {
  if (preset === 'all') return logs;
  const now = new Date();
  let cutoff: Date;

  if (preset === 'today') {
    cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (preset === '7d') {
    cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return logs.filter((log) => new Date(log.createdAt) >= cutoff);
}

// ─── Component ────────────────────────────────────────────────────────────

export function ClientActivity() {
  const [homes, setHomes] = useState<HomeData[]>([]);
  const [selectedHome, setSelectedHome] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [datePreset, setDatePreset] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Fetch homes
  const fetchHomes = useCallback(async () => {
    try {
      const res = await fetch('/api/homes');
      const data = await res.json();
      if (data.success) {
        const homesData: HomeData[] = Array.isArray(data.data) ? data.data : [];
        setHomes(homesData);
        if (homesData.length === 1 && !selectedHome) {
          setSelectedHome(homesData[0].id);
        }
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [selectedHome]);

  // Fetch logs
  const fetchLogs = useCallback(async (homeId: string) => {
    if (!homeId) { setLogs([]); setFilteredLogs([]); return; }
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/activity-logs?homeId=${homeId}&limit=100`);
      const data = await res.json();
      if (data.success) {
        const logsData: LogEntry[] = Array.isArray(data.data) ? data.data : [];
        setLogs(logsData);
        setFilteredLogs(filterByDate(logsData, datePreset));
      } else {
        toast.error(data.error || 'Erreur de chargement');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setLoadingLogs(false);
    }
  }, [datePreset]);

  useEffect(() => {
    fetchHomes();
  }, [fetchHomes]);

  useEffect(() => {
    if (selectedHome) fetchLogs(selectedHome);
  }, [selectedHome, fetchLogs]);

  // Apply date filter when preset changes
  useEffect(() => {
    setFilteredLogs(filterByDate(logs, datePreset));
  }, [datePreset, logs]);

  const handleRefresh = () => {
    if (selectedHome) fetchLogs(selectedHome);
  };

  const selectedHomeName = homes.find((h) => h.id === selectedHome)?.name;

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-600" />
            Journal d&apos;activité
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Consultez les événements de vos QR codes.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loadingLogs || !selectedHome}
          className="gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
          <Select value={selectedHome} onValueChange={setSelectedHome}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Choisir une maison" />
            </SelectTrigger>
            <SelectContent>
              {homes.map((h) => (
                <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Logs Table / Empty / Loading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {!selectedHome ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Sélectionnez une maison pour voir le journal.</p>
            </CardContent>
          </Card>
        ) : loadingLogs ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        ) : filteredLogs.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">Aucune activité</p>
              <p className="text-xs text-gray-400 mt-1">
                {logs.length > 0
                  ? 'Aucun événement pour cette période.'
                  : 'Les événements apparaîtront ici quand vos QR codes seront utilisés.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-[160px]">Date</TableHead>
                      <TableHead className="text-xs w-[200px]">Action</TableHead>
                      <TableHead className="text-xs">Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{log.actionLabel}</span>
                          </div>
                          {log.userName && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="text-[10px] text-gray-400">{log.userName}</span>
                            </div>
                          )}
                          {log.visitorName && (
                            <div className="mt-0.5">
                              <span className="text-[10px] text-gray-400">Visiteur : {log.visitorName}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {log.qrCode ? (
                            <div className="flex items-center gap-1.5">
                              <QrCode className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate">{log.qrCode.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
