import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Point } from '../common/geo.js';

export interface ZoneLocalisee {
  code: string;
  nom: string;
  commune: string;
  niveau: string;
  score: number;
}

/** Client du service cartographie (dossier cartographie/, Node.js + Google Maps). */
@Injectable()
export class CarteClient {
  private readonly logger = new Logger(CarteClient.name);
  private readonly baseUrl: string | undefined;
  private readonly cle: string | undefined;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>('CARTO_URL');
    this.cle = config.get<string>('INTERNAL_API_KEY');
  }

  /** Zone à risque et commune qui contiennent ce point. */
  localiser(p: Point) {
    return this.requete<{ zone: ZoneLocalisee | null; commune: string | null }>(
      `/zones/localiser?lat=${p.latitude}&lng=${p.longitude}`,
    );
  }

  /** Itinéraire qui évite les points inondés (Google Directions + filtrage). */
  itineraireSur(body: { origine: Point; destination: Point; pointsInondes: Point[]; mode?: string }) {
    return this.requete<unknown>('/itineraires/sur', body, 20_000);
  }

  private async requete<T>(chemin: string, body?: unknown, timeoutMs = 8_000): Promise<T | null> {
    if (!this.baseUrl) return null;
    try {
      const res = await fetch(`${this.baseUrl}${chemin}`, {
        method: body ? 'POST' : 'GET',
        headers: { 'content-type': 'application/json', 'x-api-key': this.cle ?? '' },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (e) {
      this.logger.warn(`Service cartographie indisponible (${chemin}) : ${(e as Error).message}`);
      return null;
    }
  }
}
