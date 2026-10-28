// ============================================
// BEŞLİ PATRON — components/Ogretici.tsx
// İlk açılışta gösterilen Ela'nın öğretici kartları
// ============================================
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GORDU_KEY = 'besli_patron_ogretici_gordu';

const KARTLAR = [{
    emoji: '👩',
    baslik: 'Merhaba Patron!',
    metin: 'Ben Ela 💕 Küçük bir halı sahayı futbol imparatorluğuna çevirmene yardım edeceğim. Önce birkaç şeyi öğreteyim, söz uzun sürmeyecek.',
  }, {
    emoji: '📋',
    baslik: 'Rezervasyonlar',
    metin: 'Rezervasyonlar sekmesinde müşteri teklifleri gelir. Beğendiğini kabul et — ama dikkat, her kabul enerjinin bir kısmını harcar. Zirve saat (22:00-23:00) en kazançlısı!',
  }, {
    emoji: '🏟️',
    baslik: 'İşletme',
    metin: 'İşletme sekmesi oyunun kalbi: yükseltmeler, personel, sponsorlar ve sahalar. Para kazandıkça yeni sahalar inşa et, pasif gelir elde et.',
  }, {
    emoji: '👷',
    baslik: 'Personel',
    metin: 'Kasiyer enerjini azaltır, temizlikçi memnuniyeti artırır, antrenör lig gücünü yükseltir, güvenlik olay riskini düşürüp ekstra rezervasyon getirir. Doğru kadro = rahat patron.',
  }, {
    emoji: '⚡',
    baslik: 'Olaylar',
    metin: 'Gün içinde beklenmedik olaylar çıkar. Seçeneklerden birini seç ve sonucu gör. Kamera, otopark, kantin ve güvenlik yatırımları bazı olayların hiç çıkmamasını sağlar!',
  }, {
    emoji: '⚽',
    baslik: 'Lig',
    metin: 'Her gün 1 lig maçı oynayabilirsin (15 enerji). 7 hafta sonunda ilk 3\'e girersen büyük ödül! Saha kaliten, antrenörün ve memnuniyetin takım gücünü artırır.',
  }, {
    emoji: '❤️',
    baslik: 'Benimle İlişki',
    metin: 'Yaşam sekmesinde beni bulursun 💕 İlişkimizi ilerlettikçe prestij ve mutluluk kazanırsın. Bana sürprizler yapmayı unutma!',
  }, {
    emoji: '🌙',
    baslik: 'Gün Sonu',
    metin: 'Günü bitirince kira, elektrik-su ve maaşlar düşer; sponsor gelirin kasaya eklenir. Net kâr/zararını özette görürsün. 3 gün üst üste kasanda para kalmazsa iflas!',
  }, {
    emoji: '💡',
    baslik: 'Son İpucu',
    metin: 'Enerjin her sabah 70\'e yenilenir. Jetonla enerji takviyesi yapabilirsin. Uygulamayı kapatsan da oyun kaldığın yerden devam eder. Hazırsan patron, haydi iş başı! ⚽',
  }];

export async function ogreticiSifirla(): Promise<void> {
  await AsyncStorage.removeItem(GORDU_KEY);
}

export default function Ogretici() {
  const [gorunur, setGorunur] = useState(false);
  const [adim, setAdim] = useState(0);
  const { width } = useWindowDimensions();
  const o = Math.min(1, width / 420);

  useEffect(() => {
    (async () => {
      try {
        const gordu = await AsyncStorage.getItem(GORDU_KEY);
        if (!gordu) setGorunur(true);
      } catch {}
    })();
  }, []);

  const kapat = async () => {
    setGorunur(false);
    try {
      await AsyncStorage.setItem(GORDU_KEY, 'evet');
    } catch {}
  };

  const kart = KARTLAR[adim];
  const son = adim === KARTLAR.length - 1;

  const ileri = () => {
    if (!(adim + 1 >= KARTLAR.length)) setAdim(adim + 1);
    else kapat();
  };

  return (
    <Modal visible={gorunur} transparent animationType="fade" onRequestClose={kapat}>
      <View style={styles.kaplama}>
        <View style={[styles.kart, { width: Math.min(width - 40 * o, 400), padding: 22 * o }]}>
          <Text style={[styles.emoji, { fontSize: 56 * o }]}>{kart.emoji}</Text>
          <Text style={[styles.baslik, { fontSize: 20 * o }]}>{kart.baslik}</Text>
          <Text style={[styles.metin, { fontSize: 14.5 * o }]}>{kart.metin}</Text>
          <View style={styles.noktalar}>
            {KARTLAR.map((_, i) => (
              <View key={i} style={[styles.nokta, i === adim && styles.noktaAktif]} />
            ))}
          </View>
          <Text style={styles.marka}>SARDUR TECHNOLOGIES</Text>
          <View style={styles.butonSatir}>
            <TouchableOpacity style={styles.atla} onPress={kapat}>
              <Text style={styles.atlaYazi}>Atla</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ileri, son && styles.ileriSon]} onPress={ileri}>
              <Text style={styles.ileriYazi}>{son ? 'Başlayalım! ⚽' : 'İleri →'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kaplama: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  kart: {
    backgroundColor: '#132A13',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  emoji: { marginBottom: 8 },
  baslik: { color: '#FFD700', fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  metin: { color: '#E8F5E9', textAlign: 'center', lineHeight: 21, marginBottom: 16 },
  noktalar: { flexDirection: 'row', marginBottom: 16 },
  nokta: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4A6741', marginHorizontal: 4 },
  noktaAktif: { backgroundColor: '#FFD700', width: 20 },
  butonSatir: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  atla: { padding: 10 },
  atlaYazi: { color: '#9AB973', fontWeight: '600' },
  ileri: { backgroundColor: '#FFD700', paddingVertical: 12, paddingHorizontal: 26, borderRadius: 12 },
  ileriSon: { backgroundColor: '#4ADE80' },
  ileriYazi: { color: '#132A13', fontWeight: '900' },
  marka: { color: '#9AB973', fontSize: 11, letterSpacing: 2, fontWeight: '700', marginBottom: 12 },
});
