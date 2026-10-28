// ============================================
// BEŞLİ PATRON — components/OlayModal.tsx
// Günün olayı: seçim yapılana kadar sekme ekranlarının üstünde açık kalır
// ============================================
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { usePathname } from 'expo-router';
import { useGame } from '../context/GameContext';
import { OLAY_HAVUZU } from '../constants/gameConfig';

function gs(v: unknown, varsayilan = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : varsayilan;
}

function etkiOzeti(secenek: any): string {
  const etki = secenek?.etki ?? {};
  const parcalar: string[] = [];
  const nakit = gs(etki.nakit);
  if (nakit !== 0) parcalar.push(`${nakit > 0 ? '+' : ''}${nakit.toLocaleString('tr-TR')}₺`);
  const enerji = gs(etki.enerji);
  if (enerji !== 0) parcalar.push(`${enerji > 0 ? '+' : ''}${enerji} enerji`);
  const jeton = gs(etki.jeton);
  if (jeton !== 0) parcalar.push(`${jeton > 0 ? '+' : ''}${jeton} jeton`);
  const prestij = gs(etki.prestij);
  if (prestij !== 0) parcalar.push(`${prestij > 0 ? '+' : ''}${prestij} prestij`);
  const memnuniyet = gs(etki.memnuniyet);
  if (memnuniyet !== 0) parcalar.push(`${memnuniyet > 0 ? '+' : ''}${memnuniyet} memnuniyet`);
  return parcalar.join(' · ');
}

export default function OlayModal() {
  const { state, cozOlay } = useGame();
  const yol = usePathname() ?? '';
  const { width } = useWindowDimensions();
  const o = Math.max(0.85, Math.min(1.4, width / 375));

  const olayId = state?.bugunOlayId;
  const olay: any = (OLAY_HAVUZU as any[])?.find((x) => x?.id === olayId);

  if (!state || state.isGameOver || !olayId || state.olayCozuldu || !olay) return null;
  if (!yol.startsWith('/tabs')) return null;

  const baslik = olay.ad ?? olay.baslik ?? olay.title ?? 'Günün Olayı';
  const aciklama = olay.aciklama ?? olay.description ?? olay.metin ?? '';
  const secenekler: any[] = Array.isArray(olay.secenekler) ? olay.secenekler : [];
  if (secenekler.length === 0) return null;

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={styles.arka}>
        <View style={[styles.kart, { width: Math.min(340 * o, width - 32), borderRadius: 18 * o, padding: 18 * o }]}>
          <Text style={[styles.baslik, { fontSize: 19 * o }]}>🎲 {baslik}</Text>
          {aciklama ? <Text style={[styles.aciklama, { fontSize: 14 * o }]}>{aciklama}</Text> : null}
          {secenekler.map((s, i) => {
            const etiket = s?.ad ?? s?.metin ?? s?.etiket ?? s?.label ?? `Seçenek ${i + 1}`;
            const ozet = etkiOzeti(s);
            return (
              <TouchableOpacity
                key={i}
                style={[styles.secenek, { paddingVertical: 12 * o, borderRadius: 12 * o, paddingHorizontal: 14 * o }]}
                onPress={() => cozOlay(i)}
              >
                <Text style={[styles.secenekYazi, { fontSize: 14 * o }]}>{etiket}</Text>
                {ozet ? <Text style={[styles.secenekOzet, { fontSize: 12 * o }]}>{ozet}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  arka: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  kart: { backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(245,166,35,0.5)' },
  baslik: { color: '#F5A623', fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  aciklama: { color: '#E5E7EB', lineHeight: 20, marginBottom: 12 },
  secenek: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 10,
  },
  secenekYazi: { color: '#FFFFFF', fontWeight: '700' },
  secenekOzet: { color: '#9CA3AF', marginTop: 3 },
});
