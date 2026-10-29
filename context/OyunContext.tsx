// ============================================
// SAHA BİZİM — context/OyunContext.tsx
// Oyun durumunu tutar, saati işletir, kaydeder; ekranlara eylemleri sunar.
// ============================================
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { OyunDurumu, ReklamTuru } from '../engine/tipler';
import * as M from '../engine/motor';
import * as Kayit from '../engine/kayit';
import { odulluGoster, gecisGoster, reklamlariBaslat } from '../services/reklam';
import { TEST_MODU } from '../constants/ayar';

export type Bildirim = { id: number; tur: string; metin: string };

type Deger = {
  s: OyunDurumu | null;
  yukleniyor: boolean;
  bildirimler: Bildirim[];
  /** Motor eylemini uygular; hata/mesaj bildirim olarak gösterilir */
  yap: (f: (s: OyunDurumu) => M.Sonuc | OyunDurumu) => boolean;
  reklamIzle: (tur: ReklamTuru, hedef?: string) => Promise<boolean>;
  gecisReklami: () => Promise<void>;
  bildir: (metin: string, tur?: string) => void;
  bildirimKapat: (id: number) => void;
  sifirla: () => Promise<void>;
  reklamOynuyor: boolean;
};

const Ctx = createContext<Deger | null>(null);
let bildirimSayac = 1;

const sonucMu = (x: any): x is M.Sonuc => !!x && typeof x === 'object' && 's' in x && !('sehirId' in x);

export function OyunProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<OyunDurumu | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [reklamOynuyor, setReklamOynuyor] = useState(false);
  const ref = useRef<OyunDurumu | null>(null);
  ref.current = s;

  const bildir = useCallback((metin: string, tur = 'bilgi') => {
    const id = bildirimSayac++;
    setBildirimler((b) => [...b.slice(-3), { id, tur, metin }]);
    setTimeout(() => setBildirimler((b) => b.filter((x) => x.id !== id)), tur === 'hata' ? 3200 : 2600);
  }, []);
  const bildirimKapat = useCallback((id: number) => setBildirimler((b) => b.filter((x) => x.id !== id)), []);

  // Açılış
  useEffect(() => {
    (async () => {
      let d = await Kayit.yukle();
      if (!d) {
        d = M.yeniOyun(0);
        const hediye = await Kayit.eskiOyuncuHediyesi();
        if (hediye) {
          d = { ...d, nakit: d.nakit + hediye.nakit, itibar: d.itibar + hediye.itibar };
          d.bekleyenOlaylar = [{ tur: 'para', metin: `Beşli Patron oyuncusuna hoş geldin hediyesi: ${M.para(hediye.nakit)}` }];
        }
      } else {
        d = M.cevrimdisiHesapla(d);
      }
      d = M.girisKontrol(d);
      setS(d);
      setYukleniyor(false);
      Kayit.kaydet(d, true);
      reklamlariBaslat();
    })();
  }, []);

  // Saat
  useEffect(() => {
    let son = Date.now();
    const z = setInterval(() => {
      const simdi = Date.now();
      const dt = Math.min(2000, simdi - son);
      son = simdi;
      const mevcut = ref.current;
      if (!mevcut) return;
      const r = M.tick(mevcut, dt, simdi);
      let yeni = r.s;
      if (TEST_MODU && (yeni.nakit < 50_000_000 || yeni.enerji < 100)) yeni = M.TEST.paraDoldur(yeni);
      if (r.degisti || yeni !== r.s) setS(yeni);
    }, 400);
    return () => clearInterval(z);
  }, []);

  // Motorun ürettiği bildirimleri ekrana taşı
  useEffect(() => {
    if (!s || s.bekleyenOlaylar.length === 0) return;
    for (const o of s.bekleyenOlaylar) bildir(o.metin, o.tur);
    if (s.bekleyenOlaylar.some((o) => o.tur === 'para' || o.tur === 'mahalle' || o.tur === 'forma' || o.tur === 'abone')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setS((x) => (x ? M.olaylariTemizle(x) : x));
  }, [s?.bekleyenOlaylar.length]);

  // Kayıt: 5 saniyede bir ve uygulama arka plana geçince
  useEffect(() => {
    const z = setInterval(() => ref.current && Kayit.kaydet(ref.current, true), 5000);
    const abonelik = AppState.addEventListener('change', (durum) => {
      const mevcut = ref.current;
      if (!mevcut) return;
      if (durum === 'background' || durum === 'inactive') {
        const k = M.kapanisKaydet(mevcut);
        ref.current = k;
        setS(k);
        Kayit.kaydet(k, true);
      } else if (durum === 'active') {
        const g = M.girisKontrol(M.cevrimdisiHesapla(mevcut));
        setS(g);
      }
    });
    return () => {
      clearInterval(z);
      abonelik.remove();
    };
  }, []);

  const yap = useCallback(
    (f: (s: OyunDurumu) => M.Sonuc | OyunDurumu) => {
      const mevcut = ref.current;
      if (!mevcut) return false;
      const r = f(mevcut);
      if (sonucMu(r)) {
        if (r.hata) {
          bildir(r.hata, 'hata');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          return false;
        }
        ref.current = r.s;
        setS(r.s);
        if (r.mesaj) bildir(r.mesaj, 'iyi');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        return true;
      }
      ref.current = r;
      setS(r);
      return true;
    },
    [bildir],
  );

  const reklamIzle = useCallback(
    async (tur: ReklamTuru, hedef?: string) => {
      const mevcut = ref.current;
      if (!mevcut) return false;
      if (M.reklamHakki(mevcut, tur) <= 0) {
        bildir('Bugünlük bu ödülün hakkı bitti.', 'hata');
        return false;
      }
      setReklamOynuyor(true);
      const onceDuraklat = mevcut.duraklat;
      setS((x) => (x ? { ...x, duraklat: true } : x));
      const izlendi = await odulluGoster();
      setReklamOynuyor(false);
      const sonra = ref.current ? { ...ref.current, duraklat: onceDuraklat } : null;
      if (!sonra) return false;
      if (!izlendi) {
        setS(sonra);
        bildir('Reklam şu an yüklenemedi, biraz sonra tekrar dene.', 'hata');
        return false;
      }
      const r = M.reklamOdulu(sonra, tur, hedef);
      ref.current = r.s;
      setS(r.s);
      if (r.hata) bildir(r.hata, 'hata');
      else if (r.mesaj) bildir(r.mesaj, 'para');
      Kayit.kaydet(r.s, true);
      return !r.hata;
    },
    [bildir],
  );

  const gecisReklami = useCallback(async () => {
    const mevcut = ref.current;
    if (!mevcut || !M.gecisReklamiGosterilsinMi(mevcut)) return;
    setReklamOynuyor(true);
    await gecisGoster();
    setReklamOynuyor(false);
    if (ref.current) setS(M.gecisReklamiGosterildi(ref.current));
  }, []);

  const sifirla = useCallback(async () => {
    await Kayit.sil();
    const d = M.girisKontrol(M.yeniOyun(0));
    ref.current = d;
    setS(d);
    Kayit.kaydet(d, true);
  }, []);

  const deger = useMemo(
    () => ({ s, yukleniyor, bildirimler, yap, reklamIzle, gecisReklami, bildir, bildirimKapat, sifirla, reklamOynuyor }),
    [s, yukleniyor, bildirimler, yap, reklamIzle, gecisReklami, bildir, bildirimKapat, sifirla, reklamOynuyor],
  );
  return <Ctx.Provider value={deger}>{children}</Ctx.Provider>;
}

export function useOyun() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useOyun, OyunProvider içinde kullanılmalı');
  return c;
}
