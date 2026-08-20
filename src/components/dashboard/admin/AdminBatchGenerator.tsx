'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import QRCodeStyling from 'qr-code-styling';
import { jsPDF } from 'jspdf';
import {
  Loader2, Download, Palette, QrCode, CheckCircle,
  Wifi, Home, ListChecks, Star, Eye, RotateCcw,
  Sparkles, Type, ImageIcon, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BATCH_QUANTITIES,
  DOT_STYLE_OPTIONS,
  type DotStyle,
  type DesignConfig,
} from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  '#059669', '#2563EB', '#7C3AED', '#DC2626',
  '#EA580C', '#0891B2', '#4F46E5', '#BE185D',
  '#D97706', '#0D9488', '#4338CA', '#B91C1C',
];

const BG_COLOR_PRESETS = [
  '#FFFFFF', '#F9FAFB', '#F0FDF4', '#EFF6FF',
  '#FDF4FF', '#FFF7ED', '#FEF2F2', '#F0F9FF',
  '#F5F3FF', '#ECFDF5', '#FFFBEB', '#FDF2F8',
];

type CornerStyle = 'square' | 'dot' | 'extra-rounded';

const CORNER_STYLE_OPTIONS: Record<CornerStyle, string> = {
  square: 'Carré',
  dot: 'Rond',
  'extra-rounded': 'Arrondi',
};

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

const ERROR_CORRECTION_OPTIONS: Record<ErrorCorrectionLevel, { label: string; description: string }> = {
  L: { label: 'L — 7%', description: 'Basse récupération' },
  M: { label: 'M — 15%', description: 'Moyenne récupération' },
  Q: { label: 'Q — 25%', description: 'Haute récupération' },
  H: { label: 'H — 30%', description: 'Maximale récupération' },
};

type LogoPresetKey = 'wifi' | 'maison' | 'liste' | 'aucun';

const LOGO_PRESETS: Record<LogoPresetKey, { label: string; icon: string }> = {
  wifi: { label: 'Wi-Fi', icon: 'Wifi' },
  maison: { label: 'Maison', icon: 'Home' },
  liste: { label: 'Liste', icon: 'ListChecks' },
  aucun: { label: 'Aucun', icon: 'X' },
};

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  color: string;
  backgroundColor: string;
  dotStyle: DotStyle;
  cornerStyle: CornerStyle;
  errorCorrection: ErrorCorrectionLevel;
  logo: LogoPresetKey;
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'classique',
    name: 'Classique',
    description: 'QR noir sur fond blanc, style carré',
    color: '#000000',
    backgroundColor: '#FFFFFF',
    dotStyle: 'square',
    cornerStyle: 'square',
    errorCorrection: 'M',
    logo: 'aucun',
  },
  {
    id: 'moderne',
    name: 'Moderne',
    description: 'Arrondi avec coins doux, couleur émeraude',
    color: '#059669',
    backgroundColor: '#F0FDF4',
    dotStyle: 'rounded',
    cornerStyle: 'extra-rounded',
    errorCorrection: 'M',
    logo: 'aucun',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Style pointillé avec fond bleu nuit',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    dotStyle: 'dots',
    cornerStyle: 'dot',
    errorCorrection: 'Q',
    logo: 'maison',
  },
  {
    id: 'elegance',
    name: 'Élégance',
    description: 'Classique arrondi, violet, haut fiabilité',
    color: '#7C3AED',
    backgroundColor: '#FDF4FF',
    dotStyle: 'classy-rounded',
    cornerStyle: 'extra-rounded',
    errorCorrection: 'H',
    logo: 'maison',
  },
  {
    id: 'dynamique',
    name: 'Dynamique',
    description: 'Points ronds vifs, orange, logo Wi-Fi',
    color: '#EA580C',
    backgroundColor: '#FFF7ED',
    dotStyle: 'rounded',
    cornerStyle: 'dot',
    errorCorrection: 'Q',
    logo: 'wifi',
  },
];

// Map dot style to qr-code-styling type
const DOT_STYLE_MAP: Record<DotStyle, 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded'> = {
  square: 'square',
  rounded: 'rounded',
  dots: 'dots',
  classy: 'classy',
  'classy-rounded': 'classy-rounded',
  'extra-rounded': 'extra-rounded',
};

// ─── Types ────────────────────────────────────────────────────────────────

interface BatchResult {
  id: string;
  name?: string | null;
  quantity: number;
  designConfigJson: string;
  qrCodes: { id: string; activationCode: string; status: string }[];
  createdAt: string;
}

// ─── Component ────────────────────────────────────────────────────────────

export function AdminBatchGenerator() {
  const { data: session } = useSession();

  // Form state
  const [quantity, setQuantity] = useState<number>(10);
  const [color, setColor] = useState('#059669');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [dotStyle, setDotStyle] = useState<DotStyle>('rounded');
  const [cornerStyle, setCornerStyle] = useState<CornerStyle>('extra-rounded');
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('M');
  const [logoPreset, setLogoPreset] = useState<LogoPresetKey>('aucun');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [batchName, setBatchName] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [generatedBatch, setGeneratedBatch] = useState<BatchResult | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string>('');

  // QR Preview
  const [previewData, setPreviewData] = useState('QR-DEMO-PREVIEW');
  const previewRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<QRCodeStyling | null>(null);
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Resolve logo URL
  const getLogoUrl = useCallback(() => {
    if (logoPreset === 'aucun') return customLogoUrl || undefined;
    // Use a placeholder SVG encoded as data URI for presets
    const icons: Record<string, string> = {
      wifi: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>')}`,
      maison: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>')}`,
      liste: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><line x1="13" y1="6" x2="21" y2="6"/><line x1="13" y1="12" x2="21" y2="12"/><line x1="13" y1="18" x2="21" y2="18"/></svg>')}`,
    };
    return icons[logoPreset] || undefined;
  }, [logoPreset, customLogoUrl, color]);

  // QR Code Styling options
  const getQrOptions = useCallback(() => {
    const logoUrl = getLogoUrl();
    return {
      width: 200,
      height: 200,
      data: `https://qrdomotik.com/?activate=${previewData}`,
      dotsOptions: {
        color,
        type: DOT_STYLE_MAP[dotStyle],
      },
      cornersSquareOptions: {
        color,
        type: cornerStyle as 'square' | 'extra-rounded' | 'dot',
      },
      cornersDotOptions: {
        color,
        type: cornerStyle === 'square' ? 'square' : 'dot',
      },
      backgroundOptions: {
        color: backgroundColor,
      },
      qrOptions: {
        errorCorrectionLevel: errorCorrection,
      },
      ...(logoUrl
        ? {
            image: logoUrl,
            imageOptions: { crossOrigin: 'anonymous', margin: 5, imageSize: 0.35 },
          }
        : {}),
    };
  }, [color, backgroundColor, dotStyle, cornerStyle, errorCorrection, getLogoUrl, previewData]);

  // Live preview
  useEffect(() => {
    if (!previewRef.current) return;
    const container = previewRef.current;
    container.innerHTML = '';

    const qr = new QRCodeStyling(getQrOptions());
    qr.append(container);
    qrInstanceRef.current = qr;
  }, [getQrOptions]);

  // Apply template preset
  const applyTemplate = useCallback((template: TemplatePreset) => {
    setColor(template.color);
    setBackgroundColor(template.backgroundColor);
    setDotStyle(template.dotStyle);
    setCornerStyle(template.cornerStyle);
    setErrorCorrection(template.errorCorrection);
    setLogoPreset(template.logo);
    setActiveTemplate(template.id);
    toast.success(`Modèle « ${template.name} » appliqué`);
  }, []);

  // Reset all options
  const handleReset = useCallback(() => {
    setColor('#059669');
    setBackgroundColor('#FFFFFF');
    setDotStyle('rounded');
    setCornerStyle('extra-rounded');
    setErrorCorrection('M');
    setLogoPreset('aucun');
    setCustomLogoUrl('');
    setBatchName('');
    setQuantity(10);
    setActiveTemplate('');
    setGeneratedBatch(null);
    toast.info('Réinitialisé avec succès');
  }, []);

  // Build design config for API
  const buildDesignConfig = useCallback((): DesignConfig => {
    return {
      color,
      backgroundColor,
      dotStyle,
      logoUrl: getLogoUrl(),
    };
  }, [color, backgroundColor, dotStyle, getLogoUrl]);

  // Generate batch
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const designConfig = buildDesignConfig();
      const res = await fetch('/api/admin/qr-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, designConfig, name: batchName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de la génération');
        return;
      }
      setGeneratedBatch(data.data);
      toast.success(`Lot de ${quantity} QR codes généré avec succès !`);
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setLoading(false);
    }
  }, [quantity, buildDesignConfig, batchName]);

  // Render QR to a canvas element
  const renderQrToCanvas = useCallback(
    async (text: string, canvas: HTMLCanvasElement) => {
      const logoUrl = getLogoUrl();
      const qr = new QRCodeStyling({
        width: 200,
        height: 200,
        data: `https://qrdomotik.com/?activate=${text}`,
        dotsOptions: { color, type: DOT_STYLE_MAP[dotStyle] },
        cornersSquareOptions: { color, type: cornerStyle as 'square' | 'extra-rounded' | 'dot' },
        cornersDotOptions: { color, type: cornerStyle === 'square' ? 'square' : 'dot' },
        backgroundOptions: { color: backgroundColor },
        qrOptions: { errorCorrectionLevel: errorCorrection },
        ...(logoUrl
          ? { image: logoUrl, imageOptions: { crossOrigin: 'anonymous', margin: 5, imageSize: 0.35 } }
          : {}),
      });
      qr.append(canvas);
    },
    [color, backgroundColor, dotStyle, cornerStyle, errorCorrection, getLogoUrl],
  );

  // Download PDF
  const downloadPDF = useCallback(async () => {
    if (!generatedBatch) return;
    toast.info('Génération du PDF en cours...');

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const cols = quantity <= 10 ? 2 : quantity <= 15 ? 3 : 4;
      const cellW = (pageW - 20) / cols;
      const cellH = 50;
      const qrSize = 28;

      // Title
      pdf.setFontSize(14);
      pdf.setTextColor(30, 30, 30);
      pdf.text('QR Domotik — Lot d\'impression', pageW / 2, 8, { align: 'center' });

      if (batchName) {
        pdf.setFontSize(10);
        pdf.setTextColor(120, 120, 120);
        pdf.text(batchName, pageW / 2, 14, { align: 'center' });
      }

      const codes = generatedBatch.qrCodes;
      let idx = 0;
      let y = batchName ? 20 : 16;

      while (idx < codes.length) {
        if (y + cellH > pageH - 10) {
          pdf.addPage();
          y = 15;
        }
        for (let col = 0; col < cols && idx < codes.length; col++, idx++) {
          const x = 10 + col * cellW;
          const code = codes[idx];

          // Render QR to temp canvas
          const canvas = document.createElement('canvas');
          await renderQrToCanvas(
            `https://qrdomotik.com/?activate=${code.activationCode}`,
            canvas,
          );
          const imgData = canvas.toDataURL('image/png');

          // QR code image
          const qrX = x + (cellW - qrSize) / 2;
          pdf.addImage(imgData, 'PNG', qrX, y + 2, qrSize, qrSize);

          // Activation code text below
          pdf.setFontSize(7);
          pdf.setTextColor(100, 100, 100);
          pdf.text(code.activationCode, x + cellW / 2, y + qrSize + 7, { align: 'center' });

          // Status indicator
          pdf.setFontSize(6);
          pdf.setTextColor(180, 180, 180);
          pdf.text('Non activé', x + cellW / 2, y + qrSize + 12, { align: 'center' });
        }
        y += cellH;
      }

      pdf.save(`qr-domotik-lot-${generatedBatch.id.slice(0, 8)}.pdf`);
      toast.success('PDF téléchargé avec succès !');
    } catch {
      toast.error('Erreur lors de la génération du PDF');
    }
  }, [generatedBatch, quantity, batchName, renderQrToCanvas]);

  if (!session) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-purple-600" />
            Générateur de Lots
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Créez des lots de QR codes physiques avec personnalisation avancée
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-gray-500">
          <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
        </Button>
      </div>

      {/* Template Presets */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Modèles prédéfinis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {TEMPLATE_PRESETS.map((template) => (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => applyTemplate(template)}
                  className={`flex-shrink-0 w-36 p-3 rounded-xl border-2 text-left transition-all ${
                    activeTemplate === template.id
                      ? 'border-purple-500 bg-purple-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="w-full h-8 rounded-lg mb-2"
                    style={{
                      backgroundColor: template.backgroundColor,
                      border: `2px solid ${template.color}22`,
                    }}
                  >
                    <div className="flex items-center justify-center h-full gap-0.5">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-sm"
                          style={{ backgroundColor: template.color, opacity: 0.6 + i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-900">{template.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                    {template.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration */}
        <div className="lg:col-span-2 space-y-5">
          {/* Batch Name & Quantity */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-gray-400" />
                Nom du lot <span className="text-gray-400 font-normal">(optionnel)</span>
              </Label>
              <Input
                placeholder="ex: Lot Mai 2025 — Bordeaux"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Quantité</Label>
              <div className="flex gap-2">
                {BATCH_QUANTITIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      quantity === q
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Colors */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-gray-400" />
                Couleur principale
              </Label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setColor(c); setActiveTemplate(''); }}
                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                      color.toLowerCase() === c.toLowerCase()
                        ? 'border-gray-900 scale-110 ring-2 ring-gray-300'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="relative">
                  <Input
                    value={color}
                    onChange={(e) => { setColor(e.target.value); setActiveTemplate(''); }}
                    className="w-20 h-7 text-xs px-2 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <div
                  className="w-3.5 h-3.5 rounded border border-gray-300"
                  style={{ backgroundColor }}
                />
                Couleur de fond
              </Label>
              <div className="flex items-center gap-2 flex-wrap">
                {BG_COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setBackgroundColor(c); setActiveTemplate(''); }}
                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                      backgroundColor.toLowerCase() === c.toLowerCase()
                        ? 'border-gray-900 scale-110 ring-2 ring-gray-300'
                        : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <Input
                  value={backgroundColor}
                  onChange={(e) => { setBackgroundColor(e.target.value); setActiveTemplate(''); }}
                  className="w-20 h-7 text-xs px-2 font-mono"
                  maxLength={7}
                />
              </div>
            </div>
          </motion.div>

          <Separator />

          {/* Dot Style & Corner Style */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-gray-400" />
                Style des points
              </Label>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(DOT_STYLE_OPTIONS) as [DotStyle, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setDotStyle(key); setActiveTemplate(''); }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        dotStyle === key
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Style des coins</Label>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(CORNER_STYLE_OPTIONS) as [CornerStyle, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setCornerStyle(key); setActiveTemplate(''); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        cornerStyle === key
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
            </div>
          </motion.div>

          {/* Error Correction & Logo */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-gray-400" />
                Correction d&apos;erreur
              </Label>
              <Select
                value={errorCorrection}
                onValueChange={(v) => { setErrorCorrection(v as ErrorCorrectionLevel); setActiveTemplate(''); }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ERROR_CORRECTION_OPTIONS) as [ErrorCorrectionLevel, { label: string; description: string }][]).map(
                    ([key, opt]) => (
                      <SelectItem key={key} value={key}>
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-gray-400 ml-1">— {opt.description}</span>
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-gray-400">
                Un niveau plus élevé permet de lire le QR même partiellement masqué
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                Logo central
              </Label>
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    ['aucun', 'Aucun', 'X'],
                    ['wifi', 'Wi-Fi', 'Wifi'],
                    ['maison', 'Maison', 'Home'],
                    ['liste', 'Liste', 'ListChecks'],
                  ] as [LogoPresetKey, string, string][]
                ).map(([key, label]) => {
                  const IconComp =
                    key === 'wifi' ? Wifi : key === 'maison' ? Home : key === 'liste' ? ListChecks : Star;
                  return (
                    <button
                      key={key}
                      onClick={() => { setLogoPreset(key); setActiveTemplate(''); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        logoPreset === key
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>
              <Input
                placeholder="Ou URL personnalisée..."
                value={customLogoUrl}
                onChange={(e) => { setCustomLogoUrl(e.target.value); setLogoPreset('aucun'); setActiveTemplate(''); }}
                className="h-8 text-xs"
              />
            </div>
          </motion.div>

          {/* Generate Button */}
          <motion.div
            className="flex gap-3 pt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 gap-2"
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4" />
              )}
              Générer le lot de {quantity}
            </Button>
            {generatedBatch && (
              <Button
                onClick={downloadPDF}
                variant="outline"
                className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 gap-2"
                size="lg"
              >
                <Download className="w-4 h-4" /> Télécharger le PDF
              </Button>
            )}
          </motion.div>

          {/* Generated Result */}
          <AnimatePresence>
            {generatedBatch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-50/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Lot généré avec succès
                      <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-200 bg-white">
                        {generatedBatch.qrCodes.length} codes
                      </Badge>
                    </CardTitle>
                    {generatedBatch.name && (
                      <p className="text-xs text-emerald-600">
                        Nom : {generatedBatch.name}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-80 overflow-y-auto">
                      {generatedBatch.qrCodes.map((qr) => (
                        <div
                          key={qr.id}
                          className="bg-white rounded-lg p-2 text-center border border-emerald-100 hover:shadow-md transition-shadow"
                        >
                          <canvas
                            ref={(el) => {
                              if (el) {
                                canvasRefs.current.set(qr.activationCode, el);
                                renderQrToCanvas(
                                  `https://qrdomotik.com/?activate=${qr.activationCode}`,
                                  el,
                                );
                              }
                            }}
                            width={80}
                            height={80}
                            className="mx-auto"
                          />
                          <p className="text-[9px] font-mono text-gray-500 mt-1.5 truncate">
                            {qr.activationCode}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Live Preview */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-sm sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                Aperçu en direct
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl p-4 flex items-center justify-center"
                style={{ backgroundColor: '#F9FAFB' }}
              >
                <div
                  ref={previewRef}
                  className="rounded-lg overflow-hidden shadow-sm"
                  style={{ backgroundColor }}
                />
              </div>

              <Separator className="my-4" />

              {/* Config Summary */}
              <div className="space-y-2.5 text-xs">
                <h4 className="font-semibold text-gray-700 text-[11px] uppercase tracking-wide">
                  Configuration actuelle
                </h4>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Quantité</span>
                  <Badge variant="outline" className="text-[10px] h-5">
                    {quantity} codes
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Couleur</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3.5 h-3.5 rounded-sm border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-mono text-gray-600">{color}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Fond</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3.5 h-3.5 rounded-sm border border-gray-200"
                      style={{ backgroundColor }}
                    />
                    <span className="font-mono text-gray-600">{backgroundColor}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Points</span>
                  <span className="text-gray-700 font-medium">
                    {DOT_STYLE_OPTIONS[dotStyle]}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Coins</span>
                  <span className="text-gray-700 font-medium">
                    {CORNER_STYLE_OPTIONS[cornerStyle]}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Correction</span>
                  <span className="text-gray-700 font-medium">
                    Niveau {errorCorrection}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Logo</span>
                  <span className="text-gray-700 font-medium">
                    {logoPreset === 'aucun' && !customLogoUrl
                      ? 'Aucun'
                      : logoPreset !== 'aucun'
                        ? LOGO_PRESETS[logoPreset].label
                        : 'Personnalisé'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
