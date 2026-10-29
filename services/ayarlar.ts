// ============================================
// SAHA BİZİM — services/ayarlar.ts
// Oyun dışı tercihler: dil, müzik, ses efektleri (cihazda saklanır)
// ============================================
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Dil = 'tr' | 'en';
export type Ayarlar = { dil: Dil; muzik: boolean; efekt: boolean; muzikSes: number };

const ANAHTAR = 'sahabizim_ayarlar_v1';

function cihazDili(): Dil {
  try {
    const yer =
      Platform.OS === 'web' && typeof navigator !== 'undefined'
        ? navigator.language
        : Intl.DateTimeFormat().resolvedOptions().locale;
    return (yer || 'tr').toLowerCase().startsWith('tr') ? 'tr' : 'en';
  } catch {
    return 'tr';
  }
}

let ayar: Ayarlar = { dil: cihazDili(), muzik: true, efekt: true, muzikSes: 0.5 };
let yuklendi = false;
const dinleyiciler = new Set<(a: Ayarlar) => void>();

export function ayarlar(): Ayarlar {
  return ayar;
}

export async function ayarlariYukle(): Promise<Ayarlar> {
  if (yuklendi) return ayar;
  yuklendi = true;
  try {
    const ham = await AsyncStorage.getItem(ANAHTAR);
    if (ham) ayar = { ...ayar, ...JSON.parse(ham) };
  } catch {}
  dinleyiciler.forEach((f) => f(ayar));
  return ayar;
}

export function ayarDegistir(degisim: Partial<Ayarlar>) {
  ayar = { ...ayar, ...degisim };
  AsyncStorage.setItem(ANAHTAR, JSON.stringify(ayar)).catch(() => {});
  dinleyiciler.forEach((f) => f(ayar));
}

export function ayarDinle(f: (a: Ayarlar) => void): () => void {
  dinleyiciler.add(f);
  return () => {
    dinleyiciler.delete(f);
  };
}

export function useAyarlar(): Ayarlar {
  const [a, setA] = useState(ayar);
  useEffect(() => ayarDinle(setA), []);
  return a;
}
