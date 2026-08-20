'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Layers, QrCode, CheckCircle, Users, Home, Zap,
  TrendingUp, BarChart3, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { QR_TYPE_LABELS, type QrType } from '@/types';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────

interface AdminStats {
  totalBatches: number;
  totalPhysicalQr: number;
  activePhysicalQr: number;
  inactivePhysicalQr: number;
  lostPhysicalQr: number;
  totalUsers: number;
  totalHomes: number;
  totalQrCodes: number;
  activationByDay: { date: string; count: number }[];
  typeDistribution: { type: string; count: number }[];
}

// ─── Chart Configs ────────────────────────────────────────────────────────

const lineChartConfig = {
  count: {
    label: 'Activations',
    color: '#059669',
  },
};

const PIE_COLORS = [
  '#059669', '#2563EB', '#7C3AED', '#DC2626', '#EA580C',
  '#0891B2', '#BE185D', '#4F46E5', '#D97706', '#65A30D',
  '#9333EA', '#0D9488', '#E11D48', '#CA8A04', '#6366F1',
  '#14B8A6',
];

// ─── Animation Variants ──────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// ─── Component ────────────────────────────────────────────────────────────

export function AdminOverview() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        toast.error(data.error || 'Erreur de chargement des statistiques');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (!session) return null;

  const statCards = [
    {
      label: 'Lots générés',
      value: stats?.totalBatches ?? 0,
      icon: Layers,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      borderColor: 'border-l-purple-500',
    },
    {
      label: 'QR Physiques',
      value: stats?.totalPhysicalQr ?? 0,
      icon: QrCode,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      borderColor: 'border-l-blue-500',
    },
    {
      label: 'QR Activés',
      value: stats?.activePhysicalQr ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      borderColor: 'border-l-emerald-500',
    },
    {
      label: 'Utilisateurs',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      borderColor: 'border-l-amber-500',
    },
    {
      label: 'Maisons',
      value: stats?.totalHomes ?? 0,
      icon: Home,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      borderColor: 'border-l-sky-500',
    },
    {
      label: 'QR Dynamiques',
      value: stats?.totalQrCodes ?? 0,
      icon: Zap,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      borderColor: 'border-l-rose-500',
    },
  ];

  // Prepare pie chart data with labels
  const pieData = (stats?.typeDistribution ?? []).map((item, idx) => ({
    name: QR_TYPE_LABELS[item.type as QrType] || item.type,
    value: item.count,
    fill: PIE_COLORS[idx % PIE_COLORS.length],
  }));

  const pieConfig = Object.fromEntries(
    pieData.map((item) => [
      item.name,
      { label: item.name, color: item.fill },
    ]),
  );

  // Format date for line chart axis
  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  // Activation rate
  const activationRate =
    stats && stats.totalPhysicalQr > 0
      ? Math.round((stats.activePhysicalQr / stats.totalPhysicalQr) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Vue d&apos;ensemble
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Statistiques globales de la plateforme QR Domotik
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards Grid */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {statCards.map((card) => {
          const IconComp = card.icon;
          return (
            <motion.div key={card.label} variants={itemVariants}>
              <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow border-l-4 ${card.borderColor}`}>
                <CardContent className="p-4">
                  <div
                    className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}
                  >
                    <IconComp className={`w-4.5 h-4.5 ${card.color}`} />
                  </div>
                  {loading ? (
                    <Skeleton className="h-7 w-12 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">
                      {card.value.toLocaleString('fr-FR')}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart — Activations sur 30 jours */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Activations sur 30 jours
              </CardTitle>
              <CardDescription>
                Nombre d&apos;activations de QR physiques par jour
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[280px] w-full rounded-lg" />
              ) : (
                <ChartContainer config={lineChartConfig} className="h-[280px] w-full">
                  <LineChart
                    data={stats?.activationByDay ?? []}
                    margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDay}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={11}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={11}
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            const d = new Date(String(value));
                            return d.toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            });
                          }}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--color-count)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart — Répartition par type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Répartition par type
              </CardTitle>
              <CardDescription>
                Distribution des QR codes dynamiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[280px] w-full rounded-lg" />
              ) : pieData.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center">
                  <p className="text-sm text-gray-400">
                    Aucune donnée disponible
                  </p>
                </div>
              ) : (
                <ChartContainer
                  config={pieConfig}
                  className="h-[280px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      content={<ChartTooltipContent nameKey="name" />}
                    />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      strokeWidth={1}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="name" />}
                    />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Summary Row */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Taux d'activation */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-50/30">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">
              Taux d&apos;activation
            </p>
            {loading ? (
              <Skeleton className="h-9 w-20 mb-1" />
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">
                  {activationRate}<span className="text-lg text-gray-400">%</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.activePhysicalQr ?? 0} sur {stats?.totalPhysicalQr ?? 0} codes
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Codes inactifs */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-50/30">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Codes inactifs
            </p>
            {loading ? (
              <Skeleton className="h-9 w-20 mb-1" />
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.inactivePhysicalQr ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  En attente d&apos;activation
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Codes perdus */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-50/30">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">
              Codes perdus
            </p>
            {loading ? (
              <Skeleton className="h-9 w-20 mb-1" />
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.lostPhysicalQr ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Signalés comme perdus
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
