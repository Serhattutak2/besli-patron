// ============================================
// SAHA BİZİM — components/ekranlar/MahalleEkrani.tsx
// Mahalle haritası, mahalle takımları, Pazar derbisi ve rakip patron
// ============================================
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, G, Circle, Rect, Line } from 'react-native-svg';
import { useOyun } from '../../context/OyunContext';
import * as M from '../../engine/motor';
import * as V from '../../engine/veri';
import { R, Y, Kart, Baslik, Buton, Rozet, Cubuk, Kalpler } from '../ui';
import SvgText from '../SvgYazi';

const KONUM: [number, number][] = [
  [92, 78],
  [230, 64],
  [300, 160],
  [190, 160],
  [78, 200],
  [232, 246],
];
function blob(cx: number, cy: number, r: number, tohum: number) {
  const n = 20;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.88 + 0.12 * Math.sin(tohum * 3.1 + i * 1.3) + 0.05 * Math.cos(i * 2.7 + tohum));
    const x = cx + Math.cos(a) * rr * 1.25;
    const y = cy + Math.sin(a) * rr;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d + 'Z';
}
const YOLLAR: [number, number][] = [[0, 1], [0, 3], [1, 3], [1, 2], [3, 2], [3, 4], [3, 5], [4, 5], [2, 5]];
const AGAC: [number, number][] = [[20, 20], [160, 20], [340, 70], [345, 240], [150, 285], [20, 280], [130, 220], [300, 290]];
function useDalga() {
  const [f, setF] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setF((x) => (x + 1) % 4), 380);
    return () => clearInterval(t);
  }, []);
  return f;
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
  const dalga = useDalga();
  if (!s) return null;
  const sh = M.sehir(s);
  const m = sh.mahalleler[secili];
  const kontrol = s.mahalleKontrol[m.id] ?? 0;
  const sahip = s.mahalleSahip[m.id];
  const toplamSahip = M.sahipMahalleSayisi(s);
  const bayrakR = V.BAYRAK_SECENEK[s.tesisSus?.bayrak ?? 0] ?? V.BAYRAK_SECENEK[0];

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
              <Rect x="0" y="0" width="360" height="300" fill="#13241A" />
              {Array.from({ length: 10 }).map((_, i) => (
                <Line key={`y${i}`} x1="0" y1={i * 32} x2="360" y2={i * 32} stroke="#17301F" strokeWidth="1" />
              ))}
              {(sh.id === 'istanbul' || sh.id === 'izmir' || sh.id === 'antalya' || sh.id === 'dubai' || sh.id === 'trabzon' || sh.id === 'londra') && (
                <G>
                  <Path d="M0 120 Q120 140 150 118 Q180 96 360 112 L360 134 Q190 122 160 142 Q120 168 0 142 Z" fill="#1D4E89" />
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Path key={i} d={`M${20 + i * 70 + (dalga % 2) * 6} ${124 + (i % 2) * 6} q6 -4 12 0 q6 4 12 0`} stroke="#60A5FA" strokeWidth="1.4" fill="none" opacity={0.7} />
                  ))}
                  {sh.id === 'istanbul' && (
                    <G transform={`translate(${60 + dalga * 4} 120)`}>
                      <Path d="M0 0 h26 l-4 7 h-18 z" fill="#F8FAFC" />
                      <Rect x="8" y="-6" width="8" height="6" fill="#FDE68A" />
                    </G>
                  )}
                </G>
              )}
              {YOLLAR.map(([a, b], i) => {
                const [x1, y1] = KONUM[a];
                const [x2, y2] = KONUM[b];
                const mx = (x1 + x2) / 2 + (i % 2 ? 12 : -12);
                const my = (y1 + y2) / 2 + (i % 3 === 0 ? 10 : -6);
                return (
                  <G key={`r${i}`}>
                    <Path d={`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`} stroke="#334155" strokeWidth="7" fill="none" strokeLinecap="round" />
                    <Path d={`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`} stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 5" fill="none" opacity={0.6} />
                  </G>
                );
              })}
              {AGAC.map(([x, y], i) => (
                <G key={`t${i}`}>
                  <Circle cx={x} cy={y} r="7" fill="#166534" />
                  <Circle cx={x - 3} cy={y - 3} r="3" fill="#22C55E" opacity={0.6} />
                </G>
              ))}
              {sh.mahalleler.map((mh, i) => {
                const [cx, cy] = KONUM[i];
                const k = s.mahalleKontrol[mh.id] ?? 0;
                const own = s.mahalleSahip[mh.id];
                const renk = own ? '#F59E0B' : karis('#6B1F2A', '#B7791F', k / 100);
                const sec = i === secili;
                return (
                  <G key={mh.id} onPress={() => setSecili(i)}>
                    <Path d={blob(cx, cy, 44, i + 1)} fill={renk} opacity={own ? 0.95 : 0.8} stroke={sec ? '#FFFFFF' : '#0B1220'} strokeWidth={sec ? 3 : 1.5} />
                    {[-30, -18, 18, 30].map((dx, j) => (
                      <G key={j} opacity={0.55}>
                        <Rect x={cx + dx - 4} y={cy + 20 + (j % 2) * 4} width="8" height="7" fill="#0B1220" />
                        <Path d={`M${cx + dx - 5} ${cy + 20 + (j % 2) * 4} l5 -5 l5 5 z`} fill="#0B1220" />
                      </G>
                    ))}
                    {own ? (
                      <G>
                        <Line x1={cx + 26} y1={cy - 34} x2={cx + 26} y2={cy - 8} stroke="#F8FAFC" strokeWidth="2" />
                        <Path d={`M${cx + 26} ${cy - 34} q7 ${dalga % 2 ? -3 : 3} 14 0 q0 5 0 9 q-7 ${dalga % 2 ? 3 : -3} -14 0 z`} fill={bayrakR.a} />
                        <Circle cx={cx + 33} cy={cy - 29.5} r="2" fill={bayrakR.b} />
                      </G>
                    ) : k < 30 ? (
                      <G>
                        <Circle cx={cx + 28} cy={cy - 24} r="8" fill="#7F1D1D" stroke="#FCA5A5" strokeWidth="1" />
                        <SvgText x={cx + 28} y={cy - 20.5} fontSize="10" fontWeight="bold" fill="#FCA5A5" textAnchor="middle">!</SvgText>
                      </G>
                    ) : null}
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
                return <Line x1={KONUM[a][0]} y1={KONUM[a][1]} x2={KONUM[b][0]} y2={KONUM[b][1]} stroke="#FCD34D" strokeWidth="2.5" strokeDasharray="6 5" strokeDashoffset={dalga * 3} />;
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

      <FinalKarti />
      <KupaKarti />
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
  esleme: { flexDirection: 'row', alignItems: 'center', backgroundColor: R.kart2, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10, marginBottom: 5 },
  icerik: { padding: 12, paddingBottom: 30 },
  satir: { flexDirection: 'row', alignItems: 'center' },
  takim: { flexDirection: 'row', alignItems: 'center', backgroundColor: R.kart, borderRadius: 14, padding: 10, marginBottom: 8 },
  ikon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  uyari: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 10 },
  segment: { flexDirection: 'row', backgroundColor: R.arka, borderRadius: 12, padding: 3 },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 9, paddingHorizontal: 2 },
  segSec: { backgroundColor: R.turuncu },
});

const TUR_AD = ['Çeyrek final', 'Yarı final', 'Final'];

function KupaKarti() {
  const { s, yap } = useOyun();
  if (!s || !s.kupa) {
    if (!s) return null;
    const kalan = s.gun < V.KUPA_ILK ? V.KUPA_ILK - s.gun : (V.KUPA_ARALIK - ((s.gun - V.KUPA_ILK) % V.KUPA_ARALIK)) % V.KUPA_ARALIK;
    return (
      <Kart>
        <Baslik ikon="trophy-outline">Mahalle kupası</Baslik>
        <Y style={{ color: R.yazi2, fontSize: 13 }}>
          En sevilen 8 takım senin sahalarında kupa için kapışır. {s.kupaSayisi > 0 ? `Şimdiye kadar ${s.kupaSayisi} kupa düzenledin. ` : ''}Sonraki kupa yaklaşık {kalan || V.KUPA_ARALIK} gün sonra.
        </Y>
      </Kart>
    );
  }
  const k = s.kupa;
  const c = M.maliyetCarpan(s);
  const kisa = (id: string) => M.takimAdi(s, id);
  return (
    <Kart vurgu={R.sari}>
      <Baslik ikon="trophy" sag={<Rozet yazi={k.bitti ? 'Bitti' : k.hazir ? TUR_AD[Math.min(2, Math.max(0, s.gun - k.baslangic - 1))] : 'Teklif'} renk={R.sari} />}>
        {k.odul ? V.KUPA_ODUL[k.odul - 1].ad : 'Mahalle kupası'}
      </Baslik>
      {!k.hazir ? (
        <>
          <Y style={{ color: R.yazi2, fontSize: 13, lineHeight: 19, marginBottom: 10 }}>
            8 takım kupa istiyor! Ödül havuzunu seç; yarından itibaren 3 gün boyunca akşamları kupa maçları senin sahanda oynanır. Bilet geliri, itibar ve şampiyonun mahallesinde kontrol kazanırsın.
          </Y>
          {V.KUPA_ODUL.map((o, i) => (
            <Buton
              key={i}
              tur={i === 1 ? 'yesil' : undefined}
              style={{ marginBottom: 8 }}
              yazi={`${o.ad} · ${M.para(o.bedel * c)} · +${o.itibar} itibar`}
              onPress={() => yap((d) => M.kupaHazirla(d, (i + 1) as 1 | 2))}
            />
          ))}
          <Pressable onPress={() => yap((d) => M.kupaVazgec(d))} style={{ alignItems: 'center', paddingVertical: 6 }}>
            <Y k style={{ color: R.soluk, fontSize: 12.5 }}>Bu sefer düzenleme</Y>
          </Pressable>
        </>
      ) : (
        <>
          {k.sampiyon && (
            <View style={[st.uyari, { borderColor: R.sari, marginBottom: 10, marginTop: 0 }]}>
              <Ionicons name="trophy" size={18} color={R.sari} />
              <Y s style={{ marginLeft: 8, flex: 1, color: R.sari }}>Şampiyon: {kisa(k.sampiyon)}</Y>
            </View>
          )}
          {k.turlar.length === 0 && <Y style={{ color: R.yazi2, fontSize: 13, marginBottom: 6 }}>Kura çekildi, yarın çeyrek final. Katılanlar:</Y>}
          {k.turlar.length === 0 && <Y style={{ color: R.soluk, fontSize: 12, lineHeight: 18 }}>{k.takimlar.map(kisa).join(' · ')}</Y>}
          {k.turlar.map((tur, ti) => (
            <View key={ti} style={{ marginBottom: 8 }}>
              <Y k style={{ fontSize: 12, color: R.soluk, marginBottom: 4 }}>{TUR_AD[ti].toLocaleUpperCase('tr-TR')}</Y>
              {tur.map((m, mi) => (
                <View key={mi} style={st.esleme}>
                  <Y k numberOfLines={1} style={{ flex: 1, fontSize: 12.5, color: m.kazanan === m.a ? R.yazi : m.kazanan ? R.soluk : R.yazi2 }}>{kisa(m.a)}</Y>
                  <Y s style={{ fontSize: 13, color: R.sari, marginHorizontal: 6 }}>{m.skor ? `${m.skor[0]}-${m.skor[1]}` : 'vs'}</Y>
                  <Y k numberOfLines={1} style={{ flex: 1, fontSize: 12.5, textAlign: 'right', color: m.kazanan === m.b ? R.yazi : m.kazanan ? R.soluk : R.yazi2 }}>{kisa(m.b)}</Y>
                </View>
              ))}
            </View>
          ))}
        </>
      )}
    </Kart>
  );
}

function FinalKarti() {
  const { s, yap } = useOyun();
  if (!s) return null;
  const sh = M.sehir(s);
  const f = s.final;
  if (s.finalKazanildi) {
    return (
      <Kart vurgu={R.sari}>
        <Baslik ikon="medal">Büyük final kazanıldı</Baslik>
        <Y style={{ color: R.yazi2, fontSize: 13 }}>{sh.ad} artık senin! Patron sekmesinden yeni şehre taşınabilirsin.</Y>
      </Kart>
    );
  }
  if (!f) return null;
  const c = M.maliyetCarpan(s);
  const ben = M.benimGucum(s);
  const rakip = V.rakipGucu(s.sehirSira, f.deneme);
  const sans = Math.round(M.finalKazanmaSansi(s) * 100);
  const kalan = f.gun - s.gun;
  const H: { id: 'yildiz' | 'kamp' | 'taraftar'; ad: string; bedel: string; ikon: any; arti: number }[] = [
    { id: 'yildiz', ad: 'Eski yıldızı getir', bedel: M.para(8000 * c), ikon: 'star', arti: 8 },
    { id: 'kamp', ad: 'Takımı kampa sok', bedel: '30 enerji', ikon: 'barbell', arti: 5 },
    { id: 'taraftar', ad: 'Taraftar otobüsü', bedel: M.para(3000 * c), ikon: 'bus', arti: 4 },
  ];
  return (
    <Kart vurgu={R.kirmizi}>
      <Baslik ikon="flame" sag={<Rozet yazi={kalan > 0 ? `${kalan} gün sonra` : 'BU AKŞAM 21:00'} renk={R.kirmizi} />}>
        BÜYÜK FİNAL{f.deneme ? ` · rövanş ${f.deneme}` : ''}
      </Baslik>
      <Y style={{ color: R.yazi2, fontSize: 13, lineHeight: 19, marginBottom: 10 }}>
        Bütün mahalleler senin. Şimdi {sh.karakter.rakip} ve {sh.karakter.rakipSaha} SK ile son maç: kazanan {sh.ad}'ı alır.
      </Y>
      <View style={[st.satir, { justifyContent: 'space-between', marginBottom: 6 }]}>
        <Y s style={{ fontSize: 15 }}>Sen: {ben}</Y>
        <Y s style={{ fontSize: 22, color: sans >= 50 ? R.yesil : R.kirmizi }}>%{sans}</Y>
        <Y s style={{ fontSize: 15 }}>Rakip: {rakip}</Y>
      </View>
      <Cubuk oran={sans / 100} renk={sans >= 50 ? R.yesil : R.turuncu} yukseklik={8} />
      <Y k style={{ fontSize: 12, color: R.soluk, marginTop: 12, marginBottom: 6 }}>HAZIRLIK</Y>
      {H.map((h) => (
        <View key={h.id} style={[st.satir, { marginBottom: 8 }]}>
          <Ionicons name={h.ikon} size={18} color={f.hazirlik[h.id] ? R.yesil : R.turuncu} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Y k style={{ fontSize: 13 }}>{h.ad}</Y>
            <Y style={{ fontSize: 11, color: R.soluk }}>+{h.arti} güç · {h.bedel}</Y>
          </View>
          {f.hazirlik[h.id] ? <Rozet yazi="TAMAM" renk={R.yesil} /> : <Buton kucuk yazi="Yap" onPress={() => yap((d) => M.finalHazirlik(d, h.id))} />}
        </View>
      ))}
      <Y style={{ fontSize: 11, color: R.soluk, marginTop: 4 }}>Gücün itibar, forma koleksiyonu ve efsane yıldızlarından gelir. Kaybedersen rakip 3 gün sonra rövanş verir.</Y>
    </Kart>
  );
}
