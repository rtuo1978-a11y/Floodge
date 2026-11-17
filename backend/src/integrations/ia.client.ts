import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AnalyseSignalement {
  graviteEstimee: 'FAIBLE' | 'MODERE' | 'ELEVE';
  credibilite: number; // 0 → 1
  resume: string;
  motsCles: string[];
  besoinSecours: boolean;
  source: 'ollama' | 'regles';
}

/**
 * Client du service IA (dossier ia/, FastAPI + Ollama).
 * Toutes les méthodes renvoient null si le service est indisponible :
 * l'application continue de fonctionner sans IA.
 */
@Injectable()
export class IaClient {
  private readonly logger = new Logger(IaClient.name);
  private readonly baseUrl: string | undefined;
  private readonly cle: string | undefined;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>('IA_URL');
    this.cle = config.get<string>('INTERNAL_API_KEY');
  }

  analyserSignalement(body: { description: string; niveau: string; commune?: string | null }) {
    return this.post<AnalyseSignalement>('/analyse-signalement', body, 30_000);
  }

  texteVocal(body: { titre: string; message: string; niveau: string; commune?: string | null }) {
    return this.post<{ texte: string }>('/texte-vocal', body, 30_000);
  }

  conseils(body: { situation: string; commune?: string | null; niveauRisque?: string | null }) {
    return this.post<{ conseils: string[]; source: string }>('/conseils', body, 60_000);
  }

  discuter(body: { messages: { role: 'user' | 'assistant'; content: string }[] }) {
    return this.post<{ reponse: string; source: string }>('/chat', body, 60_000);
  }

  private async post<T>(chemin: string, body: unknown, timeoutMs: number): Promise<T | null> {
    if (!this.baseUrl) return null;
    try {
      const res = await fetch(`${this.baseUrl}${chemin}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': this.cle ?? '' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (e) {
      this.logger.warn(`Service IA indisponible (${chemin}) : ${(e as Error).message}`);
      return null;
    }
  }
}
