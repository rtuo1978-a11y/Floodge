import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { Bouton, Carte, Ecran, Pastille, SousTitre, styles, Vide } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { ilYa, NIVEAUX_INONDATION, STATUTS_SIGNALEMENT } from '../../lib/format';
import type { Classement, Signalement } from '../../lib/types';
import { couleurs, espace, police } from '../../theme';

const ICONES: Record<string, string> = { SENTINELLE: '👁️', VIGIE_QUARTIER: '🛡️', SOLIDAIRE: '🤝', MEILLEUR_CITOYEN: '🏅' };

export default function ProfilEcran() {
  const router = useRouter();
  const { utilisateur, rafraichir, deconnecter } = useAuth();
  const [classement, setClassement] = useState<Classement | null>(null);
  const [mesSignalements, setMesSignalements] = useState<Signalement[]>([]);
  const [chargement, setChargement] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const [, c, s] = await Promise.all([rafraichir(), api.classement(), api.mesSignalements()]);
      setClassement(c);
      setMesSignalements(s);
    } catch {
      /* hors ligne : on garde l'affichage précédent */
    } finally {
      setChargement(false);
    }
  }, [rafraichir]);

  useFocusEffect(
    useCallback(() => {
      void charger();
    }, [charger]),
  );

  if (!utilisateur) return null;
  const monRang = classement?.classement.find((c) => c.userId === utilisateur.id)?.rang;
  const role = utilisateur.role;

  return (
    <Ecran titre="Mon profil" onRafraichir={charger} rafraichissement={chargement}>
      <Carte>
        <Text style={[styles.texte, { fontSize: police.titre, fontWeight: '700' }]}>{utilisateur.nom}</Text>
        <Text style={styles.texteSecondaire}>
          {[utilisateur.commune, utilisateur.email].filter(Boolean).join(' · ')}
        </Text>
        <View style={[styles.ligne, { marginTop: espace.m }]}>
          <Text style={{ fontSize: police.grande, fontWeight: '800', color: couleurs.primaire }}>{utilisateur.points}</Text>
          <Text style={styles.texte}>points citoyens{monRang ? ` · ${monRang}ᵉ ce mois-ci` : ''}</Text>
        </View>
      </Carte>

      {role !== 'CITOYEN' ? (
        <>
          <SousTitre>Mon espace</SousTitre>
          {role === 'AUTORITE' || role === 'ADMIN' ? (
            <Bouton libelle="Espace autorités : vérifier et publier" onPress={() => router.push('/autorite')} />
          ) : null}
          <Bouton libelle="Espace secours : demandes SOS" variante="secondaire" onPress={() => router.push('/secours')} />
        </>
      ) : null}

      <SousTitre>Mes badges</SousTitre>
      {utilisateur.badges?.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espace.s }}>
          {utilisateur.badges.map((b) => (
            <Carte key={b.id} style={{ width: '48%', alignItems: 'center' }}>
              <Text style={{ fontSize: 32 }}>{ICONES[b.badge.code] ?? '⭐'}</Text>
              <Text style={[styles.texte, { fontWeight: '700', textAlign: 'center' }]}>{b.badge.nom}</Text>
              <Text style={[styles.texteSecondaire, { textAlign: 'center' }]}>{b.periode || b.badge.description}</Text>
            </Carte>
          ))}
        </View>
      ) : (
        <Vide texte="Envoyez votre premier signalement pour obtenir le badge Sentinelle." />
      )}

      <SousTitre>Classement du mois — Meilleur citoyen</SousTitre>
      {classement?.classement.length ? (
        <Carte>
          {classement.classement.slice(0, 10).map((c) => (
            <View key={c.userId} style={[styles.ligne, { paddingVertical: espace.xs }]}>
              <Text style={[styles.texte, { width: 30, fontWeight: '700' }]}>{c.rang === 1 ? '🏅' : `${c.rang}.`}</Text>
              <Text style={[styles.texte, { flex: 1, fontWeight: c.userId === utilisateur.id ? '700' : '400' }]}>
                {c.nom}
                {c.commune ? ` (${c.commune})` : ''}
              </Text>
              <Text style={styles.texte}>{c.score} pts</Text>
            </View>
          ))}
        </Carte>
      ) : (
        <Vide texte="Pas encore de classement ce mois-ci." />
      )}

      <SousTitre>Mes signalements</SousTitre>
      {mesSignalements.length ? (
        mesSignalements.slice(0, 10).map((s) => (
          <Carte key={s.id} onPress={() => router.push(`/signalement/${s.id}`)}>
            <View style={[styles.ligne, { justifyContent: 'space-between' }]}>
              <Pastille libelle={NIVEAUX_INONDATION[s.niveau].libelle} couleur={NIVEAUX_INONDATION[s.niveau].couleur} />
              <Text style={styles.texteSecondaire}>{ilYa(s.createdAt)}</Text>
            </View>
            <Text style={[styles.texte, { marginTop: espace.s }]} numberOfLines={2}>
              {s.description}
            </Text>
            <Text style={styles.texteSecondaire}>{STATUTS_SIGNALEMENT[s.statut]}</Text>
          </Carte>
        ))
      ) : (
        <Vide texte="Aucun signalement pour le moment." />
      )}

      <Bouton libelle="Se déconnecter" variante="discret" onPress={deconnecter} style={{ marginTop: espace.l }} />
    </Ecran>
  );
}
