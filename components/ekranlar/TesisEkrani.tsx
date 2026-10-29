// ============================================
// SAHA BİZİM — components/ekranlar/TesisEkrani.tsx
// Canlı tesis sahnesi, saha seçimi, maç durumu, bakım, fiyat, inşaat,
// yükseltmeler ve yeni saha arsaları
// ============================================
import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOyun } from '../../context/OyunContext';
import * as M from '../../engine/motor';
import * as V from '../../engine/veri';
import type { OyunDurumu, Saha } from '../../engine/tipler';
import TesisSahnesi from '../TesisSahnesi';
import { R, Y, Kart, Baslik, Buton, Rozet, Cubuk, ElaDiyor } from '../ui';

function elaIpucu(s: OyunDurumu, saha: Saha): string | null {
  const sh = M.sehir(s);
  if (s.teklifler.length > 0 && s.gun <= 3) return `Program sekmesinde ${s.teklifler.length} teklif bekliyor. Kabul et ki takımlar gelsin!`;
  if (s.gun <= 2 && s.teklifler.length === 0) return 'Telefon birazdan çalar. Gelen teklifleri Program sekmesinde kabul edeceksin.';
  if (M.hizmette(saha) && saha.kalite < M.maksKalite(saha) - 2) return 'Halı yıprandı. Bakım yaparsan takımlar daha mutlu ayrılır, fiyatın da artar.';
  if (s.enerji < 15) return `Enerjin bitmek üzere. Üstteki enerji çubuğuna dokun, ${sh.karakter.cayci} bir çay getirsin.`;
  if (s.cayOcagi === 0 && s.nakit > V.CAY_MALIYET[0] * 1.5) return 'Çay ocağı açalım mı? Sen yokken bile kasaya para koyar. Kulüp sekmesinde.';
  if (s.derbi && !s.derbi.hazir && !s.derbi.sonuc) return 'Bu akşam derbi var! Mahalle sekmesinden hakemi ve ikramı seç.';
  if (!(saha.yukseltmeler.isik ?? 0) && s.gun >= 3 && M.hizmette(saha)) return 'Projektör alırsan gece maçları açılır. Gece en pahalı saattir!';
  if (s.cayBirikim > 0 && s.cayBirikim >= V.CAY_SAATLIK * s.cayOcagi * 5) return 'Çay ocağının kasası doldu. Sahnedeki altına dokun, topla!';
  return null;
}

export default function TesisEkrani() {
  const { s, yap, reklamIzle } = useOyun();
  if (!s) return null;
  const saha = s.sahalar.find((x) => x.id === s.aktifSahaId) ?? s.sahalar[0];
  const simdi = M.suankiSaat(s);
  const oynayan = s.rezervasyonlar.find((r) => r.sahaId === saha.id && r.durum === 'oynaniyor');
  const siradaki = s.rezervasyonlar
    .filter((r) => r.sahaId === saha.id && r.durum === 'bekliyor')
    .sort((a, b) => a.saat - b.saat)[0];
  const ipucu = elaIpucu(s, saha);
  const sehir = M.sehir(s);

  return (
    <ScrollView contentContainerStyle={st.icerik} showsVerticalScrollIndicator={false}>
      {s.sahalar.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ gap: 6 }}>
          {s.sahalar.map((x) => {
            const secili = x.id === saha.id;
            const oyn = s.rezervasyonlar.some((r) => r.sahaId === x.id && r.durum === 'oynaniyor');
            return (
              <Pressable key={x.id} onPress={() => yap((d) => M.aktifSahaSec(d, x.id))} style={[st.cip, secili && st.cipSecili]}>
                {oyn && <View style={st.canliNokta} />}
                <Y k style={{ fontSize: 12.5, color: secili ? '#1A1205' : R.yazi2 }}>{x.ad}</Y>
                {x.asama < 5 && <Ionicons name="construct" size={12} color={secili ? '#1A1205' : R.turuncu} style={{ marginLeft: 4 }} />}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={st.sahneKap}>
        <TesisSahnesi durum={s} saha={saha} onCay={() => yap((d) => M.cayTopla(d))} />
        {s.cayOcagi > 0 && s.cayBirikim >= 50 && (
          <Pressable style={st.cayEtiket} onPress={() => yap((d) => M.cayTopla(d))}>
            <Ionicons name="cafe" size={13} color="#78350F" />
            <Y s style={{ fontSize: 12, color: '#78350F', marginLeft: 4 }}>{M.para(s.cayBirikim)}</Y>
          </Pressable>
        )}
      </View>

      {/* Şu an */}
      {M.hizmette(saha) && (
        <Kart style={{ marginTop: 10 }}>
          <View style={st.satir}>
            <View style={{ flex: 1 }}>
              <Y style={{ fontSize: 11.5, color: R.soluk }}>{oynayan ? 'ŞU AN SAHADA' : siradaki ? 'SIRADAKİ MAÇ' : 'SAHA BOŞ'}</Y>
              <Y s style={{ fontSize: 16 }} numberOfLines={1}>
                {oynayan ? (oynayan.derbi ? 'Mahalle Derbisi!' : M.takimAdi(s, oynayan.takimId)) : siradaki ? `${V.saatYazi(siradaki.saat)} · ${siradaki.derbi ? 'Derbi' : M.takimAdi(s, siradaki.takimId)}` : 'Teklif bekleniyor'}
              </Y>
            </View>
            {oynayan && <Rozet yazi="CANLI" renk={R.kirmizi} ikon="radio-button-on" />}
            {!oynayan && siradaki?.abone && <Rozet yazi="ABONE" renk={R.pembe} ikon="heart" />}
          </View>
          <View style={[st.satir, { marginTop: 12, gap: 10 }]}>
            <View style={{ flex: 1 }}>
              <View style={[st.satir, { justifyContent: 'space-between', marginBottom: 4 }]}>
                <Y k style={{ fontSize: 12, color: R.yazi2 }}>Halı kalitesi</Y>
                <Y k style={{ fontSize: 12 }}>
                  {saha.kalite.toFixed(1)} / {M.maksKalite(saha)}
                </Y>
              </View>
              <Cubuk oran={saha.kalite / 10} renk={saha.kalite >= 6 ? R.yesil : saha.kalite >= 4 ? R.turuncu : R.kirmizi} />
            </View>
            <Buton kucuk tur="koyu" ikon="brush" yazi="Bakım" alt={`${M.para(M.bakimMaliyeti(s))} · ${V.BAKIM_ENERJI}⚡`} onPress={() => yap((d) => M.bakimYap(d, saha.id))} />
          </View>
          <Y k style={{ fontSize: 12, color: R.yazi2, marginTop: 12, marginBottom: 6 }}>Saat ücreti</Y>
          <View style={st.segment}>
            {V.FIYAT_SEVIYE.map((f, i) => (
              <Pressable key={i} style={[st.segBtn, saha.fiyat === i && st.segSecili]} onPress={() => yap((d) => M.fiyatAyarla(d, saha.id, i as 0 | 1 | 2))}>
                <Y s style={{ fontSize: 13, color: saha.fiyat === i ? '#1A1205' : R.yazi2 }}>{f.ad}</Y>
                <Y style={{ fontSize: 10.5, color: saha.fiyat === i ? '#1A1205' : R.soluk }}>~{M.para(M.macFiyati(s, { ...saha, fiyat: i as 0 | 1 | 2 }, 'amator', 20))}</Y>
              </Pressable>
            ))}
          </View>
          <Y style={{ fontSize: 11, color: R.soluk, marginTop: 6 }}>
            {saha.fiyat === 0 ? 'Ucuzsa daha çok takım gelir, takımlar sever ama kazanç az.' : saha.fiyat === 2 ? 'Pahalıda az ama seçkin takım gelir; öğrenciler küser.' : 'Dengeli fiyat.'}
          </Y>
        </Kart>
      )}

      {ipucu && <ElaDiyor style={{ marginBottom: 12 }}>{ipucu}</ElaDiyor>}

      {/* Reklam fırsatları */}
      {M.sponsorReklamMumkun(s) && (
        <Buton tur="reklam" style={{ marginBottom: 10 }} yazi={`${s.sahalar.some((x) => (x.yukseltmeler.skorbord ?? 0) > 0) ? 'Dev ekranda' : 'Tabelada'} sponsor reklamı yayınla: +${M.para(M.sponsorOdulu(s))}`} alt={`Bugün ${M.reklamHakki(s, 'sponsor')} hak kaldı`} onPress={() => reklamIzle('sponsor')} />
      )}

      {saha.asama < 5 && <InsaatKarti saha={saha} />}

      {M.hizmette(saha) && (
        <Kart>
          <Baslik ikon="hammer">Yükseltmeler</Baslik>
          <View style={st.izgara}>
            {V.YUKSELTMELER.map((y) => {
              const sv = saha.yukseltmeler[y.id] ?? 0;
              const m = M.yukseltmeMaliyeti(s, saha, y.id);
              return (
                <Pressable key={y.id} style={[st.yKart, sv > 0 && { borderColor: R.turuncu + '88' }]} onPress={() => m != null && yap((d) => M.yukseltmeAl(d, saha.id, y.id))}>
                  <View style={st.satir}>
                    <View style={[st.yIkon, sv > 0 && { backgroundColor: '#3A2A0E' }]}>
                      <Ionicons name={y.ikon as any} size={18} color={sv > 0 ? R.turuncu : R.yazi2} />
                    </View>
                    <View style={{ flexDirection: 'row', marginLeft: 'auto' }}>
                      {y.maliyetler.map((_, i) => (
                        <View key={i} style={[st.svNokta, i < sv && { backgroundColor: R.turuncu }]} />
                      ))}
                    </View>
                  </View>
                  <Y k style={{ fontSize: 13, marginTop: 6 }}>{y.ad}</Y>
                  <Y style={{ fontSize: 11, color: R.soluk, marginTop: 2, minHeight: 30 }}>{y.aciklama}</Y>
                  <View style={[st.yFiyat, m == null && { backgroundColor: R.kart2 }]}>
                    <Y s style={{ fontSize: 12, color: m == null ? R.soluk : '#1A1205' }}>{m == null ? 'Tamamlandı' : `${M.para(m)} · ${y.enerji}⚡`}</Y>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Kart>
      )}

      <YeniSahalar />
      <Y style={{ color: R.mat, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
        {sehir.ad} · Rakibin: {sehir.karakter.rakipSaha}
      </Y>
    </ScrollView>
  );
}

function InsaatKarti({ saha }: { saha: Saha }) {
  const { s, yap, reklamIzle } = useOyun();
  if (!s) return null;
  const kalan = M.insaatKalanDakika(s, saha);
  const calisiyor = saha.insaatBitisDakika != null;
  const toplam = M.sahaTanim(saha).asamaSaat * 60;
  return (
    <Kart vurgu={R.turuncu}>
      <Baslik ikon="construct">{saha.ad} inşaatı</Baslik>
      <View style={[st.satir, { gap: 4, marginBottom: 10 }]}>
        {V.INSAAT_ASAMALARI.map((a, i) => (
          <View key={i} style={{ flex: 1 }}>
            <View style={[st.asama, i < saha.asama && { backgroundColor: R.turuncu }, i === saha.asama && calisiyor && { backgroundColor: R.turuncu + '66' }]} />
            <Y style={{ fontSize: 9.5, color: i < saha.asama ? R.yazi2 : R.mat, marginTop: 3 }} numberOfLines={2}>
              {a}
            </Y>
          </View>
        ))}
      </View>
      {calisiyor ? (
        <>
          <Y k style={{ fontSize: 13 }}>Ustalar çalışıyor: {V.INSAAT_ASAMALARI[saha.asama]}</Y>
          <View style={{ marginVertical: 8 }}>
            <Cubuk oran={1 - kalan / toplam} renk={R.turuncu} />
          </View>
          <Y style={{ fontSize: 12, color: R.soluk }}>Kalan: yaklaşık {Math.ceil(kalan / 60)} oyun saati (gece de çalışırlar)</Y>
          {M.insaatHizlanabilir(s, saha.id) && <Buton tur="reklam" style={{ marginTop: 10 }} yazi="Ustalara ekstra mesai: hemen bitir" alt="Kısa bir reklam izle" onPress={() => reklamIzle('insaat', saha.id)} />}
        </>
      ) : (
        <Buton yazi={`Sonraki aşama: ${V.INSAAT_ASAMALARI[saha.asama]}`} alt={`${M.para(M.asamaMaliyeti(s, saha.tip))} · 10⚡ · ${M.sahaTanim(saha).asamaSaat} saat sürer`} onPress={() => yap((d) => M.insaatBaslat(d, saha.id))} />
      )}
    </Kart>
  );
}

function YeniSahalar() {
  const { s, yap } = useOyun();
  if (!s) return null;
  const tipler = V.SAHA_SIRASI.filter((t) => t !== 'mahalle' && !s.sahalar.some((x) => x.tip === t));
  if (tipler.length === 0) return null;
  const sahip = M.sahipMahalleSayisi(s);
  return (
    <Kart>
      <Baslik ikon="map" sag={<Rozet yazi={`${sahip} mahalle senin`} renk={R.turuncu} />}>
        Yeni saha arsaları
      </Baslik>
      {tipler.map((t) => {
        const tn = V.SAHA_TIPLERI[t];
        const acik = M.yeniSahaAcilabilir(s, t).olur;
        const arsa = M.arsaMaliyeti(s, t);
        const toplam = arsa + M.asamaMaliyeti(s, t) * 4;
        return (
          <View key={t} style={[st.arsa, !acik && { opacity: 0.6 }]}>
            <View style={[st.arsaRenk, { backgroundColor: tn.renk }]} />
            <View style={{ flex: 1 }}>
              <Y k style={{ fontSize: 14 }}>{tn.ad}</Y>
              <Y style={{ fontSize: 11.5, color: R.soluk, marginTop: 1 }}>{tn.aciklama}</Y>
              <Y style={{ fontSize: 11, color: R.yazi2, marginTop: 3 }}>
                Toplam yatırım {M.para(toplam)} · fiyat x{tn.fiyatCarpan}
              </Y>
            </View>
            {acik ? (
              <Buton kucuk yazi="Arsa al" alt={M.para(arsa)} onPress={() => yap((d) => M.arsaAl(d, t))} />
            ) : (
              <View style={{ alignItems: 'center', width: 76 }}>
                <Ionicons name="lock-closed" size={16} color={R.soluk} />
                <Y style={{ fontSize: 10.5, color: R.soluk, textAlign: 'center' }}>{tn.gerekenMahalle} mahalle gerekli</Y>
              </View>
            )}
          </View>
        );
      })}
    </Kart>
  );
}

const st = StyleSheet.create({
  icerik: { padding: 12, paddingBottom: 30 },
  satir: { flexDirection: 'row', alignItems: 'center' },
  cip: { flexDirection: 'row', alignItems: 'center', backgroundColor: R.panel, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: R.cizgi },
  cipSecili: { backgroundColor: R.turuncu, borderColor: R.turuncu },
  canliNokta: { width: 7, height: 7, borderRadius: 4, backgroundColor: R.kirmizi, marginRight: 5 },
  sahneKap: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: R.cizgi, backgroundColor: '#0A1220' },
  cayEtiket: { position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: R.sari, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  segment: { flexDirection: 'row', backgroundColor: R.arka, borderRadius: 12, padding: 3 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 9 },
  segSecili: { backgroundColor: R.turuncu },
  izgara: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  yKart: { width: '48.5%', backgroundColor: R.kart, borderRadius: 14, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: R.cizgi },
  yIkon: { width: 32, height: 32, borderRadius: 10, backgroundColor: R.kart2, alignItems: 'center', justifyContent: 'center' },
  svNokta: { width: 7, height: 7, borderRadius: 4, backgroundColor: R.cizgi, marginLeft: 3 },
  yFiyat: { backgroundColor: R.turuncu, borderRadius: 9, paddingVertical: 5, alignItems: 'center', marginTop: 6 },
  asama: { height: 6, borderRadius: 3, backgroundColor: R.cizgi },
  arsa: { flexDirection: 'row', alignItems: 'center', backgroundColor: R.kart, borderRadius: 14, padding: 10, marginBottom: 8, gap: 10 },
  arsaRenk: { width: 6, alignSelf: 'stretch', borderRadius: 3 },
});
