// ============================================
// BEŞLİ PATRON — services/tani.ts
// Tanı kayıtları: son hata + son 60 işlem günlüğü (Profil > Tanı ile okunur)
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const SON_HATA_KEY = 'besli_patron_son_hata';
const GUNLUK_KEY = 'besli_patron_islem_gunlugu';
const ESKI_HATA_KEY = 'besli_patron_son_hata_eski';
const GUNLUK_SINIRI = 60;

const gunluk: string[] = [];
let yaziliyor = false;
let sayac = 0;
let yuklendi = false;

function damga(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// Kullanıcı işlemlerini sırayla kaydeder (2 sn'de bir diske yazılır)
export function islemKaydet(mesaj: string): void {
  sayac += 1;
  gunluk.push(`#${sayac} ${damga()} ${mesaj}`);
  if (gunluk.length > GUNLUK_SINIRI) gunluk.shift();
  if (!yaziliyor && yuklendi) {
    yaziliyor = true;
    setTimeout(() => {
      yaziliyor = false;
      AsyncStorage.setItem(GUNLUK_KEY, gunluk.join('\n')).catch(() => {});
    }, 2000);
  }
}

export async function sonHataKaydet(kaynak: string, hata: unknown): Promise<void> {
  try {
    const metin =
      hata instanceof Error ? `${hata.name}: ${hata.message}\n${hata.stack ?? ''}` : String(hata);
    const onceki = await AsyncStorage.getItem(SON_HATA_KEY);
    if (onceki) await AsyncStorage.setItem(ESKI_HATA_KEY, onceki);
    await AsyncStorage.setItem(
      SON_HATA_KEY,
      `KAYNAK: ${kaynak}\nZAMAN: ${new Date().toISOString()}\nSON ISLEMLER: ${gunluk
        .slice(-8)
        .join(' | ')}\n\n${metin.slice(0, 4000)}`,
    );
  } catch {}
}

export async function taniOku(): Promise<string> {
  try {
    const son = (await AsyncStorage.getItem(SON_HATA_KEY)) ?? '(hata kaydi yok)';
    const eski = await AsyncStorage.getItem(ESKI_HATA_KEY);
    const islemler = (await AsyncStorage.getItem(GUNLUK_KEY)) ?? '(islem gunlugu yok)';
    const eskiBolum = eski ? `\n\n===== ONCEKI HATA =====\n${eski}` : '';
    return `===== SON HATA =====\n${son}${eskiBolum}\n\n===== SON ISLEMLER =====\n${islemler}`;
  } catch {
    return 'Tani kayitlari okunamadi';
  }
}

// Önceki oturumun günlüğünü belleğe al
(async () => {
  try {
    const ham = await AsyncStorage.getItem(GUNLUK_KEY);
    if (ham) {
      for (const satir of ham.split('\n')) gunluk.push(satir);
      while (gunluk.length > GUNLUK_SINIRI) gunluk.shift();
    }
  } catch {}
  yuklendi = true;
})();

// Yakalanmayan hataları ve reddedilen promise'leri kaydet
(function taniKur() {
  try {
    const g: any = globalThis as any;
    const onceki = g.ErrorUtils?.getGlobalHandler?.();
    if (g.ErrorUtils?.setGlobalHandler != null) {
      g.ErrorUtils.setGlobalHandler((hata: unknown, olumcul?: boolean) => {
        sonHataKaydet(olumcul ? 'ErrorUtils(fatal)' : 'ErrorUtils', hata);
        try {
          if (onceki != null) onceki(hata, olumcul);
        } catch {}
      });
    }
  } catch {}
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const izleme = require('promise/setimmediate/rejection-tracking');
    izleme.enable({
      onUnhandled: (_id: number, hata: unknown) => {
        sonHataKaydet('UnhandledRejection', hata);
      },
    });
  } catch {}
})();
