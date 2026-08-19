// ═══════════════════════════════════════════════════════════════════
// QR DOMOTIK V3 — Utilitaires Géolocalisation
// Remplace PostGIS ST_DWithin / ST_Distance pour SQLite
// ═══════════════════════════════════════════════════════════════════

/** Rayon de la Terre en km */
const EARTH_RADIUS_KM = 6371;

/** Coordonnées GPS */
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Formule de Haversine — Calcule la distance entre deux points GPS.
 * Retourne la distance en kilomètres.
 */
export function haversineDistance(
  a: GeoCoordinates,
  b: GeoCoordinates
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const calc =
    sinDLat * sinDLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) *
    sinDLng * sinDLng;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(calc), Math.sqrt(1 - calc));
}

/**
 * Filtre une liste d'entités géolocalisées par rayon maximal.
 * Utilisé pour les requêtes « dans un rayon de N km ».
 *
 * @param items - Entités avec latitude/longitude
 * @param center - Point central (ex: position utilisateur)
 * @param radiusKm - Rayon en kilomètres
 * @returns Entités dans le rayon, triées par distance croissante
 */
export function filterByRadius<T extends GeoCoordinates>(
  items: T[],
  center: GeoCoordinates,
  radiusKm: number
): Array<T & { distanceKm: number }> {
  return items
    .map((item) => ({
      ...item,
      distanceKm: haversineDistance(center, item),
    }))
    .filter((item) => item.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Formate une distance pour l'affichage.
 * < 1 km → « 300 m »
 * >= 1 km → « 2.4 km »
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Calcule le bounding box pour un rayon donné (optimisation de requête).
 * Permet de pré-filterer grossièrement avant le calcul Haversine précis.
 */
export function boundingBox(
  center: GeoCoordinates,
  radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const latRad = (center.latitude * Math.PI) / 180;
  const dLat = radiusKm / EARTH_RADIUS_KM;
  const dLng = radiusKm / (EARTH_RADIUS_KM * Math.cos(latRad));

  return {
    minLat: center.latitude - toDeg(dLat),
    maxLat: center.latitude + toDeg(dLat),
    minLng: center.longitude - toDeg(dLng),
    maxLng: center.longitude + toDeg(dLng),
  };
}

/**
 * Extrait les mots-clés d'un texte pour le matching promo/produit.
 * Normalise : minuscules, sans accents, sans ponctuation, split en mots.
 */
export function extractKeywords(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s]/g, ' ')   // Garde seulement alphanumérique
    .split(/\s+/)
    .filter((w) => w.length >= 2);    // Ignore mots < 2 chars

  return [...new Set(normalized)]; // Dedup
}

/**
 * Calcule le score de matching entre une liste de courses et des keywords promo.
 * Retourne le nombre de mots-clés correspondants.
 */
export function matchScore(
  shoppingListKeywords: string[],
  promoKeywords: string[]
): number {
  if (!shoppingListKeywords.length || !promoKeywords.length) return 0;
  const promoSet = new Set(promoKeywords.map((k) => k.toLowerCase()));
  return shoppingListKeywords.filter((k) => promoSet.has(k.toLowerCase())).length;
}
