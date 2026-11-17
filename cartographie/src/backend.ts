import { config } from './config.js';
import type { NiveauRisque, Observation, PointInonde } from './types.js';

/** Appels aux routes /interne du back-end Floodge (en-tête x-api-key). */
async function appel<T>(chemin: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${config.backendUrl}${chemin}`, {
    method: init?.method ?? 'GET',
    headers: { 'content-type': 'application/json', 'x-api-key': config.cleInterne },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Back-end ${chemin} : HTTP ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export const backend = {
  envoyerZones: (zones: unknown[]) =>
    appel<{ importees: number }>('/interne/zones/import', { method: 'POST', body: { zones } }),

  majRisque: (code: string, maj: { niveau: NiveauRisque; score: number; source?: string }) =>
    appel(`/interne/zones/${encodeURIComponent(code)}/risque`, { method: 'PATCH', body: maj }),

  envoyerObservations: (observations: Observation[]) =>
    appel<{ importees: number; ignorees: number }>('/interne/meteo/observations', {
      method: 'POST',
      body: { observations },
    }),

  signalementsRecents: (heures = 12) => appel<PointInonde[]>(`/interne/signalements/recents?heures=${heures}`),

  observations: (heures = 24) => appel<Observation[]>(`/meteo/observations?heures=${heures}`),
};
