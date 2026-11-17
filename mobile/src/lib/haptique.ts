import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Retours haptiques (vibrations courtes) : confirment une action sans avoir à regarder l'écran.
 * Sans effet dans le navigateur.
 */
const actif = Platform.OS === 'ios' || Platform.OS === 'android';
const silencieux = () => undefined;

export const haptique = {
  /** Changement de sélection (niveau, filtre, onglet) */
  selection: () => (actif ? Haptics.selectionAsync().catch(silencieux) : undefined),
  /** Appui sur une action importante */
  appui: () => (actif ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(silencieux) : undefined),
  /** Action réussie (signalement envoyé, SOS envoyé) */
  succes: () => (actif ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(silencieux) : undefined),
  /** Erreur */
  erreur: () => (actif ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(silencieux) : undefined),
  /** Déclenchement du SOS */
  fort: () => (actif ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(silencieux) : undefined),
};
