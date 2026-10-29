// ============================================
// SAHA BİZİM — components/UstBar.tsx
// Üst bilgi çubuğu: gün, saat, hava, nakit, enerji, itibar, hız
// ============================================
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOyun } from '../context/OyunContext';
import * as M from '../engine/motor';
import * as V from '../engine/veri';
import { R, Y, Cubuk } from './ui';
import { TEST_MODU } from '../constants/ayar';

export default function UstBar() {
  const { s, yap, reklamIzle } = useOyun();
  if (!s) return null;
  const hava = V.HAVALAR[s.hava] ?? V.HAVALAR.bulutlu;
  const enerjiOran = s.enerji / V.MAKS_ENERJI;
  const az = s.enerji < 25;
  return (
    <View style={st.kap}>
      <View style={st.ust}>
        <View style={{ flex: 1 }}>
          <Y s style={{ fontSize: 15 }}>
            {s.gun}. Gün · {V.GUN_KISA[V.haftaGunu(s.gun)]}
          </Y>
          <View style={st.satir}>
            <Ionicons name={hava.ikon as any} size={13} color={R.sari} />
            <Y k style={{ fontSize: 13, color: R.sari, marginLeft: 4 }}>
              {s.gunBitti ? '03:00' : V.dakikaYazi(s.dakika)}
            </Y>
            <Y style={{ fontSize: 11, color: R.soluk, marginLeft: 6 }}>{M.sehir(s).ad}</Y>
            {TEST_MODU && <Y s style={{ fontSize: 10, color: '#1A1205', backgroundColor: R.mor, borderRadius: 6, paddingHorizontal: 5, marginLeft: 6, overflow: 'hidden' }}>DENEME</Y>}
          </View>
        </View>
        <View style={st.hiz}>
          {((TEST_MODU ? [0, 1, 2, 4, 8] : [0, 1, 2, 4]) as (0 | 1 | 2 | 4 | 8)[]).map((h) => {
            const secili = h === 0 ? s.duraklat : !s.duraklat && s.hiz === h;
            return (
              <Pressable
                key={h}
                onPress={() => yap((d) => (h === 0 ? { ...d, duraklat: !d.duraklat } : { ...M.hizAyarla(d, h), duraklat: false }))}
                style={[st.hizBtn, secili && st.hizSecili]}
              >
                {h === 0 ? (
                  <Ionicons name={s.duraklat ? 'play' : 'pause'} size={13} color={secili ? '#1A1205' : R.yazi2} />
                ) : (
                  <Y s style={{ fontSize: 11.5, color: secili ? '#1A1205' : R.yazi2 }}>
                    {h}x
                  </Y>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={st.alt}>
        <View style={st.kutu}>
          <Ionicons name="cash" size={15} color={R.yesil} />
          <Y s style={{ fontSize: 14, marginLeft: 4, color: s.nakit < 0 ? R.kirmizi : R.yazi }} numberOfLines={1}>
            {M.para(s.nakit)}
          </Y>
        </View>
        <Pressable
          style={[st.kutu, { flex: 1.15 }]}
          onPress={() => az && M.reklamHakki(s, 'caymola') > 0 && reklamIzle('caymola')}
        >
          <Ionicons name="flash" size={15} color={az ? R.kirmizi : R.sari} />
          <View style={{ flex: 1, marginLeft: 4 }}>
            <Cubuk oran={enerjiOran} renk={az ? R.kirmizi : R.sari} yukseklik={7} />
          </View>
          <Y k style={{ fontSize: 12, marginLeft: 5 }}>{Math.round(s.enerji)}</Y>
          {az && M.reklamHakki(s, 'caymola') > 0 && <Ionicons name="play-circle" size={16} color={R.mor} style={{ marginLeft: 3 }} />}
        </Pressable>
        <View style={[st.kutu, { flex: 0.75 }]}>
          <Ionicons name="star" size={14} color={R.turuncu} />
          <Y s style={{ fontSize: 13.5, marginLeft: 4 }}>{Math.round(s.itibar)}</Y>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  kap: { backgroundColor: R.arka2, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8, borderBottomWidth: 1, borderColor: R.cizgi },
  ust: { flexDirection: 'row', alignItems: 'center' },
  satir: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  hiz: { flexDirection: 'row', backgroundColor: R.panel, borderRadius: 12, padding: 3 },
  hizBtn: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, minWidth: 30, alignItems: 'center' },
  hizSecili: { backgroundColor: R.turuncu },
  alt: { flexDirection: 'row', marginTop: 7, gap: 6 },
  kutu: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: R.panel, borderRadius: 11, paddingHorizontal: 8, paddingVertical: 6 },
});
