// ============================================
// SAHA BİZİM — engine/motor.ts
// Oyun motoru: saf fonksiyonlar. Her eylem durumun kopyasını alır,
// değiştirir ve yeni durumu döndürür. Ekranlar sadece bu fonksiyonları çağırır.
// ============================================
import type {
  OyunDurumu,
  Saha,
  SahaTipi,
  Rezervasyon,
  Teklif,
  TakimDurum,
  ReklamTuru,
  GunRaporu,
  FiyatSeviyesi,
  Haber,
} from './tipler';
import { SEHIRLER, sehirBul, tumTakimlar, type SehirTanim, type TakimTanim } from './sehirler';
import * as V from './veri';
import { bugununEtkinligi, havaSec, tarihYazi } from './takvim';
import { TUM_ANLAR, anBulTanim, type CanliAnTanim, type AnEtki, type KarakterId } from './anlar';

export const SURUM = 1;
const GUN_DK = 1440;

// ---------- Yardımcılar ----------
const kopya = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const rnd = () => Math.random();
const sec = <T,>(d: T[]): T => d[Math.floor(rnd() * d.length)];
const sinirla = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const yuvarla50 = (n: number) => Math.max(50, Math.round(n / 50) * 50);
let sayac = 0;
const yeniId = (on: string) => `${on}${Date.now().toString(36)}${(sayac++).toString(36)}`;

export const sehir = (s: OyunDurumu): SehirTanim => sehirBul(s.sehirId);
export const mutlakDakika = (s: OyunDurumu) => s.gun * GUN_DK + s.dakika;
export const suankiSaat = (s: OyunDurumu) => Math.floor(s.dakika / 60);
export const para = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} ₺`;

export function takimBul(s: OyunDurumu, id: string): (TakimTanim & { mahalleId: string }) | null {
  return tumTakimlar(sehir(s)).find((t) => t.id === id) ?? null;
}
export function takimAdi(s: OyunDurumu, id: string): string {
  if (id.startsWith('misafir:')) return id.slice(8);
  return takimBul(s, id)?.ad ?? 'Misafir';
}
export function mahalleAdi(s: OyunDurumu, id: string): string {
  return sehir(s).mahalleler.find((m) => m.id === id)?.ad ?? id;
}
export const sahipMahalleSayisi = (s: OyunDurumu) => Object.values(s.mahalleSahip).filter(Boolean).length;

function haber(s: OyunDurumu, metin: string, tur: Haber['tur'] = 'bilgi') {
  s.haberler.unshift({ gun: s.gun, saat: suankiSaat(s), metin, tur });
  if (s.haberler.length > 40) s.haberler.length = 40;
}
function bildir(s: OyunDurumu, tur: string, metin: string) {
  s.bekleyenOlaylar.push({ tur, metin });
  if (s.bekleyenOlaylar.length > 8) s.bekleyenOlaylar.shift();
}
function metinDoldur(s: OyunDurumu, m: string, takimId?: string) {
  const sh = sehir(s);
  const tk = takimId && !takimId.startsWith('misafir:') ? takimBul(s, takimId) : null;
  return m
    .replace(/\{takim\}/g, takimId ? takimAdi(s, takimId) : 'Mahalle takımı')
    .replace(/\{mahalle\}/g, tk ? mahalleAdi(s, tk.mahalleId) : sh.mahalleler[0].ad)
    .replace(/\{rakipSaha\}/g, sh.karakter.rakipSaha)
    .replace(/\{cocuk\}/g, sh.karakter.cocuk)
    .replace(/\{gazeteci\}/g, sh.karakter.gazeteci)
    .replace(/\{zabita\}/g, sh.karakter.zabita)
    .replace(/\{hakem\}/g, sh.karakter.hakem)
    .replace(/\{sehir\}/g, sh.ad)
    .replace(/\{simge\}/g, sh.simge)
    .replace(/\{muhtar\}/g, sh.karakter.muhtar)
    .replace(/\{rakip\}/g, sh.karakter.rakip)
    .replace(/\{cayci\}/g, sh.karakter.cayci)
    .replace(/\{bekci\}/g, sh.karakter.bekci);
}

// ---------- Forma bonusları ----------
export function formaBonus(s: OyunDurumu, b: V.FormaBonus): number {
  let top = 0;
  for (const id of s.formalar) {
    const f = V.FORMALAR.find((x) => x.id === id);
    if (f && f.bonus === b) top += f.deger;
  }
  return top;
}
export function tamamlananSetler(s: OyunDurumu): number {
  const say: Record<string, number> = {};
  for (const id of s.formalar) {
    const f = V.FORMALAR.find((x) => x.id === id);
    if (f) say[f.efsane] = (say[f.efsane] ?? 0) + 1;
  }
  return Object.values(say).filter((n) => n >= 3).length;
}

// ---------- Haftanın teması ----------
export const gunTemasi = (s: OyunDurumu): V.GunTemasi => V.GUN_TEMALARI[V.haftaGunu(s.gun)];

// ---------- Saha bilgileri ----------
export const sahaTanim = (saha: Saha) => V.SAHA_TIPLERI[saha.tip];
export const hizmette = (saha: Saha) => saha.asama >= 5;
export function maksKalite(saha: Saha): number {
  return Math.min(10, sahaTanim(saha).maksKalite + (saha.yukseltmeler.hali ?? 0));
}
export function acikSaatler(saha: Saha): number[] {
  if (!hizmette(saha)) return [];
  const isik = saha.yukseltmeler.isik ?? 0;
  const son = isik >= 2 ? 26 : isik >= 1 ? 24 : V.SON_SAAT_ISIKSIZ;
  const r: number[] = [];
  for (let h = V.ACILIS_SAATI; h <= son; h++) r.push(h);
  return r;
}
export function sahaFiyatEki(saha: Saha): number {
  let ek = 0;
  for (const y of V.YUKSELTMELER) ek += (y.fiyatEki ?? 0) * (saha.yukseltmeler[y.id] ?? 0);
  return ek;
}
export function maliyetCarpan(s: OyunDurumu) {
  return sehir(s).fiyatCarpani;
}

/** Bir saatlik maçın fiyatı */
export function macFiyati(s: OyunDurumu, saha: Saha, tip: keyof typeof V.TAKIM_TIPLERI | null, saat: number): number {
  const taban = (tip ? V.TAKIM_TIPLERI[tip].taban : 1350) * 0.88;
  const sh = sehir(s);
  let f = taban * sh.fiyatCarpani * V.FIYAT_SEVIYE[saha.fiyat].fiyat;
  f *= 0.72 + saha.kalite * 0.055;
  f *= sahaTanim(saha).fiyatCarpan;
  f *= 1 + sahaFiyatEki(saha);
  f *= 1 + formaBonus(s, 'fiyat') / 100 + tamamlananSetler(s) * V.SET_BONUS_FIYAT;
  if (saat >= 23) f *= 1.12 * (1 + formaBonus(s, 'gecefiyat') / 100);
  if (saat >= 22 && gunTemasi(s).geceFiyatEki) f *= 1 + gunTemasi(s).geceFiyatEki!;
  f *= 1 + s.efsaneYildiz * 0.05;
  return yuvarla50(f);
}

function sahaDolu(s: OyunDurumu, sahaId: string, saat: number) {
  return s.rezervasyonlar.some((r) => r.sahaId === sahaId && r.saat === saat);
}
/** Bu saatte boş, hizmette olan saha; takım tipinin sevdiği sahaya öncelik */
export function bosSaha(s: OyunDurumu, saat: number, tip?: keyof typeof V.TAKIM_TIPLERI | null): Saha | null {
  const adaylar = s.sahalar.filter((sh) => acikSaatler(sh).includes(saat) && !sahaDolu(s, sh.id, saat));
  if (adaylar.length === 0) return null;
  adaylar.sort((a, b) => {
    const as = tip && sahaTanim(a).sevenTipler.includes(tip) ? 1 : 0;
    const bs = tip && sahaTanim(b).sevenTipler.includes(tip) ? 1 : 0;
    return bs - as || b.kalite - a.kalite;
  });
  return adaylar[0];
}
export function teklifEnerjisi(s: OyunDurumu) {
  return Math.max(2, V.TEKLIF_ENERJI - (s.personel.kasiyer ?? 0));
}

// ---------- Yeni oyun ----------
type Kalici = Partial<Pick<OyunDurumu, 'efsaneYildiz' | 'formalar' | 'istatistik' | 'tumZamanKazanc' | 'girisSerisi' | 'sonGirisTarihi' | 'miniOyunRekor' | 'hikayeGoruldu' | 'sezon' | 'kupaSayisi' | 'takim' | 'tesisSus'>>;

export function yeniOyun(sehirSira = 0, kalici: Kalici = {}, simdi = Date.now()): OyunDurumu {
  const sh = SEHIRLER[sehirSira % SEHIRLER.length];
  const takimlar: Record<string, TakimDurum> = {};
  tumTakimlar(sh).forEach((t) => {
    takimlar[t.id] = { sevgi: t.mahalleId === sh.mahalleler[0].id ? 40 : 22, abone: false, aboneGun: 0, aboneSaat: 0, macSayisi: 0, sonMacGun: 0 };
  });
  const mahalleKontrol: Record<string, number> = {};
  const mahalleSahip: Record<string, boolean> = {};
  sh.mahalleler.forEach((m, i) => {
    mahalleKontrol[m.id] = i === 0 ? 65 : 5;
    mahalleSahip[m.id] = false;
  });
  const ana: Saha = {
    id: 'ana',
    tip: 'mahalle',
    ad: `${sh.mahalleler[0].ad} Sahası`,
    asama: 5,
    insaatBitisDakika: null,
    kalite: V.SAHA_TIPLERI.mahalle.baslangicKalite,
    yukseltmeler: {},
    fiyat: 1,
  };
  const bugun = tarihYazi(new Date(simdi));
  const s: OyunDurumu = {
    surum: SURUM,
    sehirId: sh.id,
    sehirSira: sehirSira,
    gun: 1,
    dakika: V.ACILIS_SAATI * 60,
    hiz: 1,
    duraklat: false,
    gunBitti: false,
    nakit: Math.round(V.BASLANGIC_NAKIT * sh.fiyatCarpani),
    enerji: V.BASLANGIC_ENERJI,
    itibar: 0,
    efsaneYildiz: kalici.efsaneYildiz ?? 0,
    toplamKazanc: 0,
    tumZamanKazanc: kalici.tumZamanKazanc ?? 0,
    sahalar: [ana],
    aktifSahaId: 'ana',
    rezervasyonlar: [],
    teklifler: [],
    canliAn: null,
    takimlar,
    mahalleKontrol,
    mahalleSahip,
    cayOcagi: 0,
    cayBirikim: 0,
    personel: { kasiyer: 0, temizlikci: 0, guvenlik: 0, bekci: 0 },
    formalar: kalici.formalar ?? [],
    yeniFormalar: [],
    hava: havaSec(sh.id, new Date(simdi)),
    derbi: null,
    kredi: 0,
    krediTaksit: 0,
    negatifGun: 0,
    bugunReklam: {},
    bugunGelir: 0,
    bugunCay: 0,
    bugunMac: 0,
    bugunItibar: 0,
    bugunReklamToplam: 0,
    gununYildiziAlindi: false,
    sonRapor: null,
    geceRaporu: null,
    sonGirisTarihi: kalici.sonGirisTarihi ?? '',
    girisSerisi: kalici.girisSerisi ?? 0,
    seriOdulAlindiTarih: '',
    seriKurtarilabilir: false,
    miniOyunTarih: '',
    miniOyunHak: 1,
    miniOyunSeri: 0,
    miniOyunRekor: kalici.miniOyunRekor ?? 0,
    sonKapanis: simdi,
    sonGecisReklamGun: 0,
    haberler: [],
    hikayeGoruldu: kalici.hikayeGoruldu ?? {},
    istatistik: kalici.istatistik ?? { mac: 0, derbi: 0, derbiGalibiyet: 0, anCevap: 0, sehirFethi: 0 },
    rakipEtki: null,
    kurtarmaTeklifi: false,
    iflas: false,
    bekleyenHikaye: [`giris_${sh.id}`],
    reklamTarih: bugun,
    bekleyenOlaylar: [],
    iliski: {},
    zincirler: [],
    bayraklar: {},
    sonAnlar: [],
    sozlesme: null,
    sozlesmeTeklifi: null,
    kupa: null,
    kupaSayisi: kalici.kupaSayisi ?? 0,
    final: null,
    finalKazanildi: false,
    gorevler: { gun: 0, liste: [], haftaBas: 1, haftaTamam: 0, haftaSandikAlindi: false },
    sezon: kalici.sezon ? { ...kalici.sezon, baslangic: 1 } : { no: 1, baslangic: 1, xp: 0, alinan: [] },
    takim: kalici.takim ? { ...kalici.takim, lig: null, adaylar: [], adayGun: 0, ligSezon: 0 } : bosTakim(),
    tesisSus: kalici.tesisSus ?? { cim: 0, tabela: 0, bayrak: 0, maskot: 0, acik: [] },
  };
  gorevUret(s);
  haber(s, `${sh.ad} macerası başladı. ${sh.karakter.rakip} seni izliyor.`, 'bilgi');
  teklifUret(s, V.ACILIS_SAATI - 1, 3);
  // ilk gün boş kalmasın: iki garanti teklif
  for (const [tid, saat] of [[sh.mahalleler[0].takimlar[0].id, 16], [`misafir:${V.MISAFIR_GRUPLAR[0]}`, 12]] as [string, number][]) {
    if (s.teklifler.some((t) => t.takimId === tid)) continue;
    const tk = tid.startsWith('misafir:') ? null : tumTakimlar(sh).find((x) => x.id === tid) ?? null;
    s.teklifler.push({ id: yeniId('t'), takimId: tid, saat, fiyat: macFiyati(s, ana, tk?.tip ?? null, saat), bitisDakika: saat * 60 - 30, not: tk?.not });
  }
  return s;
}

// ---------- Teklif üretimi ----------
function talepCarpani(s: OyunDurumu, saat: number, tip: keyof typeof V.TAKIM_TIPLERI | null, saha: Saha) {
  const etk = bugununEtkinligi();
  const hava = V.HAVALAR[s.hava] ?? V.HAVALAR.bulutlu;
  const korumali = (saha.yukseltmeler.isitici ?? 0) >= (s.hava === 'kar' ? 2 : 1) || saha.tip === 'vip';
  const havaF = hava.isiticiKoruma && korumali ? 1 : hava.talep;
  let c = 1;
  c *= 0.7 + Math.min(1.8, s.itibar / 350);
  c *= 0.6 + saha.kalite * 0.08;
  c *= V.FIYAT_SEVIYE[saha.fiyat].talep;
  c *= etk.saatCarpan(saat);
  const tema = gunTemasi(s);
  if (tema.saatCarpan) c *= tema.saatCarpan(saat);
  if (tip && tema.tipCarpan?.[tip]) c *= tema.tipCarpan[tip]!;
  if (tip && etk.tipCarpan?.[tip]) c *= etk.tipCarpan[tip]!;
  c *= havaF;
  c *= s.rakipEtki?.carpan ?? 1;
  c *= 1 + formaBonus(s, 'teklif') / 100;
  if (tip && (tip === 'ofis' || tip === 'kurumsal') && (saha.yukseltmeler.otopark ?? 0) > 0) c *= 1.25;
  return c;
}

/** saat: şu anki saat. ileri: kaç saat sonrasına kadar misafir teklifi gelebilir */
function teklifUret(s: OyunDurumu, saat: number, ileri = 4) {
  const sh = sehir(s);
  const hg = V.haftaGunu(s.gun);
  const bugunOynayan = new Set(s.rezervasyonlar.map((r) => r.takimId));
  const bekleyen = new Set(s.teklifler.map((t) => t.takimId));
  const enFazla = 5 + s.sahalar.filter(hizmette).length;
  // İsimli takımlar
  for (const t of tumTakimlar(sh)) {
    if (s.teklifler.length >= enFazla) break;
    if (bugunOynayan.has(t.id) || bekleyen.has(t.id)) continue;
    const td = s.takimlar[t.id];
    const tip = V.TAKIM_TIPLERI[t.tip];
    if (tip.gunler && !tip.gunler.includes(hg)) continue;
    const saatler = tip.saatler.filter((h) => h > saat && bosSaha(s, h, t.tip));
    if (saatler.length === 0) continue;
    const hedef = sec(saatler);
    const saha = bosSaha(s, hedef, t.tip)!;
    let p = 0.13 * (s.gun <= 2 ? 1.8 : 1);
    p *= talepCarpani(s, hedef, t.tip, saha);
    p *= 0.5 + td.sevgi / 80;
    p *= 0.6 + (s.mahalleSahip[t.mahalleId] ? 100 : s.mahalleKontrol[t.mahalleId] ?? 0) / 120;
    if (tip.hafsonuCarpan && (hg === 0 || hg === 6)) p *= tip.hafsonuCarpan;
    if (rnd() < p) {
      s.teklifler.push({
        id: yeniId('t'),
        takimId: t.id,
        saat: hedef,
        fiyat: macFiyati(s, saha, t.tip, hedef),
        bitisDakika: Math.min(hedef * 60, s.dakika + V.TEKLIF_GECERLILIK_DK),
        not: t.not,
      });
    }
  }
  // Misafir gruplar
  for (let h = saat + 1; h <= Math.min(26, saat + ileri); h++) {
    for (const saha of s.sahalar) {
      if (s.teklifler.length >= enFazla) return;
      if (!acikSaatler(saha).includes(h) || sahaDolu(s, saha.id, h)) continue;
      if (s.teklifler.some((t) => t.saat === h && t.takimId.startsWith('misafir:'))) continue;
      const p = 0.11 * (s.gun <= 2 ? 1.6 : 1) * (V.SAAT_TALEP[h] ?? 0.5) * talepCarpani(s, h, null, saha);
      if (rnd() < p) {
        s.teklifler.push({
          id: yeniId('t'),
          takimId: `misafir:${sec(V.MISAFIR_GRUPLAR)}`,
          saat: h,
          fiyat: macFiyati(s, saha, null, h),
          bitisDakika: Math.min(h * 60, s.dakika + V.TEKLIF_GECERLILIK_DK),
        });
      }
    }
  }
}

// ---------- Saat akışı ----------
export type TickSonuc = { s: OyunDurumu; degisti: boolean };

/** Gerçek zamanda geçen ms kadar oyunu ilerletir */
/** Hikâye, gece raporu ya da günlük ödül penceresi açıkken saat durur */
export function pencereAcik(s: OyunDurumu) {
  return s.bekleyenHikaye.length > 0 || !!s.geceRaporu || s.seriKurtarilabilir || seriOdulHazir(s);
}

export function tick(onceki: OyunDurumu, gecenMs: number, simdi = Date.now()): TickSonuc {
  if (onceki.gunBitti || onceki.duraklat || onceki.iflas || pencereAcik(onceki)) return { s: onceki, degisti: false };
  if (onceki.canliAn) {
    if (simdi >= onceki.canliAn.bitisZamani) return { s: anCevapla(onceki, null), degisti: true };
    return { s: onceki, degisti: false };
  }
  const s = kopya(onceki);
  const ilerle = (gecenMs / 1000) * (60 / V.GERCEK_SANIYE_PER_SAAT) * s.hiz;
  const hedef = Math.min(V.KAPANIS_SAATI * 60, s.dakika + ilerle);
  while (s.dakika < hedef) {
    const sonrakiSaatDk = (Math.floor(s.dakika / 60) + 1) * 60;
    if (sonrakiSaatDk <= hedef) {
      s.dakika = sonrakiSaatDk;
      saatBasi(s, sonrakiSaatDk / 60, simdi);
      if (s.canliAn || s.gunBitti) break;
    } else {
      s.dakika = hedef;
    }
  }
  // süresi dolan teklifler
  const kalan: Teklif[] = [];
  for (const t of s.teklifler) {
    if (t.bitisDakika <= s.dakika) {
      if (!t.takimId.startsWith('misafir:')) {
        const td = s.takimlar[t.takimId];
        if (td) td.sevgi = sinirla(td.sevgi - 2, 0, 100);
      }
    } else kalan.push(t);
  }
  s.teklifler = kalan;
  return { s, degisti: true };
}

function saatBasi(s: OyunDurumu, saat: number, simdi: number) {
  // biten maçlar (bir önceki saat)
  for (const r of s.rezervasyonlar) {
    if (r.saat === saat - 1 && r.durum === 'oynaniyor') macBitir(s, r);
  }
  // inşaatlar
  for (const saha of s.sahalar) {
    if (saha.insaatBitisDakika != null && mutlakDakika(s) >= saha.insaatBitisDakika) insaatAsamaBitir(s, saha);
  }
  // çay ocağı saatlik
  if (s.cayOcagi > 0) cayEkle(s, V.CAY_SAATLIK * s.cayOcagi * maliyetCarpan(s) / 3);
  if (saat >= V.KAPANIS_SAATI) {
    gunSonu(s);
    return;
  }
  // başlayan maçlar
  let anAdayi: Rezervasyon | null = null;
  for (const r of s.rezervasyonlar) {
    if (r.saat === saat && r.durum === 'bekliyor') {
      r.durum = 'oynaniyor';
      if (!anAdayi || (!r.takimId.startsWith('misafir:') && anAdayi.takimId.startsWith('misafir:'))) anAdayi = r;
    }
  }
  if (anAdayi && !anAdayi.derbi) {
    const sans = anAdayi.takimId.startsWith('misafir:') ? 0.16 : 0.3;
    if (rnd() < sans) anBaslat(s, anAdayi, simdi);
  }
  if (!s.canliAn && saat >= 10 && saat <= 23 && rnd() < 0.4) zincirKontrol(s, simdi);
  teklifUret(s, saat);
}

function cayEkle(s: OyunDurumu, miktar: number) {
  if (s.cayOcagi <= 0) return;
  const depo = V.CAY_SAATLIK * s.cayOcagi * maliyetCarpan(s) * V.CAY_DEPO_SAAT * 3;
  const m = miktar * (1 + formaBonus(s, 'cay') / 100);
  s.cayBirikim = Math.min(depo, s.cayBirikim + m);
  s.bugunCay += m;
}

function macBitir(s: OyunDurumu, r: Rezervasyon) {
  r.durum = 'bitti';
  const saha = s.sahalar.find((x) => x.id === r.sahaId);
  r.skor = [Math.floor(rnd() * 9), Math.floor(rnd() * 9)];
  if (r.derbi) {
    derbiBitir(s, r);
    gorevIlerlet(s, 'derbi');
    return;
  }
  if (r.kupa) {
    kupaMacBitti(s, r);
    return;
  }
  if (r.final) {
    finalBitti(s, r);
    return;
  }
  if (r.lig) {
    ligMacBitti(s, r);
    return;
  }
  if (r.ozel === 'meydan') {
    meydanBitti(s, r);
    return;
  }
  if (r.sozlesme && !sozlesmeMacBitti(s, r)) return;
  gorevIlerlet(s, 'mac');
  s.nakit += r.fiyat;
  s.bugunGelir += r.fiyat;
  s.toplamKazanc += r.fiyat;
  s.tumZamanKazanc += r.fiyat;
  gorevIlerlet(s, 'gelir', s.bugunGelir, true);
  s.bugunMac += 1;
  s.istatistik.mac += 1;
  if (saha) {
    const azalt = 1 - 0.25 * (s.personel.temizlikci ?? 0) - formaBonus(s, 'yipranma') / 100;
    saha.kalite = Math.max(1, saha.kalite - V.YIPRANMA * Math.max(0.2, azalt));
  }
  cayEkle(s, V.CAY_MAC_BASI * s.cayOcagi * maliyetCarpan(s));
  const itibarCarpan = 1 + formaBonus(s, 'itibar') / 100;
  const temaItibar = gunTemasi(s).macBasiItibar ?? 0;
  if (temaItibar) {
    s.itibar += temaItibar * itibarCarpan;
    s.bugunItibar += temaItibar * itibarCarpan;
  }
  if (r.ozel === 'hayir') {
    s.itibar += 12 * itibarCarpan;
    s.bugunItibar += 12 * itibarCarpan;
    for (const m of Object.keys(s.mahalleKontrol)) kontrolEkle(s, m, 3);
    haber(s, 'Hayır maçı bitti. Toplanan bağışlar mahalle okuluna gitti; bütün mahalleler seni konuşuyor.', 'iyi');
    bildir(s, 'mahalle', 'Hayır maçı: +12 itibar, tüm mahallelere +3');
    return;
  }
  if (r.ozel === 'dugun') {
    s.itibar += 3 * itibarCarpan;
    haber(s, 'Düğün maçı davul zurnayla bitti. Damat tarafı kazandı, gelin tarafı rövanş istiyor!', 'iyi');
  }
  if (r.takimId.startsWith('misafir:')) {
    s.itibar += 0.3 * itibarCarpan;
    s.bugunItibar += 0.3 * itibarCarpan;
    const acik = Object.keys(s.mahalleKontrol).filter((m) => !s.mahalleSahip[m]);
    if (acik.length) kontrolEkle(s, acik.includes(sehir(s).mahalleler[0].id) && rnd() < 0.6 ? sehir(s).mahalleler[0].id : sec(acik), 0.35);
    return;
  }
  const t = takimBul(s, r.takimId);
  const td = s.takimlar[r.takimId];
  if (!t || !td || !saha) return;
  const tip = V.TAKIM_TIPLERI[t.tip];
  let delta = 3 + (saha.kalite - tip.kaliteBeklenti) * 1.2;
  delta += V.FIYAT_SEVIYE[saha.fiyat].sevgi * tip.fiyatHassas;
  delta += 2 * (saha.yukseltmeler.soyunma ?? 0) + formaBonus(s, 'sevgi');
  if (sahaTanim(saha).sevenTipler.includes(t.tip)) delta += 2;
  td.sevgi = sinirla(td.sevgi + delta, 0, 100);
  td.macSayisi += 1;
  td.sonMacGun = s.gun;
  const kontrol = (delta >= 0 ? 0.8 + td.sevgi / 60 : -2) * (1 + formaBonus(s, 'kontrol') / 100);
  kontrolEkle(s, t.mahalleId, kontrol);
  const it = (delta >= 2 ? 1 : delta >= 0 ? 0.5 : -1.5) * itibarCarpan;
  s.itibar = Math.max(0, s.itibar + it);
  s.bugunItibar += it;
  if (!td.abone && td.sevgi >= 100) {
    td.abone = true;
    td.aboneGun = V.haftaGunu(s.gun);
    td.aboneSaat = r.saat;
    haber(s, `${t.ad} abone oldu! Her ${V.GUN_ADLARI[td.aboneGun]} ${V.saatYazi(r.saat)}'da gelecekler.`, 'iyi');
    bildir(s, 'abone', `${t.ad} abone oldu!`);
    if (!s.hikayeGoruldu.ilk_abone) s.bekleyenHikaye.push('ilk_abone');
  } else if (td.abone && td.sevgi < 60) {
    td.abone = false;
    haber(s, `${t.ad} aboneliğini bıraktı. Gönüllerini geri kazanmak lazım.`, 'kotu');
  }
  if (r.abone && rnd() < 0.12) {
    const f = formaVer(s, 0);
    if (f) haber(s, `${t.ad} sana bir forma hediye etti: ${f}`, 'iyi');
  }
}

function kontrolEkle(s: OyunDurumu, mahalleId: string, miktar: number) {
  if (s.mahalleSahip[mahalleId]) return;
  const etkin = miktar > 0 ? miktar * 0.72 : miktar;
  const yeni = sinirla((s.mahalleKontrol[mahalleId] ?? 0) + etkin, 0, 100);
  s.mahalleKontrol[mahalleId] = yeni;
  if (yeni >= 100) {
    s.mahalleSahip[mahalleId] = true;
    s.itibar += 25;
    const ad = mahalleAdi(s, mahalleId);
    haber(s, `${ad} artık senin! Muhtar her gün destek verecek.`, 'iyi');
    bildir(s, 'mahalle', `${ad} senin oldu!`);
    if (!s.hikayeGoruldu.ilk_mahalle) s.bekleyenHikaye.push('ilk_mahalle');
    if (Object.values(s.mahalleSahip).every(Boolean) && !s.finalKazanildi && !s.final) finalKur(s);
  }
}

// ---------- Canlı anlar ----------
function anUygunMu(s: OyunDurumu, a: CanliAnTanim, r: Rezervasyon | null): boolean {
  if (a.takip) return false;
  if (a.sehir && !a.sehir.includes(s.sehirId)) return false;
  if (s.sonAnlar.includes(a.id)) return false;
  if (a.bayrakGerek && !s.bayraklar[a.bayrakGerek]) return false;
  if (a.bayrakYok && s.bayraklar[a.bayrakYok]) return false;
  const saat = r?.saat ?? suankiSaat(s);
  const saha = r ? s.sahalar.find((x) => x.id === r.sahaId) : null;
  const t = r && !r.takimId.startsWith('misafir:') ? takimBul(s, r.takimId) : null;
  if (a.kosul === 'gece' && saat < 21) return false;
  if (a.kosul === 'gunduz' && saat >= 19) return false;
  if (a.kosul === 'yagmur' && s.hava !== 'yagmur') return false;
  if (a.kosul === 'kameraYok' && (saha?.yukseltmeler.kamera ?? 0) > 0) return false;
  if (a.kosul === 'amator' && t?.tip !== 'amator' && rnd() < 0.7) return false;
  if (a.kotu && rnd() < 0.3 * (s.personel.guvenlik ?? 0)) return false;
  return true;
}
function anKaydet(s: OyunDurumu, an: CanliAnTanim, r: Rezervasyon | null, simdi: number) {
  s.canliAn = { id: yeniId('a'), anId: an.id, rezId: r?.id ?? '', takimId: r?.takimId ?? '', bitisZamani: simdi + (an.nadir ? 16000 : 12000), nadir: an.nadir };
  s.sonAnlar = [an.id, ...s.sonAnlar].slice(0, 14);
}
function anBaslat(s: OyunDurumu, r: Rezervasyon, simdi: number) {
  // nadir altın an
  if (rnd() < 0.035) {
    const altin = TUM_ANLAR.filter((a) => a.nadir && anUygunMu(s, a, r));
    if (altin.length) return anKaydet(s, sec(altin), r, simdi);
  }
  const uygun = TUM_ANLAR.filter((a) => !a.nadir && anUygunMu(s, a, r));
  if (uygun.length === 0) return;
  // şehre özel ve karakterli anlara daha çok ağırlık
  const agirlik = uygun.map((a) => (a.sehir ? 2.6 : a.kim ? 1.6 : 1));
  let top = agirlik.reduce((x, y) => x + y, 0) * rnd();
  for (let i = 0; i < uygun.length; i++) {
    top -= agirlik[i];
    if (top <= 0) return anKaydet(s, uygun[i], r, simdi);
  }
  anKaydet(s, uygun[uygun.length - 1], r, simdi);
}
/** Vakti gelen hikâye devamını başlatır */
function zincirKontrol(s: OyunDurumu, simdi: number) {
  if (s.canliAn) return;
  const i = s.zincirler.findIndex((z) => z.gun <= s.gun);
  if (i < 0) return;
  const z = s.zincirler[i];
  const an = anBulTanim(z.an);
  s.zincirler.splice(i, 1);
  if (!an) return;
  if (an.bayrakGerek && !s.bayraklar[an.bayrakGerek]) return;
  const r = s.rezervasyonlar.find((x) => x.durum === 'oynaniyor' && !x.derbi) ?? null;
  anKaydet(s, an, r, simdi);
}

export function anTanim(s: OyunDurumu) {
  if (!s.canliAn) return null;
  const an = anBulTanim(s.canliAn.anId);
  if (!an) return null;
  const tid = s.canliAn.takimId;
  return {
    ...an,
    baslik: metinDoldur(s, an.baslik, tid),
    metin: metinDoldur(s, an.metin, tid),
    secenekler: an.secenekler.map((x) => ({ ...x, yazi: metinDoldur(s, x.yazi, tid), sonuc: metinDoldur(s, x.sonuc, tid) })),
  };
}

function etkiUygula(s: OyunDurumu, e: AnEtki, takimId: string, rezId: string) {
  if (e.nakit) s.nakit += e.nakit * maliyetCarpan(s);
  if (e.nakit && e.nakit > 0) {
    s.toplamKazanc += e.nakit * maliyetCarpan(s);
    s.tumZamanKazanc += e.nakit * maliyetCarpan(s);
  }
  if (e.enerji) s.enerji = sinirla(s.enerji + e.enerji, 0, V.MAKS_ENERJI);
  if (e.itibar) {
    const it = e.itibar > 0 ? e.itibar * 0.7 : e.itibar;
    s.itibar = Math.max(0, s.itibar + it);
    s.bugunItibar += it;
  }
  const t = takimId && !takimId.startsWith('misafir:') ? takimBul(s, takimId) : null;
  if (e.sevgi && t) s.takimlar[t.id].sevgi = sinirla(s.takimlar[t.id].sevgi + e.sevgi, 0, 100);
  if (e.kontrol) {
    const acik = Object.keys(s.mahalleKontrol).filter((m) => !s.mahalleSahip[m]);
    const m = t && !s.mahalleSahip[t.mahalleId] ? t.mahalleId : acik.length ? sec(acik) : null;
    // hikâye anlarının mahalleye etkisi yumuşatılır (fetih çok hızlanmasın)
    if (m) kontrolEkle(s, m, e.kontrol > 0 ? e.kontrol * 0.45 : e.kontrol);
  }
  if (e.kalite) {
    const r = s.rezervasyonlar.find((x) => x.id === rezId);
    const saha = s.sahalar.find((x) => x.id === r?.sahaId) ?? s.sahalar.find((x) => x.id === s.aktifSahaId);
    if (saha) saha.kalite = sinirla(saha.kalite + e.kalite, 1, maksKalite(saha));
  }
  if (e.forma != null) formaVer(s, e.forma);
  if (e.iliski) s.iliski[e.iliski.kim] = sinirla((s.iliski[e.iliski.kim] ?? 0) + e.iliski.d, -100, 100);
  if (e.bayrak) s.bayraklar[e.bayrak] = true;
  if (e.zincir) s.zincirler.push({ an: e.zincir.an, gun: s.gun + e.zincir.gun });
}

/** secim null = süre doldu. basarili: seçenek bir beceri oyunuysa sonucu */
export function anCevapla(onceki: OyunDurumu, secim: number | null, basarili = true): OyunDurumu {
  if (!onceki.canliAn) return onceki;
  const s = kopya(onceki);
  const ca = s.canliAn!;
  const an = anBulTanim(ca.anId);
  s.canliAn = null;
  if (!an) return s;
  const sc = secim == null ? an.sessiz : an.secenekler[secim];
  const kullan = sc.oyun && !basarili && sc.basarisiz ? sc.basarisiz : sc;
  etkiUygula(s, kullan.etki, ca.takimId, ca.rezId);
  if (secim != null) {
    s.istatistik.anCevap += 1;
    gorevIlerlet(s, 'an');
  }
  const sonuc = metinDoldur(s, kullan.sonuc, ca.takimId);
  bildir(s, secim == null || (sc.oyun && !basarili) ? 'kotu' : an.nadir ? 'para' : 'an', sonuc);
  if (an.nadir || an.takip) haber(s, `${metinDoldur(s, an.baslik, ca.takimId)} · ${sonuc}`, 'iyi');
  return s;
}

// ---------- Oyuncu eylemleri ----------
export type Sonuc = { s: OyunDurumu; hata?: string; mesaj?: string };
const hata = (s: OyunDurumu, m: string): Sonuc => ({ s, hata: m });

export function teklifKabul(onceki: OyunDurumu, teklifId: string): Sonuc {
  const t = onceki.teklifler.find((x) => x.id === teklifId);
  if (!t) return hata(onceki, 'Teklif artık geçerli değil.');
  const enerji = teklifEnerjisi(onceki);
  if (onceki.enerji < enerji) return hata(onceki, `Enerjin yetmiyor (${enerji} gerekli). Çay molası ver!`);
  const tip = t.takimId.startsWith('misafir:') ? null : takimBul(onceki, t.takimId)?.tip ?? null;
  const saha = bosSaha(onceki, t.saat, tip);
  if (!saha) return hata(onceki, 'O saatte boş saha kalmadı.');
  const s = kopya(onceki);
  s.enerji -= enerji;
  s.teklifler = s.teklifler.filter((x) => x.id !== teklifId);
  s.rezervasyonlar.push({ id: yeniId('r'), takimId: t.takimId, sahaId: saha.id, saat: t.saat, fiyat: t.fiyat, abone: false, durum: 'bekliyor', ozel: t.ozel });
  gorevIlerlet(s, 'teklif');
  return { s, mesaj: `${takimAdi(s, t.takimId)} ${V.saatYazi(t.saat)}'da geliyor.` };
}

export function teklifReddet(onceki: OyunDurumu, teklifId: string): Sonuc {
  const s = kopya(onceki);
  const t = s.teklifler.find((x) => x.id === teklifId);
  s.teklifler = s.teklifler.filter((x) => x.id !== teklifId);
  if (t && !t.takimId.startsWith('misafir:') && s.takimlar[t.takimId]) {
    s.takimlar[t.takimId].sevgi = sinirla(s.takimlar[t.takimId].sevgi - 4, 0, 100);
  }
  return { s };
}

export function fiyatAyarla(onceki: OyunDurumu, sahaId: string, seviye: FiyatSeviyesi): Sonuc {
  const s = kopya(onceki);
  const saha = s.sahalar.find((x) => x.id === sahaId);
  if (!saha) return hata(onceki, 'Saha yok.');
  saha.fiyat = seviye;
  return { s, mesaj: `Fiyat: ${V.FIYAT_SEVIYE[seviye].ad}` };
}

export function bakimMaliyeti(s: OyunDurumu) {
  return Math.round(V.BAKIM_UCRET * maliyetCarpan(s) * (1 - (gunTemasi(s).bakimIndirim ?? 0)));
}
export function bakimYap(onceki: OyunDurumu, sahaId: string): Sonuc {
  const saha = onceki.sahalar.find((x) => x.id === sahaId);
  if (!saha || !hizmette(saha)) return hata(onceki, 'Saha hizmette değil.');
  if (saha.kalite >= maksKalite(saha) - 0.05) return hata(onceki, 'Saha zaten en iyi durumda.');
  const m = bakimMaliyeti(onceki);
  if (onceki.nakit < m) return hata(onceki, `Nakit yetmiyor (${para(m)}).`);
  if (onceki.enerji < V.BAKIM_ENERJI) return hata(onceki, `Enerjin yetmiyor (${V.BAKIM_ENERJI}).`);
  const s = kopya(onceki);
  const sh = s.sahalar.find((x) => x.id === sahaId)!;
  s.nakit -= m;
  s.enerji -= V.BAKIM_ENERJI;
  sh.kalite = Math.min(maksKalite(sh), sh.kalite + V.BAKIM_ARTIS);
  gorevIlerlet(s, 'bakim');
  return { s, mesaj: 'Halı tarandı, çizgiler yenilendi.' };
}

export function yukseltmeMaliyeti(s: OyunDurumu, saha: Saha, id: string): number | null {
  const y = V.yukseltmeBul(id);
  const sv = saha.yukseltmeler[id] ?? 0;
  if (sv >= y.maliyetler.length) return null;
  return Math.round(y.maliyetler[sv] * V.YUKSELTME_TIP_CARPAN[saha.tip] * maliyetCarpan(s));
}
export function yukseltmeAl(onceki: OyunDurumu, sahaId: string, id: string): Sonuc {
  const saha = onceki.sahalar.find((x) => x.id === sahaId);
  if (!saha || !hizmette(saha)) return hata(onceki, 'Saha hizmette değil.');
  const m = yukseltmeMaliyeti(onceki, saha, id);
  if (m == null) return hata(onceki, 'En üst seviyede.');
  const y = V.yukseltmeBul(id);
  if (onceki.nakit < m) return hata(onceki, `Nakit yetmiyor (${para(m)}).`);
  if (onceki.enerji < y.enerji) return hata(onceki, `Enerjin yetmiyor (${y.enerji}).`);
  const s = kopya(onceki);
  const sh = s.sahalar.find((x) => x.id === sahaId)!;
  s.nakit -= m;
  s.enerji -= y.enerji;
  sh.yukseltmeler[id] = (sh.yukseltmeler[id] ?? 0) + 1;
  gorevIlerlet(s, 'yukseltme');
  return { s, mesaj: `${y.ad} kuruldu!` };
}

export function personelMaliyeti(s: OyunDurumu, id: string): number | null {
  const p = V.PERSONEL.find((x) => x.id === id)!;
  const sv = s.personel[id] ?? 0;
  if (sv >= p.maaslar.length) return null;
  return Math.round(p.maaslar[sv] * V.PERSONEL_ISEALIM_GUN * maliyetCarpan(s));
}
export function personelAl(onceki: OyunDurumu, id: string): Sonuc {
  const m = personelMaliyeti(onceki, id);
  if (m == null) return hata(onceki, 'En üst seviyede.');
  if (onceki.nakit < m) return hata(onceki, `Nakit yetmiyor (${para(m)}).`);
  const s = kopya(onceki);
  s.nakit -= m;
  s.personel[id] = (s.personel[id] ?? 0) + 1;
  const p = V.PERSONEL.find((x) => x.id === id)!;
  return { s, mesaj: `${p.ad} işe başladı.` };
}
export function gunlukMaas(s: OyunDurumu): number {
  let t = 0;
  for (const p of V.PERSONEL) {
    const sv = s.personel[p.id] ?? 0;
    if (sv > 0) t += p.maaslar[sv - 1];
  }
  return Math.round(t * maliyetCarpan(s));
}

export function cayYukseltMaliyeti(s: OyunDurumu): number | null {
  if (s.cayOcagi >= V.CAY_MALIYET.length) return null;
  return Math.round(V.CAY_MALIYET[s.cayOcagi] * maliyetCarpan(s));
}
export function cayYukselt(onceki: OyunDurumu): Sonuc {
  const m = cayYukseltMaliyeti(onceki);
  if (m == null) return hata(onceki, 'Çay ocağı en üst seviyede.');
  if (onceki.nakit < m) return hata(onceki, `Nakit yetmiyor (${para(m)}).`);
  const s = kopya(onceki);
  s.nakit -= m;
  s.cayOcagi += 1;
  return { s, mesaj: `${sehir(s).karakter.cayci}: "${V.CAY_MENU[s.cayOcagi]} hazır patron!"` };
}
export function cayTopla(onceki: OyunDurumu): Sonuc {
  if (onceki.cayBirikim < 1) return hata(onceki, 'Kasada henüz bir şey yok.');
  const s = kopya(onceki);
  const m = Math.round(s.cayBirikim);
  s.nakit += m;
  s.toplamKazanc += m;
  s.tumZamanKazanc += m;
  s.cayBirikim = 0;
  gorevIlerlet(s, 'cay');
  return { s, mesaj: `Çay ocağından ${para(m)} toplandı.` };
}

// ---------- Saha inşaatı ----------
export function yeniSahaAcilabilir(s: OyunDurumu, tip: SahaTipi): { olur: boolean; neden?: string } {
  const t = V.SAHA_TIPLERI[tip];
  if (s.sahalar.some((x) => x.tip === tip)) return { olur: false, neden: 'Zaten var.' };
  if (sahipMahalleSayisi(s) < t.gerekenMahalle) return { olur: false, neden: `${t.gerekenMahalle} mahalle fethetmelisin.` };
  return { olur: true };
}
export function arsaMaliyeti(s: OyunDurumu, tip: SahaTipi) {
  return Math.round(V.SAHA_TIPLERI[tip].arsa * maliyetCarpan(s));
}
export function asamaMaliyeti(s: OyunDurumu, tip: SahaTipi) {
  return Math.round(V.SAHA_TIPLERI[tip].asamaMaliyet * maliyetCarpan(s));
}
export function arsaAl(onceki: OyunDurumu, tip: SahaTipi): Sonuc {
  const k = yeniSahaAcilabilir(onceki, tip);
  if (!k.olur) return hata(onceki, k.neden!);
  const m = arsaMaliyeti(onceki, tip);
  if (onceki.nakit < m) return hata(onceki, `Nakit yetmiyor (${para(m)}).`);
  const s = kopya(onceki);
  s.nakit -= m;
  const t = V.SAHA_TIPLERI[tip];
  s.sahalar.push({ id: tip, tip, ad: t.ad, asama: 1, insaatBitisDakika: null, kalite: t.baslangicKalite, yukseltmeler: {}, fiyat: 1 });
  s.aktifSahaId = tip;
  return { s, mesaj: `${t.ad} arsası alındı! Ustaları çağır.` };
}
export function insaatBaslat(onceki: OyunDurumu, sahaId: string): Sonuc {
  const saha = onceki.sahalar.find((x) => x.id === sahaId);
  if (!saha || saha.asama >= 5) return hata(onceki, 'İnşaat yok.');
  if (saha.insaatBitisDakika != null) return hata(onceki, 'Ustalar zaten çalışıyor.');
  const m = asamaMaliyeti(onceki, saha.tip);
  if (onceki.nakit < m) return hata(onceki, `Nakit yetmiyor (${para(m)}).`);
  if (onceki.enerji < 10) return hata(onceki, 'Enerjin yetmiyor (10).');
  const s = kopya(onceki);
  const sh = s.sahalar.find((x) => x.id === sahaId)!;
  s.nakit -= m;
  s.enerji -= 10;
  sh.insaatBitisDakika = mutlakDakika(s) + sahaTanim(sh).asamaSaat * 60;
  return { s, mesaj: `Ustalar işe koyuldu: ${V.INSAAT_ASAMALARI[sh.asama]}.` };
}
function insaatAsamaBitir(s: OyunDurumu, saha: Saha) {
  saha.insaatBitisDakika = null;
  saha.asama += 1;
  if (saha.asama >= 5) {
    saha.kalite = sahaTanim(saha).baslangicKalite;
    haber(s, `${saha.ad} hizmete açıldı! Kurdeleyi kestin.`, 'iyi');
    bildir(s, 'insaat', `${saha.ad} açıldı!`);
  } else {
    bildir(s, 'insaat', `${saha.ad}: ${V.INSAAT_ASAMALARI[saha.asama - 1]} tamamlandı.`);
  }
}
export function insaatKalanDakika(s: OyunDurumu, saha: Saha) {
  return saha.insaatBitisDakika == null ? 0 : Math.max(0, saha.insaatBitisDakika - mutlakDakika(s));
}

export function aktifSahaSec(onceki: OyunDurumu, sahaId: string): OyunDurumu {
  const s = kopya(onceki);
  s.aktifSahaId = sahaId;
  return s;
}
export function hizAyarla(onceki: OyunDurumu, hiz: 1 | 2 | 4 | 8): OyunDurumu {
  const s = kopya(onceki);
  s.hiz = hiz;
  return s;
}

// ---------- Derbi ----------
function derbiKur(s: OyunDurumu) {
  const sh = sehir(s);
  const takimlar = tumTakimlar(sh);
  // önce birbirine düşman iki takım
  const dusmanlar = takimlar.filter((t) => t.dusman && takimlar.some((x) => x.id === t.dusman));
  let a: (typeof takimlar)[number], b: (typeof takimlar)[number];
  if (dusmanlar.length && rnd() < 0.7) {
    a = sec(dusmanlar);
    b = takimlar.find((x) => x.id === a.dusman)!;
  } else {
    const mahs = [...sh.mahalleler].sort(() => rnd() - 0.5).slice(0, 2);
    a = { ...sec(mahs[0].takimlar), mahalleId: mahs[0].id };
    b = { ...sec(mahs[1].takimlar), mahalleId: mahs[1].id };
  }
  s.derbi = { gun: s.gun, evMahalle: a.mahalleId, depMahalle: b.mahalleId, evTakim: a.id, depTakim: b.id, hakem: 0, ikram: 0, hazir: false };
  const saha = [...s.sahalar].filter(hizmette).sort((x, y) => (x.tip === 'arena' ? -1 : y.tip === 'arena' ? 1 : y.kalite - x.kalite))[0];
  if (saha) {
    s.rezervasyonlar = s.rezervasyonlar.filter((r) => !(r.sahaId === saha.id && r.saat === V.DERBI_SAAT));
    s.rezervasyonlar.push({ id: yeniId('d'), takimId: a.id, sahaId: saha.id, saat: V.DERBI_SAAT, fiyat: 0, abone: false, derbi: true, durum: 'bekliyor' });
  }
  haber(s, `Bu akşam derbi: ${mahalleAdi(s, a.mahalleId)} - ${mahalleAdi(s, b.mahalleId)}! Hakemi ve ikramı sen seç.`, 'bilgi');
}
export function derbiAyarla(onceki: OyunDurumu, hakem: 0 | 1, ikram: 0 | 1 | 2): Sonuc {
  if (!onceki.derbi || onceki.derbi.sonuc) return hata(onceki, 'Bugün derbi yok.');
  const s = kopya(onceki);
  s.derbi!.hakem = hakem;
  s.derbi!.ikram = ikram;
  s.derbi!.hazir = true;
  return { s, mesaj: 'Derbi hazırlıkları tamam.' };
}
function derbiBitir(s: OyunDurumu, r: Rezervasyon) {
  const d = s.derbi;
  if (!d) return;
  const saha = s.sahalar.find((x) => x.id === r.sahaId);
  const etk = bugununEtkinligi();
  const sk: [number, number] = [Math.floor(rnd() * 7), Math.floor(rnd() * 7)];
  if (sk[0] === sk[1]) sk[rnd() < 0.5 ? 0 : 1] += 1;
  r.skor = sk;
  const hakem = V.DERBI_HAKEM[d.hakem];
  const ikram = V.DERBI_IKRAM[d.ikram];
  const tribun = saha?.yukseltmeler.tribun ?? 0;
  let gelir = (2500 + 3500 * tribun) * maliyetCarpan(s) * (saha?.tip === 'arena' ? 2 : 1) * (etk.derbiCarpan ?? 1) * (1 + formaBonus(s, 'derbi') / 100);
  gelir = Math.round(gelir);
  const gider = (hakem.ucret + ikram.ucret) * maliyetCarpan(s);
  s.nakit += gelir - gider;
  s.bugunGelir += gelir;
  s.toplamKazanc += gelir;
  s.tumZamanKazanc += gelir;
  const kazanan = sk[0] > sk[1] ? d.evMahalle : d.depMahalle;
  const kaybeden = kazanan === d.evMahalle ? d.depMahalle : d.evMahalle;
  const kazTakim = kazanan === d.evMahalle ? d.evTakim : d.depTakim;
  const kayTakim = kazanan === d.evMahalle ? d.depTakim : d.evTakim;
  const kavga = rnd() < hakem.kavgaSans * (s.bayraklar.hakem_dost ? 0.2 : 1);
  kontrolEkle(s, kazanan, 12 * (1 + formaBonus(s, 'kontrol') / 100));
  kontrolEkle(s, kaybeden, kavga ? -10 : 5);
  if (s.takimlar[kazTakim]) s.takimlar[kazTakim].sevgi = sinirla(s.takimlar[kazTakim].sevgi + 8 + ikram.sevgi, 0, 100);
  if (s.takimlar[kayTakim]) s.takimlar[kayTakim].sevgi = sinirla(s.takimlar[kayTakim].sevgi + (kavga ? -15 : 2) + ikram.sevgi, 0, 100);
  s.itibar += kavga ? 2 : 10;
  s.bugunItibar += kavga ? 2 : 10;
  s.istatistik.derbi += 1;
  let mesaj = `${takimAdi(s, kazTakim)} kazandı! ${mahalleAdi(s, kazanan)} sana bir adım daha yaklaştı.`;
  if (kavga) mesaj += ` Ama ${hakem.ad.toLowerCase()} kararları kavga çıkardı, ${mahalleAdi(s, kaybeden)} küstü.`;
  let forma: string | undefined;
  if (rnd() < 0.5) forma = formaVer(s, 0) ?? undefined;
  d.sonuc = { skor: sk, gelir, mesaj, forma };
  haber(s, `Derbi bitti ${sk[0]}-${sk[1]}. ${mesaj}`, kavga ? 'kotu' : 'iyi');
  bildir(s, 'derbi', `Derbi bitti: ${sk[0]}-${sk[1]}`);
  if (!s.hikayeGoruldu.ilk_derbi) s.bekleyenHikaye.push('ilk_derbi');
}

// ---------- Formalar ----------
/** Rastgele, sahip olunmayan bir forma verir; adını döndürür */
export function formaVer(s: OyunDurumu, enAzNadirlik: 0 | 1 | 2): string | null {
  const r = rnd();
  let nad: 0 | 1 | 2 = r < 0.08 ? 2 : r < 0.4 ? 1 : 0;
  if (nad < enAzNadirlik) nad = enAzNadirlik;
  const uygun = (f: V.FormaTanim) => !s.formalar.includes(f.id) && (!f.sehir || f.sehir === s.sehirId);
  // bulunduğun şehrin efsanesi biraz daha sık düşer
  let havuz = V.FORMALAR.filter((f) => uygun(f) && f.nadirlik === nad && f.sehir && rnd() < 0.35);
  if (havuz.length === 0) havuz = V.FORMALAR.filter((f) => uygun(f) && f.nadirlik === nad);
  if (havuz.length === 0) havuz = V.FORMALAR.filter((f) => uygun(f) && f.nadirlik >= enAzNadirlik);
  if (havuz.length === 0) {
    s.nakit += 5000 * maliyetCarpan(s);
    return null;
  }
  const f = sec(havuz);
  s.formalar.push(f.id);
  s.yeniFormalar.push(f.id);
  bildir(s, 'forma', `Yeni forma: ${f.ad}`);
  return f.ad;
}
export function formalariGordu(onceki: OyunDurumu): OyunDurumu {
  if (onceki.yeniFormalar.length === 0) return onceki;
  const s = kopya(onceki);
  s.yeniFormalar = [];
  return s;
}

// ---------- Gün sonu ve yeni gün ----------
function gunSonu(s: OyunDurumu) {
  const sh = sehir(s);
  const kira = sh.kiraGunluk;
  const fatura = sh.faturaGunluk;
  const maas = gunlukMaas(s);
  let sahaGider = 0;
  let pasif = 0;
  for (const saha of s.sahalar) {
    if (!hizmette(saha)) continue;
    sahaGider += Math.round(sahaTanim(saha).gunlukGider * sh.fiyatCarpani);
    pasif += Math.round(sahaTanim(saha).pasifGunluk * sh.fiyatCarpani);
  }
  const mahalleBonus = Math.round(sahipMahalleSayisi(s) * V.MAHALLE_GUNLUK_BONUS * sh.fiyatCarpani);
  let taksit = 0;
  if (s.kredi > 0) {
    taksit = Math.min(s.kredi, s.krediTaksit);
    s.kredi -= taksit;
  }
  const gider = kira + fatura + maas + sahaGider + taksit;
  s.nakit += pasif + mahalleBonus - gider;
  s.toplamKazanc += pasif + mahalleBonus;
  s.tumZamanKazanc += pasif + mahalleBonus;
  const gelir = s.bugunGelir + pasif + mahalleBonus;
  const notlar: string[] = [];
  if (pasif > 0) notlar.push(`Akademi aidatı: +${para(pasif)}`);
  if (mahalleBonus > 0) notlar.push(`Muhtar desteği: +${para(mahalleBonus)}`);
  if (s.nakit < 0) {
    s.negatifGun += 1;
    notlar.push('Kasa ekside! Dikkat et.');
    if (s.negatifGun >= 2) s.kurtarmaTeklifi = true;
    if (s.negatifGun >= 4) s.iflas = true;
  } else {
    s.negatifGun = 0;
    s.kurtarmaTeklifi = false;
  }
  const rapor: GunRaporu = {
    gun: s.gun,
    gelir,
    cayGeliri: Math.round(s.bugunCay),
    gider,
    kira,
    fatura,
    maas,
    sahaGider,
    krediTaksit: taksit,
    net: gelir - gider,
    macSayisi: s.bugunMac,
    itibarDegisim: Math.round(s.bugunItibar),
    notlar,
  };
  s.sonRapor = rapor;
  s.gunBitti = true;
  s.dakika = V.KAPANIS_SAATI * 60;
  s.teklifler = [];
}

export function gecisReklamiGosterilsinMi(s: OyunDurumu): boolean {
  if (s.gun < V.GECIS_REKLAM_ILK_GUN) return false;
  if ((s.bugunReklam.__gun ?? 0) >= 3) return false;
  return s.gun - s.sonGecisReklamGun >= V.GECIS_REKLAM_ARALIK_GUN;
}
export function gecisReklamiGosterildi(onceki: OyunDurumu): OyunDurumu {
  const s = kopya(onceki);
  s.sonGecisReklamGun = s.gun;
  return s;
}

export function yeniGun(onceki: OyunDurumu, simdi = Date.now()): OyunDurumu {
  if (!onceki.gunBitti) return onceki;
  const s = kopya(onceki);
  const sh = sehir(s);
  s.gun += 1;
  s.dakika = V.ACILIS_SAATI * 60;
  s.gunBitti = false;
  s.enerji = Math.min(V.MAKS_ENERJI, s.enerji + V.GECE_ENERJI + formaBonus(s, 'enerji'));
  s.bugunGelir = 0;
  s.bugunCay = 0;
  s.bugunMac = 0;
  s.bugunItibar = 0;
  s.bugunReklam = { ...s.bugunReklam, __gun: 0 };
  s.gununYildiziAlindi = false;
  s.rezervasyonlar = [];
  s.teklifler = [];
  s.canliAn = null;
  s.derbi = null;
  s.hava = havaSec(s.sehirId, new Date(simdi));
  // Rakip baskısı
  const baski = Math.max(0.9, V.RAKIP_BASKI * (1 + s.sehirSira * 0.12) - Math.min(0.8, s.itibar / 2500));
  for (const m of Object.keys(s.mahalleKontrol)) {
    if (!s.mahalleSahip[m]) s.mahalleKontrol[m] = Math.max(0, s.mahalleKontrol[m] - baski);
  }
  if (s.rakipEtki && s.rakipEtki.bitisGun < s.gun) s.rakipEtki = null;
  if (!s.rakipEtki && rnd() < 0.13) rakipHamlesi(s);
  // Aboneler
  const hg = V.haftaGunu(s.gun);
  for (const t of tumTakimlar(sh)) {
    const td = s.takimlar[t.id];
    if (!td.abone || td.aboneGun !== hg) continue;
    const saha = bosSaha(s, td.aboneSaat, t.tip);
    if (!saha) continue;
    s.rezervasyonlar.push({
      id: yeniId('r'), takimId: t.id, sahaId: saha.id, saat: td.aboneSaat,
      fiyat: macFiyati(s, saha, t.tip, td.aboneSaat), abone: true, durum: 'bekliyor',
    });
  }
  if (hg === 0 && s.sahalar.some(hizmette)) derbiKur(s);
  sozlesmeGunu(s);
  kupaGunu(s);
  finalGunu(s);
  ligGunu(s);
  if (s.gun - s.sezon.baslangic >= V.SEZON_GUN) sezonYenile(s);
  gorevUret(s);
  const etk = bugununEtkinligi(new Date(simdi));
  haber(s, `${s.gun}. gün, ${V.GUN_ADLARI[hg]}: ${gunTemasi(s).ad}. Hava: ${V.HAVALAR[s.hava].ad}.`, 'bilgi');
  ozelTeklifler(s);
  teklifUret(s, V.ACILIS_SAATI - 1, 3);
  return s;
}

/** Tema günlerinin garanti teklifleri */
function ozelTeklifler(s: OyunDurumu) {
  const hg = V.haftaGunu(s.gun);
  const ekle = (saat: number, ad: string, ozel: 'dugun' | 'hayir', carpan: number) => {
    const saha = bosSaha(s, saat, null);
    if (!saha) return;
    s.teklifler.push({ id: yeniId('t'), takimId: `misafir:${ad}`, saat, fiyat: carpan === 0 ? 0 : yuvarla50(macFiyati(s, saha, 'amator', saat) * carpan), bitisDakika: saat * 60 - 30, ozel });
  };
  if (hg === 3) ekle(20, 'Damat ekibi - Gelin tarafı', 'dugun', 3);
  if (hg === 6) ekle(15, 'Hayır maçı: Mahalle karması', 'hayir', 0);
}

function rakipHamlesi(s: OyunDurumu) {
  const sh = sehir(s);
  const r = rnd();
  if (r < 0.25 && s.sahalar.some(hizmette)) {
    const saha = bosSaha(s, 22, null) ?? bosSaha(s, 21, null);
    if (saha) {
      s.teklifler.push({ id: yeniId('t'), takimId: `misafir:${sh.karakter.rakipSaha} SK`, saat: acikSaatler(saha).includes(22) ? 22 : 21, fiyat: 0, bitisDakika: 20 * 60, ozel: 'meydan' });
      haber(s, `${sh.karakter.rakip} meydan okudu: "Takımım bu akşam senin sahanda seni yener!"`, 'kotu');
      return;
    }
  }
  if (r < 0.45) {
    s.rakipEtki = { carpan: 0.8, bitisGun: s.gun + 2, metin: `${sh.karakter.rakip} fiyat kırdı! 3 gün boyunca müşterin azalacak.` };
    haber(s, s.rakipEtki.metin, 'kotu');
  } else if (r < 0.7) {
    s.rakipEtki = { carpan: 1.25, bitisGun: s.gun + 1, metin: `${sh.karakter.rakipSaha}'nda tavan aktı! Müşteriler sana kayıyor.` };
    haber(s, s.rakipEtki.metin, 'iyi');
  } else {
    const adaylar = tumTakimlar(sh).filter((t) => !s.takimlar[t.id].abone);
    if (adaylar.length) {
      const t = sec(adaylar);
      s.takimlar[t.id].sevgi = Math.max(0, s.takimlar[t.id].sevgi - 15);
      haber(s, `${sh.karakter.rakip}, ${t.ad} takımına bedava saat verdi. Gönüllerini geri kazan!`, 'kotu');
    }
  }
}

// ---------- Kredi ve iflas ----------
export function krediAl(onceki: OyunDurumu, reklamli: boolean): Sonuc {
  const s = kopya(onceki);
  const m = Math.round(15000 * maliyetCarpan(s));
  s.nakit += m;
  if (!reklamli) {
    s.kredi += Math.round(m * 1.25);
    s.krediTaksit = Math.round((m * 1.25) / 10);
  }
  s.kurtarmaTeklifi = false;
  s.negatifGun = 0;
  return { s, mesaj: reklamli ? `Faizsiz ${para(m)} kurtarma kredisi kasada!` : `${para(m)} kredi alındı. 10 gün taksitle ödenecek.` };
}
export function iflasSonrasi(onceki: OyunDurumu): OyunDurumu {
  const s = yeniOyun(onceki.sehirSira, onceki);
  s.bekleyenHikaye = [];
  haber(s, 'Tesisi sıfırdan kurdun. Yıldızların ve formaların seninle.', 'bilgi');
  return s;
}

// ---------- Şehir değiştirme ----------
export const tasinabilir = (s: OyunDurumu) => Object.values(s.mahalleSahip).every(Boolean) && s.finalKazanildi;
export function kazanilacakYildiz(s: OyunDurumu) {
  return 1 + Math.floor(s.toplamKazanc / 400000);
}
export function tasin(onceki: OyunDurumu, simdi = Date.now()): Sonuc {
  if (!tasinabilir(onceki)) return hata(onceki, 'Önce bütün mahalleleri fethet.');
  const yildiz = onceki.efsaneYildiz + kazanilacakYildiz(onceki);
  const ist = { ...onceki.istatistik, sehirFethi: onceki.istatistik.sehirFethi + 1 };
  const s = yeniOyun(onceki.sehirSira + 1, { ...onceki, efsaneYildiz: yildiz, istatistik: ist }, simdi);
  s.sonKapanis = simdi;
  return { s, mesaj: `${sehir(s).ad}'a taşındın! Efsane yıldızın: ${yildiz}` };
}

// ---------- Gerçek takvim, seri, mini oyun ----------
function gunFarki(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
}
/** Uygulama açılınca bir kez çağrılır */
export function girisKontrol(onceki: OyunDurumu, simdi = Date.now()): OyunDurumu {
  const bugun = tarihYazi(new Date(simdi));
  if (onceki.sonGirisTarihi === bugun) return onceki;
  const s = kopya(onceki);
  if (!s.sonGirisTarihi) s.girisSerisi = 1;
  else {
    const fark = gunFarki(s.sonGirisTarihi, bugun);
    if (fark === 1) s.girisSerisi += 1;
    else if (fark === 2 && s.girisSerisi >= 2) s.seriKurtarilabilir = true;
    else s.girisSerisi = 1;
  }
  s.sonGirisTarihi = bugun;
  if (s.miniOyunTarih !== bugun) {
    s.miniOyunTarih = bugun;
    s.miniOyunHak = 1;
  }
  if (s.reklamTarih !== bugun) {
    s.reklamTarih = bugun;
    s.bugunReklam = {};
    s.bugunReklamToplam = 0;
  }
  return s;
}
export function seriBirak(onceki: OyunDurumu): OyunDurumu {
  const s = kopya(onceki);
  s.seriKurtarilabilir = false;
  s.girisSerisi = 1;
  return s;
}
export function seriOdulHazir(s: OyunDurumu) {
  return s.seriOdulAlindiTarih !== s.sonGirisTarihi && !s.seriKurtarilabilir;
}
export function seriOdulAl(onceki: OyunDurumu): Sonuc {
  if (!seriOdulHazir(onceki)) return hata(onceki, 'Bugünün ödülü alındı.');
  const s = kopya(onceki);
  const o = V.SERI_ODULLERI[(s.girisSerisi - 1) % 7] as any;
  const c = maliyetCarpan(s);
  if (o.nakit) s.nakit += Math.round(o.nakit * c);
  if (o.enerji) s.enerji = Math.min(V.MAKS_ENERJI, s.enerji + o.enerji);
  if (o.itibar) s.itibar += o.itibar;
  if (o.cayDolu) {
    if (s.cayOcagi > 0) s.cayBirikim = V.CAY_SAATLIK * s.cayOcagi * c * V.CAY_DEPO_SAAT * 3;
    else s.nakit += Math.round(2500 * c);
  }
  if (o.forma) formaVer(s, 1);
  s.seriOdulAlindiTarih = s.sonGirisTarihi;
  return { s, mesaj: `${s.girisSerisi}. gün ödülü: ${o.yazi}` };
}

export function miniOyunSonuc(onceki: OyunDurumu, gol: number): Sonuc {
  const s = kopya(onceki);
  s.miniOyunHak = Math.max(0, s.miniOyunHak - 1);
  const c = maliyetCarpan(s);
  s.nakit += Math.round(gol * 350 * c);
  s.itibar += gol;
  s.miniOyunRekor = Math.max(s.miniOyunRekor, gol);
  gorevIlerlet(s, 'mini');
  let mesaj = `${gol} gol! +${para(gol * 350 * c)}, +${gol} itibar.`;
  if (gol >= 3) {
    s.miniOyunSeri += 1;
    if (s.miniOyunSeri % 7 === 0) {
      const f = formaVer(s, 2);
      mesaj += f ? ` 7 günlük seri! Efsane forma: ${f}` : '';
    }
  } else s.miniOyunSeri = 0;
  if (gol === 5) {
    s.itibar += 5;
    mesaj += ' Kusursuz! +5 bonus itibar.';
  }
  return { s, mesaj };
}

// ---------- Çevrimdışı (gece bekçisi) ----------
export function bekciSiniriSaat(s: OyunDurumu) {
  return 8 + 4 * (s.personel.bekci ?? 0);
}
export function cevrimdisiHesapla(onceki: OyunDurumu, simdi = Date.now()): OyunDurumu {
  const saat = Math.min(bekciSiniriSaat(onceki), (simdi - onceki.sonKapanis) / 3.6e6);
  if (saat < 0.25) return onceki;
  const s = kopya(onceki);
  const c = maliyetCarpan(s);
  const cay = Math.round(V.CAY_SAATLIK * s.cayOcagi * c * saat * (1 + formaBonus(s, 'cay') / 100));
  let akademi = 0;
  for (const saha of s.sahalar) if (hizmette(saha)) akademi += (sahaTanim(saha).pasifGunluk * c) / 18;
  const abone = Math.round(akademi * saat + Object.values(s.takimlar).filter((t) => t.abone).length * 120 * c * saat);
  const toplam = cay + abone;
  if (toplam <= 0) return onceki;
  // ustalar gece de çalışır
  for (const saha of s.sahalar) {
    if (saha.insaatBitisDakika != null) saha.insaatBitisDakika = Math.max(mutlakDakika(s), saha.insaatBitisDakika - saat * 60);
  }
  s.geceRaporu = { saat: Math.round(saat * 10) / 10, cay, abone, toplam, bekci: sehir(s).karakter.bekci };
  return s;
}
export function geceRaporuTopla(onceki: OyunDurumu, kat: 1 | 2): OyunDurumu {
  if (!onceki.geceRaporu) return onceki;
  const s = kopya(onceki);
  const m = s.geceRaporu!.toplam * kat;
  s.nakit += m;
  s.toplamKazanc += m;
  s.tumZamanKazanc += m;
  s.geceRaporu = null;
  bildir(s, 'para', `${sehir(s).karakter.bekci}: "${para(m)} kasaya kondu patron!"`);
  return s;
}
export function kapanisKaydet(onceki: OyunDurumu, simdi = Date.now()): OyunDurumu {
  const s = kopya(onceki);
  s.sonKapanis = simdi;
  return s;
}

// ---------- Reklam ödülleri ----------
export function reklamHakki(s: OyunDurumu, tur: ReklamTuru): number {
  return Math.max(0, V.REKLAM_LIMIT[tur] - (s.bugunReklam[tur] ?? 0));
}
export function sponsorReklamMumkun(s: OyunDurumu) {
  return reklamHakki(s, 'sponsor') > 0;
}
export function insaatHizlanabilir(s: OyunDurumu, sahaId: string) {
  const saha = s.sahalar.find((x) => x.id === sahaId);
  return !!saha && saha.insaatBitisDakika != null && reklamHakki(s, 'insaat') > 0;
}
export function sponsorOdulu(s: OyunDurumu) {
  const ekran = s.sahalar.filter((x) => (x.yukseltmeler.skorbord ?? 0) > 0).length;
  const carpan = ekran === 0 ? 0.5 : 1 + 0.5 * (ekran - 1);
  return Math.round(700 * maliyetCarpan(s) * carpan * (1 + s.efsaneYildiz * 0.05));
}
export function gununYildiziOdulu(s: OyunDurumu) {
  return Math.round(Math.min(s.bugunGelir * 0.5, 20000 * maliyetCarpan(s)));
}

/** Reklam izlendikten sonra ödülü uygular */
export function reklamOdulu(onceki: OyunDurumu, tur: ReklamTuru, hedef?: string): Sonuc {
  if (reklamHakki(onceki, tur) <= 0) return hata(onceki, 'Bugünlük bu ödülün hakkı bitti.');
  let s = kopya(onceki);
  s.bugunReklam[tur] = (s.bugunReklam[tur] ?? 0) + 1;
  s.bugunReklam.__gun = (s.bugunReklam.__gun ?? 0) + 1;
  s.bugunReklamToplam += 1;
  gorevIlerlet(s, 'reklam');
  const c = maliyetCarpan(s);
  let mesaj = '';
  switch (tur) {
    case 'gecebekci':
      s = geceRaporuTopla(s, 2);
      mesaj = 'Gece kasası iki katına çıktı!';
      break;
    case 'caymola':
      s.enerji = Math.min(V.MAKS_ENERJI, s.enerji + 30);
      mesaj = `${sehir(s).karakter.cayci} demli bir çay getirdi: +30 enerji.`;
      break;
    case 'insaat': {
      const saha = s.sahalar.find((x) => x.id === hedef);
      if (saha && saha.insaatBitisDakika != null) insaatAsamaBitir(s, saha);
      mesaj = 'Ustalar ekstra mesaiyle işi bitirdi!';
      break;
    }
    case 'sponsor': {
      const m = sponsorOdulu(s);
      s.nakit += m;
      s.toplamKazanc += m;
      s.tumZamanKazanc += m;
      mesaj = `Sponsor reklamı yayınlandı: +${para(m)}`;
      break;
    }
    case 'mahalletv': {
      const m = Math.round(1800 * c);
      s.nakit += m;
      s.itibar += 8;
      mesaj = `Derbi Mahalle TV'de canlı! +${para(m)}, +8 itibar.`;
      break;
    }
    case 'var':
      s.miniOyunHak += 1;
      mesaj = 'VAR incelemesi: bir hak daha!';
      break;
    case 'menajer': {
      const f = formaVer(s, 0);
      mesaj = f ? `Menajer bir forma bıraktı: ${f}` : 'Menajer bir çanta dolusu para bıraktı.';
      break;
    }
    case 'gununyildizi': {
      const m = gununYildiziOdulu(s);
      s.nakit += m;
      s.toplamKazanc += m;
      s.tumZamanKazanc += m;
      s.gununYildiziAlindi = true;
      mesaj = `Günün yıldızının fotoğrafı duvara asıldı: +${para(m)}`;
      break;
    }
    case 'kredi':
      return krediAl(s, true);
    case 'antrenman': {
      const o = s.takim.oyuncular.find((x) => x.id === hedef) ?? [...s.takim.oyuncular].sort((a, b) => a.guc - b.guc)[0];
      if (o) {
        o.guc = Math.min(99, o.guc + 3);
        mesaj = `Özel antrenman: ${o.ad} +3 güç (${o.guc}).`;
      } else mesaj = 'Önce takımına oyuncu al.';
      break;
    }
    case 'seri':
      s.seriKurtarilabilir = false;
      s.girisSerisi += 1;
      mesaj = `Seri kurtarıldı! ${s.girisSerisi}. gün.`;
      break;
  }
  return { s, mesaj };
}

// ---------- Hikâye ----------
export function hikayeMetni(s: OyunDurumu, anahtar: string): { baslik: string; satirlar: string[] } | null {
  const sh = sehir(s);
  if (anahtar.startsWith('giris_')) return { baslik: `${sh.ad}`, satirlar: sh.giris };
  if (anahtar.startsWith('fetih_')) return { baslik: `${sh.ad} fethedildi!`, satirlar: [sh.fetihMesaji, 'Patron sekmesinden yeni şehre taşınabilirsin. Efsane yıldızların seninle gelir.'] };
  if (anahtar.startsWith('final_'))
    return {
      baslik: 'Büyük Final!',
      satirlar: [
        `Bütün mahalleler senin. ${sh.karakter.rakip} son kozunu oynuyor: "${sh.karakter.rakipSaha}'nın takımı ile senin karma takımın kapışsın. Kazanan ${sh.ad}'ı alır!"`,
        'Final iki gün sonra 21:00\'de. Mahalle sekmesinden hazırlık yap: yıldız transfer et, kampa gir, taraftar otobüsü kaldır.',
      ],
    };
  if (anahtar === 'ilk_mahalle')
    return { baslik: 'İlk mahallen!', satirlar: [`${sh.karakter.muhtar} elini sıktı: "Artık bizim sahamız burası."`, `Her gün muhtar desteği kasaya girecek. Yeni saha arsaları da açılıyor.`] };
  if (anahtar === 'ilk_abone')
    return { baslik: 'İlk abonen!', satirlar: ['Bir takım seni o kadar sevdi ki her hafta aynı saatte gelecek.', 'Aboneler enerji harcatmaz ve bazen hediye getirir. Gönüllerini kırma.'] };
  if (anahtar === 'ilk_derbi')
    return { baslik: 'İlk derbin!', satirlar: [`Mahalle derbisi her Pazar akşamı ${V.saatYazi(V.DERBI_SAAT)}'de.`, 'Hakemi ve ikramı iyi seç: kazanan mahalle sana bağlanır, küsen mahalle uzaklaşır.'] };
  return null;
}
export function hikayeGoruldu(onceki: OyunDurumu, anahtar: string): OyunDurumu {
  const s = kopya(onceki);
  s.hikayeGoruldu[anahtar] = true;
  s.bekleyenHikaye = s.bekleyenHikaye.filter((x) => x !== anahtar);
  return s;
}
export function olaylariTemizle(onceki: OyunDurumu): OyunDurumu {
  if (onceki.bekleyenOlaylar.length === 0) return onceki;
  const s = kopya(onceki);
  s.bekleyenOlaylar = [];
  return s;
}

// ---------- Eski kayıttan geçiş ----------
export function eskiKayittanHediye(eski: any): { nakit: number; itibar: number } {
  const nakit = Math.max(0, Math.min(40000, Math.round((Number(eski?.nakit) || 0) * 0.03)));
  const itibar = Math.max(0, Math.min(80, Math.round((Number(eski?.prestij) || 0) / 5)));
  return { nakit: 5000 + nakit, itibar };
}

// ---------- Deneme (test) modu ----------
// Sadece deneme sürümünde görünen panelin kullandığı kısayollar.
export const TEST = {
  takimHazir(o: OyunDurumu): OyunDurumu {
    const s = kopya(o);
    if (!s.takim.kuruldu) {
      s.takim.kuruldu = true;
      const ilk = sehir(s).mahalleler[0].takimlar[0].id;
      s.takim.oyuncular = (['K', 'D', 'D', 'O', 'F', 'F'] as const).map((m) => oyuncuUret(s, ilk, m));
      adayYenile(s);
      ligKur(s);
    }
    return s;
  },
  ligBuAksam(o: OyunDurumu): OyunDurumu {
    let s = TEST.takimHazir(o);
    s = kopya(s);
    if (!s.takim.lig || s.takim.lig.bitti) ligKur(s);
    const rakip = ligSiradakiRakip(s);
    const saha = s.sahalar.find(hizmette);
    if (saha && rakip) {
      s.rezervasyonlar = s.rezervasyonlar.filter((r) => !(r.sahaId === saha.id && r.saat === V.LIG_SAAT));
      s.rezervasyonlar.push({ id: yeniId('l'), takimId: `misafir:${rakip}`, sahaId: saha.id, saat: V.LIG_SAAT, fiyat: 0, abone: false, lig: true, durum: 'bekliyor' });
    }
    return s;
  },
  kupaBaslat(o: OyunDurumu): OyunDurumu {
    const s = kopya(o);
    const takimlar = tumTakimlar(sehir(s)).map((t) => t.id).sort(() => rnd() - 0.5).slice(0, 8);
    s.kupa = { baslangic: s.gun, odul: 0, hazir: false, takimlar, turlar: [], bitti: false };
    return s;
  },
  sozlesmeTeklif(o: OyunDurumu): OyunDurumu {
    const s = kopya(o);
    s.sozlesme = null;
    s.sozlesmeTeklifi = null;
    const gun = s.gun;
    s.gun = Math.max(gun, 4);
    for (let i = 0; i < 200 && !s.sozlesmeTeklifi; i++) sozlesmeGunu(s);
    s.gun = gun;
    return s;
  },
  finalBaslat(o: OyunDurumu): OyunDurumu {
    const s = kopya(o);
    for (const m of sehir(s).mahalleler) {
      s.mahalleKontrol[m.id] = 100;
      s.mahalleSahip[m.id] = true;
    }
    s.finalKazanildi = false;
    finalKur(s);
    s.final!.gun = s.gun;
    finalGunu(s);
    return s;
  },
  paraDoldur(o: OyunDurumu): OyunDurumu {
    const s = kopya(o);
    s.nakit = Math.max(s.nakit, 50_000_000);
    s.enerji = V.MAKS_ENERJI;
    return s;
  },
  mahalleler(o: OyunDurumu, miktar: number): OyunDurumu {
    const s = kopya(o);
    for (const m of Object.keys(s.mahalleKontrol)) kontrolEkle(s, m, miktar);
    return s;
  },
  gunuBitir(o: OyunDurumu): OyunDurumu {
    if (o.gunBitti) return o;
    const s = kopya(o);
    s.canliAn = null;
    for (const r of s.rezervasyonlar) if (r.durum !== 'bitti') { r.durum = 'oynaniyor'; macBitir(s, r); }
    gunSonu(s);
    return s;
  },
  pazaraAtla(o: OyunDurumu): OyunDurumu {
    let s = TEST.gunuBitir(o);
    s = kopya(s);
    while (V.haftaGunu(s.gun + 1) !== 0) s.gun += 1;
    return s;
  },
  derbiSaatine(o: OyunDurumu): OyunDurumu {
    if (!o.derbi) return o;
    const s = kopya(o);
    s.dakika = V.DERBI_SAAT * 60 - 5;
    return s;
  },
  canliAn(o: OyunDurumu): OyunDurumu {
    if (o.gunBitti) return o;
    const s = kopya(o);
    let r = s.rezervasyonlar.find((x) => x.durum === 'oynaniyor' && !x.derbi);
    if (!r) {
      const takim = sec(tumTakimlar(sehir(s)));
      const saha = s.sahalar.find(hizmette)!;
      r = { id: yeniId('r'), takimId: takim.id, sahaId: saha.id, saat: suankiSaat(s), fiyat: 1000, abone: false, durum: 'oynaniyor' };
      s.rezervasyonlar.push(r);
    }
    for (let i = 0; i < 10 && !s.canliAn; i++) anBaslat(s, r, Date.now());
    return s;
  },
  ozelAn(o: OyunDurumu, tur: 'oyun' | 'altin' | 'sehir'): OyunDurumu {
    if (o.gunBitti) return o;
    const s = kopya(o);
    const havuz = TUM_ANLAR.filter((a) => !a.takip && (tur === 'oyun' ? a.secenekler.some((x) => x.oyun) && (!a.sehir || a.sehir.includes(s.sehirId)) : tur === 'altin' ? a.nadir : a.sehir?.includes(s.sehirId)));
    const r = s.rezervasyonlar.find((x) => x.durum === 'oynaniyor' && !x.derbi) ?? null;
    if (havuz.length) anKaydet(s, sec(havuz), r, Date.now());
    return s;
  },
  formaVer(o: OyunDurumu, adet: number): OyunDurumu {
    const s = kopya(o);
    for (let i = 0; i < adet; i++) formaVer(s, (i % 3) as 0 | 1 | 2);
    return s;
  },
  geceRaporu(o: OyunDurumu): OyunDurumu {
    const s = kopya(o);
    if (s.cayOcagi === 0) s.cayOcagi = 2;
    s.sonKapanis = Date.now() - 8 * 3.6e6;
    return cevrimdisiHesapla(s);
  },
  miniHak(o: OyunDurumu): OyunDurumu {
    const s = kopya(o);
    s.miniOyunHak += 1;
    return s;
  },
  reklamSifirla(o: OyunDurumu): OyunDurumu {
    const s = kopya(o);
    s.bugunReklam = {};
    s.bugunReklamToplam = 0;
    s.gununYildiziAlindi = false;
    return s;
  },
  seriSifirla(o: OyunDurumu): OyunDurumu {
    const s = kopya(o);
    s.seriOdulAlindiTarih = '';
    s.girisSerisi = (s.girisSerisi % 7) + 1;
    return s;
  },
  insaatlariBitir(o: OyunDurumu): OyunDurumu {
    const s = kopya(o);
    for (const saha of s.sahalar) while (saha.asama < 5) { saha.insaatBitisDakika = null; insaatAsamaBitir(s, saha); }
    return s;
  },
};

/** Beceri oyunu oynanırken anın süresi dolmasın */
export function anSureUzat(onceki: OyunDurumu, ms: number): OyunDurumu {
  if (!onceki.canliAn) return onceki;
  const s = kopya(onceki);
  s.canliAn!.bitisZamani = Date.now() + ms;
  return s;
}

// ======================================================================
// 2. ETAP: görevler, sezon kartı, sözleşmeler, kupa, büyük final, meydan okuma
// ======================================================================

// ---------- Günlük görevler ----------
function gorevUret(s: OyunDurumu) {
  if (s.gorevler.gun === s.gun) return;
  if (s.gun - s.gorevler.haftaBas >= 7) {
    s.gorevler.haftaBas = s.gun;
    s.gorevler.haftaTamam = 0;
    s.gorevler.haftaSandikAlindi = false;
  }
  const havuz = [...V.GOREV_HAVUZU].filter((g) => (g.tur === 'cay' ? s.cayOcagi > 0 : true)).sort(() => rnd() - 0.5).slice(0, 3);
  const zorluk = s.gun < 5 ? 0 : s.gun < 15 ? 1 : 2;
  const c = maliyetCarpan(s);
  s.gorevler.gun = s.gun;
  s.gorevler.liste = havuz.map((g) => {
    const idx = Math.min(g.hedefler.length - 1, Math.floor(rnd() * (zorluk + 1)));
    const hedef = g.tur === 'gelir' ? Math.round((g.hedefler[idx] * c * (1 + s.sahalar.filter(hizmette).length * 0.4)) / 500) * 500 : g.hedefler[idx];
    return { id: yeniId('g'), tur: g.tur, hedef, ilerleme: 0, xp: g.xp + idx * 5, nakit: Math.round(g.nakit * c * (1 + idx * 0.5)), alindi: false };
  });
}
/** deger: eklenecek miktar ya da (ayarla=true ise) yeni değer */
function gorevIlerlet(s: OyunDurumu, tur: import('./tipler').GorevTuru, deger = 1, ayarla = false) {
  if (!s.gorevler) return;
  for (const g of s.gorevler.liste) {
    if (g.tur !== tur || g.alindi) continue;
    const once = g.ilerleme;
    g.ilerleme = Math.min(g.hedef, ayarla ? Math.max(g.ilerleme, deger) : g.ilerleme + deger);
    if (once < g.hedef && g.ilerleme >= g.hedef) bildir(s, 'gorev', `Görev tamam: ${gorevYazi(g)}. Ödülünü al!`);
  }
}
export function gorevYazi(g: { tur: string; hedef: number }) {
  const sab = V.GOREV_HAVUZU.find((x) => x.tur === g.tur);
  return sab ? sab.yazi(g.hedef) : g.tur;
}
export function gorevAl(onceki: OyunDurumu, id: string): Sonuc {
  const g = onceki.gorevler.liste.find((x) => x.id === id);
  if (!g || g.alindi || g.ilerleme < g.hedef) return hata(onceki, 'Görev henüz tamamlanmadı.');
  const s = kopya(onceki);
  const gg = s.gorevler.liste.find((x) => x.id === id)!;
  gg.alindi = true;
  s.nakit += gg.nakit;
  s.sezon.xp += gg.xp;
  s.gorevler.haftaTamam += 1;
  return { s, mesaj: `+${gg.xp} sezon puanı${gg.nakit ? `, +${para(gg.nakit)}` : ''}` };
}
export const haftaSandigiHazir = (s: OyunDurumu) => s.gorevler.haftaTamam >= V.GOREV_HAFTA_HEDEF && !s.gorevler.haftaSandikAlindi;
export function haftaSandigiAc(onceki: OyunDurumu): Sonuc {
  if (!haftaSandigiHazir(onceki)) return hata(onceki, 'Sandık için görevleri tamamla.');
  const s = kopya(onceki);
  s.gorevler.haftaSandikAlindi = true;
  const m = Math.round(5000 * maliyetCarpan(s));
  s.nakit += m;
  s.sezon.xp += 40;
  const f = formaVer(s, 1);
  return { s, mesaj: `Haftalık sandık: +${para(m)}, +40 sezon puanı${f ? `, ${f}` : ''}` };
}
export const gorevBekleyen = (s: OyunDurumu) => (s.gorevler?.liste ?? []).filter((g) => !g.alindi && g.ilerleme >= g.hedef).length + (haftaSandigiHazir(s) ? 1 : 0) + sezonAlinabilir(s).length;

// ---------- Sezon kartı ----------
export const sezonKademe = (s: OyunDurumu) => Math.min(V.SEZON_ODULLERI.length, Math.floor(s.sezon.xp / V.SEZON_KADEME_XP));
export function sezonAlinabilir(s: OyunDurumu): number[] {
  const r: number[] = [];
  for (let k = 1; k <= sezonKademe(s); k++) if (!s.sezon.alinan.includes(k)) r.push(k);
  return r;
}
export function sezonOdulAl(onceki: OyunDurumu, kademe: number): Sonuc {
  if (!sezonAlinabilir(onceki).includes(kademe)) return hata(onceki, 'Bu kademe henüz açılmadı.');
  const s = kopya(onceki);
  const o = V.SEZON_ODULLERI[kademe - 1];
  const c = maliyetCarpan(s);
  if (o.nakit) s.nakit += Math.round(o.nakit * c);
  if (o.enerji) s.enerji = Math.min(V.MAKS_ENERJI, s.enerji + o.enerji);
  if (o.itibar) s.itibar += o.itibar;
  if (o.cayDolu && s.cayOcagi > 0) s.cayBirikim = V.CAY_SAATLIK * s.cayOcagi * c * V.CAY_DEPO_SAAT * 3;
  if (o.cayDolu && s.cayOcagi === 0) s.nakit += Math.round(3000 * c);
  let ek = '';
  if (o.forma != null) ek = formaVer(s, o.forma) ?? '';
  s.sezon.alinan.push(kademe);
  return { s, mesaj: `Sezon ödülü (${kademe}. kademe): ${o.yazi}${ek ? ` · ${ek}` : ''}` };
}
function sezonYenile(s: OyunDurumu) {
  // alınmamış ödüller otomatik verilir
  for (const k of sezonAlinabilir(s)) {
    const o = V.SEZON_ODULLERI[k - 1];
    if (o.nakit) s.nakit += Math.round(o.nakit * maliyetCarpan(s));
    if (o.itibar) s.itibar += o.itibar;
    if (o.forma != null) formaVer(s, o.forma);
  }
  s.sezon = { no: s.sezon.no + 1, baslangic: s.gun, xp: 0, alinan: [] };
  haber(s, `${s.sezon.no}. sezon başladı! Yeni sezon kartı açıldı.`, 'iyi');
  bildir(s, 'gorev', `${s.sezon.no}. sezon başladı!`);
}

// ---------- Sözleşmeler ----------
function sozlesmeGunu(s: OyunDurumu) {
  const sh = sehir(s);
  if (s.sozlesme) {
    const sz = s.sozlesme;
    const saha = bosSaha(s, sz.saat, 'kurumsal');
    if (!saha) {
      sozlesmeBoz(s, 'O saatte boş saha bulunamadı');
    } else {
      s.rezervasyonlar.push({ id: yeniId('r'), takimId: `misafir:${sz.firma}`, sahaId: saha.id, saat: sz.saat, fiyat: sz.ucret, abone: false, sozlesme: true, durum: 'bekliyor' });
    }
  }
  if (s.sozlesmeTeklifi && s.sozlesmeTeklifi.gunSayisi < 0) s.sozlesmeTeklifi = null;
  if (!s.sozlesme && !s.sozlesmeTeklifi && s.gun >= 4 && rnd() < 0.2 && s.sahalar.some(hizmette)) {
    const ana = [...s.sahalar].filter(hizmette).sort((a, b) => b.kalite - a.kalite)[0];
    const saat = sec([19, 20, 21]);
    const gunSayisi = sec([7, 10]);
    const ucret = yuvarla50(macFiyati(s, ana, 'kurumsal', saat) * 1.15);
    const minKalite = Math.min(maksKalite(ana) - 0.5, Math.max(4.5, Math.round(ana.kalite * 2) / 2));
    s.sozlesmeTeklifi = {
      id: yeniId('s'),
      firma: `${sh.ad} ${sec(V.SOZLESME_FIRMA_EKLERI)}`,
      saat,
      gunSayisi,
      kalanGun: gunSayisi,
      ucret,
      bonus: Math.round((ucret * gunSayisi * 0.6) / 100) * 100,
      ceza: Math.round((ucret * gunSayisi * 0.35) / 100) * 100,
      minKalite,
    };
    haber(s, `${s.sozlesmeTeklifi.firma} uzun dönem sözleşme teklif etti!`, 'iyi');
    bildir(s, 'sozlesme', `Yeni sözleşme teklifi: ${s.sozlesmeTeklifi.firma}`);
  }
}
function sozlesmeBoz(s: OyunDurumu, neden: string) {
  if (!s.sozlesme) return;
  const sz = s.sozlesme;
  s.nakit -= sz.ceza;
  s.itibar = Math.max(0, s.itibar - 8);
  haber(s, `${sz.firma} sözleşmesi bozuldu (${neden}). Ceza: ${para(sz.ceza)}`, 'kotu');
  bildir(s, 'kotu', `Sözleşme bozuldu: -${para(sz.ceza)}`);
  s.sozlesme = null;
}
/** false dönerse maç geliri işlenmez */
function sozlesmeMacBitti(s: OyunDurumu, r: Rezervasyon): boolean {
  const sz = s.sozlesme;
  if (!sz) return true;
  const saha = s.sahalar.find((x) => x.id === r.sahaId);
  if (saha && saha.kalite < sz.minKalite) {
    sozlesmeBoz(s, `halı kalitesi ${sz.minKalite}'in altına düştü`);
    return true;
  }
  sz.kalanGun -= 1;
  if (sz.kalanGun <= 0) {
    s.nakit += sz.bonus;
    s.toplamKazanc += sz.bonus;
    s.tumZamanKazanc += sz.bonus;
    s.itibar += 10;
    haber(s, `${sz.firma} sözleşmesi başarıyla bitti! Bonus: ${para(sz.bonus)}`, 'iyi');
    bildir(s, 'para', `Sözleşme tamam! +${para(sz.bonus)}`);
    if (rnd() < 0.5) formaVer(s, 0);
    s.sozlesme = null;
  }
  return true;
}
export function sozlesmeKabul(onceki: OyunDurumu): Sonuc {
  if (!onceki.sozlesmeTeklifi) return hata(onceki, 'Teklif yok.');
  if (onceki.sozlesme) return hata(onceki, 'Zaten bir sözleşmen var.');
  const s = kopya(onceki);
  s.sozlesme = s.sozlesmeTeklifi;
  s.sozlesmeTeklifi = null;
  const sz = s.sozlesme!;
  // bugün de oynansın
  if (!s.gunBitti && suankiSaat(s) < sz.saat) {
    const saha = bosSaha(s, sz.saat, 'kurumsal');
    if (saha) s.rezervasyonlar.push({ id: yeniId('r'), takimId: `misafir:${sz.firma}`, sahaId: saha.id, saat: sz.saat, fiyat: sz.ucret, abone: false, sozlesme: true, durum: 'bekliyor' });
  }
  return { s, mesaj: `${sz.firma} ile ${sz.gunSayisi} günlük sözleşme imzalandı!` };
}
export function sozlesmeReddet(onceki: OyunDurumu): OyunDurumu {
  const s = kopya(onceki);
  s.sozlesmeTeklifi = null;
  return s;
}
export function sozlesmeIptal(onceki: OyunDurumu): Sonuc {
  if (!onceki.sozlesme) return hata(onceki, 'Sözleşme yok.');
  const s = kopya(onceki);
  s.rezervasyonlar = s.rezervasyonlar.filter((r) => !(r.sozlesme && r.durum === 'bekliyor'));
  sozlesmeBoz(s, 'sen iptal ettin');
  return { s };
}

// ---------- Mahalle kupası ----------
function kupaGunu(s: OyunDurumu) {
  const k = s.kupa;
  if (k && !k.bitti) {
    const gunFark = s.gun - k.baslangic;
    if (!k.hazir) {
      if (gunFark >= 1) {
        s.kupa = null;
        haber(s, 'Kupa organizasyonu yapılmadı, takımlar hayal kırıklığına uğradı.', 'kotu');
      }
      return;
    }
    const tur = gunFark - 1; // 0 çeyrek, 1 yarı, 2 final
    if (tur < 0 || tur > 2) return;
    if (!k.turlar[tur]) {
      const onceki = tur === 0 ? null : k.turlar[tur - 1];
      const katilan = tur === 0 ? k.takimlar : (onceki ?? []).map((m) => m.kazanan!).filter(Boolean);
      const eslesmeler: import('./tipler').Kupa['turlar'][number] = [];
      for (let i = 0; i + 1 < katilan.length; i += 2) eslesmeler.push({ a: katilan[i], b: katilan[i + 1] });
      k.turlar[tur] = eslesmeler;
    }
    const saatler = tur === 0 ? [17, 18, 19, 20] : tur === 1 ? [19, 20] : [21];
    k.turlar[tur].forEach((m, i) => {
      const saat = saatler[i];
      const saha = [...s.sahalar].filter((x) => hizmette(x) && acikSaatler(x).includes(saat)).sort((a, b) => (b.yukseltmeler.tribun ?? 0) - (a.yukseltmeler.tribun ?? 0))[0];
      if (!saha) return;
      s.rezervasyonlar = s.rezervasyonlar.filter((r) => !(r.sahaId === saha.id && r.saat === saat));
      const bilet = Math.round(900 * maliyetCarpan(s) * (1 + 0.5 * (saha.yukseltmeler.tribun ?? 0)) * (tur === 2 ? 2 : 1));
      s.rezervasyonlar.push({ id: yeniId('k'), takimId: m.a, sahaId: saha.id, saat, fiyat: bilet, abone: false, kupa: { tur, esleme: i }, durum: 'bekliyor' });
    });
    haber(s, tur === 2 ? 'Bu akşam KUPA FİNALİ!' : tur === 1 ? 'Bugün kupada yarı final günü.' : 'Kupa başladı: çeyrek final maçları bugün.', 'bilgi');
    return;
  }
  if (s.gun >= V.KUPA_ILK && (s.gun - V.KUPA_ILK) % V.KUPA_ARALIK === 0 && s.sahalar.some(hizmette)) {
    const takimlar = tumTakimlar(sehir(s))
      .map((t) => t.id)
      .sort((a, b) => s.takimlar[b].sevgi - s.takimlar[a].sevgi)
      .slice(0, 8)
      .sort(() => rnd() - 0.5);
    s.kupa = { baslangic: s.gun, odul: 0, hazir: false, takimlar, turlar: [], bitti: false };
    haber(s, 'Mahalleler kupa istiyor! Bugün organizasyonu onaylarsan yarından itibaren 3 günlük kupa başlar.', 'bilgi');
    bildir(s, 'kupa', 'Mahalle kupası düzenlemek ister misin?');
  }
}
export function kupaHazirla(onceki: OyunDurumu, seviye: 1 | 2): Sonuc {
  const k = onceki.kupa;
  if (!k || k.hazir || k.bitti) return hata(onceki, 'Kupa yok.');
  const o = V.KUPA_ODUL[seviye - 1];
  const bedel = Math.round(o.bedel * maliyetCarpan(onceki));
  if (onceki.nakit < bedel) return hata(onceki, `Ödül havuzu için ${para(bedel)} gerekli.`);
  const s = kopya(onceki);
  s.nakit -= bedel;
  s.kupa!.odul = seviye;
  s.kupa!.hazir = true;
  for (const t of s.kupa!.takimlar) if (s.takimlar[t]) s.takimlar[t].sevgi = sinirla(s.takimlar[t].sevgi + 5, 0, 100);
  return { s, mesaj: `${o.ad} ilan edildi! Yarın çeyrek final.` };
}
export function kupaVazgec(onceki: OyunDurumu): OyunDurumu {
  const s = kopya(onceki);
  s.kupa = null;
  return s;
}
function kupaMacBitti(s: OyunDurumu, r: Rezervasyon) {
  const k = s.kupa;
  if (!k || !r.kupa) return;
  const m = k.turlar[r.kupa.tur]?.[r.kupa.esleme];
  if (!m) return;
  s.nakit += r.fiyat;
  s.bugunGelir += r.fiyat;
  s.toplamKazanc += r.fiyat;
  s.tumZamanKazanc += r.fiyat;
  s.bugunMac += 1;
  const ga = s.takimlar[m.a]?.sevgi ?? 50;
  const gb = s.takimlar[m.b]?.sevgi ?? 50;
  const aKazanir = rnd() < 0.5 + (ga - gb) / 300;
  let sa = Math.floor(rnd() * 5);
  let sb = Math.floor(rnd() * 5);
  if (aKazanir && sa <= sb) sa = sb + 1;
  if (!aKazanir && sb <= sa) sb = sa + 1;
  m.skor = [sa, sb];
  m.kazanan = aKazanir ? m.a : m.b;
  r.skor = [sa, sb];
  for (const t of [m.a, m.b]) if (s.takimlar[t]) s.takimlar[t].sevgi = sinirla(s.takimlar[t].sevgi + 3, 0, 100);
  if (s.takimlar[m.kazanan]) s.takimlar[m.kazanan].sevgi = sinirla(s.takimlar[m.kazanan].sevgi + 4, 0, 100);
  if (r.kupa.tur === 2) {
    k.sampiyon = m.kazanan;
    k.bitti = true;
    s.kupaSayisi += 1;
    const o = V.KUPA_ODUL[Math.max(0, k.odul - 1)];
    s.itibar += o.itibar;
    s.bugunItibar += o.itibar;
    const t = takimBul(s, m.kazanan);
    if (t) kontrolEkle(s, t.mahalleId, o.kontrol);
    if (rnd() < 0.6) formaVer(s, k.odul === 2 ? 1 : 0);
    haber(s, `KUPA ŞAMPİYONU: ${takimAdi(s, m.kazanan)}! ${t ? mahalleAdi(s, t.mahalleId) : ''} sokaklara döküldü.`, 'iyi');
    bildir(s, 'kupa', `Kupa şampiyonu: ${takimAdi(s, m.kazanan)}!`);
  } else {
    bildir(s, 'kupa', `Kupa: ${takimAdi(s, m.kazanan)} tur atladı (${sa}-${sb})`);
  }
}

// ---------- Büyük final ----------
function finalKur(s: OyunDurumu) {
  s.final = { gun: s.gun + 2, hazirlik: { yildiz: false, kamp: false, taraftar: false }, deneme: 0 };
  s.bekleyenHikaye.push(`final_${s.sehirId}`);
  haber(s, `${sehir(s).karakter.rakip} seni BÜYÜK FİNALE çağırdı! Kazanan şehri alır.`, 'bilgi');
}
function finalGunu(s: OyunDurumu) {
  if (!s.final && !s.finalKazanildi && Object.values(s.mahalleSahip).every(Boolean)) finalKur(s);
  const f = s.final;
  if (!f || f.gun !== s.gun || s.finalKazanildi) return;
  const saha = [...s.sahalar].filter(hizmette).sort((a, b) => (b.tip === 'arena' ? 1 : 0) - (a.tip === 'arena' ? 1 : 0) || (b.yukseltmeler.tribun ?? 0) - (a.yukseltmeler.tribun ?? 0))[0];
  if (!saha) return;
  s.rezervasyonlar = s.rezervasyonlar.filter((r) => !(r.sahaId === saha.id && r.saat === 21));
  s.rezervasyonlar.push({ id: yeniId('f'), takimId: `misafir:${sehir(s).karakter.rakipSaha} SK`, sahaId: saha.id, saat: 21, fiyat: 0, abone: false, final: true, durum: 'bekliyor' });
  haber(s, 'BU AKŞAM BÜYÜK FİNAL! Saat 21:00.', 'bilgi');
}
export function benimGucum(s: OyunDurumu): number {
  const f = s.final;
  let g = 40 + Math.min(30, s.itibar / 40) + s.formalar.length * 0.3 + s.efsaneYildiz * 2 + takimGucuEk(s);
  if (f?.hazirlik.yildiz) g += 8;
  if (f?.hazirlik.kamp) g += 5;
  if (f?.hazirlik.taraftar) g += 4;
  return Math.round(g);
}
/** 3. etap: kendi takımın gücü (yoksa 0) */
export function takimGucuEk(s: OyunDurumu): number {
  if (!s.takim?.kuruldu || s.takim.oyuncular.length === 0) return 0;
  return Math.round(takimGucu(s) / 8);
}
export function finalKazanmaSansi(s: OyunDurumu): number {
  const fark = benimGucum(s) - V.rakipGucu(s.sehirSira, s.final?.deneme ?? 0);
  return 1 / (1 + Math.exp(-fark / 6));
}
export function finalHazirlik(onceki: OyunDurumu, tur: 'yildiz' | 'kamp' | 'taraftar'): Sonuc {
  const f = onceki.final;
  if (!f || f.hazirlik[tur]) return hata(onceki, 'Bu hazırlık yapıldı.');
  const c = maliyetCarpan(onceki);
  const bedel = tur === 'yildiz' ? 8000 * c : tur === 'taraftar' ? 3000 * c : 0;
  if (onceki.nakit < bedel) return hata(onceki, `${para(bedel)} gerekli.`);
  if (tur === 'kamp' && onceki.enerji < 30) return hata(onceki, '30 enerji gerekli.');
  const s = kopya(onceki);
  s.nakit -= bedel;
  if (tur === 'kamp') s.enerji -= 30;
  s.final!.hazirlik[tur] = true;
  const yazi = { yildiz: 'Eski bir yıldız takıma katıldı!', kamp: 'Takım kampa girdi, herkes formda.', taraftar: 'Otobüsler tutuldu, tribünler dolacak!' }[tur];
  return { s, mesaj: yazi };
}
function finalBitti(s: OyunDurumu, r: Rezervasyon) {
  const f = s.final;
  if (!f) return;
  const kazandik = rnd() < finalKazanmaSansi(s);
  let a = 1 + Math.floor(rnd() * 4);
  let b = Math.floor(rnd() * 4);
  if (kazandik && a <= b) a = b + 1;
  if (!kazandik && b <= a) b = a + 1;
  r.skor = [a, b];
  f.sonuc = { kazandik, skor: [a, b] };
  const gelir = Math.round(6000 * maliyetCarpan(s) * (f.hazirlik.taraftar ? 1.6 : 1));
  s.nakit += gelir;
  s.bugunGelir += gelir;
  s.toplamKazanc += gelir;
  s.tumZamanKazanc += gelir;
  if (kazandik) {
    s.finalKazanildi = true;
    s.itibar += 30;
    s.bugunItibar += 30;
    formaVer(s, 2);
    haber(s, `BÜYÜK FİNALİ KAZANDIN (${a}-${b})! ${sehir(s).ad} artık tamamen senin.`, 'iyi');
    bildir(s, 'kupa', `ŞAMPİYON! Final ${a}-${b}`);
    s.bekleyenHikaye.push(`fetih_${s.sehirId}`);
  } else {
    f.deneme += 1;
    f.gun = s.gun + 3;
    f.hazirlik = { yildiz: false, kamp: false, taraftar: false };
    s.itibar = Math.max(0, s.itibar - 5);
    haber(s, `Finali ${a}-${b} kaybettin. ${sehir(s).karakter.rakip} rövanşı 3 gün sonra kabul etti.`, 'kotu');
    bildir(s, 'kotu', `Final kaybedildi (${a}-${b}). Rövanş 3 gün sonra!`);
  }
}

// ---------- Rakip meydan okuması ----------
function meydanBitti(s: OyunDurumu, r: Rezervasyon) {
  const p = 1 / (1 + Math.exp(-(benimGucum(s) - (V.rakipGucu(s.sehirSira, 0) - 8)) / 6));
  const kazandik = rnd() < p;
  let a = Math.floor(rnd() * 5);
  let b = Math.floor(rnd() * 5);
  if (kazandik && a <= b) a = b + 1;
  if (!kazandik && b <= a) b = a + 1;
  r.skor = [a, b];
  const acik = Object.keys(s.mahalleKontrol).filter((m) => !s.mahalleSahip[m]).sort(() => rnd() - 0.5).slice(0, 2);
  for (const m of acik) kontrolEkle(s, m, kazandik ? 6 : -4);
  s.itibar = Math.max(0, s.itibar + (kazandik ? 6 : -2));
  const rk = sehir(s).karakter.rakip;
  haber(s, kazandik ? `${rk}'in takımını ${a}-${b} yendin! Mahalleler sana yöneldi.` : `${rk}'in takımı ${b}-${a} kazandı. Mahallede dedikodu var.`, kazandik ? 'iyi' : 'kotu');
  bildir(s, kazandik ? 'mahalle' : 'kotu', kazandik ? `Meydan okumayı kazandın: ${a}-${b}` : `Meydan okumayı kaybettin: ${a}-${b}`);
}

// ============================================
// 3. ETAP: Saha Bizim SK (kendi takımın) ve tesis süsleme
// ============================================
export function bosTakim(): import('./tipler').KendiTakim {
  return { kuruldu: false, oyuncular: [], adaylar: [], adayGun: 0, antrenmanGun: 0, lig: null, ligSezon: 0, sampiyonluk: 0 };
}
export function takimKurulabilir(s: OyunDurumu) {
  return sahipMahalleSayisi(s) >= 1 || s.sehirSira > 0;
}
/** Kadronun gücü: en iyi 5 oyuncunun ortalaması (eksik oyuncu 20 sayılır) + mevki uyumu */
export function takimGucu(s: OyunDurumu): number {
  const o = [...s.takim.oyuncular].sort((a, b) => b.guc - a.guc).slice(0, 5);
  const toplam = o.reduce((x, y) => x + y.guc, 0) + (5 - o.length) * 20;
  const mevkiler = new Set(o.map((x) => x.mevki));
  const uyum = (mevkiler.has('K') ? 3 : -4) + mevkiler.size;
  return Math.round(toplam / 5 + uyum);
}
function oyuncuUret(s: OyunDurumu, takimId: string, mevki?: import('./tipler').Mevki): import('./tipler').Oyuncu {
  const sh = sehir(s);
  const havuz = V.OYUNCU_ADLARI[sh.id] && rnd() < 0.5 ? V.OYUNCU_ADLARI[sh.id] : V.OYUNCU_ADLARI.tr;
  const m = mevki ?? sec(['K', 'D', 'D', 'O', 'O', 'F', 'F'] as import('./tipler').Mevki[]);
  const sevgi = s.takimlar[takimId]?.sevgi ?? 30;
  const guc = Math.round(sinirla(32 + sevgi / 4 + rnd() * 14 + s.sehirSira * 5 + s.takim.ligSezon, 25, 92));
  const bedel = yuvarla50(guc * guc * 2.2 * maliyetCarpan(s));
  return { id: yeniId('o'), ad: `${sec(havuz)} ${sec(V.LAKAPLAR[m])}`, mevki: m, guc, nereden: takimId, bedel };
}
function adayYenile(s: OyunDurumu) {
  if (!s.takim.kuruldu) return;
  const uygun = Object.entries(s.takimlar)
    .filter(([id, t]) => t.sevgi >= 40 && takimBul(s, id))
    .map(([id]) => id);
  const kaynak = uygun.length ? uygun : tumTakimlar(sehir(s)).map((t) => t.id).slice(0, 4);
  s.takim.adaylar = Array.from({ length: 3 }, () => oyuncuUret(s, sec(kaynak)));
  s.takim.adayGun = s.gun;
}
export function takimKur(onceki: OyunDurumu): Sonuc {
  if (onceki.takim.kuruldu) return hata(onceki, 'Takım zaten kurulu.');
  if (!takimKurulabilir(onceki)) return hata(onceki, 'Önce bir mahalleyi tamamen kazan.');
  const bedel = Math.round(V.TAKIM_KURULUS * maliyetCarpan(onceki));
  if (onceki.nakit < bedel) return hata(onceki, `Kuruluş için ${para(bedel)} gerekli.`);
  const s = kopya(onceki);
  s.nakit -= bedel;
  s.takim.kuruldu = true;
  // çekirdek kadro: mahalleden 3 gönüllü
  const ilk = sehir(s).mahalleler[0].takimlar[0].id;
  s.takim.oyuncular = (['K', 'D', 'F'] as const).map((m) => ({ ...oyuncuUret(s, ilk, m), guc: 30 + Math.floor(rnd() * 8) }));
  adayYenile(s);
  ligKur(s);
  haber(s, 'Saha Bizim SK kuruldu! Mahalle takımlarından oyuncu topla, Cumartesi lig maçına çık.', 'iyi');
  return { s, mesaj: 'Saha Bizim SK kuruldu! 3 gönüllü kadroda.' };
}
export function oyuncuAl(onceki: OyunDurumu, id: string): Sonuc {
  const a = onceki.takim.adaylar.find((x) => x.id === id);
  if (!a) return hata(onceki, 'Oyuncu bulunamadı.');
  if (onceki.takim.oyuncular.length >= V.KADRO_MAKS) return hata(onceki, `Kadro dolu (en fazla ${V.KADRO_MAKS}). Önce birini bırak.`);
  if (onceki.nakit < a.bedel) return hata(onceki, `${para(a.bedel)} gerekli.`);
  const s = kopya(onceki);
  s.nakit -= a.bedel;
  s.takim.oyuncular.push(a);
  s.takim.adaylar = s.takim.adaylar.filter((x) => x.id !== id);
  if (s.takimlar[a.nereden]) s.takimlar[a.nereden].sevgi = sinirla(s.takimlar[a.nereden].sevgi + 4, 0, 100);
  return { s, mesaj: `${a.ad} imzayı attı! ${takimAdi(s, a.nereden)} gururlu.` };
}
export function oyuncuBirak(onceki: OyunDurumu, id: string): OyunDurumu {
  const s = kopya(onceki);
  s.takim.oyuncular = s.takim.oyuncular.filter((x) => x.id !== id);
  return s;
}
export function adaylariYenile(onceki: OyunDurumu): Sonuc {
  const bedel = Math.round(800 * maliyetCarpan(onceki));
  if (onceki.nakit < bedel) return hata(onceki, `${para(bedel)} gerekli.`);
  const s = kopya(onceki);
  s.nakit -= bedel;
  adayYenile(s);
  return { s, mesaj: 'Gözlemci yeni isimler getirdi.' };
}
export function antrenmanYap(onceki: OyunDurumu): Sonuc {
  if (!onceki.takim.kuruldu || onceki.takim.oyuncular.length === 0) return hata(onceki, 'Önce takım kur.');
  if (onceki.takim.antrenmanGun === onceki.gun) return hata(onceki, 'Bugün antrenman yapıldı.');
  if (onceki.enerji < V.ANTRENMAN_ENERJI) return hata(onceki, `${V.ANTRENMAN_ENERJI} enerji gerekli.`);
  const s = kopya(onceki);
  s.enerji -= V.ANTRENMAN_ENERJI;
  s.takim.antrenmanGun = s.gun;
  for (const o of s.takim.oyuncular) o.guc = Math.min(99, o.guc + (o.guc < 60 ? 2 : 1));
  return { s, mesaj: 'Antrenman tamam: herkes güçlendi!' };
}
function ligKur(s: OyunDurumu) {
  const sh = sehir(s);
  const mah = [...sh.mahalleler].sort(() => rnd() - 0.5).slice(0, 4);
  const taban = V.ligRakipGucu(s.sehirSira, s.takim.ligSezon);
  const takimlar: import('./tipler').LigTakim[] = [
    { id: 'biz', ad: 'Saha Bizim SK', guc: 0, o: 0, g: 0, b: 0, m: 0, ag: 0, yg: 0 },
    { id: 'rakip', ad: `${sh.karakter.rakipSaha} SK`, guc: taban + 8, o: 0, g: 0, b: 0, m: 0, ag: 0, yg: 0 },
    ...mah.map((m, i) => ({ id: `l${i}`, ad: `${m.ad} ${V.LIG_EKLERI[i % V.LIG_EKLERI.length]}`, guc: taban + Math.round(rnd() * 10 - 5), o: 0, g: 0, b: 0, m: 0, ag: 0, yg: 0 })),
  ];
  // 6 takım, 5 hafta: dairesel fikstür
  const ids = takimlar.map((t) => t.id);
  const fikstur: [string, string][][] = [];
  const dön = ids.slice(1);
  for (let h = 0; h < 5; h++) {
    const dizi = [ids[0], ...dön];
    const hafta: [string, string][] = [];
    for (let i = 0; i < 3; i++) hafta.push([dizi[i], dizi[5 - i]]);
    fikstur.push(hafta);
    dön.unshift(dön.pop()!);
  }
  s.takim.ligSezon += 1;
  s.takim.lig = { sezon: s.takim.ligSezon, hafta: 0, takimlar, fikstur, sonuclar: [], bitti: false };
}
function golSay(fark: number) {
  const l = Math.max(0.4, 2.3 + fark / 12);
  let n = 0;
  let p = Math.exp(-l);
  let k = p;
  const u = rnd();
  while (u > k && n < 9) {
    n++;
    p *= l / n;
    k += p;
  }
  return n;
}
function ligMaciOyna(lig: import('./tipler').Lig, a: string, b: string, gA: number, gB: number): [number, number] {
  const sa = golSay(gA - gB);
  const sb = golSay(gB - gA);
  const ta = lig.takimlar.find((t) => t.id === a)!;
  const tb = lig.takimlar.find((t) => t.id === b)!;
  ta.o++; tb.o++;
  ta.ag += sa; ta.yg += sb; tb.ag += sb; tb.yg += sa;
  if (sa > sb) { ta.g++; tb.m++; } else if (sb > sa) { tb.g++; ta.m++; } else { ta.b++; tb.b++; }
  lig.sonuclar.push({ hafta: lig.hafta, a, b, skor: [sa, sb] });
  return [sa, sb];
}
export function ligPuan(t: import('./tipler').LigTakim) {
  return t.g * 3 + t.b;
}
export function ligSiralama(lig: import('./tipler').Lig) {
  return [...lig.takimlar].sort((x, y) => ligPuan(y) - ligPuan(x) || y.ag - y.yg - (x.ag - x.yg) || y.ag - x.ag);
}
export function ligSiradakiRakip(s: OyunDurumu): string | null {
  const l = s.takim.lig;
  if (!l || l.bitti) return null;
  const m = l.fikstur[l.hafta]?.find((x) => x.includes('biz'));
  if (!m) return null;
  const id = m[0] === 'biz' ? m[1] : m[0];
  return l.takimlar.find((t) => t.id === id)?.ad ?? null;
}
export function ligKalanGun(s: OyunDurumu) {
  return (V.LIG_GUNU - V.haftaGunu(s.gun) + 7) % 7;
}
function ligGunu(s: OyunDurumu) {
  const t = s.takim;
  if (!t?.kuruldu) return;
  if (s.gun - t.adayGun >= 2 || t.adaylar.length === 0) adayYenile(s);
  if (!t.lig || (t.lig.bitti && V.haftaGunu(s.gun) === 1)) ligKur(s);
  const l = t.lig!;
  if (l.bitti || V.haftaGunu(s.gun) !== V.LIG_GUNU) return;
  const rakip = ligSiradakiRakip(s);
  const saha = [...s.sahalar].filter((x) => hizmette(x) && acikSaatler(x).includes(V.LIG_SAAT)).sort((a, b) => (b.yukseltmeler.tribun ?? 0) - (a.yukseltmeler.tribun ?? 0))[0];
  if (saha && rakip) {
    s.rezervasyonlar = s.rezervasyonlar.filter((r) => !(r.sahaId === saha.id && r.saat === V.LIG_SAAT));
    s.rezervasyonlar.push({ id: yeniId('l'), takimId: `misafir:${rakip}`, sahaId: saha.id, saat: V.LIG_SAAT, fiyat: 0, abone: false, lig: true, durum: 'bekliyor' });
    haber(s, `Bu akşam ${V.saatYazi(V.LIG_SAAT)}: Saha Bizim SK - ${rakip} (lig ${l.hafta + 1}. hafta)`, 'bilgi');
  } else {
    ligHaftaOyna(s, null);
  }
}
function ligHaftaOyna(s: OyunDurumu, r: Rezervasyon | null) {
  const l = s.takim.lig;
  if (!l || l.bitti) return;
  const biz = l.takimlar.find((t) => t.id === 'biz')!;
  biz.guc = s.takim.oyuncular.length >= 5 ? takimGucu(s) : 0;
  let bizimSkor: [number, number] | null = null;
  let rakipAd = '';
  for (const [a, b] of l.fikstur[l.hafta]) {
    const ga = a === 'biz' ? biz.guc : l.takimlar.find((t) => t.id === a)!.guc;
    const gb = b === 'biz' ? biz.guc : l.takimlar.find((t) => t.id === b)!.guc;
    if ((a === 'biz' || b === 'biz') && biz.guc === 0) {
      // eksik kadro: hükmen 0-3
      const ta = l.takimlar.find((t) => t.id === a)!;
      const tb = l.takimlar.find((t) => t.id === b)!;
      const bizA = a === 'biz';
      const sk: [number, number] = bizA ? [0, 3] : [3, 0];
      ta.o++; tb.o++; ta.ag += sk[0]; ta.yg += sk[1]; tb.ag += sk[1]; tb.yg += sk[0];
      if (bizA) { tb.g++; ta.m++; } else { ta.g++; tb.m++; }
      l.sonuclar.push({ hafta: l.hafta, a, b, skor: sk });
      bizimSkor = [0, 3];
      rakipAd = (bizA ? tb : ta).ad;
      continue;
    }
    const sk = ligMaciOyna(l, a, b, ga, gb);
    if (a === 'biz') { bizimSkor = sk; rakipAd = l.takimlar.find((t) => t.id === b)!.ad; }
    if (b === 'biz') { bizimSkor = [sk[1], sk[0]]; rakipAd = l.takimlar.find((t) => t.id === a)!.ad; }
  }
  const c = maliyetCarpan(s);
  if (bizimSkor) {
    if (r) r.skor = bizimSkor;
    const [x, y] = bizimSkor;
    const gelir = Math.round((x > y ? 2200 : x === y ? 1200 : 600) * c);
    s.nakit += gelir;
    s.bugunGelir += gelir;
    s.toplamKazanc += gelir;
    s.tumZamanKazanc += gelir;
    if (x > y) {
      s.itibar += 4;
      s.bugunItibar += 4;
      for (const o of s.takim.oyuncular) o.guc = Math.min(99, o.guc + (rnd() < 0.3 ? 1 : 0));
    }
    const sonuc = biz.guc === 0 ? 'hükmen yenildi (kadroda 5 oyuncu yok)' : x > y ? 'kazandı' : x === y ? 'berabere kaldı' : 'kaybetti';
    haber(s, `Lig: Saha Bizim SK ${x}-${y} ${rakipAd} · ${sonuc}. +${para(gelir)}`, x > y ? 'iyi' : x === y ? 'bilgi' : 'kotu');
    bildir(s, x > y ? 'kupa' : x === y ? 'iyi' : 'kotu', `Lig: ${x}-${y} ${rakipAd}`);
  }
  l.hafta += 1;
  if (l.hafta >= l.fikstur.length) {
    l.bitti = true;
    const sira = ligSiralama(l);
    l.sampiyon = sira[0].id;
    const bizSira = sira.findIndex((t) => t.id === 'biz') + 1;
    if (bizSira === 1) {
      s.takim.sampiyonluk += 1;
      const odul = Math.round(15000 * c);
      s.nakit += odul;
      s.toplamKazanc += odul;
      s.tumZamanKazanc += odul;
      s.itibar += 25;
      s.bugunItibar += 25;
      formaVer(s, 2);
      haber(s, `SAHA BİZİM SK ŞAMPİYON! +${para(odul)}, +25 itibar ve efsane forma.`, 'iyi');
      bildir(s, 'kupa', 'Lig şampiyonu: Saha Bizim SK!');
    } else {
      const odul = Math.round((bizSira === 2 ? 6000 : bizSira === 3 ? 3000 : 1000) * c);
      s.nakit += odul;
      haber(s, `Lig bitti: ${bizSira}. olduk (+${para(odul)}). Şampiyon ${sira[0].ad}. Yeni sezon Pazartesi başlıyor.`, 'bilgi');
    }
  }
}
function ligMacBitti(s: OyunDurumu, r: Rezervasyon) {
  ligHaftaOyna(s, r);
}

// ---------- Tesis süsleme ----------
export type SusTuru = 'cim' | 'tabela' | 'bayrak' | 'maskot';
export function susSecenekleri(tur: SusTuru): { ad: string; bedel: number }[] {
  return tur === 'cim' ? V.CIM_SECENEK : tur === 'tabela' ? V.TABELA_SECENEK : tur === 'bayrak' ? V.BAYRAK_SECENEK : V.MASKOT_SECENEK;
}
export function susAcikMi(s: OyunDurumu, tur: SusTuru, i: number) {
  return i === 0 || s.tesisSus.acik.includes(`${tur}${i}`);
}
export function susSec(onceki: OyunDurumu, tur: SusTuru, i: number): Sonuc {
  const sec_ = susSecenekleri(tur)[i];
  if (!sec_) return hata(onceki, 'Seçenek yok.');
  const s = kopya(onceki);
  if (!susAcikMi(s, tur, i)) {
    const bedel = Math.round(sec_.bedel * maliyetCarpan(s));
    if (s.nakit < bedel) return hata(onceki, `${para(bedel)} gerekli.`);
    s.nakit -= bedel;
    s.tesisSus.acik.push(`${tur}${i}`);
    s.itibar += 2;
  }
  s.tesisSus[tur] = i;
  return { s, mesaj: `${sec_.ad} seçildi!` };
}
