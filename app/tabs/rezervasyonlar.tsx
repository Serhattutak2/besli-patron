// ============================================
// BEŞLİ PATRON — app/tabs/rezervasyonlar.tsx
// Rezervasyon defteri: günün teklifleri, kabul/ret, kabul edilenler
// ============================================
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../../context/GameContext';
import { Colors } from '../../constants/colors';
import { MAX_ENERJI } from '../../constants/gameConfig';
import { SAHA_TIP_BILGI } from '../../constants/pitchConfig';
import { rezervasyonEnerjiMaliyeti } from '../../services/gameLogic';
import type { Rezervasyon } from '../../services/gameLogic';

const para = (n: number) => `${Math.round(n).toLocaleString('tr-TR')}₺`;

const MUSTERI_GORUNUM: Record<string, { emoji: string; ad: string }> = {
  mahalle: { emoji: '🏘️', ad: 'Mahalle Takımı' },
  ogrenci: { emoji: '🎓', ad: 'Öğrenci Grubu' },
  ofis: { emoji: '💼', ad: 'Ofis Ekibi' },
  amator: { emoji: '⚽', ad: 'Amatör Lig' },
  dogumGunu: { emoji: '🎂', ad: 'Doğum Günü' },
  yas50plus: { emoji: '👴', ad: '50+ Kafalar' },
  kurumsal: { emoji: '🏢', ad: 'Kurumsal Takım' },
};

export default function RezervasyonScreen() {
  const { state, acceptReservation, rejectReservation } = useGame();
  const [toast, setToast] = useState<string | null>(null);
  const [toastHata, setToastHata] = useState(false);
  const [seciliSaha, setSeciliSaha] = useState('hepsi');

  if (!state) {
    return (
      <View style={styles.ekran}>
        <Text style={styles.sari}>Yükleniyor…</Text>
      </View>
    );
  }

  const acikSahalar = Object.values(state.pitches ?? {})
    .filter(Boolean)
    .filter((p) => (p.asama ?? 0) >= 5);
  const bekleyenler = (state.bugunRezervasyonlar ?? []).filter((r) => r?.durum === 'bekliyor');
  const hepsiSecili = seciliSaha === 'hepsi';
  const gorunen = hepsiSecili ? bekleyenler : bekleyenler.filter((r) => (r.sahaId ?? 'yildiz') === seciliSaha);
  const kabuller = state.kabulEdilenler ?? [];
  const bugunGelir = state.bugunGelir ?? 0;

  const bildir = (hata?: string | null, basari?: string) => {
    if (hata) {
      setToastHata(true);
      setToast(hata);
    } else if (basari) {
      setToastHata(false);
      setToast(basari);
    }
  };

  const sahaBilgi = (sahaId?: string) => {
    const id = sahaId ?? 'yildiz';
    const saha = state.pitches?.[id];
    const tip = (SAHA_TIP_BILGI as any)[saha?.sahaTipi ?? 'yildiz'] ?? SAHA_TIP_BILGI.yildiz;
    return { id, ad: saha?.ad ?? 'Yıldız Saha', emoji: tip.emoji, renk: tip.renk };
  };

  const enerjiMaliyeti = (rez: Rezervasyon) => {
    const id = rez.sahaId ?? 'yildiz';
    const saha = state.pitches?.[id];
    const ups = id !== 'yildiz' ? saha?.upgrades ?? {} : state.upgrades ?? {};
    return rezervasyonEnerjiMaliyeti(rez.kisiSayisi ?? 0, state.staff?.kasiyer?.level ?? 0, ups?.turnike ?? 0);
  };

  const kabulEt = (rez: Rezervasyon) => {
    const maliyet = enerjiMaliyeti(rez);
    const hata = acceptReservation(rez.id);
    if (hata) bildir(hata);
    else bildir(null, `🤝 ${rez.musteriAdi} kabul edildi — ${sahaBilgi(rez.sahaId).ad}, ${maliyet} enerji.`);
  };

  const reddet = (rez: Rezervasyon) => {
    rejectReservation(rez.id);
    bildir(null, `🚫 ${rez.musteriAdi} reddedildi.`);
  };

  const enerjiYuzde = Math.max(0, Math.min(100, ((state.enerji ?? 0) / MAX_ENERJI) * 100));

  const toastKutusu =
    toast != null ? (
      <View style={[styles.toast, { backgroundColor: toastHata ? '#7F1D1D' : '#14532D' }]}>
        <Text style={styles.toastYazi}>{toast}</Text>
        <TouchableOpacity onPress={() => setToast(null)}>
          <Text style={styles.toastYazi}>✕</Text>
        </TouchableOpacity>
      </View>
    ) : null;

  if (acikSahalar.length === 0) {
    return (
      <View style={styles.ekran}>
        <ScrollView contentContainerStyle={styles.icerik} showsVerticalScrollIndicator={false}>
          <Text style={styles.baslik}>📞 Rezervasyon Defteri</Text>
          <View style={styles.kart}>
            <Text style={styles.bolumBaslik}>🚧 Açık sahan yok</Text>
            <Text style={styles.aciklama}>
              Teklif alabilmen için en az bir sahanın inşaatı bitmiş olmalı. Saha sekmesinden inşaatı ilerlet — açılan
              saha için burada teklifler akmaya başlar.
            </Text>
          </View>
        </ScrollView>
        {toastKutusu}
      </View>
    );
  }

  return (
    <View style={styles.ekran}>
      <ScrollView contentContainerStyle={styles.icerik} showsVerticalScrollIndicator={false}>
        <Text style={styles.baslik}>📞 Rezervasyon Defteri</Text>

        <View style={styles.kart}>
          <View style={styles.durumSatir}>
            <Text style={styles.durumDeger}>📅 Gün {state.gun ?? 1}</Text>
            <Text style={styles.durumDeger}>
              ⚡ {state.enerji ?? 0}/{MAX_ENERJI}
            </Text>
            <Text style={styles.durumDeger}>💰 {para(state.nakit ?? 0)}</Text>
            <Text style={styles.durumDeger}>📈 {para(bugunGelir)}</Text>
          </View>
          <View style={styles.barArka}>
            <View style={[styles.barOn, { width: `${enerjiYuzde}%` }]} />
          </View>
          <Text style={styles.durumNot}>
            Her kabul ettiğin teklif enerji yakar — grup büyüdükçe maliyet artar; kasiyerin ve sahanın turnike sistemi
            indirim yapar.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seri}>
          <TouchableOpacity
            style={[styles.cip, hepsiSecili && styles.cipSecili]}
            onPress={() => {
              setSeciliSaha('hepsi');
              setToast(null);
            }}
          >
            <Text style={styles.cipEmoji}>🗂️</Text>
            <Text style={styles.cipAd}>Tümü ({bekleyenler.length})</Text>
          </TouchableOpacity>
          {acikSahalar.map((p) => {
            const bilgi = sahaBilgi(p.id);
            const adet = bekleyenler.filter((r) => (r.sahaId ?? 'yildiz') === p.id).length;
            const secili = seciliSaha === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.cip, secili && { borderColor: bilgi.renk, backgroundColor: Colors.card }]}
                onPress={() => {
                  setSeciliSaha(p.id);
                  setToast(null);
                }}
              >
                <Text style={styles.cipEmoji}>{bilgi.emoji}</Text>
                <Text style={styles.cipAd}>{p.ad ?? 'Saha'}</Text>
                <Text style={styles.cipAdet}>{adet}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {gorunen.length !== 0 ? (
          gorunen.map((rez) => {
            const saha = sahaBilgi(rez.sahaId);
            const gorunum = MUSTERI_GORUNUM[rez.musteriTipi] ?? { emoji: '🙂', ad: 'Müşteri' };
            const maliyet = enerjiMaliyeti(rez);
            const yeterli = (state.enerji ?? 0) >= maliyet;
            return (
              <View key={rez.id} style={styles.kart}>
                <View style={styles.kartBas}>
                  <Text style={styles.musteriEmoji}>{gorunum.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.musteriAd}>{rez.musteriAdi}</Text>
                    <Text style={styles.musteriTur}>{gorunum.ad}</Text>
                  </View>
                  <View style={[styles.sahaRozet, { borderColor: saha.renk }]}>
                    <Text style={styles.sahaRozetYazi}>
                      {saha.emoji} {saha.ad}
                    </Text>
                  </View>
                </View>
                <View style={styles.bilgiSatiri}>
                  <Text style={styles.bilgiCip}>⏰ {rez.saatAraligi}</Text>
                  <Text style={[styles.bilgiCip, !yeterli && { color: '#F87171' }]}>⚡ {maliyet} enerji</Text>
                  {(rez as any).sadik ? (
                    <Text style={[styles.bilgiCip, { color: '#F9A8D4' }]}>❤️ Sadık müşteri</Text>
                  ) : null}
                </View>
                <View style={styles.aksiyonSatiri}>
                  <Text style={styles.fiyat}>{para(rez.fiyat ?? 0)}</Text>
                  <View style={styles.butonGrup}>
                    <TouchableOpacity
                      style={styles.btnRed}
                      onPress={() => reddet(rez)}
                      accessibilityRole="button"
                      accessibilityLabel={`${rez.musteriAdi ?? ''} reddet`}
                    >
                      <Text style={styles.btnRedYazi}>❌ Reddet</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnYesil, !yeterli && { backgroundColor: Colors.border }]}
                      disabled={!yeterli}
                      onPress={() => kabulEt(rez)}
                      accessibilityRole="button"
                      accessibilityLabel={`${rez.musteriAdi ?? ''} kabul et`}
                    >
                      <Text style={styles.btnYesilYazi}>{yeterli ? '✅ Kabul Et' : '⚡ Enerji Az'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.kart}>
            <Text style={styles.bos}>
              {bekleyenler.length === 0
                ? '😴 Bugünlük başka teklif yok. Günü bitir, yarın yeni müşteriler gelir.'
                : '📭 Bu saha için bekleyen teklif yok — başka sahayı da kontrol et.'}
            </Text>
          </View>
        )}

        {kabuller.length > 0 ? (
          <View style={styles.kart}>
            <Text style={styles.bolumBaslik}>✅ Bugün Kabul Edilenler ({kabuller.length})</Text>
            {kabuller.map((r) => {
              const saha = sahaBilgi(r.sahaId);
              return (
                <View key={r.id} style={styles.kabulSatiri}>
                  <Text style={styles.kabulSaha}>{saha.emoji}</Text>
                  <Text style={styles.kabulAd} numberOfLines={1}>
                    {r.musteriAdi}
                  </Text>
                  <Text style={styles.kabulSaat}>{r.saatAraligi}</Text>
                  <Text style={styles.kabulFiyat}>{para(r.fiyat ?? 0)}</Text>
                </View>
              );
            })}
            <Text style={styles.kabulToplam}>Toplam {para(bugunGelir)} — gün sonunda kasaya girer.</Text>
          </View>
        ) : null}
      </ScrollView>
      {toastKutusu}
    </View>
  );
}

const styles = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: Colors.background },
  icerik: { padding: 16, paddingBottom: 90 },
  baslik: { color: '#F8FAFC', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  sari: { color: Colors.primary },
  muted: { color: Colors.textMuted, fontSize: 12 },
  kart: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  durumSatir: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  durumDeger: { color: '#F8FAFC', fontWeight: '800', fontSize: 13 },
  durumNot: { color: Colors.textMuted, fontSize: 11, marginTop: 8, lineHeight: 16 },
  barArka: { height: 8, backgroundColor: '#0B1220', borderRadius: 999, overflow: 'hidden' },
  barOn: { height: '100%', backgroundColor: Colors.success },
  seri: { marginBottom: 12 },
  cip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#0B1220',
  },
  cipSecili: { borderColor: Colors.primary, backgroundColor: Colors.card },
  cipEmoji: { fontSize: 18 },
  cipAd: { color: '#F8FAFC', fontWeight: '700', fontSize: 13 },
  cipAdet: { color: Colors.textMuted, fontSize: 10, fontWeight: '600' },
  kartBas: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  musteriEmoji: { fontSize: 28 },
  musteriAd: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  musteriTur: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  sahaRozet: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#0B1220',
  },
  sahaRozetYazi: { color: '#E2E8F0', fontSize: 11, fontWeight: '800' },
  bilgiSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  bilgiCip: {
    color: '#E2E8F0',
    backgroundColor: '#0B1220',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    overflow: 'hidden',
  },
  aksiyonSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#0B1220',
    paddingTop: 10,
  },
  fiyat: { color: '#34D399', fontWeight: '800', fontSize: 18, flex: 1 },
  butonGrup: { flexDirection: 'row', gap: 8 },
  btnRed: { backgroundColor: '#7F1D1D', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  btnRedYazi: { color: '#FCA5A5', fontWeight: '800', fontSize: 13 },
  btnYesil: { backgroundColor: Colors.success, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  btnYesilYazi: { color: '#052E16', fontWeight: '800', fontSize: 13 },
  kabulSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#0B1220',
  },
  kabulSaha: { fontSize: 16 },
  kabulAd: { color: '#F8FAFC', fontWeight: '700', fontSize: 13, flex: 1 },
  kabulSaat: { color: Colors.textMuted, fontSize: 11 },
  kabulFiyat: { color: '#34D399', fontWeight: '800', fontSize: 13 },
  kabulToplam: { color: Colors.primary, fontWeight: '800', fontSize: 12, marginTop: 8 },
  bolumBaslik: { color: '#F8FAFC', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  aciklama: { color: Colors.textMuted, fontSize: 12, lineHeight: 18 },
  bos: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toastYazi: { color: '#F8FAFC', fontWeight: '700', flexShrink: 1, marginRight: 8 },
});
