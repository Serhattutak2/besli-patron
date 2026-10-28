// ============================================
// BEŞLİ PATRON — components/OdulluReklamButonu.tsx
// Ödüllü reklam izleyip enerji kazanma kutusu
// ============================================
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { useGame } from '../context/GameContext';
import { odulluReklamIzle } from '../services/adManager';
import { sfx } from '../services/soundManager';

export default function OdulluReklamButonu({ odulEnerji = 50 }: { odulEnerji?: number }) {
  const oyun: any = useGame();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState('');
  const { width } = useWindowDimensions();
  const o = Math.min(1, width / 420);

  const enerjiVer = (miktar: number): boolean => {
    if (typeof oyun.enerjiEkle === 'function') {
      oyun.enerjiEkle(miktar);
      return true;
    }
    if (typeof oyun.enerjiArttir === 'function') {
      oyun.enerjiArttir(miktar);
      return true;
    }
    if (typeof oyun.devHediye === 'function') {
      oyun.devHediye(0, miktar, 0, false);
      return true;
    }
    return false;
  };

  const basla = async () => {
    if (yukleniyor) return;
    setYukleniyor(true);
    setMesaj('');
    try {
      const odul = await odulluReklamIzle();
      if (!odul) setMesaj('Reklam tamamlanmadan ödül verilmez.');
      else if (!enerjiVer(odulEnerji)) setMesaj('Reklam tamamlandı ama enerji eklenemedi.');
      else {
        sfx('alkis');
        setMesaj(`+${odulEnerji} enerji! Reklam izledikçe kazanmaya devam et.`);
      }
    } catch {
      setMesaj('Bir sorun oluştu, tekrar dene.');
    } finally {
      setYukleniyor(false);
      setTimeout(() => setMesaj(''), 3500);
    }
  };

  return (
    <View style={[styles.blok, { padding: 14 * o }]}>
      <Text style={[styles.baslik, { fontSize: 15 * o }]}>Ödüllü Reklam</Text>
      <Text style={[styles.aciklama, { fontSize: 12.5 * o }]}>
        Kısa bir reklam izle, {odulEnerji} enerji kazan. Sınırsız — istediğin kadar izle!
      </Text>
      <TouchableOpacity style={[styles.buton, { paddingVertical: 12 * o }]} onPress={basla} disabled={yukleniyor}>
        {yukleniyor ? (
          <ActivityIndicator color="#132A13" />
        ) : (
          <Text style={[styles.butonYazi, { fontSize: 14 * o }]}>Reklam izle, {odulEnerji} enerji kazan</Text>
        )}
      </TouchableOpacity>
      {mesaj !== '' ? <Text style={[styles.mesaj, { fontSize: 12.5 * o }]}>{mesaj}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  blok: {
    backgroundColor: '#132A13',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#4A6741',
    marginVertical: 8,
  },
  baslik: { color: '#FFD700', fontWeight: '900', marginBottom: 4 },
  aciklama: { color: '#E8F5E9', marginBottom: 10 },
  buton: { backgroundColor: '#FFD700', borderRadius: 10, alignItems: 'center' },
  butonYazi: { color: '#132A13', fontWeight: '900' },
  mesaj: { color: '#9AB973', marginTop: 8, textAlign: 'center', fontWeight: '700' },
});
