'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

interface ChatWidgetProps {
  serviceRequestId: string;
  currentUserId: string;
  currentUserName: string;
  status?: string;
}

export function ChatWidget({ serviceRequestId, currentUserId, currentUserName, status }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Connect to chat service
  useEffect(() => {
    const socket = io('/?XTransformPort=3006', {
      auth: { serviceRequestId },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setLoading(false);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('chat:typing', ({ senderId, isTyping: typing }: { senderId: string; isTyping: boolean }) => {
      if (senderId !== currentUserId) {
        setIsTyping(typing);
      }
    });

    socket.on('connect_error', () => {
      setLoading(false);
    });

    // Load history
    fetch(`/messages?serviceRequestId=${serviceRequestId}&XTransformPort=3006`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => {
      socket.disconnect();
    };
  }, [serviceRequestId, currentUserId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !socketRef.current?.connected) return;

    socketRef.current.emit('chat:message', {
      message: newMessage.trim(),
      senderId: currentUserId,
      senderName: currentUserName,
    });

    setNewMessage('');
  }, [newMessage, currentUserId, currentUserName]);

  const handleTyping = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('chat:typing', {
      senderId: currentUserId,
      senderName: currentUserName,
      isTyping: true,
    });

    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => {
      socketRef.current?.emit('chat:typing', {
        senderId: currentUserId,
        senderName: currentUserName,
        isTyping: false,
      });
    }, 2000);
    setTypingTimeout(timeout);
  }, [currentUserId, currentUserName, typingTimeout]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-sm">Chat Service</h3>
          </div>
          <div className="flex items-center gap-2">
            {status && (
              <Badge variant="secondary" className="text-xs">{status}</Badge>
            )}
            <Badge variant={connected ? 'default' : 'destructive'} className="text-xs">
              {connected ? 'En ligne' : 'Hors ligne'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="max-h-64 overflow-y-auto space-y-2 rounded-lg border p-3 bg-slate-50"
          style={{ scrollbarWidth: 'thin' }}
        >
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Aucun message. Commencez la conversation !
            </p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 ${
                      isOwn
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-xs font-medium mb-0.5 opacity-80">{msg.senderName}</p>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-xl rounded-bl-sm px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Votre message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            disabled={!connected}
            className="flex-1 h-10"
          />
          <Button
            onClick={sendMessage}
            disabled={!connected || !newMessage.trim()}
            size="icon"
            className="h-10 w-10 bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
