// ============================================
// SAHA BİZİM — components/ekranlar/KulupEkrani.tsx
// Kulüp binası: patronun mini oyunu, kapıdaki menajer, efsane formalar duvarı,
// çay ocağı ve personel
// ============================================
import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOyun } from '../../context/OyunContext';
import * as M from '../../engine/motor';
import * as V from '../../engine/veri';
import { R, Y, Kart, Baslik, Buton, Rozet, Forma } from '../ui';
import MiniOyun from '../MiniOyun';

export default function KulupEkrani({ miniAc }: { miniAc: () => void }) {
  const { s, yap, reklamIzle } = useOyun();
  const [formaSec, setFormaSec] = useState<string | null>(null);
  if (!s) return null;
  const sh = M.sehir(s);
  const setler = M.tamamlananSetler(s);
  const secForma = V.FORMALAR.find((f) => f.id === formaSec);
  const cayM = M.cayYukseltMaliyeti(s);

  return (
    <ScrollView contentContainerStyle={st.icerik} showsVerticalScrollIndicator={false} onScrollBeginDrag={() => s.yeniFormalar.length && yap((d) => M.formalariGordu(d))}>
      {/* Mini oyun */}
      <Kart vurgu={s.miniOyunHak > 0 ? R.turuncu : undefined}>
        <View style={st.satir}>
          <View style={[st.buyukIkon, { backgroundColor: '#14532D' }]}>
            <Ionicons name="football" size={28} color="#86EFAC" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Y s style={{ fontSize: 17 }}>Patron sahaya iniyor</Y>
            <Y style={{ fontSize: 12, color: R.soluk }}>Her gün 5 penaltı. 3+ gol seriyi sürdürür, 7 günlük seri efsane forma getirir.</Y>
          </View>
        </View>
        <View style={[st.satir, { marginTop: 10, gap: 8 }]}>
          <Rozet yazi={`Seri: ${s.miniOyunSeri} gün`} renk={R.turuncu} ikon="flame" />
          <Rozet yazi={`Rekor: ${s.miniOyunRekor}/5`} renk={R.mavi} ikon="ribbon" />
        </View>
        {s.miniOyunHak > 0 ? (
          <Buton style={{ marginTop: 10 }} yazi="Penaltılara geç" ikon="play" onPress={miniAc} />
        ) : M.reklamHakki(s, 'var') > 0 ? (
          <Buton tur="reklam" style={{ marginTop: 10 }} yazi="VAR'a git: bir hak daha" alt="Kısa bir reklam izle" onPress={() => reklamIzle('var')} />
        ) : (
          <Y style={{ marginTop: 10, color: R.soluk, textAlign: 'center' }}>Yarın yine gel!</Y>
        )}
      </Kart>

      {/* Menajer */}
      {M.reklamHakki(s, 'menajer') > 0 && (
        <Kart>
          <View style={st.satir}>
            <View style={[st.buyukIkon, { backgroundColor: '#3B1E5B' }]}>
              <Ionicons name="briefcase" size={26} color="#C4B5FD" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Y s style={{ fontSize: 16 }}>Kapıda bir menajer var</Y>
              <Y style={{ fontSize: 12, color: R.soluk }}>"Bir dakikanızı alabilir miyim? Elimde size uygun bir forma var."</Y>
            </View>
          </View>
          <Buton tur="reklam" style={{ marginTop: 10 }} yazi="Dinle: forma kutusu aç" alt={`Bugün ${M.reklamHakki(s, 'menajer')} kez`} onPress={() => reklamIzle('menajer')} />
        </Kart>
      )}

      {/* Formalar */}
      <Kart>
        <Baslik ikon="shirt" sag={<Rozet yazi={`${s.formalar.length}/${V.FORMALAR.length}`} renk={R.mavi} />}>
          Efsane formalar duvarı
        </Baslik>
        {setler > 0 && <Y k style={{ color: R.yesil, fontSize: 12.5, marginBottom: 8 }}>{setler} set tamam: tüm fiyatlar +%{setler * 3}</Y>}
        {secForma && (
          <View style={st.formaDetay}>
            <Forma renk1={secForma.renk1} renk2={secForma.renk2} numara={secForma.numara} boyut={64} kilitli={!s.formalar.includes(secForma.id)} nadirlik={secForma.nadirlik} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Y k style={{ fontSize: 14 }}>{s.formalar.includes(secForma.id) ? secForma.ad : `${secForma.efsane} — ?`}</Y>
              <Y k style={{ fontSize: 12, color: V.NADIRLIK_RENK[secForma.nadirlik] }}>{V.NADIRLIK_YAZI[secForma.nadirlik]}</Y>
              <Y style={{ fontSize: 12, color: R.yazi2, marginTop: 3 }}>{V.BONUS_YAZI[secForma.bonus](secForma.deger)}</Y>
              {!s.formalar.includes(secForma.id) && <Y style={{ fontSize: 11, color: R.soluk, marginTop: 3 }}>Derbilerden, abonelerden, menajerden ve seriden düşer.</Y>}
            </View>
          </View>
        )}
        <View style={st.duvar}>
          {V.FORMALAR.map((f) => {
            const var_ = s.formalar.includes(f.id);
            const yeni = s.yeniFormalar.includes(f.id);
            return (
              <Pressable key={f.id} style={[st.cerceve, var_ && { borderColor: V.NADIRLIK_RENK[f.nadirlik] + 'AA' }, formaSec === f.id && { borderColor: R.yazi }]} onPress={() => setFormaSec(f.id)}>
                <Forma renk1={f.renk1} renk2={f.renk2} numara={f.numara} boyut={40} kilitli={!var_} nadirlik={f.nadirlik} />
                {yeni && <View style={st.yeniNokta} />}
              </Pressable>
            );
          })}
        </View>
      </Kart>

      {/* Çay ocağı */}
      <Kart>
        <Baslik ikon="cafe">{sh.karakter.cayci}'nin çay ocağı</Baslik>
        <Y k style={{ fontSize: 15 }}>
          {V.CAY_MENU[s.cayOcagi]}
          {s.cayOcagi > 0 ? ` · ${s.cayOcagi}. seviye` : ''}
        </Y>
        <Y style={{ fontSize: 12, color: R.soluk, marginTop: 3 }}>
          {s.cayOcagi > 0
            ? `Her maçta ~${M.para(V.CAY_MAC_BASI * s.cayOcagi * M.maliyetCarpan(s))}, saatte ~${M.para(V.CAY_SAATLIK * s.cayOcagi * M.maliyetCarpan(s))} kazandırır. Sen yokken de çalışır.`
            : 'Çay ocağı açınca her maçta ve sen yokken para birikir.'}
        </Y>
        {s.cayBirikim > 0 && <Buton tur="yesil" style={{ marginTop: 10 }} ikon="cash" yazi={`Kasayı topla: ${M.para(s.cayBirikim)}`} onPress={() => yap((d) => M.cayTopla(d))} />}
        {cayM != null && (
          <Buton tur="koyu" style={{ marginTop: 8 }} yazi={s.cayOcagi === 0 ? 'Çay ocağını aç' : `Yükselt: ${V.CAY_MENU[s.cayOcagi + 1]}`} alt={M.para(cayM)} onPress={() => yap((d) => M.cayYukselt(d))} />
        )}
      </Kart>

      {/* Personel */}
      <Kart>
        <Baslik ikon="people" sag={<Y style={{ fontSize: 12, color: R.soluk }}>Günlük maaş: {M.para(M.gunlukMaas(s))}</Y>}>
          Personel
        </Baslik>
        {V.PERSONEL.map((p) => {
          const sv = s.personel[p.id] ?? 0;
          const m = M.personelMaliyeti(s, p.id);
          return (
            <View key={p.id} style={st.personel}>
              <View style={[st.ikon, sv > 0 && { backgroundColor: '#3A2A0E' }]}>
                <Ionicons name={p.ikon as any} size={18} color={sv > 0 ? R.turuncu : R.yazi2} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Y k style={{ fontSize: 14 }}>
                  {p.ad} {sv > 0 ? <Y style={{ color: R.turuncu, fontSize: 12 }}>L{sv}</Y> : null}
                </Y>
                <Y style={{ fontSize: 11.5, color: R.soluk }}>{sv > 0 ? p.etkiler[sv - 1] : p.aciklama}</Y>
              </View>
              {m != null ? <Buton kucuk tur={sv > 0 ? 'koyu' : 'ana'} yazi={sv > 0 ? 'Terfi' : 'İşe al'} alt={M.para(m)} onPress={() => yap((d) => M.personelAl(d, p.id))} /> : <Rozet yazi="MAKS" renk={R.yesil} />}
            </View>
          );
        })}
      </Kart>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  icerik: { padding: 12, paddingBottom: 30 },
  satir: { flexDirection: 'row', alignItems: 'center' },
  buyukIkon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  duvar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-start' },
  cerceve: { width: '15%', aspectRatio: 0.9, backgroundColor: R.arka, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: R.cizgi },
  yeniNokta: { position: 'absolute', top: 3, right: 3, width: 8, height: 8, borderRadius: 4, backgroundColor: R.kirmizi },
  formaDetay: { flexDirection: 'row', alignItems: 'center', backgroundColor: R.kart, borderRadius: 14, padding: 10, marginBottom: 10 },
  personel: { flexDirection: 'row', alignItems: 'center', backgroundColor: R.kart, borderRadius: 14, padding: 10, marginBottom: 8 },
  ikon: { width: 36, height: 36, borderRadius: 11, backgroundColor: R.kart2, alignItems: 'center', justifyContent: 'center' },
});

export { MiniOyun };
