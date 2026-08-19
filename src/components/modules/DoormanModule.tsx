'use client';

import { useEffect, useState } from 'react';
import { DoorOpen, MessageSquare, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DoormanModuleProps {
  content: any;
  slug: string;
}

export function DoormanModule({ content, slug }: DoormanModuleProps) {
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [senderName, setSenderName] = useState('');

  const welcomeMessage = content?.welcomeMessage || 'Bienvenue !';
  const isPresent = content?.isPresentMode ?? true;
  const predefinedInstructions: Array<{ label: string; value: string }> = Array.isArray(
    content?.predefinedInstructions
  )
    ? content.predefinedInstructions
    : [];

  const logAction = (actionType: string, detailsJson?: string) => {
    const body: Record<string, string> = { actionType };
    if (detailsJson) body.detailsJson = detailsJson;
    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  useEffect(() => {
    logAction('view');
  }, [slug]);

  const handleInstructionChange = (value: string) => {
    if (value) {
      logAction('instruction_used', JSON.stringify({ instruction: value }));
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    logAction(
      'message_left',
      JSON.stringify({ name: senderName, message: messageText })
    );
    setMessageText('');
    setSenderName('');
    setShowMessageForm(false);
  };

  const handleRing = () => {
    logAction('ring');
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-orange-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                <DoorOpen className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-orange-700">
                Portier virtuel
              </h2>
            </div>
            <Badge
              className={
                isPresent
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-red-100 text-red-700 border-red-200'
              }
            >
              {isPresent ? 'Présent' : 'Absent'}
            </Badge>
          </div>
          <p className="text-lg font-medium text-orange-600 mt-3">
            {welcomeMessage}
          </p>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Instruction prédéfinie */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
              Instructions prédéfinies
            </Label>
            <select
              className="w-full rounded-md border border-orange-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-16"
              defaultValue=""
              onChange={(e) => handleInstructionChange(e.target.value)}
            >
              <option value="" disabled>
                Choisir une instruction...
              </option>
              {predefinedInstructions.map((inst, idx) => (
                <option key={idx} value={inst.value}>
                  {inst.label}
                </option>
              ))}
            </select>
          </div>

          {/* Laisser un message */}
          <div>
            <Button
              variant="outline"
              className="w-full min-h-16 border-orange-200 text-orange-700 hover:bg-orange-50"
              onClick={() => setShowMessageForm(!showMessageForm)}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Laisser un message
            </Button>

            {showMessageForm && (
              <div className="mt-3 space-y-3 p-4 rounded-lg bg-orange-50 border border-orange-100">
                <div>
                  <Label htmlFor="doorman-name" className="text-sm mb-1 block">
                    Votre nom
                  </Label>
                  <Input
                    id="doorman-name"
                    placeholder="Entrez votre nom"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="doorman-msg" className="text-sm mb-1 block">
                    Votre message
                  </Label>
                  <Textarea
                    id="doorman-msg"
                    placeholder="Écrivez votre message ici..."
                    rows={3}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={handleSendMessage}
                >
                  Envoyer
                </Button>
              </div>
            )}
          </div>

          {/* Sonner */}
          <Button
            className="w-full min-h-16 bg-amber-500 hover:bg-amber-600 text-white text-lg font-semibold"
            onClick={handleRing}
          >
            <Bell className="h-5 w-5 mr-2" />
            Sonner
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}