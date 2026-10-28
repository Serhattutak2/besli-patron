// ============================================
// SAHA BİZİM — services/reklam.ts (iOS / Android)
// Ödüllü ve geçiş reklamları: SDK başlatma, izin (ATT + onay formu),
// önceden yükleme ve platforma göre doğru reklam birimi.
// ============================================
import { Platform } from 'react-native';
import mobileAds, {
  AdsConsent,
  AdEventType,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import * as Takip from 'expo-tracking-transparency';
import * as K from '../constants/reklamKimlikleri';

const gelistirme = (globalThis as any).__DEV__ === true;
const odulluId = gelistirme ? TestIds.REWARDED : Platform.select({ ios: K.IOS_ODULLU, android: K.ANDROID_ODULLU }) || TestIds.REWARDED;
const gecisId = gelistirme ? TestIds.INTERSTITIAL : Platform.select({ ios: K.IOS_GECIS, android: K.ANDROID_GECIS }) || TestIds.INTERSTITIAL;

let hazir = false;
let kisisellestirmeYok = true;
let odullu: RewardedAd | null = null;
let odulluYuklendi = false;
let gecis: InterstitialAd | null = null;
let gecisYuklendi = false;

export async function reklamlariBaslat(): Promise<void> {
  if (hazir) return;
  try {
    // Avrupa için onay formu (gerekiyorsa gösterilir)
    try {
      await AdsConsent.gatherConsent();
    } catch {}
    // iOS: Apple'ın izin penceresi
    if (Platform.OS === 'ios') {
      try {
        const { status } = await Takip.requestTrackingPermissionsAsync();
        kisisellestirmeYok = status !== 'granted';
      } catch {}
    } else kisisellestirmeYok = false;
    await mobileAds().initialize();
    hazir = true;
    odulluYukle();
    gecisYukle();
  } catch (e) {
    console.log('Reklam başlatılamadı', e);
  }
}

function odulluYukle() {
  try {
    odullu = RewardedAd.createForAdRequest(odulluId, { requestNonPersonalizedAdsOnly: kisisellestirmeYok });
    odulluYuklendi = false;
    odullu.addAdEventListener(RewardedAdEventType.LOADED, () => (odulluYuklendi = true));
    odullu.addAdEventListener(AdEventType.ERROR, () => {
      odulluYuklendi = false;
      setTimeout(odulluYukle, 30000);
    });
    odullu.load();
  } catch {}
}
function gecisYukle() {
  try {
    gecis = InterstitialAd.createForAdRequest(gecisId, { requestNonPersonalizedAdsOnly: kisisellestirmeYok });
    gecisYuklendi = false;
    gecis.addAdEventListener(AdEventType.LOADED, () => (gecisYuklendi = true));
    gecis.addAdEventListener(AdEventType.ERROR, () => {
      gecisYuklendi = false;
      setTimeout(gecisYukle, 60000);
    });
    gecis.load();
  } catch {}
}

export function odulluHazirMi(): boolean {
  return hazir && odulluYuklendi;
}

/** Ödüllü reklamı gösterir; izleyici ödülü hak ettiyse true */
export function odulluGoster(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!odullu || !odulluYuklendi) {
      if (hazir) odulluYukle();
      resolve(false);
      return;
    }
    const r = odullu;
    let kazandi = false;
    const k1 = r.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => (kazandi = true));
    const k2 = r.addAdEventListener(AdEventType.CLOSED, () => {
      k1();
      k2();
      odulluYukle();
      resolve(kazandi);
    });
    try {
      r.show();
    } catch {
      k1();
      k2();
      odulluYukle();
      resolve(false);
    }
  });
}

export function gecisGoster(): Promise<void> {
  return new Promise((resolve) => {
    if (!gecis || !gecisYuklendi) {
      resolve();
      return;
    }
    const g = gecis;
    const k = g.addAdEventListener(AdEventType.CLOSED, () => {
      k();
      gecisYukle();
      resolve();
    });
    try {
      g.show();
    } catch {
      k();
      resolve();
    }
  });
}

/** Sadece web önizlemesinde kullanılır */
export function denemeReklamDinle(_d: unknown) {}
