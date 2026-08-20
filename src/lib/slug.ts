// ═══════════════════════════════════════════════════════════════════════════════
// QR DOMOTIK — Utilitaire de génération de slugs publics uniques
// ═══════════════════════════════════════════════════════════════════════════════

const CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'; // Pas de 0, o, 1, l, i pour éviter la confusion
const SLUG_LENGTH = 6;

/**
 * Génère un slug aléatoire unique (ex: 'x8k2p9')
 * Usage: pour les QR codes publics
 */
export function generatePublicSlug(): string {
  const array = new Uint8Array(SLUG_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => CHARS[byte % CHARS.length]).join('');
}

/**
 * Génère un PIN à 4 chiffres
 */
export function generatePin(): string {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => (byte % 10).toString()).join('');
}
