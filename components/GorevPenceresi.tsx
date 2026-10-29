// ============================================
// SAHA BİZİM — components/GorevPenceresi.tsx
// Günlük görevler, haftalık sandık ve 30 kademeli sezon kartı
// ============================================
import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOyun } from '../context/OyunContext';
import * as M from '../engine/motor';
import * as V from '../engine/veri';
import { R, Y, Buton, Cubuk, Rozet } from './ui';

const GOREV_IKON: Record<string, string> = {
  teklif: 'call', mac: 'football', gelir: 'cash', bakim: 'brush', an: 'flash', mini: 'trophy', cay: 'cafe', yukseltme: 'hammer', reklam: 'play-circle', derbi: 'flag', abone: 'heart',
};

export default function GorevPenceresi({ onKapat }: { onKapat: () => void }) {
  const { s, yap, reklamIzle } = useOyun();
  if (!s) return null;
  const kademe = M.sezonKademe(s);
  const xpKademe = s.sezon.xp % V.SEZON_KADEME_XP;
  const kalanGun = Math.max(0, V.SEZON_GUN - (s.gun - s.sezon.baslangic));
  const alinabilir = M.sezonAlinabilir(s);
  return (
    <View style={st.perde}>
      <View style={st.pencere}>
        <View style={[st.satir, { padding: 16, paddingBottom: 6 }]}>
          <Ionicons name="ribbon" size={22} color={R.turuncu} />
          <Y s style={{ fontSize: 19, marginLeft: 8, flex: 1 }}>Görevler ve sezon</Y>
          <Pressable onPress={onKapat} hitSlop={12}>
            <Ionicons name="close" size={24} color={R.soluk} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 6 }} showsVerticalScrollIndicator={false}>
          <Y k style={{ color: R.soluk, fontSize: 12, marginBottom: 8 }}>BUGÜNÜN GÖREVLERİ · yarın yenilenir</Y>
          {s.gorevler.liste.map((g) => {
            const tamam = g.ilerleme >= g.hedef;
            return (
              <View key={g.id} style={[st.gorev, tamam && !g.alindi && { borderColor: R.yesil }]}>
                <View style={[st.ikon, { backgroundColor: g.alindi ? R.kart2 : tamam ? '#14532D' : R.kart2 }]}>
                  <Ionicons name={(g.alindi ? 'checkmark' : GOREV_IKON[g.tur] ?? 'star') as any} size={17} color={g.alindi ? R.soluk : tamam ? '#86EFAC' : R.yazi2} />
                </View>
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Y k style={{ fontSize: 13.5, color: g.alindi ? R.soluk : R.yazi }}>{M.gorevYazi(g)}</Y>
                  <View style={{ marginTop: 5 }}>
                    <Cubuk oran={g.ilerleme / g.hedef} renk={tamam ? R.yesil : R.turuncu} yukseklik={5} />
                  </View>
                  <Y style={{ fontSize: 11, color: R.soluk, marginTop: 3 }}>
                    {g.tur === 'gelir' ? `${M.para(g.ilerleme)} / ${M.para(g.hedef)}` : `${g.ilerleme}/${g.hedef}`} · +{g.xp} puan{g.nakit ? ` · ${M.para(g.nakit)}` : ''}
                  </Y>
                </View>
                {g.alindi ? (
                  <Rozet yazi="ALINDI" renk={R.soluk} />
                ) : tamam ? (
                  <Buton kucuk tur="yesil" yazi="Al" onPress={() => yap((d) => M.gorevAl(d, g.id))} />
                ) : g.tur === 'reklam' && M.reklamHakki(s, 'caymola') > 0 ? (
                  <Buton kucuk tur="reklam" yazi="İzle" onPress={() => reklamIzle('caymola')} />
                ) : null}
              </View>
            );
          })}

          <View style={st.sandik}>
            <Ionicons name="cube" size={30} color={M.haftaSandigiHazir(s) ? R.sari : R.soluk} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Y k>Haftalık sandık</Y>
              <View style={{ marginVertical: 5 }}>
                <Cubuk oran={s.gorevler.haftaTamam / V.GOREV_HAFTA_HEDEF} renk={R.sari} yukseklik={6} />
              </View>
              <Y style={{ fontSize: 11, color: R.soluk }}>
                {s.gorevler.haftaSandikAlindi ? 'Bu haftanın sandığı açıldı' : `${Math.min(s.gorevler.haftaTamam, V.GOREV_HAFTA_HEDEF)}/${V.GOREV_HAFTA_HEDEF} görev · nadir forma ve para`}
              </Y>
            </View>
            {M.haftaSandigiHazir(s) && <Buton kucuk yazi="Aç" onPress={() => yap((d) => M.haftaSandigiAc(d))} />}
          </View>

          <View style={[st.satir, { marginTop: 16, marginBottom: 8 }]}>
            <Y s style={{ fontSize: 16, flex: 1 }}>Sezon {s.sezon.no} kartı</Y>
            <Rozet yazi={`${kalanGun} gün kaldı`} renk={R.mavi} ikon="time" />
          </View>
          <Y style={{ fontSize: 12, color: R.yazi2, marginBottom: 6 }}>
            Kademe {kademe}/{V.SEZON_ODULLERI.length} · sonraki kademeye {V.SEZON_KADEME_XP - xpKademe} puan
          </Y>
          <Cubuk oran={kademe >= V.SEZON_ODULLERI.length ? 1 : xpKademe / V.SEZON_KADEME_XP} renk={R.mor} yukseklik={8} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
            {V.SEZON_ODULLERI.map((o, i) => {
              const k = i + 1;
              const acik = k <= kademe;
              const alindi = s.sezon.alinan.includes(k);
              const ozel = o.forma != null;
              return (
                <Pressable
                  key={k}
                  onPress={() => alinabilir.includes(k) && yap((d) => M.sezonOdulAl(d, k))}
                  style={[st.kademe, ozel && { borderColor: o.forma === 2 ? R.sari : R.mavi }, acik && !alindi && { backgroundColor: '#2E1F5C', borderColor: R.mor }, alindi && { opacity: 0.45 }]}
                >
                  <Y s style={{ fontSize: 12, color: acik ? R.yazi : R.soluk }}>{k}</Y>
                  <Ionicons name={(ozel ? 'shirt' : o.nakit ? 'cash' : o.enerji ? 'flash' : o.itibar ? 'star' : 'cafe') as any} size={20} color={o.forma === 2 ? R.sari : ozel ? R.mavi : acik ? R.turuncu : R.mat} style={{ marginVertical: 4 }} />
                  <Y style={{ fontSize: 9.5, textAlign: 'center', color: acik ? R.yazi2 : R.mat }} numberOfLines={2}>
                    {o.yazi}
                  </Y>
                  {alindi ? <Ionicons name="checkmark-circle" size={14} color={R.yesil} style={{ marginTop: 3 }} /> : acik ? <Y s style={{ fontSize: 10, color: R.mor, marginTop: 3 }}>AL</Y> : null}
                </Pressable>
              );
            })}
          </ScrollView>
          <Y style={{ fontSize: 11, color: R.soluk }}>Sezon bitince alınmamış ödüller otomatik verilir. Puanlar görevlerden ve haftalık sandıktan gelir.</Y>
        </ScrollView>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  perde: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3,7,18,0.8)', justifyContent: 'center', alignItems: 'center', padding: 14, zIndex: 55 },
  pencere: { width: '100%', maxWidth: 460, maxHeight: '90%', backgroundColor: R.panel, borderRadius: 22, borderWidth: 1.5, borderColor: R.cizgi, overflow: 'hidden' },
  satir: { flexDirection: 'row', alignItems: 'center' },
  gorev: { flexDirection: 'row', alignItems: 'center', backgroundColor: R.kart, borderRadius: 14, padding: 10, marginBottom: 8, borderWidth: 1.5, borderColor: R.cizgi },
  ikon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sandik: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A220E', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#78350F', marginTop: 4 },
  kademe: { width: 74, backgroundColor: R.kart, borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1.5, borderColor: R.cizgi },
});
