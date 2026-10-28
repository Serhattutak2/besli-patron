// ============================================
// SAHA BİZİM — app/_layout.tsx
// Kök düzen: yazı tipleri, açılış ekranı, oyun durumu
// ============================================
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { OyunProvider } from '../context/OyunContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

class HataSiniri extends React.Component<{ children: React.ReactNode }, { hata: string | null }> {
  state = { hata: null as string | null };
  static getDerivedStateFromError(e: any) {
    return { hata: String(e?.message ?? e) };
  }
  render() {
    if (!this.state.hata) return this.props.children;
    return (
      <View style={st.hata}>
        <Text style={st.hataBaslik}>Bir şeyler ters gitti</Text>
        <Text style={st.hataMetin}>{this.state.hata}</Text>
      </View>
    );
  }
}

export default function KokDuzen() {
  const [hazir, hatali] = useFonts({ Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black });
  useEffect(() => {
    if (hazir || hatali) SplashScreen.hideAsync().catch(() => {});
  }, [hazir, hatali]);
  if (!hazir && !hatali) return null;
  return (
    <HataSiniri>
      <SafeAreaProvider>
        <OyunProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0C1424' } }} />
        </OyunProvider>
      </SafeAreaProvider>
    </HataSiniri>
  );
}

const st = StyleSheet.create({
  hata: { flex: 1, backgroundColor: '#0C1424', alignItems: 'center', justifyContent: 'center', padding: 24 },
  hataBaslik: { color: '#F59E0B', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  hataMetin: { color: '#CBD5E1', textAlign: 'center' },
});
