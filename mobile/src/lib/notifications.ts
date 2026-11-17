import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { api } from './api';
import { lire } from './voix';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Enregistre le téléphone pour les notifications push et envoie le jeton au back-end.
 * ⚠️ Les notifications push ne fonctionnent pas dans Expo Go sur Android :
 * il faut un « development build » (voir README). L'application fonctionne quand même
 * (les alertes sont rechargées régulièrement dans l'onglet Alertes).
 */
export async function activerNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Informations',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      await Notifications.setNotificationChannelAsync('alertes-urgentes', {
        name: 'Alertes inondation',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#D32F2F',
      });
    }
    const { status: actuel } = await Notifications.getPermissionsAsync();
    const status = actuel === 'granted' ? actuel : (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) return null;
    const { data: jeton } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.majProfil({ pushToken: jeton });
    return jeton;
  } catch (e) {
    console.warn('Notifications push indisponibles :', (e as Error).message);
    return null;
  }
}

type DonneesNotif = { type?: string; alerteId?: string; texteVocal?: string; demandeId?: string };

/** Écoute les notifications : lecture vocale des alertes, ouverture de l'écran concerné au toucher. */
export function useEcouteNotifications(actif: boolean) {
  useEffect(() => {
    if (!actif) return;
    const recue = Notifications.addNotificationReceivedListener((n) => {
      const d = n.request.content.data as DonneesNotif;
      if (d?.type === 'alerte' && d.texteVocal) void lire(d.texteVocal);
    });
    const touchee = Notifications.addNotificationResponseReceivedListener((r) => {
      const d = r.notification.request.content.data as DonneesNotif;
      if (d?.type === 'alerte') router.push('/alertes');
      else if (d?.type === 'alerte_a_verifier') router.push('/autorite');
      else if (d?.type === 'secours') router.push('/secours');
    });
    return () => {
      recue.remove();
      touchee.remove();
    };
  }, [actif]);
}
