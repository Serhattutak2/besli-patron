// ============================================
// SAHA BİZİM — i18n/index.ts
// Çeviri katmanı. Oyun metinleri Türkçe yazılır; ekranda gösterilirken
// seçili dile çevrilir. Sözlük: i18n/<dil>.json (anahtar = Türkçe metin).
// Dinamik metinler şablonla eşleşir: "Sonraki derbi {0} gün sonra."
// Yeni metin ekleyince: node scripts/metin-cikar.js → kaynak.json'daki
// yeni anahtarları en.json'a çevirisiyle ekle.
// ============================================
import { createContext, useContext } from 'react';
import en from './en.json';
import type { Dil } from '../services/ayarlar';

type Sablon = { re: RegExp; hedef: string; uzunluk: number };
type Paket = { kucuk: Map<string, string>; tam: Map<string, string>; harfli: Map<string, Sablon[]>; yuvaBasli: Sablon[] };

const SOZLUKLER: Record<Exclude<Dil, 'tr'>, Record<string, string>> = { en: en as Record<string, string> };
const paketler: Partial<Record<Dil, Paket>> = {};
let aktif: Dil = 'tr';
const onbellek = new Map<string, string>();

const normal = (s: string) => s.replace(/\s+/g, ' ').trim();
const kacis = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const HARF = /[A-Za-zÇĞİÖŞÜçğıöşü]/;

function paketKur(dil: Exclude<Dil, 'tr'>): Paket {
  const tam = new Map<string, string>();
  const harfli = new Map<string, Sablon[]>();
  const yuvaBasli: Sablon[] = [];
  for (const [k0, v] of Object.entries(SOZLUKLER[dil])) {
    const k = normal(k0);
    if (!/\{\d+\}/.test(k)) {
      tam.set(k, v);
      continue;
    }
    const parcalar = k.split(/\{(\d+)\}/);
    const literal = parcalar.filter((_, i) => i % 2 === 0).join('');
    if (!HARF.test(literal)) continue; // "{0} {1}" gibi her şeye uyan şablonlar kullanılmaz
    let desen = '^';
    const sira: number[] = [];
    parcalar.forEach((p, i) => {
      if (i % 2 === 0) desen += kacis(p);
      else {
        sira.push(Number(p));
        desen += '(.*?)';
      }
    });
    // yakalanan grupları {n} numarasına göre yerleştirebilmek için hedefi yeniden numarala
    const hedef = v.replace(/\{(\d+)\}/g, (_, n) => `{${sira.indexOf(Number(n))}}`);
    const s: Sablon = { re: new RegExp(desen + '$'), hedef, uzunluk: literal.length };
    if (parcalar[0].length >= 2) {
      const a = parcalar[0].slice(0, 2);
      if (!harfli.has(a)) harfli.set(a, []);
      harfli.get(a)!.push(s);
    } else yuvaBasli.push(s);
  }
  harfli.forEach((l) => l.sort((x, y) => y.uzunluk - x.uzunluk));
  yuvaBasli.sort((x, y) => y.uzunluk - x.uzunluk);
  const kucuk = new Map<string, string>();
  tam.forEach((v, k) => kucuk.set(k.toLocaleLowerCase('tr-TR'), v));
  return { kucuk, tam, harfli, yuvaBasli };
}

function paket(): Paket | null {
  if (aktif === 'tr') return null;
  if (!paketler[aktif]) paketler[aktif] = paketKur(aktif);
  return paketler[aktif]!;
}

export function dilAyarla(d: Dil) {
  if (d === aktif) return;
  aktif = d;
  onbellek.clear();
}
export function aktifDil(): Dil {
  return aktif;
}

function kelimeKelime(p: Paket, s0: string): string | null {
  const on = /^\d+\.\s/.exec(s0)?.[0] ?? '';
  const s = s0.slice(on.length);
  const kelimeler = s.split(' ');
  if (kelimeler.length > 4 || /[.!?:;"]/.test(s)) return null;
  let degisti = false;
  const out = kelimeler.map((w) => {
    const c = p.tam.get(w);
    if (c != null) {
      degisti = true;
      return c;
    }
    return w;
  });
  return degisti ? on + out.join(' ') : null;
}

function tamBul(p: Paket, s: string): string | undefined {
  const t = p.tam.get(s);
  if (t != null) return t;
  // "çay ve simit" gibi küçük harfe çevrilmiş metinler
  const buyuk = s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
  if (buyuk !== s) {
    const b = p.tam.get(buyuk);
    if (b != null) return b.charAt(0).toLowerCase() + b.slice(1);
  }
  // "PAZARTESİ" gibi büyük harfli metinler
  const k = p.kucuk.get(s.toLocaleLowerCase('tr-TR')) ?? p.kucuk.get(s.toLowerCase());
  if (k != null && s === s.toUpperCase()) return k.toUpperCase();
  return undefined;
}

const DERIN = 4;
function cevirIc(p: Paket, s: string, derinlik: number): string {
  const t = tamBul(p, s);
  if (t != null) return t;
  const adaylar = [...(p.harfli.get(s.slice(0, 2)) ?? []), ...p.yuvaBasli];
  for (const a of adaylar) {
    const m = a.re.exec(s);
    if (!m) continue;
    const degerler = m.slice(1).map((v) => {
      const d = v.trim();
      if (!HARF.test(d)) return d;
      return derinlik < DERIN ? cevirIc(p, d, derinlik + 1) : tamBul(p, d) ?? d;
    });
    return a.hedef.replace(/\{(\d+)\}/g, (_, n) => degerler[Number(n)] ?? '');
  }
  if (derinlik < DERIN) {
    // tırnak içindeki metin: "..."
    const tirnak = /^(["“'])(.+)(["”'])$/.exec(s);
    if (tirnak) return tirnak[1] + cevirIc(p, tirnak[2], derinlik + 1) + tirnak[3];
    // "Öğrenciler · 14, 15" gibi noktayla ayrılmış parçalar
    if (s.includes(' · ')) return s.split(' · ').map((x) => cevirIc(p, x.trim(), derinlik + 1)).join(' · ');
    // sondaki ayraç: "ALTIN AN · "
    const son = /^(.*?)\s*·$/.exec(s);
    if (son) return cevirIc(p, son[1], derinlik + 1) + ' ·';
  }
  return kelimeKelime(p, s) ?? s;
}

/** Bir metni seçili dile çevirir (Türkçe seçiliyse aynen döner) */
export function t(metin: string): string {
  const p = paket();
  if (!p || !metin || !HARF.test(metin)) return metin;
  const n = normal(metin);
  const c = onbellek.get(n);
  if (c != null) return c;
  const sonuc = cevirIc(p, n, 0);
  if (onbellek.size > 4000) onbellek.clear();
  onbellek.set(n, sonuc);
  return sonuc;
}

/** React çocuklarını çevirir: düz metin ve sayı dizileri tek cümle sayılır */
export function cevirCocuk(c: React.ReactNode): React.ReactNode {
  if (aktif === 'tr') return c;
  if (typeof c === 'string') return t(c);
  if (Array.isArray(c)) {
    if (c.every((x) => typeof x === 'string' || typeof x === 'number' || x == null || typeof x === 'boolean')) {
      const birlesik = c.filter((x) => typeof x === 'string' || typeof x === 'number').join('');
      return t(birlesik);
    }
    return c.map((x) => (typeof x === 'string' ? t(x) : x));
  }
  return c;
}

export const DilBaglami = createContext<Dil>('tr');
/** Dil değişince bileşenin yeniden çizilmesini sağlar */
export function useDil(): Dil {
  return useContext(DilBaglami);
}
