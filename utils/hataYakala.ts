// ============================================
// BEŞLİ PATRON — utils/hataYakala.ts
// Yakalanmayan JS hatalarını panoya ve cihaza yazar (geliştirme dönemi aracı)
// NOT: Yayındaki sürümde her açılışta panoya "BELIPATRON-OK ..." yazıyordu.
// ============================================
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SON_HATA_KEY = 'belipatron_son_js_hata';
const GELISTIRME = !!(globalThis as any).__DEV__;

function raporla(hata: any, olumcul: boolean): string {
  const mesaj = String((hata && hata.message) || hata || 'bilinmeyen');
  const yigin = String((hata && hata.stack) || '');
  const tur = olumcul ? 'olumsuz' : 'kurtarilabilir';
  return `BELIPATRON-HATA(${tur} @ ${new Date().toISOString()})\nMESAJ: ${mesaj}\nYIGIN: ${yigin.slice(0, 1200)}`;
}

const g: any = globalThis as any;
const oncekiIsleyici =
  typeof g.ErrorUtils?.getGlobalHandler === 'function' ? g.ErrorUtils.getGlobalHandler() : null;

if (g.ErrorUtils != null && g.ErrorUtils.setGlobalHandler != null) {
  g.ErrorUtils.setGlobalHandler((hata: any, olumcul?: boolean) => {
    const metin = raporla(hata, !!olumcul);
    try {
      Clipboard.setStringAsync(metin).catch(() => {});
    } catch {}
    AsyncStorage.setItem(SON_HATA_KEY, metin).catch(() => {});
    if (GELISTIRME && oncekiIsleyici) {
      try {
        oncekiIsleyici(hata, olumcul);
      } catch {}
    }
  });
}

setTimeout(async () => {
  try {
    const onceki = await AsyncStorage.getItem(SON_HATA_KEY);
    if (!onceki) {
      await Clipboard.setStringAsync('BELIPATRON-OK ' + new Date().toISOString());
      return;
    }
    await AsyncStorage.removeItem(SON_HATA_KEY);
    await Clipboard.setStringAsync('ONCEKI OTURUMDAN >>> ' + onceki);
  } catch {}
}, 2000);

export {};
