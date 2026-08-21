'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Package } from 'lucide-react';
import { PRODUCT_CATEGORY_LABELS, EMERGENCY_CATEGORY_LABELS, type QrType, type EmergencyCategory } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ContentEditorProps {
  qrId: string;
  type: QrType;
  initialContent: string;
  onSave: (contentJson: string) => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════
// WIFI EDITOR
// ═══════════════════════════════════════════════════════════════
function WifiEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const security = content.security || 'WPA2';
  const isOpen = security === 'OPEN';
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nom du réseau (SSID)</Label>
        <Input placeholder="MonWiFi" value={content.ssid || ''} onChange={(e) => onChange({ ...content, ssid: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Sécurité</Label>
        <select
          value={security}
          onChange={(e) => onChange({ ...content, security: e.target.value, password: e.target.value === 'OPEN' ? '' : content.password })}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {['WPA', 'WPA2', 'WPA3', 'WEP', 'OPEN'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {!isOpen && (
        <div className="space-y-2">
          <Label>Mot de passe</Label>
          <Input type="text" placeholder="••••••••" value={content.password || ''} onChange={(e) => onChange({ ...content, password: e.target.value })} />
        </div>
      )}
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={content.hiddenNetwork === true} onCheckedChange={(v) => onChange({ ...content, hiddenNetwork: !!v })} />
        <span className="text-sm">Réseau masqué (caché)</span>
      </label>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LINK EDITOR
// ═══════════════════════════════════════════════════════════════
function LinkEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titre du lien</Label>
        <Input placeholder="Ma playlist Spotify" value={content.title || ''} onChange={(e) => onChange({ ...content, title: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>URL</Label>
        <Input placeholder="https://..." value={content.url || ''} onChange={(e) => onChange({ ...content, url: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Description (optionnel)</Label>
        <Textarea placeholder="Description courte..." rows={2} value={content.description || ''} onChange={(e) => onChange({ ...content, description: e.target.value })} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INFO EDITOR
// ═══════════════════════════════════════════════════════════════
function InfoEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titre</Label>
        <Input placeholder="Guide de la maison" value={content.title || ''} onChange={(e) => onChange({ ...content, title: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Contenu <span className="text-muted-foreground font-normal">(Markdown supporté)</span></Label>
        <Textarea
          placeholder="Consignes, astuces, informations utiles...\nUtilisez **gras**, *italique*, - listes, etc."
          rows={10}
          value={content.body || ''}
          onChange={(e) => onChange({ ...content, body: e.target.value })}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">Markdown : **gras**, *italique*, # titres, - listes, [liens](url), etc.</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// POST-IT EDITOR
// ═══════════════════════════════════════════════════════════════
const POSTIT_COLORS = [
  { value: 'yellow', label: 'Jaune', class: 'bg-amber-100 border-amber-300' },
  { value: 'pink', label: 'Rose', class: 'bg-pink-100 border-pink-300' },
  { value: 'blue', label: 'Bleu', class: 'bg-blue-100 border-blue-300' },
  { value: 'green', label: 'Vert', class: 'bg-emerald-100 border-emerald-300' },
  { value: 'purple', label: 'Violet', class: 'bg-purple-100 border-purple-300' },
];

function PostitEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea placeholder="Pensez à fermer les fenêtres ce soir !" rows={4} value={content.message || ''} onChange={(e) => onChange({ ...content, message: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Couleur</Label>
        <div className="flex gap-2">
          {POSTIT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange({ ...content, color: c.value })}
              className={`w-10 h-10 rounded-lg border-2 transition-all ${c.class} ${content.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
              title={c.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHOPPING LIST EDITOR
// ═══════════════════════════════════════════════════════════════
function ShoppingListEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const items: Array<{ id: string; text: string }> = Array.isArray(content.items) ? content.items : [];
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (!newItem.trim()) return;
    const id = crypto.randomUUID().slice(0, 8);
    onChange({ ...content, items: [...items, { id, text: newItem.trim(), checked: false }] });
    setNewItem('');
  };

  const removeItem = (id: string) => {
    onChange({ ...content, items: items.filter((i) => i.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Ajouter un article..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
          className="flex-1"
        />
        <Button size="sm" onClick={addItem} disabled={!newItem.trim()}><Plus className="w-4 h-4" /></Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">La liste est vide</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
              <span className="flex-1 text-sm">{item.text}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Les visiteurs pourront cocher les articles en scannant le QR.</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DOORMAN EDITOR
// ═══════════════════════════════════════════════════════════════
function DoormanEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const instructions: Array<{ label: string; value: string }> = Array.isArray(content.predefinedInstructions) ? content.predefinedInstructions : [];
  const [newLabel, setNewLabel] = useState('');

  const addInstruction = () => {
    if (!newLabel.trim()) return;
    const value = newLabel.trim().toLowerCase().replace(/\s+/g, '_');
    onChange({ ...content, predefinedInstructions: [...instructions, { label: newLabel.trim(), value }] });
    setNewLabel('');
  };

  const removeInstruction = (idx: number) => {
    onChange({ ...content, predefinedInstructions: instructions.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Message d&apos;accueil</Label>
        <Input placeholder="Bienvenue ! Laissez les colis au gardien." value={content.welcomeMessage || ''} onChange={(e) => onChange({ ...content, welcomeMessage: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Instructions prédéfinies</Label>
        <div className="flex gap-2">
          <Input placeholder="Ex: Laisser chez le gardien" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInstruction())} className="flex-1" />
          <Button size="sm" onClick={addInstruction} disabled={!newLabel.trim()}><Plus className="w-4 h-4" /></Button>
        </div>
        {instructions.length > 0 && (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {instructions.map((inst, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50">
                <span className="flex-1 text-sm text-orange-800">{inst.label}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeInstruction(idx)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={content.showMessageField !== false} onCheckedChange={(v) => onChange({ ...content, showMessageField: !!v })} />
          <span className="text-sm">Permettre aux visiteurs de laisser un message</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={content.showRingButton !== false} onCheckedChange={(v) => onChange({ ...content, showRingButton: !!v })} />
          <span className="text-sm">Afficher le bouton &quot;Sonner&quot;</span>
        </label>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MEDICATION EDITOR
// ═══════════════════════════════════════════════════════════════
function MedicationEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const meds: Array<{ name: string; dosage: string; time: string }> = Array.isArray(content.medications) ? content.medications : [];

  const addMed = () => {
    onChange({ ...content, medications: [...meds, { name: '', dosage: '', time: '08:00' }] });
  };

  const updateMed = (idx: number, field: string, value: string) => {
    const updated = [...meds];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange({ ...content, medications: updated });
  };

  const removeMed = (idx: number) => {
    onChange({ ...content, medications: meds.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      {meds.map((med, idx) => (
        <div key={idx} className="p-3 rounded-lg border border-teal-200 bg-teal-50/50 space-y-2">
          <div className="flex justify-between items-center">
            <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-xs">Médicament {idx + 1}</Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMed(idx)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <Input placeholder="Nom" value={med.name} onChange={(e) => updateMed(idx, 'name', e.target.value)} className="h-9" />
          <div className="flex gap-2">
            <Input placeholder="Dosage" value={med.dosage} onChange={(e) => updateMed(idx, 'dosage', e.target.value)} className="h-9 flex-1" />
            <Input type="time" value={med.time || '08:00'} onChange={(e) => updateMed(idx, 'time', e.target.value)} className="h-9 w-28" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addMed}><Plus className="w-4 h-4 mr-1.5" /> Ajouter un médicament</Button>
      <div className="space-y-2">
        <Label>Rappel (optionnel)</Label>
        <Input placeholder="Pensez à prendre vos médicaments !" value={content.reminderMessage || ''} onChange={(e) => onChange({ ...content, reminderMessage: e.target.value })} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CHORES EDITOR
// ═══════════════════════════════════════════════════════════════
function ChoresEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const chores: Array<{ id: string; title: string; points: number }> = Array.isArray(content.chores) ? content.chores : [];

  const addChore = () => {
    const id = crypto.randomUUID().slice(0, 8);
    onChange({ ...content, chores: [...chores, { id, title: '', points: 5, completed: false }] });
  };

  const updateChore = (idx: number, field: string, value: any) => {
    const updated = [...chores];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange({ ...content, chores: updated });
  };

  const removeChore = (idx: number) => {
    onChange({ ...content, chores: chores.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      {chores.map((chore, idx) => (
        <div key={chore.id || idx} className="flex items-center gap-2 p-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50/50">
          <Input placeholder="Tâche" value={chore.title} onChange={(e) => updateChore(idx, 'title', e.target.value)} className="h-9 flex-1" />
          <Input type="number" min={1} max={100} value={chore.points} onChange={(e) => updateChore(idx, 'points', parseInt(e.target.value) || 0)} className="h-9 w-20" />
          <Badge variant="secondary" className="bg-fuchsia-100 text-fuchsia-700 text-xs shrink-0">pts</Badge>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeChore(idx)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addChore}><Plus className="w-4 h-4 mr-1.5" /> Ajouter une tâche</Button>
      <div className="space-y-2">
        <Label>Message de récompense (optionnel)</Label>
        <Input placeholder="10 points = une glace !" value={content.rewardMessage || ''} onChange={(e) => onChange({ ...content, rewardMessage: e.target.value })} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DAILY MENU EDITOR
// ═══════════════════════════════════════════════════════════════
const MEAL_OPTIONS = [
  { value: 'petit-dejeuner', label: 'Petit-déjeuner', icon: '☕' },
  { value: 'dejeuner', label: 'Déjeuner', icon: '🍽️' },
  { value: 'gouter', label: 'Goûter', icon: '🍪' },
  { value: 'diner', label: 'Dîner', icon: '🌙' },
];

function DailyMenuEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const meals: Array<{ id: string; meal: string; dish: string; notes?: string }> = Array.isArray(content.meals) ? content.meals : [];

  const addMeal = () => {
    const id = crypto.randomUUID().slice(0, 8);
    const existing = meals.map((m) => m.meal);
    const next = MEAL_OPTIONS.find((m) => !existing.includes(m.value)) || MEAL_OPTIONS[0];
    onChange({ ...content, meals: [...meals, { id, meal: next.value, dish: '', notes: '' }] });
  };

  const updateMeal = (idx: number, field: string, value: string) => {
    const updated = [...meals];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange({ ...content, meals: updated });
  };

  const removeMeal = (idx: number) => {
    onChange({ ...content, meals: meals.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      {meals.map((meal, idx) => {
        const mealOpt = MEAL_OPTIONS.find((m) => m.value === meal.meal);
        return (
          <div key={meal.id || idx} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-2">
            <div className="flex justify-between items-center">
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                {mealOpt?.icon} {mealOpt?.label || meal.meal}
              </Badge>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMeal(idx)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <select
              value={meal.meal}
              onChange={(e) => updateMeal(idx, 'meal', e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              {MEAL_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
            </select>
            <Input placeholder="Plat" value={meal.dish} onChange={(e) => updateMeal(idx, 'dish', e.target.value)} className="h-9" />
            <Input placeholder="Notes (optionnel)" value={meal.notes || ''} onChange={(e) => updateMeal(idx, 'notes', e.target.value)} className="h-9" />
          </div>
        );
      })}
      <Button variant="outline" size="sm" onClick={addMeal}><Plus className="w-4 h-4 mr-1.5" /> Ajouter un repas</Button>
      <p className="text-xs text-muted-foreground">Le menu du jour sera affiché avec la date actuelle.</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TODO LIST EDITOR
// ═══════════════════════════════════════════════════════════════
function TodoListEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const items: Array<{ id: string; text: string; checked: boolean }> = Array.isArray(content.items) ? content.items : [];
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (!newItem.trim()) return;
    const id = crypto.randomUUID().slice(0, 8);
    onChange({ ...content, title: content.title || '', items: [...items, { id, text: newItem.trim(), checked: false }] });
    setNewItem('');
  };

  const removeItem = (id: string) => {
    onChange({ ...content, items: items.filter((i) => i.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titre de la liste</Label>
        <Input placeholder="To-Do List" value={content.title || ''} onChange={(e) => onChange({ ...content, title: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <Input placeholder="Ajouter une tâche..." value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())} className="flex-1" />
        <Button size="sm" onClick={addItem} disabled={!newItem.trim()}><Plus className="w-4 h-4" /></Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Aucune tâche</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-cyan-50 border border-cyan-100">
              <span className="flex-1 text-sm">{item.text}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Les visiteurs pourront cocher les tâches en scannant le QR.</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GUESTBOOK EDITOR
// ═══════════════════════════════════════════════════════════════
function GuestbookEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titre (optionnel)</Label>
        <Input placeholder="Livre d'or" value={content.title || ''} onChange={(e) => onChange({ ...content, title: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Sous-titre (optionnel)</Label>
        <Input placeholder="Laissez un message !" value={content.subtitle || ''} onChange={(e) => onChange({ ...content, subtitle: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={content.requireName !== false} onCheckedChange={(v) => onChange({ ...content, requireName: !!v })} />
        <span className="text-sm">Demander le nom du visiteur</span>
      </label>
      <div className="rounded-lg bg-rose-50 border border-rose-200 p-4">
        <p className="text-sm text-rose-800 leading-relaxed">
          Les messages des visiteurs sont stockés automatiquement. Vous pouvez les modérer depuis le <strong>Journal d&apos;activité</strong>.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ENERGY COUNTER EDITOR
// ═══════════════════════════════════════════════════════════════
function EnergyCounterEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Type de compteur</Label>
        <select value={content.type || 'electricity'} onChange={(e) => onChange({ ...content, type: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="electricity">Électricité</option>
          <option value="water">Eau</option>
          <option value="gas">Gaz</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Nom du compteur</Label>
          <Input placeholder="Compteur principal" value={content.meterId || ''} onChange={(e) => onChange({ ...content, meterId: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Fournisseur</Label>
          <Input placeholder="EDF, Engie..." value={content.provider || ''} onChange={(e) => onChange({ ...content, provider: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Unité</Label>
          <select value={content.unit || 'kWh'} onChange={(e) => onChange({ ...content, unit: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="kWh">kWh</option>
            <option value="m³">m³</option>
            <option value="L">Litres</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Relevé actuel</Label>
          <Input type="number" step="0.01" placeholder="0" value={content.currentReading || ''} onChange={(e) => onChange({ ...content, currentReading: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notes (optionnel)</Label>
        <Input placeholder="Compteur bleu, tarif heure creuse..." value={content.notes || ''} onChange={(e) => onChange({ ...content, notes: e.target.value })} />
      </div>
      <div className="rounded-lg bg-teal-50 border border-teal-200 p-4">
        <p className="text-sm text-teal-800 leading-relaxed">
          Les visiteurs pourront saisir de nouveaux relevés. L&apos;historique sera conservé.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// KEYS TRACKER EDITOR
// ═══════════════════════════════════════════════════════════════
function KeysTrackerEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const items: Array<{ id: string; name: string; description?: string; lastLocation?: string; isBorrowed: boolean; borrowedBy?: string }> = Array.isArray(content.items) ? content.items : [];
  const [newName, setNewName] = useState('');

  const addItem = () => {
    if (!newName.trim()) return;
    const id = crypto.randomUUID().slice(0, 8);
    onChange({ ...content, items: [...items, { id, name: newName.trim(), description: '', lastLocation: '', isBorrowed: false, borrowedBy: '' }] });
    setNewName('');
  };

  const updateItem = (idx: number, field: string, value: string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange({ ...content, items: updated });
  };

  const removeItem = (idx: number) => {
    onChange({ ...content, items: items.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Ajouter un objet (clés, badge...)" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())} className="flex-1" />
        <Button size="sm" onClick={addItem} disabled={!newName.trim()}><Plus className="w-4 h-4" /></Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Aucun objet suivi</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-2">
              <div className="flex items-center gap-2">
                <Input placeholder="Nom" value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} className="h-8 flex-1 text-sm" />
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeItem(idx)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <Input placeholder="Description (optionnel)" value={item.description || ''} onChange={(e) => updateItem(idx, 'description', e.target.value)} className="h-8 text-sm" />
              <Input placeholder="Dernier emplacement" value={item.lastLocation || ''} onChange={(e) => updateItem(idx, 'lastLocation', e.target.value)} className="h-8 text-sm" />
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Les visiteurs pourront marquer les objets comme empruntés/rendus.</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DEEP CLEANING EDITOR
// ═══════════════════════════════════════════════════════════════
const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'biweekly', label: 'Bi-hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'quarterly', label: 'Trimestriel' },
];

function DeepCleaningEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const items: Array<{ id: string; text: string; frequency: string; lastDone?: string; checked: boolean }> = Array.isArray(content.items) ? content.items : [];
  const [newTask, setNewTask] = useState('');

  const addItem = () => {
    if (!newTask.trim()) return;
    const id = crypto.randomUUID().slice(0, 8);
    onChange({ ...content, title: content.title || 'Ménage Profond', items: [...items, { id, text: newTask.trim(), frequency: 'weekly', lastDone: undefined, checked: false }] });
    setNewTask('');
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange({ ...content, items: updated });
  };

  const removeItem = (idx: number) => {
    onChange({ ...content, items: items.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titre</Label>
        <Input placeholder="Ménage Profond" value={content.title || ''} onChange={(e) => onChange({ ...content, title: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <Input placeholder="Ajouter une tâche..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())} className="flex-1" />
        <Button size="sm" onClick={addItem} disabled={!newTask.trim()}><Plus className="w-4 h-4" /></Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Aucune tâche</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="p-3 rounded-lg border border-purple-200 bg-purple-50/50 space-y-2">
              <div className="flex items-center gap-2">
                <Input placeholder="Tâche" value={item.text} onChange={(e) => updateItem(idx, 'text', e.target.value)} className="h-8 flex-1 text-sm" />
                <select value={item.frequency} onChange={(e) => updateItem(idx, 'frequency', e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs">
                  {FREQUENCY_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeItem(idx)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              {item.lastDone && (
                <p className="text-xs text-muted-foreground">Dernière fois : {new Date(item.lastDone).toLocaleDateString('fr-FR')}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EMERGENCY SERVICE EDITOR (V3)
// ═══════════════════════════════════════════════════════════════
function EmergencyServiceEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const categories = Object.entries(EMERGENCY_CATEGORY_LABELS) as [EmergencyCategory, string][];
  const equipmentInfo = content.equipmentInfo || {};

  const updateEquipmentField = (key: string, value: string) => {
    onChange({ ...content, equipmentInfo: { ...equipmentInfo, [key]: value } });
  };

  const removeEquipmentField = (key: string) => {
    const updated = { ...equipmentInfo };
    delete updated[key];
    onChange({ ...content, equipmentInfo: updated });
  };

  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const addEquipmentField = () => {
    if (!newFieldKey.trim()) return;
    onChange({ ...content, equipmentInfo: { ...equipmentInfo, [newFieldKey.trim()]: newFieldValue.trim() } });
    setNewFieldKey('');
    setNewFieldValue('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Catégorie d&apos;urgence</Label>
        <Select value={content.emergencyCategory || 'plumber'} onValueChange={(v) => onChange({ ...content, emergencyCategory: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Le QR d&apos;urgence affichera les artisans disponibles pour cette catégorie.</p>
      </div>

      <div className="space-y-2">
        <Label>Informations sur l&apos;équipement</Label>
        <p className="text-xs text-muted-foreground">Ces infos seront transmises à l&apos;artisan lors de l&apos;appel d&apos;urgence.</p>
        <div className="space-y-2">
          {Object.entries(equipmentInfo).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-sm font-medium min-w-[100px] bg-slate-100 rounded px-2 py-1">{key}</span>
              <Input value={value as string} onChange={(e) => updateEquipmentField(key, e.target.value)} className="h-8 flex-1 text-sm" />
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeEquipmentField(key)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Ex: Modèle chaudière" value={newFieldKey} onChange={(e) => setNewFieldKey(e.target.value)} className="h-8 flex-1 text-sm" />
          <Input placeholder="Ex: Chaffoteau 2019" value={newFieldValue} onChange={(e) => setNewFieldValue(e.target.value)} className="h-8 flex-1 text-sm" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipmentField())} />
          <Button size="sm" onClick={addEquipmentField} disabled={!newFieldKey.trim()}><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800 leading-relaxed">
          <strong>Important :</strong> Ce QR code sera accessible publiquement et affichera un bouton &quot;APPELER MAINTENANT&quot;.
          Assurez-vous que les informations de contact de votre maison sont à jour.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NEIGHBORHOOD EDITOR (V3)
// ═══════════════════════════════════════════════════════════════
function NeighborhoodEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Centre de la carte (latitude)</Label>
        <Input
          type="number"
          step="0.0001"
          placeholder="48.8566"
          value={content.centerLatitude ?? ''}
          onChange={(e) => onChange({ ...content, centerLatitude: e.target.value ? parseFloat(e.target.value) : undefined })}
        />
      </div>
      <div className="space-y-2">
        <Label>Centre de la carte (longitude)</Label>
        <Input
          type="number"
          step="0.0001"
          placeholder="2.3522"
          value={content.centerLongitude ?? ''}
          onChange={(e) => onChange({ ...content, centerLongitude: e.target.value ? parseFloat(e.target.value) : undefined })}
        />
      </div>
      <div className="space-y-2">
        <Label>Rayon de recherche par défaut (km)</Label>
        <Input
          type="number"
          step="0.5"
          min="0.5"
          max="10"
          placeholder="2"
          value={content.defaultRadiusKm ?? ''}
          onChange={(e) => onChange({ ...content, defaultRadiusKm: e.target.value ? parseFloat(e.target.value) : undefined })}
        />
        <p className="text-xs text-muted-foreground">Laissez vide pour utiliser la position de la maison et un rayon de 2 km par défaut.</p>
      </div>
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
        <p className="text-sm text-emerald-800 leading-relaxed">
          La carte affichera les commerçants du quartier avec leurs promotions actuelles.
          Les utilisateurs pourront filtrer par catégorie et voir les promos à proximité.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STOCK DLC EDITOR (simplified — product management is in StockPanel)
// ═══════════════════════════════════════════════════════════════
function StockDlcEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-lime-50 border border-lime-200 p-4">
        <p className="text-sm text-lime-800 leading-relaxed">
          La gestion des produits et dates de péremption se fait dans le panneau <strong>Stock &amp; DLC</strong> accessible depuis la vue d&apos;ensemble de cette maison.
        </p>
      </div>
      <div className="flex gap-2">
        <Label>Activer le suivi</Label>
        <Checkbox checked={content.tracked !== false} onCheckedChange={(v) => onChange({ ...content, tracked: !!v })} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN CONTENT EDITOR
// ═══════════════════════════════════════════════════════════════
export function ContentEditor({ qrId, type, initialContent, onSave }: ContentEditorProps) {
  const [content, setContent] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    try { setContent(JSON.parse(initialContent)); } catch { setContent({}); }
  }, [initialContent]);

  const handleChange = (newContent: any) => {
    setContent(newContent);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(JSON.stringify(content));
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const renderEditor = () => {
    switch (type) {
      case 'wifi': return <WifiEditor content={content} onChange={handleChange} />;
      case 'link': return <LinkEditor content={content} onChange={handleChange} />;
      case 'info': return <InfoEditor content={content} onChange={handleChange} />;
      case 'postit': return <PostitEditor content={content} onChange={handleChange} />;
      case 'shopping_list': return <ShoppingListEditor content={content} onChange={handleChange} />;
      case 'doorman': return <DoormanEditor content={content} onChange={handleChange} />;
      case 'medication': return <MedicationEditor content={content} onChange={handleChange} />;
      case 'chores': return <ChoresEditor content={content} onChange={handleChange} />;
      case 'stock_dlc': return <StockDlcEditor content={content} onChange={handleChange} />;
      case 'daily_menu': return <DailyMenuEditor content={content} onChange={handleChange} />;
      case 'todo_list': return <TodoListEditor content={content} onChange={handleChange} />;
      case 'guestbook': return <GuestbookEditor content={content} onChange={handleChange} />;
      case 'energy_counter': return <EnergyCounterEditor content={content} onChange={handleChange} />;
      case 'keys_tracker': return <KeysTrackerEditor content={content} onChange={handleChange} />;
      case 'deep_cleaning': return <DeepCleaningEditor content={content} onChange={handleChange} />;
      case 'emergency_service': return <EmergencyServiceEditor content={content} onChange={handleChange} />;
      case 'neighborhood': return <NeighborhoodEditor content={content} onChange={handleChange} />;
      default: return <p className="text-sm text-muted-foreground">Type non supporté</p>;
    }
  };

  return (
    <div className="space-y-4">
      {renderEditor()}
      {dirty && (
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Enregistrement...' : 'Enregistrer le contenu'}
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STOCK & DLC PANEL (for dashboard)
// ═══════════════════════════════════════════════════════════════
export function StockDlcPanel({ homeId }: { homeId: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('autre');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newInstanceDate, setNewInstanceDate] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?homeId=${homeId}`);
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [homeId]);

  const addProduct = async () => {
    if (!newName.trim()) return;
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeId, name: newName, category: newCategory }),
    });
    const json = await res.json();
    if (json.success) { setNewName(''); refresh(); }
  };

  const deleteProduct = async (id: string) => {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (expandedId === id) setExpandedId(null);
    refresh();
  };

  const addInstance = async (productId: string) => {
    if (!newInstanceDate) return;
    await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_instance', expiryDate: newInstanceDate }),
    });
    setNewInstanceDate('');
    refresh();
  };

  const consumeInstance = async (productId: string, instanceId: string) => {
    await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'consume_instance', instanceId }),
    });
    refresh();
  };

  const getStatusColor = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'bg-gray-100 text-gray-500 line-through';
    if (days <= 1) return 'bg-red-100 text-red-700';
    if (days <= 3) return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const getStatusLabel = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `Expiré (J${days})`;
    if (days === 0) return 'Expire aujourd\'hui';
    if (days === 1) return 'Demain';
    if (days <= 3) return `J+${days}`;
    return `J+${days}`;
  };

  return (
    <div className="space-y-4">
      {/* Add product */}
      <div className="flex gap-2">
        <Input placeholder="Nom du produit" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addProduct()} className="flex-1" />
        <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          {Object.entries(PRODUCT_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <Button size="sm" onClick={addProduct} disabled={!newName.trim()}><Plus className="w-4 h-4" /></Button>
      </div>

      {/* Product list */}
      {loading ? (
        <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-lime-300 border-t-lime-600 rounded-full animate-spin" /></div>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Aucun produit suivi</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {products.map((product) => (
            <div key={product.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                className="w-full text-left p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
              >
                <Package className="w-4 h-4 text-lime-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{PRODUCT_CATEGORY_LABELS[product.category as keyof typeof PRODUCT_CATEGORY_LABELS] || product.category} · Stock: {product.currentStock}</p>
                </div>
                {product.productInstances[0] && (
                  <Badge variant="secondary" className={`text-xs shrink-0 ${getStatusColor(product.productInstances[0].expiryDate)}`}>
                    {getStatusLabel(product.productInstances[0].expiryDate)}
                  </Badge>
                )}
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); deleteProduct(product.id); }} />
              </button>

              {expandedId === product.id && (
                <div className="border-t border-slate-100 p-3 space-y-3 bg-slate-50/50">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Ajouter une date de péremption</Label>
                      <Input type="date" value={newInstanceDate} onChange={(e) => setNewInstanceDate(e.target.value)} className="h-9" />
                    </div>
                    <Button size="sm" onClick={() => addInstance(product.id)} disabled={!newInstanceDate}><Plus className="w-4 h-4" /></Button>
                  </div>
                  {product.productInstances && product.productInstances.length > 0 && (
                    <div className="space-y-1">
                      {product.productInstances.map((inst: any) => (
                        <div key={inst.id} className="flex items-center gap-2 text-xs p-2 rounded bg-white border">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(inst.expiryDate)}`}>
                            {new Date(inst.expiryDate).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex-1">{getStatusLabel(inst.expiryDate)}</span>
                          {inst.status !== 'consumed' && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => consumeInstance(product.id, inst.id)}>Consommé</Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
