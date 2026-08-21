'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  QrCode,
  Package,
  Zap,
  ShieldCheck,
  ScanLine,
  Printer,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  Layers,
  FileDown,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import { usePanelStore } from '@/store/panel-store';
import { DOT_STYLE_OPTIONS, BATCH_QUANTITIES, QR_TYPE_LABELS } from '@/types';
import type { DotStyle } from '@/types';

const STEPS = [
  {
    icon: Package,
    title: '1. Génération du lot',
    desc: 'Le superadmin génère un lot de 10, 15 ou 20 QR codes physiques avec un design personnalisé (couleur, style des points, logo).',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Printer,
    title: '2. Impression PDF',
    desc: 'Téléchargez une planche PDF prête à imprimer avec tous les QR codes autocollants, alignés et découpables.',
    color: 'from-cyan-500 to-emerald-500',
  },
  {
    icon: ScanLine,
    title: '3. Scan & Activation',
    desc: 'L\'utilisateur scanne le QR code, choisit un type de module (Wi-Fi, Liste de courses...), et l\'active instantanément.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Zap,
    title: '4. Utilisation',
    desc: 'Le QR physique devient un module dynamique complet, modifiable à tout moment depuis le tableau de bord.',
    color: 'from-teal-500 to-blue-500',
  },
];

const DEMO_CODES = [
  { code: 'QR-A7K9M2P3', status: 'active', type: 'Wi-Fi', name: 'Wi-Fi Invités' },
  { code: 'QR-B3N5P8Q1', status: 'inactive', type: null, name: null },
  { code: 'QR-C4H6R9T2', status: 'active', type: 'Liste de Courses', name: 'Courses Semaine' },
  { code: 'QR-D2J7S0U5', status: 'lost', type: null, name: null },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: 'Activé', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  inactive: { label: 'Inactif', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  lost: { label: 'Perdu', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  cancelled: { label: 'Annulé', className: 'bg-red-100 text-red-700 border-red-200' },
};

export function PhysicalQrSection() {
  const { openAuth } = useAuthStore();
  const { openAdmin, openUserPanel } = usePanelStore();
  const [demoCode, setDemoCode] = useState('');
  const [demoResult, setDemoResult] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');

  const handleDemoLookup = useCallback(async () => {
    const code = demoCode.trim().toUpperCase();
    if (!code) return;
    setDemoResult('loading');
    try {
      const res = await fetch(`/api/physical-qr/lookup?code=${code}`);
      const data = await res.json();
      setDemoResult(data.data ? 'found' : 'not_found');
    } catch {
      setDemoResult('not_found');
    }
  }, [demoCode]);

  return (
    <section id="physical-qr" className="relative py-20 sm:py-28 overflow-hidden">
      {/* Fond décoratif */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/40 to-white pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm font-medium border-blue-200 bg-blue-50 text-blue-700">
            <QrCode className="w-3.5 h-3.5 mr-1.5" />
            Nouveau — QR Codes Physiques
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Du physique au{' '}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              numérique
            </span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            Imprimez des QR codes physiques, collez-les chez vous, et activez-les en un scan.
            Chaque autocollant devient un module domotique intelligent.
          </p>
        </motion.div>

        {/* Étapes du processus */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} shadow-lg shadow-blue-500/10 mb-4 group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Démo visuelle — Tableau de bord admin */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <Card className="border-0 shadow-xl shadow-gray-200/50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-sm text-gray-300 font-mono">back-office.qrdomotik.com</span>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <CardTitle className="text-lg mt-3 flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Génération de lots — Aperçu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-gray-50">
              {/* Config simulateur */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantité</Label>
                  <div className="flex gap-1.5">
                    {BATCH_QUANTITIES.map((q) => (
                      <span key={q} className="flex-1 text-center py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white">
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Couleur</Label>
                  <div className="flex gap-2">
                    {['#2563EB', '#059669', '#DC2626', '#7C3AED'].map((c, i) => (
                      <div
                        key={c}
                        className={`w-8 h-8 rounded-full border-2 ${i === 0 ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Style des points</Label>
                  <div className="flex gap-1.5 flex-wrap">
                    {(Object.entries(DOT_STYLE_OPTIONS) as [DotStyle, string][]).slice(0, 4).map(([key, label]) => (
                      <span key={key} className={`px-2.5 py-1 rounded-md text-xs font-medium border ${key === 'rounded' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>{label}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grille QR simulée */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Aperçu des QR codes</span>
                  <span className="text-xs text-gray-400">Lot de 10 codes</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {['QR-A7K9M2P3', 'QR-B3N5P8Q1', 'QR-C4H6R9T2', 'QR-D2J7S0U5', 'QR-E8K1L4W6',
                   'QR-F5M2N7X9', 'QR-G9P3Q0Y8', 'QR-H1R4S6Z2', 'QR-J6T5U3A7', 'QR-K0V8W1B4'].map((code) => (
                    <div key={code} className="aspect-square bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center p-1.5 hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                      <QrCode className="w-10 h-10 text-blue-600 mb-1" />
                      <span className="text-[8px] font-mono text-gray-500 leading-tight text-center break-all">{code}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Boutons action simulés */}
              <div className="flex flex-wrap gap-3 mt-4">
                <Button disabled className="bg-blue-600">
                  <QrCode className="w-4 h-4 mr-2" /> Générer le lot
                </Button>
                <Button variant="outline" disabled className="border-emerald-500 text-emerald-700">
                  <FileDown className="w-4 h-4 mr-2" /> Télécharger PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Démo activation + Tableau des codes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Carte activation démo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-lg shadow-gray-200/50 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ScanLine className="w-5 h-5 text-blue-600" />
                  Testez l'activation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500">
                  Entrez un code d'activation pour voir le flux en action. Essayez un code de la liste ci-contre.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="QR-A7K9M2P3"
                      value={demoCode}
                      onChange={(e) => { setDemoCode(e.target.value); setDemoResult('idle'); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleDemoLookup()}
                      className="pl-9 font-mono text-sm"
                    />
                  </div>
                  <Button onClick={handleDemoLookup} disabled={demoResult === 'loading' || !demoCode.trim()} className="bg-blue-600 hover:bg-blue-700">
                    {demoResult === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  </Button>
                </div>

                {demoResult === 'idle' && (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <QrCode className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Entrez un code pour vérifier son statut
                  </div>
                )}

                {demoResult === 'loading' && (
                  <div className="text-center py-6 text-blue-500 text-sm">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Vérification du code...
                  </div>
                )}

                {demoResult === 'found' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-emerald-800 text-sm">Code trouvé !</p>
                      <p className="text-emerald-700 text-xs mt-1">
                        Ce code existe dans la base. Connectez-vous pour l'activer ou consultez son statut.
                      </p>
                    </div>
                  </div>
                )}

                {demoResult === 'not_found' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-red-800 text-sm">Code non trouvé</p>
                      <p className="text-red-700 text-xs mt-1">
                        Ce code n'existe pas dans notre base. Vérifiez et réessayez.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100">
                  <Button onClick={() => openAuth('register')} variant="outline" className="w-full text-sm">
                    Créer un compte pour activer vos QR codes <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Carte tableau des codes démo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-lg shadow-gray-200/50 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="w-5 h-5 text-blue-600" />
                  Exemple de codes générés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {DEMO_CODES.map((item) => (
                    <div
                      key={item.code}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all cursor-pointer"
                      onClick={() => { setDemoCode(item.code); setDemoResult('idle'); }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <QrCode className="w-4.5 h-4.5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-semibold text-gray-800 truncate">{item.code}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {item.name || 'Non activé'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={STATUS_BADGE[item.status]?.className || ''}>
                        {STATUS_BADGE[item.status]?.label || item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4 text-center">
                  Cliquez sur un code pour le tester dans le formulaire
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Section avantages clés */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: 'Traçabilité complète',
                desc: 'Chaque code est tracé : création, activation, désactivation, perte. Historique d\'audit complet.',
              },
              {
                icon: Zap,
                title: 'Activation en un scan',
                desc: 'Scannez, choisissez votre module, c\'est activé. Aucune configuration technique nécessaire.',
              },
              {
                icon: Layers,
                title: 'Design personnalisé',
                desc: 'Couleurs, styles de points, logo central. Vos QR codes porteront votre identité visuelle.',
              },
            ].map((adv, i) => (
              <div key={adv.title} className="text-center p-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-emerald-100 mb-4">
                  <adv.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{adv.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Button
            onClick={() => openAuth('register')}
            size="lg"
            className="rounded-full px-8 py-3 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all font-semibold text-base"
          >
            Commencer avec les QR Physiques
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
