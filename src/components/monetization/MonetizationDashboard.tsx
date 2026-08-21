'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DollarSign, TrendingUp, CreditCard, Zap, Receipt, Crown, Award,
  CalendarDays, Users, ArrowUpRight, Store, Wrench, Check,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_STATUS_LABELS,
  type TransactionType,
  type TransactionStatus,
  type SubscriptionPlanInfo,
  type SubscriberType,
} from '@/types';
import { COMMISSIONS } from '@/lib/constants';

// ─── Types ─────────────────────────────────────────────────────────────

type Transaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  referenceId: string | null;
  createdAt: string;
};

type RevenueMonth = {
  month: string;
  revenue: number;
  commissions: number;
  subscriptions: number;
};

type Subscription = {
  id: string;
  subscriberType: string;
  plan: string;
  amount: number;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  professional: { id: string; businessName: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-slate-100 text-slate-700',
};

// ─── Helper: get last 6 months labels ─────────────────────────────────

function getLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleDateString('fr-FR', { month: 'short' }));
  }
  return months;
}

// ─── Custom Tooltip for chart ──────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="text-sm font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.dataKey === 'revenue' ? 'Revenus' : entry.dataKey === 'commissions' ? 'Commissions' : 'Abonnements'}:{' '}
          {entry.value.toFixed(2)}€
        </p>
      ))}
    </div>
  );
}

// ─── Plan Card Component ───────────────────────────────────────────────

function PlanCard({ plan, isFeatured }: { plan: SubscriptionPlanInfo; isFeatured: boolean }) {
  const icon = plan.subscriberType === 'merchant' ? Store : Wrench;
  const Icon = icon;
  const accentColor = isFeatured
    ? 'bg-emerald-600 text-white'
    : 'bg-slate-600 text-white';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className={`relative overflow-hidden h-full flex flex-col ${isFeatured ? 'ring-2 ring-emerald-500' : ''}`}>
        {isFeatured && (
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
            POPULAIRE
          </div>
        )}
        <CardHeader className="pb-3">
          <div className={`h-10 w-10 rounded-lg ${accentColor} flex items-center justify-center mb-2`}>
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-base">{plan.label}</CardTitle>
          <CardDescription className="text-xs">
            {plan.subscriberType === 'merchant' ? 'Commerçant' : 'Artisan'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <div>
            <span className="text-3xl font-bold text-foreground">
              {plan.amount.toFixed(2).replace('.', ',')}€
            </span>
            <span className="text-sm text-muted-foreground">/mois</span>
          </div>

          <ul className="space-y-2 flex-1">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            className={`w-full ${isFeatured ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
            variant={isFeatured ? 'default' : 'outline'}
            onClick={() => toast.info('Stripe Connect n\'est pas encore configuré. Prochainement disponible !')}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            S'abonner
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export function MonetizationDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, subRes, plansRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/subscriptions'),
        fetch('/api/subscriptions/plans'),
      ]);
      const [txJson, subJson, plansJson] = await Promise.all([
        txRes.json(),
        subRes.json(),
        plansRes.json(),
      ]);
      if (txJson.success) setTransactions(txJson.data);
      if (subJson.success) setSubscriptions(subJson.data);
      if (plansJson.success) setPlans(plansJson.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Computed stats ────────────────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const currentMonthTx = transactions.filter(
    (t) => new Date(t.createdAt) >= monthStart,
  );
  const totalRevenue = currentMonthTx
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const commissions = currentMonthTx
    .filter((t) => t.status === 'completed' && t.type === 'commission')
    .reduce((sum, t) => sum + t.amount, 0);

  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === 'active',
  ).length;

  const monthlyTxCount = currentMonthTx.length;

  // ─── Chart data (last 6 months) ────────────────────────────────────
  const chartData: RevenueMonth[] = getLast6Months().map((month, i) => {
    const mStart = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
    const mTx = transactions.filter((t) => {
      const d = new Date(t.createdAt);
      return d >= mStart && d < mEnd && t.status === 'completed';
    });
    return {
      month,
      revenue: mTx.reduce((s, t) => s + t.amount, 0),
      commissions: mTx.filter((t) => t.type === 'commission').reduce((s, t) => s + t.amount, 0),
      subscriptions: mTx.filter((t) => t.type === 'subscription').reduce((s, t) => s + t.amount, 0),
    };
  });

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          Tableau de bord Monétisation
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Revenus, abonnements et commissions — Stripe Connect
        </p>
      </div>

      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-700">
                {loading ? '—' : `${totalRevenue.toFixed(2)}€`}
              </div>
              <div className="text-xs text-emerald-600/70">Total revenus (mois en cours)</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-slate-600" />
              </div>
              <div className="text-2xl font-bold">
                {loading ? '—' : `${commissions.toFixed(2)}€`}
              </div>
              <div className="text-xs text-muted-foreground">Commissions (mois)</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div className="text-2xl font-bold">
                {loading ? '—' : activeSubscriptions}
              </div>
              <div className="text-xs text-muted-foreground">Abonnements actifs</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Receipt className="h-5 w-5 text-slate-600" />
              </div>
              <div className="text-2xl font-bold">
                {loading ? '—' : monthlyTxCount}
              </div>
              <div className="text-xs text-muted-foreground">Transactions ce mois</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="revenue" className="flex-1">
            <TrendingUp className="h-4 w-4 mr-1.5 hidden sm:inline" />
            Revenus
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1">
            <Receipt className="h-4 w-4 mr-1.5 hidden sm:inline" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex-1">
            <Crown className="h-4 w-4 mr-1.5 hidden sm:inline" />
            Plans
          </TabsTrigger>
        </TabsList>

        {/* ─── Revenue Tab ──────────────────────────────────────────── */}
        <TabsContent value="revenue" className="space-y-4 mt-4">
          {/* Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenus — 6 derniers mois</CardTitle>
              <CardDescription>Évolution mensuelle des revenus, commissions et abonnements</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  Chargement...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenus" />
                    <Bar dataKey="commissions" fill="#64748b" radius={[4, 4, 0, 0]} name="Commissions" />
                    <Bar dataKey="subscriptions" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Abonnements" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Commission breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Structure des commissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(COMMISSIONS).map(([key, cfg]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{cfg.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Min: {cfg.min.toFixed(2)}€ — Max: {cfg.max.toFixed(2)}€
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {cfg.default.toFixed(2)}€
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Transactions Tab ────────────────────────────────────── */}
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Transactions récentes</CardTitle>
              <CardDescription>
                {transactions.length} transaction(s) au total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-12 text-center">
                  <Receipt className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground text-sm">Aucune transaction</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="hidden md:table-cell">Réf.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm">
                            {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {tx.type === 'flash_sale' && <Zap className="h-3.5 w-3.5 text-orange-500" />}
                              {tx.type === 'commission' && <TrendingUp className="h-3.5 w-3.5 text-slate-500" />}
                              {tx.type === 'subscription' && <CreditCard className="h-3.5 w-3.5 text-emerald-500" />}
                              {tx.type === 'redemption' && <Award className="h-3.5 w-3.5 text-amber-500" />}
                              <span className="text-sm">
                                {TRANSACTION_TYPE_LABELS[tx.type as TransactionType] ?? tx.type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            {tx.amount.toFixed(2)}€
                          </TableCell>
                          <TableCell>
                            <Badge className={`${STATUS_COLORS[tx.status] ?? ''} text-[11px]`}>
                              {TRANSACTION_STATUS_LABELS[tx.status as TransactionStatus] ?? tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono max-w-[100px] truncate">
                            {tx.referenceId ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Plans Tab ───────────────────────────────────────────── */}
        <TabsContent value="plans" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.length > 0
              ? plans.map((plan) => (
                  <PlanCard
                    key={`${plan.subscriberType}-${plan.plan}`}
                    plan={plan}
                    isFeatured={plan.plan === 'featured'}
                  />
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="h-64">
                    <CardContent className="h-full bg-muted animate-pulse rounded-lg" />
                  </Card>
                ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
