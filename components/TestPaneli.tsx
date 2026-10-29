// ============================================
// SAHA BİZİM — components/TestPaneli.tsx
// Deneme sürümüne özel kısayollar (App Store sürümünde görünmez)
// ============================================
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useOyun } from '../context/OyunContext';
import * as M from '../engine/motor';
import type { OyunDurumu } from '../engine/tipler';
import { TEST_MODU } from '../constants/ayar';
import { R, Y, Kart, Baslik, Buton } from './ui';

export default function TestPaneli() {
  const { s, yap, bildir } = useOyun();
  if (!TEST_MODU || !s) return null;
  const k = (yazi: string, f: (d: OyunDurumu) => OyunDurumu, mesaj: string) => (
    <Buton
      kucuk
      tur="koyu"
      yazi={yazi}
      style={st.btn}
      onPress={() => {
        yap(f);
        bildir(mesaj, 'iyi');
      }}
    />
  );
  return (
    <Kart vurgu={R.mor}>
      <Baslik ikon="flask">Deneme paneli</Baslik>
      <Y style={{ fontSize: 12, color: R.soluk, marginBottom: 10 }}>
        Para ve enerji hep dolu. Üstteki 8x ile zamanı hızlandırabilirsin. Bu panel sadece deneme sürümünde var.
      </Y>
      <View style={st.izgara}>
        {k('Mahallelere +40', (d) => M.TEST.mahalleler(d, 40), 'Tüm mahallelere +40 etki')}
        {k('Hepsini fethet', (d) => M.TEST.mahalleler(d, 100), 'Bütün mahalleler senin')}
        {k('İnşaatları bitir', M.TEST.insaatlariBitir, 'İnşaatlar tamamlandı')}
        {k('Canlı an çıkar', M.TEST.canliAn, 'Canlı an başladı')}
        {k('Beceri oyunlu an', (d) => M.TEST.ozelAn(d, 'oyun'), 'Beceri oyunlu an')}
        {k('Şehre özel an', (d) => M.TEST.ozelAn(d, 'sehir'), 'Şehre özel an')}
        {k('Altın an çıkar', (d) => M.TEST.ozelAn(d, 'altin'), 'Altın an!')}
        {k('Kupa teklifi', M.TEST.kupaBaslat, 'Mahalle sekmesinde kupa teklifi')}
        {k('Sözleşme teklifi', M.TEST.sozlesmeTeklif, 'Program sekmesinde sözleşme teklifi')}
        {k('Büyük final (bu akşam)', M.TEST.finalBaslat, 'Final bu akşam 21:00')}
        {k('Takım kur (6 oyuncu)', M.TEST.takimHazir, 'Saha Bizim SK hazır')}
        {k('Lig maçı bu akşam', M.TEST.ligBuAksam, 'Lig maçı 20:00')}
        {k('Günü hemen bitir', M.TEST.gunuBitir, 'Gün bitti')}
        {k('Pazar derbisine atla', M.TEST.pazaraAtla, 'Yeni güne başlayınca derbi günü')}
        {k('Derbi saatine git', M.TEST.derbiSaatine, 'Derbi birazdan başlıyor')}
        {k('5 forma ver', (d) => M.TEST.formaVer(d, 5), '5 forma eklendi')}
        {k('Gece bekçisi raporu', M.TEST.geceRaporu, '8 saat yokmuşsun gibi')}
        {k('Mini oyun hakkı', M.TEST.miniHak, '+1 penaltı hakkı')}
        {k('Reklam haklarını yenile', M.TEST.reklamSifirla, 'Reklam hakları yenilendi')}
        {k('Günlük ödülü tekrar', M.TEST.seriSifirla, 'Günlük ödül penceresi açılacak')}
      </View>
    </Kart>
  );
}

const st = StyleSheet.create({
  izgara: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btn: { width: '48.5%' },
});
