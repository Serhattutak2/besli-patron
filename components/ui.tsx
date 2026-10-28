// ============================================
// SAHA BİZİM — components/ui.tsx
// Ortak arayüz parçaları: renkler, yazı tipleri, kart, buton, rozet, çubuk, kalp,
// forma ve Ela çizimleri.
// ============================================
import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect, Ellipse, G, Text as SvgText } from 'react-native-svg';

export const R = {
  arka: '#0C1424',
  arka2: '#111C31',
  panel: '#16233B',
  kart: '#1C2C48',
  kart2: '#22355A',
  cizgi: '#2B4166',
  yazi: '#F1F5F9',
  yazi2: '#CBD5E1',
  soluk: '#8DA2C0',
  mat: '#5F7392',
  turuncu: '#F59E0B',
  turuncuKoyu: '#B45309',
  sari: '#FCD34D',
  yesil: '#22C55E',
  yesilKoyu: '#14532D',
  kirmizi: '#EF4444',
  kirmiziKoyu: '#7F1D1D',
  mavi: '#38BDF8',
  mor: '#A78BFA',
  pembe: '#F472B6',
} as const;

export const F = {
  normal: 'Nunito_600SemiBold',
  kalin: 'Nunito_800ExtraBold',
  siyah: 'Nunito_900Black',
} as const;

export function Y({ style, children, k, s, numberOfLines }: { style?: StyleProp<TextStyle>; children: React.ReactNode; k?: boolean; s?: boolean; numberOfLines?: number }) {
  return (
    <Text numberOfLines={numberOfLines} style={[{ color: R.yazi, fontFamily: s ? F.siyah : k ? F.kalin : F.normal, fontSize: 14 }, style]}>
      {children}
    </Text>
  );
}

export function Kart({ children, style, vurgu }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; vurgu?: string }) {
  return <View style={[st.kart, vurgu ? { borderColor: vurgu, borderWidth: 1.5 } : null, style]}>{children}</View>;
}

export function Baslik({ children, ikon, sag }: { children: React.ReactNode; ikon?: keyof typeof Ionicons.glyphMap; sag?: React.ReactNode }) {
  return (
    <View style={st.baslikSatir}>
      {ikon && <Ionicons name={ikon} size={18} color={R.turuncu} style={{ marginRight: 6 }} />}
      <Y s style={{ fontSize: 17, flex: 1 }}>
        {children}
      </Y>
      {sag}
    </View>
  );
}

type ButonTur = 'ana' | 'yesil' | 'kirmizi' | 'koyu' | 'reklam' | 'cizgi';
const BUTON_RENK: Record<ButonTur, { bg: string; yazi: string; kenar?: string }> = {
  ana: { bg: R.turuncu, yazi: '#1A1205' },
  yesil: { bg: R.yesil, yazi: '#052E16' },
  kirmizi: { bg: R.kirmizi, yazi: '#FFFFFF' },
  koyu: { bg: R.kart2, yazi: R.yazi },
  reklam: { bg: '#7C3AED', yazi: '#FFFFFF' },
  cizgi: { bg: 'transparent', yazi: R.yazi2, kenar: R.cizgi },
};

export function Buton({
  yazi,
  alt,
  onPress,
  tur = 'ana',
  ikon,
  pasif,
  kucuk,
  style,
}: {
  yazi: string;
  alt?: string;
  onPress?: () => void;
  tur?: ButonTur;
  ikon?: keyof typeof Ionicons.glyphMap;
  pasif?: boolean;
  kucuk?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const r = BUTON_RENK[tur];
  return (
    <Pressable
      onPress={pasif ? undefined : onPress}
      style={({ pressed }) => [
        st.buton,
        { backgroundColor: pasif ? '#33415A' : r.bg, borderColor: r.kenar ?? 'transparent', borderWidth: r.kenar ? 1.5 : 0 },
        kucuk && st.butonKucuk,
        pressed && !pasif && { transform: [{ scale: 0.97 }], opacity: 0.92 },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        {tur === 'reklam' && <Ionicons name="play-circle" size={kucuk ? 15 : 18} color={r.yazi} style={{ marginRight: 5 }} />}
        {ikon && <Ionicons name={ikon} size={kucuk ? 14 : 17} color={pasif ? R.soluk : r.yazi} style={{ marginRight: 5 }} />}
        <Y s style={{ color: pasif ? R.soluk : r.yazi, fontSize: kucuk ? 12.5 : 15 }}>
          {yazi}
        </Y>
      </View>
      {alt ? <Y style={{ color: pasif ? R.mat : r.yazi, opacity: 0.85, fontSize: kucuk ? 10.5 : 11.5, marginTop: 1, textAlign: 'center' }}>{alt}</Y> : null}
    </Pressable>
  );
}

export function Rozet({ yazi, renk = R.turuncu, ikon }: { yazi: string; renk?: string; ikon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={[st.rozet, { backgroundColor: renk + '26', borderColor: renk + '88' }]}>
      {ikon && <Ionicons name={ikon} size={11} color={renk} style={{ marginRight: 3 }} />}
      <Y k style={{ color: renk, fontSize: 11 }}>
        {yazi}
      </Y>
    </View>
  );
}

export function Cubuk({ oran, renk = R.yesil, yukseklik = 8, arka = '#0B1424' }: { oran: number; renk?: string; yukseklik?: number; arka?: string }) {
  return (
    <View style={{ height: yukseklik, backgroundColor: arka, borderRadius: yukseklik, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${Math.max(0, Math.min(1, oran)) * 100}%`, backgroundColor: renk, borderRadius: yukseklik }} />
    </View>
  );
}

export function Kalpler({ sevgi, boyut = 12 }: { sevgi: number; boyut?: number }) {
  const dolu = sevgi / 20;
  return (
    <View style={{ flexDirection: 'row' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Ionicons key={i} name={dolu >= i + 1 ? 'heart' : dolu > i + 0.4 ? 'heart-half' : 'heart-outline'} size={boyut} color={dolu > i ? R.pembe : R.mat} style={{ marginRight: 1 }} />
      ))}
    </View>
  );
}

/** Forma çizimi */
export function Forma({ renk1, renk2, numara, boyut = 56, kilitli, nadirlik }: { renk1: string; renk2: string; numara: number; boyut?: number; kilitli?: boolean; nadirlik?: number }) {
  const r1 = kilitli ? '#26344F' : renk1;
  const r2 = kilitli ? '#2E3D5A' : renk2;
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 60 60">
      {nadirlik === 2 && !kilitli && <Circle cx="30" cy="30" r="29" fill="#F59E0B" opacity={0.18} />}
      <Path d="M18 8 L24 5 Q30 10 36 5 L42 8 L54 18 L47 27 L43 23 L43 54 L17 54 L17 23 L13 27 L6 18 Z" fill={r1} stroke={kilitli ? '#3B4C6B' : 'rgba(0,0,0,0.35)'} strokeWidth="1.5" />
      {!kilitli && <Path d="M24 5 Q30 10 36 5 L35 9 Q30 13 25 9 Z" fill={r2} />}
      {!kilitli && <Rect x="17" y="40" width="26" height="4" fill={r2} opacity={0.8} />}
      {kilitli ? (
        <SvgText x="30" y="38" fontSize="16" fontWeight="bold" fill="#4B5D7E" textAnchor="middle">
          ?
        </SvgText>
      ) : (
        <SvgText x="30" y="36" fontSize="15" fontWeight="bold" fill={r2} textAnchor="middle">
          {numara}
        </SvgText>
      )}
    </Svg>
  );
}

/** Yardımcı karakter Ela */
export function Ela({ boyut = 54 }: { boyut?: number }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 60 60">
      <Circle cx="30" cy="30" r="29" fill="#2B3F66" />
      <Path d="M12 44 Q14 18 30 16 Q46 18 48 44 Q44 50 30 50 Q16 50 12 44 Z" fill="#5B2E1A" />
      <Ellipse cx="30" cy="31" rx="12" ry="13" fill="#F1C9A5" />
      <Path d="M18 28 Q22 15 33 17 Q42 19 42 29 Q36 22 26 24 Q21 25 18 28 Z" fill="#6B3420" />
      <Circle cx="25.5" cy="31" r="1.6" fill="#1F2937" />
      <Circle cx="34.5" cy="31" r="1.6" fill="#1F2937" />
      <Path d="M26 37 Q30 40 34 37" stroke="#B4533A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <Circle cx="22.5" cy="35" r="2" fill="#F9A8A8" opacity={0.6} />
      <Circle cx="37.5" cy="35" r="2" fill="#F9A8A8" opacity={0.6} />
      <Path d="M16 58 Q18 46 30 46 Q42 46 44 58 Z" fill="#F59E0B" />
      <G>
        <Rect x="27" y="47" width="6" height="5" fill="#FCD34D" />
      </G>
    </Svg>
  );
}

/** Ela'nın konuşma balonu */
export function ElaDiyor({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-start' }, style]}>
      <Ela boyut={44} />
      <View style={st.balon}>
        <Y style={{ fontSize: 13, color: R.yazi, lineHeight: 18 }}>{children}</Y>
      </View>
    </View>
  );
}

export const st = StyleSheet.create({
  kart: { backgroundColor: R.panel, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: R.cizgi, marginBottom: 12 },
  baslikSatir: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  buton: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  butonKucuk: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 11 },
  rozet: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2.5, borderWidth: 1, alignSelf: 'flex-start' },
  balon: { flex: 1, marginLeft: 8, backgroundColor: R.kart, borderRadius: 14, borderTopLeftRadius: 4, padding: 10, borderWidth: 1, borderColor: R.cizgi },
  satir: { flexDirection: 'row', alignItems: 'center' },
});
