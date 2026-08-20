'use client';
import { useState } from 'react';
import {
  Wifi,
  ShoppingCart,
  DoorOpen,
  BookOpen,
  UtensilsCrossed,
  Pill,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollReveal } from './ScrollReveal';

interface ModuleCard {
  icon: LucideIcon;
  iconBg: string;
  title: string;
  description: string;
  badge?: { label: string; variant: 'default' | 'secondary' };
  mockContent: string;
}

const modules: ModuleCard[] = [
  {
    icon: Wifi,
    iconBg: 'bg-blue-100',
    title: 'Wi-Fi Invités',
    description: 'Connectez vos amis en 1 scan',
    badge: { label: 'Populaire', variant: 'default' },
    mockContent:
      'Votre invité scanne le QR code → Le réseau Wi-Fi se configure automatiquement. Plus besoin de dicter un mot de passe compliqué.SSID : Maison_DupontMot de passe : **********Sécurité : WPA3',
  },
  {
    icon: ShoppingCart,
    iconBg: 'bg-emerald-100',
    title: 'Liste de Courses',
    description: 'Plus jamais de lait oublié',
    badge: { label: 'Populaire', variant: 'default' },
    mockContent:
      'Scannez le QR code sur le frigo → Ajoutez des articles en temps réel.✅ Lait demi-écrémé✅ Pain complet✅ Œufs bio✅ Tomates cerises❌ Fromage (déjà acheté)Liste partagée avec toute la famille.',
  },
  {
    icon: DoorOpen,
    iconBg: 'bg-amber-100',
    title: 'Portier Virtuel',
    description: 'Instructions pour livreurs',
    mockContent:
      'Le livreur scanne le QR code sur votre porte → Instructions personnalisées :📦 Déposer le colis dans le coffre (code : 1234)🔕 Ne pas sonner après 21h🏠 En cas d\'absence, laisser chez le voisin n°3',
  },
  {
    icon: BookOpen,
    iconBg: 'bg-purple-100',
    title: 'Livre d\'Or',
    description: 'Messages de vos invités',
    badge: { label: 'Nouveau', variant: 'secondary' },
    mockContent:
      'Vos invités scannent le QR code dans l\'entrée → Ils laissent un message :📝 "Super soirée, merci !" — Marie📝 "Très bon accueil !" — Thomas📝 "On reviendra !" — Sophie',
  },
  {
    icon: UtensilsCrossed,
    iconBg: 'bg-orange-100',
    title: 'Menu du Jour',
    description: "Qu'est-ce qu'on mange ?",
    mockContent:
      "Scannez le QR code dans la cuisine → Le menu de la semaine s'affiche :🍽️ Lundi : Gratin dauphinois🍽️ Mardi : Poulet rôti🍽️ Mercredi : Salade César🍽️ Jeudi : Pâtes carbonara🍽️ Vendredi : Pizza maison",
  },
  {
    icon: Pill,
    iconBg: 'bg-red-100',
    title: 'Suivi Médicaments',
    description: 'Plus de double prise',
    badge: { label: 'Nouveau', variant: 'secondary' },
    mockContent:
      'Scannez le QR code dans la salle de bain → Suivi des médicaments de la famille :💊 Doliprane — 3x/jour, après repas💊 Vitamine D — 1x/jour, le matin💊 Oméprazole — 1x/jour, avant le petit-déjeunerDernière prise : aujourd\'hui à 8h00 ✅',
  },
];

export function PopularModules() {
  const [selectedModule, setSelectedModule] = useState<ModuleCard | null>(
    null
  );

  return (
    <>
      <section
        id="modules"
        className="py-24 md:py-32 bg-gray-50/50"
        aria-label="Modules populaires"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
                Tout ce dont votre maison a besoin
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="mt-4 text-gray-600 text-lg">
                15+ modules pour simplifier votre quotidien
              </p>
            </ScrollReveal>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, index) => {
              const Icon = mod.icon;
              return (
                <ScrollReveal key={mod.title} delay={index * 0.08}>
                  <div
                    className="relative bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full"
                    onClick={() => setSelectedModule(mod)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedModule(mod);
                      }
                    }}
                    aria-label={`Voir le module ${mod.title}`}
                  >
                    {/* Badge in top-right corner */}
                    {mod.badge && (
                      <div className="absolute top-4 right-4">
                        <Badge
                          variant={mod.badge.variant}
                          className={
                            mod.badge.variant === 'default'
                              ? 'bg-blue-600 text-white'
                              : ''
                          }
                        >
                          {mod.badge.label}
                        </Badge>
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className={`w-12 h-12 ${mod.iconBg} rounded-xl flex items-center justify-center mb-4`}
                    >
                      <Icon className="w-6 h-6 text-gray-700" aria-hidden="true" />
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-lg">
                      {mod.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mt-1">
                      {mod.description}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Module detail dialog */}
      <Dialog
        open={selectedModule !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedModule(null);
        }}
      >
        <DialogContent className="max-w-md">
          {selectedModule && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${selectedModule.iconBg} rounded-lg flex items-center justify-center`}
                  >
                    <selectedModule.icon
                      className="w-5 h-5 text-gray-700"
                      aria-hidden="true"
                    />
                  </div>
                  {selectedModule.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedModule.description}
                </DialogDescription>
              </DialogHeader>
              <Card className="mt-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 font-medium">
                    Aperçu du module
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {selectedModule.mockContent}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
