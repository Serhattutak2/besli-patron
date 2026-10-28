// ============================================
// BEŞLİ PATRON — app/tabs/isletme.tsx
// İşletme merkezi: memnuniyet, günlük finans, saha bazlı mali tablo,
// yeri satın alma, personel ve günün olayı
// ============================================
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, StyleSheet } from 'react-native';
import { useGame } from '../../context/GameContext';
import { Colors } from '../../constants/colors';
import * as GC from '../../constants/gameConfig';
import { ISLETME_YERI, SAHA_TIP_BILGI } from '../../constants/pitchConfig';
import {
  sahaAdi,
  sahaGunlukGideri,
  sahaGunlukPasifGelir,
  KASIYER_ENERJI_INDIRIMI,
  TEMIZLIKCI_MEMNUNIYET_BONUSU,
  ANTRENOR_TURNUVA_BONUSU,
  GUVENLIK_TEKLIF_BONUSU,
  type Saha,
} from '../../services/gameLogic';

const F = { fontFamily: 'SpaceMono' };
const para = (n: number) => `${Math.round(n).toLocaleString('tr-TR')}₺`;

function asamaEtiketi(asama: number): string {
  if (asama <= 0) return '🌱 Arsa Yok';
  if (asama === 1) return '🏠 Arsa Alındı';
  if (asama < 5) return '🚧 İnşaat';
  return '✅ Hizmette';
}

function staffUcreti(cfg: any, seviye: number): number {
  if (seviye <= 0) return Number(cfg?.levels?.[0]?.maas ?? 0);
  return Number(cfg?.levels?.[seviye]?.maas ?? 0);
}

function toplamPersonelMaas(staff: Record<string, any> | undefined): number {
  let toplam = 0;
  for (const s of Object.values(staff ?? {})) {
    if (!s?.hired || s.level < 1) continue;
    const cfg = (GC.STAFF_CONFIG as any[]).find((c) => c.id === s.id);
    toplam += Number(cfg?.levels?.[s.level - 1]?.maas ?? 0);
  }
  return toplam;
}

function personelEtkiYazisi(id: string, seviye: number): string | null {
  const sv = Math.max(0, Math.min(3, Math.round(seviye ?? 0)));
  if (id === 'temizlikci') {
    const b = TEMIZLIKCI_MEMNUNIYET_BONUSU[sv] ?? 0;
    return b > 0 ? `gün sonunda +${b} memnuniyet` : null;
  }
  if (id === 'kasiyer') {
    const b = KASIYER_ENERJI_INDIRIMI[sv] ?? 0;
    return b > 0 ? `rezervasyonlarda -${b} enerji` : null;
  }
  if (id === 'antrenor') {
    const b = ANTRENOR_TURNUVA_BONUSU[sv] ?? 0;
    return b > 0 ? `turnuvalarda +${b} performans` : null;
  }
  if (id === 'guvenlik') {
    const b = GUVENLIK_TEKLIF_BONUSU[sv] ?? 0;
    return b > 0 ? `gün içinde +${b} ekstra teklif · olay riski -%${10 * sv}` : null;
  }
  return null;
}

const sayi = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function olayEtkiOzeti(etki: any): string {
  if (!etki) return '';
  const p: string[] = [];
  const isaret = (n: number) => (n > 0 ? '+' : '');
  if (etki.sans) p.push(`🎲 %${Math.round(sayi(etki.sans?.yuzde ?? etki.sans) * (etki.sans?.yuzde ? 1 : 100))} şans`);
  if (etki.nakit) p.push(`💰 ${isaret(etki.nakit)}${para(etki.nakit)}`);
  if (etki.memnuniyet) p.push(`😊 ${isaret(etki.memnuniyet)}${etki.memnuniyet}`);
  if (etki.prestij) p.push(`⭐ ${isaret(etki.prestij)}${etki.prestij}`);
  if (etki.enerji) p.push(`⚡ ${isaret(etki.enerji)}${etki.enerji}`);
  if (etki.jeton) p.push(`🪙 ${isaret(etki.jeton)}${etki.jeton}`);
  if (etki.gelirCarpani != null) p.push(`📈 gelir x${sayi(etki.gelirCarpani)}`);
  return p.join(' · ');
}

export default function IsletmeScreen() {
  const { state, hireStaff, buyProperty, cozOlay } = useGame();
  const [toast, setToast] = useState<string | null>(null);
  const [toastHata, setToastHata] = useState(false);
  const [personelOnay, setPersonelOnay] = useState<any>(null);
  const [olaySonuc, setOlaySonuc] = useState<string | null>(null);

  if (!state) {
    return (
      <View style={[styles.ekran, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[styles.sari, F]}>Yükleniyor…</Text>
      </View>
    );
  }

  const bildir = (hata: string | null | undefined, basari?: string) => {
    if (hata) {
      setToastHata(true);
      setToast(hata);
    } else if (basari) {
      setToastHata(false);
      setToast(basari);
    }
  };

  const sahalar = (Object.values(state.pitches ?? {}) as Saha[]).filter(Boolean);
  const acikSahaSayisi = sahalar.filter((p) => (p.asama ?? 0) >= 5).length;
  const bugunGelir = state.bugunGelir ?? 0;
  const personelMaas = toplamPersonelMaas(state.staff);
  const personelSayisi = Object.values(state.staff ?? {}).filter((s: any) => s?.hired).length;
  const kira = state.yerSahibi ? 0 : GC.DAILY_KIRA;
  const satirlar = sahalar.map((p) => {
    const acik = (p.asama ?? 0) >= 5;
    return {
      p,
      acik,
      gider: sahaGunlukGideri(p) ?? 0,
      pasif: acik ? sahaGunlukPasifGelir(p, state) ?? 0 : 0,
    };
  });
  const sahaGider = satirlar.reduce((t, s) => t + s.gider, 0);
  const sahaPasif = satirlar.reduce((t, s) => t + s.pasif, 0);
  const toplamGider = kira + GC.DAILY_ELEKTRIK_SU + personelMaas + sahaGider;
  const net = bugunGelir + sahaPasif - toplamGider;

  const mem = Math.max(0, Math.min(100, state.memnuniyet ?? 50));
  const memRenk = mem >= 70 ? '#34D399' : mem >= 40 ? Colors.primary : '#F87171';
  const yeriAlabilir = (state.nakit ?? 0) >= ISLETME_YERI.satinAlmaFiyat;

  const olay = state.bugunOlayId ? (GC.OLAY_HAVUZU as any[]).find((o) => o.id === state.bugunOlayId) ?? null : null;
  const sonOlaylar = (state.olayGecmisi ?? [])
    .slice(-5)
    .reverse()
    .map((id: string) => (GC.OLAY_HAVUZU as any[]).find((o) => o.id === id))
    .filter(Boolean);

  const korumalar: string[] = [];
  const upVar = (k: string) => sahalar.some((p) => sayi(p.upgrades?.[k]) > 0) || sayi(state.upgrades?.[k]) > 0;
  if (upVar('kamera')) korumalar.push('📹 Kamera: hırsızlık olayı çıkmaz');
  if (upVar('otopark')) korumalar.push('🅿️ Otopark: araç hasarı olayı çıkmaz');
  if (upVar('kantin')) korumalar.push('☕ Kantin: gıda denetimi olayı çıkmaz');
  if (state.staff?.guvenlik?.hired) korumalar.push('🛡️ Güvenlik: olay riski düşük, kavga olayı çıkmaz');

  return (
    <View style={styles.ekran}>
      <ScrollView contentContainerStyle={styles.icerik} showsVerticalScrollIndicator={false}>
        <Text style={[styles.baslik, F]}>🏢 İşletme Merkezi</Text>

        <View style={styles.kart}>
          <View style={styles.durumSatir}>
            <Text style={[styles.durumDeger, F]}>📅 Gün {state.gun}</Text>
            <Text style={[styles.durumDeger, F]}>💰 {para(state.nakit ?? 0)}</Text>
            <Text style={[styles.durumDeger, F]}>⭐ {state.prestij ?? 0}</Text>
            <Text style={[styles.durumDeger, F]}>🏟️ {acikSahaSayisi} açık</Text>
          </View>
          <Text style={[styles.memEtiket, F]}>😊 Müşteri Memnuniyeti — %{Math.round(mem)}</Text>
          <View style={styles.memBarArka}>
            <View style={[styles.memBarOn, { width: `${mem}%`, backgroundColor: memRenk }]} />
          </View>
        </View>

        <View style={styles.kart}>
          <Text style={[styles.bolumBaslik, F]}>💰 Günlük Finans</Text>
          <FinSatir etiket="📈 Rezervasyon geliri (bugün)" deger={`+${para(bugunGelir)}`} yesil />
          <FinSatir etiket="📺 Saha pasif gelirleri" deger={`+${para(sahaPasif)}`} yesil />
          <FinSatir etiket="🏠 Kira" deger={state.yerSahibi ? 'Yok — yer bizim! 🎉' : `-${para(kira)}`} yesil={state.yerSahibi} />
          <FinSatir etiket="💡 Elektrik + Su" deger={`-${para(GC.DAILY_ELEKTRIK_SU)}`} />
          <FinSatir etiket={`👥 Personel maaşları (${personelSayisi} kişi)`} deger={`-${para(personelMaas)}`} />
          <FinSatir etiket={`🏟️ Saha giderleri (${sahalar.length} saha)`} deger={`-${para(sahaGider)}`} />
          <View style={[styles.finSatir, styles.finNet]}>
            <Text style={[styles.netEtiket, F]}>NET (bugün)</Text>
            <Text style={[styles.netDeger, F, { color: net >= 0 ? '#34D399' : '#F87171' }]}>
              {net >= 0 ? '+' : ''}
              {para(net)}
            </Text>
          </View>
        </View>

        <View style={styles.kart}>
          <Text style={[styles.bolumBaslik, F]}>📊 Saha Bazlı Mali Tablo</Text>
          {satirlar.map(({ p, gider, pasif }) => {
            const tip = (SAHA_TIP_BILGI as any)[p.sahaTipi] ?? SAHA_TIP_BILGI.yildiz;
            return (
              <View key={p.id} style={styles.maliSatir}>
                <Text style={styles.maliEmoji}>{tip.emoji}</Text>
                <View style={styles.maliBilgi}>
                  <Text style={[styles.maliAd, F]} numberOfLines={1}>
                    {sahaAdi(p, state)}
                  </Text>
                  <Text style={[styles.maliAlt, F]}>{asamaEtiketi(p.asama ?? 0)}</Text>
                </View>
                <View style={styles.maliSayilar}>
                  <Text style={[styles.maliGider, F]}>-{para(gider)}/gün</Text>
                  {pasif > 0 && <Text style={[styles.maliPasif, F]}>+{para(pasif)} pasif</Text>}
                </View>
              </View>
            );
          })}
          <View style={[styles.maliSatir, styles.maliToplam]}>
            <Text style={[styles.maliToplamYazi, F]}>
              Saha toplamı: -{para(sahaGider)} gider · +{para(sahaPasif)} pasif gelir
            </Text>
          </View>
        </View>

        {!state.yerSahibi ? (
          <View style={styles.kart}>
            <Text style={[styles.bolumBaslik, F]}>🏷️ Sahibinden Satın Al</Text>
            <Text style={[styles.sahibinAciklama, F]}>{ISLETME_YERI.aciklama}</Text>
            <View style={styles.sahibinSatir}>
              <Text style={[styles.sahibinEtiket, F]}>💵 Fiyat</Text>
              <Text style={[styles.sahibinDeger, F]}>{para(ISLETME_YERI.satinAlmaFiyat)}</Text>
            </View>
            <View style={styles.sahibinSatir}>
              <Text style={[styles.sahibinEtiket, F]}>🪙 Ödül</Text>
              <Text style={[styles.sahibinDeger, F]}>+{ISLETME_YERI.prestijOdul} prestij</Text>
            </View>
            <View style={styles.sahibinSatir}>
              <Text style={[styles.sahibinEtiket, F]}>✂️ Kaldırır</Text>
              <Text style={[styles.sahibinDeger, F]}>{para(GC.DAILY_KIRA)}/gün kira</Text>
            </View>
            <Pressable
              style={[styles.buton, { backgroundColor: yeriAlabilir ? Colors.success : Colors.border }]}
              disabled={!yeriAlabilir}
              onPress={() =>
                bildir(buyProperty(), `🏠 Yer artık bizim! Günlük kira kalktı, +${ISLETME_YERI.prestijOdul} prestij.`)
              }
            >
              <Text style={[styles.butonYazi, F]}>
                {yeriAlabilir
                  ? `Yeri Al — ${para(ISLETME_YERI.satinAlmaFiyat)}`
                  : `Nakit yetersiz (${para(ISLETME_YERI.satinAlmaFiyat)})`}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.kart, styles.sahibinKart]}>
            <Text style={[styles.sahibinBaslik, F]}>🏠 Sahamız Artık Bizim!</Text>
            <Text style={[styles.sahibinAciklama, F]}>
              Günlük {para(GC.DAILY_KIRA)} kira tamamen kalktı — artık sadece {para(GC.DAILY_ELEKTRIK_SU)} elektrik-su
              ödüyoruz. +{ISLETME_YERI.prestijOdul} prestij kazandın, bu rozet kalıcı. 🎉
            </Text>
          </View>
        )}

        <View style={styles.kart}>
          <Text style={[styles.bolumBaslik, F]}>👥 Personel</Text>
          <Text style={[styles.personelOzet, F]}>
            {personelSayisi === 0
              ? 'Kadro boş: temizlikçi memnuniyeti yükseltir, kasiyer rezervasyonlarda enerji tasarrufu sağlar. Maaşlar gün sonunda düşer.'
              : `${personelSayisi} kişi görevde · günlük maaş toplamı ${para(personelMaas)} — maaşlar her gün sonunda otomatik düşer. Etkiler seviyeyle ölçeklenir.`}
          </Text>
          {(GC.STAFF_CONFIG as any[]).map((cfg) => {
            const s = state.staff?.[cfg.id] ?? { id: cfg.id, hired: false, level: 0 };
            const seviye = s.hired ? s.level : 0;
            const max = seviye >= (cfg.levels?.length ?? 0);
            const mevcutSeviye = seviye > 0 ? cfg.levels?.[seviye - 1] : null;
            const sonraki = cfg.levels?.[seviye];
            const ucret = staffUcreti(cfg, seviye);
            const etki = personelEtkiYazisi(cfg.id, seviye);
            return (
              <View key={cfg.id} style={styles.upSatiri}>
                <Text style={styles.upEmoji}>{cfg.emoji ?? '🧑‍💼'}</Text>
                <View style={styles.upBilgi}>
                  <Text style={[styles.upAd, F]}>
                    {cfg.ad} <Text style={styles.upSeviye}>L{seviye}</Text>
                  </Text>
                  <Text style={[styles.upAciklama, F]}>{cfg.aciklama}</Text>
                  <Text style={[styles.upAciklama, F]}>
                    {mevcutSeviye ? mevcutSeviye.label : '—'}
                    {sonraki ? ` · Sonraki: ${sonraki.label} (${para(sonraki.maas)}/gün)` : ''}
                  </Text>
                  {s.hired && (
                    <Text style={[styles.personelEtki, F]}>
                      {etki ? `✓ Görevde: ${etki}` : `✓ Aktif: ${mevcutSeviye?.etki ?? 'Aktif'}`}
                    </Text>
                  )}
                </View>
                <Pressable
                  style={[styles.upButon, max && { backgroundColor: Colors.border }]}
                  disabled={max}
                  onPress={() => setPersonelOnay({ cfg, seviye, ucret })}
                >
                  <Text style={[styles.upButonYazi, F]}>
                    {max ? 'MAX' : s.hired ? `Terfi ${para(ucret)}` : `Al ${para(ucret)}`}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={styles.kart}>
          <Text style={[styles.bolumBaslik, F]}>🎲 Olay Durumu</Text>
          {!olay ? (
            <Text style={[styles.olayYazi, F]}>
              ☀️ Bugün sakin bir gün — olay yok. (Olay her gün çıkmaz; güvenlik kademesi çıkma şansını düşürür.)
            </Text>
          ) : (
            <>
              <Text style={[styles.olayBaslik, F]}>
                {olay.emoji} {olay.baslik}
              </Text>
              <Text style={[styles.olayYazi, F]}>{olay.aciklama}</Text>
              {!state.olayCozuldu ? (
                <>
                  <Text style={[styles.olaySoru, F]}>Ne yapıyorsun?</Text>
                  {(olay.secenekler ?? []).map((sec: any, i: number) => (
                    <Pressable
                      key={i}
                      style={styles.olaySecenek}
                      onPress={() => {
                        const hata = cozOlay(i);
                        if (hata) bildir(hata);
                        else setOlaySonuc(sec.sonuc ?? sec.aciklama ?? 'Karar uygulandı.');
                      }}
                    >
                      <Text style={[styles.olaySecenekLabel, F]}>{sec.label}</Text>
                      <Text style={[styles.olaySecenekAciklama, F]}>{sec.aciklama}</Text>
                      {!!olayEtkiOzeti(sec.etki) && (
                        <Text style={[styles.olaySecenekEtki, F]}>{olayEtkiOzeti(sec.etki)}</Text>
                      )}
                    </Pressable>
                  ))}
                </>
              ) : (
                <Text style={[styles.olaySonuc, F]}>
                  {state.olaySonucMesaji ? `📌 ${state.olaySonucMesaji}` : '📌 Bugünün olayı çözüldü.'}
                </Text>
              )}
            </>
          )}
          {korumalar.length > 0 && <Text style={[styles.olayKoruma, F]}>{korumalar.join('\n')}</Text>}
          {sonOlaylar.length > 0 && (
            <>
              <Text style={[styles.olayGecmisBaslik, F]}>Son olaylar:</Text>
              {sonOlaylar.map((o: any, i: number) => (
                <Text key={i} style={[styles.olayGecmisSatir, F]}>
                  {o.emoji} {o.baslik}
                </Text>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      <Modal visible={!!personelOnay} transparent animationType="fade" onRequestClose={() => setPersonelOnay(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalKart}>
            <Text style={[styles.modalBaslik, F]}>
              {personelOnay?.cfg?.emoji} {personelOnay?.cfg?.ad ?? 'Personel'}
            </Text>
            <Text style={[styles.modalYazi, F]}>
              {personelOnay?.seviye > 0 ? 'Terfi' : 'İşe alım'} ücreti {para(personelOnay?.ucret ?? 0)}. Onaylıyor
              musun?
            </Text>
            <View style={styles.modalButonlar}>
              <Pressable style={styles.btnIptal} onPress={() => setPersonelOnay(null)}>
                <Text style={[styles.btnIptalYazi, F]}>Vazgeç</Text>
              </Pressable>
              <Pressable
                style={styles.btnOnay}
                onPress={() => {
                  const id = personelOnay.cfg.id;
                  setPersonelOnay(null);
                  bildir(hireStaff(id), '👥 Personel kadroya eklendi!');
                }}
              >
                <Text style={[styles.btnOnayYazi, F]}>Onayla</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={olaySonuc !== null} transparent animationType="fade" onRequestClose={() => setOlaySonuc(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalKart}>
            <Text style={[styles.modalBaslik, F]}>📌 Olay Sonucu</Text>
            <Text style={[styles.modalSonuc, F]}>Karar uygulandı.</Text>
            <Text style={[styles.modalYazi, F]}>{olaySonuc}</Text>
            <View style={styles.modalButonlar}>
              <Pressable style={styles.btnOnay} onPress={() => setOlaySonuc(null)}>
                <Text style={[styles.btnOnayYazi, F]}>Tamam</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {toast && (
        <Pressable
          style={[styles.toast, { backgroundColor: toastHata ? '#7F1D1D' : '#14532D' }]}
          onPress={() => setToast(null)}
        >
          <Text style={[styles.toastYazi, F]}>{toast}</Text>
          <Text style={styles.toastYazi}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

function FinSatir({ etiket, deger, yesil }: { etiket: string; deger: string; yesil?: boolean }) {
  return (
    <View style={styles.finSatir}>
      <Text style={[styles.finEtiket, F]}>{etiket}</Text>
      <Text style={[yesil ? styles.finYesil : styles.finKirmizi, F]}>{deger}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: Colors.background },
  icerik: { padding: 16, paddingBottom: 90 },
  baslik: { color: '#F8FAFC', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  sari: { color: Colors.primary },
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
  memEtiket: { color: Colors.textMuted, fontSize: 11, marginBottom: 6 },
  memBarArka: { height: 10, backgroundColor: '#0B1220', borderRadius: 999, overflow: 'hidden' },
  memBarOn: { height: '100%', borderRadius: 999 },
  bolumBaslik: { color: '#F8FAFC', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  finSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#0B1220',
  },
  finEtiket: { color: Colors.textMuted, fontSize: 12, flexShrink: 1 },
  finYesil: { color: '#34D399', fontWeight: '800', fontSize: 13 },
  finKirmizi: { color: '#F87171', fontWeight: '800', fontSize: 13 },
  finNet: { borderBottomWidth: 0, marginTop: 4 },
  netEtiket: { color: '#F8FAFC', fontWeight: '800', fontSize: 14 },
  netDeger: { fontWeight: '800', fontSize: 16 },
  maliSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#0B1220',
  },
  maliEmoji: { fontSize: 20 },
  maliBilgi: { flex: 1 },
  maliAd: { color: '#F8FAFC', fontWeight: '700', fontSize: 13 },
  maliAlt: { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  maliSayilar: { alignItems: 'flex-end' },
  maliGider: { color: '#F87171', fontWeight: '700', fontSize: 12 },
  maliPasif: { color: '#34D399', fontWeight: '700', fontSize: 11, marginTop: 2 },
  maliToplam: { borderBottomWidth: 0 },
  maliToplamYazi: { color: Colors.primary, fontWeight: '800', fontSize: 12, flex: 1, textAlign: 'right' },
  sahibinKart: { borderColor: Colors.success, borderWidth: 1.5 },
  sahibinBaslik: { color: '#34D399', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  sahibinAciklama: { color: Colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 8 },
  sahibinSatir: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  sahibinEtiket: { color: Colors.textMuted, fontSize: 12 },
  sahibinDeger: { color: '#E2E8F0', fontWeight: '800', fontSize: 12 },
  buton: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  butonYazi: { color: '#F8FAFC', fontWeight: '800', fontSize: 14 },
  butonKoyu: { color: Colors.background, fontWeight: '800', fontSize: 14 },
  upSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0B1220',
  },
  upEmoji: { fontSize: 22 },
  upBilgi: { flex: 1 },
  upAd: { color: '#F8FAFC', fontWeight: '700', fontSize: 13 },
  upSeviye: { color: Colors.primary, fontWeight: '800', fontSize: 11 },
  upAciklama: { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  personelOzet: { color: Colors.textMuted, fontSize: 11, lineHeight: 16, marginBottom: 6 },
  personelEtki: { color: '#34D399', fontSize: 11, fontWeight: '700', marginTop: 3 },
  upButon: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  upButonYazi: { color: Colors.background, fontWeight: '800', fontSize: 12 },
  turnuvaBekle: {
    backgroundColor: '#0B1220',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  turnuvaBekleYazi: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  olayBaslik: { color: '#F8FAFC', fontWeight: '800', fontSize: 13, marginBottom: 4 },
  olayYazi: { color: Colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 6 },
  olaySoru: { color: '#F8FAFC', fontWeight: '800', fontSize: 12, marginBottom: 6 },
  olaySecenek: {
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  olaySecenekLabel: { color: '#F8FAFC', fontWeight: '800', fontSize: 13 },
  olaySecenekAciklama: { color: Colors.textMuted, fontSize: 11, marginTop: 2, lineHeight: 16 },
  olaySecenekEtki: { color: Colors.primary, fontSize: 11, fontWeight: '700', marginTop: 4 },
  olaySonuc: { color: Colors.primary, fontWeight: '700', fontSize: 12, marginBottom: 4 },
  olayKoruma: { color: '#34D399', fontSize: 11, fontWeight: '600', marginBottom: 6, lineHeight: 16 },
  olayGecmisBaslik: { color: Colors.textMuted, fontSize: 11, fontWeight: '800', marginTop: 4, marginBottom: 2 },
  olayGecmisSatir: { color: Colors.textMuted, fontSize: 11, paddingVertical: 1 },
  ligBaslikSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ligSezonYazi: { color: '#F8FAFC', fontWeight: '800', fontSize: 13 },
  ligSampiyonluk: { color: Colors.primary, fontWeight: '800', fontSize: 11 },
  ligSonMac: { color: Colors.textMuted, fontSize: 11, marginBottom: 6 },
  ligTabloBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ligTh: { color: Colors.textMuted, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  ligThAd: { color: Colors.textMuted, fontSize: 10, fontWeight: '800' },
  ligSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#0B1220',
    borderRadius: 4,
  },
  ligSatirBen: { backgroundColor: 'rgba(245, 158, 11, 0.14)' },
  ligTd: { color: '#CBD5E1', fontSize: 11, textAlign: 'center' },
  ligTdAd: { color: '#E2E8F0', fontSize: 11, fontWeight: '600' },
  ligTdPuan: { color: '#F8FAFC', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  ligSirada: { color: Colors.primary, fontWeight: '700', fontSize: 12, marginTop: 8 },
  ligCikBtn: { alignSelf: 'center', marginTop: 8, paddingVertical: 6, paddingHorizontal: 12 },
  ligCikYazi: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  ligModalSkor: { color: '#F8FAFC', fontSize: 15, fontWeight: '800', marginBottom: 6 },
  ligModalSezon: { color: Colors.primary, fontWeight: '800', fontSize: 12, marginBottom: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalKart: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    width: '100%',
  },
  modalBaslik: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  modalSonuc: { color: Colors.primary, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  modalYazi: { color: Colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  modalButonlar: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  btnIptal: { backgroundColor: Colors.border, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  btnIptalYazi: { color: '#E2E8F0', fontWeight: '700', fontSize: 13 },
  btnOnay: { backgroundColor: Colors.success, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  btnOnayYazi: { color: '#052E16', fontWeight: '800', fontSize: 13 },
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
