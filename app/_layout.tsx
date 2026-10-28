// ============================================
// BEŞLİ PATRON — app/_layout.tsx
// Kök düzen: yazı tipleri, ses, reklam, oyun durumu, üst bilgi çubuğu
// ============================================
import '../utils/hataYakala';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { GameProvider } from '../context/GameContext';
import { Colors } from '../constants/colors';
import Ogretici from '../components/Ogretici';
import OyunHUD from '../components/OyunHUD';
import OlayModal from '../components/OlayModal';
import { sesBaslat } from '../services/soundManager';
import { reklamlariBaslat } from '../services/adManager';

enableScreens(false);
SplashScreen.preventAutoHideAsync();

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: '' };

  static getDerivedStateFromError(hata: any) {
    return { hasError: true, error: hata?.message ?? 'Bilinmeyen hata' };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Hata Olustu</Text>
        <Text style={styles.message}>{this.state.error}</Text>
      </View>
    );
  }
}

export default function RootLayout() {
  const [fontlarHazir, fontHatasi] = useFonts({
    SpaceMono: SpaceMono_400Regular,
    SpaceMonoBold: SpaceMono_700Bold,
  });

  useEffect(() => {
    const zamanlayici = setTimeout(() => SplashScreen.hideAsync(), 3000);
    if (fontlarHazir || fontHatasi) {
      SplashScreen.hideAsync();
      clearTimeout(zamanlayici);
    }
    return () => clearTimeout(zamanlayici);
  }, [fontlarHazir, fontHatasi]);

  useEffect(() => {
    sesBaslat();
    reklamlariBaslat();
  }, []);

  if (!fontlarHazir && !fontHatasi) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GameProvider>
          <StatusBar style="light" />
          <View style={{ flex: 1, backgroundColor: Colors.background }}>
            <OyunHUD />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="intro" />
              <Stack.Screen name="tabs" />
              <Stack.Screen name="gameover" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </View>
          <OlayModal />
          <Ogretici />
        </GameProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  title: { fontSize: 22, color: Colors.danger, fontWeight: 'bold', marginBottom: 12 },
  message: { fontSize: 14, color: Colors.textPrimary, textAlign: 'center' },
});
