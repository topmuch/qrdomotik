'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DollarSign, TrendingUp, CreditCard, Zap, Briefcase, Store,
  ArrowUpRight, ArrowDownRight, Receipt, Crown, Award, CalendarDays,
} from 'lucide-react';
import {
  PRICING, COMMISSIONS,
} from '@/lib/constants';
import {
  TRANSACTION_TYPE_LABELS, TRANSACTION_STATUS_LABELS,
  SUBSCRIPTION_TIER_LABELS, type TransactionType, type SubscriptionPlan,
} from '@/types';

type Transaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  payerId: string | null;
  receiverId: string | null;
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
  merchant: { id: string; name: string } | null;
  professional: { id: string; businessName: string } | null;
};

const PLANS = [
  { key: 'merchant_premium', label: PRICING.merchant_premium.label, amount: PRICING.merchant_premium.amount, icon: Store, color: 'bg-emerald-500' },
  { key: 'merchant_featured', label: PRICING.merchant_featured.label, amount: PRICING.merchant_featured.amount, icon: Crown, color: 'bg-purple-500' },
  { key: 'professional_premium', label: PRICING.professional_premium.label, amount: PRICING.professional_premium.amount, icon: Briefcase, color: 'bg-violet-500' },
  { key: 'professional_featured', label: PRICING.professional_featured.label, amount: PRICING.professional_featured.amount, icon: Award, color: 'bg-amber-500' },
  { key: 'flash_sale_trigger', label: PRICING.flash_sale_trigger.label, amount: PRICING.flash_sale_trigger.amount, icon: Zap, color: 'bg-orange-500' },
  { key: 'verification_badge', label: PRICING.verification_badge.label, amount: PRICING.verification_badge.amount, icon: Award, color: 'bg-sky-500' },
];

const COMMISSION_ITEMS = [
  { key: 'flash_sale', label: COMMISSIONS.flash_sale.label, amount: COMMISSIONS.flash_sale.default },
  { key: 'service_match_depannage', label: COMMISSIONS.service_match_depannage.label, amount: COMMISSIONS.service_match_depannage.default },
  { key: 'service_match_entretien', label: COMMISSIONS.service_match_entretien.label, amount: COMMISSIONS.service_match_entretien.default },
  { key: 'service_match_bien_etre', label: COMMISSIONS.service_match_bien_etre.label, amount: COMMISSIONS.service_match_bien_etre.default },
  { key: 'service_match_assistance', label: COMMISSIONS.service_match_assistance.label, amount: COMMISSIONS.service_match_assistance.default },
  { key: 'redemption', label: COMMISSIONS.redemption.label, amount: COMMISSIONS.redemption.default },
];

export function MonetizationDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'pricing' | 'transactions'>('overview');
  const [subForm, setSubForm] = useState({ type: 'merchant', plan: 'premium' as SubscriptionPlan });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, subRes] = await Promise.all([
        fetch('/api/transactions?userId=demo-user'),
        fetch('/api/subscriptions?userId=demo-user'),
      ]);
      const [txJson, subJson] = await Promise.all([txRes.json(), subRes.json()]);
      if (txJson.success) setTransactions(txJson.data);
      if (subJson.success) setSubscriptions(subJson.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createSubscription = async () => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          subscriberType: subForm.type,
          plan: subForm.plan,
          merchantId: 'demo-merchant',
        }),
      });
      const json = await res.json();
      if (json.success) { toast.success(json.message); fetchData(); }
      else toast.error(json.error || 'Erreur');
    } catch { toast.error('Erreur réseau'); }
  };

  // Computed stats
  const totalRevenue = transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
  const monthlyRecurring = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          Monétisation
        </h2>
        <p className="text-sm text-muted-foreground">
          Abonnements, commissions et revenus
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {([['overview', 'Vue d\'ensemble', TrendingUp], ['pricing', 'Tarifs', CreditCard], ['transactions', 'Transactions', Receipt]] as const).map(
          ([value, label, Icon]) => (
            <button key={value}
              onClick={() => setActiveTab(value as 'overview' | 'pricing' | 'transactions')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}>
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          )
        )}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card><CardContent className="p-4 text-center">
                <DollarSign className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                <div className="text-2xl font-bold">{totalRevenue.toFixed(2)}€</div>
                <div className="text-xs text-muted-foreground">Revenus totaux</div>
              </CardContent></Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card><CardContent className="p-4 text-center">
                <CreditCard className="h-5 w-5 mx-auto text-violet-500 mb-1" />
                <div className="text-2xl font-bold">{monthlyRecurring.toFixed(2)}€</div>
                <div className="text-xs text-muted-foreground">Mensuel récurrent</div>
              </CardContent></Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card><CardContent className="p-4 text-center">
                <Store className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                <div className="text-2xl font-bold">{totalSubscriptions}</div>
                <div className="text-xs text-muted-foreground">Abonnements actifs</div>
              </CardContent></Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card><CardContent className="p-4 text-center">
                <Receipt className="h-5 w-5 mx-auto text-sky-500 mb-1" />
                <div className="text-2xl font-bold">{transactions.length}</div>
                <div className="text-xs text-muted-foreground">Transactions</div>
              </CardContent></Card>
            </motion.div>
          </div>

          {/* Commission breakdown */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Structure des commissions</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {COMMISSION_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <Badge variant="outline">{item.amount.toFixed(2)}€</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active subscriptions */}
          {subscriptions.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Abonnements actifs</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subscriptions.slice(0, 5).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                      <div>
                        <div className="font-medium">
                          {sub.merchant?.name || sub.professional?.businessName || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sub.subscriberType === 'merchant' ? 'Commerçant' : 'Artisan'} · {SUBSCRIPTION_TIER_LABELS[sub.plan as keyof typeof SUBSCRIPTION_TIER_LABELS]}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{sub.amount.toFixed(2)}€<span className="text-xs text-muted-foreground">/mois</span></div>
                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                          {sub.status === 'active' ? 'Actif' : sub.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Pricing */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          {/* Plans grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLANS.map((plan, i) => (
              <motion.div key={plan.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className={`h-10 w-10 rounded-lg ${plan.color} flex items-center justify-center text-white mb-3`}>
                      <plan.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-sm">{plan.label}</h3>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">{plan.amount.toFixed(2)}€</span>
                      {plan.key !== 'flash_sale_trigger' && plan.key !== 'verification_badge' && (
                        <span className="text-sm text-muted-foreground">/mois</span>
                      )}
                      {plan.key === 'verification_badge' && (
                        <span className="text-sm text-muted-foreground">/an</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Subscribe form */}
          <Card>
            <CardHeader><CardTitle className="text-base">Souscrire un abonnement</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={subForm.type} onValueChange={(v) => setSubForm({ ...subForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merchant">Commerçant</SelectItem>
                      <SelectItem value="professional">Artisan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Plan</label>
                  <Select value={subForm.plan} onValueChange={(v) => setSubForm({ ...subForm, plan: v as SubscriptionPlan })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="featured">En Vedette</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={createSubscription}>
                <CreditCard className="h-4 w-4 mr-2" />
                Souscrire ({(subForm.type === 'merchant'
                  ? (subForm.plan === 'featured' ? PRICING.merchant_featured.amount : PRICING.merchant_premium.amount)
                  : (subForm.plan === 'featured' ? PRICING.professional_featured.amount : PRICING.professional_premium.amount)
                ).toFixed(2)}€/mois)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions */}
      {activeTab === 'transactions' && (
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Receipt className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Aucune transaction</p>
            </CardContent></Card>
          ) : (
            transactions.map((tx, i) => (
              <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      tx.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                      tx.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {tx.type === 'subscription' ? <CreditCard className="h-4 w-4" /> :
                       tx.type === 'flash_sale' ? <Zap className="h-4 w-4" /> :
                       tx.type === 'commission' ? <TrendingUp className="h-4 w-4" /> :
                       <Receipt className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || TRANSACTION_TYPE_LABELS[tx.type as TransactionType]}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold">{tx.amount.toFixed(2)}€</p>
                      <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                        {TRANSACTION_STATUS_LABELS[tx.status as keyof typeof TRANSACTION_STATUS_LABELS]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
