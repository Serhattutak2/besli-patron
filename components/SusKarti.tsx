// ============================================
// SAHA BİZİM — components/SusKarti.tsx
// 3. etap: tesisini kişiselleştir (çim, tabela, bayrak, maskot)
// ============================================
import React, { useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOyun } from '../context/OyunContext';
import * as M from '../engine/motor';
import * as V from '../engine/veri';
import { R, Y, Kart, Baslik } from './ui';

const TURLER: { id: M.SusTuru; ad: string; ikon: any }[] = [
  { id: 'cim', ad: 'Çim', ikon: 'leaf' },
  { id: 'tabela', ad: 'Tabela', ikon: 'easel' },
  { id: 'bayrak', ad: 'Bayrak', ikon: 'flag' },
  { id: 'maskot', ad: 'Maskot', ikon: 'happy' },
];
const MASKOT_IKON = ['remove-circle-outline', 'paw', 'airplane', 'star', 'paw'];

export default function SusKarti() {
  const { s, yap } = useOyun();
  const [tur, setTur] = useState<M.SusTuru>('cim');
  if (!s) return null;
  const c = M.maliyetCarpan(s);
  const secenekler = M.susSecenekleri(tur);
  const secili = s.tesisSus[tur];
  return (
    <Kart>
      <Baslik ikon="color-palette">Tesisini süsle</Baslik>
      <Y style={{ color: R.yazi2, fontSize: 12.5, marginBottom: 8 }}>Seçtiğin her şey sahnede görünür. Bir kez alınca istediğin zaman geri dönersin. Her yeni süs +2 itibar.</Y>
      <View style={st.segment}>
        {TURLER.map((x) => (
          <Pressable key={x.id} onPress={() => setTur(x.id)} style={[st.seg, tur === x.id && st.segSec]}>
            <Ionicons name={x.ikon} size={15} color={tur === x.id ? '#1A1205' : R.yazi2} />
            <Y k style={{ fontSize: 11.5, color: tur === x.id ? '#1A1205' : R.yazi2 }}>{x.ad}</Y>
          </Pressable>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {secenekler.map((o, i) => {
          const acik = M.susAcikMi(s, tur, i);
          const sec = secili === i;
          return (
            <Pressable key={i} onPress={() => yap((d) => M.susSec(d, tur, i))} style={[st.kutu, sec && { borderColor: R.turuncu, backgroundColor: '#3A2A0A' }]}>
              <Onizleme tur={tur} i={i} />
              <Y k numberOfLines={2} style={{ fontSize: 11, textAlign: 'center', marginTop: 6, color: sec ? R.sari : R.yazi }}>{o.ad}</Y>
              <Y style={{ fontSize: 10.5, color: acik ? R.yesil : R.soluk, marginTop: 2 }}>{sec ? 'Seçili' : acik ? 'Senin' : M.para(o.bedel * c)}</Y>
            </Pressable>
          );
        })}
      </ScrollView>
    </Kart>
  );
}

function Onizleme({ tur, i }: { tur: M.SusTuru; i: number }) {
  if (tur === 'cim') {
    const o = V.CIM_SECENEK[i];
    return (
      <View style={[st.on, { flexDirection: 'row', overflow: 'hidden' }]}>
        {[0, 1, 2, 3].map((k) => (
          <View key={k} style={{ flex: 1, backgroundColor: k % 2 ? o.a : o.b }} />
        ))}
      </View>
    );
  }
  if (tur === 'tabela') {
    const o = V.TABELA_SECENEK[i];
    return (
      <View style={[st.on, { backgroundColor: o.zemin, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: o.yazi }]}>
        <Y s style={{ fontSize: 9, color: o.yazi }}>SAHA BİZİM</Y>
      </View>
    );
  }
  if (tur === 'bayrak') {
    const o = V.BAYRAK_SECENEK[i];
    return (
      <View style={[st.on, { overflow: 'hidden' }]}>
        <View style={{ flex: 1, backgroundColor: o.a }} />
        <View style={{ flex: 1, backgroundColor: o.b }} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="star" size={16} color={o.a === '#FFFFFF' ? o.b : '#FFFFFF'} />
        </View>
      </View>
    );
  }
  return (
    <View style={[st.on, { backgroundColor: R.kart2, alignItems: 'center', justifyContent: 'center' }]}>
      <Ionicons name={MASKOT_IKON[i] as any} size={24} color={i === 0 ? R.mat : R.sari} />
    </View>
  );
}

const st = StyleSheet.create({
  segment: { flexDirection: 'row', backgroundColor: R.arka2, borderRadius: 12, padding: 3, marginBottom: 8 },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 9, gap: 2 },
  segSec: { backgroundColor: R.turuncu },
  kutu: { width: 92, backgroundColor: R.kart, borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1.5, borderColor: R.cizgi },
  on: { width: 70, height: 40, borderRadius: 8 },
});
