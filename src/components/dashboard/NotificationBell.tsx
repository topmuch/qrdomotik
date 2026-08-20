'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Bell, BellRing, CheckCheck, Circle, Package,
  AlertTriangle, MessageSquare, BellDot, UserPlus, Info,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { useHomeStore, type NotificationInfo } from '@/store/home-store';

// ─── Notification type icon mapping ───────────────────────────────────

const NOTIF_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  dlc_warning: AlertTriangle,
  stock_alert: Package,
  visitor_message: MessageSquare,
  visitor_ring: BellRing,
  chore_validation: CheckCheck,
  chore_request: BellDot,
  member_joined: UserPlus,
  system: Info,
};

const NOTIF_COLOR_MAP: Record<string, string> = {
  dlc_warning: 'text-amber-500',
  stock_alert: 'text-orange-500',
  visitor_message: 'text-emerald-500',
  visitor_ring: 'text-violet-500',
  chore_validation: 'text-teal-500',
  chore_request: 'text-fuchsia-500',
  member_joined: 'text-sky-500',
  system: 'text-slate-500',
};

// ─── Relative time in French ──────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffSec < 60) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD < 7) return `il y a ${diffD}j`;
  if (diffD < 30) return `il y a ${Math.floor(diffD / 7)} sem`;
  return `il y a ${Math.floor(diffD / 30)} mois`;
}

// ─── Component ────────────────────────────────────────────────────────

export function NotificationBell() {
  const unreadCount = useHomeStore((s) => s.unreadCount);
  const notifications = useHomeStore((s) => s.notifications);
  const refreshNotifications = useHomeStore((s) => s.refreshNotifications);
  const setNotifications = useHomeStore((s) => s.setNotifications);

  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-refresh every 30s when popover is open
  useEffect(() => {
    if (open) {
      refreshNotifications();
      intervalRef.current = setInterval(() => {
        refreshNotifications();
      }, 30000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [open, refreshNotifications]);

  // ─── Mark single notification as read ─────────────────────────────

  const markAsRead = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) {
        // Optimistic update: toggle this notification to read
        setNotifications(
          notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [notifications, setNotifications]);

  // ─── Mark all as read ─────────────────────────────────────────────

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${json.markedCount ?? 'Toutes'} notifications marquées comme lues`);
        refreshNotifications();
      } else {
        toast.error(json.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setMarkingAll(false);
    }
  };

  // Take last 10 notifications
  const recentNotifications = notifications.slice(0, 10);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        >
          <AnimatePresence mode="wait">
            {unreadCount > 0 ? (
              <motion.span
                key="badge"
                className="absolute -top-0.5 -right-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            ) : null}
          </AnimatePresence>
          <Bell className="h-[18px] w-[18px]" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Notification list */}
        {recentNotifications.length > 0 ? (
          <ScrollArea className="max-h-72 overflow-y-auto">
            <div className="divide-y">
              {recentNotifications.map((notif) => {
                const IconComp = NOTIF_ICON_MAP[notif.type] || Bell;
                const iconColor = NOTIF_COLOR_MAP[notif.type] || 'text-slate-400';

                return (
                  <motion.button
                    key={notif.id}
                    type="button"
                    onClick={() => {
                      if (!notif.isRead) markAsRead(notif.id);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-muted/50 ${
                      !notif.isRead ? 'bg-muted/20' : ''
                    }`}
                    whileTap={{ scale: 0.99 }}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
                      <IconComp className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${!notif.isRead ? 'font-medium' : 'text-muted-foreground'}`}>
                          {notif.title}
                        </p>
                        {/* Unread dot */}
                        {!notif.isRead && (
                          <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      {notif.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.body}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center">
            <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aucune notification</p>
          </div>
        )}

        {/* Footer: Mark all as read */}
        {unreadCount > 0 && (
          <>
            <Separator />
            <div className="px-4 py-2.5">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={markAllAsRead}
                disabled={markingAll}
              >
                {markingAll ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                )}
                Tout marquer comme lu
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
