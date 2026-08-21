import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();

const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Types ─────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

interface TypingPayload {
  senderId: string;
  senderName: string;
  isTyping: boolean;
}

// ─── In-memory storage ─────────────────────────────────────────────────

const messageStore = new Map<string, ChatMessage[]>();

const generateId = () => Math.random().toString(36).substring(2, 11);

// ─── Socket.io handlers ────────────────────────────────────────────────

io.on('connection', (socket) => {
  const serviceRequestId = socket.handshake.auth?.serviceRequestId as string | undefined;

  if (!serviceRequestId) {
    console.log(`[chat] Rejected connection — no serviceRequestId (socket: ${socket.id})`);
    socket.disconnect(true);
    return;
  }

  const roomName = `service-request:${serviceRequestId}`;
  socket.join(roomName);
  console.log(`[chat] Connected: socket=${socket.id} room=${roomName}`);

  // Initialize message store if needed
  if (!messageStore.has(serviceRequestId)) {
    messageStore.set(serviceRequestId, []);
  }

  // ─── Send message ───
  socket.on('chat:message', (data: { senderId: string; senderName: string; message: string }) => {
    const { senderId, senderName, message } = data;

    if (!senderId || !senderName || !message) return;

    const chatMessage: ChatMessage = {
      id: generateId(),
      senderId,
      senderName,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    // Store in memory
    const messages = messageStore.get(serviceRequestId) ?? [];
    messages.push(chatMessage);
    messageStore.set(serviceRequestId, messages);

    // Broadcast to room
    io.to(roomName).emit('chat:message', chatMessage);
    console.log(`[chat] Message in ${roomName}: ${senderName}: ${chatMessage.message.substring(0, 50)}`);
  });

  // ─── Typing indicator ───
  socket.on('chat:typing', (data: { senderId: string; senderName: string; isTyping: boolean }) => {
    const { senderId, senderName, isTyping } = data;
    const payload: TypingPayload = { senderId, senderName, isTyping: !!isTyping };
    socket.to(roomName).emit('chat:typing', payload);
  });

  // ─── Disconnect ───
  socket.on('disconnect', () => {
    console.log(`[chat] Disconnected: socket=${socket.id} room=${roomName}`);
  });

  socket.on('error', (err) => {
    console.error(`[chat] Socket error (${socket.id}):`, err);
  });
});

// ─── REST endpoint for message history ─────────────────────────────────

httpServer.on('request', (req, res) => {
  if (req.method === 'GET' && req.url?.startsWith('/messages')) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const serviceRequestId = url.searchParams.get('serviceRequestId');

    if (!serviceRequestId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'serviceRequestId requis' }));
      return;
    }

    const messages = messageStore.get(serviceRequestId) ?? [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: messages }));
  }
});

// ─── Start server ──────────────────────────────────────────────────────

const PORT = 3006;
httpServer.listen(PORT, () => {
  console.log(`[chat-service] Running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[chat-service] SIGTERM received, shutting down...');
  httpServer.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[chat-service] SIGINT received, shutting down...');
  httpServer.close(() => process.exit(0));
});
