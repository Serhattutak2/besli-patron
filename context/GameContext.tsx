// ============================================
// BEŞLİ PATRON — context/GameContext.tsx
// Oyunun tüm durumu ve oyuncu eylemleri (rezervasyon, gün sonu, yükseltme, lig...)
// ============================================
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as kariyer from '../services/kariyer';
import * as GL from '../services/gameLogic';
import type { GameState, GunSonuSonucu, Rezervasyon, Saha, TurnuvaSonucu } from '../services/gameLogic';
import { saveGame, loadGame, deleteSave } from '../services/storage';
import * as GC from '../constants/gameConfig';
import * as PC from '../constants/pitchConfig';
import * as SC from '../constants/sponsorConfig';
import * as LM from '../services/ligManager';
import { gunSonuReklamKontrol } from '../services/adManager';
import { sfx } from '../services/soundManager';

// Bakım ücreti ve işletme yerinin satın alma fiyatı
const BAKIM_UCRETI = 500;
export const YER_SAHIBI_FIYAT = PC.ISLETME_YERI.satinAlmaFiyat;

type HataMesaji = string | null | undefined;

export type GameContextValue = {
  state: GameState | null;
  loading: boolean;
  initNewGame: () => Promise<void>;
  loadSavedGame: () => Promise<boolean>;
  acceptReservation: (id: string) => HataMesaji;
  rejectReservation: (id: string) => void;
  endDay: () => GunSonuSonucu | null;
  purchaseUpgrade: (anahtar: string) => HataMesaji;
  doMaintenance: (sahaId?: string) => HataMesaji;
  useJeton: () => HataMesaji;
  manualSave: () => Promise<void>;
  resetGame: () => Promise<void>;
  buyLifeItem: (itemId: string) => HataMesaji;
  upgradeKizArkadas: () => HataMesaji;
  unlockCity: (sehirId: string) => HataMesaji;
  switchCity: (sehirId: string) => HataMesaji;
  hireStaff: (personelId: string) => HataMesaji;
  joinTurnuva: () => { result?: TurnuvaSonucu; error?: string };
  nakitEkle: (miktar: number) => void;
  enerjiEkle: (miktar: number) => void;
  buyProperty: () => HataMesaji;
  devHediye: (nakit?: number, prestij?: number, jeton?: number, enerjiDoldur?: boolean) => void;
  buyYildizArsa: () => HataMesaji;
  buyPitchArsa: (defId: string) => HataMesaji;
  insaatIlerlet: (sahaId: string) => HataMesaji;
  pitchUpgradeAl: (sahaId: string, upgradeId: string) => HataMesaji;
  setActivePitch: (sahaId: string) => void;
  cozOlay: (secenekIndex: number) => HataMesaji;
  imzaSponsor: (sponsorId: string) => HataMesaji;
  iptalSponsor: (sponsorId: string) => HataMesaji;
  ligKatil: () => HataMesaji;
  ligHaftaOyna: () => { result?: LM.LigHaftaSonucu; error?: string };
  ligBirak: () => HataMesaji;
};

function safeNum(v: unknown, varsayilan: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : varsayilan;
}

// Günlük görev ilerletme ('rezervasyon' görevlerinde kişi sayısı kadar ilerler)
function gorevIlerlet(gorevler: GameState['gunlukGorevler'], tip: string, rez?: Rezervasyon) {
  if (!Array.isArray(gorevler)) return [];
  return gorevler.map((g) => {
    if (!g || g.tamamlandi || g.hedefTip !== tip) return g;
    const hedef = safeNum(g.hedef, 1);
    const artis = tip === 'rezervasyon' ? Math.max(1, safeNum(rez?.kisiSayisi, 1)) : 1;
    const yeni = safeNum(g.ilerleme, 0) + artis;
    return { ...g, ilerleme: Math.min(hedef, yeni), tamamlandi: yeni >= hedef };
  });
}

function sahaKalitesiHesapla(upgrades?: Record<string, number>) {
  return Math.min(
    10,
    GC.INITIAL_SAHA_KALITESI + safeNum(upgrades?.bakim, 0) + safeNum(upgrades?.haliYenileme, 0),
  );
}

function rastgeleHava(): string {
  const r = Math.random();
  if (r < 0.5) return 'gunesli';
  if (r < 0.68) return 'yagmurlu';
  if (r < 0.9) return 'ruzgarli';
  return 'karli';
}

// Son 5 olay tekrar gelmez
function rastgeleOlay(gecmis: string[], olasilik = 0.65): string | null {
  if (Math.random() > olasilik) return null;
  const son = new Set(gecmis.slice(-5));
  const adaylar = (GC.OLAY_HAVUZU as any[]).filter((o) => !son.has(o.id));
  if (adaylar.length === 0) return null;
  return adaylar[Math.floor(Math.random() * adaylar.length)].id;
}

function sponsorlarAl(state: GameState): string[] {
  const s = state.sponsorlar;
  return Array.isArray(s) ? s.filter((x: unknown) => typeof x === 'string') : [];
}

function ligAl(state: GameState): LM.LigDurum | null {
  return state.lig ?? null;
}

// Açık her saha için günün rezervasyon tekliflerini kurar
function teklifleriKur(state: GameState): GameState {
  const sahalar: Record<string, Saha> = { ...(state.pitches ?? {}) };
  const tumu: Rezervasyon[] = [];
  for (const p of Object.values(state.pitches ?? {})) {
    if (!p) continue;
    if (safeNum(p.asama, 0) < 5) continue;
    const teklifler =
      p.id !== 'yildiz'
        ? GL.generatePitchReservations(p, state)
        : GL.generateReservations(
            state.sahaKalitesi,
            state.upgrades,
            1 + 0.05 * safeNum(state.upgrades?.sponsor, 0),
            state.staff,
            state.memnuniyet,
          ).map((r) => ({ ...r, sahaId: 'yildiz' }));
    sahalar[p.id] = { ...p, rezervasyonlar: teklifler, kabulEdilenler: [] };
    tumu.push(...teklifler);
  }
  return { ...state, pitches: sahalar, bugunRezervasyonlar: tumu };
}

// Yeni güne hazırlık: hava, olay, teklifler
function gunuHazirla(state: GameState): GameState {
  const guvenlikSeviye = state.staff?.guvenlik?.hired
    ? Math.max(0, Math.min(3, Math.floor(Number(state.staff.guvenlik.level) || 0)))
    : 0;
  const olasilik = Math.max(0.35, 0.65 - 0.1 * guvenlikSeviye);
  const olayId = rastgeleOlay(state.olayGecmisi ?? [], olasilik);
  const gecmis = olayId ? [...(state.olayGecmisi ?? []), olayId].slice(-20) : state.olayGecmisi ?? [];
  return teklifleriKur({
    ...state,
    bugunHava: rastgeleHava(),
    bugunOlayId: olayId,
    olayCozuldu: false,
    olayGelirCarpani: 1,
    olayGecmisi: gecmis,
  });
}

// Çok eski kayıtlarda Yıldız Saha'yı açık hale getirir
function eskiKayitOnar(state: GameState): GameState {
  const y = state.pitches?.yildiz;
  if (y && !y.arsaAlindi && safeNum(state.sahaKalitesi, 0) > 0) {
    const yeni: Saha = {
      ...y,
      arsaAlindi: true,
      asama: 5,
      kalite: safeNum(state.sahaKalitesi, GC.INITIAL_SAHA_KALITESI),
      aktif: true,
    };
    return { ...state, yildizSaha: yeni, pitches: { ...(state.pitches ?? {}), yildiz: yeni } };
  }
  return state;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const gunSonuKilidi = useRef(false);
  const sonBitenGun = useRef(-1);

  const kaydet = useCallback(async (yeni: GameState) => {
    setState(yeni);
    try {
      await saveGame(yeni);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const veri = await loadGame();
        if (veri) {
          let s = eskiKayitOnar(GL.migrateState(veri));
          if ((s.bugunRezervasyonlar ?? []).length === 0) s = teklifleriKur(s);
          setState(s);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const initNewGame = useCallback(async () => {
    const ilk = GL.createInitialState();
    const yildiz: Saha = {
      ...ilk.yildizSaha,
      arsaAlindi: true,
      asama: 5,
      kalite: GC.INITIAL_SAHA_KALITESI,
      aktif: true,
    };
    const hazir: GameState = { ...ilk, yildizSaha: yildiz, pitches: { yildiz: { ...yildiz } } };
    gunSonuKilidi.current = false;
    sonBitenGun.current = -1;
    const s = gunuHazirla(hazir);
    setState(s);
    try {
      await saveGame(s);
    } catch {}
  }, []);

  const loadSavedGame = useCallback(async () => {
    try {
      const veri = await loadGame();
      if (!veri) return false;
      gunSonuKilidi.current = false;
      sonBitenGun.current = -1;
      let s = eskiKayitOnar(GL.migrateState(veri));
      if ((s.bugunRezervasyonlar ?? []).length === 0) s = teklifleriKur(s);
      setState(s);
      return true;
    } catch {
      return false;
    }
  }, []);

  const acceptReservation = useCallback(
    (id: string): HataMesaji => {
      if (!state) return 'Oyun bulunamadı!';
      if (state.isGameOver) return 'Oyun bitti!';
      const rez = (state.bugunRezervasyonlar ?? []).find((r) => r?.id === id);
      if (!rez || rez.durum !== 'bekliyor') return 'Rezervasyon bulunamadı!';
      const sahaId = rez.sahaId ?? 'yildiz';
      const saha = state.pitches?.[sahaId];
      const ups = saha ? saha.upgrades ?? (sahaId === 'yildiz' ? state.upgrades : undefined) : state.upgrades;
      const turnike = safeNum(ups?.turnike, 0);
      const kasiyerSeviye = state.staff?.kasiyer?.hired ? safeNum(state.staff.kasiyer.level, 1) : 0;
      const maliyet = GL.rezervasyonEnerjiMaliyeti(rez.kisiSayisi, kasiyerSeviye, turnike);
      if (state.enerji < maliyet) return `Enerjin yetmiyor! (${maliyet} enerji gerekli)`;

      const esik = safeNum(GC.MEMNUNIYET_CONFIG?.sadikMusteriEsik, 80);
      const kabul = { ...rez, durum: 'kabul', sadik: (state.memnuniyet ?? 50) >= esik };
      const rezler = (state.bugunRezervasyonlar ?? []).map((r) => (r.id === id ? kabul : r));
      const kabuller = [...(state.kabulEdilenler ?? []), kabul];
      let sahalar = state.pitches;
      if (state.pitches?.[sahaId]) {
        sahalar = {
          ...state.pitches,
          [sahaId]: {
            ...state.pitches[sahaId],
            kabulEdilenler: [...(state.pitches[sahaId].kabulEdilenler ?? []), kabul],
          },
        };
      }
      kaydet({
        ...state,
        enerji: state.enerji - maliyet,
        bugunGelir: safeNum(state.bugunGelir, 0) + safeNum(rez.fiyat, 0),
        bugunRezervasyonlar: rezler,
        kabulEdilenler: kabuller,
        pitches: sahalar,
        gunlukGorevler: gorevIlerlet(state.gunlukGorevler, 'rezervasyon', rez),
      });
      sfx('para');
      return undefined;
    },
    [state, kaydet],
  );

  const rejectReservation = useCallback(
    (id: string) => {
      if (!state) return;
      const rez = (state.bugunRezervasyonlar ?? []).find((r) => r?.id === id);
      if (!rez || rez.durum !== 'bekliyor') return;
      const ceza = safeNum((GC.MEMNUNIYET_CONFIG as any)?.redMemnuniyetCezasi, 5);
      kaydet({
        ...state,
        memnuniyet: Math.max(0, safeNum(state.memnuniyet, 50) - ceza),
        bugunRezervasyonlar: (state.bugunRezervasyonlar ?? []).map((r) =>
          r.id === id ? { ...r, durum: 'red' } : r,
        ),
      });
    },
    [state, kaydet],
  );

  const endDay = useCallback((): GunSonuSonucu | null => {
    if (!state) return null;
    if (state.isGameOver) return null;
    if (gunSonuKilidi.current) return null;
    if (sonBitenGun.current === state.gun) return null;
    gunSonuKilidi.current = true;
    sonBitenGun.current = state.gun;
    setTimeout(() => {
      gunSonuKilidi.current = false;
    }, 0);

    const sponsorlar = sponsorlarAl(state);
    const gorevler = (state.gunlukGorevler ?? []).map((g) => {
      if (!g || g.tamamlandi || g.hedefTip !== 'gelir') return g;
      if (safeNum(state.bugunGelir, 0) >= safeNum(g.hedef, 1)) return { ...g, ilerleme: g.hedef, tamamlandi: true };
      return g;
    });
    const { newState, result } = GL.processEndDay({ ...state, gunlukGorevler: gorevler });
    const sponsorGeliri = SC.toplamSponsorGeliri(sponsorlar);
    const yeni = gunuHazirla({ ...newState, nakit: safeNum(newState.nakit, 0) + sponsorGeliri, sponsorlar });
    kaydet(yeni);
    sfx('para');
    setTimeout(() => {
      try {
        gunSonuReklamKontrol();
      } catch {}
    }, 350);
    return result;
  }, [state, kaydet]);

  // Eski tip (şehir geneli) yükseltme
  const purchaseUpgrade = useCallback(
    (anahtar: string): HataMesaji => {
      if (!state) return 'Oyun bulunamadı!';
      const cfg: any = (GC.UPGRADE_CONFIG as any)[anahtar];
      if (!cfg) return 'Yükseltme bulunamadı!';
      const seviye = safeNum(state.upgrades?.[anahtar], 0);
      const maks = safeNum(cfg.maxLevel ?? cfg.costs?.length ?? 0, 0);
      if (seviye >= maks) return 'Bu yükseltme maksimum seviyede!';
      const maliyet = safeNum(cfg.costs?.[seviye], 0);
      const enerji = safeNum(cfg.enerji, GC.ENERJI_BAKIM);
      if (state.nakit < maliyet) return `Yetersiz nakit! (${maliyet}₺ gerekli)`;
      if (state.enerji < enerji) return `Enerjin yetmiyor! (${enerji} enerji gerekli)`;
      const yeniUps = { ...state.upgrades, [anahtar]: seviye + 1 };
      const kalite =
        anahtar === 'bakim' || anahtar === 'haliYenileme' ? sahaKalitesiHesapla(yeniUps) : state.sahaKalitesi;
      kaydet({
        ...state,
        nakit: state.nakit - maliyet,
        enerji: state.enerji - enerji,
        upgrades: yeniUps,
        sahaKalitesi: kalite,
      });
      return undefined;
    },
    [state, kaydet],
  );

  const doMaintenance = useCallback(
    (sahaId?: string): HataMesaji => {
      if (!state) return 'Oyun bulunamadı!';
      if (state.isGameOver) return 'Oyun bitti!';
      if (!sahaId && state.bakimYapildi) return 'Bakım zaten yapıldı!';
      if (sahaId && state.pitches?.[sahaId]?.bakimYapildi) return 'Bu sahanın bakımı zaten yapıldı!';
      if (state.nakit < BAKIM_UCRETI) return `Yetersiz nakit! (${BAKIM_UCRETI}₺ gerekli)`;
      if (state.enerji < GC.ENERJI_BAKIM) return `Enerjin yetmiyor! (${GC.ENERJI_BAKIM} enerji gerekli)`;
      let sahalar = state.pitches;
      if (sahaId && state.pitches?.[sahaId]) {
        sahalar = { ...state.pitches, [sahaId]: { ...state.pitches[sahaId], bakimYapildi: true } };
      }
      kaydet({
        ...state,
        nakit: state.nakit - BAKIM_UCRETI,
        enerji: state.enerji - GC.ENERJI_BAKIM,
        bakimYapildi: true,
        pitches: sahalar,
        gunlukGorevler: gorevIlerlet(state.gunlukGorevler, 'bakim'),
      });
      return null;
    },
    [state, kaydet],
  );

  const useJeton = useCallback((): HataMesaji => {
    if (!state) return 'Oyun bulunamadı!';
    if (safeNum(state.jeton, 0) < GC.JETON_ENERJI_COST)
      return `Yetersiz jeton! (${GC.JETON_ENERJI_COST} jeton gerekli)`;
    if (state.enerji >= GC.MAX_ENERJI) return 'Enerjin zaten dolu!';
    kaydet({
      ...state,
      jeton: state.jeton - GC.JETON_ENERJI_COST,
      enerji: Math.min(GC.MAX_ENERJI, state.enerji + GC.JETON_ENERJI_GAIN),
    });
    return null;
  }, [state, kaydet]);

  const buyYildizArsa = useCallback((): HataMesaji => {
    if (!state) return 'Oyun bulunamadı!';
    const saha = state.pitches?.yildiz ?? state.yildizSaha;
    if (!saha) return 'Saha bulunamadı!';
    if (saha.arsaAlindi) return 'Arsaya zaten sahibisin!';
    const fiyat = PC.YILDIZ_SAHA.arsaFiyat;
    if (state.nakit < fiyat) return `Yetersiz nakit! (${fiyat}₺ gerekli)`;
    const yeni: Saha = { ...saha, arsaAlindi: true, asama: Math.max(1, saha.asama ?? 0) };
    kaydet({
      ...state,
      nakit: state.nakit - fiyat,
      yildizSaha: yeni,
      pitches: { ...(state.pitches ?? {}), yildiz: yeni },
    });
    return null;
  }, [state, kaydet]);

  const buyPitchArsa = useCallback(
    (defId: string): HataMesaji => {
      if (!state) return 'Oyun bulunamadı!';
      const def = PC.PITCH_DEFS.find((d) => d.id === defId);
      if (!def) return 'Saha tipi bulunamadı!';
      if (state.pitches?.[defId]) return 'Bu saha zaten var!';
      if (state.nakit < def.arsaBedeli) return `Yetersiz nakit! (${def.arsaBedeli}₺ gerekli)`;
      const yeni: Saha = {
        id: def.id,
        ad: def.ad,
        sahaTipi: def.sahaTipi,
        arsaAlindi: true,
        asama: 1,
        kalite: 0,
        upgrades: { bakim: 0, haliYenileme: 0, aydinlatma: 0, dusSoyunma: 0, kantin: 0, sponsor: 0 },
        bakimYapildi: false,
        rezervasyonlar: [],
        kabulEdilenler: [],
        toplamKazanc: 0,
        aktif: false,
        gunlukGider: def.gunlukGider,
        satinAlmaBedeli: def.arsaBedeli,
        insaatMaliyeti: def.insaatBedeli,
      };
      kaydet({
        ...state,
        nakit: state.nakit - def.arsaBedeli,
        pitches: { ...(state.pitches ?? {}), [defId]: yeni },
        activePitchId: defId,
      });
      return null;
    },
    [state, kaydet],
  );

  const insaatIlerlet = useCallback(
    (sahaId: string): HataMesaji => {
      if (!state) return 'Oyun bulunamadı!';
      const saha = state.pitches?.[sahaId] ?? (sahaId === 'yildiz' ? state.yildizSaha : null);
      if (!saha) return 'Saha bulunamadı!';
      if (!saha.arsaAlindi) return 'Önce arsayı satın al!';
      const asama = GL.siradakiAsama(saha);
      if (!asama) return 'İnşaat tamamlanmış!';
      if (state.nakit < asama.cost) return `Yetersiz nakit! (${asama.cost}₺ gerekli)`;
      if (state.enerji < asama.enerji) return `Enerjin yetmiyor! (${asama.enerji} enerji gerekli)`;
      const yeniAsama = Math.min(5, safeNum(saha.asama, 0) + 1);
      const def = PC.PITCH_DEFS.find((d) => d.id === sahaId);
      const yildizMi = sahaId === 'yildiz';
      const acilisKalitesi = yildizMi ? PC.YILDIZ_SAHA.acilisKalite : safeNum(def?.baslangicKalitesi, 4);
      const yeni: Saha = {
        ...saha,
        asama: yeniAsama,
        kalite: yeniAsama >= 5 ? acilisKalitesi : safeNum(saha.kalite, 0),
        aktif: yeniAsama >= 5,
      };
      kaydet({
        ...state,
        nakit: state.nakit - asama.cost,
        enerji: state.enerji - asama.enerji,
        pitches: { ...(state.pitches ?? {}), [sahaId]: yeni },
        ...(yildizMi
          ? { yildizSaha: yeni, sahaKalitesi: Math.max(safeNum(state.sahaKalitesi, 0), yeni.kalite ?? 0) }
          : {}),
      });
      return null;
    },
    [state, kaydet],
  );

  const pitchUpgradeAl = useCallback(
    (sahaId: string, upgradeId: string): HataMesaji => {
      if (!state) return 'Oyun bulunamadı!';
      const def = PC.PITCH_UPGRADE_CONFIG[upgradeId];
      if (!def) return 'Yükseltme bulunamadı!';
      const saha = state.pitches?.[sahaId];
      if (!saha) return 'Saha bulunamadı!';
      if (safeNum(saha.asama, 0) < 5) return 'Bu saha henüz açık değil!';
      const yildizMi = sahaId === 'yildiz';
      const ups = yildizMi ? state.upgrades : saha.upgrades ?? {};
      const seviye = safeNum(ups?.[upgradeId], 0);
      const maliyet = PC.pitchUpgradeMaliyeti(def, seviye);
      if (maliyet == null) return 'Bu yükseltme maksimum seviyede!';
      if (state.nakit < maliyet) return `Yetersiz nakit! (${maliyet}₺ gerekli)`;
      if (state.enerji < def.enerji) return `Enerjin yetmiyor! (${def.enerji} enerji gerekli)`;
      let sahalar = state.pitches;
      let genelUps = state.upgrades;
      if (yildizMi) {
        genelUps = { ...state.upgrades, [upgradeId]: seviye + 1 };
      } else {
        sahalar = {
          ...state.pitches,
          [sahaId]: { ...saha, upgrades: { ...(saha.upgrades ?? {}), [upgradeId]: seviye + 1 } },
        };
      }
      kaydet({
        ...state,
        nakit: state.nakit - maliyet,
        enerji: state.enerji - def.enerji,
        pitches: sahalar,
        upgrades: genelUps,
      });
      return null;
    },
    [state, kaydet],
  );

  const setActivePitch = useCallback(
    (sahaId: string) => {
      if (!state) return;
      if (!state.pitches?.[sahaId]) return;
      kaydet({ ...state, activePitchId: sahaId });
    },
    [state, kaydet],
  );

  const cozOlay = useCallback(
    (secenekIndex: number): HataMesaji => {
      if (!state) return 'Oyun bulunamadı!';
      if (!state.bugunOlayId || state.olayCozuldu) return 'Çözülecek olay yok!';
      const olay = (GC.OLAY_HAVUZU as any[]).find((o) => o.id === state.bugunOlayId);
      if (!olay) return 'Olay bulunamadı!';
      const secenek = olay.secenekler?.[secenekIndex];
      if (!secenek) return 'Geçersiz seçim!';
      const etki = secenek.etki ?? {};
      kaydet({
        ...state,
        nakit: state.nakit + safeNum(etki.nakit, 0),
        jeton: state.jeton + safeNum(etki.jeton, 0),
        prestij: state.prestij + safeNum(etki.prestij, 0),
        memnuniyet: Math.max(0, Math.min(100, safeNum(state.memnuniyet, 50) + safeNum(etki.memnuniyet, 0))),
        enerji: Math.max(0, Math.min(GC.MAX_ENERJI, safeNum(state.enerji, 0) + safeNum(etki.enerji, 0))),
        olayGelirCarpani: etki.gelirCarpani == null ? state.olayGelirCarpani : safeNum(etki.gelirCarpani, 1),
        olayCozuldu: true,
      });
      return null;
    },
    [state, kaydet],
  );

  const imzaSponsor = useCallback(
    (sponsorId: string): HataMesaji => {
      if (!state) return 'Oyun bulunamadı!';
      if (state.isGameOver) return 'Oyun bitti!';
      const sponsor = SC.SPONSORLAR.find((s) => s.id === sponsorId);
      if (!sponsor) return 'Sponsor bulunamadı!';
      const mevcut = sponsorlarAl(state);
      if (mevcut.includes(sponsorId)) return 'Bu sponsorla zaten anlaşman var!';
      if (mevcut.length >= SC.MAX_SPONSOR) return `Aynı anda en fazla ${SC.MAX_SPONSOR} sponsor!`;
      const yildiz = state.pitches?.yildiz ?? state.yildizSaha;
      if (!SC.sponsorUygunMu(sponsor, safeNum(yildiz?.asama, 0), state.upgrades ?? {}))
        return 'Bu sponsorun şartları henüz sağlanmıyor!';
      if (state.nakit < sponsor.onOdeme) return `Yetersiz nakit! (${sponsor.onOdeme}₺ peşin gerekli)`;
      kaydet({ ...state, nakit: state.nakit - sponsor.onOdeme, sponsorlar: [...mevcut, sponsorId] });
      return null;
    },
    [state, kaydet],
  );

  const iptalSponsor = useCallback(
    (sponsorId: string): HataMesaji => {
      if (!state) return 'Oyun bulunamadı!';
      const mevcut = sponsorlarAl(state);
      if (!mevcut.includes(sponsorId)) return 'Bu sponsor zaten imzalı değil!';
      kaydet({ ...state, sponsorlar: mevcut.filter((s) => s !== sponsorId) });
      return null;
    },
    [state, kaydet],
  );

  const ligKatil = useCallback((): HataMesaji => {
    if (!state) return 'Oyun bulunamadı!';
    if (state.isGameOver) return 'Oyun bitti!';
    const yildiz = state.pitches?.yildiz ?? state.yildizSaha;
    if (safeNum(yildiz?.asama, 0) < 5) return 'Lig için yıldız sahanın hizmette olması gerek!';
    if (ligAl(state)) return 'Zaten ligdesin!';
    const antrenor = state.staff?.antrenor?.hired ? safeNum(state.staff.antrenor.level, 0) : 0;
    const lig = LM.ligOlustur(
      1,
      safeNum(state.sahaKalitesi, 0),
      antrenor,
      safeNum(state.memnuniyet, 50),
      safeNum(state.prestij, 0),
      state.gun,
    );
    kaydet({ ...state, lig });
    return null;
  }, [state, kaydet]);

  const ligHaftaOyna = useCallback((): { result?: LM.LigHaftaSonucu; error?: string } => {
    if (!state) return { error: 'Oyun bulunamadı!' };
    if (state.isGameOver) return { error: 'Oyun bitti!' };
    const lig = ligAl(state);
    if (!lig) return { error: 'Önce lige katıl!' };
    if (state.gun === lig.sonMacGunu) return { error: 'Bugünün lig maçı oynandı! Yarın yeni hafta maçı.' };
    if (state.enerji < LM.LIG_CONFIG.macEnerjisi)
      return { error: `Enerjin yetmiyor! (${LM.LIG_CONFIG.macEnerjisi} enerji gerekli)` };
    const antrenor = state.staff?.antrenor?.hired ? safeNum(state.staff.antrenor.level, 0) : 0;
    const { lig: yeniLig, sonuc } = LM.ligHaftaSimule(
      lig,
      safeNum(state.sahaKalitesi, 0),
      antrenor,
      safeNum(state.memnuniyet, 50),
      safeNum(state.prestij, 0),
      state.gun,
    );
    const s = sonuc as LM.LigHaftaSonucu;
    kaydet({
      ...state,
      nakit: state.nakit + s.kazanc + s.sezonOdulu,
      prestij: state.prestij + s.prestij + s.sezonPrestij,
      enerji: Math.max(0, state.enerji - LM.LIG_CONFIG.macEnerjisi),
      lig: yeniLig,
    });
    return { result: s };
  }, [state, kaydet]);

  const ligBirak = useCallback((): HataMesaji => {
    if (!state) return 'Oyun bulunamadı!';
    if (!ligAl(state)) return 'Zaten ligde değilsin!';
    kaydet({ ...state, lig: null });
    return null;
  }, [state, kaydet]);

  const buyLifeItem = useCallback(
    (itemId: string): HataMesaji => {
      if (!state) return 'Oyun bulunamadı!';
      const liste: any[] = Array.isArray(GC.LIFE_ITEMS) ? GC.LIFE_ITEMS : Object.values(GC.LIFE_ITEMS);
      const urun = liste.find((x) => x?.id === itemId);
      if (!urun) return 'Ürün bulunamadı!';
      const mevcut = state.lifeItems?.[itemId] ?? { id: itemId, owned: false, level: 0 };
      const seviyeler: any[] = urun.levels ?? [];
      const seviye = mevcut.owned ? safeNum(mevcut.level, 0) : 0;
      if (seviye >= seviyeler.length) return 'Bu ürünün tüm seviyeleri elinde!';
      const gerekli = safeNum(urun.requiredPrestij, 0);
      if (safeNum(state.prestij, 0) < gerekli) return `Yetersiz prestij! (${gerekli} prestij gerekli)`;
      const sv = seviyeler[seviye];
      const maliyet = safeNum(sv?.cost, 0);
      if (state.nakit < maliyet) return `Yetersiz nakit! (${maliyet}₺ gerekli)`;
      kaydet({
        ...state,
        nakit: state.nakit - maliyet,
        prestij: state.prestij + safeNum(sv?.prestij, 0),
        lifeItems: { ...(state.lifeItems ?? {}), [itemId]: { id: itemId, owned: true, level: seviye + 1 } },
      });
      return null;
    },
    [state, kaydet],
  );

  const upgradeKizArkadas = useCallback((): HataMesaji => {
    if (!state) return 'Oyun bulunamadı!';
    const cfg: any = GC.KIZ_ARKADAS_CONFIG;
    const gerekli = safeNum(cfg?.requiredPrestij, 0);
    if (safeNum(state.prestij, 0) < gerekli) return `Yetersiz prestij! (${gerekli} prestij gerekli)`;
    const seviye = safeNum(state.kizArkdasSeviye, 0);
    const seviyeler: any[] = cfg?.levels ?? [];
    if (seviye >= seviyeler.length) return 'İlişkiniz zaten en üst kademede!';
    const sv = seviyeler[seviye];
    const maliyet = safeNum(sv?.cost, 0);
    if (state.nakit < maliyet) return `Yetersiz nakit! (${maliyet}₺ gerekli)`;
    kaydet({
      ...state,
      nakit: state.nakit - maliyet,
      prestij: state.prestij + safeNum(sv?.prestij, 0),
      kizArkadas: true,
      kizArkdasSeviye: seviye + 1,
    });
    return null;
  }, [state, kaydet]);

  // Ödüllü reklam sonrası enerji (üst sınır yok)
  const enerjiEkle = useCallback(
    (miktar: number) => {
      if (!state) return;
      const m = Math.max(0, Math.round(miktar));
      if (m !== 0) kaydet({ ...state, enerji: state.enerji + m });
    },
    [state, kaydet],
  );

  const unlockCity = useCallback(
    (sehirId: string): HataMesaji => {
      if (!state) return 'Oyun bulunamadı!';
      const sehir: any = (GC.CITIES as any[]).find((c) => c?.id === sehirId);
      if (!sehir) return 'Şehir bulunamadı!';
      if (state.cities?.[sehirId]?.unlocked) return 'Bu şehir zaten açık!';
      const gerekli = safeNum(sehir.requiredPrestij, 0);
      if (safeNum(state.prestij, 0) < gerekli) return `Yetersiz prestij! (${gerekli} prestij gerekli)`;
      const maliyet = safeNum(sehir.unlockCost ?? sehir.acilisMaliyeti, 0);
      if (state.nakit < maliyet) return `Yetersiz nakit! (${maliyet}₺ gerekli)`;
      kaydet({
        ...state,
        nakit: state.nakit - maliyet,
        cities: {
          ...(state.cities ?? {}),
          [sehirId]: {
            id: sehirId,
            unlocked: true,
            sahaKalitesi: state.sahaKalitesi,
            sahaKapasitesi: state.sahaKapasitesi,
            upgrades: state.upgrades,
            toplamKazanc: state.toplamKazanc,
          },
        },
      });
      return null;
    },
    [state, kaydet],
  );

  const switchCity = useCallback(
    (sehirId: string): HataMesaji => {
      if (!state) return 'Oyun bulunamadı!';
      if (state.activeSehir === sehirId) return null;
      if (!state.cities?.[sehirId]?.unlocked) return 'Bu şehir henüz kilitli!';
      const sehir: any = (GC.CITIES as any[]).find((c) => c?.id === sehirId);
      const sehirler = { ...(state.cities ?? {}) };
      const aktif = state.activeSehir;
      if (aktif && sehirler[aktif]) {
        sehirler[aktif] = {
          ...sehirler[aktif],
          sahaKalitesi: state.sahaKalitesi,
          sahaKapasitesi: state.sahaKapasitesi,
          toplamKazanc: state.toplamKazanc,
        };
      }
      const hedef = sehirler[sehirId];
      kaydet({
        ...state,
        activeSehir: sehirId,
        sehir: String(sehir?.ad ?? sehir?.isim ?? sehirId),
        sahaKalitesi: hedef.sahaKalitesi,
        sahaKapasitesi: hedef.sahaKapasitesi,
        toplamKazanc: hedef.toplamKazanc,
        cities: sehirler,
      });
      return null;
    },
    [state, kaydet],
  );

  // İşe alım/terfi: bedel ilgili seviyenin maaşı kadar
  const hireStaff = useCallback(
    (personelId: string): HataMesaji => {
      if (!state) return 'Oyun bulunamadı!';
      const liste: any[] = Array.isArray(GC.STAFF_CONFIG) ? GC.STAFF_CONFIG : Object.values(GC.STAFF_CONFIG);
      const cfg = liste.find((p) => p?.id === personelId);
      if (!cfg) return 'Personel bulunamadı!';
      const seviyeler: any[] = cfg.levels ?? [];
      const mevcut = state.staff?.[personelId];
      if (!mevcut?.hired) {
        const maliyet = safeNum(seviyeler[0]?.maas, 0);
        if (state.nakit < maliyet) return `Yetersiz nakit! (${maliyet}₺ gerekli)`;
        kaydet({
          ...state,
          nakit: state.nakit - maliyet,
          staff: { ...(state.staff ?? {}), [personelId]: { id: personelId, hired: true, level: 1 } },
        });
        return null;
      }
      const yeniSeviye = safeNum(mevcut.level, 1) + 1;
      if (yeniSeviye > seviyeler.length) return 'Bu personel maksimum seviyede!';
      const maliyet = safeNum(seviyeler[yeniSeviye - 1]?.maas, 0);
      if (state.nakit < maliyet) return `Yetersiz nakit! (${maliyet}₺ gerekli)`;
      kaydet({
        ...state,
        nakit: state.nakit - maliyet,
        staff: { ...(state.staff ?? {}), [personelId]: { ...mevcut, level: yeniSeviye } },
      });
      return null;
    },
    [state, kaydet],
  );

  const nakitEkle = useCallback((miktar: number) => {
    setState((s) => (s ? { ...s, nakit: Number(s.nakit ?? 0) + miktar } : s));
  }, []);

  const joinTurnuva = useCallback((): { result?: TurnuvaSonucu; error?: string } => {
    if (!state) return { error: 'Oyun bulunamadı!' };
    const cfg: any = GC.TURNUVA_CONFIG;
    const aralik = Math.max(1, safeNum(cfg?.gunAraligi, 7));
    const son = safeNum(state.sonTurnuvaGun, 0);
    if (son > 0 && state.gun - son < aralik) {
      const kalan = aralik - (state.gun - son);
      return { error: `Turnuvalar ${aralik} günde bir! (${kalan} gün sonra tekrar dene)` };
    }
    const sonuc = GL.simulateTurnuva(state);
    kaydet({
      ...state,
      nakit: state.nakit + safeNum(sonuc.kazanc, 0),
      prestij: state.prestij + safeNum(sonuc.prestijKazanc, 0),
      turnuvaSonuclari: [...(state.turnuvaSonuclari ?? []).slice(-10), sonuc],
      sonTurnuvaGun: state.gun,
    });
    return { result: sonuc };
  }, [state, kaydet]);

  const buyProperty = useCallback((): HataMesaji => {
    if (!state) return 'Oyun bulunamadı!';
    if (state.yerSahibi) return 'Yer zaten senin!';
    if (state.nakit < YER_SAHIBI_FIYAT) return `Yetersiz nakit! (${YER_SAHIBI_FIYAT}₺ gerekli)`;
    kaydet({
      ...state,
      nakit: state.nakit - YER_SAHIBI_FIYAT,
      yerSahibi: true,
      prestij: state.prestij + PC.ISLETME_YERI.prestijOdul,
    });
    return null;
  }, [state, kaydet]);

  const manualSave = useCallback(async () => {
    if (!state) return;
    try {
      await saveGame(state);
    } catch {}
  }, [state]);

  const resetGame = useCallback(async () => {
    try {
      await deleteSave();
    } catch {}
    try {
      await kariyer.ligSifirla();
    } catch {}
    gunSonuKilidi.current = false;
    sonBitenGun.current = -1;
    await initNewGame();
  }, [initNewGame]);

  // Geliştirici hediyesi (Profil ekranındaki gizli menü)
  const devHediye = useCallback(
    (nakit = 0, prestij = 0, jeton = 0, enerjiDoldur = false) => {
      if (!state) return;
      kaydet({
        ...state,
        nakit: safeNum(state.nakit, 0) + nakit,
        prestij: safeNum(state.prestij, 0) + prestij,
        jeton: safeNum(state.jeton, 0) + jeton,
        enerji: enerjiDoldur ? GC.MAX_ENERJI : state.enerji,
      });
    },
    [state, kaydet],
  );

  const deger: GameContextValue = {
    state,
    loading,
    initNewGame,
    loadSavedGame,
    acceptReservation,
    rejectReservation,
    endDay,
    purchaseUpgrade,
    doMaintenance,
    useJeton,
    manualSave,
    resetGame,
    buyLifeItem,
    upgradeKizArkadas,
    unlockCity,
    switchCity,
    hireStaff,
    joinTurnuva,
    nakitEkle,
    enerjiEkle,
    buyProperty,
    devHediye,
    buyYildizArsa,
    buyPitchArsa,
    insaatIlerlet,
    pitchUpgradeAl,
    setActivePitch,
    cozOlay,
    imzaSponsor,
    iptalSponsor,
    ligKatil,
    ligHaftaOyna,
    ligBirak,
  };

  return <GameContext.Provider value={deger}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame, GameProvider içinde kullanılmalı!');
  return ctx;
}
