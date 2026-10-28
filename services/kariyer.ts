// ============================================
// BEŞLİ PATRON — services/kariyer.ts
// Kulüp kariyeri: 8 kademeli lig piramidi, kadro, transfer, sezon geçişi
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { kademeBul, oyuncuDeger, OYUNCU_AD, OYUNCU_SOYAD, type LigKademe } from './kariyerConfig';

export const BENIM_TAKIM = 'Beşli Patron SK';
const KAYIT_ANAHTARI = '@besli_lig_v1';

export type Pozisyon = 'Kaleci' | 'Defans' | 'Orta Saha' | 'Forvet';

export type Oyuncu = {
  id: string;
  ad: string;
  yas: number;
  pozisyon: Pozisyon | string;
  guc: number;
  deger: number;
};

export type TabloSatir = { O: number; A: number; Y: number; AV: number; P: number };

export type MacRaporu = {
  hafta: number;
  rakip: string;
  skorumuz: number;
  skorrakip: number;
  hasilat: number;
  sonuc: 'G' | 'B' | 'M';
};

export type SezonSonu = { hedefSeviye: number; konum: number; odul: number; mesaj: string };

export type KariyerDurum = {
  seviye: number;
  sezonNo: number;
  hafta: number;
  rakipler: string[];
  fikstur: [number, number][][];
  tablo: Record<string, TabloSatir>;
  kadro: Oyuncu[];
  transferList: Oyuncu[];
  transferHafta: number;
  raporlar: MacRaporu[];
  sezonSonu: SezonSonu | null;
};

const rastgele = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const sec = <T,>(dizi: T[]): T => dizi[Math.floor(Math.random() * dizi.length)];
const bosSatir = (): TabloSatir => ({ O: 0, A: 0, Y: 0, AV: 0, P: 0 });

// Takım adından sabit bir sayı üretir (rakibin gücü her sezon aynı kalsın diye)
function hashAd(ad: string): number {
  let h = 7;
  for (let i = 0; i < ad.length; i++) h = (h * 31 + ad.charCodeAt(i)) % 100000;
  return h;
}

export function rakipGuc(kademe: LigKademe, ad: string): number {
  const oran = (hashAd(ad) % 1000) / 1000;
  return Math.round(kademe.gucAralik[0] + oran * (kademe.gucAralik[1] - kademe.gucAralik[0]));
}

export function takimGucu(kadro: Oyuncu[]): number {
  if (!kadro.length) return 40;
  return Math.round(kadro.reduce((t, o) => t + o.guc, 0) / kadro.length);
}

// Çift devreli olmayan, 8 takımlı tek devre fikstür (0 = biz, 1..7 = rakipler)
function fiksturKur(takimSayisi: number): [number, number][][] {
  const donen: number[] = [];
  for (let i = 1; i < takimSayisi; i++) donen.push(i);
  const turlar: [number, number][][] = [];
  const yari = takimSayisi / 2;
  for (let t = 0; t < takimSayisi - 1; t++) {
    const dizi = [0, ...donen];
    const tur: [number, number][] = [];
    for (let i = 0; i < yari; i++) {
      const a = dizi[i];
      const b = dizi[takimSayisi - 1 - i];
      tur.push(t % 2 !== 0 ? [b, a] : [a, b]);
    }
    turlar.push(tur);
    const son = donen.pop();
    if (son !== undefined) donen.unshift(son);
  }
  return turlar;
}

function golAt(beklenen: number): number {
  const L = Math.exp(-Math.max(0.05, beklenen));
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function macSimet(evGuc: number, depGuc: number): [number, number] {
  const fark = (evGuc - depGuc) / 10;
  const etki = 0.45 * fark;
  return [golAt(1.3 + etki), golAt(1.1 - etki)];
}

function oyuncuUret(kademe: LigKademe, pozisyon: string): Oyuncu {
  const guc = rastgele(kademe.gucAralik[0] - 4, kademe.gucAralik[1] + 2);
  const yas = rastgele(18, 34);
  return {
    id: 'o' + Date.now().toString(36) + Math.floor(Math.random() * 1000000).toString(36),
    ad: sec(OYUNCU_AD) + ' ' + sec(OYUNCU_SOYAD),
    yas,
    pozisyon,
    guc,
    deger: oyuncuDeger(guc, yas, kademe),
  };
}

function havuzdanSec(havuz: string[], adet = 7): string[] {
  const kalan = [...havuz];
  const secilen: string[] = [];
  while (secilen.length < adet && kalan.length > 0) {
    secilen.push(kalan.splice(Math.floor(Math.random() * kalan.length), 1)[0]);
  }
  return secilen;
}

export function tablola(k: KariyerDurum) {
  const satirlar = [BENIM_TAKIM, ...k.rakipler].map((ad) => {
    const t = k.tablo[ad] ?? bosSatir();
    return { ad, O: t.O, A: t.A, Y: t.Y, AV: t.AV, P: t.P, benim: ad === BENIM_TAKIM };
  });
  satirlar.sort((a, b) => b.P - a.P || b.AV - a.AV || b.A - a.A);
  return satirlar;
}

function emeklilikSiniri(seviye: number): number {
  return Math.min(50, 37 + 2 * (seviye - 1));
}

// Sezon geçişinde yaşlanma, gelişim/gerileme ve emeklilik
function sezonAgetir(kadro: Oyuncu[], seviye: number) {
  const sinir = emeklilikSiniri(seviye);
  const kademe = kademeBul(seviye);
  const kalan: Oyuncu[] = [];
  const gencler: Oyuncu[] = [];
  const emekliler: string[] = [];
  for (const o of kadro) {
    const yeniYas = o.yas + 1;
    if (yeniYas > sinir) {
      emekliler.push(`${o.ad} (${o.yas})`);
      const g = oyuncuUret(kademe, o.pozisyon);
      g.yas = rastgele(16, 18);
      g.guc = Math.max(20, rastgele(kademe.gucAralik[0] - 8, kademe.gucAralik[0] + 2));
      g.deger = oyuncuDeger(g.guc, g.yas, kademe);
      gencler.push(g);
      continue;
    }
    let guc = o.guc;
    if (yeniYas <= 25) guc += rastgele(2, 4);
    else if (yeniYas <= 31) guc += rastgele(-1, 1);
    else guc -= 1 + Math.floor((yeniYas - 32) / 3);
    guc = Math.max(15, Math.min(99, guc));
    kalan.push({ ...o, yas: yeniYas, guc, deger: oyuncuDeger(guc, yeniYas, kademe) });
  }
  const emekliMesaj = emekliler.length
    ? `Emekli: ${emekliler.join(', ')} - altyapidan ${gencler.length} genc geldi.`
    : '';
  return { kadro: [...kalan, ...gencler], emekliMesaj };
}

export function transferListesiUret(k: KariyerDurum): KariyerDurum {
  const kademe = kademeBul(k.seviye);
  const liste = ['Kaleci', 'Defans', 'Defans', 'Orta Saha', 'Orta Saha', 'Forvet'].map((poz, i) => {
    const o = oyuncuUret(kademe, poz);
    if (i < 2) {
      o.yas = rastgele(16, 20);
      o.deger = oyuncuDeger(o.guc, o.yas, kademe);
    }
    let deneme = 40;
    while (o.deger > kademe.bonservisTavan && o.guc > 20 && deneme-- > 0) {
      o.guc -= 2;
      o.deger = oyuncuDeger(o.guc, o.yas, kademe);
    }
    if (o.deger > kademe.bonservisTavan) o.deger = kademe.bonservisTavan;
    return o;
  });
  return { ...k, transferList: liste, transferHafta: k.hafta };
}

export function yeniLig(): KariyerDurum {
  const kademe = kademeBul(8);
  const kadro: Oyuncu[] = [];
  const dagilim: Record<string, number> = { Kaleci: 2, Defans: 5, 'Orta Saha': 5, Forvet: 4 };
  Object.keys(dagilim).forEach((poz) => {
    for (let i = 0; i < dagilim[poz]; i++) kadro.push(oyuncuUret(kademe, poz));
  });
  const rakipler = havuzdanSec(kademe.havuz, 7);
  const tablo: Record<string, TabloSatir> = { [BENIM_TAKIM]: bosSatir() };
  rakipler.forEach((r) => (tablo[r] = bosSatir()));
  const durum: KariyerDurum = {
    seviye: 8,
    sezonNo: 1,
    hafta: 0,
    rakipler,
    fikstur: fiksturKur(8),
    tablo,
    kadro,
    transferList: [],
    transferHafta: 0,
    raporlar: [],
    sezonSonu: null,
  };
  durum.transferList = transferListesiUret(durum).transferList;
  return durum;
}

// Bir hafta oynatır: tüm maçlar, puan tablosu, iç saha hasılatı ve sezon sonu
export function haftaOyna(k: KariyerDurum): {
  state: KariyerDurum;
  rapor: MacRaporu | null;
  nakitDelta: number;
} {
  if (k.sezonSonu) return { state: k, rapor: null, nakitDelta: 0 };
  const kademe = kademeBul(k.seviye);
  const tur = k.fikstur[k.hafta];
  if (!tur) return { state: k, rapor: null, nakitDelta: 0 };

  const bizimGuc = takimGucu(k.kadro);
  const tablo: Record<string, TabloSatir> = {};
  [BENIM_TAKIM, ...k.rakipler].forEach((ad) => {
    tablo[ad] = { ...(k.tablo[ad] ?? bosSatir()) };
  });

  let nakitDelta = 0;
  let rapor: MacRaporu | null = null;

  for (const [a, b] of tur) {
    const adA = a !== 0 ? k.rakipler[a - 1] : BENIM_TAKIM;
    const adB = b !== 0 ? k.rakipler[b - 1] : BENIM_TAKIM;
    const gucA = a !== 0 ? rakipGuc(kademe, adA) : bizimGuc;
    const gucB = b !== 0 ? rakipGuc(kademe, adB) : bizimGuc;
    const skor = macSimet(gucA, gucB);
    const ta = tablo[adA];
    const tb = tablo[adB];
    ta.O += 1;
    tb.O += 1;
    ta.A += skor[0];
    ta.Y += skor[1];
    tb.A += skor[1];
    tb.Y += skor[0];
    ta.AV = ta.A - ta.Y;
    tb.AV = tb.A - tb.Y;
    if (skor[0] > skor[1]) ta.P += 3;
    else if (skor[0] < skor[1]) tb.P += 3;
    else {
      ta.P += 1;
      tb.P += 1;
    }

    if (a === 0 || b === 0) {
      const icSaha = a === 0;
      const skorumuz = icSaha ? skor[0] : skor[1];
      const skorrakip = icSaha ? skor[1] : skor[0];
      let hasilat = 0;
      if (icSaha) {
        hasilat = rastgele(kademe.hasilatAralik[0], kademe.hasilatAralik[1]);
        if (skorumuz > skorrakip) hasilat = Math.round(hasilat * 1.15);
      }
      nakitDelta += hasilat;
      rapor = {
        hafta: k.hafta + 1,
        rakip: icSaha ? adB : adA,
        skorumuz,
        skorrakip,
        hasilat,
        sonuc: skorumuz > skorrakip ? 'G' : skorumuz < skorrakip ? 'M' : 'B',
      };
    }
  }

  const raporlar = rapor ? [rapor, ...k.raporlar].slice(0, 8) : k.raporlar;
  const yeniHafta = k.hafta + 1;

  if (!(yeniHafta >= k.fikstur.length)) {
    return { state: { ...k, tablo, hafta: yeniHafta, raporlar }, rapor, nakitDelta };
  }

  // Sezon sonu
  const konum = tablola({ ...k, tablo }).findIndex((s) => s.benim) + 1;
  const odul =
    konum !== 1
      ? Math.round((kademe.sampiyonlukOdulu * 0.3 * (8 - konum)) / 7)
      : kademe.sampiyonlukOdulu;
  nakitDelta += odul;

  let hedefSeviye = k.seviye;
  let mesaj: string;
  if (kademe.yukselen > 0 && konum <= kademe.yukselen) {
    hedefSeviye = k.seviye - 1;
    mesaj = `ŞAMPİYON! ${kademeBul(hedefSeviye).ad}'a yükseldin! 🏆 Ödül: ${odul.toLocaleString('tr-TR')}₺`;
  } else if (kademe.dussen > 0 && konum >= 9 - kademe.dussen) {
    hedefSeviye = k.seviye + 1;
    mesaj = `Küme düştün... ${kademeBul(hedefSeviye).ad}'a iniyorsun. Sezon ödülü: ${odul.toLocaleString('tr-TR')}₺`;
  } else {
    mesaj = `Sezon ${konum}. sırada tamamlandı. Sezon ödülü: ${odul.toLocaleString('tr-TR')}₺`;
  }

  return {
    state: {
      ...k,
      tablo,
      hafta: yeniHafta,
      raporlar,
      sezonSonu: { hedefSeviye, konum, odul, mesaj },
    },
    rapor,
    nakitDelta,
  };
}

export function yeniSezonBaslat(k: KariyerDurum): { state: KariyerDurum; mesaj: string } {
  const hedef = k.sezonSonu ? k.sezonSonu.hedefSeviye : k.seviye;
  const kademe = kademeBul(hedef);
  const yaslanan = sezonAgetir(k.kadro, hedef);
  const rakipler = havuzdanSec(kademe.havuz, 7);
  const tablo: Record<string, TabloSatir> = { [BENIM_TAKIM]: bosSatir() };
  rakipler.forEach((r) => (tablo[r] = bosSatir()));
  const state: KariyerDurum = {
    ...k,
    kadro: yaslanan.kadro,
    seviye: hedef,
    sezonNo: k.sezonNo + 1,
    hafta: 0,
    rakipler,
    fikstur: fiksturKur(8),
    tablo,
    raporlar: [],
    sezonSonu: null,
  };
  state.transferList = transferListesiUret(state).transferList;
  const ek = yaslanan.emekliMesaj ? ' ' + yaslanan.emekliMesaj : '';
  return { state, mesaj: `${kademe.ad}'da ${state.sezonNo}. sezon başladı!${ek}` };
}

export function oyuncuAl(k: KariyerDurum, oyuncuId: string) {
  const o = k.transferList.find((x) => x.id === oyuncuId);
  if (!o) return { state: k, mesaj: 'Oyuncu listede yok.', nakitDelta: 0 };
  if (k.kadro.length >= 18) return { state: k, mesaj: 'Kadro dolu (en fazla 18 oyuncu).', nakitDelta: 0 };
  if (o.deger > kademeBul(k.seviye).bonservisTavan)
    return { state: k, mesaj: 'Bonservis tavanını aşıyor.', nakitDelta: 0 };
  return {
    state: {
      ...k,
      kadro: [...k.kadro, o],
      transferList: k.transferList.filter((x) => x.id !== oyuncuId),
    },
    mesaj: `${o.ad} kadroya katıldı! (${o.deger.toLocaleString('tr-TR')}₺)`,
    nakitDelta: -o.deger,
  };
}

export function oyuncuSat(k: KariyerDurum, oyuncuId: string) {
  if (k.kadro.length <= 11) return { state: k, mesaj: 'En az 11 oyuncu kalmalı.', nakitDelta: 0 };
  const o = k.kadro.find((x) => x.id === oyuncuId);
  if (!o) return { state: k, mesaj: 'Oyuncu kadroda yok.', nakitDelta: 0 };
  const fiyat = Math.max(500, Math.round((o.deger * 0.6) / 500) * 500);
  return {
    state: { ...k, kadro: k.kadro.filter((x) => x.id !== oyuncuId) },
    mesaj: `${o.ad} ${fiyat.toLocaleString('tr-TR')}₺'ye satıldı.`,
    nakitDelta: fiyat,
  };
}

export async function ligYukle(): Promise<KariyerDurum | null> {
  try {
    const ham = await AsyncStorage.getItem(KAYIT_ANAHTARI);
    if (!ham) return null;
    return JSON.parse(ham);
  } catch {
    return null;
  }
}

export async function ligKaydet(k: KariyerDurum): Promise<void> {
  try {
    await AsyncStorage.setItem(KAYIT_ANAHTARI, JSON.stringify(k));
  } catch {}
}

export async function ligSifirla(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KAYIT_ANAHTARI);
  } catch {}
}
