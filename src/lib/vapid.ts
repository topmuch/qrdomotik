import crypto from 'crypto';

// Generate VAPID keys (run once, store in .env)
// These are pre-generated for development
function generateVapidKeys() {
  const curve = crypto.createECDH('prime256v1');
  curve.generateKeys();
  return {
    publicKey: curve.getPublicKey().toString('base64url'),
    privateKey: curve.getPrivateKey().toString('base64url'),
  };
}

// Default keys for development (regenerated each restart is fine for dev)
// In production, these should be stored in .env
let cachedKeys: { publicKey: string; privateKey: string } | null = null;

export function getVapidKeys() {
  if (cachedKeys) return cachedKeys;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (publicKey && privateKey) {
    cachedKeys = { publicKey, privateKey };
    return cachedKeys;
  }

  // Generate new keys for development
  cachedKeys = generateVapidKeys();
  return cachedKeys;
}

// Expose public key for client-side
export function getVapidPublicKey(): string {
  return getVapidKeys().publicKey;
}
