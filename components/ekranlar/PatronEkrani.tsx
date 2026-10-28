// ============================================
// SAHA BİZİM — components/ekranlar/PatronEkrani.tsx
// Patron: unvan, şehir fethi ve taşınma, şehir rotası, istatistik, haberler, ayarlar
// ============================================
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useOyun } from '../../context/OyunContext';
import * as M from '../../engine/motor';
import * as V from '../../engine/veri';
import { SEHIRLER } from '../../engine/sehirler';
import { R, Y, Kart, Baslik, Buton, Rozet, Cubuk } from '../ui';

function Besli() {
  return (
    <Svg width={64} height={64} viewBox="0 0 60 60">
      <Circle cx="30" cy="30" r="29" fill="#26364D" />
      <Path d="M14 58 Q16 42 30 42 Q44 42 46 58 Z" fill="#F59E0B" />
      <Rect x="26" y="44" width="8" height="10" fill="#1A1205" opacity={0.0} />
      <Circle cx="30" cy="27" r="11" fill="#E3A878" />
      <Path d="M19 25 Q21 13 31 14 Q41 15 41 25 Q37 19 30 20 Q23 20 19 25 Z" fill="#2B1B10" />
      <Circle cx="26" cy="27" r="1.5" fill="#1F2937" />
      <Circle cx="34" cy="27" r="1.5" fill="#1F2937" />
      <Path d="M25 33 Q30 35 35 33" stroke="#7C2D12" strokeWidth="1.6" fill="none" />
      <Path d="M24 31 Q30 33 36 31" stroke="#2B1B10" strokeWidth="2.4" fill="none" />
    </Svg>
  );
}

export default function PatronEkrani() {
  const { s, yap, sifirla } = useOyun();
  const [onay, setOnay] = useState(false);
  if (!s) return null;
  const sh = M.sehir(s);
  const sahip = M.sahipMahalleSayisi(s);
  const tasin = M.tasinabilir(s);
  return (
    <ScrollView contentContainerStyle={st.icerik} showsVerticalScrollIndicator={false}>
      <Kart>
        <View style={st.satir}>
          <Besli />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Y s style={{ fontSize: 19 }}>Beşli</Y>
            <Y k style={{ color: R.turuncu }}>{V.itibarUnvani(s.itibar)}</Y>
            <View style={[st.satir, { marginTop: 4, gap: 6 }]}>
              <Rozet yazi={`${Math.round(s.itibar)} itibar`} renk={R.turuncu} ikon="star" />
              {s.efsaneYildiz > 0 && <Rozet yazi={`${s.efsaneYildiz} efsane yıldız`} renk={R.sari} ikon="sparkles" />}
            </View>
          </View>
        </View>
        {s.efsaneYildiz > 0 && <Y style={{ fontSize: 12, color: R.yesil, marginTop: 8 }}>Efsane yıldızların tüm fiyatları +%{s.efsaneYildiz * 5} artırıyor.</Y>}
      </Kart>

      <Kart vurgu={tasin ? R.turuncu : undefined}>
        <Baslik ikon="flag">{sh.ad} fethi</Baslik>
        <Cubuk oran={sahip / sh.mahalleler.length} renk={R.turuncu} yukseklik={10} />
        <Y style={{ fontSize: 12.5, color: R.yazi2, marginTop: 6 }}>
          {sahip}/{sh.mahalleler.length} mahalle senin. Bu şehirde toplam kazanç: {M.para(s.toplamKazanc)}
        </Y>
        {tasin ? (
          <>
            <Y style={{ color: R.yazi2, marginTop: 10, lineHeight: 19 }}>{sh.fetihMesaji}</Y>
            <Buton
              style={{ marginTop: 10 }}
              ikon="airplane"
              yazi={`${SEHIRLER[(s.sehirSira + 1) % SEHIRLER.length].ad}'a taşın`}
              alt={`+${M.kazanilacakYildiz(s)} efsane yıldız · formaların seninle gelir`}
              onPress={() => yap((d) => M.tasin(d))}
            />
            <Y style={{ fontSize: 11, color: R.soluk, marginTop: 6, textAlign: 'center' }}>İstersen burada kalıp sahalarını büyütmeye devam edebilirsin.</Y>
          </>
        ) : (
          <Y style={{ fontSize: 11.5, color: R.soluk, marginTop: 6 }}>Bütün mahalleler senin olunca yeni şehre taşınabilirsin.</Y>
        )}
      </Kart>

      <Kart>
        <Baslik ikon="airplane">Rota</Baslik>
        {SEHIRLER.map((x, i) => {
          const gecildi = i < s.sehirSira % SEHIRLER.length;
          const burasi = i === s.sehirSira % SEHIRLER.length;
          return (
            <View key={x.id} style={[st.rota, burasi && { borderColor: R.turuncu, backgroundColor: '#3A2A0E' }]}>
              <Ionicons name={gecildi ? 'checkmark-circle' : burasi ? 'location' : 'lock-closed'} size={18} color={gecildi ? R.yesil : burasi ? R.turuncu : R.mat} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Y k style={{ fontSize: 14, color: gecildi || burasi ? R.yazi : R.soluk }}>
                  {x.ad} <Y style={{ fontSize: 11.5, color: R.soluk }}>· {x.ulke}</Y>
                </Y>
                {(burasi || gecildi) && <Y style={{ fontSize: 11, color: R.soluk }}>Rakip: {x.karakter.rakip} · {x.karakter.cayci} · {x.karakter.bekci}</Y>}
              </View>
            </View>
          );
        })}
        {s.sehirSira >= SEHIRLER.length && <Y k style={{ color: R.sari, marginTop: 6 }}>{Math.floor(s.sehirSira / SEHIRLER.length) + 1}. tur</Y>}
      </Kart>

      <Kart>
        <Baslik ikon="stats-chart">İstatistikler</Baslik>
        <Ist e="Oynanan maç" d={s.istatistik.mac} />
        <Ist e="Derbi" d={s.istatistik.derbi} />
        <Ist e="Canlı anlarda verilen karar" d={s.istatistik.anCevap} />
        <Ist e="Fethedilen şehir" d={s.istatistik.sehirFethi} />
        <Ist e="Toplanan forma" d={`${s.formalar.length}/${V.FORMALAR.length}`} />
        <Ist e="Giriş serisi" d={`${s.girisSerisi} gün`} />
        <Ist e="Tüm zamanlar kazancı" d={M.para(s.tumZamanKazanc)} />
      </Kart>

      <Kart>
        <Baslik ikon="newspaper">Mahalle gazetesi</Baslik>
        {s.haberler.slice(0, 12).map((h, i) => (
          <View key={i} style={st.haber}>
            <View style={[st.haberNokta, { backgroundColor: h.tur === 'iyi' ? R.yesil : h.tur === 'kotu' ? R.kirmizi : R.mavi }]} />
            <View style={{ flex: 1 }}>
              <Y style={{ fontSize: 11, color: R.soluk }}>
                {h.gun}. gün · {V.saatYazi(h.saat)}
              </Y>
              <Y style={{ fontSize: 13, color: R.yazi2 }}>{h.metin}</Y>
            </View>
          </View>
        ))}
      </Kart>

      <Kart>
        <Baslik ikon="settings">Ayarlar</Baslik>
        <Y style={{ fontSize: 12.5, color: R.soluk, marginBottom: 10 }}>Müzik ve dil seçenekleri bir sonraki güncellemede geliyor.</Y>
        {onay ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Buton tur="cizgi" yazi="Vazgeç" style={{ flex: 1 }} onPress={() => setOnay(false)} />
            <Buton tur="kirmizi" yazi="Evet, sıfırla" style={{ flex: 1 }} onPress={() => { setOnay(false); sifirla(); }} />
          </View>
        ) : (
          <Buton tur="cizgi" ikon="trash" yazi="Oyunu sıfırla" onPress={() => setOnay(true)} />
        )}
        <Y style={{ fontSize: 11, color: R.mat, marginTop: 12, textAlign: 'center' }}>Saha Bizim · SARDUR TECHNOLOGIES</Y>
      </Kart>
    </ScrollView>
  );
}

function Ist({ e, d }: { e: string; d: React.ReactNode }) {
  return (
    <View style={[st.satir, { justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderColor: R.cizgi }]}>
      <Y style={{ color: R.yazi2, fontSize: 13 }}>{e}</Y>
      <Y k style={{ fontSize: 13.5 }}>{d}</Y>
    </View>
  );
}

const st = StyleSheet.create({
  icerik: { padding: 12, paddingBottom: 30 },
  satir: { flexDirection: 'row', alignItems: 'center' },
  rota: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 9, marginBottom: 6, borderWidth: 1, borderColor: R.cizgi, backgroundColor: R.kart },
  haber: { flexDirection: 'row', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderColor: R.cizgi },
  haberNokta: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
});
