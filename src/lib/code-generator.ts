import { db } from './db';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // pas de 0/O/1/I pour éviter confusion
const CODE_LENGTH = 8;
const PREFIX = 'QR-';

function randomCode(): string {
  let code = PREFIX;
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

/**
 * Génère N codes d'activation uniques.
 * Vérifie l'unicité en base avant de retourner.
 */
export async function generateUniqueCodes(quantity: number): Promise<string[]> {
  const codes: string[] = [];
  const existing = new Set<string>();

  // Pre-charger les codes existants pour éviter des requêtes répétées
  const allExisting = await db.physicalQrCode.findMany({
    select: { activationCode: true },
  });
  allExisting.forEach((c) => existing.add(c.activationCode));

  let attempts = 0;
  const maxAttempts = quantity * 10;

  while (codes.length < quantity && attempts < maxAttempts) {
    const code = randomCode();
    if (!existing.has(code)) {
      existing.add(code);
      codes.push(code);
    }
    attempts++;
  }

  if (codes.length < quantity) {
    throw new Error(`Impossible de générer ${quantity} codes uniques (obtenu: ${codes.length})`);
  }

  return codes;
}

/**
 * Valide le format d'un code d'activation.
 */
export function isValidActivationCode(code: string): boolean {
  return new RegExp(`^${PREFIX}[${CHARS}]{${CODE_LENGTH}}$`).test(code);
}
