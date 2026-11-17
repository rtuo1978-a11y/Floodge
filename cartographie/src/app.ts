import express, { type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { backend } from './backend.js';
import { config } from './config.js';
import { calculerRoutes, communeGoogle, GoogleMapsIndisponible } from './google.js';
import { evaluerItineraires } from './itineraires/sur.js';
import { recalculerEtPublier } from './risque/recalculer.js';
import { calculerScore } from './risque/score.js';
import { lireCsvSodexam } from './sodexam/import.js';
import type { Observation, Station } from './types.js';
import type { ZonesStore } from './zones/zones.js';

const point = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) });

const schemaItineraire = z.object({
  origine: point,
  destination: point,
  mode: z.enum(['driving', 'walking']).optional(),
  pointsInondes: z
    .array(point.extend({ niveau: z.enum(['FAIBLE', 'MODERE', 'ELEVE']).optional(), id: z.string().optional() }))
    .max(2000).default([]),
});

/** Routes appelées par le back-end : clé x-api-key obligatoire si INTERNAL_API_KEY est définie. */
function interne(req: Request, res: Response, next: NextFunction) {
  if (config.cleInterne && req.header('x-api-key') !== config.cleInterne) {
    res.status(401).json({ message: 'Clé interne invalide' });
    return;
  }
  next();
}

export function creerApp(store: ZonesStore, stations: Station[]) {
  const app = express();
  /** Observations importées par ce service (en plus de celles stockées par le back-end) */
  const observations: Observation[] = [];

  app.use(express.json({ limit: '5mb' }));
  app.use(express.text({ type: ['text/csv', 'text/plain'], limit: '5mb' }));

  app.get('/sante', (_req, res) => {
    res.json({ statut: 'ok', service: 'flowmanage-cartographie', zones: store.toutes().features.length, googleMaps: !!config.googleMapsKey });
  });

  // ---------- Zones ----------
  app.get('/zones', (req, res) => {
    res.json(store.toutes(typeof req.query.commune === 'string' ? req.query.commune : undefined));
  });

  app.get('/zones/localiser', async (req, res) => {
    const p = point.safeParse({ latitude: Number(req.query.lat), longitude: Number(req.query.lng) });
    if (!p.success) {
      res.status(400).json({ message: 'Paramètres lat et lng requis' });
      return;
    }
    const zone = store.zoneContenant(p.data);
    const commune = zone?.properties.commune ?? (await communeGoogle(p.data)) ?? store.communeProche(p.data);
    res.json({
      zone: zone
        ? {
            code: zone.properties.code,
            nom: zone.properties.nom,
            commune: zone.properties.commune,
            niveau: zone.properties.niveau,
            score: zone.properties.score,
          }
        : null,
      commune,
    });
  });

  app.get('/zones/:code', (req, res) => {
    const zone = store.parCode(req.params.code);
    if (!zone) {
      res.status(404).json({ message: 'Zone introuvable' });
      return;
    }
    res.json(zone);
  });

  app.get('/stations', (_req, res) => {
    res.json(stations);
  });

  // ---------- Données SODEXAM ----------
  /** Corps : texte CSV (Content-Type: text/csv) ou JSON { csv: "..." } */
  app.post('/sodexam/import', interne, async (req, res) => {
    const csv = typeof req.body === 'string' ? req.body : req.body?.csv;
    if (typeof csv !== 'string' || !csv.trim()) {
      res.status(400).json({ message: 'Envoyer le CSV en texte (text/csv) ou en JSON { "csv": "..." }' });
      return;
    }
    const { observations: nouvelles, erreurs } = lireCsvSodexam(csv, stations);
    observations.push(...nouvelles);
    let backendResultat: unknown = null;
    try {
      backendResultat = nouvelles.length ? await backend.envoyerObservations(nouvelles) : null;
    } catch (e) {
      backendResultat = { erreur: (e as Error).message };
    }
    res.json({ lues: nouvelles.length, erreurs, backend: backendResultat });
  });

  // ---------- Risque ----------
  app.post('/risque/recalculer', interne, async (_req, res) => {
    res.json(await recalculerEtPublier(store, stations, observations));
  });

  /**
   * Simulation de scénario (tests, démonstration) :
   * GET /risque/simuler?code=ABJ-COCODY-PALMERAIE&pluie=120&prevision=60&eleves=2&moderes=1
   */
  app.get('/risque/simuler', (req, res) => {
    const zone = store.parCode(String(req.query.code ?? ''));
    if (!zone) {
      res.status(404).json({ message: 'Zone introuvable (paramètre code)' });
      return;
    }
    const n = (k: string) => Math.max(0, Number(req.query[k]) || 0);
    const signalements = [
      ...Array.from({ length: n('eleves') }, () => ({ niveau: 'ELEVE' })),
      ...Array.from({ length: n('moderes') }, () => ({ niveau: 'MODERE' })),
    ];
    res.json({
      zone: zone.properties.nom,
      ...calculerScore({
        scoreBase: zone.properties.scoreBase,
        pluieObservee24hMm: n('pluie'),
        pluiePrevue24hMm: n('prevision'),
        signalements,
      }),
    });
  });

  // ---------- Itinéraires ----------
  app.post('/itineraires/sur', interne, async (req, res) => {
    const corps = schemaItineraire.safeParse(req.body);
    if (!corps.success) {
      res.status(400).json({ message: 'Corps invalide', details: corps.error.issues });
      return;
    }
    try {
      const routes = await calculerRoutes(corps.data.origine, corps.data.destination, corps.data.mode);
      res.json(evaluerItineraires(routes, corps.data.pointsInondes));
    } catch (e) {
      const status = e instanceof GoogleMapsIndisponible ? 503 : 502;
      res.status(status).json({ message: (e as Error).message });
    }
  });

  return app;
}
