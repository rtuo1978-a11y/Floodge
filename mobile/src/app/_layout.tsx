import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../lib/auth';
import { activerNotifications, useEcouteNotifications } from '../lib/notifications';
import { couleurs } from '../theme';

function Navigation() {
  const { utilisateur, chargement } = useAuth();
  const connecte = !!utilisateur;

  useEcouteNotifications(connecte);
  useEffect(() => {
    if (connecte) void activerNotifications();
  }, [connecte]);

  if (chargement) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={couleurs.primaire} />
      </View>
    );
  }

  const role = utilisateur?.role;
  return (
    <Stack screenOptions={{ headerTintColor: couleurs.primaire, headerBackTitle: 'Retour' }}>
      <Stack.Protected guard={connecte}>
        <Stack.Screen name="(onglets)" options={{ headerShown: false }} />
        <Stack.Screen name="sos" options={{ title: 'Alerte secours', presentation: 'modal' }} />
        <Stack.Screen name="signalement/[id]" options={{ title: 'Signalement' }} />
        <Stack.Screen name="assistant" options={{ title: 'Assistant Floodge' }} />
        <Stack.Protected guard={role === 'AUTORITE' || role === 'ADMIN'}>
          <Stack.Screen name="autorite" options={{ title: 'Espace autorités' }} />
        </Stack.Protected>
        <Stack.Protected guard={role === 'SECOURISTE' || role === 'AUTORITE' || role === 'ADMIN'}>
          <Stack.Screen name="secours" options={{ title: 'Espace secours' }} />
        </Stack.Protected>
      </Stack.Protected>
      <Stack.Protected guard={!connecte}>
        <Stack.Screen name="connexion" options={{ headerShown: false }} />
        <Stack.Screen name="inscription" options={{ title: 'Créer un compte' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Navigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
