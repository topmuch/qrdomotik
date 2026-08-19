import { db } from '@/lib/db';
import { getVapidKeys } from '@/lib/vapid';
import webpush from 'web-push';

// Configure web-push with VAPID keys
let configured = false;

function ensureConfigured() {
  if (configured) return;
  const keys = getVapidKeys();
  webpush.setVapidDetails(
    'mailto:contact@qrdomotik.com',
    keys.publicKey,
    keys.privateKey
  );
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  actions?: Array<{ action: string; title: string }>;  
}

// Send push notification to a specific user
export async function sendPushToUser(userId: string, payload: PushPayload) {
  ensureConfigured();

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dhKey,
            auth: sub.authKey,
          },
        },
        JSON.stringify(payload),
        {
          TTL: 86400, // 24h
        }
      );
    })
  );

  // Clean up subscriptions that failed (e.g., unsubscribed)
  const failedIndexes = results
    .map((r, i) => (r.status === 'rejected' ? i : -1))
    .filter((i) => i >= 0);

  if (failedIndexes.length > 0) {
    const failedEndpoints = failedIndexes.map((i) => subscriptions[i].endpoint);
    await db.pushSubscription.deleteMany({
      where: {
        endpoint: { in: failedEndpoints },
      },
    });
  }

  return {
    sent: results.filter((r) => r.status === 'fulfilled').length,
    failed: failedIndexes.length,
  };
}

// Send push notification to all members of a home
export async function sendPushToHome(homeId: string, payload: PushPayload, excludeUserId?: string) {
  const members = await db.homeMember.findMany({
    where: {
      homeId,
      status: 'active',
      userId: excludeUserId ? { not: excludeUserId } : undefined,
    },
    select: { userId: true },
  });

  const userIds = [...new Set(members.map((m) => m.userId))];
  const results = await Promise.all(
    userIds.map((uid) => sendPushToUser(uid, payload))
  );

  return {
    sent: results.reduce((s, r) => s + r.sent, 0),
    failed: results.reduce((s, r) => s + r.failed, 0),
  };
}

// Create notification record in DB
export async function createNotification(
  data: {
    userId: string;
    homeId: string;
    type: string;
    title: string;
    body: string;
    link?: string;
  }
) {
  return db.notification.create({
    data: {
      userId: data.userId,
      homeId: data.homeId,
      type: data.type as never,
      title: data.title,
      body: data.body,
      link: data.link || null,
      read: false,
    },
  });
}
