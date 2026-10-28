// ============================================
// SAHA BİZİM — engine/takvim.ts
// Gerçek tarihe bağlı etkinlikler ve mevsime göre hava.
// (Dini bayram tarihleri yaklaşıktır; yıllar ilerledikçe listeye ekleme yapılır.)
// ============================================
import type { TakimTipi } from './tipler';

export type TakvimEtkinlik = {
  id: string;
  ad: string;
  aciklama: string;
  saatCarpan: (saat: number) => number;
  tipCarpan?: Partial<Record<TakimTipi, number>>;
  derbiCarpan?: number;
};

type Aralik = { bas: string; bit: string };
const RAMAZAN: Aralik[] = [
  { bas: '2026-02-18', bit: '2026-03-19' },
  { bas: '2027-02-08', bit: '2027-03-09' },
  { bas: '2028-01-28', bit: '2028-02-25' },
];
const BAYRAM: Aralik[] = [
  { bas: '2026-03-20', bit: '2026-03-22' },
  { bas: '2026-05-27', bit: '2026-05-30' },
  { bas: '2027-03-10', bit: '2027-03-12' },
  { bas: '2027-05-16', bit: '2027-05-19' },
  { bas: '2028-02-26', bit: '2028-02-28' },
  { bas: '2028-05-04', bit: '2028-05-07' },
];

export function tarihYazi(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${g}`;
}
const icinde = (t: string, a: Aralik[]) => a.some((x) => t >= x.bas && t <= x.bit);

const sabit = (c: number) => () => c;

export function bugununEtkinligi(d: Date = new Date()): TakvimEtkinlik {
  const t = tarihYazi(d);
  const ay = d.getMonth() + 1;
  const gun = d.getDate();
  if (icinde(t, BAYRAM))
    return {
      id: 'bayram', ad: 'Bayram Kupası', aciklama: 'Bayramda herkes sahada! Tüm talepler artıyor.',
      saatCarpan: sabit(1.35), tipCarpan: { aile: 1.6 },
    };
  if (icinde(t, RAMAZAN))
    return {
      id: 'ramazan', ad: 'Ramazan Geceleri', aciklama: 'İftardan sonra sahalar dolup taşıyor, gündüz sakin.',
      saatCarpan: (s) => (s >= 21 ? 1.7 : s >= 17 ? 0.5 : 0.65),
    };
  if (ay === 10 && gun >= 25)
    return {
      id: 'cumhuriyet', ad: 'Cumhuriyet Kupası', aciklama: '29 Ekim haftası: derbi gelirleri yüzde 50 fazla.',
      saatCarpan: sabit(1.1), derbiCarpan: 1.5,
    };
  if (ay === 4 && gun >= 20 && gun <= 26)
    return {
      id: '23nisan', ad: '23 Nisan Çocuk Şenliği', aciklama: 'Aileler çocuklarıyla sahaya akın ediyor.',
      saatCarpan: (s) => (s <= 17 ? 1.3 : 1), tipCarpan: { aile: 2.2 },
    };
  if (ay === 5 && gun >= 15 && gun <= 21)
    return {
      id: '19mayis', ad: '19 Mayıs Gençlik Kupası', aciklama: 'Öğrenciler ve amatörler kupa havasında.',
      saatCarpan: sabit(1.1), tipCarpan: { ogrenci: 1.8, amator: 1.4 },
    };
  if (ay === 12 && gun >= 20)
    return {
      id: 'yilbasi', ad: 'Yılbaşı Turnuvası', aciklama: 'Şirketler yıl sonu maçı yapıyor. Kurumsal talep iki katı.',
      saatCarpan: sabit(1.05), tipCarpan: { kurumsal: 2, ofis: 1.6 },
    };
  if (ay >= 6 && ay <= 8)
    return {
      id: 'yaz', ad: 'Yaz Gece Ligi', aciklama: 'Gündüz sıcak, geceler bitmiyor. Gece maçları altın değerinde.',
      saatCarpan: (s) => (s >= 21 ? 1.35 : s <= 16 ? 0.75 : 1),
    };
  if (ay === 9)
    return {
      id: 'okul', ad: 'Okullar Açılıyor', aciklama: 'Gündüzler sakinleşti, akşamları ofis takımları geri döndü.',
      saatCarpan: (s) => (s <= 16 ? 0.8 : 1.1), tipCarpan: { ofis: 1.4 },
    };
  if (ay === 2 && gun <= 14)
    return {
      id: 'somestr', ad: 'Sömestr Tatili', aciklama: 'Öğrenciler tatilde: gündüz maçları dolu.',
      saatCarpan: (s) => (s <= 17 ? 1.3 : 1), tipCarpan: { ogrenci: 1.8 },
    };
  if (ay === 11)
    return { id: 'yagmur', ad: 'Yağmur Mevsimi', aciklama: 'Yağmur sık sık bastırıyor. Isıtıcısı olan kazanır.', saatCarpan: sabit(1) };
  if (ay === 12 || ay === 1 || ay === 2)
    return { id: 'kis', ad: 'Kış Kupası', aciklama: 'Ayaz ve kar. Isıtıcı ve kapalı saha fark yaratır.', saatCarpan: (s) => (s >= 23 ? 0.8 : 1) };
  if (ay === 10)
    return { id: 'sonbahar', ad: 'Sonbahar Ligi', aciklama: 'Hava serin, maçlar hararetli.', saatCarpan: sabit(1.05) };
  return { id: 'bahar', ad: 'Bahar Açılışı', aciklama: 'Hava ısındı, herkes sahaya dönüyor.', saatCarpan: sabit(1.08) };
}

/** Şehir ve aya göre o günün havası (rastgele) */
export function havaSec(sehirId: string, d: Date = new Date(), r: number = Math.random()): string {
  const ay = d.getMonth() + 1;
  const sicakSehir = sehirId === 'dubai';
  const ilikSehir = sehirId === 'antalya' || sicakSehir;
  const kis = ay === 12 || ay <= 2;
  const yaz = ay >= 6 && ay <= 8;
  let tablo: [string, number][];
  if (sicakSehir) tablo = yaz ? [['sicak', 0.6], ['gunesli', 0.4]] : [['gunesli', 0.7], ['bulutlu', 0.2], ['sicak', 0.1]];
  else if (kis)
    tablo = ilikSehir
      ? [['gunesli', 0.35], ['bulutlu', 0.35], ['yagmur', 0.3]]
      : [['gunesli', 0.2], ['bulutlu', 0.3], ['yagmur', 0.28], ['kar', 0.22]];
  else if (yaz) tablo = [['gunesli', 0.55], ['sicak', 0.3], ['bulutlu', 0.15]];
  else if (ay === 11 || sehirId === 'londra' || sehirId === 'trabzon')
    tablo = [['gunesli', 0.25], ['bulutlu', 0.35], ['yagmur', 0.4]];
  else tablo = [['gunesli', 0.5], ['bulutlu', 0.3], ['yagmur', 0.2]];
  let birikim = 0;
  for (const [id, p] of tablo) {
    birikim += p;
    if (r <= birikim) return id;
  }
  return tablo[tablo.length - 1][0];
}
