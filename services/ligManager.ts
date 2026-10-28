// ============================================
// BEŞLİ PATRON — services/ligManager.ts
// Haftalık mahalle ligi: fikstür, maç simülasyonu, puan durumu
// ============================================

export const LIG_CONFIG = {
  takimSayisi: 8,
  macEnerjisi: 15,
  oduller: { galibiyet: 7500, beraberlik: 3000, yenilgi: 1000 } as Record<MacSonucu, number>,
  prestijler: { galibiyet: 2, beraberlik: 1, yenilgi: 0 } as Record<MacSonucu, number>,
  sezonOdulleri: [
    { siralama: 1, nakit: 60000, prestij: 25 },
    { siralama: 2, nakit: 30000, prestij: 12 },
    { siralama: 3, nakit: 15000, prestij: 6 },
  ],
  rakipTabanGuc: 45,
  rakipDegisim: 20,
  sezonArtis: 6,
  sezonOdulCarpani: 0.25,
};

const BEN_ID = 'ben';
const BEN_AD = 'Beşli Patron SK';
const RAKIP_ISIMLERI = [
  'Kaleci Yok FK',
  'Panzer Takım',
  'Gece Maççıları',
  'Mahalle Baskısı SK',
  'Ofsayt Neye Yarar',
  'Kontra Atak United',
  'Vurdumduymaz SK',
  'Çim Kaldıranlar',
  'Bira Molası FC',
  'Top Bizde Kalır SK',
  'Son Dakika Gol',
  'Sıfır Km Futbol',
];

export type MacSonucu = 'galibiyet' | 'beraberlik' | 'yenilgi';

export type LigTakim = {
  id: string;
  ad: string;
  guc: number;
  oynanan: number;
  galibiyet: number;
  beraberlik: number;
  yenilgi: number;
  attigi: number;
  yedigi: number;
  puan: number;
};

export type LigMac = {
  hafta: number;
  ev: string;
  dep: string;
  evGol: number | null;
  depGol: number | null;
};

export type LigSonMac = {
  hafta: number;
  rakipAd: string;
  senGol: number;
  rakipGol: number;
  sonuc: MacSonucu;
};

export type LigDurum = {
  sezon: number;
  hafta: number;
  takimlar: LigTakim[];
  fikstur: LigMac[];
  sonMacGunu: number;
  sampiyonluk: number;
  toplamKazanc: number;
  sonMac: LigSonMac | null;
};

export type LigHaftaSonucu = LigSonMac & {
  kazanc: number;
  sezonOdulu: number;
  prestij: number;
  sezonPrestij: number;
  sezonBitti: boolean;
  siralama: number;
  puanDurumu: LigTakim[];
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Takımımızın gücü: saha kalitesi, tesis seviyesi, memnuniyet ve prestijden
export function oyuncuGucuHesapla(
  sahaKalitesi: number,
  tesisSeviyesi: number,
  memnuniyet: number,
  prestij: number,
): number {
  const seviyeBonus = [0, 5, 10, 15][clamp(Math.round(tesisSeviyesi), 0, 3)] ?? 0;
  const ham =
    36 + 3 * sahaKalitesi + seviyeBonus + (memnuniyet - 50) * 0.15 + Math.min(50, prestij) * 0.2;
  return Math.round(clamp(ham, 30, 95));
}

export function puandanSirala(takimlar: LigTakim[]): LigTakim[] {
  return [...takimlar].sort(
    (a, b) =>
      b.puan - a.puan ||
      b.attigi - b.yedigi - (a.attigi - a.yedigi) ||
      b.attigi - a.attigi ||
      a.ad.localeCompare(b.ad, 'tr'),
  );
}

// Poisson dağılımlı gol sayısı (en fazla 7)
function golUret(beklenen: number): number {
  const L = Math.exp(-Math.max(0.05, beklenen));
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return Math.min(7, k - 1);
}

function macOyna(evGuc: number, depGuc: number): [number, number] {
  const fark = evGuc - depGuc;
  const evBeklenen = clamp(1.35 + fark * 0.035, 0.3, 3.6);
  const depBeklenen = clamp(1.05 - fark * 0.035, 0.25, 3.2);
  return [golUret(evBeklenen), golUret(depBeklenen)];
}

function istatistikEkle(t: LigTakim, attigi: number, yedigi: number) {
  t.oynanan += 1;
  t.attigi += attigi;
  t.yedigi += yedigi;
  if (attigi > yedigi) {
    t.galibiyet += 1;
    t.puan += 3;
  } else if (attigi !== yedigi) {
    t.yenilgi += 1;
  } else {
    t.beraberlik += 1;
    t.puan += 1;
  }
}

// Çember (round-robin) fikstür: 8 takım, 7 hafta, haftada 4 maç
function fiksturUret(idler: string[]): LigMac[] {
  const sabit = idler[idler.length - 1];
  const donen = idler.slice(0, idler.length - 1);
  const n = donen.length;
  const fikstur: LigMac[] = [];
  for (let t = 0; t < n; t++) {
    const r = donen.map((_, i) => donen[(i + t) % n]);
    const eslesmeler: [string, string][] = [
      [r[0], r[6]],
      [r[1], r[5]],
      [r[2], r[4]],
      [sabit, r[3]],
    ];
    for (const [ev, dep] of eslesmeler) {
      fikstur.push({ hafta: t + 1, ev, dep, evGol: null, depGol: null });
    }
  }
  return fikstur;
}

function bosIstatistik() {
  return { oynanan: 0, galibiyet: 0, beraberlik: 0, yenilgi: 0, attigi: 0, yedigi: 0, puan: 0 };
}

export function ligOlustur(
  sezon: number,
  sahaKalitesi: number,
  tesisSeviyesi: number,
  memnuniyet: number,
  prestij: number,
  sonMacGunu: number,
): LigDurum {
  const isimler = [...RAKIP_ISIMLERI];
  for (let i = isimler.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [isimler[i], isimler[j]] = [isimler[j], isimler[i]];
  }
  const takimlar: LigTakim[] = [
    {
      id: BEN_ID,
      ad: BEN_AD,
      guc: oyuncuGucuHesapla(sahaKalitesi, tesisSeviyesi, memnuniyet, prestij),
      ...bosIstatistik(),
    },
  ];
  for (let i = 0; i < LIG_CONFIG.takimSayisi - 1; i++) {
    const taban = LIG_CONFIG.rakipTabanGuc + LIG_CONFIG.sezonArtis * (Math.max(1, sezon) - 1);
    const sapma = Math.round((Math.random() * 2 - 1) * (LIG_CONFIG.rakipDegisim / 2));
    takimlar.push({
      id: `${sezon}_${i}`,
      ad: isimler[i],
      guc: clamp(taban + sapma, 30, 95),
      ...bosIstatistik(),
    });
  }
  return {
    sezon: Math.max(1, Math.round(sezon)),
    hafta: 1,
    takimlar,
    fikstur: fiksturUret(takimlar.map((t) => t.id)),
    sonMacGunu,
    sampiyonluk: 0,
    toplamKazanc: 0,
    sonMac: null,
  };
}

// Bir lig haftasını oynatır; son haftaysa sezonu kapatıp yeni sezonu kurar
export function ligHaftaSimule(
  lig: LigDurum,
  sahaKalitesi: number,
  tesisSeviyesi: number,
  memnuniyet: number,
  prestij: number,
  gun: number,
): { lig: LigDurum; sonuc: LigHaftaSonucu | null } {
  const sonHafta = LIG_CONFIG.takimSayisi - 1;
  const hafta = clamp(Math.round(lig.hafta), 1, sonHafta);
  const takimlar = lig.takimlar.map((t) => ({ ...t }));
  const fikstur = lig.fikstur.map((m) => ({ ...m }));
  const carpan = 1 + LIG_CONFIG.sezonOdulCarpani * (lig.sezon - 1);

  const ben = takimlar.find((t) => t.id === BEN_ID);
  if (ben) ben.guc = oyuncuGucuHesapla(sahaKalitesi, tesisSeviyesi, memnuniyet, prestij);

  const bul = (id: string) => takimlar.find((t) => t.id === id)!;
  let sonuc: LigHaftaSonucu | null = null;

  for (const mac of fikstur.filter((m) => m.hafta === hafta && m.evGol == null)) {
    const ev = bul(mac.ev);
    const dep = bul(mac.dep);
    const [evGol, depGol] = macOyna(ev.guc, dep.guc);
    mac.evGol = evGol;
    mac.depGol = depGol;
    istatistikEkle(ev, evGol, depGol);
    istatistikEkle(dep, depGol, evGol);
    if (mac.ev === BEN_ID || mac.dep === BEN_ID) {
      const benEv = mac.ev === BEN_ID;
      const senGol = benEv ? evGol : depGol;
      const rakipGol = benEv ? depGol : evGol;
      const rakipAd = benEv ? dep.ad : ev.ad;
      const sonucTip: MacSonucu =
        senGol > rakipGol ? 'galibiyet' : senGol === rakipGol ? 'beraberlik' : 'yenilgi';
      sonuc = {
        hafta,
        rakipAd,
        senGol,
        rakipGol,
        sonuc: sonucTip,
        kazanc: Math.round(LIG_CONFIG.oduller[sonucTip] * carpan),
        sezonOdulu: 0,
        prestij: LIG_CONFIG.prestijler[sonucTip],
        sezonPrestij: 0,
        sezonBitti: false,
        siralama: 0,
        puanDurumu: [],
      };
    }
  }

  const yeniHafta = hafta + 1;
  const kazanc = sonuc?.kazanc ?? 0;

  if (!(yeniHafta > sonHafta)) {
    if (sonuc) sonuc.puanDurumu = puandanSirala(takimlar);
    const s = sonuc as LigHaftaSonucu | null;
    return {
      lig: {
        ...lig,
        takimlar,
        fikstur,
        hafta: yeniHafta,
        sonMacGunu: gun,
        toplamKazanc: lig.toplamKazanc + kazanc,
        sonMac: s
          ? { hafta: s.hafta, rakipAd: s.rakipAd, senGol: s.senGol, rakipGol: s.rakipGol, sonuc: s.sonuc }
          : lig.sonMac,
      },
      sonuc,
    };
  }

  // Sezon sonu
  const sirali = puandanSirala(takimlar);
  const siralama = sirali.findIndex((t) => t.id === BEN_ID) + 1;
  const odul = LIG_CONFIG.sezonOdulleri.find((o) => o.siralama === siralama);
  if (sonuc) {
    const s = sonuc as LigHaftaSonucu;
    s.sezonBitti = true;
    s.siralama = siralama;
    s.sezonOdulu = Math.round((odul?.nakit ?? 0) * carpan);
    s.sezonPrestij = odul?.prestij ?? 0;
    s.puanDurumu = sirali;
  }
  const yeniLig = ligOlustur(lig.sezon + 1, sahaKalitesi, tesisSeviyesi, memnuniyet, prestij, gun);
  yeniLig.sampiyonluk = lig.sampiyonluk + (siralama === 1 ? 1 : 0);
  yeniLig.toplamKazanc =
    lig.toplamKazanc + kazanc + ((sonuc as LigHaftaSonucu | null)?.sezonOdulu ?? 0);
  return { lig: yeniLig, sonuc };
}
