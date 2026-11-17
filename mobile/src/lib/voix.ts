import * as Speech from 'expo-speech';
import type { Alerte } from './types';

/** Lit un texte à voix haute en français (alerte vocale). */
export async function lire(texte: string) {
  await Speech.stop();
  Speech.speak(texte, { language: 'fr-FR', rate: 0.95 });
}

export const arreterLecture = () => Speech.stop();

export function texteAlerte(a: Pick<Alerte, 'texteVocal' | 'titre' | 'message'>) {
  return a.texteVocal ?? `Alerte Floodge. ${a.titre}. ${a.message}`;
}
