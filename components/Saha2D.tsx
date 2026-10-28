// ============================================
// BEŞLİ PATRON — components/Saha2D.tsx
// Üstten görünüm halı saha: inşaat aşamaları, kalite rengi, tribün/sponsor bantları
// ve "canlı" modda 5'e 5 mini maç simülasyonu.
// (Yayındaki sürümün görsel mantığı korunarak sade biçimde yeniden yazıldı.)
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { RENK, FONT } from '../constants/tema';
import { SPONSORLAR } from '../constants/sponsorConfig';

type Props = {
  asama: number;
  kalite: number;
  sahaTipi?: string;
  canli?: boolean;
  mini?: boolean;
  upgrades?: Record<string, number> | null;
  sponsorlar?: string[];
};

type Oyuncu = { id: number; takim: 0 | 1; gk: boolean; x: number; y: number; hx: number; hy: number };
type Mac = { oyuncular: Oyuncu[]; top: { x: number; y: number; vx: number; vy: number }; sahip: number | null; skor: [number, number]; bekleme: number; efekt: string | null };

// Kaliteye göre çim renkleri (kötü → iyi)
const CIM: [string, string][] = [
  ['#5C9460', '#548A58'],
  ['#4C9A55', '#448A4D'],
  ['#3FA34D', '#379246'],
  ['#2F9E44', '#28913C'],
];
const FORMA = [
  { forma: '#F59E0B', koyu: '#B45309' },
  { forma: '#3B82F6', koyu: '#1D4ED8' },
];

// Koordinatlar 0-100 (x: soldan sağa, y: yukarıdan aşağı). Takım 0 sağa hücum eder.
function dizilis(): Oyuncu[] {
  const yer = [
    [6, 50, true],
    [26, 30, false],
    [26, 70, false],
    [42, 40, false],
    [42, 62, false],
  ] as const;
  const liste: Oyuncu[] = [];
  let id = 0;
  for (const takim of [0, 1] as const) {
    for (const [x, y, gk] of yer) {
      const hx = takim === 0 ? x : 100 - x;
      liste.push({ id: id++, takim, gk, x: hx, y, hx, hy: y });
    }
  }
  return liste;
}

function yeniMac(): Mac {
  return { oyuncular: dizilis(), top: { x: 50, y: 50, vx: 0, vy: 0 }, sahip: null, skor: [0, 0], bekleme: 10, efekt: null };
}

const sinirla = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const mesafe = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

function adim(m: Mac): Mac {
  const o = m.oyuncular.map((p) => ({ ...p }));
  const top = { ...m.top };
  let { sahip, skor, bekleme, efekt } = m;

  if (bekleme > 0) {
    bekleme -= 1;
    if (bekleme === 0) efekt = null;
    o.forEach((p) => {
      p.x += (p.hx - p.x) * 0.15;
      p.y += (p.hy - p.y) * 0.15;
    });
    return { oyuncular: o, top: { x: 50, y: 50, vx: 0, vy: 0 }, sahip: null, skor, bekleme, efekt };
  }

  // Top hareketi
  if (sahip == null) {
    top.x += top.vx;
    top.y += top.vy;
    top.vx *= 0.92;
    top.vy *= 0.92;
    if (top.y < 2 || top.y > 98) top.vy *= -1;
    top.y = sinirla(top.y, 2, 98);
    // Gol kontrolü
    if (top.x <= 0 || top.x >= 100) {
      if (top.y > 38 && top.y < 62) {
        const atan = top.x >= 100 ? 0 : 1;
        skor = atan === 0 ? [skor[0] + 1, skor[1]] : [skor[0], skor[1] + 1];
        return { oyuncular: o, top: { x: 50, y: 50, vx: 0, vy: 0 }, sahip: null, skor, bekleme: 22, efekt: 'GOOOL!' };
      }
      top.vx *= -1;
      top.x = sinirla(top.x, 1, 99);
    }
    // En yakın oyuncu topu kapar
    let yakin: Oyuncu | null = null;
    let enKisa = 1e9;
    for (const p of o) {
      const d = mesafe(p, top);
      if (d < enKisa) {
        enKisa = d;
        yakin = p;
      }
    }
    if (yakin && enKisa < 3 && Math.hypot(top.vx, top.vy) < 2.2) sahip = yakin.id;
  }

  const sahipO = sahip != null ? o[sahip] : null;
  const hucumTakim = sahipO ? sahipO.takim : top.x < 50 ? 1 : 0;

  for (const p of o) {
    if (p.id === sahip) continue;
    let hedefX = p.hx;
    let hedefY = p.hy;
    if (p.gk) {
      hedefY = sinirla(top.y, 38, 62);
    } else if (!sahipO) {
      // Boş topa en yakın iki oyuncu koşar
      hedefX = top.x;
      hedefY = top.y;
      const yakinlar = o.filter((q) => q.takim === p.takim && !q.gk).sort((a, b) => mesafe(a, top) - mesafe(b, top));
      if (yakinlar[0]?.id !== p.id) {
        hedefX = p.hx + (top.x - 50) * 0.4;
        hedefY = p.hy + (top.y - p.hy) * 0.3;
      }
    } else if (p.takim === hucumTakim) {
      const ileri = p.takim === 0 ? 1 : -1;
      hedefX = sinirla(p.hx + ileri * 18 + (top.x - 50) * 0.5, 8, 92);
      hedefY = p.hy;
    } else {
      // Savunma: topa baskı
      const d = mesafe(p, sahipO);
      if (d < 22) {
        hedefX = sahipO.x;
        hedefY = sahipO.y;
      } else {
        hedefX = p.hx + (top.x - 50) * 0.5;
        hedefY = p.hy + (top.y - p.hy) * 0.4;
      }
    }
    const hiz = p.gk ? 0.9 : 1.15;
    const dx = hedefX - p.x;
    const dy = hedefY - p.y;
    const d = Math.hypot(dx, dy) || 1;
    p.x += (dx / d) * Math.min(hiz, d);
    p.y += (dy / d) * Math.min(hiz, d);
    // Top kapma
    if (sahipO && p.takim !== sahipO.takim && mesafe(p, sahipO) < 2.5 && Math.random() < 0.18) {
      sahip = p.id;
    }
  }

  if (sahip != null) {
    const s = o[sahip];
    const ileri = s.takim === 0 ? 1 : -1;
    const kaleX = s.takim === 0 ? 100 : 0;
    const kaleyeUzak = Math.abs(kaleX - s.x);
    if (s.gk) {
      // Kaleci uzun pas atar
      top.x = s.x + ileri * 3;
      top.y = s.y;
      top.vx = ileri * (4 + Math.random() * 2);
      top.vy = (Math.random() - 0.5) * 3;
      sahip = null;
    } else if (kaleyeUzak < 26 && Math.random() < 0.12) {
      // Şut
      const hedefY = 40 + Math.random() * 20 + (Math.random() < 0.3 ? (Math.random() < 0.5 ? -12 : 12) : 0);
      const d = Math.hypot(kaleX - s.x, hedefY - s.y) || 1;
      top.x = s.x;
      top.y = s.y;
      top.vx = ((kaleX - s.x) / d) * 6;
      top.vy = ((hedefY - s.y) / d) * 6;
      sahip = null;
      // Kaleci kurtarışı
      const kaleci = o.find((q) => q.gk && q.takim !== s.takim);
      if (kaleci && Math.abs(kaleci.y - hedefY) < 6 && Math.random() < 0.55) {
        top.vx *= -0.4;
        top.vy = (Math.random() - 0.5) * 4;
        efekt = 'KURTARIŞ!';
      }
    } else if (Math.random() < 0.06) {
      // Pas
      const arkadaslar = o.filter((q) => q.takim === s.takim && q.id !== s.id && !q.gk);
      const al = arkadaslar[Math.floor(Math.random() * arkadaslar.length)];
      if (al) {
        const d = mesafe(s, al) || 1;
        top.x = s.x;
        top.y = s.y;
        top.vx = ((al.x - s.x) / d) * 3.6;
        top.vy = ((al.y - s.y) / d) * 3.6;
        sahip = null;
      }
    } else {
      // Top sür
      s.x = sinirla(s.x + ileri * 0.9, 3, 97);
      s.y = sinirla(s.y + (50 - s.y) * 0.02 + (Math.random() - 0.5) * 0.8, 6, 94);
      top.x = s.x + ileri * 1.6;
      top.y = s.y;
      top.vx = 0;
      top.vy = 0;
    }
  }
  if (efekt === 'KURTARIŞ!' && Math.random() < 0.08) efekt = null;
  return { oyuncular: o, top, sahip, skor, bekleme, efekt };
}

export default function Saha2D({ asama, kalite, sahaTipi = 'yildiz', canli = false, mini = false, upgrades, sponsorlar }: Props) {
  const [genislik, setGenislik] = useState(0);
  const [mac, setMac] = useState<Mac>(yeniMac);
  const zaman = useRef<ReturnType<typeof setInterval> | null>(null);
  const hizmette = asama >= 5;
  const oynuyor = canli && hizmette && !mini;

  useEffect(() => {
    if (!oynuyor) return;
    zaman.current = setInterval(() => setMac((m) => adim(m)), 70);
    return () => {
      if (zaman.current) clearInterval(zaman.current);
    };
  }, [oynuyor]);

  const yukseklik = genislik * (mini ? 0.62 : 0.6);
  const cim = CIM[sinirla(Math.floor((kalite - 2) / 2), 0, 3)];
  const tribun = upgrades?.tribun ?? 0;
  const aktifSponsorlar = SPONSORLAR.filter((s) => (sponsorlar ?? []).includes(s.id));

  const icerik = () => {
    if (genislik === 0) return null;
    if (asama <= 0) {
      return (
        <View style={[StyleSheet.absoluteFill, styles.merkez, { backgroundColor: '#3F4A3A' }]}>
          <Text style={[styles.durumYazi, mini && { fontSize: 9 }]}>🌱 Boş arsa</Text>
        </View>
      );
    }
    if (asama < 5) {
      // İnşaat görünümü: toprak → zemin → kaleler → tel örgü
      return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: RENK.toprak }]}>
          {asama >= 3 && <View style={[StyleSheet.absoluteFill, { backgroundColor: cim[0], margin: 6, opacity: 0.85 }]} />}
          {asama >= 3 && <Cizgiler />}
          {asama >= 4 && <View style={[StyleSheet.absoluteFill, { borderWidth: 3, borderColor: 'rgba(226,232,240,0.5)', borderStyle: 'dashed' }]} />}
          <View style={[StyleSheet.absoluteFill, styles.merkez]}>
            <Text style={[styles.durumYazi, mini && { fontSize: 9 }]}>🚧 İnşaat {asama - 1}/4</Text>
          </View>
        </View>
      );
    }
    return (
      <>
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? cim[1] : cim[0] }} />
          ))}
        </View>
        <Cizgiler />
        {/* Kaleler */}
        <View style={[styles.kale, { left: 0, borderLeftWidth: 0 }]} />
        <View style={[styles.kale, { right: 0, borderRightWidth: 0 }]} />
        {oynuyor && (
          <>
            {mac.oyuncular.map((p) => (
              <View
                key={p.id}
                style={[
                  styles.oyuncu,
                  {
                    left: (p.x / 100) * genislik - 5,
                    top: (p.y / 100) * yukseklik - 5,
                    backgroundColor: p.gk ? '#22C55E' : FORMA[p.takim].forma,
                    borderColor: FORMA[p.takim].koyu,
                  },
                ]}
              />
            ))}
            <View
              style={[styles.top, { left: (mac.top.x / 100) * genislik - 3, top: (mac.top.y / 100) * yukseklik - 3 }]}
            />
            <View style={styles.skorbord}>
              <Text style={styles.skorYazi}>
                {mac.skor[0]} - {mac.skor[1]}
              </Text>
            </View>
            {mac.efekt && (
              <View style={[StyleSheet.absoluteFill, styles.merkez]} pointerEvents="none">
                <Text style={styles.efekt}>{mac.efekt}</Text>
              </View>
            )}
          </>
        )}
        {!mini && !oynuyor && (
          <View style={[StyleSheet.absoluteFill, styles.merkez]} pointerEvents="none">
            <Text style={styles.sahaAdYazi}>{sahaTipi === 'yildiz' ? 'YILDIZ SAHA' : sahaTipi.toUpperCase()}</Text>
          </View>
        )}
      </>
    );
  };

  return (
    <View onLayout={(e: LayoutChangeEvent) => setGenislik(e.nativeEvent.layout.width)}>
      {!mini && hizmette && tribun > 0 && (
        <View style={styles.tribun}>
          {Array.from({ length: 6 + tribun * 6 }).map((_, i) => (
            <View
              key={i}
              style={[styles.seyirci, { backgroundColor: ['#F59E0B', '#3B82F6', '#EF4444', '#F1C27D'][i % 4] }]}
            />
          ))}
        </View>
      )}
      <View style={[styles.saha, { height: yukseklik || (mini ? 70 : 180), borderRadius: mini ? 6 : 10 }]}>{icerik()}</View>
      {!mini && hizmette && aktifSponsorlar.length > 0 && (
        <View style={styles.bantSatir}>
          {aktifSponsorlar.map((s) => (
            <View key={s.id} style={[styles.bant, { backgroundColor: s.renk }]}>
              <Text style={styles.bantYazi} numberOfLines={1}>
                {s.yazi}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Cizgiler() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { margin: '2%', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)' }]} />
      <View style={{ position: 'absolute', left: '50%', top: '2%', bottom: '2%', width: 1.5, backgroundColor: 'rgba(255,255,255,0.55)' }} />
      <View style={styles.ortaYuvarlak} />
      <View style={[styles.ceza, { left: '2%', borderLeftWidth: 0 }]} />
      <View style={[styles.ceza, { right: '2%', borderRightWidth: 0 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  saha: { width: '100%', overflow: 'hidden', backgroundColor: '#2F9E44', borderWidth: 2, borderColor: '#1E6B30' },
  merkez: { alignItems: 'center', justifyContent: 'center' },
  durumYazi: { color: '#FEF3C7', fontFamily: FONT.buyuk, fontSize: 12, textShadowColor: '#000', textShadowRadius: 3 },
  sahaAdYazi: { color: 'rgba(255,255,255,0.18)', fontFamily: FONT.buyuk, fontSize: 18, letterSpacing: 2 },
  kale: {
    position: 'absolute',
    top: '38%',
    height: '24%',
    width: '2.5%',
    borderWidth: 2,
    borderColor: '#FAFAFA',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  ortaYuvarlak: {
    position: 'absolute',
    left: '42%',
    width: '16%',
    top: '36%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  ceza: {
    position: 'absolute',
    top: '28%',
    height: '44%',
    width: '14%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  oyuncu: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  top: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  skorbord: {
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
    backgroundColor: 'rgba(11,18,32,0.85)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  skorYazi: { color: '#FCD34D', fontFamily: FONT.buyuk, fontSize: 12 },
  efekt: { color: '#FCD34D', fontFamily: FONT.buyuk, fontSize: 22, textShadowColor: '#000', textShadowRadius: 4 },
  tribun: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    padding: 4,
    marginBottom: 4,
    backgroundColor: '#334155',
    borderRadius: 6,
    justifyContent: 'center',
  },
  seyirci: { width: 7, height: 7, borderRadius: 4 },
  bantSatir: { flexDirection: 'row', gap: 4, marginTop: 4 },
  bant: { flex: 1, borderRadius: 4, paddingVertical: 3, alignItems: 'center' },
  bantYazi: { color: 'rgba(11,18,32,0.92)', fontFamily: FONT.buyuk, fontSize: 9 },
});
