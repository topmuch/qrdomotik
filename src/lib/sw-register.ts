'use client';

let swRegistration: ServiceWorkerRegistration | null = null;
let vapidPublicKey: string | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;

  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    swRegistration.addEventListener('updatefound', () => {
      const newWorker = swRegistration?.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          if (navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('sw-updated'));
          }
        }
      });
    });

    return swRegistration;
  } catch (error) {
    console.warn('SW registration failed:', error);
    return null;
  }
}

export function getSwRegistration(): ServiceWorkerRegistration | null {
  return swRegistration;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  const permission = await Notification.requestPermission();
  return permission;
}

async function fetchVapidPublicKey(): Promise<string> {
  if (vapidPublicKey) return vapidPublicKey;
  try {
    const res = await fetch('/api/push/vapid-key');
    const data = await res.json();
    vapidPublicKey = data.publicKey;
    return vapidPublicKey || '';
  } catch {
    return '';
  }
}

export async function subscribeToPushNotifications(homeId?: string): Promise<PushSubscription | null> {
  if (!swRegistration) return null;

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return null;

  try {
    const key = await fetchVapidPublicKey();
    if (!key) {
      console.warn('No VAPID public key available');
      return null;
    }

    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });

    // Send subscription to server
    const subJson = subscription.toJSON();
    if (subJson.endpoint && subJson.keys) {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
          homeId: homeId || null,
        }),
      });
    }

    return subscription;
  } catch (error) {
    console.warn('Push subscription failed:', error);
    return null;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<void> {
  if (!swRegistration) return;

  const subscription = await swRegistration.pushManager.getSubscription();
  if (!subscription) return;

  try {
    await subscription.unsubscribe();
    await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
      method: 'DELETE',
    });
  } catch {
    // ignore
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
