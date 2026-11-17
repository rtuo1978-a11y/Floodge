import { useFocusEffect, useRouter } from 'expo-router';
import { Bot, CircleCheck, Eye, FileCheck, Megaphone, Send, TriangleExclamationPoint, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Apparition } from '../components/anim';
import { haptique } from '../lib/haptique';
import { Bandeau, Bouton, Carte, Ecran, EnTeteSection, EtatVide, PastilleNiveau, Squelette, styles as ui, Texte } from '../components/ui';
import { api } from '../lib/api';
import { ilYa, NIVEAUX_ALERTE, NIVEAUX_INONDATION } from '../lib/format';
import type { Alerte, Signalement } from '../lib/types';
import { couleurs, espace } from '../theme';

/** Espace autorités : valider les alertes proposées et vérifier les signalements. */
export default function AutoriteEcran() {
  const router = useRouter();
  const [brouillons, setBrouillons] = useState<Alerte[] | null>(null);
  const [enAttente, setEnAttente] = useState<Signalement[]>([]);
  const [chargement, setChargement] = useState(false);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [message, setMessage] = useState<{ texte: string; type: 'succes' | 'erreur' } | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const [b, s] = await Promise.all([api.brouillons(), api.signalements({ statut: 'EN_ATTENTE', heures: 72 })]);
      setBrouillons(b);
      setEnAttente(s);
    } catch (e) {
      setMessage({ texte: (e as Error).message, type: 'erreur' });
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void charger();
    }, [charger]),
  );

  async function publier(a: Alerte) {
    setEnCours(a.id);
    try {
      const r = await api.publierAlerte(a.id);
      haptique.succes();
      setMessage({ texte: `Alerte publiée et envoyée à ${r.destinataires} téléphone(s).`, type: 'succes' });
      await charger();
    } catch (e) {
      setMessage({ texte: (e as Error).message, type: 'erreur' });
    } finally {
      setEnCours(null);
    }
  }

  async function archiver(a: Alerte) {
    await api.archiverAlerte(a.id).catch(() => null);
    await charger();
  }

  return (
    <Ecran enTeteSysteme onRafraichir={charger} rafraichissement={chargement && !!brouillons}>
      {message ? <Bandeau type={message.type} icone={message.type === 'succes' ? CircleCheck : undefined} texte={message.texte} /> : null}

      <View style={{ flexDirection: 'row', gap: espace.sm }}>
        {[
          { icone: Megaphone, valeur: brouillons?.length ?? '—', libelle: 'alertes à valider' },
          { icone: FileCheck, valeur: enAttente.length, libelle: 'signalements à vérifier' },
        ].map((s) => (
          <Carte key={s.libelle} style={{ flex: 1, marginBottom: 0 }}>
            <s.icone size={20} color={couleurs.primaire} />
            <Texte variante="titre1" style={{ marginTop: espace.xs }}>
              {String(s.valeur)}
            </Texte>
            <Texte variante="petit" couleur={couleurs.texteSecondaire}>
              {s.libelle}
            </Texte>
          </Carte>
        ))}
      </View>

      <EnTeteSection titre="Alertes à valider" />
      {!brouillons ? <Squelette hauteur={160} /> : null}
      {brouillons && !brouillons.length ? (
        <Carte>
          <EtatVide
            icone={Megaphone}
            titre="Aucune alerte en attente"
            texte="Les alertes proposées par le moteur de règles apparaîtront ici."
          />
        </Carte>
      ) : null}
      {brouillons?.map((a, i) => (
        <Apparition key={a.id} index={i}>
          <Carte accent={NIVEAUX_ALERTE[a.niveau].couleur}>
            <View style={ui.entre}>
              <PastilleNiveau s={NIVEAUX_ALERTE[a.niveau]} />
              <Texte variante="petit" couleur={couleurs.texteSecondaire}>
                {ilYa(a.createdAt)}
              </Texte>
            </View>
            {a.origine === 'AUTOMATIQUE' ? (
              <View style={[ui.ligne, { marginTop: espace.s }]}>
                <Bot size={16} color={couleurs.primaire} />
                <Texte variante="petitGras" couleur={couleurs.primaire}>
                  Proposée automatiquement — à vérifier sur le terrain
                </Texte>
              </View>
            ) : null}
            <Texte variante="titre3" style={{ marginTop: espace.s }}>
              {a.titre}
            </Texte>
            <Texte variante="corps" couleur={couleurs.texteSecondaire} style={{ marginTop: espace.xs }}>
              {a.message}
            </Texte>
            <View style={[ui.ligne, { marginTop: espace.sm }]}>
              <Bouton libelle="Publier" icone={Send} petit onPress={() => publier(a)} chargement={enCours === a.id} style={{ flex: 1 }} />
              <Bouton libelle="Écarter" icone={X} variante="contour" petit onPress={() => archiver(a)} style={{ flex: 1 }} />
            </View>
          </Carte>
        </Apparition>
      ))}

      <EnTeteSection titre="Signalements à vérifier" />
      {brouillons && !enAttente.length ? (
        <Carte>
          <EtatVide icone={FileCheck} titre="Tout est vérifié" />
        </Carte>
      ) : null}
      {enAttente.map((s, i) => (
        <Apparition key={s.id} index={i}>
          <Carte onPress={() => router.push(`/signalement/${s.id}`)} accent={NIVEAUX_INONDATION[s.niveau].couleur}>
            <View style={ui.entre}>
              <PastilleNiveau s={NIVEAUX_INONDATION[s.niveau]} />
              <Texte variante="petit" couleur={couleurs.texteSecondaire}>
                {ilYa(s.createdAt)}
              </Texte>
            </View>
            <Texte variante="corps" style={{ marginTop: espace.s }} numberOfLines={2}>
              {s.description}
            </Texte>
            <View style={[ui.ligne, { marginTop: espace.s, flexWrap: 'wrap' }]}>
              <Texte variante="petit" couleur={couleurs.texteSecondaire}>
                {s.commune ?? 'Commune inconnue'}
              </Texte>
              <Eye size={14} color={couleurs.texteSecondaire} />
              <Texte variante="petit" couleur={couleurs.texteSecondaire}>
                {s._count.confirmations}
              </Texte>
              {s.analyseIa?.besoinSecours ? (
                <>
                  <TriangleExclamationPoint size={14} color={couleurs.eleve} />
                  <Texte variante="petitGras" couleur={couleurs.eleve}>
                    secours
                  </Texte>
                </>
              ) : null}
            </View>
          </Carte>
        </Apparition>
      ))}
    </Ecran>
  );
}
