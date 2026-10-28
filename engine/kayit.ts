// ============================================
// SAHA BİZİM — engine/kayit.ts
// Kayıt/yükleme ve eski "Beşli Patron" kaydından geçiş
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OyunDurumu } from './tipler';
import * as M from './motor';

const ANAHTAR = 'sahabizim_kayit_v1';
const ESKI_ANAHTAR = 'beslipatron_save';
const GECIS_ANAHTAR = 'sahabizim_eski_gecis';

export async function yukle(): Promise<OyunDurumu | null> {
  try {
    const ham = await AsyncStorage.getItem(ANAHTAR);
    if (!ham) return null;
    const s = JSON.parse(ham) as OyunDurumu;
    if (!s || typeof s !== 'object' || !s.sehirId) return null;
    return tamamla(s);
  } catch {
    return null;
  }
}

/** İleride eklenen alanlar eski kayıtlarda eksik olabilir: varsayılanlarla tamamla */
function tamamla(s: OyunDurumu): OyunDurumu {
  const bos = M.yeniOyun(s.sehirSira ?? 0);
  const birlesik = { ...bos, ...s } as OyunDurumu;
  birlesik.istatistik = { ...bos.istatistik, ...(s.istatistik ?? {}) };
  birlesik.personel = { ...bos.personel, ...(s.personel ?? {}) };
  birlesik.bekleyenOlaylar = [];
  birlesik.canliAn = null;
  birlesik.duraklat = false;
  return birlesik;
}

let bekleyen: ReturnType<typeof setTimeout> | null = null;
export function kaydet(s: OyunDurumu, hemen = false) {
  const yaz = () => {
    bekleyen = null;
    AsyncStorage.setItem(ANAHTAR, JSON.stringify(s)).catch(() => {});
  };
  if (bekleyen) clearTimeout(bekleyen);
  if (hemen) yaz();
  else bekleyen = setTimeout(yaz, 800);
}

export async function sil() {
  try {
    await AsyncStorage.removeItem(ANAHTAR);
  } catch {}
}

/** Beşli Patron oyuncularına bir kerelik hoş geldin hediyesi */
export async function eskiOyuncuHediyesi(): Promise<{ nakit: number; itibar: number } | null> {
  try {
    if (await AsyncStorage.getItem(GECIS_ANAHTAR)) return null;
    const ham = await AsyncStorage.getItem(ESKI_ANAHTAR);
    await AsyncStorage.setItem(GECIS_ANAHTAR, '1');
    if (!ham) return null;
    return M.eskiKayittanHediye(JSON.parse(ham));
  } catch {
    return null;
  }
}
