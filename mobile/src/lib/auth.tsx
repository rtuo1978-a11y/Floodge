import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, definirJeton } from './api';
import type { Session, Utilisateur } from './types';

const CLE_JETON = 'floodge.jeton';

interface ContexteAuth {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  connecter: (email: string, motDePasse: string) => Promise<void>;
  inscrire: (d: Parameters<typeof api.inscription>[0]) => Promise<void>;
  deconnecter: () => Promise<void>;
  rafraichir: () => Promise<void>;
}

const Contexte = createContext<ContexteAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  // Au démarrage : reprendre la session enregistrée
  useEffect(() => {
    (async () => {
      try {
        const jeton = await SecureStore.getItemAsync(CLE_JETON);
        if (jeton) {
          definirJeton(jeton);
          setUtilisateur(await api.moi());
        }
      } catch {
        definirJeton(null);
        await SecureStore.deleteItemAsync(CLE_JETON);
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  const ouvrir = useCallback(async (session: Session) => {
    definirJeton(session.accessToken);
    await SecureStore.setItemAsync(CLE_JETON, session.accessToken);
    setUtilisateur(session.user);
  }, []);

  const valeur = useMemo<ContexteAuth>(
    () => ({
      utilisateur,
      chargement,
      connecter: async (email, motDePasse) => ouvrir(await api.connexion(email, motDePasse)),
      inscrire: async (d) => ouvrir(await api.inscription(d)),
      deconnecter: async () => {
        definirJeton(null);
        await SecureStore.deleteItemAsync(CLE_JETON);
        setUtilisateur(null);
      },
      rafraichir: async () => setUtilisateur(await api.moi()),
    }),
    [utilisateur, chargement, ouvrir],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useAuth() {
  const ctx = useContext(Contexte);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
