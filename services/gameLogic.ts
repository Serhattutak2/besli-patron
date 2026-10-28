// ============================================
// BEŞLİ PATRON — services/gameLogic.ts
// Oyun durumu, rezervasyon üretimi, gün sonu hesabı, kayıt taşıma, turnuva
// ============================================
import * as GC from '../constants/gameConfig';
import * as PC from '../constants/pitchConfig';

// ---------- Tipler ----------
export type RezervasyonDurum = 'bekliyor' | 'kabul' | 'red';

export type Rezervasyon = {
  id: string;
  musteriAdi: string;
  musteriTipi: string;
  kisiSayisi: number;
  saatAraligi: string;
  slotId: string;
  fiyat: number;
  durum: RezervasyonDurum | string;
  sahaId?: string;
};

export type Gorev = {
  id: string;
  aciklama: string;
  hedefTip: string;
  hedef: number;
  ilerleme: number;
  tamamlandi: boolean;
  odul?: number;
};

export type Saha = {
  id: string;
  ad: string;
  sahaTipi: string;
  arsaAlindi: boolean;
  asama: number;
  kalite: number;
  upgrades?: Record<string, number>;
  bakimYapildi: boolean;
  rezervasyonlar: Rezervasyon[];
  kabulEdilenler: Rezervasyon[];
  toplamKazanc: number;
  aktif: boolean;
  gunlukGider?: number;
  satinAlmaBedeli?: number;
  insaatMaliyeti?: number;
  kapasite?: number;
  sponsorlar?: string[];
};

export type Yorum = { yildiz: number; metin: string; isim: string; tipLabel: string };

export type TurnuvaSonucu = {
  gun: number;
  isim: string;
  sonuc: 'birincilik' | 'ikincilik' | 'ucunculuk' | 'katilim' | string;
  kazanc: number;
  prestijKazanc: number;
};

export type GameState = {
  isGameStarted: boolean;
  nakit: number;
  enerji: number;
  gun: number;
  sahaAdi: string;
  sehir: string;
  sahaKalitesi: number;
  sahaKapasitesi: number;
  jeton: number;
  toplamKazanc: number;
  prestij: number;
  upgrades: Record<string, number>;
  bugunRezervasyonlar: Rezervasyon[];
  kabulEdilenler: Rezervasyon[];
  gunlukGorevler: Gorev[];
  bugunGelir: number;
  bugunGider: number;
  consecutiveNegativeDays: number;
  bakimYapildi: boolean;
  isGameOver: boolean;
  lifeItems: Record<string, { id: string; owned: boolean; level: number }>;
  kizArkadas: boolean;
  kizArkdasSeviye: number;
  cities: Record<string, any>;
  activeSehir: string;
  staff: Record<string, { id: string; hired: boolean; level: number }>;
  memnuniyet: number;
  sadikMusteriler: number;
  turnuvaSonuclari: TurnuvaSonucu[];
  sonTurnuvaGun: number;
  bugunHava: string;
  bugunOlayId: string | null;
  olayCozuldu: boolean;
  olayGecmisi: any[];
  olayGelirCarpani: number;
  sezonGun: number;
  sezonGelir: number;
  yerSahibi: boolean;
  yildizSaha: Saha;
  pitches: Record<string, Saha>;
  activePitchId: string;
  [anahtar: string]: any;
};

export type GunSonuSonucu = {
  gun: number;
  gelir: number;
  gider: number;
  personelMaas: number;
  net: number;
  nakit: number;
  isGameOver: boolean;
  gorevOdul: number;
  jetonOdul: number;
  prestijKazanc: number;
  memnuniyetDegisim: number;
  yeniMemnuniyet: number;
  yorumlar: Yorum[];
  sadikKazanci: number;
  sezonTamamlandi: boolean;
  sahaGelir: number;
  sahaGider: number;
  sahaOzet: { id: string; ad: string; gelir: number; gider: number }[];
};

// ---------- Sabitler ----------
const MIN_SABAH_ENERJI = 70;
const SEZON_UZUNLUK = 30;
const SEZON_HEDEF = 650000;
const SEZON_ODUL_JETON = 200;
const SEZON_ODUL_PRESTIJ = 50;

// Saatlere göre talep yoğunluğu (fiyatı ve seçilme olasılığını etkiler)
const SLOT_TALEP: Record<string, number> = {
  sabah1: 0.4,
  sabah2: 0.5,
  oglen1: 0.6,
  oglen2: 0.7,
  ikindi1: 0.7,
  ikindi2: 0.8,
  ikindi3: 0.8,
  aksam1: 0.9,
  aksam2: 1,
  aksam3: 1.1,
  gece1: 1.2,
  gece2: 1.4,
  gece3: 1.6,
  gece4: 1.3,
  gece5: 1,
  gece6: 0.7,
  gece7: 0.5,
};

export const KASIYER_ENERJI_INDIRIMI = [0, 2, 3, 4];
export const TEMIZLIKCI_MEMNUNIYET_BONUSU = [0, 5, 8, 12];
export const ANTRENOR_TURNUVA_BONUSU = [0, 5, 10, 15];
export const GUVENLIK_TEKLIF_BONUSU = [0, 1, 2, 3];

const IYI_YORUMLAR = [
  'Saha tertemiz, oynamaya bayıldık. Yine geleceğiz!',
  'Gece aydınlatması harika, derbi artık burada oynanır.',
  'Rezervasyon yapmak çok kolaydı, karşılama sıcaktı.',
  'Toplar yeni, saha düz, çay bile iyiydi. Elinize sağlık.',
  'Mahallenin en iyi sahası, sırıtarak oynadık.',
  'Kaptan soyunma odasını çok beğendi, kilitler sağlam.',
  'Otopark sıkıntısı yok, araba kapıya kadar. Rahat bir akşamdı.',
  'Skorboarda skorumuz düştü, çocuklar bayıldı!',
];
const KOTU_YORUMLAR = [
  'Saha bakımsız, çim kavruk. Ayakkabım mahvoldu.',
  'Işık boyayıp söndü, maçı orada bitirdik.',
  'Tel örgü gitti top kaçtı, 3 topumuz kayıp.',
  'Duş suyu soğuk, işimize gelen gitmedi.',
  'Rezervasyon karışıktı, sıramızı başkası kaptı.',
  'Kale ağı yırtık, hakemlik tartışması çıkardı.',
];

// ---------- Yardımcılar ----------
function safeNum(v: unknown, varsayilan: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : varsayilan;
}

function acikGeceSlotlari(aydinlatmaSeviyesi: number): string[] {
  if (aydinlatmaSeviyesi >= 3) return ['gece1', 'gece2', 'gece3', 'gece4', 'gece5', 'gece6', 'gece7'];
  if (aydinlatmaSeviyesi === 2) return ['gece1', 'gece2', 'gece3', 'gece4', 'gece5'];
  if (aydinlatmaSeviyesi === 1) return ['gece1', 'gece2', 'gece3'];
  return [];
}

// Talebi yüksek saatleri daha sık seçen ağırlıklı seçim
function talepliSec(slotlar: string[]): string | null {
  if (slotlar.length === 0) return null;
  const agirliklar = slotlar.map((s) => SLOT_TALEP[s] ?? 1);
  const toplam = agirliklar.reduce((a, b) => a + b, 0);
  let r = Math.random() * toplam;
  for (let i = 0; i < slotlar.length; i++) {
    r -= agirliklar[i];
    if (r <= 0) return slotlar[i];
  }
  return slotlar[slotlar.length - 1];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(dizi: T[]): T {
  return dizi[Math.floor(Math.random() * dizi.length)];
}

function shuffleAndPick<T>(dizi: T[], adet = 3): T[] {
  const kopya = [...dizi];
  for (let i = kopya.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
  }
  return kopya.slice(0, adet);
}

// Personel seviyesi (1..3) → tablo indeksi (0..3)
function seviyeIndeksi(seviye: unknown): number {
  return Math.max(0, Math.min(3, safeNum(seviye, 0)));
}

function pitchDefBul(saha: { id: string }) {
  return PC.PITCH_DEFS.find((d) => d.id === saha.id);
}

export function sahaAdi(saha: Partial<Saha> & { id: string }, _state?: GameState): string {
  if (saha.ad) return saha.ad;
  if (saha.id !== 'yildiz') return pitchDefBul(saha)?.ad ?? 'Saha';
  return PC.YILDIZ_SAHA.ad;
}

export function sahaGunlukGideri(saha: Partial<Saha> & { id: string }): number {
  if (saha.gunlukGider != null) return safeNum(saha.gunlukGider, 0);
  if (saha.id !== 'yildiz' && saha.sahaTipi !== 'yildiz') return safeNum(pitchDefBul(saha)?.gunlukGider, 0);
  return PC.YILDIZ_SAHA.gunlukGider;
}

export type UpgradeEtkileri = {
  fiyatEki: number;
  memnuniyetEki: number;
  talepEki: number;
  gunlukGelirEki: number;
  prestijEki: number;
  enerjiIndirimi: number;
  havaKoruma: number;
};

export function pitchUpgradeEtkileri(upgrades?: Record<string, number> | null): UpgradeEtkileri {
  const e: UpgradeEtkileri = {
    fiyatEki: 0,
    memnuniyetEki: 0,
    talepEki: 0,
    gunlukGelirEki: 0,
    prestijEki: 0,
    enerjiIndirimi: 0,
    havaKoruma: 0,
  };
  if (!upgrades) return e;
  for (const def of Object.values(PC.PITCH_UPGRADE_CONFIG)) {
    const sv = safeNum(upgrades[def.id], 0);
    if (sv <= 0) continue;
    e.fiyatEki += safeNum(def.fiyatEki, 0) * sv;
    e.memnuniyetEki += safeNum(def.memnuniyetEki, 0) * sv;
    e.talepEki += safeNum(def.talepEki, 0) * sv;
    e.gunlukGelirEki += safeNum(def.gunlukGelirEki, 0) * sv;
    e.prestijEki += safeNum(def.prestijEki, 0) * sv;
    e.enerjiIndirimi += safeNum(def.enerjiIndirimi, 0) * sv;
    if (def.havaKoruma) e.havaKoruma = Math.max(e.havaKoruma, sv);
  }
  return e;
}

export function tumSahalar(state: Partial<GameState>): Saha[] {
  if (state.pitches && Object.keys(state.pitches).length > 0) {
    return Object.values(state.pitches).filter(Boolean);
  }
  return state.yildizSaha ? [state.yildizSaha] : [];
}

export function acikSahalar(state: Partial<GameState>): Saha[] {
  return tumSahalar(state).filter((s) => safeNum(s.asama, 0) >= 5);
}

// Yıldız Saha'nın yükseltmeleri genel "upgrades" alanında tutulur
function sahaYukseltmeleri(saha: Saha, state: Partial<GameState>) {
  if (saha.upgrades != null) return saha.upgrades;
  return saha.id === 'yildiz' ? state.upgrades : undefined;
}

export function sahaGunlukPasifGelir(saha: Saha, state: Partial<GameState>): number {
  let gelir = pitchUpgradeEtkileri(sahaYukseltmeleri(saha, state)).gunlukGelirEki;
  if (saha.sahaTipi === 'akademi') gelir += 1500;
  return Math.round(gelir);
}

function sahaMusteriHavuzu(sahaTipi: string, kalite: number): string[] {
  if (sahaTipi === 'cocuk') return ['mahalle', 'mahalle', 'dogumGunu', 'dogumGunu', 'yas50plus', 'ogrenci'];
  if (sahaTipi === 'akademi') return ['ogrenci', 'ogrenci', 'ogrenci', 'amator', 'mahalle'];
  if (sahaTipi === 'vip') return ['kurumsal', 'kurumsal', 'ofis', 'ofis', 'dogumGunu'];
  if (sahaTipi === 'arena') return ['amator', 'amator', 'kurumsal', 'ofis', 'mahalle', 'dogumGunu'];
  if (kalite >= 6)
    return ['mahalle', 'mahalle', 'ogrenci', 'ogrenci', 'ofis', 'ofis', 'amator', 'amator', 'dogumGunu', 'yas50plus', 'kurumsal'];
  return ['mahalle', 'mahalle', 'ogrenci', 'ogrenci', 'ofis', 'ofis', 'amator', 'amator', 'dogumGunu', 'yas50plus'];
}

function yorumUret(memnuniyet: number, kabulEdilenler: Rezervasyon[]): Yorum[] {
  const yorumlar: Yorum[] = [];
  if (kabulEdilenler.length === 0 && Math.random() > 0.3) return yorumlar;
  const adet = kabulEdilenler.length !== 0 ? Math.min(3, 1 + Math.floor(kabulEdilenler.length / 3)) : 1;
  for (let i = 0; i < adet; i++) {
    const rez = kabulEdilenler.length > 0 ? pickRandom(kabulEdilenler) : null;
    const iyi = Math.random() * 100 < memnuniyet;
    yorumlar.push({
      yildiz: iyi ? randomInt(4, 5) : randomInt(1, 2),
      metin: iyi ? pickRandom(IYI_YORUMLAR) : pickRandom(KOTU_YORUMLAR),
      isim: rez?.musteriAdi ?? 'İsimsiz misafir',
      tipLabel: rez ? ((GC.MUSTERI_TIPLERI as any)[rez.musteriTipi]?.label ?? 'Misafir') : 'Misafir',
    });
  }
  return yorumlar;
}

export function generateDailyTasks(): Gorev[] {
  return shuffleAndPick(GC.GOREV_HAVUZU as any[], 3).map((g, i) => ({
    id: `task_${Date.now()}_${i}`,
    aciklama: g.aciklama,
    hedefTip: g.hedefTip,
    hedef: g.hedef,
    ilerleme: 0,
    tamamlandi: false,
    odul: g.odul,
  }));
}

export function calculateStaffMaas(staff?: GameState['staff'] | null): number {
  if (!staff) return 0;
  const liste: any[] = Array.isArray(GC.STAFF_CONFIG) ? GC.STAFF_CONFIG : Object.values(GC.STAFF_CONFIG);
  let toplam = 0;
  for (const p of Object.values(staff)) {
    if (!p?.hired) continue;
    const cfg = liste.find((c) => c?.id === p.id);
    const seviye = cfg?.levels ? cfg.levels[Math.max(0, safeNum(p.level, 1) - 1)] : undefined;
    toplam += safeNum(seviye?.maas, 0);
  }
  return toplam;
}

export function getActiveCityConfig(state: Partial<GameState>) {
  const id = state.activeSehir ?? 'istanbul';
  return GC.CITIES.find((c) => c.id === id) ?? GC.CITIES[0];
}

function bosUpgrades(): Record<string, number> {
  return {
    bakim: 0,
    haliYenileme: 0,
    aydinlatma: 0,
    dusSoyunma: 0,
    kantin: 0,
    sponsor: 0,
    telOrgu: 0,
    tribun: 0,
    otopark: 0,
    kamera: 0,
    isitma: 0,
    skorboard: 0,
    reklam: 0,
    vipLoca: 0,
    kale: 0,
    topSeti: 0,
    yedekKulubesi: 0,
    sesSistemi: 0,
    wifi: 0,
    turnike: 0,
    ilkYardim: 0,
    soyunmaDolabi: 0,
  };
}

export function createInitialState(): GameState {
  const yildiz: Saha = {
    id: 'yildiz',
    ad: PC.YILDIZ_SAHA.ad,
    sahaTipi: 'yildiz',
    arsaAlindi: false,
    asama: 0,
    kalite: 0,
    upgrades: undefined,
    bakimYapildi: false,
    rezervasyonlar: [],
    kabulEdilenler: [],
    toplamKazanc: 0,
    aktif: false,
    gunlukGider: PC.YILDIZ_SAHA.gunlukGider,
    satinAlmaBedeli: PC.YILDIZ_SAHA.arsaFiyat,
    insaatMaliyeti: PC.YILDIZ_SAHA.toplamMaliyet - PC.YILDIZ_SAHA.arsaFiyat,
  };

  const lifeItems: GameState['lifeItems'] = {};
  for (const item of GC.LIFE_ITEMS as any[]) {
    if (item?.id) lifeItems[item.id] = { id: item.id, owned: false, level: 0 };
  }
  const staff: GameState['staff'] = {};
  for (const p of GC.STAFF_CONFIG as any[]) {
    if (p?.id) staff[p.id] = { id: p.id, hired: false, level: 0 };
  }
  const cities: Record<string, any> = {};
  for (const c of GC.CITIES as any[]) {
    if (!c?.id) continue;
    cities[c.id] = {
      id: c.id,
      unlocked: c.id === 'istanbul',
      sahaKalitesi: GC.INITIAL_SAHA_KALITESI,
      sahaKapasitesi: 10,
      upgrades: bosUpgrades(),
      toplamKazanc: 0,
    };
  }

  return {
    isGameStarted: true,
    nakit: GC.INITIAL_NAKIT,
    enerji: GC.INITIAL_ENERJI,
    gun: GC.INITIAL_GUN,
    sahaAdi: 'Yıldız Halı Saha',
    sehir: 'İstanbul',
    sahaKalitesi: GC.INITIAL_SAHA_KALITESI,
    sahaKapasitesi: 10,
    jeton: 0,
    toplamKazanc: 0,
    prestij: 0,
    upgrades: bosUpgrades(),
    bugunRezervasyonlar: [],
    kabulEdilenler: [],
    gunlukGorevler: generateDailyTasks(),
    bugunGelir: 0,
    bugunGider: 0,
    consecutiveNegativeDays: 0,
    bakimYapildi: false,
    isGameOver: false,
    lifeItems,
    kizArkadas: false,
    kizArkdasSeviye: 0,
    cities,
    activeSehir: 'istanbul',
    staff,
    memnuniyet: 50,
    sadikMusteriler: 0,
    turnuvaSonuclari: [],
    sonTurnuvaGun: 0,
    bugunHava: 'gunesli',
    bugunOlayId: null,
    olayCozuldu: false,
    olayGecmisi: [],
    olayGelirCarpani: 1,
    sezonGun: 1,
    sezonGelir: 0,
    yerSahibi: false,
    yildizSaha: yildiz,
    pitches: { yildiz: { ...yildiz, rezervasyonlar: [], kabulEdilenler: [] } },
    activePitchId: 'yildiz',
  };
}

// Rezervasyon başına enerji: 5 + haftalık artış − kasiyer − turnike (1..10)
export function rezervasyonEnerjiMaliyeti(gun: number, kasiyerSeviye: number, ekIndirim = 0): number {
  const taban = safeNum(GC.ENERJI_REZERVASYON, 5);
  const haftalik = Math.floor(safeNum(gun, 0) / 7);
  const kasiyer = KASIYER_ENERJI_INDIRIMI[seviyeIndeksi(kasiyerSeviye)] ?? 0;
  return Math.min(10, Math.max(1, taban + haftalik - kasiyer - safeNum(ekIndirim, 0)));
}

// Tek sahalı (eski) rezervasyon üretimi
export function generateReservations(
  gun: number,
  upgrades?: Record<string, number> | null,
  fiyatCarpani = 1,
  staff?: GameState['staff'],
  memnuniyet?: number,
  ekTalep = 0,
): Rezervasyon[] {
  const guvenlikIdx = staff?.guvenlik?.hired ? seviyeIndeksi(staff.guvenlik.level) : 0;
  const mem = memnuniyet ?? 50;
  const adet = Math.max(
    0,
    Math.min(
      12,
      randomInt(4, 6) +
        Math.floor(safeNum(gun, 0) / 3) +
        (safeNum(upgrades?.kamera, 0) > 0 ? 1 : 0) +
        (GUVENLIK_TEKLIF_BONUSU[guvenlikIdx] ?? 0) +
        (mem >= GC.MEMNUNIYET_CONFIG.sadikMusteriEsik ? 1 : 0) +
        Math.round(safeNum(ekTalep, 0)),
    ),
  );
  const geceAcik = new Set(acikGeceSlotlari(upgrades?.aydinlatma ?? 0));
  const musait = GC.TIME_SLOTS.map((s) => s.id).filter((id) => !id.startsWith('gece') || geceAcik.has(id));
  const havuz =
    gun >= 6
      ? ['mahalle', 'mahalle', 'ogrenci', 'ogrenci', 'ofis', 'ofis', 'amator', 'amator', 'dogumGunu', 'yas50plus', 'kurumsal']
      : ['mahalle', 'mahalle', 'ogrenci', 'ogrenci', 'ofis', 'ofis', 'amator', 'amator', 'dogumGunu', 'yas50plus'];
  const sonuc: Rezervasyon[] = [];
  const kullanilan = new Set<string>();

  for (let i = 0; i < adet; i++) {
    const tip = pickRandom(havuz);
    const cfg = (GC.MUSTERI_TIPLERI as any)[tip];
    const ad = pickRandom<string>(cfg.isimler);
    const kisi = randomInt(cfg.minKisi, cfg.maxKisi);
    const dusCarpani = (upgrades?.dusSoyunma ?? 0) > 0 ? 1.15 : 1;
    const sadikCarpani =
      (memnuniyet ?? 50) >= GC.MEMNUNIYET_CONFIG.sadikMusteriEsik ? 1 + GC.MEMNUNIYET_CONFIG.sadikMusteriFiyatBonus : 1;
    const doluluk = cfg.maxKisi > cfg.minKisi ? (kisi - cfg.minKisi) / (cfg.maxKisi - cfg.minKisi) : 1;
    const kisiPrimi = 0.3 * doluluk;

    const tercih = (cfg.tercihSlotlar as string[]).filter((s) => musait.includes(s)).filter((s) => !kullanilan.has(s));
    let slot: string | null;
    if (tercih.length > 0) slot = talepliSec(tercih);
    else {
      const bos = musait.filter((s) => !kullanilan.has(s));
      if (bos.length === 0) break;
      slot = talepliSec(bos);
    }
    if (!slot) break;
    kullanilan.add(slot);

    const talep = SLOT_TALEP[slot] ?? 1;
    const ham =
      randomInt(cfg.minFiyat, cfg.maxFiyat) *
      (0.85 + kisiPrimi) *
      dusCarpani *
      safeNum(fiyatCarpani, 1) *
      sadikCarpani *
      (0.85 + 0.25 * talep);
    const fiyat = Math.min(15000, Math.max(6000, Math.round(ham / 50) * 50));
    const saat = GC.TIME_SLOTS.find((s) => s.id === slot);
    sonuc.push({
      id: `rez_${Date.now()}_${i}`,
      musteriAdi: ad,
      musteriTipi: tip,
      kisiSayisi: kisi,
      saatAraligi: saat?.saat ?? '10:00-11:00',
      slotId: slot,
      fiyat,
      durum: 'bekliyor',
    });
  }
  return sonuc;
}

// Çok sahalı rezervasyon üretimi (her açık saha için ayrı)
export function generatePitchReservations(saha: Saha, state: GameState, ekTalep = 0): Rezervasyon[] {
  if (safeNum(saha.asama, 0) < 5) return [];
  const ups = sahaYukseltmeleri(saha, state);
  const etki = pitchUpgradeEtkileri(ups);
  const kalite = safeNum(saha.kalite, state.sahaKalitesi);

  let havaCezasi = state.bugunHava === 'karli' ? 2 : state.bugunHava === 'ruzgarli' ? 1 : 0;
  if (saha.sahaTipi === 'vip') havaCezasi = 0;
  const etkinHavaCezasi = etki.havaKoruma >= 2 ? 0 : etki.havaKoruma === 1 ? Math.ceil(havaCezasi / 2) : havaCezasi;

  const guvenlikIdx = state.staff?.guvenlik?.hired ? seviyeIndeksi(state.staff.guvenlik.level) : 0;
  const adet = Math.max(
    0,
    Math.min(
      8,
      randomInt(2, 4) +
        Math.floor(kalite / 3) +
        Math.round(etki.talepEki) -
        etkinHavaCezasi +
        (GUVENLIK_TEKLIF_BONUSU[guvenlikIdx] ?? 0) +
        Math.round(safeNum(ekTalep, 0)),
    ),
  );

  const havuz = sahaMusteriHavuzu(saha.sahaTipi, kalite);
  const geceAcik = new Set(acikGeceSlotlari(ups?.aydinlatma ?? 0));
  const musait = GC.TIME_SLOTS.map((s) => s.id).filter((id) => !id.startsWith('gece') || geceAcik.has(id));
  const tipCarpani = saha.sahaTipi === 'vip' ? 1.25 : saha.sahaTipi === 'arena' ? 1.2 : 1;
  const fiyatCarpani = (1 + etki.fiyatEki) * tipCarpani;

  const sonuc: Rezervasyon[] = [];
  const kullanilan = new Set<string>();

  for (let i = 0; i < adet; i++) {
    const tip = pickRandom(havuz);
    const cfg = (GC.MUSTERI_TIPLERI as any)[tip];
    if (!cfg) continue;
    const ad = pickRandom<string>(cfg.isimler);
    const kisi = Math.min(randomInt(cfg.minKisi, cfg.maxKisi), safeNum(saha.kapasite, cfg.maxKisi) || cfg.maxKisi);
    const dusCarpani = (ups?.dusSoyunma ?? 0) > 0 ? 1.15 : 1;
    const sadikCarpani =
      (state.memnuniyet ?? 50) >= GC.MEMNUNIYET_CONFIG.sadikMusteriEsik
        ? 1 + GC.MEMNUNIYET_CONFIG.sadikMusteriFiyatBonus
        : 1;
    const doluluk = cfg.maxKisi > cfg.minKisi ? (kisi - cfg.minKisi) / (cfg.maxKisi - cfg.minKisi) : 1;
    const kisiPrimi = 0.3 * doluluk;

    const tercih = (cfg.tercihSlotlar as string[]).filter((s) => musait.includes(s)).filter((s) => !kullanilan.has(s));
    let slot: string | null;
    if (tercih.length > 0) slot = talepliSec(tercih);
    else {
      const bos = musait.filter((s) => !kullanilan.has(s));
      if (bos.length === 0) break;
      slot = talepliSec(bos);
    }
    if (!slot) break;
    kullanilan.add(slot);

    const talep = SLOT_TALEP[slot] ?? 1;
    const ham =
      randomInt(cfg.minFiyat, cfg.maxFiyat) *
      (0.85 + kisiPrimi) *
      dusCarpani *
      fiyatCarpani *
      sadikCarpani *
      (0.85 + 0.25 * talep);
    const fiyat = Math.min(15000, Math.max(6000, Math.round(ham / 50) * 50));
    const saat = GC.TIME_SLOTS.find((s) => s.id === slot);
    sonuc.push({
      id: `rez_${saha.id}_${Date.now()}_${i}`,
      musteriAdi: ad,
      musteriTipi: tip,
      kisiSayisi: kisi,
      saatAraligi: saat?.saat ?? '10:00-11:00',
      slotId: slot,
      fiyat,
      durum: 'bekliyor',
      sahaId: saha.id,
    });
  }
  return sonuc;
}

// Sahanın bir sonraki inşaat aşaması (arsa alınmış, açılmamış sahalar için)
export function siradakiAsama(saha: Saha) {
  const asama = safeNum(saha.asama, 0);
  if (asama < 1 || asama >= 5) return null;
  let liste: { asama: number; label: string; aciklama: string; cost: number; enerji: number }[];
  if (saha.id !== 'yildiz') {
    const def = pitchDefBul(saha);
    liste = def ? PC.insaatAsamalari(def) : [];
  } else {
    liste = PC.YILDIZ_SAHA.asamalar;
  }
  return liste.find((a) => a.asama === asama + 1) ?? null;
}

// Gün sonu: gelir-gider, memnuniyet, sezon, iflas kontrolü, yeni güne hazırlık
export function processEndDay(state: GameState): { newState: GameState; result: GunSonuSonucu } {
  const sehir = getActiveCityConfig(state);
  const olayCarpani = safeNum(state.olayGelirCarpani, 1);
  const rezGelir = Math.round(safeNum(state.bugunGelir, 0) * olayCarpani);
  const kabulSayisi = (state.kabulEdilenler ?? []).length;
  const aciklar = acikSahalar(state);

  let sahaGelir = 0;
  let sahaGider = 0;
  const sahaOzet: GunSonuSonucu['sahaOzet'] = [];
  for (const s of aciklar) {
    const g = sahaGunlukPasifGelir(s, state);
    const d = sahaGunlukGideri(s);
    sahaGelir += g;
    sahaGider += d;
    sahaOzet.push({ id: s.id, ad: sahaAdi(s, state), gelir: g, gider: d });
  }

  const gelir = rezGelir + sahaGelir;
  const kira = state.yerSahibi ? 0 : safeNum(sehir?.kiraGunluk, 3500);
  const elektrikSu = safeNum(sehir?.elektrikSuGunluk, 900);
  const personelMaas = calculateStaffMaas(state.staff);
  const gider = kira + elektrikSu + personelMaas + sahaGider;
  const net = gelir - gider;

  const tamamlanan = (state.gunlukGorevler ?? []).filter((g) => g?.tamamlandi);
  const gorevOdul = tamamlanan.reduce((t, g) => t + safeNum(g.odul, 0), 0);
  const jetonOdul = tamamlanan.length > 0 ? safeNum(GC.JETON_GOREV_ODUL, 50) * tamamlanan.length : 0;

  // Memnuniyet: kabul edilen +1, bekletilen −1, bakım yapılmadıysa −5
  const bekleyen = (state.bugunRezervasyonlar ?? []).filter((r) => r?.durum === 'bekliyor').length;
  let memDegisim = kabulSayisi - bekleyen;
  if (!state.bakimYapildi) memDegisim -= 5;
  if (state.staff?.temizlikci?.hired) {
    memDegisim += TEMIZLIKCI_MEMNUNIYET_BONUSU[seviyeIndeksi(state.staff.temizlikci.level)] ?? 0;
  }
  for (const s of aciklar) memDegisim += pitchUpgradeEtkileri(sahaYukseltmeleri(s, state)).memnuniyetEki;
  const yeniMemnuniyet = Math.max(0, Math.min(100, Math.round(safeNum(state.memnuniyet, 50) + memDegisim)));
  const sadikKazanci =
    yeniMemnuniyet >= safeNum(GC.MEMNUNIYET_CONFIG?.sadikMusteriEsik, 80) && kabulSayisi > 0 ? 1 : 0;

  let prestijKazanc = 0;
  for (const s of aciklar) prestijKazanc += pitchUpgradeEtkileri(sahaYukseltmeleri(s, state)).prestijEki;

  const yorumlar = yorumUret(yeniMemnuniyet, state.kabulEdilenler ?? []);

  // Sezon (30 gün, hedef sabit 650.000₺)
  let sezonGun = safeNum(state.sezonGun, 1) + 1;
  let sezonGelir = safeNum(state.sezonGelir, 0) + gelir;
  let sezonTamamlandi = false;
  if (sezonGun > SEZON_UZUNLUK) {
    sezonTamamlandi = sezonGelir >= SEZON_HEDEF;
    sezonGun = 1;
    sezonGelir = 0;
  }

  const yeniNakit = Math.round(safeNum(state.nakit, 0) + net + gorevOdul);
  const oncekiNegatif = safeNum(state.consecutiveNegativeDays, 0);
  let isGameOver = state.isGameOver ?? false;
  let negatifGun = 0;
  if (yeniNakit < 0) {
    negatifGun = oncekiNegatif + 1;
    if (negatifGun >= safeNum(GC.IFLAS_GUN_LIMIT, 3)) isGameOver = true;
  }

  const yeniSahalar: Record<string, Saha> = {};
  for (const [id, p] of Object.entries(state.pitches ?? {})) {
    if (!p) continue;
    const ozet = sahaOzet.find((o) => o.id === id);
    yeniSahalar[id] = {
      ...p,
      bakimYapildi: false,
      rezervasyonlar: [],
      kabulEdilenler: [],
      toplamKazanc: safeNum(p.toplamKazanc, 0) + Math.max(0, (ozet?.gelir ?? 0) - (ozet?.gider ?? 0)),
    };
  }
  const yildizSaha: Saha = { ...state.yildizSaha, bakimYapildi: false, rezervasyonlar: [], kabulEdilenler: [] };
  if (yeniSahalar.yildiz) yildizSaha.toplamKazanc = yeniSahalar.yildiz.toplamKazanc;

  const newState: GameState = {
    ...state,
    nakit: yeniNakit,
    gun: state.gun + 1,
    enerji: Math.min(
      GC.MAX_ENERJI,
      Math.max(MIN_SABAH_ENERJI, safeNum(state.enerji, 0) + safeNum(GC.ENERJI_GUN_SONU, 40)),
    ),
    toplamKazanc: safeNum(state.toplamKazanc, 0) + Math.max(0, gelir),
    jeton: safeNum(state.jeton, 0) + jetonOdul + (sezonTamamlandi ? SEZON_ODUL_JETON : 0),
    prestij: safeNum(state.prestij, 0) + prestijKazanc + (sezonTamamlandi ? SEZON_ODUL_PRESTIJ : 0),
    bugunGelir: 0,
    bugunGider: 0,
    bugunRezervasyonlar: [],
    kabulEdilenler: [],
    gunlukGorevler: generateDailyTasks(),
    memnuniyet: yeniMemnuniyet,
    sadikMusteriler: safeNum(state.sadikMusteriler, 0) + sadikKazanci,
    consecutiveNegativeDays: negatifGun,
    isGameOver,
    bakimYapildi: false,
    sezonGun,
    sezonGelir,
    yildizSaha,
    pitches: yeniSahalar,
  };

  return {
    newState,
    result: {
      gun: state.gun,
      gelir,
      gider,
      personelMaas,
      net,
      nakit: yeniNakit,
      isGameOver,
      gorevOdul,
      jetonOdul,
      prestijKazanc: prestijKazanc + (sezonTamamlandi ? SEZON_ODUL_PRESTIJ : 0),
      memnuniyetDegisim: memDegisim,
      yeniMemnuniyet,
      yorumlar,
      sadikKazanci,
      sezonTamamlandi,
      sahaGelir,
      sahaGider,
      sahaOzet,
    },
  };
}

// Eski/eksik kayıtları güncel şekle getirir
export function migrateState(eski: any): GameState {
  if (!eski || typeof eski !== 'object') return createInitialState();
  const s: any = { ...eski };
  s.nakit = safeNum(s.nakit, GC.INITIAL_NAKIT);
  s.enerji = safeNum(s.enerji, GC.INITIAL_ENERJI);
  s.gun = safeNum(s.gun, GC.INITIAL_GUN);
  s.jeton = safeNum(s.jeton, 0);
  s.toplamKazanc = safeNum(s.toplamKazanc, 0);
  s.prestij = safeNum(s.prestij, 0);
  s.sahaKalitesi = safeNum(s.sahaKalitesi, GC.INITIAL_SAHA_KALITESI);
  s.sahaKapasitesi = safeNum(s.sahaKapasitesi, 10);
  s.memnuniyet = safeNum(s.memnuniyet, 50);
  s.sadikMusteriler = safeNum(s.sadikMusteriler, 0);
  s.bugunGelir = safeNum(s.bugunGelir, 0);
  s.bugunGider = safeNum(s.bugunGider, 0);
  s.consecutiveNegativeDays = safeNum(s.consecutiveNegativeDays, 0);
  s.sezonGun = safeNum(s.sezonGun, 1);
  s.sezonGelir = safeNum(s.sezonGelir, 0);
  s.sonTurnuvaGun = safeNum(s.sonTurnuvaGun, 0);
  s.olayGelirCarpani = safeNum(s.olayGelirCarpani, 1);
  s.kizArkdasSeviye = safeNum(s.kizArkdasSeviye, 0);

  const u = s.upgrades ?? {};
  s.upgrades = {
    ...u,
    bakim: safeNum(u.bakim, 0),
    haliYenileme: safeNum(u.haliYenileme, 0),
    aydinlatma: safeNum(u.aydinlatma, 0),
    dusSoyunma: safeNum(u.dusSoyunma, 0),
    kantin: safeNum(u.kantin, 0),
    sponsor: safeNum(u.sponsor, 0),
  };

  const ey = s.yildizSaha;
  const yAsama = Math.min(5, Math.max(0, safeNum(ey?.asama, 0)));
  const yildizSaha: Saha = {
    id: 'yildiz',
    ad: PC.YILDIZ_SAHA.ad,
    sahaTipi: 'yildiz',
    arsaAlindi: ey?.arsaAlindi ?? yAsama > 0,
    asama: yAsama,
    kalite: safeNum(ey?.kalite, 0),
    upgrades: undefined,
    bakimYapildi: ey?.bakimYapildi ?? false,
    rezervasyonlar: Array.isArray(ey?.rezervasyonlar) ? ey.rezervasyonlar : [],
    kabulEdilenler: Array.isArray(ey?.kabulEdilenler) ? ey.kabulEdilenler : [],
    toplamKazanc: safeNum(ey?.toplamKazanc, 0),
    aktif: yAsama >= 5,
    gunlukGider: PC.YILDIZ_SAHA.gunlukGider,
    satinAlmaBedeli: PC.YILDIZ_SAHA.arsaFiyat,
    insaatMaliyeti: PC.YILDIZ_SAHA.toplamMaliyet - PC.YILDIZ_SAHA.arsaFiyat,
  };
  s.yildizSaha = yildizSaha;

  const eskiSahalar = s.pitches ?? {};
  const sahalar: Record<string, Saha> = {};
  const girdiler = Object.entries(eskiSahalar);
  if (girdiler.length !== 0) {
    for (const [id, p] of girdiler as [string, any][]) {
      if (!p || typeof p !== 'object') continue;
      const def = PC.PITCH_DEFS.find((d) => d.id === id);
      const yildizMi = id === 'yildiz';
      const asama = Math.min(5, Math.max(0, safeNum(p.asama, 0)));
      sahalar[id] = {
        ...p,
        id,
        ad: p.ad ?? (yildizMi ? PC.YILDIZ_SAHA.ad : def?.ad ?? 'Saha'),
        sahaTipi: p.sahaTipi ?? (yildizMi ? 'yildiz' : def?.sahaTipi ?? 'yildiz'),
        arsaAlindi: p.arsaAlindi ?? asama > 0,
        asama,
        kalite: safeNum(p.kalite, yildizMi ? 0 : def?.baslangicKalitesi ?? 4),
        bakimYapildi: p.bakimYapildi ?? false,
        rezervasyonlar: Array.isArray(p.rezervasyonlar) ? p.rezervasyonlar : [],
        kabulEdilenler: Array.isArray(p.kabulEdilenler) ? p.kabulEdilenler : [],
        toplamKazanc: safeNum(p.toplamKazanc, 0),
        aktif: asama >= 5,
        gunlukGider: p.gunlukGider ?? (yildizMi ? PC.YILDIZ_SAHA.gunlukGider : def?.gunlukGider),
        satinAlmaBedeli: p.satinAlmaBedeli ?? (yildizMi ? PC.YILDIZ_SAHA.arsaFiyat : def?.arsaBedeli),
        insaatMaliyeti: p.insaatMaliyeti ?? def?.insaatBedeli,
      };
    }
    if (!sahalar.yildiz) sahalar.yildiz = yildizSaha;
  } else {
    sahalar.yildiz = yildizSaha;
  }
  s.pitches = sahalar;
  s.activePitchId = s.activePitchId ?? 'yildiz';
  s.isGameStarted = s.isGameStarted ?? false;
  s.bakimYapildi = s.bakimYapildi ?? false;
  s.isGameOver = s.isGameOver ?? false;
  s.bugunRezervasyonlar = Array.isArray(s.bugunRezervasyonlar) ? s.bugunRezervasyonlar : [];
  s.kabulEdilenler = Array.isArray(s.kabulEdilenler) ? s.kabulEdilenler : [];
  s.gunlukGorevler = Array.isArray(s.gunlukGorevler) ? s.gunlukGorevler : [];
  s.turnuvaSonuclari = Array.isArray(s.turnuvaSonuclari) ? s.turnuvaSonuclari : [];
  s.olayGecmisi = Array.isArray(s.olayGecmisi) ? s.olayGecmisi : [];
  s.lifeItems = s.lifeItems ?? {};
  s.cities = s.cities ?? {};
  s.staff = s.staff ?? {};
  s.kizArkadas = s.kizArkadas ?? false;
  s.yerSahibi = s.yerSahibi ?? false;
  s.sahaAdi = s.sahaAdi ?? 'Yıldız Halı Saha';
  s.sehir = s.sehir ?? 'İstanbul';
  s.activeSehir = s.activeSehir ?? 'istanbul';
  s.bugunHava = s.bugunHava ?? 'gunesli';
  s.bugunOlayId = s.bugunOlayId ?? null;
  s.olayCozuldu = s.olayCozuldu ?? false;
  return s as GameState;
}

// Haftalık turnuva sonucu
export function simulateTurnuva(state: GameState): TurnuvaSonucu {
  const cfg: any = GC.TURNUVA_CONFIG;
  const arenaVar = Object.values(state.pitches ?? {}).some(
    (p) => p?.sahaTipi === 'arena' && safeNum(p.asama, 0) >= 5,
  );
  const antrenorIdx = state.staff?.antrenor?.hired ? seviyeIndeksi(state.staff.antrenor.level) : 0;
  const olay =
    state.bugunOlayId && !state.olayCozuldu
      ? (GC.OLAY_HAVUZU as any[]).find((o) => o.id === state.bugunOlayId)
      : null;
  const olayEtkisi = safeNum(olay?.macEtkisi, 0);
  const skor =
    safeNum(state.sahaKalitesi, 0) * 8 +
    safeNum(state.memnuniyet, 50) * 0.2 +
    (arenaVar ? 10 : 0) +
    (ANTRENOR_TURNUVA_BONUSU[antrenorIdx] ?? 0) +
    olayEtkisi +
    Math.random() * 40;
  const sonuc = skor >= 90 ? 'birincilik' : skor >= 70 ? 'ikincilik' : skor >= 50 ? 'ucunculuk' : 'katilim';
  const isimler =
    Array.isArray(cfg?.isimler) && cfg.isimler.length > 0
      ? cfg.isimler
      : ['Mahalle Turnuvası', 'Bölgesel Kupa', 'Kurumsal Lig', 'Amatör Ligi'];
  const odul = cfg?.sonuclar?.[sonuc] ?? {};
  return {
    gun: safeNum(state.gun, 0),
    isim: pickRandom(isimler),
    sonuc,
    kazanc: safeNum(odul.kazanc, 0),
    prestijKazanc: safeNum(odul.prestij, 0),
  };
}

// Olayın lig maçına memnuniyet etkisi (şimdilik olaylarda maç etkisi tanımlı değil)
export function olayLigMemnuniyetEki(state: GameState): number {
  const olay =
    state.bugunOlayId && !state.olayCozuldu
      ? (GC.OLAY_HAVUZU as any[]).find((o) => o.id === state.bugunOlayId)
      : null;
  const etki = safeNum(olay?.macEtkisi, 0);
  return etki !== 0 ? Math.round(etki / 0.15) : 0;
}

