// ============================================
// SAHA BİZİM — components/BeceriOyunu.tsx
// Canlı anlardaki kısa beceri oyunları:
// dokun (hızlı dokun), yakala (kaçan topu yakala), var (görüntüden karar ver),
// pazarlik (ibreyi yeşilde durdur)
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Rect, Circle, Line, G, Path, Text as SvgText } from 'react-native-svg';
import type { MiniOyunTuru } from '../engine/anlar';
import { R, Y, Buton, Cubuk } from './ui';

export default function BeceriOyunu({ tur, onBitti, hirsiz }: { tur: MiniOyunTuru; onBitti: (basarili: boolean) => void; hirsiz?: boolean }) {
  if (tur === 'dokun') return <Dokun onBitti={onBitti} />;
  if (tur === 'yakala') return <Yakala onBitti={onBitti} hirsiz={hirsiz} />;
  if (tur === 'var') return <Var onBitti={onBitti} />;
  return <Pazarlik onBitti={onBitti} />;
}

function useSure(ms: number, calis: boolean) {
  const [kalan, setKalan] = useState(ms);
  useEffect(() => {
    if (!calis) return;
    const bas = Date.now();
    const z = setInterval(() => setKalan(Math.max(0, ms - (Date.now() - bas))), 50);
    return () => clearInterval(z);
  }, [calis]);
  return kalan;
}

function Dokun({ onBitti }: { onBitti: (b: boolean) => void }) {
  const HEDEF = 14;
  const [say, setSay] = useState(0);
  const [bitti, setBitti] = useState(false);
  const kalan = useSure(5000, !bitti);
  useEffect(() => {
    if (bitti) return;
    if (say >= HEDEF) {
      setBitti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => onBitti(true), 500);
    } else if (kalan <= 0) {
      setBitti(true);
      setTimeout(() => onBitti(false), 500);
    }
  }, [say, kalan]);
  return (
    <View>
      <Y k style={{ textAlign: 'center', marginBottom: 8 }}>{bitti ? (say >= HEDEF ? 'Başardın!' : 'Yetişemedin!') : 'Hızlı hızlı dokun!'}</Y>
      <Cubuk oran={say / HEDEF} renk={R.yesil} yukseklik={12} />
      <View style={{ marginVertical: 6 }}>
        <Cubuk oran={kalan / 5000} renk={R.turuncu} yukseklik={4} />
      </View>
      <Pressable
        disabled={bitti}
        onPress={() => {
          setSay((x) => x + 1);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }}
        style={({ pressed }) => [st.dev, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
      >
        <Y s style={{ fontSize: 26, color: '#1A1205' }}>{bitti ? (say >= HEDEF ? '✓' : '✕') : `${say} / ${HEDEF}`}</Y>
        <Y k style={{ color: '#1A1205' }}>DOKUN!</Y>
      </Pressable>
    </View>
  );
}

function Yakala({ onBitti, hirsiz }: { onBitti: (b: boolean) => void; hirsiz?: boolean }) {
  const [gen, setGen] = useState(0);
  const [poz, setPoz] = useState({ x: 0.5, y: 0.5, vx: 0.022, vy: 0.017 });
  const [yakalanan, setYakalanan] = useState(0);
  const [bitti, setBitti] = useState(false);
  const kalan = useSure(6000, !bitti);
  const HEDEF = 2;
  useEffect(() => {
    if (bitti) return;
    const z = setInterval(() => {
      setPoz((p) => {
        let { x, y, vx, vy } = p;
        x += vx;
        y += vy;
        if (x < 0.08 || x > 0.92) vx = -vx;
        if (y < 0.12 || y > 0.88) vy = -vy;
        if (Math.random() < 0.03) vx = (Math.random() - 0.5) * 0.06;
        return { x: Math.max(0.08, Math.min(0.92, x)), y: Math.max(0.12, Math.min(0.88, y)), vx, vy };
      });
    }, 30);
    return () => clearInterval(z);
  }, [bitti]);
  useEffect(() => {
    if (bitti) return;
    if (yakalanan >= HEDEF) {
      setBitti(true);
      setTimeout(() => onBitti(true), 500);
    } else if (kalan <= 0) {
      setBitti(true);
      setTimeout(() => onBitti(false), 500);
    }
  }, [yakalanan, kalan]);
  const yuk = 180;
  const r = 24;
  return (
    <View>
      <Y k style={{ textAlign: 'center', marginBottom: 8 }}>{bitti ? (yakalanan >= HEDEF ? 'Yakaladın!' : 'Kaçtı!') : `${hirsiz ? 'Hırsızı' : 'Topu'} yakala! (${yakalanan}/${HEDEF})`}</Y>
      <Cubuk oran={kalan / 6000} renk={R.turuncu} yukseklik={4} />
      <View onLayout={(e: LayoutChangeEvent) => setGen(e.nativeEvent.layout.width)} style={[st.alan, { height: yuk }]}>
        {gen > 0 && (
          <Pressable
            disabled={bitti}
            onPress={() => {
              setYakalanan((x) => x + 1);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setPoz((p) => ({ ...p, x: Math.random() * 0.8 + 0.1, y: Math.random() * 0.7 + 0.15, vx: p.vx * 1.3, vy: p.vy * 1.3 }));
            }}
            style={{ position: 'absolute', left: poz.x * gen - r, top: poz.y * yuk - r, width: r * 2, height: r * 2 }}
          >
            <Svg width={r * 2} height={r * 2} viewBox="0 0 40 40">
              {hirsiz ? (
                <G>
                  <Circle cx="20" cy="9" r="7" fill="#111827" />
                  <Rect x="13" y="7" width="14" height="3" fill="#E5E7EB" />
                  <Rect x="12" y="16" width="16" height="16" rx="4" fill="#111827" />
                  <Line x1="16" y1="32" x2="13" y2="39" stroke="#111827" strokeWidth="3" />
                  <Line x1="24" y1="32" x2="27" y2="39" stroke="#111827" strokeWidth="3" />
                </G>
              ) : (
                <G>
                  <Circle cx="20" cy="20" r="17" fill="#FFFFFF" stroke="#111827" strokeWidth="2" />
                  <Path d="M14 16 l6 -4 l6 4 l-2 7 h-8 z" fill="#111827" />
                </G>
              )}
            </Svg>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Var({ onBitti }: { onBitti: (b: boolean) => void }) {
  const durum = useMemo(() => {
    const faul = Math.random() < 0.5;
    const ceza = Math.random() < 0.75; // temas ceza sahası içinde mi
    return { faul, ceza, dogru: faul && ceza };
  }, []);
  const [cevap, setCevap] = useState<null | boolean>(null);
  const [gen, setGen] = useState(0);
  const cevapla = (p: boolean) => {
    if (cevap != null) return;
    setCevap(p);
    const dogru = p === durum.dogru;
    Haptics.notificationAsync(dogru ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
    setTimeout(() => onBitti(dogru), 900);
  };
  // temas noktası: ceza sahası çizgisinin (y=70) önü ya da arkası
  const temasY = durum.ceza ? 82 : 58;
  return (
    <View>
      <Y k style={{ textAlign: 'center', marginBottom: 8 }}>Görüntüyü incele: Penaltı var mı?</Y>
      <View onLayout={(e: LayoutChangeEvent) => setGen(e.nativeEvent.layout.width)} style={{ borderRadius: 12, overflow: 'hidden' }}>
        {gen > 0 && (
          <Svg width={gen} height={gen * 0.5} viewBox="0 0 240 120">
            <Rect width="240" height="120" fill="#2F9E44" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Rect key={i} y={i * 20} width="240" height="10" fill="#2B8A3E" />
            ))}
            <Line x1="0" y1="70" x2="240" y2="70" stroke="#FFFFFF" strokeWidth="2.5" />
            <SvgText x="6" y="66" fontSize="7" fill="#FFFFFF">
              CEZA SAHASI ÇİZGİSİ
            </SvgText>
            <G transform={`translate(110 ${temasY - 22})`}>
              <Rect x="-6" y="0" width="12" height="16" rx="3" fill="#EF4444" />
              <Circle cx="0" cy="-5" r="5" fill="#E0AC69" />
              <Line x1="-3" y1="16" x2="-5" y2="28" stroke="#1F2937" strokeWidth="3" />
              <Line x1="3" y1="16" x2="8" y2="26" stroke="#1F2937" strokeWidth="3" />
            </G>
            <G transform={`translate(${durum.faul ? 132 : 146} ${temasY - 20})`}>
              <Rect x="-6" y="0" width="12" height="16" rx="3" fill="#3B82F6" />
              <Circle cx="0" cy="-5" r="5" fill="#C68642" />
              <Line x1="-3" y1="16" x2={durum.faul ? -16 : -8} y2={durum.faul ? 22 : 28} stroke="#1F2937" strokeWidth="3" />
              <Line x1="3" y1="16" x2="5" y2="28" stroke="#1F2937" strokeWidth="3" />
            </G>
            {durum.faul && <Circle cx="118" cy={temasY + 4} r="7" fill="none" stroke="#FCD34D" strokeWidth="2" strokeDasharray="3 2" />}
            <Circle cx="104" cy={temasY + 8} r="4" fill="#FFFFFF" stroke="#111827" />
            <Rect x="180" y="4" width="56" height="16" rx="3" fill="#0B1220" />
            <SvgText x="208" y="15" fontSize="9" fontWeight="bold" fill="#FCD34D" textAnchor="middle">
              VAR · 0.25x
            </SvgText>
          </Svg>
        )}
      </View>
      <Y style={{ fontSize: 11.5, color: R.soluk, marginTop: 6 }}>İpucu: temas var mı ve çizginin içinde mi?</Y>
      {cevap == null ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Buton kucuk tur="kirmizi" yazi="Penaltı!" style={{ flex: 1 }} onPress={() => cevapla(true)} />
          <Buton kucuk tur="koyu" yazi="Devam, penaltı yok" style={{ flex: 1 }} onPress={() => cevapla(false)} />
        </View>
      ) : (
        <Y s style={{ textAlign: 'center', marginTop: 10, color: cevap === durum.dogru ? R.yesil : R.kirmizi }}>
          {cevap === durum.dogru ? 'Doğru karar!' : durum.dogru ? 'Penaltıydı!' : !durum.faul ? 'Temas yoktu!' : 'Temas ceza sahası dışındaydı!'}
        </Y>
      )}
    </View>
  );
}

function Pazarlik({ onBitti }: { onBitti: (b: boolean) => void }) {
  const [t, setT] = useState(0);
  const [durdu, setDurdu] = useState<null | number>(null);
  const bolge = useMemo(() => {
    const bas = 0.25 + Math.random() * 0.45;
    return [bas, bas + 0.16] as [number, number];
  }, []);
  const ref = useRef(0);
  useEffect(() => {
    if (durdu != null) return;
    const z = setInterval(() => {
      ref.current += 1;
      setT(ref.current);
    }, 30);
    return () => clearInterval(z);
  }, [durdu]);
  const ibre = durdu ?? 0.5 + 0.5 * Math.sin(t * 0.07);
  const durdur = () => {
    if (durdu != null) return;
    setDurdu(ibre);
    const ok = ibre >= bolge[0] && ibre <= bolge[1];
    Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
    setTimeout(() => onBitti(ok), 800);
  };
  const basarili = durdu != null && durdu >= bolge[0] && durdu <= bolge[1];
  return (
    <View>
      <Y k style={{ textAlign: 'center', marginBottom: 10 }}>İbre yeşil bölgedeyken "Anlaştık!" de</Y>
      <View style={st.pazarCubuk}>
        <View style={{ position: 'absolute', left: `${bolge[0] * 100}%`, width: `${(bolge[1] - bolge[0]) * 100}%`, top: 0, bottom: 0, backgroundColor: R.yesil, opacity: 0.85 }} />
        <View style={{ position: 'absolute', left: `${ibre * 100}%`, top: -6, bottom: -6, width: 4, marginLeft: -2, backgroundColor: R.yazi, borderRadius: 2 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Y style={{ fontSize: 11, color: R.soluk }}>Çok düşük</Y>
        <Y style={{ fontSize: 11, color: R.soluk }}>Çok yüksek</Y>
      </View>
      {durdu == null ? (
        <Buton style={{ marginTop: 10 }} yazi="Anlaştık!" ikon="hand-left" onPress={durdur} />
      ) : (
        <Y s style={{ textAlign: 'center', marginTop: 10, color: basarili ? R.yesil : R.kirmizi }}>{basarili ? 'El sıkıştınız!' : 'Pazarlık bozuldu!'}</Y>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  dev: { marginTop: 10, height: 120, borderRadius: 60, backgroundColor: R.turuncu, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', width: 120 },
  alan: { marginTop: 8, backgroundColor: '#1E5B2E', borderRadius: 12, overflow: 'hidden' },
  pazarCubuk: { height: 22, backgroundColor: R.kirmiziKoyu, borderRadius: 8, overflow: 'visible', marginHorizontal: 4 },
});
