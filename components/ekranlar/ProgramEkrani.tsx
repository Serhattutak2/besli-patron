// ============================================
// SAHA BİZİM — components/ekranlar/ProgramEkrani.tsx
// Canlı teklifler ve günün saat saat programı
// ============================================
import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOyun } from '../../context/OyunContext';
import * as M from '../../engine/motor';
import * as V from '../../engine/veri';
import type { Teklif } from '../../engine/tipler';
import { R, Y, Kart, Baslik, Buton, Rozet, Cubuk, Kalpler } from '../ui';

export default function ProgramEkrani() {
  const { s, yap, reklamIzle } = useOyun();
  if (!s) return null;
  const teklifler = [...s.teklifler].sort((a, b) => a.bitisDakika - b.bitisDakika);
  const enerji = M.teklifEnerjisi(s);
  const acikSahalar = s.sahalar.filter(M.hizmette);
  const saatler: number[] = [];
  for (let h = V.ACILIS_SAATI; h <= 26; h++) if (acikSahalar.some((x) => M.acikSaatler(x).includes(h))) saatler.push(h);
  const simdi = M.suankiSaat(s);

  return (
    <ScrollView contentContainerStyle={st.icerik} showsVerticalScrollIndicator={false}>
      <SozlesmeKarti />
      <Kart>
        <Baslik ikon="call" sag={<Rozet yazi={`Kabul: ${enerji}⚡`} renk={R.sari} />}>
          Gelen teklifler
        </Baslik>
        {teklifler.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 14 }}>
            <Ionicons name="hourglass" size={26} color={R.mat} />
            <Y style={{ color: R.soluk, marginTop: 6, textAlign: 'center' }}>
              {s.gunBitti ? 'Gün kapandı.' : 'Telefon şimdilik sessiz. Saat ilerledikçe takımlar arar.'}
            </Y>
          </View>
        )}
        {teklifler.map((t) => (
          <TeklifKarti key={t.id} t={t} />
        ))}
        {s.enerji < enerji && M.reklamHakki(s, 'caymola') > 0 && (
          <Buton tur="reklam" yazi={`${M.sehir(s).karakter.cayci}'den çay molası: +30 enerji`} alt={`Bugün ${M.reklamHakki(s, 'caymola')} hak`} onPress={() => reklamIzle('caymola')} />
        )}
      </Kart>

      <Kart>
        <Baslik ikon="calendar">Bugünün programı</Baslik>
        {acikSahalar.length > 1 && (
          <View style={[st.satir, { marginBottom: 6, paddingLeft: 52 }]}>
            {acikSahalar.map((x) => (
              <Y key={x.id} k style={{ flex: 1, fontSize: 10.5, color: R.soluk }} numberOfLines={1}>
                {x.ad.replace(' Sahası', '')}
              </Y>
            ))}
          </View>
        )}
        {saatler.map((h) => {
          const gecti = h < simdi;
          const su = h === simdi && !s.gunBitti;
          return (
            <View key={h} style={[st.saatSatir, su && st.suAn, gecti && { opacity: 0.45 }]}>
              <Y k style={{ width: 48, fontSize: 12.5, color: su ? R.turuncu : R.yazi2 }}>{V.saatYazi(h)}</Y>
              {acikSahalar.map((x) => {
                const r = s.rezervasyonlar.find((z) => z.sahaId === x.id && z.saat === h);
                const acik = M.acikSaatler(x).includes(h);
                if (!acik)
                  return (
                    <View key={x.id} style={[st.hucre, { backgroundColor: 'transparent' }]}>
                      <Ionicons name="moon" size={11} color={R.mat} />
                    </View>
                  );
                if (!r)
                  return (
                    <View key={x.id} style={st.hucre}>
                      <Y style={{ fontSize: 11, color: R.mat }}>boş</Y>
                    </View>
                  );
                const renk = r.lig ? R.mor : r.derbi || r.final || r.ozel === 'meydan' ? R.turuncu : r.kupa ? R.sari : r.sozlesme ? R.sari : r.abone ? R.pembe : r.takimId.startsWith('misafir:') ? R.mavi : R.yesil;
                const kupaM = r.kupa ? s.kupa?.turlar[r.kupa.tur]?.[r.kupa.esleme] : null;
                const ad = r.lig ? `Saha Bizim SK - ${M.takimAdi(s, r.takimId).split(' ')[0]}` : r.derbi ? 'DERBİ' : r.final ? 'BÜYÜK FİNAL' : kupaM ? `${M.takimAdi(s, kupaM.a).split(' ')[0]} - ${M.takimAdi(s, kupaM.b).split(' ')[0]}` : M.takimAdi(s, r.takimId);
                const alt = r.lig ? 'Lig maçı' : r.kupa ? ['Kupa çeyrek', 'Kupa yarı', 'KUPA FİNALİ'][r.kupa.tur] : r.final ? 'rakiple' : r.ozel === 'meydan' ? 'meydan okuma' : r.ozel === 'dugun' ? 'düğün maçı' : r.ozel === 'hayir' ? 'hayır maçı' : r.sozlesme ? 'sözleşme' : r.derbi ? 'Pazar derbisi' : M.para(r.fiyat);
                return (
                  <View key={x.id} style={[st.hucre, { backgroundColor: renk + '22', borderColor: renk + '88' }]}>
                    <Y k style={{ fontSize: 11, color: R.yazi }} numberOfLines={1}>
                      {ad}
                    </Y>
                    <Y style={{ fontSize: 10, color: renk }}>
                      {r.durum === 'oynaniyor' ? 'oynanıyor' : r.durum === 'bitti' ? `${r.skor?.[0]}-${r.skor?.[1]}` : alt}
                    </Y>
                  </View>
                );
              })}
            </View>
          );
        })}
        <View style={[st.satir, { marginTop: 8, gap: 10, flexWrap: 'wrap' }]}>
          <Rozet yazi="Müdavim" renk={R.yesil} />
          <Rozet yazi="Abone" renk={R.pembe} />
          <Rozet yazi="Misafir" renk={R.mavi} />
          <Rozet yazi="Derbi" renk={R.turuncu} />
        </View>
      </Kart>
    </ScrollView>
  );
}

function TeklifKarti({ t }: { t: Teklif }) {
  const { s, yap } = useOyun();
  if (!s) return null;
  const misafir = t.takimId.startsWith('misafir:');
  const tk = misafir ? null : M.takimBul(s, t.takimId);
  const td = tk ? s.takimlar[tk.id] : null;
  const tip = tk ? V.TAKIM_TIPLERI[tk.tip] : null;
  const kalan = Math.max(0, t.bitisDakika - s.dakika);
  return (
    <View style={st.teklif}>
      <View style={st.satir}>
        <View style={[st.ikon, { backgroundColor: (tip?.renk ?? R.mavi) + '33' }]}>
          <Ionicons name={(tip?.ikon ?? 'people') as any} size={18} color={tip?.renk ?? R.mavi} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Y k style={{ fontSize: 14.5 }} numberOfLines={1}>
            {M.takimAdi(s, t.takimId)}
          </Y>
          <View style={[st.satir, { marginTop: 2 }]}>
            {td ? <Kalpler sevgi={td.sevgi} boyut={11} /> : <Y style={{ fontSize: 11, color: R.soluk }}>Misafir grup</Y>}
            {tk && <Y style={{ fontSize: 11, color: R.soluk, marginLeft: 6 }}>{M.mahalleAdi(s, tk.mahalleId)}</Y>}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Y s style={{ fontSize: 16, color: R.yesil }}>{t.fiyat === 0 ? 'Bağış' : M.para(t.fiyat)}</Y>
          <Y k style={{ fontSize: 12, color: R.sari }}>{V.saatYazi(t.saat)}</Y>
        </View>
      </View>
      {t.ozel && (
        <View style={{ marginTop: 6 }}>
          <Rozet yazi={t.ozel === 'dugun' ? 'DÜĞÜN MAÇI · 3 kat ücret' : 'HAYIR MAÇI · ücretsiz, +12 itibar, tüm mahallelere +3'} renk={t.ozel === 'dugun' ? R.pembe : R.kirmizi} ikon={t.ozel === 'dugun' ? 'musical-notes' : 'heart'} />
        </View>
      )}
      {t.not && <Y style={{ fontSize: 11.5, color: R.soluk, marginTop: 6, fontStyle: 'italic' }}>"{t.not}"</Y>}
      <View style={{ marginTop: 8 }}>
        <Cubuk oran={kalan / V.TEKLIF_GECERLILIK_DK} renk={kalan < 30 ? R.kirmizi : R.mat} yukseklik={4} />
      </View>
      <View style={[st.satir, { marginTop: 8, gap: 8 }]}>
        <Buton kucuk tur="cizgi" yazi="Reddet" style={{ flex: 1 }} onPress={() => yap((d) => M.teklifReddet(d, t.id))} />
        <Buton kucuk tur="yesil" ikon="checkmark" yazi="Kabul et" style={{ flex: 2 }} onPress={() => yap((d) => M.teklifKabul(d, t.id))} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  icerik: { padding: 12, paddingBottom: 30 },
  uyari: { flexDirection: 'row', alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: R.kirmizi, borderRadius: 10, padding: 8 },
  sozIzgara: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  bilgi: { width: '48.5%', backgroundColor: R.kart, borderRadius: 10, padding: 8 },
  satir: { flexDirection: 'row', alignItems: 'center' },
  teklif: { backgroundColor: R.kart, borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: R.cizgi },
  ikon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saatSatir: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, borderRadius: 8, paddingHorizontal: 4 },
  suAn: { backgroundColor: '#3A2A0E' },
  hucre: { flex: 1, marginLeft: 4, minHeight: 34, borderRadius: 8, backgroundColor: R.arka, borderWidth: 1, borderColor: R.cizgi, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
});

function SozlesmeKarti() {
  const { s, yap } = useOyun();
  if (!s) return null;
  const t = s.sozlesmeTeklifi;
  const sz = s.sozlesme;
  if (!t && !sz) return null;
  if (sz) {
    const saha = s.sahalar.filter(M.hizmette).sort((a, b) => b.kalite - a.kalite)[0];
    const risk = saha && saha.kalite < sz.minKalite + 0.6;
    return (
      <Kart vurgu={R.sari}>
        <Baslik ikon="document-text" sag={<Rozet yazi={`${sz.gunSayisi - sz.kalanGun}/${sz.gunSayisi} gün`} renk={R.sari} />}>
          Sözleşme: {sz.firma}
        </Baslik>
        <Cubuk oran={(sz.gunSayisi - sz.kalanGun) / sz.gunSayisi} renk={R.sari} />
        <Y style={{ fontSize: 12.5, color: R.yazi2, marginTop: 8, lineHeight: 18 }}>
          Her gün {V.saatYazi(sz.saat)}'da {M.para(sz.ucret)}. Bitince bonus {M.para(sz.bonus)}. Halı kalitesi {sz.minKalite}'in altına düşerse sözleşme bozulur, ceza {M.para(sz.ceza)}.
        </Y>
        {risk && (
          <View style={st.uyari}>
            <Ionicons name="warning" size={15} color={R.kirmizi} />
            <Y k style={{ fontSize: 12, color: R.kirmizi, marginLeft: 6, flex: 1 }}>Halı kalitesi sınıra yakın! Bakım yap.</Y>
          </View>
        )}
        <Buton kucuk tur="cizgi" style={{ marginTop: 10 }} yazi={`Sözleşmeyi bozdur (ceza ${M.para(sz.ceza)})`} onPress={() => yap((d) => M.sozlesmeIptal(d))} />
      </Kart>
    );
  }
  return (
    <Kart vurgu={R.sari}>
      <Baslik ikon="document-text" sag={<Rozet yazi="YENİ TEKLİF" renk={R.sari} />}>
        {t!.firma}
      </Baslik>
      <Y style={{ fontSize: 13, color: R.yazi2, lineHeight: 19 }}>
        "{t!.gunSayisi} gün boyunca her akşam {V.saatYazi(t!.saat)} bizim olsun. Sahanız iyi bakımlı kalsın yeter."
      </Y>
      <View style={st.sozIzgara}>
        <Bilgi e="Maç başı" d={M.para(t!.ucret)} />
        <Bilgi e="Bitiş bonusu" d={M.para(t!.bonus)} renk={R.yesil} />
        <Bilgi e="En düşük kalite" d={`${t!.minKalite}`} />
        <Bilgi e="Bozulursa ceza" d={M.para(t!.ceza)} renk={R.kirmizi} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <Buton kucuk tur="cizgi" yazi="Reddet" style={{ flex: 1 }} onPress={() => yap((d) => M.sozlesmeReddet(d))} />
        <Buton kucuk tur="ana" ikon="create" yazi="İmzala" style={{ flex: 2 }} onPress={() => yap((d) => M.sozlesmeKabul(d))} />
      </View>
    </Kart>
  );
}
function Bilgi({ e, d, renk }: { e: string; d: string; renk?: string }) {
  return (
    <View style={st.bilgi}>
      <Y style={{ fontSize: 10.5, color: R.soluk }}>{e}</Y>
      <Y s style={{ fontSize: 14, color: renk ?? R.yazi }}>{d}</Y>
    </View>
  );
}
