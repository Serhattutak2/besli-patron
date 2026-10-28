// ============================================
// BEŞLİ PATRON — app/tabs/lig.tsx
// Takım kariyeri: 8 kademeli lig piramidi, puan durumu, kadro ve transfer
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useGame } from '../../context/GameContext';
import { Colors } from '../../constants/colors';
import * as K from '../../services/kariyer';
import { kademeBul } from '../../services/kariyerConfig';

const para = (n: number) => `${Math.round(n).toLocaleString('tr-TR')}₺`;
const SONUC_RENK: Record<string, string> = { G: '#4ADE80', B: Colors.primary, M: '#F87171' };
const SONUC_YAZI: Record<string, string> = { G: 'GALİBİYET', B: 'BERABERLİK', M: 'MAĞLUBİYET' };
const POZ_SIRA: Record<string, number> = { Kaleci: 1, Defans: 2, 'Orta Saha': 3, Forvet: 4 };
const F = { fontFamily: 'SpaceMono' };

type Onay = { baslik: string; mesaj: string; onOk?: () => void } | null;

const yasRengi = (yas: number) =>
  yas >= 35 ? '#F87171' : yas >= 31 ? Colors.primary : yas <= 23 ? '#4ADE80' : Colors.textMuted;

export default function Lig() {
  const { state, nakitEkle } = useGame();
  const [lig, setLig] = useState<K.KariyerDurum | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mesaj, setMesaj] = useState('');
  const [rapor, setRapor] = useState<K.MacRaporu | null>(null);
  const [raporAcik, setRaporAcik] = useState(false);
  const [sezonModal, setSezonModal] = useState(false);
  const [onayModal, setOnayModal] = useState<Onay>(null);

  const yukle = useCallback(() => {
    K.ligYukle().then((k) => {
      setLig(k);
      setYukleniyor(false);
    });
  }, []);
  useEffect(yukle, [yukle]);
  useFocusEffect(yukle);

  const uygula = (yeni: K.KariyerDurum, nakitDelta: number, m: string) => {
    setLig(yeni);
    K.ligKaydet(yeni);
    if (nakitDelta !== 0) nakitEkle(nakitDelta);
    if (m) setMesaj(m);
  };

  const onay = (baslik: string, mesaj: string, onOk: () => void) => {
    if (typeof Alert.alert === 'function' && (globalThis as any).document == null) {
      Alert.alert(baslik, mesaj, [
        { text: 'İptal', style: 'cancel' },
        { text: 'Tamam', style: 'destructive', onPress: onOk },
      ]);
    } else setOnayModal({ baslik, mesaj, onOk });
  };

  const raporuKapat = () => {
    setRaporAcik(false);
    if (lig?.sezonSonu) setSezonModal(true);
  };

  if (yukleniyor) {
    return (
      <View style={styles.merkez}>
        <Text style={[styles.satirMetin, F]}>Yükleniyor...</Text>
      </View>
    );
  }

  const kasa = state?.nakit ?? 0;

  if (!lig) {
    return (
      <View style={[styles.sarma, { padding: 24, justifyContent: 'center' }]}>
        <Text style={[styles.baslik, F]}>Takım Kariyeri</Text>
        <Text style={[styles.satirMetin, F, { marginTop: 12 }]}>
          {"2. Amatör Küme'den başlıyorsun. Şampiyon ol, Süper Lig'e kadar çık: "}
          {'\n'}2. Amatör → 1. Amatör → Süper Amatör → Bölgesel Amatör → 3. Lig → 2. Lig → 1. Lig → Süper Lig
          {'\n\n'}Ev maçı hasılatı kasaya yazar, transferler kasanı harcar.{'\n'}
          {"İşletme nakit'in: "}
          {para(kasa)}
        </Text>
        <TouchableOpacity
          style={[styles.buton, { marginTop: 22 }]}
          onPress={() => {
            const yeni = K.yeniLig();
            uygula(yeni, 0, `${kademeBul(yeni.seviye).ad} kariyeri başladı!`);
          }}
        >
          <Text style={[styles.butonMetin, F]}>Kariyeri Başlat</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const kademe = kademeBul(lig.seviye);
  const guc = K.takimGucu(lig.kadro);
  const tablo = K.tablola(lig);
  const toplamHafta = lig.fikstur.length;
  const sezonBitti = !!lig.sezonSonu;

  const macOyna = () => {
    if (!lig || lig.sezonSonu) return;
    const r = K.haftaOyna(lig);
    uygula(r.state, r.nakitDelta, '');
    setRapor(r.rapor);
    setRaporAcik(true);
  };

  const oyuncuAlBas = (id: string) => {
    const r = K.oyuncuAl(lig, id);
    uygula(r.state, r.nakitDelta, r.mesaj);
  };

  const oyuncuSatBas = (o: K.Oyuncu) =>
    onay('Oyuncu Satışı', `${o.ad} satılsın mı? (Değerinin %60'ı)`, () => {
      const r = K.oyuncuSat(lig, o.id);
      uygula(r.state, r.nakitDelta, r.mesaj);
    });

  const sezonDevam = () => {
    const r = K.yeniSezonBaslat(lig);
    uygula(r.state, 0, r.mesaj);
    setSezonModal(false);
  };

  const kadro = [...lig.kadro].sort(
    (a, b) => (POZ_SIRA[a.pozisyon] ?? 9) - (POZ_SIRA[b.pozisyon] ?? 9) || b.guc - a.guc,
  );

  return (
    <View style={styles.sarma}>
      <ScrollView contentContainerStyle={styles.icerik}>
        {mesaj !== '' && (
          <TouchableOpacity style={styles.mesajKutu} onPress={() => setMesaj('')}>
            <Text style={[styles.mesajMetin, F]}>{mesaj}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.kart}>
          <Text style={[styles.kademeAd, F]}>{kademe.ad}</Text>
          <Text style={[styles.altMetin, F]}>
            {K.BENIM_TAKIM} · Sezon {lig.sezonNo} · Hafta {Math.min(lig.hafta + (sezonBitti ? 0 : 1), toplamHafta)}/
            {toplamHafta}
          </Text>
          <View style={styles.ucSatir}>
            <View style={styles.ucHucre}>
              <Text style={[styles.ucSayi, F]}>{guc}</Text>
              <Text style={[styles.ucEtiket, F]}>Takım Gücü</Text>
            </View>
            <View style={styles.ucHucre}>
              <Text style={[styles.ucSayi, F]}>{lig.kadro.length}</Text>
              <Text style={[styles.ucEtiket, F]}>Oyuncu</Text>
            </View>
            <View style={styles.ucHucre}>
              <Text style={[styles.ucSayi, F]}>{para(kasa)}</Text>
              <Text style={[styles.ucEtiket, F]}>İşletme Kasası</Text>
            </View>
          </View>
        </View>

        <View style={styles.kart}>
          <Text style={[styles.bolumBaslik, F]}>Puan Durumu</Text>
          <View style={styles.tabloBaslik}>
            <Text style={[styles.hNo, F]}>#</Text>
            <Text style={[styles.hAd, F]}>TAKIM</Text>
            {['O', 'A', 'Y', 'AV', 'P'].map((h) => (
              <Text key={h} style={[styles.hSayi, F]}>
                {h}
              </Text>
            ))}
          </View>
          {tablo.map((s, i) => (
            <View key={s.ad} style={[styles.tabloSatir, s.benim && styles.benimSatir]}>
              <Text style={[styles.hNo, F]}>{i + 1}</Text>
              <Text
                style={[styles.hAd, F, { color: s.benim ? Colors.primary : Colors.textPrimary, fontWeight: s.benim ? 'bold' : 'normal' }]}
                numberOfLines={1}
              >
                {s.ad}
              </Text>
              <Text style={[styles.hSayi, F]}>{s.O}</Text>
              <Text style={[styles.hSayi, F]}>{s.A}</Text>
              <Text style={[styles.hSayi, F]}>{s.Y}</Text>
              <Text style={[styles.hSayi, F]}>{s.AV > 0 ? '+' + s.AV : s.AV}</Text>
              <Text style={[styles.hSayi, F, { color: Colors.textPrimary }]}>{s.P}</Text>
            </View>
          ))}
          {kademe.yukselen > 0 && <Text style={[styles.ipucu, F]}>Şampiyon üst lige çıkar</Text>}
          {kademe.dussen > 0 && <Text style={[styles.ipucu, F]}>Son {kademe.dussen} takım küme düşer</Text>}
        </View>

        <TouchableOpacity style={[styles.buton, sezonBitti && styles.butonPasif]} onPress={macOyna} disabled={sezonBitti}>
          <Text style={[styles.butonMetin, F]}>{sezonBitti ? 'Sezon Bitti' : `${lig.hafta + 1}. Hafta Maçını Oyna`}</Text>
        </TouchableOpacity>
        {sezonBitti && !sezonModal && (
          <TouchableOpacity style={styles.buton} onPress={() => setSezonModal(true)}>
            <Text style={[styles.butonMetin, F]}>Sezon Özeti</Text>
          </TouchableOpacity>
        )}

        {lig.raporlar.length > 0 && (
          <View style={styles.kart}>
            <Text style={[styles.bolumBaslik, F]}>Son Maçlar</Text>
            {lig.raporlar.slice(0, 4).map((r, i) => (
              <View key={i} style={styles.raporSatir}>
                <Text style={[styles.raporSkor, F, { color: SONUC_RENK[r.sonuc] }]}>
                  {r.skorumuz}-{r.skorrakip}
                </Text>
                <Text style={[styles.raporMetin, F]} numberOfLines={1}>
                  Hafta {r.hafta} · {r.rakip} · {SONUC_YAZI[r.sonuc]}
                </Text>
                <Text style={[styles.raporHasilat, F]}>{r.hasilat > 0 ? '+' + para(r.hasilat) : '—'}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.kart}>
          <Text style={[styles.bolumBaslik, F]}>Kadro ({lig.kadro.length}/18)</Text>
          {kadro.map((o) => (
            <View key={o.id} style={styles.oyuncuSatir}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.oyuncuAd, F]}>{o.ad}</Text>
                <Text style={[styles.oyuncuAlt, F, { color: yasRengi(o.yas) }]}>
                  {o.yas <= 20 ? '★ ' : ''}
                  {o.pozisyon} · {o.yas} yaş · Güç {o.guc}
                </Text>
              </View>
              <Text style={[styles.oyuncuDeger, F]}>{para(o.deger)}</Text>
              <TouchableOpacity
                style={[styles.miniButon, styles.miniKirmizi, lig.kadro.length <= 11 && styles.butonPasif]}
                onPress={() => oyuncuSatBas(o)}
                disabled={lig.kadro.length <= 11}
              >
                <Text style={[styles.miniButonMetin, F]}>Sat</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.kart}>
          <Text style={[styles.bolumBaslik, F]}>Transfer Listesi</Text>
          <Text style={[styles.ipucu, F]}>Her hafta yenilenir · Bonservis tavanı: {para(kademe.bonservisTavan)}</Text>
          {lig.transferList.map((o) => {
            const dolu = lig.kadro.length >= 18;
            const paraYok = kasa < o.deger;
            const pasif = dolu || paraYok;
            return (
              <View key={o.id} style={styles.oyuncuSatir}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.oyuncuAd, F]}>{o.ad}</Text>
                  <Text style={[styles.oyuncuAlt, F, { color: yasRengi(o.yas) }]}>
                    {o.yas <= 20 ? '★ ' : ''}
                    {o.pozisyon} · {o.yas} yaş · Güç {o.guc}
                  </Text>
                </View>
                <Text style={[styles.oyuncuDeger, F]}>{para(o.deger)}</Text>
                <TouchableOpacity
                  style={[styles.miniButon, styles.miniYesil, pasif && styles.butonPasif]}
                  onPress={() => oyuncuAlBas(o.id)}
                  disabled={pasif}
                >
                  <Text style={[styles.miniButonMetin, F]}>{dolu ? 'Dolu' : paraYok ? 'Para Yok' : 'Al'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.sifirla}
          onPress={() =>
            onay('Kariyeri Sıfırla', 'Lig ve takım kaydı tamamen silinecek. Bu işlem geri alınamaz!', () => {
              K.ligSifirla();
              setLig(null);
              setMesaj('');
            })
          }
        >
          <Text style={[styles.sifirlaMetin, F]}>Kariyeri Sıfırla</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Web için onay penceresi */}
      <Modal visible={!!onayModal} transparent animationType="fade" onRequestClose={() => setOnayModal(null)}>
        <View style={styles.modalArka}>
          <View style={styles.modalKutu}>
            <Text style={[styles.modalBaslik, F]}>{onayModal?.baslik}</Text>
            <Text style={[styles.modalMetin, F]}>{onayModal?.mesaj}</Text>
            <TouchableOpacity
              style={styles.modalButon}
              onPress={() => {
                const f = onayModal?.onOk;
                setOnayModal(null);
                f?.();
              }}
            >
              <Text style={{ color: Colors.surface, fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>Tamam</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: Colors.card, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 }}
              onPress={() => setOnayModal(null)}
            >
              <Text style={{ color: Colors.textPrimary, fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Maç raporu */}
      <Modal visible={raporAcik} transparent animationType="fade" onRequestClose={raporuKapat}>
        <View style={styles.modalArka}>
          <View style={styles.modalKutu}>
            {rapor && (
              <>
                <Text style={[styles.modalBaslik, F]}>{SONUC_YAZI[rapor.sonuc]}</Text>
                <Text style={[styles.modalSkor, F, { color: SONUC_RENK[rapor.sonuc] }]}>
                  {K.BENIM_TAKIM} {rapor.skorumuz} - {rapor.skorrakip} {rapor.rakip}
                </Text>
                {rapor.hasilat > 0 && (
                  <Text style={[styles.modalMetin, F]}>Ev maçı hasılatı: +{para(rapor.hasilat)}</Text>
                )}
              </>
            )}
            <TouchableOpacity style={styles.modalButon} onPress={raporuKapat}>
              <Text style={[styles.butonMetin, F]}>{lig.sezonSonu ? 'Sezon Sonu' : 'Devam'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sezon sonu */}
      <Modal visible={sezonModal} transparent animationType="fade" onRequestClose={() => setSezonModal(false)}>
        <View style={styles.modalArka}>
          <View style={styles.modalKutu}>
            <Text style={[styles.modalBaslik, F]}>Sezon {lig.sezonNo} Bitti</Text>
            <Text style={[styles.modalMetin, F]}>{lig.sezonSonu?.mesaj ?? ''}</Text>
            <Text style={[styles.modalMetin, F]}>
              Sıralama: {lig.sezonSonu?.konum}. · Ödül: {para(lig.sezonSonu?.odul ?? 0)}
            </Text>
            <TouchableOpacity style={styles.modalButon} onPress={sezonDevam}>
              <Text style={[styles.butonMetin, F]}>Yeni Sezona Geç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sarma: { flex: 1, backgroundColor: Colors.background },
  icerik: { padding: 14, paddingBottom: 40 },
  merkez: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  baslik: { color: Colors.primary, fontSize: 22, fontWeight: 'bold' },
  kademeAd: { color: Colors.primary, fontSize: 19, fontWeight: 'bold' },
  altMetin: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  satirMetin: { color: Colors.textPrimary, fontSize: 13, lineHeight: 20 },
  mesajKutu: { backgroundColor: '#14532D', borderRadius: 10, padding: 10, marginBottom: 10 },
  mesajMetin: { color: '#4ADE80', fontSize: 12, fontWeight: 'bold' },
  kart: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.card,
  },
  bolumBaslik: { color: Colors.textPrimary, fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  ipucu: { color: Colors.textMuted, fontSize: 11, marginTop: 6 },
  ucSatir: { flexDirection: 'row', marginTop: 10 },
  ucHucre: { flex: 1, alignItems: 'center' },
  ucSayi: { color: Colors.textPrimary, fontSize: 13, fontWeight: 'bold' },
  ucEtiket: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  tabloBaslik: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderColor: Colors.card },
  tabloSatir: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderColor: Colors.border },
  benimSatir: { backgroundColor: Colors.surfaceLight },
  hNo: { color: Colors.textMuted, fontSize: 11, width: 22 },
  hAd: { color: Colors.textPrimary, fontSize: 11, flex: 1 },
  hSayi: { color: Colors.textSecondary, fontSize: 11, width: 26, textAlign: 'right' },
  raporSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  raporSkor: { color: '#4ADE80', fontSize: 13, fontWeight: 'bold', width: 44 },
  raporMetin: { color: Colors.textSecondary, fontSize: 11, flex: 1 },
  raporHasilat: { color: '#4ADE80', fontSize: 11 },
  oyuncuSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  oyuncuAd: { color: Colors.textPrimary, fontSize: 12, fontWeight: 'bold' },
  oyuncuAlt: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  oyuncuDeger: { color: Colors.primary, fontSize: 11, marginRight: 8 },
  buton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  butonMetin: { color: Colors.background, fontSize: 14, fontWeight: 'bold' },
  butonPasif: { backgroundColor: Colors.border },
  miniButon: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  miniButonMetin: { color: Colors.background, fontSize: 11, fontWeight: 'bold' },
  miniYesil: { backgroundColor: '#4ADE80' },
  miniKirmizi: { backgroundColor: '#F87171' },
  sifirla: { alignItems: 'center', paddingVertical: 10 },
  sifirlaMetin: { color: '#F87171', fontSize: 12 },
  modalArka: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalKutu: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.card,
  },
  modalBaslik: { color: Colors.primary, fontSize: 17, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  modalSkor: { color: Colors.textPrimary, fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  modalMetin: { color: Colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 6, lineHeight: 19 },
  modalButon: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
});
