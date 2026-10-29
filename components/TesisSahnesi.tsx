// ============================================
// SAHA BİZİM — components/TesisSahnesi.tsx
// Canlı tesis sahnesi (SVG): gökyüzü saate göre değişir, şehir silueti,
// perspektifli saha, tribün ve seyirci, projektörler, dev ekran, çay ocağı,
// inşaat aşamaları, hava durumu ve maç oynayan oyuncular.
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import Svg, {
  Rect,
  Path,
  Circle,
  Ellipse,
  Line,
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Polygon,
} from 'react-native-svg';
import type { OyunDurumu, Saha, Rezervasyon } from '../engine/tipler';
import * as M from '../engine/motor';
import { TAKIM_TIPLERI } from '../engine/veri';

type Props = {
  durum: OyunDurumu;
  saha: Saha;
  onCay?: () => void;
  onSaha?: () => void;
  kucuk?: boolean;
};

const VW = 360;
const VH = 300;
const PT = 128; // saha üst kenarı
const PB = 252; // saha alt kenarı
const P = (u: number, v: number) => {
  const y = PT + v * (PB - PT);
  const yarim = 108 + v * 46;
  return { x: 180 + (u - 0.5) * 2 * yarim, y };
};
const pts = (dizi: [number, number][]) => dizi.map(([u, v]) => { const p = P(u, v); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');

// ---------- Gökyüzü ----------
function karistir(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((x, i) => Math.round(x + (pb[i] - x) * t));
  return `#${c.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}
const GOK: [number, string, string][] = [
  [9, '#7CC6F2', '#CDEBFA'],
  [15, '#5EB6EE', '#BFE6FA'],
  [18, '#F59E6B', '#FDE1B4'],
  [19.5, '#7C4A8F', '#F08A6C'],
  [21, '#1B1F4B', '#3B2F6B'],
  [24, '#080B22', '#141A3D'],
  [27, '#05071A', '#10153A'],
];
function gokRengi(saat: number): [string, string] {
  for (let i = 0; i < GOK.length - 1; i++) {
    const [s1, u1, a1] = GOK[i];
    const [s2, u2, a2] = GOK[i + 1];
    if (saat >= s1 && saat <= s2) {
      const t = (saat - s1) / (s2 - s1);
      return [karistir(u1, u2, t), karistir(a1, a2, t)];
    }
  }
  return [GOK[GOK.length - 1][1], GOK[GOK.length - 1][2]];
}
const geceMi = (saat: number) => saat >= 20.5;

// ---------- Şehir silueti ----------
function Siluet({ sehirId, gece, kare = 0 }: { sehirId: string; gece: boolean; kare?: number }) {
  const renk = gece ? '#0D1330' : '#5B7A99';
  const pencere = gece ? '#FCD34D' : '#93B4CF';
  const binalar: { x: number; w: number; h: number }[] = [];
  let x = 0;
  let tohum = sehirId.length * 7;
  while (x < VW) {
    tohum = (tohum * 9301 + 49297) % 233280;
    const w = 18 + (tohum % 22);
    const h = 18 + ((tohum >> 3) % (sehirId === 'dubai' || sehirId === 'londra' ? 60 : 34));
    binalar.push({ x, w, h });
    x += w + 2;
  }
  const taban = 112;
  const ozel: React.ReactNode[] = [];
  if (sehirId === 'istanbul') {
    ozel.push(<Path key="k1" d="M120 112 a28 22 0 0 1 56 0 z" fill={renk} />, <Rect key="k2" x="114" y="72" width="4" height="40" fill={renk} />, <Rect key="k3" x="178" y="70" width="4" height="42" fill={renk} />, <Path key="k4" d="M114 72 l2 -8 l2 8z M178 70 l2 -8 l2 8z" fill={renk} />);
  } else if (sehirId === 'ankara') {
    ozel.push(<Rect key="a1" x="250" y="50" width="6" height="62" fill={renk} />, <Ellipse key="a2" cx="253" cy="52" rx="12" ry="7" fill={renk} />);
  } else if (sehirId === 'izmir') {
    ozel.push(<Rect key="i1" x="150" y="78" width="10" height="34" fill={renk} />, <Path key="i2" d="M146 78 h18 l-9 -10 z" fill={renk} />);
  } else if (sehirId === 'antalya' || sehirId === 'dubai') {
    [40, 300, 330].forEach((px, i) =>
      ozel.push(
        <G key={`p${i}`}>
          <Path d={`M${px} 112 q2 -18 0 -34`} stroke={renk} strokeWidth="3" fill="none" />
          <Path d={`M${px} 78 q-14 -2 -18 6 M${px} 78 q14 -2 18 6 M${px} 78 q-8 -10 -16 -8 M${px} 78 q8 -10 16 -8`} stroke={renk} strokeWidth="3" fill="none" />
        </G>,
      ),
    );
    if (sehirId === 'dubai') ozel.push(<Path key="d1" d="M200 112 L204 20 L208 112 z" fill={renk} />);
  } else if (sehirId === 'trabzon') {
    ozel.push(<Path key="t1" d="M0 112 L60 62 L110 96 L170 54 L240 100 L300 66 L360 104 L360 112 z" fill={gece ? '#0A1028' : '#4E6B57'} />);
  } else if (sehirId === 'londra') {
    ozel.push(<Circle key="l1" cx="300" cy="74" r="30" stroke={renk} strokeWidth="3" fill="none" />, <Rect key="l2" x="120" y="44" width="10" height="68" fill={renk} />, <Path key="l3" d="M118 44 l7 -12 l7 12z" fill={renk} />);
  } else if (sehirId === 'berlin') {
    ozel.push(<Rect key="b1" x="210" y="40" width="4" height="72" fill={renk} />, <Circle key="b2" cx="212" cy="56" r="7" fill={renk} />);
  }
  return (
    <G>
      {binalar.map((b, i) => (
        <G key={i}>
          <Rect x={b.x} y={taban - b.h} width={b.w} height={b.h} fill={renk} opacity={0.85} />
          {gece &&
            Array.from({ length: Math.floor(b.h / 9) }).map((_, j) =>
              (i * 7 + j * 3 + Math.floor(kare / 60) * (j % 2)) % 4 === 0 ? <Rect key={j} x={b.x + 4} y={taban - b.h + 4 + j * 9} width="3" height="3" fill={pencere} opacity={0.8} /> : null,
            )}
        </G>
      ))}
      {ozel}
    </G>
  );
}

// ---------- Maç simülasyonu (görsel) ----------
type Oyuncu = { x: number; y: number; hx: number; hy: number; takim: 0 | 1; kaleci: boolean };
type Mac = { o: Oyuncu[]; top: { x: number; y: number; vx: number; vy: number }; sahip: number; skor: [number, number]; gol: number; tick: number; golAtan: 0 | 1 };
const sinir = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function yeniMac(): Mac {
  const yer: [number, number, boolean][] = [[0.5, 0.06, true], [0.28, 0.24, false], [0.72, 0.24, false], [0.38, 0.42, false], [0.62, 0.42, false]];
  const o: Oyuncu[] = [];
  for (const takim of [0, 1] as const)
    for (const [u, v, k] of yer) {
      const hv = takim === 0 ? v : 1 - v;
      o.push({ x: u, y: hv, hx: u, hy: hv, takim, kaleci: k });
    }
  return { o, top: { x: 0.5, y: 0.5, vx: 0, vy: 0 }, sahip: -1, skor: [0, 0], gol: 0, tick: 0, golAtan: 0 };
}
function macAdim(m: Mac): Mac {
  const o = m.o.map((p) => ({ ...p }));
  const top = { ...m.top };
  let { sahip, skor, gol } = m;
  if (gol > 0) {
    gol -= 1;
    const koseY = m.golAtan === 0 ? 0.9 : 0.1;
    o.forEach((p) => {
      // gol atan takım köşe bayrağına koşup sevinir, diğerleri yerine döner
      const hx = gol > 8 && p.takim === m.golAtan && !p.kaleci ? 0.9 : p.hx;
      const hy = gol > 8 && p.takim === m.golAtan && !p.kaleci ? koseY : p.hy;
      p.x += (hx - p.x) * 0.14;
      p.y += (hy - p.y) * 0.14;
    });
    return { o, top: gol > 8 ? m.top : { x: 0.5, y: 0.5, vx: 0, vy: 0 }, sahip: -1, skor, gol, tick: m.tick + 1, golAtan: m.golAtan };
  }
  if (sahip < 0) {
    top.x += top.vx; top.y += top.vy; top.vx *= 0.92; top.vy *= 0.92;
    if (top.x < 0.04 || top.x > 0.96) top.vx *= -1;
    top.x = sinir(top.x, 0.04, 0.96);
    if (top.y <= 0.01 || top.y >= 0.99) {
      if (top.x > 0.42 && top.x < 0.58) {
        skor = top.y >= 0.99 ? [skor[0] + 1, skor[1]] : [skor[0], skor[1] + 1];
        return { o, top: { x: top.x, y: sinir(top.y, 0, 1), vx: 0, vy: 0 }, sahip: -1, skor, gol: 30, tick: m.tick + 1, golAtan: top.y >= 0.99 ? 0 : 1 };
      }
      top.vy *= -1; top.y = sinir(top.y, 0.02, 0.98);
    }
    let en = 9, enI = -1;
    o.forEach((p, i) => { const d = Math.hypot(p.x - top.x, (p.y - top.y) * 1.4); if (d < en) { en = d; enI = i; } });
    if (en < 0.035 && Math.hypot(top.vx, top.vy) < 0.022) sahip = enI;
  }
  const s = sahip >= 0 ? o[sahip] : null;
  o.forEach((p, i) => {
    if (i === sahip) return;
    let hx = p.hx, hy = p.hy;
    if (p.kaleci) { hx = sinir(top.x, 0.38, 0.62); }
    else if (!s) { const yakin = o.filter((q) => q.takim === p.takim && !q.kaleci).sort((a, b) => Math.hypot(a.x - top.x, a.y - top.y) - Math.hypot(b.x - top.x, b.y - top.y))[0]; if (yakin === p) { hx = top.x; hy = top.y; } else { hy = p.hy + (top.y - 0.5) * 0.4; } }
    else if (p.takim === s.takim) { const ileri = p.takim === 0 ? 1 : -1; hy = sinir(p.hy + ileri * 0.2 + (top.y - 0.5) * 0.5, 0.08, 0.92); }
    else { const d = Math.hypot(p.x - s.x, p.y - s.y); if (d < 0.22) { hx = s.x; hy = s.y; } else { hy = p.hy + (top.y - 0.5) * 0.45; } }
    const dx = hx - p.x, dy = hy - p.y, d = Math.hypot(dx, dy) || 1, hiz = p.kaleci ? 0.008 : 0.011;
    p.x += (dx / d) * Math.min(hiz, d); p.y += (dy / d) * Math.min(hiz, d);
    if (s && p.takim !== s.takim && Math.hypot(p.x - s.x, p.y - s.y) < 0.03 && Math.random() < 0.15) sahip = i;
  });
  if (sahip >= 0) {
    const p = o[sahip];
    const ileri = p.takim === 0 ? 1 : -1;
    const kaleY = p.takim === 0 ? 1 : 0;
    if (p.kaleci) { top.x = p.x; top.y = p.y + ileri * 0.04; top.vx = (Math.random() - 0.5) * 0.02; top.vy = ileri * 0.05; sahip = -1; }
    else if (Math.abs(kaleY - p.y) < 0.28 && Math.random() < 0.1) { const hx = 0.43 + Math.random() * 0.14 + (Math.random() < 0.3 ? 0.12 : 0); const d = Math.hypot(hx - p.x, kaleY - p.y) || 1; top.x = p.x; top.y = p.y; top.vx = ((hx - p.x) / d) * 0.06; top.vy = ((kaleY - p.y) / d) * 0.06; sahip = -1; }
    else if (Math.random() < 0.06) { const ark = o.filter((q, j) => q.takim === p.takim && j !== sahip && !q.kaleci); const al = ark[Math.floor(Math.random() * ark.length)]; if (al) { const d = Math.hypot(al.x - p.x, al.y - p.y) || 1; top.x = p.x; top.y = p.y; top.vx = ((al.x - p.x) / d) * 0.035; top.vy = ((al.y - p.y) / d) * 0.035; sahip = -1; } }
    else { p.y = sinir(p.y + ileri * 0.009, 0.03, 0.97); p.x = sinir(p.x + (0.5 - p.x) * 0.02 + (Math.random() - 0.5) * 0.008, 0.06, 0.94); top.x = p.x; top.y = p.y + ileri * 0.025; top.vx = 0; top.vy = 0; }
  }
  return { o, top, sahip, skor, gol, tick: m.tick + 1, golAtan: m.golAtan };
}

// ---------- Bileşen ----------
export default function TesisSahnesi({ durum, saha, onCay, onSaha, kucuk }: Props) {
  const [gen, setGen] = useState(0);
  const [kare, setKare] = useState(0);
  const [mac, setMac] = useState<Mac>(yeniMac);
  const aktifRez: Rezervasyon | undefined = durum.rezervasyonlar.find((r) => r.sahaId === saha.id && r.durum === 'oynaniyor');
  const oynuyor = !!aktifRez && M.hizmette(saha) && !kucuk;
  const oncekiRez = useRef<string | null>(null);

  useEffect(() => {
    if (aktifRez?.id !== oncekiRez.current) {
      oncekiRez.current = aktifRez?.id ?? null;
      setMac(yeniMac());
    }
  }, [aktifRez?.id]);

  const hareketli = !kucuk;
  useEffect(() => {
    if (!hareketli) return;
    const z = setInterval(() => {
      setKare((k) => k + 1);
      if (oynuyor && !durum.duraklat && !durum.canliAn) setMac((m) => macAdim(m));
    }, 70);
    return () => clearInterval(z);
  }, [hareketli, oynuyor, durum.duraklat, !!durum.canliAn]);

  const saat = durum.dakika / 60;
  const [ust, alt] = gokRengi(saat);
  const gece = geceMi(saat);
  const isik = saha.yukseltmeler.isik ?? 0;
  const isikAcik = gece && isik > 0 && (oynuyor || durum.rezervasyonlar.some((r) => r.sahaId === saha.id && r.durum !== 'bitti'));
  const kaliteOran = Math.max(0, Math.min(1, (saha.kalite - 1) / 9));
  const cim1 = karistir('#9C8B4A', '#2FA14A', kaliteOran);
  const cim2 = karistir('#8A7B40', '#27913F', kaliteOran);
  const tribun = saha.yukseltmeler.tribun ?? 0;
  const takimRenk = aktifRez && !aktifRez.takimId.startsWith('misafir:') ? TAKIM_TIPLERI[M.takimBul(durum, aktifRez.takimId)?.tip ?? 'amator'].renk : '#F59E0B';
  const sponsorlar = useMemo(() => ['ÇAY OCAĞI', 'MAHALLE TV', 'SAHA BİZİM', 'GECE LİGİ'], []);
  const rakipRenk = useMemo(() => {
    const id = aktifRez?.id ?? 'x';
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
    const renkler = ['#F8FAFC', '#3B82F6', '#111827', '#DC2626', '#7C3AED', '#0D9488'];
    const r = renkler[h % renkler.length];
    return r === takimRenk ? '#F8FAFC' : r;
  }, [aktifRez?.id, takimRenk]);
  // gol anında kamera kaleye yaklaşır
  const zoom = oynuyor && mac.gol > 0 ? 1 - 0.36 * Math.min(1, (30 - mac.gol) / 5, mac.gol / 8) : 1;
  const golNokta = P(0.5, mac.golAtan === 0 ? 1 : 0);
  const vbW = VW * zoom;
  const vbH = VH * zoom;
  const vbX = Math.max(0, Math.min(VW - vbW, golNokta.x - vbW / 2));
  const vbY = Math.max(0, Math.min(VH - vbH, golNokta.y - vbH / 2));
  const derbiKutlama = !!durum.derbi?.sonuc && gece && durum.dakika < (21 + 3) * 60;

  const yildizlar = useMemo(() => Array.from({ length: 28 }, (_, i) => ({ x: (i * 97) % VW, y: (i * 53) % 90 + 4, r: (i % 3) * 0.4 + 0.5 })), []);
  const damlalar = useMemo(() => Array.from({ length: 46 }, (_, i) => ({ x: (i * 73) % VW, y: (i * 131) % VH, h: 8 + (i % 5) * 2 })), []);

  return (
    <View onLayout={(e: LayoutChangeEvent) => setGen(e.nativeEvent.layout.width)} style={{ width: '100%' }}>
      {gen > 0 && (
        <Svg width={gen} height={(gen * VH) / VW} viewBox={`${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`}>
          <Defs>
            <LinearGradient id="gok" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={ust} />
              <Stop offset="1" stopColor={alt} />
            </LinearGradient>
            <LinearGradient id="zemin" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={gece ? '#1F2A1E' : '#6E8F4E'} />
              <Stop offset="1" stopColor={gece ? '#121A12' : '#55703C'} />
            </LinearGradient>
            <RadialGradient id="isik" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#FFF7D6" stopOpacity="0.55" />
              <Stop offset="1" stopColor="#FFF7D6" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="gunes" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#FFF4C2" stopOpacity="1" />
              <Stop offset="1" stopColor="#FFF4C2" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Gökyüzü */}
          <Rect x="0" y="0" width={VW} height="120" fill="url(#gok)" />
          {gece && yildizlar.map((y, i) => <Circle key={i} cx={y.x} cy={y.y} r={y.r} fill="#FFFFFF" opacity={0.5 + 0.5 * Math.sin((kare + i * 5) / 9)} />)}
          {!gece && saat < 19.5 && (
            <G>
              <Circle cx={40 + ((saat - 9) / 10.5) * 280} cy={70 - Math.sin(((saat - 9) / 10.5) * Math.PI) * 48} r="26" fill="url(#gunes)" />
              <Circle cx={40 + ((saat - 9) / 10.5) * 280} cy={70 - Math.sin(((saat - 9) / 10.5) * Math.PI) * 48} r="9" fill="#FFF3B0" />
            </G>
          )}
          {gece && <Path d="M318 26 a12 12 0 1 0 8 20 a10 10 0 1 1 -8 -20 z" fill="#FDF4C7" />}
          {(durum.hava === 'bulutlu' || durum.hava === 'yagmur' || durum.hava === 'kar') && (
            <G opacity={gece ? 0.35 : 0.85}>
              {[30, 150, 260].map((cx, i) => (
                <G key={i} transform={`translate(${((cx + kare * 0.15 * (i + 1)) % 420) - 40} ${20 + i * 12})`}>
                  <Ellipse cx="0" cy="0" rx="26" ry="10" fill={durum.hava === 'bulutlu' ? '#F1F5F9' : '#94A3B8'} />
                  <Ellipse cx="18" cy="-5" rx="16" ry="10" fill={durum.hava === 'bulutlu' ? '#F8FAFC' : '#A3B1C2'} />
                </G>
              ))}
            </G>
          )}

          <Siluet sehirId={durum.sehirId} gece={gece} kare={kare} />

          {/* Kuşlar */}
          {!gece && durum.hava !== 'yagmur' &&
            [0, 1, 2].map((i) => {
              const x = ((kare * 1.1 + i * 140) % 440) - 40;
              const y = 34 + i * 9 + Math.sin((kare + i * 20) / 10) * 3;
              const k = Math.sin((kare + i * 5) / 2) * 3;
              return <Path key={i} d={`M${x - 6} ${y - k} Q${x - 3} ${y - 2} ${x} ${y} Q${x + 3} ${y - 2} ${x + 6} ${y - k}`} stroke="#1E293B" strokeWidth="1.2" fill="none" />;
            })}

          {/* Zemin */}
          <Rect x="0" y="108" width={VW} height={VH - 108} fill="url(#zemin)" />
          {/* Arka yol ve arabalar */}
          <Rect x="0" y="108" width={VW} height="8" fill={gece ? '#1E293B' : '#64748B'} />
          {[0, 1, 2].map((i) => {
            const yon = i % 2 === 0 ? 1 : -1;
            const x = yon > 0 ? ((kare * (1.6 + i * 0.4) + i * 150) % 460) - 50 : 410 - ((kare * (1.4 + i * 0.3) + i * 120) % 460);
            const renk = ['#EF4444', '#F8FAFC', '#3B82F6'][i];
            return (
              <G key={i}>
                <Rect x={x} y={108.5 + (yon > 0 ? 0 : 3)} width="14" height="4.5" rx="1.5" fill={renk} />
                {gece && <Path d={`M${yon > 0 ? x + 14 : x} ${110.5 + (yon > 0 ? 0 : 3)} l${yon * 18} -3 v6 z`} fill="#FEF3C7" opacity={0.45} />}
              </G>
            );
          })}

          {/* Tribün */}
          {M.hizmette(saha) && tribun > 0 && (
            <G>
              {Array.from({ length: tribun }).map((_, sira) => {
                const y = 116 - sira * 7;
                return (
                  <G key={sira}>
                    <Rect x={64 - sira * 6} y={y - 1} width={232 + sira * 12} height="8" fill={gece ? '#334155' : '#64748B'} />
                    {Array.from({ length: 26 + sira * 2 }).map((_, k) => {
                      const dolu = oynuyor ? (k * 7 + sira) % 5 !== 0 : (k * 11 + sira) % 4 === 0;
                      if (!dolu) return null;
                      const zipla = mac.gol > 0 ? Math.abs(Math.sin((kare + k) / 2)) * 3 : 0;
                      return <Circle key={k} cx={68 - sira * 6 + k * 9} cy={y + 2 - zipla} r="2.6" fill={['#F59E0B', '#EF4444', '#3B82F6', '#F1C27D', '#FFFFFF'][(k + sira) % 5]} />;
                    })}
                  </G>
                );
              })}
            </G>
          )}

          {/* Dev ekran */}
          {M.hizmette(saha) && (saha.yukseltmeler.skorbord ?? 0) > 0 && (
            <G>
              <Rect x="16" y="64" width="54" height="34" rx="3" fill="#0B1220" stroke="#475569" strokeWidth="1.5" />
              <Rect x="40" y="98" width="4" height="22" fill="#475569" />
              <SvgText x="43" y="80" fontSize="11" fontWeight="bold" fill="#FCD34D" textAnchor="middle">
                {oynuyor ? `${mac.skor[0]} - ${mac.skor[1]}` : M.sehir(durum).ad.toUpperCase().slice(0, 8)}
              </SvgText>
              <SvgText x="43" y="92" fontSize="6" fill="#94A3B8" textAnchor="middle">
                {sponsorlar[Math.floor(kare / 40) % sponsorlar.length]}
              </SvgText>
            </G>
          )}

          {/* Saha */}
          <G onPress={onSaha}>
            {saha.asama <= 1 ? (
              <G>
                <Polygon points={pts([[0, 0], [1, 0], [1, 1], [0, 1]])} fill={gece ? '#3A2E20' : '#9A7B52'} />
                {[0.2, 0.55, 0.8].map((u, i) => (
                  <Ellipse key={i} cx={P(u, 0.3 + i * 0.2).x} cy={P(u, 0.3 + i * 0.2).y} rx="14" ry="5" fill="#7A6040" />
                ))}
                <Rect x="160" y="170" width="40" height="22" fill="#F8FAFC" stroke="#78350F" strokeWidth="1.5" />
                <Rect x="178" y="192" width="4" height="18" fill="#78350F" />
                <SvgText x="180" y="185" fontSize="8" fontWeight="bold" fill="#78350F" textAnchor="middle">
                  {saha.asama === 0 ? 'SATILIK' : 'ARSA'}
                </SvgText>
              </G>
            ) : (
              <G>
                <Polygon points={pts([[-0.04, -0.04], [1.04, -0.04], [1.04, 1.04], [-0.04, 1.04]])} fill={saha.asama >= 3 ? '#2F5D3A' : '#8A6B46'} />
                {saha.asama >= 3 &&
                  Array.from({ length: 10 }).map((_, i) => {
                    const v0 = i / 10, v1 = (i + 1) / 10;
                    const yarim = saha.asama === 3 && i >= 5;
                    return <Polygon key={i} points={pts([[0, v0], [1, v0], [1, v1], [0, v1]])} fill={yarim ? '#8A6B46' : i % 2 ? cim1 : cim2} />;
                  })}
                {saha.asama === 2 && <Polygon points={pts([[0, 0], [1, 0], [1, 1], [0, 1]])} fill="#A08060" />}
                {saha.asama >= 3 && (
                  <G stroke="#F8FAFC" strokeWidth="1.3" fill="none" opacity={0.9}>
                    <Polygon points={pts([[0.02, 0.02], [0.98, 0.02], [0.98, 0.98], [0.02, 0.98]])} />
                    <Polyline2 a={[0.02, 0.5]} b={[0.98, 0.5]} />
                    <Polygon points={Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; const p = P(0.5 + Math.cos(a) * 0.12, 0.5 + Math.sin(a) * 0.1); return `${p.x},${p.y}`; }).join(' ')} />
                    <Polygon points={pts([[0.3, 0.02], [0.7, 0.02], [0.7, 0.16], [0.3, 0.16]])} />
                    <Polygon points={pts([[0.3, 0.98], [0.7, 0.98], [0.7, 0.84], [0.3, 0.84]])} />
                  </G>
                )}
                {/* Kaleler */}
                {saha.asama >= 3 && (
                  <G>
                    <Rect x={P(0.43, 0).x} y={PT - 9} width={P(0.57, 0).x - P(0.43, 0).x} height="9" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
                    <Rect x={P(0.43, 1).x} y={PB - 1} width={P(0.57, 1).x - P(0.43, 1).x} height="12" fill="rgba(255,255,255,0.15)" stroke="#FFFFFF" strokeWidth="2" />
                  </G>
                )}
                {/* İnşaat */}
                {saha.asama === 2 && (
                  <G>
                    <Rect x="210" y="176" width="44" height="18" rx="3" fill="#F59E0B" />
                    <Rect x="222" y="164" width="20" height="14" fill="#FBBF24" stroke="#92400E" />
                    <Path d={`M210 180 L188 ${168 + Math.sin(kare / 5) * 4} L180 ${176 + Math.sin(kare / 5) * 4}`} stroke="#B45309" strokeWidth="4" fill="none" />
                    <Circle cx="216" cy="196" r="6" fill="#1F2937" />
                    <Circle cx="248" cy="196" r="6" fill="#1F2937" />
                    <Ellipse cx="120" cy="200" rx="22" ry="9" fill="#C8A26A" />
                  </G>
                )}
                {saha.asama === 3 && <Path d={`M${P(0.1, 0.55).x} ${P(0.1, 0.55).y} q 20 -6 40 0`} stroke="#14532D" strokeWidth="6" fill="none" />}
              </G>
            )}
            {saha.asama >= 2 && saha.asama < 5 && (
              <G>
                <Rect x="130" y="200" width="100" height="18" rx="4" fill="#FBBF24" stroke="#78350F" />
                <SvgText x="180" y="212" fontSize="9" fontWeight="bold" fill="#78350F" textAnchor="middle">
                  İNŞAAT {saha.asama - 1}/4
                </SvgText>
              </G>
            )}
          </G>

          {/* Tel örgü */}
          {saha.asama >= 4 && (
            <G opacity={0.55}>
              {Array.from({ length: 23 }).map((_, i) => {
                const u = i / 22;
                const a = P(u, -0.06);
                return <Line key={i} x1={a.x} y1={a.y} x2={a.x} y2={a.y - 14} stroke="#CBD5E1" strokeWidth="0.8" />;
              })}
              <Line x1={P(0, -0.06).x} y1={P(0, -0.06).y - 14} x2={P(1, -0.06).x} y2={P(1, -0.06).y - 14} stroke="#CBD5E1" strokeWidth="1" />
            </G>
          )}

          {/* Projektörler */}
          {M.hizmette(saha) &&
            isik > 0 &&
            [[30, 118], [330, 118], ...(isik >= 2 ? [[8, 248], [352, 248]] : [])].map(([x, y], i) => (
              <G key={i}>
                <Rect x={x - 1.5} y={y - 40} width="3" height="40" fill="#64748B" />
                <Rect x={x - 8} y={y - 46} width="16" height="7" rx="1.5" fill={isikAcik ? '#FFF7D6' : '#94A3B8'} />
                {isikAcik && <Circle cx={x} cy={y - 42} r="34" fill="url(#isik)" />}
              </G>
            ))}
          {isikAcik && <Polygon points={pts([[0, 0], [1, 0], [1, 1], [0, 1]])} fill="#FFF7D6" opacity={0.07} />}

          {/* Oyuncular */}
          {oynuyor &&
            [...mac.o.map((p, i) => ({ p, i }))].sort((a, b) => a.p.y - b.p.y).map(({ p, i }) => {
              const q = P(p.x, p.y);
              const olcek = (0.75 + p.y * 0.5) * 1.4;
              const renk = p.kaleci ? '#22C55E' : p.takim === 0 ? takimRenk : rakipRenk;
              const kosuyor = mac.gol === 0 || p.takim === mac.golAtan;
              const bacak = kosuyor ? Math.sin((kare + i * 3) / 1.6) * 2.2 * olcek : 0;
              const sevinc = mac.gol > 8 && p.takim === mac.golAtan && !p.kaleci;
              const ten = ['#F1C27D', '#C68642', '#E0AC69', '#8D5524', '#FFDBAC'][i % 5];
              const sac = ['#2B1B10', '#111827', '#78350F', '#A16207', '#4B5563'][(i * 3) % 5];
              const numaraRenk = renk === '#F8FAFC' || renk === '#FCD34D' ? '#111827' : '#FFFFFF';
              return (
                <G key={i}>
                  <Ellipse cx={q.x} cy={q.y + 1} rx={4 * olcek} ry={1.6 * olcek} fill="rgba(0,0,0,0.3)" />
                  <Line x1={q.x - 1.2 * olcek} y1={q.y - 3 * olcek} x2={q.x - 1.2 * olcek + bacak} y2={q.y} stroke="#1F2937" strokeWidth={1.5 * olcek} strokeLinecap="round" />
                  <Line x1={q.x + 1.2 * olcek} y1={q.y - 3 * olcek} x2={q.x + 1.2 * olcek - bacak} y2={q.y} stroke="#1F2937" strokeWidth={1.5 * olcek} strokeLinecap="round" />
                  {sevinc && (
                    <G>
                      <Line x1={q.x - 2.6 * olcek} y1={q.y - 8 * olcek} x2={q.x - 4.5 * olcek} y2={q.y - 13 * olcek} stroke={ten} strokeWidth={1.3 * olcek} strokeLinecap="round" />
                      <Line x1={q.x + 2.6 * olcek} y1={q.y - 8 * olcek} x2={q.x + 4.5 * olcek} y2={q.y - 13 * olcek} stroke={ten} strokeWidth={1.3 * olcek} strokeLinecap="round" />
                    </G>
                  )}
                  <Rect x={q.x - 3 * olcek} y={q.y - 9 * olcek} width={6 * olcek} height={6.5 * olcek} rx={1.5 * olcek} fill={renk} stroke="rgba(0,0,0,0.35)" strokeWidth="0.6" />
                  {!p.kaleci && (
                    <SvgText x={q.x} y={q.y - 4.6 * olcek} fontSize={3.4 * olcek} fontWeight="bold" fill={numaraRenk} textAnchor="middle">
                      {[7, 10, 4, 9, 11][i % 5]}
                    </SvgText>
                  )}
                  <Circle cx={q.x} cy={q.y - 11.2 * olcek} r={2.4 * olcek} fill={ten} />
                  <Path d={`M${q.x - 2.4 * olcek} ${q.y - 11.6 * olcek} Q${q.x} ${q.y - 15 * olcek} ${q.x + 2.4 * olcek} ${q.y - 11.6 * olcek} Z`} fill={sac} />
                </G>
              );
            })}
          {oynuyor && (() => {
            const q = P(mac.top.x, mac.top.y);
            const r = (2.2 + mac.top.y) * 1.25;
            return (
              <G>
                <Ellipse cx={q.x} cy={q.y + 0.5} rx={r} ry={r * 0.4} fill="rgba(0,0,0,0.3)" />
                <Circle cx={q.x} cy={q.y - 1.8} r={r} fill="#FFFFFF" stroke="#111827" strokeWidth="0.6" />
                <Circle cx={q.x - r * 0.2} cy={q.y - 1.8 - r * 0.2} r={r * 0.35} fill="#111827" />
              </G>
            );
          })()}

          {/* Ortam karakterleri */}
          {!kucuk && durum.cayOcagi > 0 && (() => {
            const x = 252 + Math.sin(kare / 45) * 46;
            const y = 257;
            const yon = Math.cos(kare / 45) > 0 ? 1 : -1;
            const bacak = Math.sin(kare / 2) * 1.6;
            return (
              <G>
                <Line x1={x - 1.5} y1={y} x2={x - 1.5 + bacak} y2={y + 6} stroke="#1F2937" strokeWidth="1.6" />
                <Line x1={x + 1.5} y1={y} x2={x + 1.5 - bacak} y2={y + 6} stroke="#1F2937" strokeWidth="1.6" />
                <Rect x={x - 3.5} y={y - 8} width="7" height="9" rx="2" fill="#F8FAFC" />
                <Circle cx={x} cy={y - 11} r="2.8" fill="#E0AC69" />
                <Path d={`M${x - 2.8} ${y - 12} Q${x} ${y - 15} ${x + 2.8} ${y - 12} Z`} fill="#2B1B10" />
                <Line x1={x} y1={y - 6} x2={x + yon * 7} y2={y - 8} stroke="#E0AC69" strokeWidth="1.4" />
                <Ellipse cx={x + yon * 8} cy={y - 9} rx="5" ry="1.2" fill="#CBD5E1" />
                {[-2, 0, 2].map((dx) => (
                  <Rect key={dx} x={x + yon * 8 + dx - 0.8} y={y - 12} width="1.6" height="3" fill="#B45309" />
                ))}
              </G>
            );
          })()}
          {!kucuk && gece && (() => {
            const x = 20 + ((kare * 0.5) % 150);
            const y = 258;
            const bacak = Math.sin(kare / 2.4) * 1.5;
            return (
              <G>
                <Path d={`M${x + 4} ${y - 6} l40 -10 v20 z`} fill="#FEF3C7" opacity={0.18} />
                <Line x1={x - 1.5} y1={y} x2={x - 1.5 + bacak} y2={y + 6} stroke="#111827" strokeWidth="1.6" />
                <Line x1={x + 1.5} y1={y} x2={x + 1.5 - bacak} y2={y + 6} stroke="#111827" strokeWidth="1.6" />
                <Rect x={x - 3.5} y={y - 8} width="7" height="9" rx="2" fill="#1E3A8A" />
                <Circle cx={x} cy={y - 11} r="2.8" fill="#C68642" />
                <Rect x={x - 3} y={y - 15} width="6" height="2.5" fill="#1E3A8A" />
                <Rect x={x + 3} y={y - 7} width="3" height="2" fill="#FCD34D" />
              </G>
            );
          })()}
          {!kucuk && durum.bayraklar?.kedi && (() => {
            const x = 300 + Math.sin(kare / 70) * 22;
            const y = 246;
            const kuyruk = Math.sin(kare / 6) * 3;
            return (
              <G>
                <Ellipse cx={x} cy={y} rx="6" ry="3.4" fill="#F59E0B" />
                <Circle cx={x - 6} cy={y - 3} r="3" fill="#F59E0B" />
                <Path d={`M${x - 8} ${y - 5} l0.8 -3 l1.6 2.2 M${x - 5} ${y - 5.5} l1 -2.8 l1 2.6`} fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" />
                <Path d={`M${x + 6} ${y - 1} q5 ${-3 + kuyruk} 4 -8`} stroke="#F59E0B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </G>
            );
          })()}

          {/* Alt şerit: soyunma, giriş, çay ocağı */}
          <G>
            {(saha.yukseltmeler.soyunma ?? 0) > 0 && (
              <G>
                <Rect x="6" y="262" width="58" height="32" fill={gece ? '#334155' : '#CBD5E1'} />
                <Path d="M2 264 L35 250 L68 264 z" fill={gece ? '#1E293B' : '#94A3B8'} />
                <Rect x="14" y="272" width="12" height="9" fill={gece ? '#FCD34D' : '#E0F2FE'} />
                <Rect x="38" y="272" width="16" height="22" fill="#78350F" />
              </G>
            )}
            {(saha.yukseltmeler.otopark ?? 0) > 0 &&
              [[84, '#EF4444'], [112, '#3B82F6'], [140, '#F8FAFC']].map(([x, c], i) => (
                <G key={i}>
                  <Rect x={x as number} y="278" width="22" height="11" rx="3" fill={c as string} />
                  <Rect x={(x as number) + 4} y="273" width="14" height="7" rx="2" fill={c as string} opacity={0.85} />
                  <Circle cx={(x as number) + 5} cy="290" r="2.5" fill="#111827" />
                  <Circle cx={(x as number) + 17} cy="290" r="2.5" fill="#111827" />
                </G>
              ))}
            {(saha.yukseltmeler.kamera ?? 0) > 0 && (
              <G>
                <Rect x="342" y="128" width="2" height="22" fill="#64748B" />
                <Rect x="334" y="124" width="12" height="6" rx="2" fill="#1F2937" />
                <Circle cx="335" cy="127" r="1.4" fill={kare % 20 < 10 ? '#EF4444' : '#7F1D1D'} />
              </G>
            )}
            {/* Giriş tabelası */}
            <G>
              <Rect x="168" y="270" width="2.5" height="24" fill="#475569" />
              <Rect x="230" y="270" width="2.5" height="24" fill="#475569" />
              <Rect x="160" y="262" width="80" height="14" rx="3" fill="#0B1220" stroke="#F59E0B" strokeWidth="1" />
              <SvgText x="200" y="272" fontSize="7.5" fontWeight="bold" fill="#F59E0B" textAnchor="middle">
                SAHA BİZİM
              </SvgText>
            </G>
            {/* Çay ocağı */}
            <G onPress={onCay}>
              {durum.cayOcagi > 0 ? (
                <G>
                  <Rect x="282" y="262" width="66" height="32" fill={gece ? '#5B3A1C' : '#A16207'} />
                  <Path d="M276 264 L315 248 L354 264 z" fill="#DC2626" />
                  <Path d="M276 264 h78" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="6 6" />
                  <Rect x="290" y="270" width="50" height="12" fill={gece ? '#FCD34D' : '#FEF3C7'} />
                  <SvgText x="315" y="279" fontSize="6.5" fontWeight="bold" fill="#7C2D12" textAnchor="middle">
                    ÇAY OCAĞI
                  </SvgText>
                  {[0, 1, 2].map((i) => (
                    <Path key={i} d={`M${300 + i * 9} 246 q 3 -5 0 -10 q -3 -5 0 -10`} stroke="#F8FAFC" strokeWidth="1.4" fill="none" opacity={0.25 + 0.25 * Math.sin((kare + i * 7) / 6)} transform={`translate(0 ${-((kare + i * 9) % 18) / 3})`} />
                  ))}
                  {durum.cayBirikim >= 50 && (
                    <G transform={`translate(0 ${Math.sin(kare / 5) * 2})`}>
                      <Circle cx="340" cy="244" r="11" fill="#FBBF24" stroke="#92400E" strokeWidth="1.5" />
                      <SvgText x="340" y="248" fontSize="11" fontWeight="bold" fill="#78350F" textAnchor="middle">
                        ₺
                      </SvgText>
                    </G>
                  )}
                </G>
              ) : (
                <G opacity={0.75}>
                  <Rect x="290" y="268" width="52" height="24" fill="none" stroke="#CBD5E1" strokeDasharray="4 3" />
                  <SvgText x="316" y="283" fontSize="6.5" fill="#E2E8F0" textAnchor="middle">
                    ÇAY OCAĞI
                  </SvgText>
                </G>
              )}
            </G>
          </G>

          {/* Gece karartması */}
          {gece && <Rect x="0" y="0" width={VW} height={VH} fill="#020617" opacity={isikAcik ? 0.1 : 0.32} pointerEvents="none" />}

          {/* Hava */}
          {durum.hava === 'yagmur' &&
            damlalar.map((d, i) => {
              const y = (d.y + kare * 9) % VH;
              return <Line key={i} x1={d.x} y1={y} x2={d.x - 3} y2={y + d.h} stroke="#BFDBFE" strokeWidth="1" opacity={0.6} />;
            })}
          {durum.hava === 'kar' &&
            damlalar.map((d, i) => {
              const y = (d.y + kare * 2.5) % VH;
              return <Circle key={i} cx={(d.x + Math.sin((kare + i) / 8) * 6) % VW} cy={y} r={1.2 + (i % 3) * 0.5} fill="#FFFFFF" opacity={0.85} />;
            })}

          {/* Konfeti */}
          {oynuyor && mac.gol > 0 &&
            Array.from({ length: 36 }).map((_, i) => {
              const t = 30 - mac.gol;
              const x = golNokta.x + Math.sin(i * 12.9) * 70 + Math.sin((t + i) / 3) * 4;
              const y = golNokta.y - 90 + ((i * 17) % 40) + t * (3 + (i % 4));
              return <Rect key={i} x={x} y={y} width="3" height="5" fill={['#FCD34D', '#EF4444', '#22C55E', '#3B82F6', '#F472B6'][i % 5]} transform={`rotate(${(t * 20 + i * 40) % 360} ${x} ${y})`} opacity={Math.min(1, mac.gol / 8)} />;
            })}
          {/* Derbi havai fişekleri */}
          {derbiKutlama &&
            [0, 1, 2].map((i) => {
              const dongu = (kare + i * 23) % 70;
              if (dongu > 40) return null;
              const cx = 70 + i * 110;
              const cy = 26 + (i % 2) * 14;
              const r = dongu < 10 ? 0 : (dongu - 10) * 1.1;
              const renk = ['#FCD34D', '#F472B6', '#60A5FA'][i];
              return (
                <G key={i} opacity={1 - Math.max(0, dongu - 22) / 18}>
                  {dongu < 10 ? (
                    <Line x1={cx} y1={110 - dongu * 8} x2={cx} y2={116 - dongu * 8} stroke={renk} strokeWidth="1.5" />
                  ) : (
                    Array.from({ length: 12 }).map((_, k) => {
                      const a = (k / 12) * Math.PI * 2;
                      return <Line key={k} x1={cx + Math.cos(a) * r * 0.5} y1={cy + Math.sin(a) * r * 0.5} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke={renk} strokeWidth="1.6" strokeLinecap="round" />;
                    })
                  )}
                </G>
              );
            })}

          {/* Gol efekti */}
          {oynuyor && mac.gol > 10 && (
            <G>
              <SvgText x={vbX + vbW / 2} y={vbY + vbH * 0.42} fontSize={(30 + Math.min(14, 30 - mac.gol)) * zoom} fontWeight="bold" fill="#FCD34D" stroke="#78350F" strokeWidth={1.5 * zoom} textAnchor="middle">
                GOOOL!
              </SvgText>
            </G>
          )}
          {oynuyor && (
            <G>
              <Rect x={vbX + vbW / 2 - 40 * zoom} y={vbY + 4 * zoom} width={80 * zoom} height={18 * zoom} rx={9 * zoom} fill="rgba(11,18,32,0.85)" />
              <SvgText x={vbX + vbW / 2} y={vbY + 17 * zoom} fontSize={11 * zoom} fontWeight="bold" fill="#FCD34D" textAnchor="middle">
                {mac.skor[0]} - {mac.skor[1]}
              </SvgText>
            </G>
          )}
        </Svg>
      )}
    </View>
  );
}

function Polyline2({ a, b }: { a: [number, number]; b: [number, number] }) {
  const p1 = P(a[0], a[1]);
  const p2 = P(b[0], b[1]);
  return <Line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
}
