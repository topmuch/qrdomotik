'use client';

import { useState, useCallback } from 'react';
import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';
import { RefreshCw, Eye, EyeOff, Wifi, ShoppingCart, DoorOpen, BookOpen, UtensilsCrossed, Copy, Check } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollReveal } from './ScrollReveal';
import { toast } from 'sonner';

const DEMO_TABS = [
  { value: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { value: 'shopping', label: 'Liste Courses', icon: ShoppingCart },
  { value: 'doorman', label: 'Portier', icon: DoorOpen },
  { value: 'guestbook', label: "Livre d'Or", icon: BookOpen },
  { value: 'menu', label: 'Menu', icon: UtensilsCrossed },
] as const;

function WifiContent({ dark }: { dark: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const txt = dark ? 'text-white' : 'text-gray-900';
  const sub = dark ? 'text-gray-300' : 'text-gray-600';
  const bg = dark ? 'bg-gray-800' : 'bg-gray-100';
  const cardBg = dark ? 'bg-gray-800/50' : 'bg-white';

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-bold ${txt}`}>Wi-Fi Invités</h3>
      <div className={`${cardBg} rounded-xl p-4 space-y-3 border ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <Wifi className={`w-5 h-5 ${dark ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`font-medium ${txt}`}>QR_Domotik_Demo</span>
        </div>
        <div className="space-y-1">
          <label className={`text-xs font-medium ${sub}`}>Mot de passe</label>
          <div className="flex items-center gap-2">
            <div className={`${bg} flex-1 rounded-lg px-3 py-2 flex items-center gap-2`}>
              <span className={`font-mono text-sm ${txt}`}>
                {showPassword ? 'demo123' : '•••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className={`${sub} hover:${dark ? 'text-white' : 'text-gray-900'} transition-colors`}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>
      <div className={`${dark ? 'bg-amber-900/30 border-amber-700/50' : 'bg-amber-50 border-amber-200'} rounded-lg p-3 border`}>
        <p className={`text-xs ${dark ? 'text-amber-300' : 'text-amber-700'}`}>
          ⚠ Ceci est une démo
        </p>
      </div>
    </div>
  );
}

function ShoppingContent({ dark }: { dark: boolean }) {
  const [items] = useState([
    { id: '1', name: 'Lait', checked: false },
    { id: '2', name: 'Pain', checked: true },
    { id: '3', name: 'Oeufs', checked: false },
    { id: '4', name: 'Fromage', checked: true },
  ]);

  const txt = dark ? 'text-white' : 'text-gray-900';
  const sub = dark ? 'text-gray-300' : 'text-gray-600';
  const bg = dark ? 'bg-gray-800/50' : 'bg-white';
  const inputBg = dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900';

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-bold ${txt}`}>Liste de Courses</h3>
      <div className={`${bg} rounded-xl p-4 border ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <Checkbox checked={item.checked} disabled />
              <span
                className={`text-sm ${txt} ${item.checked ? 'line-through opacity-50' : ''}`}
              >
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`flex-1 rounded-lg px-3 py-2 ${inputBg} border`}>
          <span className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-400'}`}>Ajouter un article...</span>
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
          Ajouter
        </Button>
      </div>
    </div>
  );
}

function DoormanContent({ dark }: { dark: boolean }) {
  const txt = dark ? 'text-white' : 'text-gray-900';
  const sub = dark ? 'text-gray-300' : 'text-gray-600';
  const btnBg = dark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700';
  const cardBg = dark ? 'bg-gray-800/50' : 'bg-white';
  const inputBg = dark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400';

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-bold ${txt}`}>Portier Virtuel</h3>
      <div className="grid grid-cols-3 gap-2">
        <button className={`${btnBg} rounded-xl p-3 flex flex-col items-center gap-1 transition-colors`}>
          <span className="text-lg">📋</span>
          <span className="text-xs font-medium">Consigne</span>
        </button>
        <button className={`${btnBg} rounded-xl p-3 flex flex-col items-center gap-1 transition-colors`}>
          <span className="text-lg">💬</span>
          <span className="text-xs font-medium">Message</span>
        </button>
        <button className={`${btnBg} rounded-xl p-3 flex flex-col items-center gap-1 transition-colors`}>
          <span className="text-lg">🔔</span>
          <span className="text-xs font-medium">Sonner</span>
        </button>
      </div>
      <div className={`${cardBg} rounded-xl p-4 border ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
        <label className={`text-xs font-medium ${sub} block mb-2`}>Votre message</label>
        <div className={`${inputBg} rounded-lg p-3 border text-xs ${sub}`}>
          Colis déposé dans le garage, merci !
        </div>
      </div>
      <div className={`${dark ? 'bg-emerald-900/30 border-emerald-700/50' : 'bg-emerald-50 border-emerald-200'} rounded-lg p-3 border flex items-center gap-2`}>
        <Check className={`w-4 h-4 ${dark ? 'text-emerald-400' : 'text-emerald-600'}`} />
        <span className={`text-xs ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>
          Nous avons bien reçu votre message !
        </span>
      </div>
    </div>
  );
}

function GuestbookContent({ dark }: { dark: boolean }) {
  const txt = dark ? 'text-white' : 'text-gray-900';
  const sub = dark ? 'text-gray-400' : 'text-gray-500';
  const cardBg = dark ? 'bg-gray-800/50' : 'bg-white';
  const inputBg = dark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400';

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-bold ${txt}`}>Livre d'Or</h3>
      <div className="space-y-3">
        <div className={`${cardBg} rounded-xl p-3 border ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold">M</div>
            <div>
              <span className={`text-xs font-semibold ${txt}`}>Marie</span>
              <span className={`text-xs ${sub} ml-2`}>Il y a 2h</span>
            </div>
          </div>
          <p className={`text-xs ${sub}`}>Super soirée, merci pour l&apos;accueil !</p>
        </div>
        <div className={`${cardBg} rounded-xl p-3 border ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">T</div>
            <div>
              <span className={`text-xs font-semibold ${txt}`}>Thomas</span>
              <span className={`text-xs ${sub} ml-2`}>Il y a 5h</span>
            </div>
          </div>
          <p className={`text-xs ${sub}`}>Très pratique le Wi-Fi ! 🙌</p>
        </div>
        <div className={`${cardBg} rounded-xl p-3 border ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">S</div>
            <div>
              <span className={`text-xs font-semibold ${txt}`}>Sophie</span>
              <span className={`text-xs ${sub} ml-2`}>Hier</span>
            </div>
          </div>
          <p className={`text-xs ${sub}`}>Magnifique maison, on reviendra !</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className={`${inputBg} rounded-lg p-3 border text-xs`}>
          <span className={dark ? 'text-gray-400' : 'text-gray-400'}>Laissez un message...</span>
        </div>
        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          Envoyer
        </Button>
      </div>
    </div>
  );
}

function MenuContent({ dark }: { dark: boolean }) {
  const txt = dark ? 'text-white' : 'text-gray-900';
  const sub = dark ? 'text-gray-300' : 'text-gray-600';
  const cardBg = dark ? 'bg-gray-800/50' : 'bg-white';

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-bold ${txt}`}>Menu du Jour</h3>
      <div className={`${cardBg} rounded-xl p-4 border ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🍝</span>
          <div>
            <p className={`font-semibold ${txt}`}>Lasagnes maison</p>
            <p className={`text-xs ${sub}`}>+ Salade verte</p>
          </div>
        </div>
        <div className="mb-3">
          <p className={`text-xs font-medium ${sub} mb-2`}>Ingrédients :</p>
          <div className="flex flex-wrap gap-1.5">
            {['Pâtes', 'Bolognaise', 'Béchamel', 'Salade verte', 'Tomates'].map((ing) => (
              <span
                key={ing}
                className={`${dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} text-xs px-2 py-1 rounded-full`}
              >
                {ing}
              </span>
            ))}
          </div>
        </div>
        <button className={`text-xs font-medium ${dark ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
          Voir la recette →
        </button>
      </div>
    </div>
  );
}

export function LiveDemo() {
  const [qrSeed, setQrSeed] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('wifi');

  const handleRegenerate = useCallback(() => {
    setQrSeed((prev) => prev + 1);
  }, []);

  const handleShare = useCallback(() => {
    const url = typeof window !== 'undefined' ? window.location.href + '#demo' : '';
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Lien copié dans le presse-papier !');
    });
  }, []);

  const qrUrl = `https://qrdomotik.com/demo/${activeTab}?v=${qrSeed}`;

  const renderPhoneContent = () => {
    switch (activeTab) {
      case 'wifi':
        return <WifiContent dark={darkMode} />;
      case 'shopping':
        return <ShoppingContent dark={darkMode} />;
      case 'doorman':
        return <DoormanContent dark={darkMode} />;
      case 'guestbook':
        return <GuestbookContent dark={darkMode} />;
      case 'menu':
        return <MenuContent dark={darkMode} />;
      default:
        return null;
    }
  };

  return (
    <section
      id="demo"
      className="py-24 md:py-32 relative overflow-hidden"
      aria-label="Démonstration interactive"
    >
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .demo-gradient {
          background: linear-gradient(135deg, #2563EB, #1D4ED8, #059669, #2563EB);
          background-size: 300% 300%;
          animation: gradient-shift 12s ease infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .demo-gradient {
            animation: none;
            background: linear-gradient(135deg, #2563EB, #1D4ED8, #059669);
          }
        }
      `}</style>
      <div className="demo-gradient absolute inset-0" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold">
              Testez par vous-même
            </h2>
            <p className="text-blue-100 text-lg mt-4">
              Scannez, explorez, soyez convaincu
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex justify-center mb-10">
              <TabsList className="bg-white/10 backdrop-blur-md rounded-xl p-1 h-auto flex-wrap justify-center gap-1 border border-white/10">
                {DEMO_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white/80 hover:text-white rounded-lg px-3 py-2 text-sm font-medium transition-all"
                  >
                    <tab.icon className="w-4 h-4 mr-1.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {DEMO_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start max-w-4xl mx-auto">
                  {/* Left: QR Code */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white rounded-xl p-4 shadow-lg">
                      <QRCode
                        value={qrUrl}
                        size={200}
                        level="M"
                        bgColor="white"
                        fgColor="#1e293b"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRegenerate}
                      className="text-white/80 hover:text-white hover:bg-white/10 mt-4"
                      aria-label="Régénérer le QR code"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Régénérer
                    </Button>
                  </div>

                  {/* Right: Phone Mockup */}
                  <div className="flex flex-col items-center">
                    <div className="w-64 h-[500px] mx-auto rounded-[40px] border-8 border-gray-800 bg-white overflow-hidden relative shadow-2xl">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20" />
                      {/* Status bar */}
                      <div className={`h-10 flex items-center justify-center text-xs ${darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        9:41
                      </div>
                      {/* Content */}
                      <div
                        className={`p-4 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
                        style={{ height: 'calc(100% - 72px)' }}
                      >
                        {renderPhoneContent()}
                      </div>
                      {/* Dark mode toggle */}
                      <div className={`absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 px-6 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mode sombre</span>
                        <Switch
                          checked={darkMode}
                          onCheckedChange={setDarkMode}
                          aria-label="Basculer le mode sombre"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </ScrollReveal>

        {/* Share button */}
        <ScrollReveal delay={0.3}>
          <div className="text-center mt-12">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleShare}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-medium transition-all border border-white/20"
              aria-label="Partager cette démo"
            >
              Partager cette démo
            </motion.button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
