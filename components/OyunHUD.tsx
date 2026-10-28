// ============================================
// BEŞLİ PATRON — components/OyunHUD.tsx
// Üst bilgi çubuğu: gün, enerji, nakit, prestij (sekme ekranlarında)
// ============================================
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { MAX_ENERJI } from '../constants/gameConfig';
import { islemKaydet } from '../services/tani';

function gs(v: unknown, varsayilan = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : varsayilan;
}

function paraFormat(n: number): string {
  return Math.round(n).toLocaleString('tr-TR');
}

export default function OyunHUD() {
  const { state } = useGame();
  const yol = usePathname() ?? '';
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const o = Math.max(0.85, Math.min(1.4, width / 375));
  const sonKayit = useRef('');

  // Durum değişimlerini tanı günlüğüne yaz
  useEffect(() => {
    if (!state) return;
    const ozet = `gun=${gs(state.gun, 1)} nakit=${gs(state.nakit)} enerji=${gs(state.enerji)} prestij=${gs(state.prestij)}`;
    if (sonKayit.current !== ozet) {
      sonKayit.current = ozet;
      islemKaydet('state ' + ozet);
    }
  }, [state]);

  if (!state || !yol.startsWith('/tabs')) return null;

  const maks = gs(MAX_ENERJI, 100);
  const enerji = Math.max(0, Math.min(maks, gs(state.enerji)));
  const oran = maks > 0 ? enerji / maks : 0;
  const nakit = gs(state.nakit);
  const prestij = gs(state.prestij);
  const gun = gs(state.gun, 1);

  return (
    <View
      style={[
        styles.dis,
        { paddingHorizontal: 12 * o, paddingTop: Math.max(6 * o, insets.top + 2), paddingBottom: 6 * o },
      ]}
    >
      <View style={[styles.kapsul, { borderRadius: 14 * o, paddingVertical: 7 * o, paddingHorizontal: 10 * o }]}>
        <View style={styles.hucre}>
          <Text style={[styles.ikon, { fontSize: 15 * o }]}>📅</Text>
          <Text style={[styles.deger, { fontSize: 13 * o }]}>Gün {gun}</Text>
        </View>
        <View style={[styles.hucre, { flex: 1 }]}>
          <Text style={[styles.ikon, { fontSize: 15 * o }]}>⚡</Text>
          <View style={styles.enerjiKutu}>
            <Text style={[styles.deger, { fontSize: 13 * o }]}>
              {enerji}/{maks}
            </Text>
            <View style={[styles.enerjiIzgi, { height: 5 * o, borderRadius: 3 * o }]}>
              <View
                style={{
                  height: '100%',
                  width: `${Math.round(oran * 100)}%`,
                  borderRadius: 3 * o,
                  backgroundColor: '#4ADE80',
                }}
              />
            </View>
          </View>
        </View>
        <View style={styles.hucre}>
          <Text style={[styles.ikon, { fontSize: 15 * o }]}>💰</Text>
          <Text style={[styles.deger, { fontSize: 13 * o }]}>{paraFormat(nakit)}₺</Text>
        </View>
        <View style={styles.hucre}>
          <Text style={[styles.ikon, { fontSize: 15 * o }]}>⭐</Text>
          <Text style={[styles.deger, { fontSize: 13 * o }]}>{prestij}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dis: { backgroundColor: 'rgba(10,12,24,0.96)' },
  kapsul: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,41,59,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  hucre: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  ikon: { marginRight: 4 },
  deger: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'SpaceMono' },
  enerjiKutu: { marginLeft: 2, width: 68 },
  enerjiIzgi: { backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 3, overflow: 'hidden' },
});
