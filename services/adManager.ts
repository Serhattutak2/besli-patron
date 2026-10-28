// ============================================
// BEŞLİ PATRON — services/adManager.ts
// Reklamlar (App Store'daki sürümün birebir davranışı)
// NOT: Bu sürümde geçiş reklamı kapalı, tek ödüllü reklam kimliği var.
// ============================================
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';

const ODULLU_REKLAM_ID = 'ca-app-pub-4873666267587702/1435662670';

export async function reklamlariBaslat(): Promise<void> {}

export function gecisReklamGoster(): boolean {
  return false;
}

export async function gunSonuReklamKontrol(): Promise<void> {}

// Ödüllü reklamı yükler ve gösterir; ödül kazanıldıysa true döner
export function odulluReklamIzle(): Promise<boolean> {
  return new Promise((resolve) => {
    const reklam = RewardedAd.createForAdRequest(ODULLU_REKLAM_ID);
    let odulKazanildi = false;
    let bitti = false;

    const temizle = () => {
      kaldirYuklendi();
      kaldirOdul();
      kaldirKapandi();
      kaldirHata();
    };
    const bitir = (sonuc: boolean) => {
      if (bitti) return;
      bitti = true;
      temizle();
      resolve(sonuc);
    };

    const kaldirYuklendi = reklam.addAdEventListener(RewardedAdEventType.LOADED, () => {
      reklam.show();
    });
    const kaldirOdul = reklam.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      odulKazanildi = true;
    });
    const kaldirKapandi = reklam.addAdEventListener(AdEventType.CLOSED, () => {
      bitir(odulKazanildi);
    });
    const kaldirHata = reklam.addAdEventListener(AdEventType.ERROR, (hata) => {
      console.log('Rewarded reklam hatasi:', hata);
      bitir(false);
    });

    try {
      reklam.load();
    } catch (e) {
      console.log('Rewarded reklam yuklenemedi:', e);
      bitir(false);
    }
  });
}
