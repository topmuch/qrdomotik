'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Siren, Phone, MapPin, Clock, Shield, Droplets, Zap, KeyRound,
  Flame, Navigation, XCircle, AlertTriangle, Info, ChevronRight,
} from 'lucide-react';
import {
  EMERGENCY_CATEGORY_LABELS, type EmergencyCategory,
} from '@/types';
import { DEFAULT_MAP_CENTER, EMERGENCY_CATEGORIES } from '@/lib/constants';

type EmergencyPro = {
  id: string;
  businessName: string;
  category: string;
  phone: string;
  latitude: number;
  longitude: number;
  rating: number;
  isVerified: boolean;
  distanceKm: number;
  distanceText: string;
};

type HomeInfo = {
  id: string;
  name: string;
  address: string | null;
  equipmentInfoJson?: string;
  emergencyContactsJson?: string;
  emergencyCategory?: string;
};

const CATEGORY_ICONS: Record<EmergencyCategory, typeof Droplets> = {
  plumber: Droplets,
  electrician: Zap,
  locksmith: KeyRound,
  heating: Flame,
};

const CATEGORY_COLORS: Record<EmergencyCategory, string> = {
  plumber: 'bg-sky-500',
  electrician: 'bg-amber-500',
  locksmith: 'bg-slate-700',
  heating: 'bg-red-500',
};

export function EmergencyView() {
  const [category, setCategory] = useState<EmergencyCategory>('plumber');
  const [pros, setPros] = useState<EmergencyPro[]>([]);
  const [homeInfo, setHomeInfo] = useState<HomeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [calling, setCalling] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category,
        latitude: String(DEFAULT_MAP_CENTER.latitude),
        longitude: String(DEFAULT_MAP_CENTER.longitude),
      });
      const res = await fetch(`/api/emergency-qr?${params}`);
      const json = await res.json();
      if (json.success) {
        setPros(json.data.professionals);
        setHomeInfo(json.data.home);
      }
    } catch {
      toast.error('Erreur chargement données urgence');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const callPro = (pro: EmergencyPro) => {
    setCalling(pro.id);
    toast.success(`Appel en cours vers ${pro.businessName}...`);
    // In production: window.location.href = `tel:${pro.phone}`;
    setTimeout(() => {
      setCalling(null);
      toast.info('Fonction d\'appel simulée (vrais appels en production)');
    }, 2000);
  };

  const CategoryIcon = CATEGORY_ICONS[category];
  const bgColor = CATEGORY_COLORS[category];

  let equipmentInfo: Record<string, string> = {};
  if (homeInfo?.equipmentInfoJson) {
    try { equipmentInfo = JSON.parse(homeInfo.equipmentInfoJson); } catch { /* ignore */ }
  }

  return (
    <div className="space-y-4">
      {/* Emergency Header */}
      <div className={`${bgColor} text-white p-4 rounded-xl`}> 
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
            <Siren className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg">Urgence</h2>
            <p className="text-white/80 text-sm">Trouvez un artisan disponible immédiatement</p>
          </div>
        </div>
      </div>

      {/* Category Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {EMERGENCY_CATEGORIES.map((cat) => {
          const CatIcon = CATEGORY_ICONS[cat];
          const isActive = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                isActive
                  ? `${CATEGORY_COLORS[cat]} text-white border-transparent shadow-lg`
                  : 'border-transparent bg-white hover:shadow-md'
              }`}
            >
              <CatIcon className={`h-6 w-6 mx-auto mb-1 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-foreground'}`}>
                {EMERGENCY_CATEGORY_LABELS[cat]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Equipment info if available */}
      {Object.keys(equipmentInfo).length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-sm text-amber-800">Informations équipement</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(equipmentInfo).map(([key, value]) => (
                <div key={key}>
                  <span className="text-amber-700 font-medium">{key}:</span>{' '}
                  <span className="text-amber-900">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available professionals */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-20 bg-muted rounded" /></CardContent></Card>
        ))}</div>
      ) : pros.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto text-amber-400 mb-3" />
            <p className="font-medium">Aucun artisan disponible en urgence</p>
            <p className="text-sm text-muted-foreground mt-1">
              Essayez une autre catégorie ou appelez les secours directement.
            </p>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="destructive" className="w-full" onClick={() => toast.info('Appel 15 simulé')}>
                <Siren className="h-4 w-4 mr-1" /> SAMU (15)
              </Button>
              <Button variant="destructive" className="w-full" onClick={() => toast.info('Appel 18 simulé')}>
                <Flame className="h-4 w-4 mr-1" /> Pompiers (18)
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {pros.length} artisan{pros.length > 1 ? 's' : ''} disponible{pros.length > 1 ? 's' : ''} en urgence
          </p>
          <AnimatePresence>
            {pros.map((pro, i) => (
              <motion.div
                key={pro.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-red-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl ${bgColor} flex items-center justify-center text-white font-bold text-lg`}>
                        {pro.businessName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-base">{pro.businessName}</h3>
                          {pro.isVerified && <Shield className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3 w-3" /> {pro.distanceText}
                          <span>·</span>
                          <span className="flex items-center gap-0.5">★ {pro.rating.toFixed(1)}</span>
                        </p>
                        {pro.phone && (
                          <p className="text-xs text-muted-foreground">{pro.phone}</p>
                        )}
                      </div>
                      <Button
                        className={`flex-shrink-0 ${calling === pro.id ? 'opacity-70' : ''}`}
                        onClick={() => callPro(pro)}
                        disabled={calling === pro.id}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {calling === pro.id ? 'Appel...' : 'Appeler'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Quick actions */}
      <Card className="bg-muted/50">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground text-center">
            💡 En production : géolocalisation automatique, appel direct, transmission des infos équipement
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
