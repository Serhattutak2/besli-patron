// ============================================
// SAHA BİZİM — components/MiniOyun.tsx
// Patron sahaya iniyor: 5 penaltılık zamanlama oyunu.
// Nişangâh kalede gezinir; doğru anda "ŞUT" de, kaleciyi avlama!
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Rect, Line, Circle, G, Path, Ellipse, Text as SvgText } from 'react-native-svg';
import { R, Y, Buton } from './ui';

type Atis = 'gol' | 'kurtarış' | 'auta';

export default function MiniOyun({ onBitti, onKapat }: { onBitti: (gol: number) => void; onKapat: () => void }) {
  const [gen, setGen] = useState(0);
  const [t, setT] = useState(0);
  const [atislar, setAtislar] = useState<Atis[]>([]);
  const [anim, setAnim] = useState<null | { x: number; y: number; kx: number; sonuc: Atis; kare: number }>(null);
  const bitti = atislar.length >= 5 && !anim;
  const gol = atislar.filter((a) => a === 'gol').length;
  const ref = useRef(0);

  useEffect(() => {
    const z = setInterval(() => {
      ref.current += 1;
      setT(ref.current);
      setAnim((a) => (a ? (a.kare >= 22 ? null : { ...a, kare: a.kare + 1 }) : a));
    }, 40);
    return () => clearInterval(z);
  }, []);

  const hiz = 0.055 + atislar.length * 0.012;
  const nx = 0.5 + Math.sin(t * hiz) * 0.48; // nişangâh 0..1
  const ny = 0.5 + Math.sin(t * hiz * 1.7 + 1) * 0.36;
  const kaleciX = 0.5 + Math.sin(t * 0.045 + 2) * 0.22;

  const sut = () => {
    if (anim || bitti) return;
    const auta = nx < 0.04 || nx > 0.96 || ny < 0.06;
    let sonuc: Atis = 'gol';
    let dalis = kaleciX + (nx > kaleciX ? 0.16 : -0.16) * (Math.random() < 0.65 ? 1 : 0.2);
    if (auta) sonuc = 'auta';
    else if (Math.abs(nx - dalis) < 0.15 && !(ny < 0.2 && Math.abs(nx - 0.5) > 0.35)) sonuc = 'kurtarış';
    if (sonuc === 'gol') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setAnim({ x: nx, y: ny, kx: dalis, sonuc, kare: 0 });
    setAtislar((a) => [...a, sonuc]);
  };

  const W = 320,
    H = 230,
    KX = 30,
    KY = 40,
    KW = 260,
    KH = 120;
  const kx = (u: number) => KX + u * KW;
  const ky = (v: number) => KY + v * KH;
  const anlikKaleci = anim ? kaleciX + (anim.kx - kaleciX) * Math.min(1, anim.kare / 6) : kaleciX;
  const topIlerle = anim ? Math.min(1, anim.kare / 8) : 0;
  const topX = anim ? 160 + (kx(anim.x) - 160) * topIlerle : 160;
  const topY = anim ? 210 + (ky(anim.y) - 210) * topIlerle : 210;

  return (
    <View style={st.perde}>
      <View style={st.pencere}>
        <Y s style={{ fontSize: 20, textAlign: 'center' }}>Patron sahaya iniyor</Y>
        <Y style={{ color: R.soluk, textAlign: 'center', marginBottom: 10 }}>Nişangâh kaleciden uzaktayken ŞUT de!</Y>
        <View style={st.skorSatir}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[st.top, atislar[i] === 'gol' && { backgroundColor: R.yesil }, (atislar[i] === 'kurtarış' || atislar[i] === 'auta') && { backgroundColor: R.kirmizi }]} />
          ))}
        </View>
        <View onLayout={(e: LayoutChangeEvent) => setGen(e.nativeEvent.layout.width)} style={{ borderRadius: 16, overflow: 'hidden' }}>
          {gen > 0 && (
            <Pressable onPress={sut}>
              <Svg width={gen} height={(gen * H) / W} viewBox={`0 0 ${W} ${H}`}>
                <Rect x="0" y="0" width={W} height={H} fill="#0F2A1B" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <Rect key={i} x="0" y={160 + i * 12} width={W} height="12" fill={i % 2 ? '#2B8A3E' : '#2F9E44'} />
                ))}
                <Rect x="0" y="0" width={W} height="160" fill="#102037" />
                {Array.from({ length: 18 }).map((_, i) => (
                  <Circle key={i} cx={10 + i * 18} cy={20 + (i % 3) * 6} r="5" fill={['#F59E0B', '#EF4444', '#3B82F6', '#F1C27D'][i % 4]} opacity={0.6} />
                ))}
                {/* File */}
                {Array.from({ length: 14 }).map((_, i) => (
                  <Line key={`v${i}`} x1={kx(i / 13)} y1={KY} x2={kx(i / 13)} y2={KY + KH} stroke="#CBD5E1" strokeWidth="0.6" opacity={0.4} />
                ))}
                {Array.from({ length: 7 }).map((_, i) => (
                  <Line key={`h${i}`} x1={KX} y1={ky(i / 6)} x2={KX + KW} y2={ky(i / 6)} stroke="#CBD5E1" strokeWidth="0.6" opacity={0.4} />
                ))}
                <Rect x={KX} y={KY} width={KW} height={KH} fill="none" stroke="#FFFFFF" strokeWidth="5" />
                <Line x1="0" y1={KY + KH} x2={W} y2={KY + KH} stroke="#FFFFFF" strokeWidth="2" />
                {/* Kaleci */}
                <G transform={`translate(${kx(anlikKaleci)} ${ky(0.72)}) rotate(${anim ? (anim.kx > kaleciX ? 1 : -1) * Math.min(70, anim.kare * 12) : 0})`}>
                  <Rect x="-11" y="-30" width="22" height="30" rx="6" fill="#22C55E" />
                  <Circle cx="0" cy="-38" r="8" fill="#E0AC69" />
                  <Rect x="-30" y="-28" width="19" height="7" rx="3" fill="#22C55E" />
                  <Rect x="11" y="-28" width="19" height="7" rx="3" fill="#22C55E" />
                  <Circle cx="-31" cy="-24" r="5" fill="#F8FAFC" />
                  <Circle cx="31" cy="-24" r="5" fill="#F8FAFC" />
                  <Rect x="-10" y="0" width="8" height="18" fill="#111827" />
                  <Rect x="2" y="0" width="8" height="18" fill="#111827" />
                </G>
                {/* Top */}
                <Ellipse cx={topX} cy={topY + 6} rx={8 - topIlerle * 4} ry="2.5" fill="rgba(0,0,0,0.35)" />
                <Circle cx={topX} cy={topY} r={9 - topIlerle * 4} fill="#FFFFFF" stroke="#111827" strokeWidth="1.2" />
                <Path d={`M${topX - 3} ${topY - 2} l3 -2 l3 2 l-1 3 h-4 z`} fill="#111827" />
                {/* Nişangâh */}
                {!anim && !bitti && (
                  <G>
                    <Circle cx={kx(nx)} cy={ky(ny)} r="13" stroke="#FCD34D" strokeWidth="2.5" fill="rgba(252,211,77,0.15)" />
                    <Line x1={kx(nx) - 18} y1={ky(ny)} x2={kx(nx) + 18} y2={ky(ny)} stroke="#FCD34D" strokeWidth="1.5" />
                    <Line x1={kx(nx)} y1={ky(ny) - 18} x2={kx(nx)} y2={ky(ny) + 18} stroke="#FCD34D" strokeWidth="1.5" />
                  </G>
                )}
                {anim && anim.kare > 8 && (
                  <SvgText x={W / 2} y="110" fontSize="34" fontWeight="bold" textAnchor="middle" fill={anim.sonuc === 'gol' ? '#FCD34D' : '#FCA5A5'} stroke="#0B1220" strokeWidth="1.5">
                    {anim.sonuc === 'gol' ? 'GOOOL!' : anim.sonuc === 'auta' ? 'AUT!' : 'KURTARDI!'}
                  </SvgText>
                )}
              </Svg>
            </Pressable>
          )}
        </View>
        {bitti ? (
          <>
            <Y s style={{ fontSize: 22, textAlign: 'center', marginTop: 12, color: gol >= 3 ? R.yesil : R.turuncu }}>{gol} / 5 gol</Y>
            <Buton yazi="Ödülü al" ikon="trophy" style={{ marginTop: 10 }} onPress={() => onBitti(gol)} />
          </>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Buton tur="cizgi" yazi="Vazgeç" style={{ flex: 1 }} onPress={onKapat} />
            <Buton yazi="ŞUT!" ikon="football" style={{ flex: 2 }} pasif={!!anim} onPress={sut} />
          </View>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  perde: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3,7,18,0.86)', justifyContent: 'center', alignItems: 'center', padding: 14, zIndex: 60 },
  pencere: { width: '100%', maxWidth: 460, backgroundColor: R.panel, borderRadius: 22, padding: 16, borderWidth: 1.5, borderColor: R.cizgi },
  skorSatir: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 },
  top: { width: 16, height: 16, borderRadius: 8, backgroundColor: R.cizgi, borderWidth: 2, borderColor: '#0B1220' },
});
