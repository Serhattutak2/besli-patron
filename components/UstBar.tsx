// ============================================
// SAHA BİZİM — components/UstBar.tsx
// Üst bilgi çubuğu: gün, saat, hava, nakit, enerji, itibar, hız
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOyun } from '../context/OyunContext';
import * as M from '../engine/motor';
import * as V from '../engine/veri';
import { R, Y, Cubuk } from './ui';
import { TEST_MODU } from '../constants/ayar';
import { efekt } from '../services/ses';

/** Sayı değişince yumuşakça sayarak ilerler */
function useSayac(hedef: number) {
  const [deger, setDeger] = useState(hedef);
  const ref = useRef(hedef);
  useEffect(() => {
    const bas = ref.current;
    const fark = hedef - bas;
    if (fark >= 200) efekt('para');
    if (Math.abs(fark) < 1) {
      ref.current = hedef;
      setDeger(hedef);
      return;
    }
    const t0 = Date.now();
    const z = setInterval(() => {
      const t = Math.min(1, (Date.now() - t0) / 550);
      const v = bas + fark * (1 - Math.pow(1 - t, 3));
      ref.current = v;
      setDeger(v);
      if (t >= 1) clearInterval(z);
    }, 30);
    return () => clearInterval(z);
  }, [hedef]);
  return deger;
}

export default function UstBar({ onGorev }: { onGorev?: () => void }) {
  const { s, yap, reklamIzle } = useOyun();
  const nakit = useSayac(s?.nakit ?? 0);
  const [parlama, setParlama] = useState(0);
  const onceki = useRef(s?.nakit ?? 0);
  useEffect(() => {
    if (!s) return;
    if (s.nakit > onceki.current + 1) setParlama(Date.now());
    onceki.current = s.nakit;
  }, [s?.nakit]);
  if (!s) return null;
  const bekleyen = M.gorevBekleyen(s);
  const yeniPara = Date.now() - parlama < 700;
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
        <View style={[st.kutu, yeniPara && { backgroundColor: '#14532D' }]}>
          <Ionicons name="cash" size={15} color={R.yesil} />
          <Y s style={{ flexShrink: 1, fontSize: 14, marginLeft: 4, color: s.nakit < 0 ? R.kirmizi : yeniPara ? '#86EFAC' : R.yazi }} numberOfLines={1}>
            {M.para(nakit)}
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
        <View style={[st.kutu, { flex: 0.7 }]}>
          <Ionicons name="star" size={14} color={R.turuncu} />
          <Y s style={{ fontSize: 13.5, marginLeft: 4 }} numberOfLines={1}>{Math.round(s.itibar)}</Y>
        </View>
        <Pressable style={[st.kutu, st.gorev, bekleyen > 0 && { backgroundColor: '#2E1F5C', borderColor: R.mor }]} onPress={onGorev}>
          <Ionicons name="ribbon" size={17} color={bekleyen > 0 ? R.mor : R.yazi2} />
          {bekleyen > 0 && (
            <View style={st.rozet}>
              <Y s style={{ fontSize: 9.5, color: '#FFFFFF' }}>{bekleyen}</Y>
            </View>
          )}
        </Pressable>
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
  kutu: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: R.panel, borderRadius: 11, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: 'transparent' },
  gorev: { flexGrow: 0, flexShrink: 0, flexBasis: 40, width: 40, justifyContent: 'center', paddingHorizontal: 0 },
  rozet: { position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: R.kirmizi, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
});
