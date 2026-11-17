import type { Point } from '../types.js';

/**
 * Pluie prévue sur les prochaines heures, via Open-Meteo (gratuit, sans clé).
 * Complète les observations SODEXAM, qui décrivent le passé.
 * https://open-meteo.com/en/docs
 */
export async function pluiePrevue(p: Point, heures = 24): Promise<number | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}` +
      `&hourly=precipitation&forecast_hours=${heures}&timezone=Africa%2FAbidjan`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { hourly?: { precipitation?: (number | null)[] } };
    const valeurs = json.hourly?.precipitation ?? [];
    return valeurs.reduce<number>((s, v) => s + (v ?? 0), 0);
  } catch {
    return null;
  }
}
