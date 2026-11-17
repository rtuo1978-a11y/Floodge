import type {
  Alerte,
  Classement,
  Conseil,
  DemandeSecours,
  Itineraire,
  MomentConseil,
  NiveauInondation,
  Point,
  Session,
  Signalement,
  StatutSecours,
  Utilisateur,
  ZoneFeature,
} from './types';

/**
 * Adresse de l'API (fichier .env) : sur un vrai téléphone, utiliser l'IP de l'ordinateur
 * sur le Wi-Fi, ex. EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/api/v1
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

let jeton: string | null = null;
export const definirJeton = (t: string | null) => {
  jeton = t;
};

export class ErreurApi extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function requete<T>(chemin: string, options: { method?: string; body?: unknown; form?: FormData } = {}) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${chemin}`, {
      method: options.method ?? (options.body || options.form ? 'POST' : 'GET'),
      headers: {
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...(jeton ? { authorization: `Bearer ${jeton}` } : {}),
      },
      body: options.form ?? (options.body ? JSON.stringify(options.body) : undefined),
    });
  } catch {
    throw new ErreurApi('Serveur injoignable. Vérifiez votre connexion internet.', 0);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(json?.message) ? json.message[0] : json?.message;
    throw new ErreurApi(message ?? `Erreur ${res.status}`, res.status);
  }
  return json as T;
}

const qs = (params: Record<string, string | number | undefined | null>) => {
  const p = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return p.length ? `?${p.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')}` : '';
};

export const api = {
  // Auth et profil
  connexion: (email: string, motDePasse: string) => requete<Session>('/auth/connexion', { body: { email, motDePasse } }),
  inscription: (d: { nom: string; email: string; motDePasse: string; telephone?: string; commune?: string }) =>
    requete<Session>('/auth/inscription', { body: d }),
  moi: () => requete<Utilisateur>('/utilisateurs/moi'),
  majProfil: (d: Partial<Pick<Utilisateur, 'nom' | 'telephone' | 'commune'>> & { pushToken?: string } & Partial<Point>) =>
    requete<Utilisateur>('/utilisateurs/moi', { method: 'PATCH', body: d }),

  // Signalements
  envoyerPhoto: (uri: string, mimeType = 'image/jpeg') => {
    const form = new FormData();
    // Format attendu par React Native pour un fichier dans FormData
    form.append('photo', { uri, name: `photo.${mimeType.split('/')[1] ?? 'jpg'}`, type: mimeType } as unknown as Blob);
    return requete<{ url: string }>('/signalements/photo', { form });
  },
  signaler: (d: Point & { niveau: NiveauInondation; description: string; photoUrl?: string }) =>
    requete<Signalement>('/signalements', { body: d }),
  signalements: (f: { heures?: number; statut?: string } = {}) => requete<Signalement[]>(`/signalements${qs(f)}`),
  mesSignalements: () => requete<Signalement[]>('/signalements/miens'),
  signalement: (id: string) => requete<Signalement>(`/signalements/${id}`),
  confirmer: (id: string) => requete<Signalement>(`/signalements/${id}/confirmer`, { method: 'POST' }),
  changerStatutSignalement: (id: string, statut: 'CONFIRME' | 'REJETE' | 'RESOLU') =>
    requete<Signalement>(`/signalements/${id}/statut`, { method: 'PATCH', body: { statut } }),

  // Alertes
  alertes: (p?: Partial<Point>) => requete<Alerte[]>(`/alertes${qs({ lat: p?.latitude, lng: p?.longitude })}`),
  brouillons: () => requete<Alerte[]>('/alertes/brouillons'),
  publierAlerte: (id: string) => requete<Alerte & { destinataires: number }>(`/alertes/${id}/publier`, { method: 'PATCH' }),
  archiverAlerte: (id: string) => requete<Alerte>(`/alertes/${id}/archiver`, { method: 'PATCH' }),

  // Secours
  sos: (d: Point & { nbPersonnes?: number; description?: string; telephone?: string }) => requete<DemandeSecours>('/secours', { body: d }),
  mesDemandesSecours: () => requete<DemandeSecours[]>('/secours/miennes'),
  demandesSecours: () => requete<DemandeSecours[]>('/secours'),
  majSecours: (id: string, statut: StatutSecours) => requete<DemandeSecours>(`/secours/${id}`, { method: 'PATCH', body: { statut } }),

  // Carte
  zones: () => requete<{ type: 'FeatureCollection'; features: ZoneFeature[] }>('/zones'),
  itineraireSur: (origine: Point, destination: Point, mode: 'driving' | 'walking' = 'driving') =>
    requete<{ itineraires: Itineraire[]; recommande: Itineraire | null; avertissement: string | null }>('/carte/itineraire-sur', {
      body: { origine, destination, mode },
    }),

  // Conseils et IA
  conseils: (moment?: MomentConseil) => requete<Conseil[]>(`/conseils${qs({ moment })}`),
  conseilsPersonnalises: (situation: string, commune?: string | null) =>
    requete<{ conseils: string[]; source: string }>('/conseils/personnalises', {
      body: { situation, commune: commune ?? undefined },
    }),
  discuter: (messages: { role: 'user' | 'assistant'; content: string }[]) =>
    requete<{ reponse: string; source: string }>('/ia/chat', { body: { messages } }),

  // Badges
  classement: () => requete<Classement>('/classement'),
};
