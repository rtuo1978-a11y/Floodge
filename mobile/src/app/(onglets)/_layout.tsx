import { Tabs } from 'expo-router';
import { Bell, Lightbulb, Map, Plus, User, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { couleurs, ombre, polices } from '../../theme';

const icone = (Icone: LucideIcon) =>
  function IconeOnglet({ color, focused }: { color: unknown; focused: boolean }) {
    return <Icone size={24} color={String(color ?? couleurs.texteSecondaire)} strokeWidth={focused ? 2.4 : 1.9} />;
  };

/** Onglet central « Signaler » : bouton rond surélevé, l'action principale de l'app. */
function IconeSignaler({ focused }: { focused: boolean }) {
  return (
    <View
      style={[
        {
          width: 52,
          height: 52,
          borderRadius: 26,
          marginTop: -18,
          backgroundColor: focused ? couleurs.primaireFonce : couleurs.primaire,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 4,
          borderColor: couleurs.surface,
        },
        ombre.moyenne,
      ]}
    >
      <Plus size={26} color={couleurs.surPrimaire} strokeWidth={2.6} />
    </View>
  );
}

export default function OngletsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: couleurs.primaire,
        tabBarInactiveTintColor: couleurs.texteSecondaire,
        tabBarLabelStyle: { fontFamily: polices.texteGras, fontSize: 12 },
        tabBarStyle: { height: 68, paddingTop: 6, paddingBottom: 8, borderTopColor: couleurs.bordure, backgroundColor: couleurs.surface },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Carte', tabBarIcon: icone(Map) }} />
      <Tabs.Screen name="alertes" options={{ title: 'Alertes', tabBarIcon: icone(Bell) }} />
      <Tabs.Screen
        name="signaler"
        options={{ title: 'Signaler', tabBarIcon: IconeSignaler, tabBarAccessibilityLabel: 'Signaler une inondation' }}
      />
      <Tabs.Screen name="conseils" options={{ title: 'Conseils', tabBarIcon: icone(Lightbulb) }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: icone(User) }} />
    </Tabs>
  );
}
