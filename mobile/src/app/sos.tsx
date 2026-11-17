import { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Bouton, Carte, Champ, Ecran, Message, SousTitre, styles } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { ilYa, STATUTS_SECOURS } from '../lib/format';
import { positionActuelle } from '../lib/position';
import type { DemandeSecours } from '../lib/types';
import { couleurs, espace, police } from '../theme';

const NUMEROS = [
  { libelle: 'Sapeurs-pompiers', numero: '180' },
  { libelle: 'SAMU', numero: '185' },
  { libelle: 'Police secours', numero: '110' },
];

export default function SosEcran() {
  const { utilisateur } = useAuth();
  const [nbPersonnes, setNbPersonnes] = useState('1');
  const [description, setDescription] = useState('');
  const [telephone, setTelephone] = useState(utilisateur?.telephone ?? '');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [demandes, setDemandes] = useState<DemandeSecours[]>([]);

  const charger = () => api.mesDemandesSecours().then(setDemandes).catch(() => null);
  useEffect(() => {
    void charger();
  }, []);

  async function envoyer() {
    setEnvoi(true);
    setErreur(null);
    try {
      const pos = await positionActuelle();
      if (!pos) throw new Error('Position indisponible : autorisez la localisation, ou appelez le 180.');
      await api.sos({
        ...pos,
        nbPersonnes: Math.max(1, Number.parseInt(nbPersonnes, 10) || 1),
        description: description.trim() || undefined,
        telephone: telephone.trim() || undefined,
      });
      await charger();
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }

  const enCours = demandes.find((d) => d.statut === 'EN_ATTENTE' || d.statut === 'PRISE_EN_CHARGE');

  return (
    <Ecran>
      {erreur ? <Message type="erreur" texte={erreur} /> : null}

      {enCours ? (
        <Carte style={{ borderColor: couleurs.sos, borderWidth: 2 }}>
          <Text style={[styles.texte, { fontWeight: '700', fontSize: police.moyenne }]}>
            {enCours.statut === 'PRISE_EN_CHARGE' ? '🚑 Les secours arrivent' : '⏳ Demande envoyée'}
          </Text>
          <Text style={styles.texte}>
            {STATUTS_SECOURS[enCours.statut]} · {ilYa(enCours.createdAt)}
            {enCours.secouriste ? ` · ${enCours.secouriste.nom}` : ''}
          </Text>
          <Text style={[styles.texte, { marginTop: espace.s }]}>
            Restez en hauteur, gardez votre téléphone allumé et joignable.
          </Text>
          {enCours.statut === 'EN_ATTENTE' ? (
            <Bouton
              libelle="Annuler la demande"
              variante="discret"
              onPress={async () => {
                await api.majSecours(enCours.id, 'ANNULEE').catch((e: Error) => setErreur(e.message));
                await charger();
              }}
            />
          ) : null}
        </Carte>
      ) : (
        <>
          <Text style={[styles.texte, { marginBottom: espace.m }]}>
            Votre position sera envoyée aux équipes de secours. N'utilisez ce bouton que si des personnes sont en danger.
          </Text>
          <Champ libelle="Nombre de personnes" value={nbPersonnes} onChangeText={setNbPersonnes} keyboardType="number-pad" />
          <Champ
            libelle="Situation (facultatif)"
            value={description}
            onChangeText={setDescription}
            placeholder="Ex. : bloqués au 1er étage, une personne âgée"
          />
          <Champ libelle="Téléphone pour vous joindre" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
          <Pressable
            onPress={envoyer}
            disabled={envoi}
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: couleurs.sos,
              borderRadius: 100,
              width: 180,
              height: 180,
              alignSelf: 'center',
              alignItems: 'center',
              justifyContent: 'center',
              marginVertical: espace.l,
              opacity: pressed || envoi ? 0.8 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontSize: 40, fontWeight: '900' }}>{envoi ? '…' : 'SOS'}</Text>
            <Text style={{ color: '#fff' }}>Demander du secours</Text>
          </Pressable>
        </>
      )}

      <SousTitre>Numéros d'urgence</SousTitre>
      <View style={styles.ligne}>
        {NUMEROS.map((n) => (
          <Bouton
            key={n.numero}
            libelle={`${n.numero}\n${n.libelle}`}
            variante="secondaire"
            onPress={() => Linking.openURL(`tel:${n.numero}`)}
            style={{ flex: 1, paddingVertical: espace.s }}
          />
        ))}
      </View>
    </Ecran>
  );
}
