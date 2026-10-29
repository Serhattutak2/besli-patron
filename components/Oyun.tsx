// ============================================
// SAHA BİZİM — components/Oyun.tsx
// Oyun kabuğu: üst bar, 5 sekme, alt menü ve pencereler
// ============================================
import React, { useState } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOyun } from '../context/OyunContext';
import * as M from '../engine/motor';
import { R, Y } from './ui';
import UstBar from './UstBar';
import TesisEkrani from './ekranlar/TesisEkrani';
import ProgramEkrani from './ekranlar/ProgramEkrani';
import MahalleEkrani from './ekranlar/MahalleEkrani';
import KulupEkrani from './ekranlar/KulupEkrani';
import PatronEkrani from './ekranlar/PatronEkrani';
import MiniOyun from './MiniOyun';
import GorevPenceresi from './GorevPenceresi';
import Kutlama from './Kutlama';
import { CanliAnPenceresi, GunSonuPenceresi, GeceRaporuPenceresi, HikayePenceresi, SeriPenceresi, Bildirimler, DenemeReklam } from './Pencereler';

type Sekme = 'tesis' | 'program' | 'mahalle' | 'kulup' | 'patron';
const SEKMELER: { id: Sekme; ad: string; ikon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'tesis', ad: 'Tesis', ikon: 'football' },
  { id: 'program', ad: 'Program', ikon: 'call' },
  { id: 'mahalle', ad: 'Mahalle', ikon: 'map' },
  { id: 'kulup', ad: 'Kulüp', ikon: 'shirt' },
  { id: 'patron', ad: 'Patron', ikon: 'person' },
];

export default function Oyun() {
  const { s, yukleniyor, yap } = useOyun();
  const [sekme, setSekme] = useState<Sekme>('tesis');
  const [mini, setMini] = useState(false);
  const [gorev, setGorev] = useState(false);
  const ic = useSafeAreaInsets();

  if (yukleniyor || !s) {
    return (
      <View style={[st.kap, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={R.turuncu} />
        <Y k style={{ marginTop: 10, color: R.soluk }}>Saha hazırlanıyor…</Y>
      </View>
    );
  }

  const rozet: Partial<Record<Sekme, string | null>> = {
    program: s.teklifler.length > 0 ? String(s.teklifler.length) : null,
    mahalle: (s.derbi && !s.derbi.hazir && !s.derbi.sonuc) || (s.kupa && !s.kupa.hazir) || (s.final && !s.finalKazanildi) ? '!' : null,
    kulup: s.miniOyunHak > 0 || s.yeniFormalar.length > 0 || (!s.takim.kuruldu && M.takimKurulabilir(s)) ? '•' : null,
    patron: M.tasinabilir(s) ? '!' : null,
  };

  return (
    <View style={[st.kap, { paddingTop: ic.top }]}>
      <UstBar onGorev={() => setGorev(true)} />
      <View style={{ flex: 1 }}>
        {sekme === 'tesis' && <TesisEkrani />}
        {sekme === 'program' && <ProgramEkrani />}
        {sekme === 'mahalle' && <MahalleEkrani />}
        {sekme === 'kulup' && <KulupEkrani miniAc={() => setMini(true)} />}
        {sekme === 'patron' && <PatronEkrani />}
      </View>
      <View style={[st.menu, { paddingBottom: Math.max(ic.bottom, 8) }]}>
        {SEKMELER.map((x) => {
          const secili = sekme === x.id;
          const r = rozet[x.id];
          return (
            <Pressable key={x.id} style={st.menuBtn} onPress={() => setSekme(x.id)}>
              <View>
                <Ionicons name={secili ? x.ikon : ((x.ikon + '-outline') as any)} size={23} color={secili ? R.turuncu : R.soluk} />
                {r && (
                  <View style={st.menuRozet}>
                    <Y s style={{ fontSize: 10, color: '#FFFFFF' }}>{r}</Y>
                  </View>
                )}
              </View>
              <Y k style={{ fontSize: 10.5, color: secili ? R.turuncu : R.soluk, marginTop: 2 }}>{x.ad}</Y>
            </Pressable>
          );
        })}
      </View>

      <Bildirimler />
      <HikayePenceresi />
      <GeceRaporuPenceresi />
      <SeriPenceresi />
      <CanliAnPenceresi />
      <GunSonuPenceresi />
      {mini && (
        <MiniOyun
          onKapat={() => setMini(false)}
          onBitti={(gol) => {
            setMini(false);
            yap((d) => M.miniOyunSonuc(d, gol));
          }}
        />
      )}
      {gorev && <GorevPenceresi onKapat={() => setGorev(false)} />}
      <Kutlama />
      <DenemeReklam />
    </View>
  );
}

const st = StyleSheet.create({
  kap: { flex: 1, backgroundColor: R.arka },
  menu: { flexDirection: 'row', backgroundColor: R.arka2, borderTopWidth: 1, borderColor: R.cizgi, paddingTop: 7 },
  menuBtn: { flex: 1, alignItems: 'center' },
  menuRozet: { position: 'absolute', top: -4, right: -10, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: R.kirmizi, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
});
