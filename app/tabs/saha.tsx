// ============================================
// BEŞLİ PATRON — app/tabs/saha.tsx
// Ana ekran: günü bitir, sahalarım, seçili saha yönetimi (inşaat, yükseltme,
// sponsor), yeni saha kataloğu ve gün sonu raporu
// ============================================
import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../context/GameContext';
import { RENK, FONT } from '../../constants/tema';
import * as PC from '../../constants/pitchConfig';
import * as SC from '../../constants/sponsorConfig';
import { sahaGunlukGideri, sahaGunlukPasifGelir, siradakiAsama, type Saha, type GunSonuSonucu } from '../../services/gameLogic';
import Saha2D from '../../components/Saha2D';

const REF_D8 = { RENK, FONT };
const para = (n: number) => `${Math.round(n).toLocaleString('tr-TR')}₺`;

function asamaEtiketi(asama: number): string {
  if (asama <= 0) return '🌱 Arsa Yok';
  if (asama === 1) return '🏠 Arsa Alındı';
  if (asama < 5) return '🚧 İnşaat';
  return '✅ Hizmette';
}
function asamaRengi(asama: number): string {
  if (asama <= 0) return RENK.kilit;
  if (asama === 1) return '#60A5FA';
  if (asama < 5) return RENK.vurgu;
  return RENK.basari;
}

function etkiHesapla(upgrades?: Record<string, number> | null) {
  const e = { fiyat: 0, memnuniyet: 0, talep: 0, pasifGelir: 0, prestij: 0, enerjiIndirimi: 0, havaKoruma: false };
  Object.entries(upgrades ?? {}).forEach(([id, sv]) => {
    const d = PC.PITCH_UPGRADE_CONFIG[id];
    if (!d || !sv) return;
    e.fiyat += (d.fiyatEki ?? 0) * sv;
    e.memnuniyet += (d.memnuniyetEki ?? 0) * sv;
    e.talep += (d.talepEki ?? 0) * sv;
    e.pasifGelir += (d.gunlukGelirEki ?? 0) * sv;
    e.prestij += (d.prestijEki ?? 0) * sv;
    e.enerjiIndirimi += (d.enerjiIndirimi ?? 0) * sv;
    if (d.havaKoruma) e.havaKoruma = true;
  });
  return e;
}

function sponsorKosulSatirlari(s: SC.SponsorTanim, asama: number, ups: Record<string, number>): string[] {
  const satir: string[] = [];
  if (s.kosul.asama != null) satir.push(`${asama >= s.kosul.asama ? '✅' : '⬜'} Ana saha aşama ${s.kosul.asama}`);
  if (s.kosul.upgrade) {
    const d = PC.PITCH_UPGRADE_CONFIG[s.kosul.upgrade.id];
    const sv = ups[s.kosul.upgrade.id] ?? 0;
    satir.push(`${sv >= s.kosul.upgrade.seviye ? '✅' : '⬜'} ${d?.ad ?? s.kosul.upgrade.id} Sv.${s.kosul.upgrade.seviye}`);
  }
  if (satir.length === 0) satir.push('✅ Şart yok');
  return satir;
}

type KartBilgi = {
  id: string;
  ad: string;
  emoji: string;
  sahip: boolean;
  asama: number;
  kalite: number;
  aktifMi: boolean;
  toplamYatirim: number;
  sahaTipi: string;
};

export default function SahaScreen() {
  const { state, buyPitchArsa, insaatIlerlet, pitchUpgradeAl, setActivePitch, imzaSponsor, iptalSponsor, endDay } =
    useGame();
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [mesajHata, setMesajHata] = useState(false);
  const [canli, setCanli] = useState(true);
  const [rapor, setRapor] = useState<(GunSonuSonucu & { sponsorGeliri: number }) | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const panelY = useRef(0);

  if (!state) {
    return (
      <View style={[styles.ekran, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.muted}>Yükleniyor…</Text>
      </View>
    );
  }

  const sahalar = (Object.values(state.pitches ?? {}) as Saha[]).filter(Boolean);
  const aktif: Saha | undefined = state.pitches?.[state.activePitchId ?? 'yildiz'] ?? sahalar[0];
  const sponsorlar: string[] = (state.sponsorlar ?? []).filter(Boolean);
  const anaAsama = state.pitches?.yildiz?.asama ?? 0;
  const anaUps: Record<string, number> = state.upgrades ?? {};

  const yildiz = state.pitches?.yildiz;
  const kartlar: KartBilgi[] = [
    {
      id: 'yildiz',
      ad: PC.YILDIZ_SAHA.ad,
      emoji: PC.SAHA_TIP_BILGI.yildiz.emoji,
      sahip: !!yildiz,
      asama: yildiz?.asama ?? 0,
      kalite: yildiz ? state.sahaKalitesi : 0,
      aktifMi: aktif?.id === 'yildiz',
      toplamYatirim: PC.YILDIZ_SAHA.toplamMaliyet,
      sahaTipi: 'yildiz',
    },
  ];
  PC.PITCH_DEFS.forEach((d) => {
    const p = state.pitches?.[d.id];
    const tip = (PC.SAHA_TIP_BILGI as any)[d.sahaTipi] ?? PC.SAHA_TIP_BILGI.yildiz;
    kartlar.push({
      id: d.id,
      ad: d.ad,
      emoji: tip.emoji,
      sahip: !!p,
      asama: p?.asama ?? 0,
      kalite: p ? p.kalite ?? d.baslangicKalitesi : 0,
      aktifMi: aktif?.id === d.id,
      toplamYatirim: d.arsaBedeli + d.insaatBedeli,
      sahaTipi: d.sahaTipi,
    });
  });
  const sahipOlunan = kartlar.filter((k) => k.sahip).length;
  const katalog = PC.PITCH_DEFS.filter((d) => !state.pitches?.[d.id]);

  const bildir = (hata: string | null | undefined, basari?: string) => {
    if (hata) {
      setMesajHata(true);
      setMesaj(hata);
    } else if (basari) {
      setMesajHata(false);
      setMesaj(basari);
    }
  };

  const aktifYap = (id: string) => {
    setActivePitch(id);
    const k = kartlar.find((x) => x.id === id);
    setMesajHata(false);
    setMesaj(`Aktif saha: ${k?.ad ?? id}`);
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, panelY.current - 10), animated: true }), 60);
  };

  const gunuBitir = () => {
    const sonuc = endDay();
    if (!sonuc) {
      bildir('Gün bitirilemedi — oyun durumu hazır değil.');
      return;
    }
    setRapor({ ...sonuc, sponsorGeliri: SC.toplamSponsorGeliri(sponsorlar) });
  };

  const aktifUps: Record<string, number> = aktif ? (aktif.id === 'yildiz' ? anaUps : aktif.upgrades ?? {}) : {};
  const aktifAsama = aktif?.asama ?? 0;
  const aktifKalite = aktif ? (aktif.id === 'yildiz' ? state.sahaKalitesi : aktif.kalite) : 0;
  const siradaki = aktif ? siradakiAsama(aktif) : null;
  const tumAsamalar = aktif
    ? aktif.id === 'yildiz'
      ? PC.YILDIZ_SAHA.asamalar
      : (() => {
          const d = PC.PITCH_DEFS.find((x) => x.id === aktif.id);
          return d ? PC.insaatAsamalari(d) : [];
        })()
    : [];
  const insaatYuzde = Math.round(((Math.max(1, aktifAsama) - 1) / 4) * 100);
  const etki = etkiHesapla(aktifUps);

  return (
    <View style={styles.ekran}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.icerik} showsVerticalScrollIndicator={false}>
        {mesaj && (
          <TouchableOpacity style={mesajHata ? styles.mesajHata : styles.mesajOk} onPress={() => setMesaj(null)}>
            <Text style={styles.mesajYazi}>{mesaj}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.gunBitirButon} onPress={gunuBitir} activeOpacity={0.85}>
          <Text style={styles.gunBitirYazi}>🌙 GÜNÜ BİTİR — Gün {state.gun}</Text>
          <Text style={styles.gunBitirAlt}>Gelir/gider hesaplanır · Sponsor gelirleri kasaya yatar</Text>
        </TouchableOpacity>

        <Text style={styles.baslik}>
          🏟️ Sahalarım ({sahipOlunan}/{kartlar.length})
        </Text>
        <View style={styles.sahaIzgara}>
          {kartlar.map((k) => (
            <TouchableOpacity
              key={k.id}
              style={[styles.sahaKart, k.aktifMi && styles.sahaKartAktif, !k.sahip && styles.sahaKartKilitli]}
              onPress={() => (k.sahip ? aktifYap(k.id) : bildir(`${k.ad} henüz satın alınmadı — aşağıdaki katalogdan arsa al.`))}
            >
              <View style={styles.sahaKartUst}>
                <Text style={styles.sahaKartEmoji}>{k.sahip ? k.emoji : '🔒'}</Text>
                {k.aktifMi && (
                  <View style={styles.aktifRozet}>
                    <Text style={styles.aktifRozetYazi}>AKTİF</Text>
                  </View>
                )}
              </View>
              <Saha2D mini asama={k.asama} kalite={k.kalite} sahaTipi={k.sahaTipi} canli={false} />
              <Text style={styles.sahaKartAd} numberOfLines={1}>
                {k.ad}
              </Text>
              <Text style={[styles.sahaKartDurum, { color: asamaRengi(k.asama) }]}>
                {k.sahip ? asamaEtiketi(k.asama) : 'Kilitli'}
              </Text>
              {k.sahip && (
                <View style={styles.miniBar}>
                  <View style={[styles.miniBarDolgu, { width: `${Math.max(4, (k.asama / 5) * 100)}%` }]} />
                </View>
              )}
              {k.sahip && k.asama >= 5 ? (
                <Text style={styles.sahaKartAlt}>⭐ {k.kalite}/10 kalite</Text>
              ) : (
                <Text style={styles.sahaKartAlt}>Yatırım: {para(k.toplamYatirim)}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ipucu}>Karta dokun → sahayı aktif yap; yönetim paneli o sahaya döner.</Text>

        {aktif ? (
          <View style={styles.panel} onLayout={(e) => (panelY.current = e.nativeEvent.layout.y)}>
            <View style={styles.panelBaslikSatir}>
              <Text style={styles.panelBaslik} numberOfLines={1}>
                {(PC.SAHA_TIP_BILGI as any)[aktif.sahaTipi]?.emoji ?? '⭐'} {aktif.ad ?? kartlar.find((k) => k.id === aktif.id)?.ad} — Yönetim
              </Text>
              <View style={[styles.durumRozet, { backgroundColor: asamaRengi(aktifAsama) }]}>
                <Text style={styles.durumRozetYazi}>{asamaEtiketi(aktifAsama)}</Text>
              </View>
            </View>

            <Saha2D
              asama={aktifAsama}
              kalite={aktifKalite}
              sahaTipi={aktif.sahaTipi}
              canli={canli}
              upgrades={aktifUps}
              sponsorlar={aktif.id === 'yildiz' ? sponsorlar : []}
            />
            <View style={styles.canliSatir}>
              <TouchableOpacity style={styles.canliButon} onPress={() => setCanli((c) => !c)}>
                <Text style={styles.canliButonYazi}>{canli ? '⏸ Duraklat' : '▶️ Maçı İzle'}</Text>
              </TouchableOpacity>
              <Text style={styles.canliBilgi}>
                {aktifAsama < 5 ? 'Maç, hizmette olan sahalarda oynanır.' : canli ? 'Oyuncular sahada — canlı maç!' : 'Maç duraklatıldı.'}
              </Text>
            </View>

            {Object.entries(aktifUps).some(([, sv]) => sv > 0) && (
              <View style={styles.rozetSatir}>
                {Object.entries(aktifUps)
                  .filter(([id, sv]) => sv > 0 && PC.PITCH_UPGRADE_CONFIG[id])
                  .map(([id, sv]) => {
                    const d = PC.PITCH_UPGRADE_CONFIG[id];
                    return (
                      <View key={id} style={styles.rozet}>
                        <Text style={styles.rozetYazi}>
                          {d.emoji} {sv}/{d.maksSeviye}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            )}

            <View style={styles.istatistikSatiri}>
              <View style={styles.istatistikKutu}>
                <Text style={styles.istatistikDeger}>{aktifAsama >= 5 ? `${aktifKalite}/10` : '—'}</Text>
                <Text style={styles.istatistikEtiket}>Kalite</Text>
              </View>
              <View style={styles.istatistikKutu}>
                <Text style={styles.istatistikDeger}>{para(sahaGunlukGideri(aktif))}</Text>
                <Text style={styles.istatistikEtiket}>Günlük Gider</Text>
              </View>
              <View style={styles.istatistikKutu}>
                <Text style={styles.istatistikDeger}>
                  {aktifAsama >= 5 ? para(sahaGunlukPasifGelir(aktif, state)) : '—'}
                </Text>
                <Text style={styles.istatistikEtiket}>Pasif Gelir</Text>
              </View>
            </View>

            {aktifAsama < 5 && (
              <View style={styles.kutu}>
                <Text style={styles.kutuBaslik}>🚧 İnşaat — %{insaatYuzde} tamam</Text>
                <View style={styles.bar}>
                  <View style={[styles.barDolgu, { width: `${Math.max(3, insaatYuzde)}%` }]} />
                </View>
                {tumAsamalar.map((a) => (
                  <Text key={a.asama} style={styles.muted}>
                    {aktifAsama >= a.asama ? '✅' : '⬜'} {a.label} — {para(a.cost)} · ⚡{a.enerji}
                  </Text>
                ))}
                {siradaki && (
                  <>
                    <Text style={styles.kutuAltBaslik}>{siradaki.label}</Text>
                    <Text style={styles.muted}>{siradaki.aciklama}</Text>
                    <TouchableOpacity
                      style={state.nakit >= siradaki.cost ? styles.butonYesil : styles.butonPasif}
                      onPress={() => {
                        const hata = insaatIlerlet(aktif.id);
                        bildir(
                          hata,
                          siradaki.asama >= 5
                            ? '🎉 İnşaat tamamlandı — saha artık hizmette!'
                            : 'İnşaat bir aşama ilerledi. 🚧',
                        );
                      }}
                    >
                      <Text style={styles.butonBeyaz}>
                        {state.nakit >= siradaki.cost
                          ? `İnşaatı İlerlet — ${para(siradaki.cost)} (⚡${siradaki.enerji})`
                          : `Nakit yetersiz (${para(siradaki.cost)})`}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {aktifAsama >= 5 && (
              <>
                <View style={styles.etkiKutu}>
                  <Text style={styles.kutuBaslik}>📈 Yükseltme Etkileri</Text>
                  <Text style={styles.muted}>
                    Fiyat +{Math.round(etki.fiyat * 100)}% · Memnuniyet +{etki.memnuniyet} · Prestij +{etki.prestij}
                    {etki.pasifGelir > 0 ? ` · Pasif gelir ${para(etki.pasifGelir)}/gün` : ''}
                    {etki.enerjiIndirimi > 0 ? ` · Enerji -${etki.enerjiIndirimi}` : ''}
                    {etki.havaKoruma ? ' · ❄️ Hava koruması' : ''}
                  </Text>
                </View>

                <Text style={styles.bolumBaslik}>Aktif Saha Yükseltmeleri</Text>
                <View style={styles.yukseltmeIzgara}>
                  {Object.values(PC.PITCH_UPGRADE_CONFIG).map((d) => {
                    const sv = aktifUps[d.id] ?? 0;
                    const maliyet = PC.pitchUpgradeMaliyeti(d, sv);
                    return (
                      <View key={d.id} style={styles.yukseltmeKart}>
                        <Text style={styles.yukseltmeEmoji}>{d.emoji}</Text>
                        <Text style={styles.yukseltmeAd}>{d.ad}</Text>
                        <Text style={styles.yukseltmeSeviye}>
                          Seviye {sv}/{d.maksSeviye}
                        </Text>
                        <Text style={styles.yukseltmeEtki}>{d.etki}</Text>
                        {maliyet == null ? (
                          <View style={[styles.butonKucuk, styles.butonKucukPasif]}>
                            <Text style={styles.butonKucukYazi}>Maks. seviye</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.butonKucuk}
                            onPress={() => bildir(pitchUpgradeAl(aktif.id, d.id), 'Yükseltme tamamlandı! 💪')}
                          >
                            <Text style={styles.butonKucukYazi}>
                              Yükselt — {para(maliyet)} (⚡{d.enerji})
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        ) : (
          <Text style={styles.muted}>Henüz sahan yok. Aşağıdan arsa al!</Text>
        )}

        <View style={styles.kutu}>
          <View style={styles.sponsorBaslikSatir}>
            <Text style={styles.kutuBaslik}>
              💼 Sponsorlar ({sponsorlar.length}/{SC.MAX_SPONSOR})
            </Text>
            <Text style={styles.sponsorGelir}>+{para(SC.toplamSponsorGeliri(sponsorlar))}/gün</Text>
          </View>
          <Text style={styles.muted}>
            Tesis genelinde anlaşma — imzaladığın sponsorlar sahadaki reklam bantlarına yazılır, günlük geliri gün
            sonunda otomatik yatar. Aynı anda en fazla {SC.MAX_SPONSOR} sponsor.
          </Text>
          <View style={styles.sponsorIzgara}>
            {SC.SPONSORLAR.map((s) => {
              const imzali = sponsorlar.includes(s.id);
              const uygun = SC.sponsorUygunMu(s, anaAsama, anaUps);
              const paraVar = state.nakit >= s.onOdeme;
              const dolu = sponsorlar.length >= SC.MAX_SPONSOR;
              return (
                <View
                  key={s.id}
                  style={[styles.sponsorKart, { borderColor: imzali ? s.renk : RENK.cizgi }, !uygun && !imzali && styles.sponsorKartKilitli]}
                >
                  <View style={styles.sponsorSatir}>
                    <View style={[styles.sponsorNokta, { backgroundColor: s.renk }]} />
                    <Text style={styles.sponsorAd} numberOfLines={1}>
                      {s.ad}
                    </Text>
                  </View>
                  <Text style={styles.sponsorAciklama}>{s.aciklama}</Text>
                  <Text style={styles.sponsorPara}>
                    Peşin {para(s.onOdeme)} · Günlük +{para(s.gunlukGelir)}
                  </Text>
                  {sponsorKosulSatirlari(s, anaAsama, anaUps).map((t, i) => (
                    <Text key={i} style={styles.sponsorKosul}>
                      {t}
                    </Text>
                  ))}
                  {imzali ? (
                    <TouchableOpacity
                      style={[styles.sponsorButon, styles.sponsorButonKirmizi]}
                      onPress={() => bildir(iptalSponsor(s.id), 'Anlaşma feshedildi — günlük gelir durdu.')}
                    >
                      <Text style={styles.sponsorButonYazi}>Fesih Et — gelir durur</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.sponsorButon, (!uygun || !paraVar || dolu) && styles.sponsorButonPasif]}
                      disabled={!uygun || !paraVar || dolu}
                      onPress={() =>
                        bildir(
                          imzaSponsor(s.id),
                          'Sponsor imzalandı! 💼 Peşin ödeme kasaya girdi, günlük gelir her gün yatacak.',
                        )
                      }
                    >
                      <Text style={styles.sponsorButonYazi}>
                        {!uygun
                          ? 'Şartlar sağlanmadı'
                          : !paraVar
                            ? `Nakit yetersiz (peşin ${para(s.onOdeme)})`
                            : `İmzala — Peşin ${para(s.onOdeme)}`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.bolumBaslik}>Yatırım: Yeni Saha Kataloğu</Text>
        {katalog.length === 0 && <Text style={styles.muted}>Tüm sahalar açıldı — işletme tam kapasitede! 🏆</Text>}
        {katalog.map((d) => {
          const tip = (PC.SAHA_TIP_BILGI as any)[d.sahaTipi] ?? PC.SAHA_TIP_BILGI.yildiz;
          const yeter = state.nakit >= d.arsaBedeli;
          return (
            <View key={d.id} style={[styles.katalogKart, { borderColor: tip.renk + '55' }]}>
              <View style={styles.katalogBaslikSatir}>
                <Text style={styles.katalogAd}>
                  {tip.emoji} {d.ad}
                </Text>
                <Text style={styles.katalogFiyat}>{para(d.arsaBedeli)}</Text>
              </View>
              <Saha2D mini asama={5} kalite={d.baslangicKalitesi} sahaTipi={d.sahaTipi} canli={false} />
              <Text style={styles.muted}>{d.aciklama}</Text>
              <Text style={styles.katalogDetay}>
                ⭐ Başlangıç kalitesi {d.baslangicKalitesi}/10 · Kapasite {d.kapasite} kişi · Günlük gider{' '}
                {para(d.gunlukGider)}
              </Text>
              <Text style={styles.katalogDetay}>
                Yatırım: arsa {para(d.arsaBedeli)} + inşaat {para(d.insaatBedeli)} ={' '}
                <Text style={styles.sari}>{para(d.arsaBedeli + d.insaatBedeli)}</Text>
              </Text>
              <TouchableOpacity
                style={yeter ? styles.butonYesil : styles.butonPasif}
                disabled={!yeter}
                onPress={() => {
                  const hata = buyPitchArsa(d.id);
                  bildir(hata, `${d.ad} arsası alındı! Şimdi inşaatı ilerlet — karta dokunup sahayı aktif et.`);
                }}
              >
                <Text style={styles.butonBeyaz}>
                  {yeter ? `Arsayı Al — ${para(d.arsaBedeli)}` : `Nakit yetersiz (${para(d.arsaBedeli)})`}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={!!rapor} transparent animationType="fade" onRequestClose={() => setRapor(null)}>
        <View style={styles.modalKaplama}>
          <View style={styles.modalKutu}>
            {rapor && (
              <>
                <Text style={styles.modalBaslik}>🌙 Gün {rapor.gun} Bitti!</Text>
                {rapor.isGameOver && <Text style={styles.modalIflos}>💀 İFLAS ETTİN!</Text>}
                <RaporSatir etiket="💵 Toplam Gelir" deger={`+${para(rapor.gelir)}`} renk={RENK.basari} />
                <RaporSatir etiket="🏟️ Saha Geliri" deger={para(rapor.sahaGelir)} soluk />
                <RaporSatir etiket="🧾 Toplam Gider (kira, elektrik, bakım)" deger={`-${para(rapor.gider)}`} renk={RENK.hata} />
                <RaporSatir etiket="👥 Personel Maaşı (giderin içinde)" deger={para(rapor.personelMaas)} soluk />
                <RaporSatir etiket="💼 Sponsor Geliri (kasaya yattı)" deger={`+${para(rapor.sponsorGeliri)}`} renk={RENK.basari} />
                {rapor.gorevOdul > 0 && <RaporSatir etiket="🎁 Görev Ödülü" deger={`+${para(rapor.gorevOdul)}`} renk={RENK.basari} />}
                {rapor.jetonOdul > 0 && <RaporSatir etiket="🎟️ Jeton Ödülü" deger={`+${rapor.jetonOdul} jeton`} renk={RENK.basari} />}
                <View style={styles.modalAyirici} />
                <RaporSatir
                  etiket="📊 Net Kâr / Zarar"
                  deger={`${rapor.net >= 0 ? '+' : ''}${para(rapor.net)}`}
                  renk={rapor.net >= 0 ? RENK.basari : RENK.hata}
                />
                <View style={styles.modalSatir}>
                  <Text style={styles.modalEtiket}>💰 Kasadaki Para</Text>
                  <Text style={styles.modalKasa}>{para(rapor.nakit + rapor.sponsorGeliri)}</Text>
                </View>
                <RaporSatir etiket="😊 Memnuniyet" deger={`%${rapor.yeniMemnuniyet}`} renk={RENK.yazi} />
                {rapor.sadikKazanci > 0 && (
                  <RaporSatir etiket="❤️ Sadık Müşteri" deger={`+${rapor.sadikKazanci}`} renk={RENK.basari} />
                )}
                {rapor.isGameOver && (
                  <Text style={styles.modalIflosNot}>
                    Nakit eksiye düştü ve iflas limiti aşıldı. Ana ekrandan oyunu sıfırlayıp yeniden başlayabilirsin.
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.modalKapat}
                  onPress={() => {
                    const bitti = rapor.isGameOver;
                    setRapor(null);
                    if (bitti) router.replace('/gameover');
                  }}
                >
                  <Text style={styles.modalKapatYazi}>☀️ Yeni Güne Başla</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RaporSatir({ etiket, deger, renk, soluk }: { etiket: string; deger: string; renk?: string; soluk?: boolean }) {
  return (
    <View style={styles.modalSatir}>
      <Text style={styles.modalEtiket}>{etiket}</Text>
      <Text style={soluk ? styles.modalSoluk : [styles.modalDeger, { color: renk ?? RENK.yazi }]}>{deger}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: REF_D8.RENK.arkaPlan },
  icerik: { padding: 14, paddingBottom: 48, gap: 12 },
  sari: { color: REF_D8.RENK.vurgu, fontSize: 14, fontFamily: REF_D8.FONT.vurgu },
  muted: { color: REF_D8.RENK.yaziSoluk, fontSize: 12, lineHeight: 17, fontFamily: REF_D8.FONT.govde },
  baslik: { color: REF_D8.RENK.yazi, fontSize: 20, fontFamily: REF_D8.FONT.baslik, marginTop: 4 },
  bolumBaslik: { color: REF_D8.RENK.yaziAcik, fontSize: 14, fontFamily: REF_D8.FONT.baslik, marginTop: 6 },
  ipucu: { color: REF_D8.RENK.yaziMat, fontSize: 11, fontStyle: 'italic', fontFamily: REF_D8.FONT.govde },
  gunBitirButon: {
    backgroundColor: REF_D8.RENK.vurgu,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  gunBitirYazi: { color: REF_D8.RENK.arkaPlan, fontSize: 16, fontFamily: REF_D8.FONT.buyuk },
  gunBitirAlt: {
    color: REF_D8.RENK.arkaPlan,
    opacity: 0.8,
    fontSize: 10,
    fontFamily: REF_D8.FONT.govde,
    marginTop: 2,
  },
  modalKaplama: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalKutu: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: REF_D8.RENK.panel,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: REF_D8.RENK.vurgu,
    padding: 16,
    gap: 6,
  },
  modalBaslik: {
    color: REF_D8.RENK.yazi,
    fontSize: 18,
    fontFamily: REF_D8.FONT.baslik,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalIflos: {
    color: REF_D8.RENK.hata,
    fontSize: 18,
    fontFamily: REF_D8.FONT.baslik,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalIflosNot: {
    color: REF_D8.RENK.hata,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: REF_D8.FONT.govde,
    marginTop: 4,
    textAlign: 'center',
  },
  modalSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  modalEtiket: {
    color: REF_D8.RENK.yaziAcik,
    fontSize: 12,
    fontFamily: REF_D8.FONT.govde,
    flex: 1,
    marginRight: 8,
  },
  modalDeger: { fontSize: 12, fontFamily: REF_D8.FONT.baslik },
  modalSoluk: { color: REF_D8.RENK.yaziSoluk, fontSize: 11, fontFamily: REF_D8.FONT.govde },
  modalKasa: { color: REF_D8.RENK.yazi, fontSize: 14, fontFamily: REF_D8.FONT.baslik },
  modalAyirici: { height: 1, backgroundColor: REF_D8.RENK.cizgi, marginVertical: 6 },
  modalKapat: {
    backgroundColor: REF_D8.RENK.basari,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  modalKapatYazi: { color: '#FFFFFF', fontSize: 13, fontFamily: REF_D8.FONT.buyuk },
  mesajOk: {
    backgroundColor: REF_D8.RENK.basariKoyu,
    borderColor: REF_D8.RENK.basari,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  mesajHata: {
    backgroundColor: REF_D8.RENK.hataKoyu,
    borderColor: REF_D8.RENK.hata,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  mesajYazi: { color: REF_D8.RENK.yazi, fontSize: 12, fontFamily: REF_D8.FONT.vurgu },
  sahaIzgara: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  sahaKart: {
    width: '49%',
    backgroundColor: REF_D8.RENK.kart,
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: REF_D8.RENK.cizgi,
    marginBottom: 10,
  },
  sahaKartAktif: { borderColor: REF_D8.RENK.vurgu },
  sahaKartKilitli: { opacity: 0.55 },
  sahaKartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sahaKartEmoji: { fontSize: 22 },
  aktifRozet: { backgroundColor: REF_D8.RENK.vurgu, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  aktifRozetYazi: { color: REF_D8.RENK.arkaPlan, fontSize: 9, fontFamily: REF_D8.FONT.buyuk },
  sahaKartAd: { color: REF_D8.RENK.yazi, fontSize: 13, fontFamily: REF_D8.FONT.baslik, marginTop: 6 },
  sahaKartDurum: { fontSize: 11, fontFamily: REF_D8.FONT.vurgu, marginTop: 2 },
  sahaKartAlt: { color: REF_D8.RENK.yaziSoluk, fontSize: 11, marginTop: 4, fontFamily: REF_D8.FONT.govde },
  miniBar: {
    height: 6,
    backgroundColor: REF_D8.RENK.cizgi,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  miniBarDolgu: { height: 6, backgroundColor: REF_D8.RENK.basari, borderRadius: 3 },
  canliSatir: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  canliButon: { backgroundColor: REF_D8.RENK.vurgu, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  canliButonYazi: { color: REF_D8.RENK.arkaPlan, fontSize: 12, fontFamily: REF_D8.FONT.buyuk },
  canliBilgi: { color: REF_D8.RENK.yaziSoluk, fontSize: 11, flex: 1, fontFamily: REF_D8.FONT.govde },
  rozetSatir: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rozet: {
    backgroundColor: REF_D8.RENK.kart,
    borderColor: REF_D8.RENK.cizgi,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rozetYazi: { color: REF_D8.RENK.yaziAcik, fontSize: 10, fontFamily: REF_D8.FONT.vurgu },
  panel: {
    backgroundColor: REF_D8.RENK.panel,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: REF_D8.RENK.cizgi,
    gap: 10,
  },
  panelBaslikSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelBaslik: { color: REF_D8.RENK.yazi, fontSize: 15, fontFamily: REF_D8.FONT.baslik, flex: 1, marginRight: 8 },
  durumRozet: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  durumRozetYazi: { color: REF_D8.RENK.arkaPlan, fontSize: 10, fontFamily: REF_D8.FONT.buyuk },
  istatistikSatiri: { flexDirection: 'row', gap: 8 },
  istatistikKutu: { flex: 1, backgroundColor: REF_D8.RENK.kart, borderRadius: 10, padding: 8, alignItems: 'center' },
  istatistikDeger: { color: REF_D8.RENK.yazi, fontSize: 12, fontFamily: REF_D8.FONT.baslik },
  istatistikEtiket: { color: REF_D8.RENK.yaziMat, fontSize: 10, marginTop: 2, fontFamily: REF_D8.FONT.govde },
  kutu: { backgroundColor: REF_D8.RENK.kart, borderRadius: 12, padding: 10, gap: 6 },
  kutuBaslik: { color: REF_D8.RENK.yazi, fontSize: 13, fontFamily: REF_D8.FONT.baslik },
  kutuAltBaslik: { color: REF_D8.RENK.vurgu, fontSize: 12, fontFamily: REF_D8.FONT.vurgu },
  etkiKutu: { backgroundColor: REF_D8.RENK.kart, borderRadius: 12, padding: 10, gap: 4 },
  bar: {
    height: 10,
    backgroundColor: REF_D8.RENK.cizgi,
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 4,
  },
  barDolgu: { height: 10, backgroundColor: REF_D8.RENK.basari },
  butonYesil: {
    backgroundColor: REF_D8.RENK.basari,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  butonPasif: {
    backgroundColor: REF_D8.RENK.pasif,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  butonBeyaz: { color: '#FFFFFF', fontSize: 13, fontFamily: REF_D8.FONT.buyuk },
  butonKucuk: {
    backgroundColor: REF_D8.RENK.vurgu,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  butonKucukPasif: { backgroundColor: REF_D8.RENK.pasif },
  butonKucukYazi: { color: REF_D8.RENK.arkaPlan, fontSize: 11, fontFamily: REF_D8.FONT.buyuk },
  yukseltmeIzgara: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  yukseltmeKart: {
    width: '49%',
    backgroundColor: REF_D8.RENK.kart,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: REF_D8.RENK.cizgi,
    marginBottom: 10,
  },
  yukseltmeEmoji: { fontSize: 20 },
  yukseltmeAd: { color: REF_D8.RENK.yazi, fontSize: 12, fontFamily: REF_D8.FONT.vurgu, marginTop: 4 },
  yukseltmeSeviye: { color: REF_D8.RENK.vurgu, fontSize: 11, fontFamily: REF_D8.FONT.vurgu, marginTop: 2 },
  yukseltmeEtki: {
    color: REF_D8.RENK.yaziSoluk,
    fontSize: 11,
    marginTop: 4,
    minHeight: 30,
    fontFamily: REF_D8.FONT.govde,
  },
  anaYukseltmeSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: REF_D8.RENK.cizgi,
  },
  anaYukseltmeBilgi: { flex: 1, marginRight: 8 },
  anaYukseltmeAd: { color: REF_D8.RENK.yazi, fontSize: 12, fontFamily: REF_D8.FONT.vurgu },
  sponsorBaslikSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sponsorGelir: { color: REF_D8.RENK.basari, fontSize: 12, fontFamily: REF_D8.FONT.baslik },
  sponsorIzgara: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  sponsorKart: {
    width: '49%',
    backgroundColor: REF_D8.RENK.panel,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: REF_D8.RENK.cizgi,
    marginBottom: 10,
  },
  sponsorKartKilitli: { opacity: 0.6 },
  sponsorSatir: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sponsorNokta: { width: 10, height: 10, borderRadius: 5 },
  sponsorAd: { color: REF_D8.RENK.yazi, fontSize: 12, fontFamily: REF_D8.FONT.baslik, flex: 1, marginRight: 4 },
  sponsorAciklama: {
    color: REF_D8.RENK.yaziSoluk,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
    fontFamily: REF_D8.FONT.govde,
  },
  sponsorPara: { color: REF_D8.RENK.vurgu, fontSize: 11, fontFamily: REF_D8.FONT.vurgu, marginTop: 4 },
  sponsorKosul: {
    color: REF_D8.RENK.yaziSoluk,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
    fontFamily: REF_D8.FONT.govde,
  },
  sponsorButon: {
    backgroundColor: REF_D8.RENK.basari,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    marginTop: 6,
  },
  sponsorButonKirmizi: { backgroundColor: REF_D8.RENK.hata },
  sponsorButonPasif: { backgroundColor: REF_D8.RENK.pasif },
  sponsorButonYazi: { color: '#FFFFFF', fontSize: 11, fontFamily: REF_D8.FONT.buyuk },
  katalogKart: { backgroundColor: REF_D8.RENK.panel, borderRadius: 14, padding: 12, borderWidth: 1, gap: 6 },
  katalogBaslikSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  katalogAd: { color: REF_D8.RENK.yazi, fontSize: 15, fontFamily: REF_D8.FONT.baslik, flex: 1, marginRight: 8 },
  katalogFiyat: { color: REF_D8.RENK.vurgu, fontSize: 14, fontFamily: REF_D8.FONT.baslik },
  katalogDetay: { color: REF_D8.RENK.yaziSoluk, fontSize: 11, lineHeight: 16, fontFamily: REF_D8.FONT.govde },
});
