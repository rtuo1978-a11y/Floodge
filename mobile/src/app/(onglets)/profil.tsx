import { useFocusEffect, useRouter } from 'expo-router';
import {
  Award,
  ChevronRight,
  Eye,
  HandHeart,
  LifeBuoy,
  LogOut,
  Medal,
  Megaphone,
  ShieldCheck,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Bouton, Carte, Ecran, EnTeteSection, EtatVide, LigneListe, PastilleNiveau, styles as ui, Texte } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { ilYa, NIVEAUX_INONDATION, rang, STATUTS_SIGNALEMENT } from '../../lib/format';
import type { Classement, Signalement } from '../../lib/types';
import { couleurs, espace, ombre, rayon } from '../../theme';

const BADGES: Record<string, { icone: LucideIcon; couleur: string; fond: string }> = {
  SENTINELLE: { icone: Eye, couleur: couleurs.primaire, fond: couleurs.primaireDoux },
  VIGIE_QUARTIER: { icone: ShieldCheck, couleur: couleurs.succes, fond: couleurs.succesDoux },
  SOLIDAIRE: { icone: HandHeart, couleur: couleurs.modere, fond: couleurs.modereDoux },
  MEILLEUR_CITOYEN: { icone: Trophy, couleur: couleurs.or, fond: couleurs.orDoux },
};

const ROLES: Record<string, string> = {
  CITOYEN: 'Citoyen',
  SECOURISTE: 'Secouriste',
  AUTORITE: 'Autorité',
  ADMIN: 'Administrateur',
};

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
      {/* Carte d'identité + statistiques */}
      <View style={[styles.identite, ombre.moyenne]}>
        <View style={ui.ligne}>
          <Avatar nom={utilisateur.nom} taille={60} />
          <View style={{ flex: 1 }}>
            <Texte variante="titre2" couleur={couleurs.surFonce}>
              {utilisateur.nom}
            </Texte>
            <Texte variante="petit" couleur={couleurs.primaireDoux}>
              {[ROLES[role], utilisateur.commune].filter(Boolean).join(' · ')}
            </Texte>
          </View>
        </View>
        <View style={styles.stats}>
          {[
            { valeur: String(utilisateur.points), libelle: 'points' },
            { valeur: monRang ? rang(monRang) : '—', libelle: 'ce mois-ci' },
            { valeur: String(mesSignalements.length), libelle: 'signalements' },
          ].map((s) => (
            <View key={s.libelle} style={styles.stat}>
              <Texte variante="titre1" couleur={couleurs.surFonce}>
                {s.valeur}
              </Texte>
              <Texte variante="petit" couleur={couleurs.primaireDoux}>
                {s.libelle}
              </Texte>
            </View>
          ))}
        </View>
      </View>

      {role !== 'CITOYEN' ? (
        <>
          <EnTeteSection titre="Mon espace" />
          <Carte style={{ padding: 0 }}>
            {role === 'AUTORITE' || role === 'ADMIN' ? (
              <>
                <LigneListe
                  icone={Megaphone}
                  titre="Espace autorités"
                  sousTitre="Publier les alertes, vérifier les signalements"
                  onPress={() => router.push('/autorite')}
                  droite={<ChevronRight size={20} color={couleurs.texteSecondaire} />}
                />
                <View style={ui.separateur} />
              </>
            ) : null}
            <LigneListe
              icone={LifeBuoy}
              titre="Espace secours"
              sousTitre="Demandes SOS en cours"
              couleurIcone={couleurs.sos}
              fondIcone={couleurs.sosDoux}
              onPress={() => router.push('/secours')}
              droite={<ChevronRight size={20} color={couleurs.texteSecondaire} />}
            />
          </Carte>
        </>
      ) : null}

      <EnTeteSection titre="Mes badges" />
      {utilisateur.badges?.length ? (
        <View style={styles.grille}>
          {utilisateur.badges.map((b) => {
            const st = BADGES[b.badge.code] ?? { icone: Award, couleur: couleurs.primaire, fond: couleurs.primaireDoux };
            return (
              <View key={b.id} style={styles.badge} accessible accessibilityLabel={`Badge ${b.badge.nom}`}>
                <View style={[styles.iconeBadge, { backgroundColor: st.fond }]}>
                  <st.icone size={26} color={st.couleur} strokeWidth={2.2} />
                </View>
                <Texte variante="petitGras" style={{ textAlign: 'center' }}>
                  {b.badge.nom}
                </Texte>
                <Texte variante="legende" couleur={couleurs.texteSecondaire} style={{ textAlign: 'center' }}>
                  {b.periode || b.badge.description}
                </Texte>
              </View>
            );
          })}
        </View>
      ) : (
        <Carte>
          <EtatVide icone={Award} titre="Pas encore de badge" texte="Envoyez votre premier signalement pour devenir Sentinelle." />
        </Carte>
      )}

      <EnTeteSection titre="Meilleur citoyen du mois" />
      <Carte style={{ padding: 0 }}>
        {classement?.classement.length ? (
          classement.classement.slice(0, 10).map((c, i) => {
            const moi = c.userId === utilisateur.id;
            const podium = [couleurs.or, couleurs.argent, couleurs.bronze][c.rang - 1];
            return (
              <View key={c.userId}>
                {i > 0 ? <View style={[ui.separateur, { marginLeft: espace.m }]} /> : null}
                <View style={[styles.rangLigne, moi ? { backgroundColor: couleurs.primaireTresDoux } : null]}>
                  <View style={styles.rang}>
                    {podium ? (
                      <Medal size={22} color={podium} />
                    ) : (
                      <Texte variante="petitGras" couleur={couleurs.texteSecondaire}>
                        {c.rang}
                      </Texte>
                    )}
                  </View>
                  <Avatar nom={c.nom} taille={36} />
                  <View style={{ flex: 1 }}>
                    <Texte variante={moi ? 'corpsGras' : 'corps'} numberOfLines={1}>
                      {c.nom}
                      {moi ? ' (vous)' : ''}
                    </Texte>
                    {c.commune ? (
                      <Texte variante="petit" couleur={couleurs.texteSecondaire}>
                        {c.commune}
                      </Texte>
                    ) : null}
                  </View>
                  <Texte variante="corpsGras" couleur={couleurs.primaire}>
                    {c.score} pts
                  </Texte>
                </View>
              </View>
            );
          })
        ) : (
          <EtatVide icone={Trophy} titre="Classement vide" texte="Soyez le premier à signaler ce mois-ci." />
        )}
      </Carte>

      <EnTeteSection titre="Mes signalements" />
      {mesSignalements.length ? (
        mesSignalements.slice(0, 10).map((s) => (
          <Carte key={s.id} onPress={() => router.push(`/signalement/${s.id}`)} accent={NIVEAUX_INONDATION[s.niveau].couleur}>
            <View style={ui.entre}>
              <PastilleNiveau s={STATUTS_SIGNALEMENT[s.statut]} />
              <Texte variante="petit" couleur={couleurs.texteSecondaire}>
                {ilYa(s.createdAt)}
              </Texte>
            </View>
            <Texte variante="corps" style={{ marginTop: espace.s }} numberOfLines={2}>
              {s.description}
            </Texte>
          </Carte>
        ))
      ) : (
        <Carte>
          <EtatVide icone={Eye} titre="Aucun signalement" texte="Vos signalements apparaîtront ici." />
        </Carte>
      )}

      <Bouton libelle="Se déconnecter" icone={LogOut} variante="fantome" onPress={deconnecter} style={{ marginTop: espace.l }} />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  identite: { backgroundColor: couleurs.primaire, borderRadius: rayon.xl, padding: espace.m },
  stats: {
    flexDirection: 'row',
    marginTop: espace.m,
    backgroundColor: couleurs.voileClair,
    borderRadius: rayon.l,
    paddingVertical: espace.sm,
  },
  stat: { flex: 1, alignItems: 'center' },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: espace.sm },
  badge: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.l,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    padding: espace.m,
    alignItems: 'center',
    gap: espace.xs,
  },
  iconeBadge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: espace.xs },
  rangLigne: { flexDirection: 'row', alignItems: 'center', gap: espace.sm, paddingHorizontal: espace.m, paddingVertical: espace.sm },
  rang: { width: 28, alignItems: 'center' },
});
