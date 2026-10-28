// ============================================
// BEŞLİ PATRON — app/tabs/_layout.tsx
// Alt sekme çubuğu: 6 ekran
// ============================================
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RENK, FONT } from '../../constants/tema';

type IkonAdi = React.ComponentProps<typeof Ionicons>['name'];

const ikon =
  (dolu: IkonAdi, bos: IkonAdi) =>
  ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? dolu : bos} size={23} color={color} />
  );

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 68,
          backgroundColor: RENK.panel,
          borderTopWidth: 1,
          borderTopColor: RENK.cizgi,
          paddingTop: 5,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: RENK.vurgu,
        tabBarInactiveTintColor: '#CBD5E1',
        tabBarLabelStyle: { fontFamily: FONT.govde, fontSize: 10, fontWeight: '400', marginTop: 1 },
        tabBarItemStyle: { paddingVertical: 0 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="saha" options={{ title: 'Saha', tabBarIcon: ikon('map', 'map-outline') }} />
      <Tabs.Screen name="isletme" options={{ title: 'İşletme', tabBarIcon: ikon('business', 'business-outline') }} />
      <Tabs.Screen
        name="rezervasyonlar"
        options={{ title: 'Rezervasyon', tabBarIcon: ikon('calendar', 'calendar-outline') }}
      />
      <Tabs.Screen name="yasam" options={{ title: 'Yaşam', tabBarIcon: ikon('heart', 'heart-outline') }} />
      <Tabs.Screen name="lig" options={{ title: 'Lig', tabBarIcon: ikon('trophy', 'trophy-outline') }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: ikon('person', 'person-outline') }} />
    </Tabs>
  );
}
