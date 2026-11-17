import { useLocalSearchParams } from 'expo-router';
import { CircleCheck, Clock, Eye, MapPin, ShieldCheck, Sparkles, TriangleExclamationPoint, User, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Bandeau, Bouton, Carte, Ecran, PastilleNiveau, Squelette, styles as ui, Texte } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { ilYa, NIVEAUX_INONDATION, NIVEAUX_RISQUE, STATUTS_SIGNALEMENT } from '../../lib/format';
import type { Signalement } from '../../lib/types';
import { couleurs, espace, rayon } from '../../theme';

function Info({ icone: Icone, texte }: { icone: typeof MapPin; texte: string }) {
  return (
    <View style={[ui.ligne, { marginTop: espace.xs }]}>
      <Icone size={16} color={couleurs.texteSecondaire} />
      <Texte variante="petit" couleur={couleurs.texteSecondaire} style={{ flex: 1 }}>
        {texte}
      </Texte>
    </View>
  );
}

export default function SignalementEcran() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { utilisateur } = useAuth();
  const [s, setS] = useState<Signalement | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);

  const charger = useCallback(() => {
    api.signalement(id).then(setS).catch((e: Error) => setErreur(e.message));
  }, [id]);

  useEffect(charger, [charger]);

  async function agir(cle: string, fn: () => Promise<Signalement>, message: string) {
    setAction(cle);
    setErreur(null);
    try {
      setS(await fn());
      setInfo(message);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setAction(null);
    }
  }

  if (!s) {
    return (
      <Ecran enTeteSysteme>
        {erreur ? <Bandeau type="erreur" texte={erreur} /> : <Squelette hauteur={260} />}
      </Ecran>
    );
  }

  const n = NIVEAUX_INONDATION[s.niveau];
  const estAuteur = s.auteur.id === utilisateur?.id;
  const peutVerifier = ['AUTORITE', 'ADMIN', 'SECOURISTE'].includes(utilisateur?.role ?? '');
  const ouvert = s.statut === 'EN_ATTENTE' || s.statut === 'CONFIRME';

  return (
    <Ecran enTeteSysteme>
      {erreur ? <Bandeau type="erreur" texte={erreur} /> : null}
      {info ? <Bandeau type="succes" icone={CircleCheck} texte={info} /> : null}

      <Carte accent={n.couleur}>
        <View style={ui.entre}>
          <PastilleNiveau s={n} libelle={`Niveau ${n.libelle.toLowerCase()}`} />
          <PastilleNiveau s={STATUTS_SIGNALEMENT[s.statut]} />
        </View>
        <Texte variante="corps" style={{ marginVertical: espace.m }}>
          {s.description}
        </Texte>
        {s.photoUrl ? <Image source={{ uri: s.photoUrl }} style={styles.photo} accessibilityLabel="Photo du signalement" /> : null}
        <Info icone={MapPin} texte={[s.commune, s.zone?.nom].filter(Boolean).join(' · ') || 'Lieu non précisé'} />
        <Info icone={Clock} texte={ilYa(s.createdAt)} />
        <Info icone={User} texte={`Signalé par ${s.auteur.nom}`} />
        <Info icone={Eye} texte={`${s._count.confirmations} habitant(s) confirment`} />
        {s.zone ? (
          <View style={{ marginTop: espace.sm }}>
            <PastilleNiveau s={NIVEAUX_RISQUE[s.zone.niveau]} />
          </View>
        ) : null}
      </Carte>

      {peutVerifier && s.analyseIa ? (
        <Carte style={{ backgroundColor: couleurs.primaireTresDoux, borderColor: couleurs.primaireDoux }}>
          <View style={[ui.ligne, { marginBottom: espace.s }]}>
            <Sparkles size={18} color={couleurs.primaire} />
            <Texte variante="titre3">Analyse IA</Texte>
          </View>
          <Texte variante="corps">{s.analyseIa.resume}</Texte>
          <View style={[ui.ligne, { flexWrap: 'wrap', marginTop: espace.sm }]}>
            <PastilleNiveau s={NIVEAUX_INONDATION[s.analyseIa.graviteEstimee]} libelle={`Gravité ${NIVEAUX_INONDATION[s.analyseIa.graviteEstimee].libelle.toLowerCase()}`} />
            <Texte variante="petitGras" couleur={couleurs.texteSecondaire}>
              Crédibilité {Math.round(s.analyseIa.credibilite * 100)} %
            </Texte>
          </View>
          {s.analyseIa.besoinSecours ? (
            <View style={[ui.ligne, { marginTop: espace.sm }]}>
              <TriangleExclamationPoint size={18} color={couleurs.eleve} />
              <Texte variante="petitGras" couleur={couleurs.eleve}>
                Besoin de secours probable
              </Texte>
            </View>
          ) : null}
        </Carte>
      ) : null}

      {!estAuteur && ouvert ? (
        <Bouton
          libelle="Je vois aussi l'eau ici"
          icone={Eye}
          variante="secondaire"
          chargement={action === 'confirmer'}
          onPress={() => agir('confirmer', () => api.confirmer(s.id), 'Merci, votre confirmation aide les secours (+2 points).')}
        />
      ) : null}

      {peutVerifier && s.statut === 'EN_ATTENTE' ? (
        <View style={[ui.ligne, { marginTop: espace.s }]}>
          <Bouton
            libelle="Confirmer"
            icone={CircleCheck}
            style={{ flex: 1 }}
            chargement={action === 'CONFIRME'}
            onPress={() => agir('CONFIRME', () => api.changerStatutSignalement(s.id, 'CONFIRME'), 'Signalement confirmé.')}
          />
          <Bouton
            libelle="Rejeter"
            icone={X}
            variante="contour"
            style={{ flex: 1 }}
            chargement={action === 'REJETE'}
            onPress={() => agir('REJETE', () => api.changerStatutSignalement(s.id, 'REJETE'), 'Signalement rejeté.')}
          />
        </View>
      ) : null}
      {peutVerifier && s.statut === 'CONFIRME' ? (
        <Bouton
          libelle="L'eau a baissé : marquer résolu"
          icone={ShieldCheck}
          variante="contour"
          chargement={action === 'RESOLU'}
          onPress={() => agir('RESOLU', () => api.changerStatutSignalement(s.id, 'RESOLU'), 'Signalement résolu.')}
        />
      ) : null}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', height: 220, borderRadius: rayon.m, marginBottom: espace.sm },
});
