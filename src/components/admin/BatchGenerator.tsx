'use client';

import { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import QRCodeStyling from 'qr-code-styling';
import { jsPDF } from 'jspdf';
import { Loader2, Download, Palette, QrCode, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BATCH_QUANTITIES, DOT_STYLE_OPTIONS, type DotStyle } from '@/types';
import type { DesignConfig } from '@/types';

const COLORS = ['#2563EB', '#059669', '#DC2626', '#7C3AED', '#EA580C', '#0891B2', '#4F46E5', '#BE185D'];

interface BatchResult {
  id: string;
  quantity: number;
  designConfigJson: string;
  qrCodes: { id: string; activationCode: string; status: string }[];
  createdAt: string;
}

export function BatchGenerator() {
  const { data: session } = useSession();
  const [quantity, setQuantity] = useState<number>(10);
  const [color, setColor] = useState('#2563EB');
  const [dotStyle, setDotStyle] = useState<DotStyle>('rounded');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedBatch, setGeneratedBatch] = useState<BatchResult | null>(null);
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const designConfig: DesignConfig = { color, dotStyle, logoUrl: logoUrl || undefined };

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/qr-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, designConfig }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Erreur'); return; }
      setGeneratedBatch(data.data);
      toast.success(`Lot de ${quantity} QR codes généré !`);
    } catch { toast.error('Erreur serveur'); }
    finally { setLoading(false); }
  }, [quantity, designConfig]);

  const renderQr = useCallback(async (text: string, canvas: HTMLCanvasElement) => {
    const qr = new QRCodeStyling({
      width: 200,
      height: 200,
      data: `https://qrdomotik.com/?activate=${text}`,
      dotsOptions: { color, type: dotStyle === 'square' ? 'square' : dotStyle === 'dots' ? 'dots' : dotStyle === 'rounded' ? 'rounded' : dotStyle === 'classy' ? 'classy' : dotStyle === 'extra-rounded' ? 'extra-rounded' : 'classy-rounded' },
      cornersSquareOptions: { color, type: 'extra-rounded' },
      cornersDotOptions: { color, type: 'dot' },
      backgroundOptions: { color: '#FFFFFF' },
      ...(logoUrl ? { image: logoUrl, imageOptions: { crossOrigin: 'anonymous', margin: 5 } } : {}),
    });
    qr.append(canvas);
  }, [color, dotStyle, logoUrl]);

  const downloadPDF = useCallback(async () => {
    if (!generatedBatch) return;
    toast.info('Génération du PDF...');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const cols = quantity <= 10 ? 2 : quantity <= 15 ? 3 : 4;
    const cellW = (pageW - 20) / cols;
    const cellH = 45;
    const qrSize = 28;

    const codes = generatedBatch.qrCodes;
    let idx = 0;
    let y = 10;

    while (idx < codes.length) {
      if (y + cellH > pageH - 10) { pdf.addPage(); y = 10; }
      for (let col = 0; col < cols && idx < codes.length; col++, idx++) {
        const x = 10 + col * cellW;
        const code = codes[idx];

        // Render QR to temp canvas
        const canvas = document.createElement('canvas');
        await renderQr(`https://qrdomotik.com/?activate=${code.activationCode}`, canvas);
        const imgData = canvas.toDataURL('image/png');

        // QR code image
        const qrX = x + (cellW - qrSize) / 2;
        pdf.addImage(imgData, 'PNG', qrX, y + 2, qrSize, qrSize);

        // Code text below
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        pdf.text(code.activationCode, x + cellW / 2, y + qrSize + 7, { align: 'center' });
      }
      y += cellH;
    }

    pdf.save(`qr-domotik-lot-${generatedBatch.id.slice(0, 8)}.pdf`);
    toast.success('PDF téléchargé !');
  }, [generatedBatch, quantity, renderQr]);

  if (!session) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <QrCode className="w-5 h-5 text-blue-600" />
        Générateur de Lots QR Physiques
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quantité */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quantité</Label>
          <div className="flex gap-2">
            {BATCH_QUANTITIES.map((q) => (
              <button key={q} onClick={() => setQuantity(q)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${quantity === q ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Couleur */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1"><Palette className="w-4 h-4" /> Couleur</Label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: c }} />
            ))}
            <Input value={color} onChange={(e) => setColor(e.target.value)} className="w-20 h-8 text-xs px-2" />
          </div>
        </div>

        {/* Style des points */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Style des points</Label>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(DOT_STYLE_OPTIONS) as [DotStyle, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setDotStyle(key)}
                className={`px-2 py-1 rounded-md text-xs border transition-all ${dotStyle === key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logo URL */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">URL du logo central (optionnel)</Label>
        <Input placeholder="https://example.com/logo.png" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="max-w-md" />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleGenerate} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
          Générer le lot de {quantity}
        </Button>
        {generatedBatch && (
          <Button onClick={downloadPDF} variant="outline" className="border-emerald-500 text-emerald-700 hover:bg-emerald-50">
            <Download className="w-4 h-4 mr-2" /> Télécharger le PDF d'impression
          </Button>
        )}
      </div>

      {/* Résultat */}
      {generatedBatch && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-800 font-medium mb-3">
            <CheckCircle className="w-5 h-5" />
            Lot généré — {generatedBatch.qrCodes.length} codes
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-80 overflow-y-auto">
            {generatedBatch.qrCodes.map((qr) => (
              <div key={qr.id} className="bg-white rounded-lg p-2 text-center border border-emerald-100">
                <canvas ref={(el) => { if (el) { canvasRefs.current.set(qr.activationCode, el); renderQr(`https://qrdomotik.com/?activate=${qr.activationCode}`, el); } }} width={80} height={80} className="mx-auto" />
                <p className="text-[10px] font-mono text-gray-600 mt-1 truncate">{qr.activationCode}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
