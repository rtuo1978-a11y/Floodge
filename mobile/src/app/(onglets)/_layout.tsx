import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { couleurs } from '../../theme';

// Icônes provisoires (emoji) — à remplacer par le jeu d'icônes des maquettes UI/UX
const icone = (symbole: string) =>
  function Icone({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{symbole}</Text>;
  };

export default function OngletsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: couleurs.primaire,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Carte', tabBarIcon: icone('🗺️') }} />
      <Tabs.Screen name="alertes" options={{ title: 'Alertes', tabBarIcon: icone('🔔') }} />
      <Tabs.Screen name="signaler" options={{ title: 'Signaler', tabBarIcon: icone('➕') }} />
      <Tabs.Screen name="conseils" options={{ title: 'Conseils', tabBarIcon: icone('💡') }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: icone('👤') }} />
    </Tabs>
  );
}
