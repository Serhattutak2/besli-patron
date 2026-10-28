// ============================================
// SAHA BİZİM — components/ekranlar/MahalleEkrani.tsx
// Mahalle haritası, mahalle takımları, Pazar derbisi ve rakip patron
// ============================================
import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, G, Text as SvgText, Circle, Rect, Line } from 'react-native-svg';
import { useOyun } from '../../context/OyunContext';
import * as M from '../../engine/motor';
import * as V from '../../engine/veri';
import { R, Y, Kart, Baslik, Buton, Rozet, Cubuk, Kalpler } from '../ui';

const KONUM: [number, number][] = [
  [92, 78],
  [230, 64],
  [300, 160],
  [190, 160],
  [78, 200],
  [232, 246],
];
function blob(cx: number, cy: number, r: number, tohum: number) {
  const n = 9;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.82 + 0.18 * Math.sin(tohum * 3.1 + i * 1.7));
    const x = cx + Math.cos(a) * rr * 1.25;
    const y = cy + Math.sin(a) * rr;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d + 'Z';
}
function karis(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((x, i) => Math.round(x + (pb[i] - x) * t).toString(16).padStart(2, '0')).join('');
}

export default function MahalleEkrani() {
  const { s } = useOyun();
  const [secili, setSecili] = useState(0);
  const [gen, setGen] = useState(0);
  if (!s) return null;
  const sh = M.sehir(s);
  const m = sh.mahalleler[secili];
  const kontrol = s.mahalleKontrol[m.id] ?? 0;
  const sahip = s.mahalleSahip[m.id];
  const toplamSahip = M.sahipMahalleSayisi(s);

  return (
    <ScrollView contentContainerStyle={st.icerik} showsVerticalScrollIndicator={false}>
      <Kart style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ padding: 14, paddingBottom: 0 }}>
          <Baslik ikon="map" sag={<Rozet yazi={`${toplamSahip}/${sh.mahalleler.length} senin`} renk={R.turuncu} />}>
            {sh.ad} haritası
          </Baslik>
        </View>
        <View onLayout={(e: LayoutChangeEvent) => setGen(e.nativeEvent.layout.width)}>
          {gen > 0 && (
            <Svg width={gen} height={(gen * 300) / 360} viewBox="0 0 360 300">
              <Rect x="0" y="0" width="360" height="300" fill="#0E1A2E" />
              {Array.from({ length: 10 }).map((_, i) => (
                <Line key={`y${i}`} x1="0" y1={i * 32} x2="360" y2={i * 32} stroke="#13233B" strokeWidth="1" />
              ))}
              {Array.from({ length: 12 }).map((_, i) => (
                <Line key={`x${i}`} x1={i * 32} y1="0" x2={i * 32} y2="300" stroke="#13233B" strokeWidth="1" />
              ))}
              {(sh.id === 'istanbul' || sh.id === 'izmir' || sh.id === 'antalya' || sh.id === 'dubai' || sh.id === 'trabzon') && (
                <Path d="M0 120 Q120 140 150 118 Q180 96 360 112 L360 132 Q190 120 160 140 Q120 166 0 140 Z" fill="#1D4E89" opacity={0.6} />
              )}
              {sh.mahalleler.map((mh, i) => {
                const [cx, cy] = KONUM[i];
                const k = s.mahalleKontrol[mh.id] ?? 0;
                const own = s.mahalleSahip[mh.id];
                const renk = own ? '#F59E0B' : karis('#6B1F2A', '#B7791F', k / 100);
                const sec = i === secili;
                return (
                  <G key={mh.id} onPress={() => setSecili(i)}>
                    <Path d={blob(cx, cy, 40, i + 1)} fill={renk} opacity={own ? 0.95 : 0.75} stroke={sec ? '#FFFFFF' : '#0B1220'} strokeWidth={sec ? 3 : 1.5} />
                    {own && (
                      <G>
                        <Line x1={cx + 26} y1={cy - 30} x2={cx + 26} y2={cy - 8} stroke="#F8FAFC" strokeWidth="2" />
                        <Path d={`M${cx + 26} ${cy - 30} l14 4 l-14 4 z`} fill="#22C55E" />
                      </G>
                    )}
                    <SvgText x={cx} y={cy - 2} fontSize="12.5" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
                      {mh.ad}
                    </SvgText>
                    <SvgText x={cx} y={cy + 14} fontSize="11" fontWeight="bold" fill={own ? '#1A1205' : '#FDE68A'} textAnchor="middle">
                      {own ? 'SENİN' : `%${Math.round(k)}`}
                    </SvgText>
                  </G>
                );
              })}
              {s.derbi && !s.derbi.sonuc && (() => {
                const a = sh.mahalleler.findIndex((x) => x.id === s.derbi!.evMahalle);
                const b = sh.mahalleler.findIndex((x) => x.id === s.derbi!.depMahalle);
                if (a < 0 || b < 0) return null;
                return <Line x1={KONUM[a][0]} y1={KONUM[a][1]} x2={KONUM[b][0]} y2={KONUM[b][1]} stroke="#FCD34D" strokeWidth="2.5" strokeDasharray="6 5" />;
              })()}
              <Circle cx="340" cy="20" r="10" fill="#7F1D1D" />
              <SvgText x="326" y="24" fontSize="10" fill="#FCA5A5" textAnchor="end">
                {sh.karakter.rakip}
              </SvgText>
            </Svg>
          )}
        </View>
      </Kart>

      <Kart vurgu={sahip ? R.turuncu : undefined}>
        <View style={st.satir}>
          <View style={{ flex: 1 }}>
            <Y s style={{ fontSize: 19 }}>{m.ad}</Y>
            <Y style={{ fontSize: 12, color: R.soluk }}>{m.huy}</Y>
          </View>
          {sahip ? <Rozet yazi="SENİN" renk={R.turuncu} ikon="flag" /> : <Rozet yazi={`%${Math.round(kontrol)}`} renk={kontrol > 50 ? R.turuncu : R.kirmizi} />}
        </View>
        {!sahip && (
          <View style={{ marginTop: 10 }}>
            <Cubuk oran={kontrol / 100} renk={R.turuncu} arka="#4C1D24" />
            <Y style={{ fontSize: 11.5, color: R.soluk, marginTop: 5 }}>
              Bu mahallenin takımlarını memnun et; derbileri kazandır. %100 olunca mahalle senin olur ve {sh.karakter.muhtar} her gün destek verir.
            </Y>
          </View>
        )}
        {sahip && <Y style={{ fontSize: 12, color: R.yesil, marginTop: 8 }}>Her gün muhtar desteği: +{M.para(V.MAHALLE_GUNLUK_BONUS * sh.fiyatCarpani)}</Y>}
        <Y k style={{ fontSize: 13, marginTop: 12, marginBottom: 6, color: R.yazi2 }}>Müdavim takımlar</Y>
        {m.takimlar.map((t) => {
          const td = s.takimlar[t.id];
          const tip = V.TAKIM_TIPLERI[t.tip];
          return (
            <View key={t.id} style={st.takim}>
              <View style={[st.ikon, { backgroundColor: tip.renk + '33' }]}>
                <Ionicons name={tip.ikon as any} size={17} color={tip.renk} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={st.satir}>
                  <Y k style={{ fontSize: 14, flexShrink: 1 }} numberOfLines={1}>
                    {t.ad}
                  </Y>
                  {td.abone && <Ionicons name="star" size={13} color={R.pembe} style={{ marginLeft: 4 }} />}
                </View>
                <Y style={{ fontSize: 11, color: R.soluk }}>
                  {tip.ad} · {tip.saatler.map((h) => V.saatYazi(h).slice(0, 2)).join(', ')}
                </Y>
                <Y style={{ fontSize: 11, color: R.yazi2, marginTop: 2, fontStyle: 'italic' }}>{t.not}</Y>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Kalpler sevgi={td.sevgi} />
                <Y style={{ fontSize: 10.5, color: td.abone ? R.pembe : R.soluk, marginTop: 3 }}>{td.abone ? `Abone · ${V.GUN_ADLARI[td.aboneGun]}` : `${td.macSayisi} maç`}</Y>
              </View>
            </View>
          );
        })}
      </Kart>

      <DerbiKarti />

      <Kart>
        <Baslik ikon="skull">Rakip: {sh.karakter.rakip}</Baslik>
        <Y style={{ color: R.yazi2, fontSize: 13, lineHeight: 19 }}>
          {sh.karakter.rakipSaha} her gün fethetmediğin mahallelere baskı yapıyor. İtibarın arttıkça baskısı azalır.
        </Y>
        {s.rakipEtki && (
          <View style={[st.uyari, { borderColor: s.rakipEtki.carpan < 1 ? R.kirmizi : R.yesil }]}>
            <Ionicons name={s.rakipEtki.carpan < 1 ? 'trending-down' : 'trending-up'} size={16} color={s.rakipEtki.carpan < 1 ? R.kirmizi : R.yesil} />
            <Y k style={{ fontSize: 12.5, marginLeft: 6, flex: 1 }}>{s.rakipEtki.metin}</Y>
          </View>
        )}
      </Kart>
    </ScrollView>
  );
}

function DerbiKarti() {
  const { s, yap, reklamIzle } = useOyun();
  const [hakem, setHakem] = useState<0 | 1>(1);
  const [ikram, setIkram] = useState<0 | 1 | 2>(1);
  if (!s) return null;
  const d = s.derbi;
  const kalanGun = (7 - V.haftaGunu(s.gun)) % 7;
  if (!d) {
    return (
      <Kart>
        <Baslik ikon="trophy">Mahalle derbisi</Baslik>
        <Y style={{ color: R.yazi2, fontSize: 13 }}>
          Her Pazar {V.saatYazi(V.DERBI_SAAT)}'de iki mahalle senin sahanda kapışır. {kalanGun === 0 ? 'Bugün Pazar, ama sahan henüz hazır değil.' : `Sonraki derbi ${kalanGun} gün sonra.`}
        </Y>
      </Kart>
    );
  }
  const c = M.maliyetCarpan(s);
  return (
    <Kart vurgu={R.turuncu}>
      <Baslik ikon="trophy" sag={<Rozet yazi={`Bu akşam ${V.saatYazi(V.DERBI_SAAT)}`} renk={R.turuncu} />}>
        Mahalle derbisi
      </Baslik>
      <View style={[st.satir, { justifyContent: 'space-between', marginBottom: 10 }]}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Y s style={{ fontSize: 15, textAlign: 'center' }}>{M.takimAdi(s, d.evTakim)}</Y>
          <Y style={{ fontSize: 11, color: R.soluk }}>{M.mahalleAdi(s, d.evMahalle)}</Y>
        </View>
        <Y s style={{ fontSize: d.sonuc ? 24 : 18, color: R.turuncu, marginHorizontal: 8 }}>{d.sonuc ? `${d.sonuc.skor[0]} - ${d.sonuc.skor[1]}` : 'VS'}</Y>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Y s style={{ fontSize: 15, textAlign: 'center' }}>{M.takimAdi(s, d.depTakim)}</Y>
          <Y style={{ fontSize: 11, color: R.soluk }}>{M.mahalleAdi(s, d.depMahalle)}</Y>
        </View>
      </View>
      {d.sonuc ? (
        <>
          <Y style={{ color: R.yazi2, fontSize: 13, lineHeight: 19 }}>{d.sonuc.mesaj}</Y>
          <Y k style={{ color: R.yesil, marginTop: 6 }}>Tribün geliri: +{M.para(d.sonuc.gelir)}</Y>
          {d.sonuc.forma && <Y k style={{ color: R.mavi, marginTop: 4 }}>Yeni forma: {d.sonuc.forma}</Y>}
          {M.reklamHakki(s, 'mahalletv') > 0 && <Buton tur="reklam" style={{ marginTop: 10 }} yazi={`Mahalle TV'de özet yayınla: +${M.para(1800 * c)}, +8 itibar`} onPress={() => reklamIzle('mahalletv')} />}
        </>
      ) : d.hazir ? (
        <>
          <Y style={{ color: R.yazi2 }}>
            Hazırlıklar tamam: {V.DERBI_HAKEM[d.hakem].ad}, {V.DERBI_IKRAM[d.ikram].ad.toLowerCase()}. Akşamı bekle!
          </Y>
          {M.reklamHakki(s, 'mahalletv') > 0 && <Buton tur="reklam" style={{ marginTop: 10 }} yazi={`Mahalle TV'de canlı yayınla: +${M.para(1800 * c)}, +8 itibar`} onPress={() => reklamIzle('mahalletv')} />}
        </>
      ) : (
        <>
          <Y k style={{ fontSize: 12.5, color: R.yazi2, marginBottom: 6 }}>Hakem</Y>
          <View style={st.segment}>
            {V.DERBI_HAKEM.map((h, i) => (
              <Pressable key={i} onPress={() => setHakem(i as 0 | 1)} style={[st.seg, hakem === i && st.segSec]}>
                <Y k style={{ fontSize: 12.5, color: hakem === i ? '#1A1205' : R.yazi2 }}>{h.ad}</Y>
                <Y style={{ fontSize: 10.5, color: hakem === i ? '#1A1205' : R.soluk }}>{h.ucret ? M.para(h.ucret * c) : 'Ücretsiz · kavga riski'}</Y>
              </Pressable>
            ))}
          </View>
          <Y k style={{ fontSize: 12.5, color: R.yazi2, marginTop: 10, marginBottom: 6 }}>İkram</Y>
          <View style={st.segment}>
            {V.DERBI_IKRAM.map((h, i) => (
              <Pressable key={i} onPress={() => setIkram(i as 0 | 1 | 2)} style={[st.seg, ikram === i && st.segSec]}>
                <Y k style={{ fontSize: 12, color: ikram === i ? '#1A1205' : R.yazi2 }}>{h.ad}</Y>
                <Y style={{ fontSize: 10.5, color: ikram === i ? '#1A1205' : R.soluk }}>{h.ucret ? M.para(h.ucret * c) : '—'}</Y>
              </Pressable>
            ))}
          </View>
          <Buton style={{ marginTop: 12 }} yazi="Derbiyi hazırla" ikon="checkmark-circle" onPress={() => yap((x) => M.derbiAyarla(x, hakem, ikram))} />
        </>
      )}
    </Kart>
  );
}

const st = StyleSheet.create({
  icerik: { padding: 12, paddingBottom: 30 },
  satir: { flexDirection: 'row', alignItems: 'center' },
  takim: { flexDirection: 'row', alignItems: 'center', backgroundColor: R.kart, borderRadius: 14, padding: 10, marginBottom: 8 },
  ikon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  uyari: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 10 },
  segment: { flexDirection: 'row', backgroundColor: R.arka, borderRadius: 12, padding: 3 },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 9, paddingHorizontal: 2 },
  segSec: { backgroundColor: R.turuncu },
});
