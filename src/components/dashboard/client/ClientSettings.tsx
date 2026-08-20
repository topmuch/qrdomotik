'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Settings, User, Bell, Mail, ShieldAlert, Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

// ─── Component ────────────────────────────────────────────────────────────

export function ClientSettings() {
  const { data: session } = useSession();
  const user = session?.user;

  // Notification preferences (UI-only state, no API yet)
  const [prefs, setPrefs] = useState({
    emailNotifs: true,
    pushNotifs: false,
    visitorAlerts: true,
    stockAlerts: false,
    choreAlerts: true,
    promoAlerts: false,
  });

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!user) return null;

  const firstName = user.name?.split(' ')[0] || 'Utilisateur';

  const prefItems = [
    { key: 'emailNotifs' as const, label: 'Notifications par e-mail', desc: 'Recevez les alertes importantes par e-mail' },
    { key: 'pushNotifs' as const, label: 'Notifications push', desc: 'Notifications en temps réel dans le navigateur' },
    { key: 'visitorAlerts' as const, label: 'Alertes visiteurs', desc: 'Sonnerie et messages du portier virtuel' },
    { key: 'stockAlerts' as const, label: 'Alertes stock & DLC', desc: 'Rappels de péremption et stocks bas' },
    { key: 'choreAlerts' as const, label: 'Validation des corvées', desc: 'Quand une corvée attend votre validation' },
    { key: 'promoAlerts' as const, label: 'Promos du quartier', desc: 'Offres et promotions des commerces proches' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          Paramètres
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gérez votre profil et vos préférences.
        </p>
      </motion.div>

      {/* Profile Section */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              Profil
            </CardTitle>
            <CardDescription>
              Vos informations personnelles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar + name display */}
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-600 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                {firstName[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.name || 'Utilisateur'}</p>
                <Badge variant="outline" className="mt-1 text-[10px]">
                  Utilisateur
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Read-only fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="settings-name" className="text-xs text-gray-500">Nom complet</Label>
                <Input
                  id="settings-name"
                  value={user.name || ''}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-email" className="text-xs text-gray-500">
                  <Mail className="w-3 h-3 inline mr-1" />
                  Adresse e-mail
                </Label>
                <Input
                  id="settings-email"
                  value={user.email || ''}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Ces informations sont gérées via votre fournisseur de connexion.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Preferences */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choisissez les types de notifications que vous souhaitez recevoir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {prefItems.map((item, idx) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between py-3.5">
                    <div className="pr-4">
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <Switch
                      checked={prefs[item.key]}
                      onCheckedChange={() => togglePref(item.key)}
                    />
                  </div>
                  {idx < prefItems.length - 1 && <Separator />}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Préférences enregistrées localement
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone Placeholder */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="border-0 shadow-sm border border-dashed border-gray-200 bg-gray-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-gray-500">
              <ShieldAlert className="w-4 h-4" />
              Zone dangereuse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              Aucune action disponible pour le moment.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
