// ============================================
// SAHA BİZİM — components/Pencereler.tsx
// Oyunun üstünde açılan pencereler: canlı maç anı, gün sonu, gece bekçisi,
// hikâye, giriş serisi, bildirimler, web deneme reklamı.
// ============================================
import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOyun } from '../context/OyunContext';
import * as M from '../engine/motor';
import * as V from '../engine/veri';
import { R, Y, Buton, Kart, Ela, Cubuk, Rozet } from './ui';
import { denemeReklamDinle } from '../services/reklam';

function Perde({ children, ust }: { children: React.ReactNode; ust?: boolean }) {
  return (
    <View style={[st.perde, ust && { justifyContent: 'flex-start', paddingTop: 90 }]}>
      <View style={st.pencere}>{children}</View>
    </View>
  );
}

// ---------- Canlı maç anı ----------
export function CanliAnPenceresi() {
  const { s, yap } = useOyun();
  const [simdi, setSimdi] = useState(Date.now());
  useEffect(() => {
    if (!s?.canliAn) return;
    const z = setInterval(() => setSimdi(Date.now()), 100);
    return () => clearInterval(z);
  }, [s?.canliAn?.id]);
  if (!s?.canliAn) return null;
  const an = M.anTanim(s)!;
  const kalan = Math.max(0, s.canliAn.bitisZamani - simdi);
  return (
    <Perde>
      <View style={st.satir}>
        <View style={[st.anIkon, { backgroundColor: an.kotu ? R.kirmiziKoyu : '#14532D' }]}>
          <Ionicons name={an.kotu ? 'alert' : 'sparkles'} size={20} color={an.kotu ? '#FCA5A5' : '#86EFAC'} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Y style={{ fontSize: 11, color: R.soluk }}>CANLI · {M.takimAdi(s, s.canliAn.takimId)}</Y>
          <Y s style={{ fontSize: 18 }}>{an.baslik}</Y>
        </View>
      </View>
      <Y style={{ color: R.yazi2, marginTop: 10, lineHeight: 20 }}>{an.metin}</Y>
      <View style={{ marginVertical: 12 }}>
        <Cubuk oran={kalan / 12000} renk={kalan < 4000 ? R.kirmizi : R.turuncu} yukseklik={6} />
        <Y style={{ fontSize: 11, color: R.soluk, marginTop: 4 }}>{Math.ceil(kalan / 1000)} saniye içinde karar ver</Y>
      </View>
      {an.secenekler.map((sc, i) => (
        <Pressable key={i} style={({ pressed }) => [st.secenek, pressed && { backgroundColor: R.kart2 }]} onPress={() => yap((d) => M.anCevapla(d, i))}>
          <Y k style={{ fontSize: 14.5 }}>{sc.yazi}</Y>
          <Y style={{ fontSize: 11.5, color: R.soluk, marginTop: 3 }}>{etkiYazi(sc.etki, M.maliyetCarpan(s))}</Y>
        </Pressable>
      ))}
    </Perde>
  );
}
function etkiYazi(e: V.AnEtki, c: number): string {
  const p: string[] = [];
  if (e.nakit) p.push(`${e.nakit > 0 ? '+' : ''}${M.para(e.nakit * c)}`);
  if (e.sevgi) p.push(`${e.sevgi > 0 ? '+' : ''}${e.sevgi} sevgi`);
  if (e.itibar) p.push(`${e.itibar > 0 ? '+' : ''}${e.itibar} itibar`);
  if (e.kontrol) p.push(`${e.kontrol > 0 ? '+' : ''}${e.kontrol} mahalle`);
  if (e.enerji) p.push(`${e.enerji} enerji`);
  return p.join(' · ') || 'Bakalım ne olacak';
}

// ---------- Gün sonu ----------
export function GunSonuPenceresi() {
  const { s, yap, reklamIzle, gecisReklami } = useOyun();
  if (!s?.gunBitti || !s.sonRapor || s.canliAn) return null;
  const r = s.sonRapor;
  const odul = M.gununYildiziOdulu(s);
  if (s.iflas) {
    return (
      <Perde>
        <Y s style={{ fontSize: 22, color: R.kirmizi, textAlign: 'center' }}>İflas!</Y>
        <Y style={{ color: R.yazi2, textAlign: 'center', marginVertical: 12, lineHeight: 20 }}>
          Kasa günlerdir ekside. {M.sehir(s).karakter.rakip} sevinçten havalara uçtu. Ama efsane yıldızların ve formaların seninle; tesisi yeniden kur.
        </Y>
        <Buton yazi="Yeniden başla" onPress={() => yap((d) => M.iflasSonrasi(d))} />
      </Perde>
    );
  }
  return (
    <Perde>
      <Y s style={{ fontSize: 21, textAlign: 'center' }}>{r.gun}. gün kapandı</Y>
      <Y style={{ color: R.soluk, textAlign: 'center', marginBottom: 10 }}>
        {r.macSayisi} maç oynandı · itibar {r.itibarDegisim >= 0 ? '+' : ''}
        {r.itibarDegisim}
      </Y>
      <Satir e="Maç gelirleri" d={r.gelir - (r.notlar.length ? 0 : 0)} artı />
      {r.cayGeliri > 0 && <Satir e="Çay ocağına biriken" d={r.cayGeliri} artı soluk />}
      <Satir e="Kira" d={-r.kira} />
      <Satir e="Elektrik, su, doğalgaz" d={-r.fatura} />
      {r.maas > 0 && <Satir e="Personel maaşı" d={-r.maas} />}
      {r.sahaGider > 0 && <Satir e="Saha giderleri" d={-r.sahaGider} />}
      {r.krediTaksit > 0 && <Satir e="Kredi taksiti" d={-r.krediTaksit} />}
      <View style={st.ayirici} />
      <Satir e="Net" d={r.net} kalin />
      <Satir e="Kasa" d={s.nakit} kalin notr />
      {r.notlar.map((n, i) => (
        <Y key={i} style={{ fontSize: 12, color: n.includes('ekside') ? R.kirmizi : R.yesil, marginTop: 3 }}>
          {n}
        </Y>
      ))}
      {s.kurtarmaTeklifi && (
        <Kart style={{ marginTop: 10, backgroundColor: R.kirmiziKoyu, borderColor: R.kirmizi }}>
          <Y k>Banka müdürü aradı: "Zor günler geçiyor, yardım edelim."</Y>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Buton tur="reklam" kucuk yazi="Faizsiz kredi" alt={M.para(15000 * M.maliyetCarpan(s))} style={{ flex: 1 }} pasif={M.reklamHakki(s, 'kredi') <= 0} onPress={() => reklamIzle('kredi')} />
            <Buton tur="koyu" kucuk yazi="Faizli kredi" alt="10 gün taksit" style={{ flex: 1 }} onPress={() => yap((d) => M.krediAl(d, false))} />
          </View>
        </Kart>
      )}
      {!s.gununYildiziAlindi && odul > 0 && M.reklamHakki(s, 'gununyildizi') > 0 && (
        <Buton tur="reklam" yazi={`Günün yıldızını duvara as: +${M.para(odul)}`} alt="Kısa bir reklam izle" style={{ marginTop: 12 }} onPress={() => reklamIzle('gununyildizi')} />
      )}
      <Buton
        yazi="Yeni güne başla"
        ikon="sunny"
        style={{ marginTop: 10 }}
        onPress={async () => {
          await gecisReklami();
          yap((d) => M.yeniGun(d));
        }}
      />
    </Perde>
  );
}
function Satir({ e, d, artı, kalin, soluk, notr }: { e: string; d: number; artı?: boolean; kalin?: boolean; soluk?: boolean; notr?: boolean }) {
  const renk = notr ? R.yazi : soluk ? R.soluk : d >= 0 ? R.yesil : R.kirmizi;
  return (
    <View style={[st.satir, { justifyContent: 'space-between', paddingVertical: 3 }]}>
      <Y style={{ color: kalin ? R.yazi : R.yazi2, fontSize: kalin ? 15 : 13.5 }} k={kalin}>
        {e}
      </Y>
      <Y s={kalin} k={!kalin} style={{ color: renk, fontSize: kalin ? 16 : 13.5 }}>
        {d >= 0 && (artı || !notr) ? '+' : ''}
        {M.para(d)}
      </Y>
    </View>
  );
}

// ---------- Gece bekçisi ----------
export function GeceRaporuPenceresi() {
  const { s, yap, reklamIzle } = useOyun();
  if (!s?.geceRaporu || s.bekleyenHikaye.length > 0) return null;
  const g = s.geceRaporu;
  return (
    <Perde>
      <View style={st.satir}>
        <View style={[st.anIkon, { backgroundColor: '#1E293B' }]}>
          <Ionicons name="flashlight" size={20} color={R.sari} />
        </View>
        <Y s style={{ fontSize: 18, marginLeft: 10, flex: 1 }}>{g.bekci}'nın raporu</Y>
      </View>
      <Y style={{ color: R.yazi2, marginVertical: 12, lineHeight: 20 }}>
        "Patron, sen yokken {g.saat} saat boyunca tesisin başındaydım. Çay ocağı ve aboneler kasayı doldurdu."
      </Y>
      {g.cay > 0 && <Satir e="Çay ocağı" d={g.cay} artı />}
      {g.abone > 0 && <Satir e="Aboneler ve aidatlar" d={g.abone} artı />}
      <View style={st.ayirici} />
      <Satir e="Toplam" d={g.toplam} kalin />
      {M.reklamHakki(s, 'gecebekci') > 0 && (
        <Buton tur="reklam" yazi={`Bekçiye çay ısmarla: ${M.para(g.toplam * 2)}`} alt="Reklam izle, kasayı ikiye katla" style={{ marginTop: 12 }} onPress={() => reklamIzle('gecebekci')} />
      )}
      <Buton tur="koyu" yazi={`Topla: ${M.para(g.toplam)}`} style={{ marginTop: 8 }} onPress={() => yap((d) => M.geceRaporuTopla(d, 1))} />
    </Perde>
  );
}

// ---------- Hikâye ----------
export function HikayePenceresi() {
  const { s, yap } = useOyun();
  const [sayfa, setSayfa] = useState(0);
  const anahtar = s?.bekleyenHikaye[0];
  useEffect(() => setSayfa(0), [anahtar]);
  if (!s || !anahtar || s.canliAn || s.gunBitti) return null;
  const h = M.hikayeMetni(s, anahtar);
  if (!h) {
    setTimeout(() => yap((d) => M.hikayeGoruldu(d, anahtar)), 0);
    return null;
  }
  const son = sayfa >= h.satirlar.length - 1;
  return (
    <Perde>
      <View style={{ alignItems: 'center' }}>
        <Ela boyut={78} />
        <Y style={{ color: R.soluk, fontSize: 12, marginTop: 6 }}>Ela</Y>
        <Y s style={{ fontSize: 20, marginTop: 2, textAlign: 'center' }}>{h.baslik}</Y>
      </View>
      <View style={st.hikayeKutu}>
        <Y style={{ fontSize: 15, lineHeight: 22, color: R.yazi }}>{h.satirlar[sayfa]}</Y>
      </View>
      <View style={[st.satir, { justifyContent: 'center', marginBottom: 10 }]}>
        {h.satirlar.map((_, i) => (
          <View key={i} style={[st.nokta, i === sayfa && { backgroundColor: R.turuncu, width: 16 }]} />
        ))}
      </View>
      <Buton yazi={son ? 'Hadi başlayalım' : 'Devam'} onPress={() => (son ? yap((d) => M.hikayeGoruldu(d, anahtar)) : setSayfa(sayfa + 1))} />
    </Perde>
  );
}

// ---------- Giriş serisi ----------
export function SeriPenceresi() {
  const { s, yap, reklamIzle } = useOyun();
  const [kapali, setKapali] = useState(false);
  if (!s || kapali || s.bekleyenHikaye.length > 0 || s.geceRaporu || s.canliAn || s.gunBitti) return null;
  if (s.seriKurtarilabilir) {
    return (
      <Perde>
        <Y s style={{ fontSize: 19, textAlign: 'center' }}>Serin bozulmak üzere!</Y>
        <Y style={{ color: R.yazi2, textAlign: 'center', marginVertical: 10 }}>
          Dün gelmedin. {s.girisSerisi} günlük serini kurtarmak ister misin?
        </Y>
        <Buton tur="reklam" yazi="Seriyi kurtar" alt="Kısa bir reklam izle" onPress={() => reklamIzle('seri')} />
        <Buton tur="cizgi" yazi="Baştan başla" style={{ marginTop: 8 }} onPress={() => yap((d) => M.seriBirak(d))} />
      </Perde>
    );
  }
  if (!M.seriOdulHazir(s)) return null;
  const gun = ((s.girisSerisi - 1) % 7) + 1;
  return (
    <Perde>
      <Y s style={{ fontSize: 19, textAlign: 'center' }}>Günlük ödül</Y>
      <Y style={{ color: R.soluk, textAlign: 'center', marginBottom: 12 }}>{s.girisSerisi}. gündür buradasın</Y>
      <View style={st.seriIzgara}>
        {V.SERI_ODULLERI.map((o, i) => {
          const alindi = i + 1 < gun;
          const bugun = i + 1 === gun;
          return (
            <View key={i} style={[st.seriKutu, bugun && { borderColor: R.turuncu, backgroundColor: '#3A2A0E' }, alindi && { opacity: 0.45 }, i === 6 && { width: '100%' }]}>
              <Y k style={{ fontSize: 11, color: R.soluk }}>{i + 1}. gün</Y>
              <Ionicons name={i === 6 ? 'gift' : alindi ? 'checkmark-circle' : 'cube'} size={20} color={bugun ? R.turuncu : R.yazi2} style={{ marginVertical: 3 }} />
              <Y k style={{ fontSize: 11, textAlign: 'center' }}>{o.yazi}</Y>
            </View>
          );
        })}
      </View>
      <Buton
        yazi="Ödülü al"
        ikon="gift"
        style={{ marginTop: 12 }}
        onPress={() => {
          yap((d) => M.seriOdulAl(d));
          setKapali(true);
        }}
      />
    </Perde>
  );
}

// ---------- Bildirimler ----------
const BILDIRIM_RENK: Record<string, string> = { hata: R.kirmizi, iyi: R.yesil, para: R.sari, mahalle: R.turuncu, forma: R.mavi, abone: R.pembe, kotu: R.kirmizi, an: R.mavi, derbi: R.turuncu, insaat: R.turuncu };
export function Bildirimler() {
  const { bildirimler, bildirimKapat } = useOyun();
  if (bildirimler.length === 0) return null;
  return (
    <View style={st.bildirimKap} pointerEvents="box-none">
      {bildirimler.map((b) => (
        <Pressable key={b.id} onPress={() => bildirimKapat(b.id)} style={[st.bildirim, { borderLeftColor: BILDIRIM_RENK[b.tur] ?? R.mavi }]}>
          <Y k style={{ fontSize: 13 }}>{b.metin}</Y>
        </Pressable>
      ))}
    </View>
  );
}

// ---------- Web: deneme reklamı ----------
export function DenemeReklam() {
  const [aktif, setAktif] = useState<null | { tur: string; bitti: (x: boolean) => void }>(null);
  const [kalan, setKalan] = useState(3);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    denemeReklamDinle((tur: string, bitti: (x: boolean) => void) => {
      setKalan(3);
      setAktif({ tur, bitti });
    });
    return () => denemeReklamDinle(null);
  }, []);
  useEffect(() => {
    if (!aktif) return;
    if (kalan <= 0) return;
    const z = setTimeout(() => setKalan((k) => k - 1), 1000);
    return () => clearTimeout(z);
  }, [aktif, kalan]);
  if (!aktif) return null;
  return (
    <View style={[st.perde, { backgroundColor: '#000000F0' }]}>
      <Rozet yazi={aktif.tur === 'odullu' ? 'ÖDÜLLÜ REKLAM (DENEME)' : 'GEÇİŞ REKLAMI (DENEME)'} renk={R.mor} />
      <Y s style={{ fontSize: 22, marginTop: 14, textAlign: 'center' }}>Burada gerçek reklam oynar</Y>
      <Y style={{ color: R.soluk, marginTop: 6, textAlign: 'center' }}>Telefonda AdMob reklamı çıkar. Web önizlemesinde 3 saniyelik bir taklit gösteriliyor.</Y>
      <Y s style={{ fontSize: 40, color: R.sari, marginVertical: 18 }}>{kalan > 0 ? kalan : '✓'}</Y>
      <Buton
        yazi={kalan > 0 ? 'Bekle…' : 'Kapat ve ödülü al'}
        pasif={kalan > 0}
        onPress={() => {
          const b = aktif.bitti;
          setAktif(null);
          b(true);
        }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  perde: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3,7,18,0.78)', justifyContent: 'center', alignItems: 'center', padding: 18, zIndex: 50 },
  pencere: { width: '100%', maxWidth: 440, backgroundColor: R.panel, borderRadius: 22, padding: 18, borderWidth: 1.5, borderColor: R.cizgi, maxHeight: '92%' },
  satir: { flexDirection: 'row', alignItems: 'center' },
  anIkon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  secenek: { backgroundColor: R.kart, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: R.cizgi },
  ayirici: { height: 1, backgroundColor: R.cizgi, marginVertical: 6 },
  hikayeKutu: { backgroundColor: R.kart, borderRadius: 16, padding: 14, marginVertical: 14, minHeight: 90, justifyContent: 'center' },
  nokta: { width: 7, height: 7, borderRadius: 4, backgroundColor: R.cizgi, marginHorizontal: 3 },
  seriIzgara: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between' },
  seriKutu: { width: '31.5%', backgroundColor: R.kart, borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1.5, borderColor: R.cizgi },
  bildirimKap: { position: 'absolute', top: 104, left: 12, right: 12, zIndex: 40 },
  bildirim: { backgroundColor: '#0F1B30F2', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12, marginBottom: 6, borderLeftWidth: 4, borderWidth: 1, borderColor: R.cizgi },
});
