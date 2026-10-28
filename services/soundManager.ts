// ============================================
// BEŞLİ PATRON — services/soundManager.ts
// Arka plan müziği ve kısa efektler (tık, para, alkış)
// ============================================
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSIZ_KEY = 'besli_patron_sessiz';

const TIK = require('../assets/sounds/freesound_community-ui-click-43196.mp3');
const PARA = require('../assets/sounds/freesound_community-coin-spill-105867.mp3');
const ALKIS = require('../assets/sounds/gregorquendel-free-crowd-cheering-sounds-04-strong-cheering-ii-short-116191.mp3');
const MUZIK = require('../assets/sounds/attic13-ukulele-chords-c-minor-120-bpm-152521.mp3');

type SesAdi = 'tik' | 'para' | 'alkis';

let muzik: Audio.Sound | null = null;
const efektler: Record<SesAdi, Audio.Sound | null> = { tik: null, para: null, alkis: null };
let sessiz = false;
let baslatildi = false;

async function guvenliYukle(kaynak: any, ses: number, dongu = false): Promise<Audio.Sound | null> {
  try {
    const { sound } = await Audio.Sound.createAsync(kaynak, { volume: ses, isLooping: dongu });
    return sound;
  } catch {
    return null;
  }
}

export async function sesBaslat(): Promise<void> {
  if (baslatildi) return;
  baslatildi = true;
  try {
    sessiz = (await AsyncStorage.getItem(SESSIZ_KEY)) === 'evet';
  } catch {}
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch {}
  efektler.tik = await guvenliYukle(TIK, 0.5);
  efektler.para = await guvenliYukle(PARA, 0.8);
  efektler.alkis = await guvenliYukle(ALKIS, 0.9);
  if (!sessiz) await muzikBaslat();
}

export function sfx(ad: SesAdi): void {
  if (sessiz) return;
  const s = efektler[ad];
  if (!s) return;
  s.replayAsync().catch(() => {});
}

export async function muzikBaslat(): Promise<void> {
  try {
    if (!muzik) muzik = await guvenliYukle(MUZIK, 0.3, true);
    if (muzik) {
      const durum: any = await muzik.getStatusAsync();
      if (!durum?.isPlaying) await muzik.playAsync();
    }
  } catch {}
}

export async function muzikDurdur(): Promise<void> {
  try {
    if (muzik) await muzik.pauseAsync();
  } catch {}
}

// Sesi açıp kapatır; yeni "sessiz" durumunu döner
export async function sesAcKapa(): Promise<boolean> {
  sessiz = !sessiz;
  try {
    await AsyncStorage.setItem(SESSIZ_KEY, sessiz ? 'evet' : 'hayir');
  } catch {}
  if (sessiz) await muzikDurdur();
  else await muzikBaslat();
  return sessiz;
}

export function sesSessizMi(): boolean {
  return sessiz;
}
