// ============================================
// SAHA BİZİM — components/TakimKarti.tsx
// 3. etap: kendi takımın Saha Bizim SK — kadro, gözlemci, antrenman, lig
// ============================================
import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOyun } from '../context/OyunContext';
import * as M from '../engine/motor';
import * as V from '../engine/veri';
import { R, Y, Kart, Baslik, Buton, Rozet } from './ui';

const MEVKI_RENK: Record<string, string> = { K: '#FBBF24', D: '#38BDF8', O: '#22C55E', F: '#F87171' };

function Rozetli({ mevki }: { mevki: string }) {
  return (
    <View style={[st.mevki, { backgroundColor: MEVKI_RENK[mevki] + '33', borderColor: MEVKI_RENK[mevki] }]}>
      <Y s style={{ fontSize: 11, color: MEVKI_RENK[mevki] }}>{mevki}</Y>
    </View>
  );
}

export default function TakimKarti() {
  const { s, yap, reklamIzle } = useOyun();
  const [sekme, setSekme] = useState<'kadro' | 'transfer' | 'lig'>('kadro');
  if (!s) return null;
  const t = s.takim;
  const c = M.maliyetCarpan(s);
  const bayrak = V.BAYRAK_SECENEK[s.tesisSus.bayrak] ?? V.BAYRAK_SECENEK[0];

  if (!t.kuruldu) {
    const olur = M.takimKurulabilir(s);
    return (
      <Kart vurgu={olur ? R.mor : undefined}>
        <View style={st.satir}>
          <View style={[st.arma, { backgroundColor: bayrak.a }]}>
            <Ionicons name="shield" size={26} color={bayrak.b} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Y s style={{ fontSize: 17 }}>Saha Bizim SK</Y>
            <Y style={{ color: R.yazi2, fontSize: 12.5, lineHeight: 18 }}>
              Kendi takımını kur: mahalle takımlarından oyuncu topla, her Cumartesi lig maçına çık, şampiyon ol. Takımın büyük finalde de sana güç katar.
            </Y>
          </View>
        </View>
        {olur ? (
          <Buton style={{ marginTop: 12 }} yazi={`Takımı kur · ${M.para(V.TAKIM_KURULUS * c)}`} ikon="flag" onPress={() => yap((d) => M.takimKur(d))} />
        ) : (
          <View style={[st.kilit]}>
            <Ionicons name="lock-closed" size={14} color={R.soluk} />
            <Y k style={{ color: R.soluk, fontSize: 12.5, marginLeft: 6 }}>İlk mahalleni tamamen kazanınca açılır.</Y>
          </View>
        )}
      </Kart>
    );
  }

  const guc = M.takimGucu(s);
  const lig = t.lig;
  const rakip = M.ligSiradakiRakip(s);
  const kalan = M.ligKalanGun(s);
  const bizSira = lig ? M.ligSiralama(lig).findIndex((x) => x.id === 'biz') + 1 : 0;

  return (
    <Kart vurgu={R.mor}>
      <View style={[st.satir, { marginBottom: 10 }]}>
        <View style={[st.arma, { backgroundColor: bayrak.a }]}>
          <Ionicons name="shield" size={26} color={bayrak.b} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Y s style={{ fontSize: 17 }}>Saha Bizim SK</Y>
          <Y style={{ color: R.soluk, fontSize: 12 }}>
            Güç {guc} · {t.oyuncular.length}/{V.KADRO_MAKS} oyuncu{t.sampiyonluk ? ` · ${t.sampiyonluk} şampiyonluk` : ''}
          </Y>
        </View>
        {lig && <Rozet yazi={`${bizSira}. sıra`} renk={R.mor} ikon="podium" />}
      </View>

      {rakip && lig && !lig.bitti && (
        <View style={st.sonraki}>
          <Ionicons name="calendar" size={16} color={R.mor} />
          <Y k style={{ fontSize: 12.5, marginLeft: 6, flex: 1 }}>
            {kalan === 0 ? `BU AKŞAM ${V.saatYazi(V.LIG_SAAT)}` : `${kalan} gün sonra (Cumartesi)`}: {rakip} · {lig.hafta + 1}/5. hafta
          </Y>
        </View>
      )}
      {t.oyuncular.length < 5 && (
        <View style={[st.sonraki, { borderColor: R.kirmizi }]}>
          <Ionicons name="warning" size={16} color={R.kirmizi} />
          <Y k style={{ fontSize: 12.5, marginLeft: 6, flex: 1 }}>Maça çıkmak için en az 5 oyuncu lazım. Yoksa hükmen yenilirsin!</Y>
        </View>
      )}

      <View style={st.segment}>
        {(['kadro', 'transfer', 'lig'] as const).map((x) => (
          <Pressable key={x} onPress={() => setSekme(x)} style={[st.seg, sekme === x && st.segSec]}>
            <Y k style={{ fontSize: 12.5, color: sekme === x ? '#1A1205' : R.yazi2 }}>{x === 'kadro' ? 'Kadro' : x === 'transfer' ? 'Transfer' : 'Lig tablosu'}</Y>
          </Pressable>
        ))}
      </View>

      {sekme === 'kadro' && (
        <>
          {[...t.oyuncular].sort((a, b) => 'KDOF'.indexOf(a.mevki) - 'KDOF'.indexOf(b.mevki)).map((o) => (
            <View key={o.id} style={st.oyuncu}>
              <Rozetli mevki={o.mevki} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Y k style={{ fontSize: 13 }}>{o.ad}</Y>
                <Y style={{ fontSize: 10.5, color: R.soluk }}>{M.takimAdi(s, o.nereden)}</Y>
              </View>
              <Y s style={{ fontSize: 16, color: o.guc >= 70 ? R.yesil : o.guc >= 50 ? R.sari : R.yazi2, marginRight: 8 }}>{o.guc}</Y>
              <Pressable hitSlop={8} onPress={() => yap((d) => M.oyuncuBirak(d, o.id))}>
                <Ionicons name="close-circle-outline" size={20} color={R.mat} />
              </Pressable>
            </View>
          ))}
          <View style={[st.satir, { gap: 8, marginTop: 6 }]}>
            <Buton
              kucuk
              style={{ flex: 1 }}
              pasif={t.antrenmanGun === s.gun}
              yazi={t.antrenmanGun === s.gun ? 'Antrenman yapıldı' : `Antrenman · ${V.ANTRENMAN_ENERJI}⚡`}
              ikon="barbell"
              onPress={() => yap((d) => M.antrenmanYap(d))}
            />
            {M.reklamHakki(s, 'antrenman') > 0 && t.oyuncular.length > 0 && (
              <Buton kucuk style={{ flex: 1 }} tur="reklam" yazi="Özel antrenman +3" onPress={() => reklamIzle('antrenman')} />
            )}
          </View>
          <Y style={{ fontSize: 11, color: R.soluk, marginTop: 8 }}>Güç: en iyi 5 oyuncunun ortalaması. Kalecin yoksa takım zayıflar. Özel antrenman en zayıf oyuncuyu geliştirir.</Y>
        </>
      )}

      {sekme === 'transfer' && (
        <>
          <Y style={{ fontSize: 12, color: R.yazi2, marginBottom: 8 }}>Gözlemcin, seni seven mahalle takımlarından yetenekler buldu. Liste 2 günde bir yenilenir.</Y>
          {t.adaylar.map((o) => (
            <View key={o.id} style={st.oyuncu}>
              <Rozetli mevki={o.mevki} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Y k style={{ fontSize: 13 }}>{o.ad}</Y>
                <Y style={{ fontSize: 10.5, color: R.soluk }}>
                  {V.MEVKI_AD[o.mevki]} · {M.takimAdi(s, o.nereden)}
                </Y>
              </View>
              <Y s style={{ fontSize: 16, color: o.guc >= 70 ? R.yesil : o.guc >= 50 ? R.sari : R.yazi2, marginRight: 8 }}>{o.guc}</Y>
              <Buton kucuk tur="yesil" yazi={M.para(o.bedel)} onPress={() => yap((d) => M.oyuncuAl(d, o.id))} />
            </View>
          ))}
          {t.adaylar.length === 0 && <Y style={{ color: R.soluk, fontSize: 12.5 }}>Bugünlük aday kalmadı.</Y>}
          <Buton kucuk tur="koyu" style={{ marginTop: 6 }} yazi={`Gözlemciyi tekrar gönder · ${M.para(800 * c)}`} ikon="search" onPress={() => yap((d) => M.adaylariYenile(d))} />
        </>
      )}

      {sekme === 'lig' && lig && (
        <>
          <View style={[st.tabloSatir, { borderBottomWidth: 1, borderColor: R.cizgi }]}>
            <Y k style={[st.tHucre, { flex: 1, textAlign: 'left' }]}>{lig.sezon}. sezon</Y>
            {['O', 'G', 'B', 'M', 'AV', 'P'].map((h) => (
              <Y key={h} k style={st.tHucre}>{h}</Y>
            ))}
          </View>
          {M.ligSiralama(lig).map((x, i) => (
            <View key={x.id} style={[st.tabloSatir, x.id === 'biz' && { backgroundColor: R.mor + '22', borderRadius: 8 }]}>
              <Y k numberOfLines={1} style={[st.tHucre, { flex: 1, textAlign: 'left', color: x.id === 'biz' ? R.mor : R.yazi }]}>
                {i + 1}. {x.ad}
              </Y>
              {[x.o, x.g, x.b, x.m, x.ag - x.yg].map((v, j) => (
                <Y key={j} style={st.tHucre}>{v}</Y>
              ))}
              <Y s style={[st.tHucre, { color: R.sari }]}>{M.ligPuan(x)}</Y>
            </View>
          ))}
          {lig.sonuclar.filter((r) => r.a === 'biz' || r.b === 'biz').slice(-3).reverse().map((r, i) => {
            const ad = (id: string) => lig.takimlar.find((x) => x.id === id)?.ad ?? id;
            return (
              <Y key={i} style={{ fontSize: 11.5, color: R.yazi2, marginTop: i ? 2 : 8 }}>
                {r.hafta + 1}. hafta: {ad(r.a)} {r.skor[0]}-{r.skor[1]} {ad(r.b)}
              </Y>
            );
          })}
          {lig.bitti && <Y k style={{ color: R.sari, marginTop: 8 }}>Sezon bitti! Şampiyon: {lig.takimlar.find((x) => x.id === lig.sampiyon)?.ad}. Yeni sezon Pazartesi.</Y>}
          <Y style={{ fontSize: 11, color: R.soluk, marginTop: 8 }}>Galibiyet 3 puan. Şampiyonluk: büyük para, +25 itibar ve efsane forma.</Y>
        </>
      )}
    </Kart>
  );
}

const st = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center' },
  arma: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kilit: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: R.kart2, padding: 10, borderRadius: 10 },
  sonraki: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: R.mor, borderRadius: 10, padding: 8, marginBottom: 8 },
  segment: { flexDirection: 'row', backgroundColor: R.arka2, borderRadius: 12, padding: 3, marginVertical: 8 },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 9 },
  segSec: { backgroundColor: R.mor },
  oyuncu: { flexDirection: 'row', alignItems: 'center', backgroundColor: R.kart2, borderRadius: 10, padding: 8, marginBottom: 6 },
  mevki: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  tabloSatir: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 4 },
  tHucre: { width: 26, textAlign: 'center', fontSize: 11.5, color: R.yazi2 },
});
