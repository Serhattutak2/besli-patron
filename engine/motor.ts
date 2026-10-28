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
  return m
    .replace(/\{takim\}/g, takimId ? takimAdi(s, takimId) : 'Takım')
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
type Kalici = Partial<Pick<OyunDurumu, 'efsaneYildiz' | 'formalar' | 'istatistik' | 'tumZamanKazanc' | 'girisSerisi' | 'sonGirisTarihi' | 'miniOyunRekor' | 'hikayeGoruldu'>>;

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
  };
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
    const sans = anAdayi.takimId.startsWith('misafir:') ? 0.12 : 0.24;
    if (rnd() < sans) anBaslat(s, anAdayi, simdi);
  }
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
    return;
  }
  s.nakit += r.fiyat;
  s.bugunGelir += r.fiyat;
  s.toplamKazanc += r.fiyat;
  s.tumZamanKazanc += r.fiyat;
  s.bugunMac += 1;
  s.istatistik.mac += 1;
  if (saha) {
    const azalt = 1 - 0.25 * (s.personel.temizlikci ?? 0) - formaBonus(s, 'yipranma') / 100;
    saha.kalite = Math.max(1, saha.kalite - V.YIPRANMA * Math.max(0.2, azalt));
  }
  cayEkle(s, V.CAY_MAC_BASI * s.cayOcagi * maliyetCarpan(s));
  const itibarCarpan = 1 + formaBonus(s, 'itibar') / 100;
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
  const yeni = sinirla((s.mahalleKontrol[mahalleId] ?? 0) + miktar, 0, 100);
  s.mahalleKontrol[mahalleId] = yeni;
  if (yeni >= 100) {
    s.mahalleSahip[mahalleId] = true;
    s.itibar += 25;
    const ad = mahalleAdi(s, mahalleId);
    haber(s, `${ad} artık senin! Muhtar her gün destek verecek.`, 'iyi');
    bildir(s, 'mahalle', `${ad} senin oldu!`);
    if (!s.hikayeGoruldu.ilk_mahalle) s.bekleyenHikaye.push('ilk_mahalle');
    if (Object.values(s.mahalleSahip).every(Boolean)) s.bekleyenHikaye.push(`fetih_${s.sehirId}`);
  }
}

// ---------- Canlı anlar ----------
function anBaslat(s: OyunDurumu, r: Rezervasyon, simdi: number) {
  const saha = s.sahalar.find((x) => x.id === r.sahaId);
  const t = r.takimId.startsWith('misafir:') ? null : takimBul(s, r.takimId);
  const uygun = V.CANLI_ANLAR.filter((a) => {
    if (a.kosul === 'gece' && r.saat < 21) return false;
    if (a.kosul === 'yagmur' && s.hava !== 'yagmur') return false;
    if (a.kosul === 'kameraYok' && (saha?.yukseltmeler.kamera ?? 0) > 0) return false;
    if (a.kosul === 'amator' && t?.tip !== 'amator' && rnd() < 0.7) return false;
    if (a.kotu && rnd() < 0.3 * (s.personel.guvenlik ?? 0)) return false;
    return true;
  });
  if (uygun.length === 0) return;
  const an = sec(uygun);
  s.canliAn = { id: yeniId('a'), anId: an.id, rezId: r.id, takimId: r.takimId, bitisZamani: simdi + 12000 };
}

export function anTanim(s: OyunDurumu) {
  if (!s.canliAn) return null;
  const an = V.CANLI_ANLAR.find((a) => a.id === s.canliAn!.anId)!;
  return {
    ...an,
    metin: metinDoldur(s, an.metin, s.canliAn.takimId),
    secenekler: an.secenekler.map((x) => ({ ...x, yazi: metinDoldur(s, x.yazi, s.canliAn!.takimId), sonuc: metinDoldur(s, x.sonuc, s.canliAn!.takimId) })),
  };
}

/** secim null = süre doldu */
export function anCevapla(onceki: OyunDurumu, secim: number | null): OyunDurumu {
  if (!onceki.canliAn) return onceki;
  const s = kopya(onceki);
  const ca = s.canliAn!;
  const an = V.CANLI_ANLAR.find((a) => a.id === ca.anId)!;
  const sc = secim == null ? an.sessiz : an.secenekler[secim];
  const e = sc.etki;
  if (e.nakit) s.nakit += e.nakit * maliyetCarpan(s);
  if (e.enerji) s.enerji = sinirla(s.enerji + e.enerji, 0, V.MAKS_ENERJI);
  if (e.itibar) {
    s.itibar = Math.max(0, s.itibar + e.itibar);
    s.bugunItibar += e.itibar;
  }
  const t = ca.takimId.startsWith('misafir:') ? null : takimBul(s, ca.takimId);
  if (e.sevgi && t) s.takimlar[t.id].sevgi = sinirla(s.takimlar[t.id].sevgi + e.sevgi, 0, 100);
  if (e.kontrol) {
    const m = t?.mahalleId ?? sec(Object.keys(s.mahalleKontrol));
    kontrolEkle(s, m, e.kontrol);
  }
  if (e.kalite) {
    const r = s.rezervasyonlar.find((x) => x.id === ca.rezId);
    const saha = s.sahalar.find((x) => x.id === r?.sahaId);
    if (saha) saha.kalite = Math.max(1, saha.kalite + e.kalite);
  }
  if (secim != null) s.istatistik.anCevap += 1;
  bildir(s, secim == null ? 'kotu' : 'an', metinDoldur(s, sc.sonuc, ca.takimId));
  s.canliAn = null;
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
  s.rezervasyonlar.push({ id: yeniId('r'), takimId: t.takimId, sahaId: saha.id, saat: t.saat, fiyat: t.fiyat, abone: false, durum: 'bekliyor' });
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
  return Math.round(V.BAKIM_UCRET * maliyetCarpan(s));
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
export function hizAyarla(onceki: OyunDurumu, hiz: 1 | 2 | 4): OyunDurumu {
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
  const kavga = rnd() < hakem.kavgaSans;
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
  let havuz = V.FORMALAR.filter((f) => !s.formalar.includes(f.id) && f.nadirlik === nad);
  if (havuz.length === 0) havuz = V.FORMALAR.filter((f) => !s.formalar.includes(f.id) && f.nadirlik >= enAzNadirlik);
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
  if ((s.bugunReklam.__gun ?? 0) >= 2) return false;
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
  const baski = Math.max(0.3, V.RAKIP_BASKI * (1 + s.sehirSira * 0.12) - s.itibar / 1500);
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
  const etk = bugununEtkinligi(new Date(simdi));
  haber(s, `${s.gun}. gün, ${V.GUN_ADLARI[hg]}. Hava: ${V.HAVALAR[s.hava].ad}. ${etk.ad}.`, 'bilgi');
  teklifUret(s, V.ACILIS_SAATI - 1, 3);
  return s;
}

function rakipHamlesi(s: OyunDurumu) {
  const sh = sehir(s);
  const r = rnd();
  if (r < 0.4) {
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
export const tasinabilir = (s: OyunDurumu) => Object.values(s.mahalleSahip).every(Boolean);
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
  return s.sahalar.some((x) => (x.yukseltmeler.skorbord ?? 0) > 0) && reklamHakki(s, 'sponsor') > 0;
}
export function insaatHizlanabilir(s: OyunDurumu, sahaId: string) {
  const saha = s.sahalar.find((x) => x.id === sahaId);
  return !!saha && saha.insaatBitisDakika != null && reklamHakki(s, 'insaat') > 0;
}
export function sponsorOdulu(s: OyunDurumu) {
  const ekran = s.sahalar.filter((x) => (x.yukseltmeler.skorbord ?? 0) > 0).length;
  return Math.round(700 * maliyetCarpan(s) * (1 + 0.5 * (ekran - 1)) * (1 + s.efsaneYildiz * 0.05));
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
      mesaj = `Dev ekranda sponsor reklamı döndü: +${para(m)}`;
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
