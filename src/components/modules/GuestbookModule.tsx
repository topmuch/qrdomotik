'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, Send, Loader2, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GuestbookModuleProps {
  content: any;
  slug: string;
}

interface GuestMessage {
  id: string;
  guestName: string;
  message: string;
  createdAt: string;
}

export function GuestbookModule({ content, slug }: GuestbookModuleProps) {
  const requireName = content?.requireName ?? false;
  const title = content?.title || "Livre d'or";
  const subtitle = content?.subtitle || '';

  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [messageText, setMessageText] = useState('');

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/modules/${slug}/guestbook`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetch(`/api/r/${slug}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'view' }),
    });

    fetchMessages();
  }, [slug, fetchMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    if (requireName && !guestName.trim()) return;

    setSubmitting(true);
    try {
      await fetch(`/api/modules/${slug}/guestbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: requireName ? guestName.trim() : 'Anonyme',
          message: messageText.trim(),
        }),
      });
      setGuestName('');
      setMessageText('');
      await fetchMessages();
    } catch {
      // silencieux
    } finally {
      setSubmitting(false);
    }
  };

  const formatRelativeTime = (dateStr: string): string => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-rose-200 dark:border-rose-800">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/50">
              <MessageCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-rose-700 dark:text-rose-300">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {requireName && (
              <div>
                <label htmlFor="guest-name" className="text-xs font-medium text-muted-foreground mb-1 block">
                  Votre nom
                </label>
                <Input
                  id="guest-name"
                  placeholder="Votre nom..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="border-rose-200 focus-visible:ring-rose-500"
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="guest-message" className="text-xs font-medium text-muted-foreground mb-1 block">
                Votre message
              </label>
              <Textarea
                id="guest-message"
                placeholder="Écrivez votre message ici..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={3}
                className="border-rose-200 focus-visible:ring-rose-500 resize-none"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || !messageText.trim() || (requireName && !guestName.trim())}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Envoyer
            </Button>
          </form>

          {/* Messages list */}
          <div>
            <h3 className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-3">
              Messages ({messages.length})
            </h3>

            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-rose-400" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Soyez le premier à laisser un message !
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-lg border border-rose-100 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-200 dark:bg-rose-800">
                        <User className="h-3 w-3 text-rose-700 dark:text-rose-300" />
                      </div>
                      <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
                        {msg.guestName || 'Anonyme'}
                      </span>
                      {msg.createdAt && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatRelativeTime(msg.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground pl-8">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
