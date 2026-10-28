// ============================================
// SAHA BİZİM — engine/veri.ts
// Denge rakamları ve içerik: takım tipleri, saha tipleri, yükseltmeler,
// personel, çay ocağı, canlı maç anları, efsane formalar, reklam sınırları.
// Tüm denge ayarı bu dosyadan yapılır.
// ============================================
import type { TakimTipi, SahaTipi, ReklamTuru } from './tipler';

// ---------- Zaman ----------
export const ACILIS_SAATI = 9;
export const KAPANIS_SAATI = 27; // 03:00
export const GERCEK_SANIYE_PER_SAAT = 13; // 1x hızda bir oyun saati
export const SON_SAAT_ISIKSIZ = 22; // ışık yükseltmesi yoksa son maç 22:00'de başlar
export const GUN_ADLARI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export function saatYazi(saat: number): string {
  const s = saat % 24;
  return `${String(s).padStart(2, '0')}:00`;
}
export function dakikaYazi(dk: number): string {
  const s = Math.floor(dk / 60) % 24;
  const d = Math.floor(dk % 60);
  return `${String(s).padStart(2, '0')}:${String(d).padStart(2, '0')}`;
}
/** 1. gün Pazartesi; dönen değer 0=Pazar..6=Cumartesi */
export function haftaGunu(gun: number): number {
  return gun % 7;
}

// ---------- Ekonomi ----------
export const BASLANGIC_NAKIT = 15000;
export const BASLANGIC_ENERJI = 100;
export const MAKS_ENERJI = 100;
export const GECE_ENERJI = 45;
export const TEKLIF_ENERJI = 6;
export const BAKIM_ENERJI = 8;
export const BAKIM_UCRET = 900;
export const BAKIM_ARTIS = 1.2;
export const YIPRANMA = 0.07; // her maçta kalite kaybı
export const FIYAT_SEVIYE = [
  { ad: 'Ucuz', fiyat: 0.8, talep: 1.35, sevgi: 3 },
  { ad: 'Normal', fiyat: 1, talep: 1, sevgi: 0 },
  { ad: 'Pahalı', fiyat: 1.3, talep: 0.65, sevgi: -4 },
];
export const TEKLIF_GECERLILIK_DK = 120;

// ---------- Takım tipleri ----------
export type TakimTipiTanim = {
  ad: string;
  saatler: number[];
  gunler?: number[]; // haftanın günleri (0=Pazar). Yoksa her gün.
  hafsonuCarpan?: number;
  taban: number; // temel saat ücreti (₺)
  fiyatHassas: number; // fiyat seviyesinin sevgiye etkisi çarpanı
  kaliteBeklenti: number;
  ikon: string;
  renk: string;
};

export const TAKIM_TIPLERI: Record<TakimTipi, TakimTipiTanim> = {
  ofis: { ad: 'Ofis ekibi', saatler: [18, 19, 20, 21], gunler: [1, 2, 3, 4, 5], taban: 1700, fiyatHassas: 0.6, kaliteBeklenti: 5, ikon: 'briefcase', renk: '#60A5FA' },
  ogrenci: { ad: 'Öğrenciler', saatler: [14, 15, 16, 22, 23, 24], taban: 1100, fiyatHassas: 2, kaliteBeklenti: 3, ikon: 'school', renk: '#A78BFA' },
  esnaf: { ad: 'Esnaf', saatler: [21, 22, 23, 24, 25], taban: 1500, fiyatHassas: 1.2, kaliteBeklenti: 4, ikon: 'storefront', renk: '#F59E0B' },
  emekli: { ad: '50+ dayılar', saatler: [9, 10, 11, 12], taban: 1200, fiyatHassas: 1.4, kaliteBeklenti: 6, ikon: 'cafe', renk: '#94A3B8' },
  aile: { ad: 'Aileler', saatler: [10, 11, 12, 13, 14, 15, 16, 17], hafsonuCarpan: 2.5, taban: 1400, fiyatHassas: 1.1, kaliteBeklenti: 6, ikon: 'people', renk: '#34D399' },
  amator: { ad: 'Amatör takım', saatler: [19, 20, 21, 22, 23], taban: 1600, fiyatHassas: 1, kaliteBeklenti: 5, ikon: 'football', renk: '#F87171' },
  kurumsal: { ad: 'Kurumsal', saatler: [19, 20, 21], taban: 2600, fiyatHassas: 0.3, kaliteBeklenti: 7, ikon: 'diamond', renk: '#FBBF24' },
  kadin: { ad: 'Kadın takımı', saatler: [17, 18, 19, 20], taban: 1500, fiyatHassas: 0.9, kaliteBeklenti: 5, ikon: 'flash', renk: '#F472B6' },
  vardiya: { ad: 'Vardiya ekibi', saatler: [9, 10, 24, 25, 26], taban: 1400, fiyatHassas: 1, kaliteBeklenti: 4, ikon: 'moon', renk: '#38BDF8' },
};

// Adı olmayan misafir gruplar (kapasiteyi doldurur, sevgi sistemi yok)
export const MISAFIR_GRUPLAR = [
  'Doğum günü grubu',
  'Bekârlığa veda ekibi',
  'Kuzenler',
  'Yazılımcılar',
  'Servis şoförleri',
  'Bakkallar derneği',
  'Lise mezunları',
  'Düğün öncesi damat ekibi',
  'Spor salonu üyeleri',
  'Komşu site sakinleri',
  'Kurye ekibi',
  'Eczacılar',
  'Berberler',
  'İnşaat ustaları',
  'Futbol okulu velileri',
  'Oto sanayi ustaları',
];

// Saatlere göre misafir talebi
export const SAAT_TALEP: Record<number, number> = {
  9: 0.35, 10: 0.45, 11: 0.5, 12: 0.5, 13: 0.45, 14: 0.55, 15: 0.6, 16: 0.7, 17: 0.85,
  18: 1, 19: 1.25, 20: 1.4, 21: 1.4, 22: 1.25, 23: 1.05, 24: 0.8, 25: 0.55, 26: 0.4,
};

// ---------- Saha tipleri ----------
export type SahaTipiTanim = {
  tip: SahaTipi;
  ad: string;
  aciklama: string;
  gerekenMahalle: number;
  arsa: number;
  asamaMaliyet: number;
  asamaSaat: number; // her inşaat aşamasının oyun saati
  fiyatCarpan: number;
  gunlukGider: number;
  maksKalite: number;
  baslangicKalite: number;
  pasifGunluk: number;
  sevenTipler: TakimTipi[];
  renk: string;
};

export const SAHA_TIPLERI: Record<SahaTipi, SahaTipiTanim> = {
  mahalle: { tip: 'mahalle', ad: 'Mahalle Sahası', aciklama: 'Her şeyin başladığı tozlu saha.', gerekenMahalle: 0, arsa: 0, asamaMaliyet: 0, asamaSaat: 0, fiyatCarpan: 1, gunlukGider: 200, maksKalite: 6, baslangicKalite: 4, pasifGunluk: 0, sevenTipler: [], renk: '#22C55E' },
  minikler: { tip: 'minikler', ad: 'Minikler Sahası', aciklama: 'Küçük saha. Aileler ve 50+ dayılar bayılır.', gerekenMahalle: 1, arsa: 45000, asamaMaliyet: 30000, asamaSaat: 8, fiyatCarpan: 0.85, gunlukGider: 180, maksKalite: 7, baslangicKalite: 5, pasifGunluk: 0, sevenTipler: ['aile', 'emekli'], renk: '#34D399' },
  akademi: { tip: 'akademi', ad: 'Akademi Sahası', aciklama: 'Futbol okulu aidatı her gün kasaya girer.', gerekenMahalle: 2, arsa: 90000, asamaMaliyet: 60000, asamaSaat: 12, fiyatCarpan: 1, gunlukGider: 300, maksKalite: 8, baslangicKalite: 5, pasifGunluk: 1800, sevenTipler: ['ogrenci', 'kadin'], renk: '#60A5FA' },
  vip: { tip: 'vip', ad: 'VIP Kapalı Saha', aciklama: 'Kurumsal takımların gözdesi, hava etkilemez.', gerekenMahalle: 3, arsa: 180000, asamaMaliyet: 120000, asamaSaat: 16, fiyatCarpan: 1.45, gunlukGider: 550, maksKalite: 9, baslangicKalite: 6, pasifGunluk: 0, sevenTipler: ['kurumsal', 'ofis'], renk: '#A78BFA' },
  arena: { tip: 'arena', ad: 'Mahalle Arenası', aciklama: 'Tribünlü dev saha. Derbiler burada iki kat kazandırır.', gerekenMahalle: 5, arsa: 350000, asamaMaliyet: 230000, asamaSaat: 20, fiyatCarpan: 1.65, gunlukGider: 900, maksKalite: 10, baslangicKalite: 6, pasifGunluk: 0, sevenTipler: ['amator', 'kurumsal'], renk: '#F87171' },
};
export const SAHA_SIRASI: SahaTipi[] = ['mahalle', 'minikler', 'akademi', 'vip', 'arena'];
export const INSAAT_ASAMALARI = ['Arsa alındı', 'Zemin hazırlığı', 'Halı ve kaleler', 'Işıklar ve tel örgü', 'Hizmette'];

// ---------- Saha yükseltmeleri ----------
export type YukseltmeTanim = {
  id: string;
  ad: string;
  ikon: string;
  aciklama: string;
  maliyetler: number[];
  enerji: number;
  fiyatEki?: number; // seviye başına
  sevgiEki?: number;
  maksKaliteEki?: number;
};

export const YUKSELTMELER: YukseltmeTanim[] = [
  { id: 'isik', ad: 'Projektörler', ikon: 'bulb', aciklama: 'Gece maçları açılır: 1. seviye 00:00\'a, 2. seviye 03:00\'e kadar.', maliyetler: [18000, 45000], enerji: 10, fiyatEki: 0.02 },
  { id: 'hali', ad: 'Yeni Nesil Halı', ikon: 'grid', aciklama: 'Saha kalitesinin sınırını yükseltir, fiyatı artırır.', maliyetler: [16000, 38000, 80000], enerji: 10, fiyatEki: 0.03, maksKaliteEki: 1 },
  { id: 'soyunma', ad: 'Duş ve Soyunma', ikon: 'water', aciklama: 'Takımlar her maçtan daha mutlu çıkar.', maliyetler: [14000, 34000], enerji: 8, sevgiEki: 2 },
  { id: 'tribun', ad: 'Tribün', ikon: 'people', aciklama: 'Seyirci gelir. Fiyat ve derbi geliri artar.', maliyetler: [26000, 60000, 120000], enerji: 12, fiyatEki: 0.04 },
  { id: 'skorbord', ad: 'Dev Ekran', ikon: 'tv', aciklama: 'Maç arası sponsor reklamı yayınlayıp para kazanırsın.', maliyetler: [30000], enerji: 8, fiyatEki: 0.02 },
  { id: 'isitici', ad: 'Saha Isıtıcısı', ikon: 'flame', aciklama: 'Yağmur ve karda müşteri kaçmaz.', maliyetler: [20000, 45000], enerji: 8 },
  { id: 'kamera', ad: 'Güvenlik Kamerası', ikon: 'videocam', aciklama: 'Hırsızlık olayı çıkmaz, kötü olaylar azalır.', maliyetler: [12000], enerji: 5 },
  { id: 'otopark', ad: 'Otopark', ikon: 'car', aciklama: 'Ofis ve kurumsal takımların talebi artar.', maliyetler: [35000], enerji: 10 },
];
export function yukseltmeBul(id: string) {
  return YUKSELTMELER.find((y) => y.id === id)!;
}
export const YUKSELTME_TIP_CARPAN: Record<SahaTipi, number> = { mahalle: 1, minikler: 0.9, akademi: 1.2, vip: 1.6, arena: 2.2 };

// ---------- Personel ----------
export type PersonelTanim = { id: string; ad: string; ikon: string; aciklama: string; maaslar: number[]; etkiler: string[] };
export const PERSONEL: PersonelTanim[] = [
  { id: 'kasiyer', ad: 'Sekreter', ikon: 'call', aciklama: 'Telefonları o açar; teklif kabul etmek daha az yorar.', maaslar: [250, 500, 800], etkiler: ['Teklif enerjisi -1', 'Teklif enerjisi -2', 'Teklif enerjisi -3'] },
  { id: 'temizlikci', ad: 'Saha Bakımcısı', ikon: 'sparkles', aciklama: 'Halı daha yavaş yıpranır.', maaslar: [220, 480], etkiler: ['Yıpranma %25 az', 'Yıpranma %50 az'] },
  { id: 'guvenlik', ad: 'Güvenlik', ikon: 'shield-checkmark', aciklama: 'Kavga ve hırsızlık gibi kötü anlar azalır.', maaslar: [300, 650], etkiler: ['Kötü anlar %30 az', 'Kötü anlar %60 az'] },
  { id: 'bekci', ad: 'Gece Bekçisi', ikon: 'flashlight', aciklama: 'Sen yokken tesis daha uzun süre kazanır.', maaslar: [180, 400], etkiler: ['Çevrimdışı 12 saate kadar', 'Çevrimdışı 16 saate kadar'] },
];
export const PERSONEL_ISEALIM_GUN = 5; // işe alım bedeli = günlük maaş x 5

// ---------- Çay ocağı ----------
export const CAY_MENU = ['Kapalı', 'Çay ve su', 'Tost tezgâhı', 'Soğuk içecek dolabı', 'Kumpir köşesi', 'Döner arabası', 'Mangal bahçesi'];
export const CAY_MALIYET = [6000, 16000, 38000, 80000, 150000, 260000];
export const CAY_MAC_BASI = 55; // seviye başına maç başı kazanç
export const CAY_SAATLIK = 70; // seviye başına saatlik (açıkken ve çevrimdışı)
export const CAY_DEPO_SAAT = 6; // birikim üst sınırı = saatlik x bu

// ---------- İtibar ----------
export function itibarUnvani(itibar: number): string {
  if (itibar < 50) return 'Yeni patron';
  if (itibar < 150) return 'Mahallenin tanıdığı';
  if (itibar < 300) return 'Sözü dinlenen';
  if (itibar < 500) return 'Semtin abisi';
  if (itibar < 800) return 'Şehrin patronu';
  return 'Halısaha kralı';
}

// ---------- Canlı maç anları ----------
export type AnEtki = { nakit?: number; sevgi?: number; itibar?: number; kontrol?: number; enerji?: number; kalite?: number };
export type AnSecenek = { yazi: string; etki: AnEtki; sonuc: string };
export type CanliAnTanim = {
  id: string;
  baslik: string;
  metin: string; // {takim} yer tutucusu
  kotu: boolean;
  kosul?: 'gece' | 'yagmur' | 'kameraYok' | 'amator';
  secenekler: AnSecenek[];
  sessiz: AnSecenek; // süre dolarsa
};

export const CANLI_ANLAR: CanliAnTanim[] = [
  {
    id: 'top_bahce', baslik: 'Top komşunun bahçesine kaçtı!', metin: '{takim} şutu çaktı, top Ayten Teyze\'nin domateslerinin arasına düştü.', kotu: true,
    secenekler: [
      { yazi: 'Özür dile, bir kasa domates al', etki: { nakit: -300, itibar: 2 }, sonuc: 'Ayten Teyze gülümsedi, topu da geri verdi.' },
      { yazi: 'Yedek topla devam', etki: { sevgi: -2, itibar: -1 }, sonuc: 'Maç sürdü ama teyze balkondan söyleniyor.' },
      { yazi: 'Çaycıyı gönder', etki: { enerji: -3, sevgi: 2 }, sonuc: 'Çaycı topu kaptı, maç hiç durmadı.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -4, itibar: -2 }, sonuc: 'Kimse ilgilenmedi, maç on dakika durdu.' },
  },
  {
    id: 'isik_sondu', baslik: 'Işıklar söndü!', metin: 'Projektörler birden karardı. {takim} karanlıkta kaldı.', kotu: true, kosul: 'gece',
    secenekler: [
      { yazi: 'Elektrikçiyi acil çağır', etki: { nakit: -700, sevgi: 2 }, sonuc: 'Beş dakikada ışıklar geri geldi.' },
      { yazi: 'Telefon ışıklarıyla devam', etki: { sevgi: -1, itibar: 1 }, sonuc: 'Efsane bir an oldu, herkes videoya çekti.' },
      { yazi: 'Maçı iptal et, para iade', etki: { nakit: -900, sevgi: -2 }, sonuc: 'Takım anlayış gösterdi ama keyifleri kaçtı.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -8, itibar: -3 }, sonuc: 'Karanlıkta yarım saat beklediler, söylene söylene gittiler.' },
  },
  {
    id: 'kavga', baslik: 'Sahada kavga çıktı!', metin: '{takim} ile rakipleri pozisyon yüzünden birbirine girdi.', kotu: true, kosul: 'amator',
    secenekler: [
      { yazi: 'Araya gir, sakinleştir', etki: { enerji: -6, sevgi: 3, itibar: 2 }, sonuc: 'Patron otoritesi! Herkes tokalaştı.' },
      { yazi: 'Herkese çay ısmarla', etki: { nakit: -400, sevgi: 4 }, sonuc: 'Çay gelince öfke dindi.' },
      { yazi: 'İkisini de sahadan at', etki: { sevgi: -6, itibar: 3, kontrol: -2 }, sonuc: 'Kural kuraldır dedin. Mahalle seni ciddiye aldı ama takım küstü.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -10, itibar: -5, kontrol: -3 }, sonuc: 'Kavga büyüdü, olay mahalle grubuna düştü.' },
  },
  {
    id: 'sakatlik', baslik: 'Sakatlık!', metin: '{takim} oyuncusu ayak bileğini burktu, yerde kıvranıyor.', kotu: true,
    secenekler: [
      { yazi: 'Buz ve ilk yardım çantası', etki: { nakit: -150, sevgi: 4 }, sonuc: 'Hızlı müdahale. Takım çok memnun.' },
      { yazi: 'Taksi çağır, parasını sen öde', etki: { nakit: -500, sevgi: 6, itibar: 2 }, sonuc: 'Bunu kimse unutmayacak.' },
      { yazi: 'Kenara otursun, maç devam', etki: { sevgi: -3 }, sonuc: 'Maç bitti ama takım soğuk davrandı.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -6, itibar: -2 }, sonuc: 'Kimse ilgilenmedi, takım çok bozuldu.' },
  },
  {
    id: 'yagmur', baslik: 'Sağanak bastırdı!', metin: 'Bir anda bulutlar boşaldı. {takim} sırılsıklam.', kotu: true, kosul: 'yagmur',
    secenekler: [
      { yazi: 'Maçı sürdür, sonra sıcak çorba', etki: { nakit: -350, sevgi: 4 }, sonuc: 'Yağmurda maç, sonra çorba. Unutulmaz gece.' },
      { yazi: 'Yarım saat ara ver', etki: { sevgi: -1 }, sonuc: 'Yağmur dindi, maç kaldığı yerden sürdü.' },
      { yazi: 'Ücretin yarısını iade et', etki: { nakit: -700, sevgi: 2, itibar: 2 }, sonuc: 'Dürüst patron diye konuşuluyorsun.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -5, kalite: -0.3 }, sonuc: 'Su birikti, halı da takım da zarar gördü.' },
  },
  {
    id: 'hirsiz', baslik: 'Soyunma odasında hırsız!', metin: '{takim} oyuncusunun cüzdanı kaybolmuş.', kotu: true, kosul: 'kameraYok',
    secenekler: [
      { yazi: 'Tesisi ara, bul', etki: { enerji: -8, sevgi: 3, itibar: 2 }, sonuc: 'Cüzdan çöp kutusunun yanında çıktı. Rahatladılar.' },
      { yazi: 'Kaybı sen karşıla', etki: { nakit: -600, sevgi: 5 }, sonuc: 'Mahallede "sözünün eri" diye anılıyorsun.' },
      { yazi: 'Polise yönlendir', etki: { sevgi: -2 }, sonuc: 'Tutanak tutuldu, kimse memnun değil.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -8, itibar: -4 }, sonuc: 'Olay büyüdü, "o sahada hırsız var" sözü yayıldı.' },
  },
  {
    id: 'komsu', baslik: 'Komşu şikâyeti', metin: 'Apartman yöneticisi gürültüden şikâyetçi. {takim} çok coşkulu.', kotu: true, kosul: 'gece',
    secenekler: [
      { yazi: 'Yöneticiye baklava götür', etki: { nakit: -350, itibar: 2 }, sonuc: 'Yönetici yumuşadı, "gençtir, olur" dedi.' },
      { yazi: 'Takımı uyar', etki: { sevgi: -2, itibar: 1 }, sonuc: 'Takım sessizleşti ama biraz bozuldu.' },
      { yazi: 'Kulak asma', etki: { itibar: -3, kontrol: -2 }, sonuc: 'Şikâyet muhtara kadar gitti.' },
    ],
    sessiz: { yazi: '', etki: { itibar: -3, kontrol: -2 }, sonuc: 'Yönetici zabıtayı aradı.' },
  },
  {
    id: 'hakem', baslik: 'Penaltı tartışması!', metin: '{takim} penaltı var diyor, karşı takım yok diyor. Herkes sana bakıyor.', kotu: false,
    secenekler: [
      { yazi: 'Penaltı var!', etki: { sevgi: 4, kontrol: 1 }, sonuc: 'Gol oldu, {takim} sevinçten çıldırdı.' },
      { yazi: 'Penaltı yok, devam', etki: { sevgi: -2, itibar: 2 }, sonuc: 'Tarafsız patron. Herkes kabullendi.' },
      { yazi: 'Kamerayı izleyelim', etki: { enerji: -4, sevgi: 2, itibar: 1 }, sonuc: 'Görüntüye bakıldı, herkes ikna oldu.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -3 }, sonuc: 'Tartışma maçın sonuna kadar sürdü.' },
  },
  {
    id: 'yildiz_oyuncu', baslik: 'Sahada bir yıldız var!', metin: '{takim} içinde eskiden profesyonel oynamış biri varmış. Herkes onu izliyor.', kotu: false,
    secenekler: [
      { yazi: 'Fotoğrafını duvara as', etki: { itibar: 4, sevgi: 3 }, sonuc: 'Duvardaki fotoğraf yeni müşteri getiriyor.' },
      { yazi: 'Ücretsiz antrenman teklif et', etki: { nakit: -300, sevgi: 6 }, sonuc: 'Takım seni çok sevdi.' },
      { yazi: 'Sosyal medyada paylaş', etki: { itibar: 6, enerji: -3 }, sonuc: 'Paylaşım mahallede yayıldı.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Kimse fark etmedi, an kaçtı.' },
  },
  {
    id: 'dogum_gunu', baslik: 'Sürpriz doğum günü!', metin: '{takim} kaptanının doğum günüymüş, takım pasta getirmiş.', kotu: false,
    secenekler: [
      { yazi: 'Pasta için mum ve çay ikram et', etki: { nakit: -200, sevgi: 6 }, sonuc: 'Saha şarkıyla inledi.' },
      { yazi: 'Hediye: bedava bir saat', etki: { nakit: -900, sevgi: 10 }, sonuc: 'Kaptan seni kucakladı.' },
      { yazi: 'Tebrik et, devam', etki: { sevgi: 1 }, sonuc: 'Güzel bir an oldu.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Pasta kesildi, sen göremedin.' },
  },
  {
    id: 'izci', baslik: 'Kulüp izcisi tribünde!', metin: 'Bir profesyonel kulübün izcisi {takim} maçını izliyor.', kotu: false,
    secenekler: [
      { yazi: 'İzciye çay ve yer ayarla', etki: { nakit: -150, itibar: 5 }, sonuc: 'İzci tesisini çok beğendi, adını not aldı.' },
      { yazi: 'Takıma haber ver', etki: { sevgi: 5 }, sonuc: 'Takım hayatının maçını çıkardı.' },
      { yazi: 'Akademin için konuş', etki: { enerji: -5, itibar: 7 }, sonuc: 'Akademin için ilk görüşme yapıldı.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'İzci sessizce gitti.' },
  },
  {
    id: 'kedi', baslik: 'Sahaya kedi girdi!', metin: 'Bir sokak kedisi {takim} maçının ortasında topu kovalıyor.', kotu: false,
    secenekler: [
      { yazi: 'Kediye mama koy, maskot yap', etki: { nakit: -100, itibar: 4, sevgi: 2 }, sonuc: 'Tesisin artık bir maskotu var: Halı.' },
      { yazi: 'Nazikçe dışarı çıkar', etki: { enerji: -2, sevgi: 1 }, sonuc: 'Maç kaldığı yerden sürdü.' },
      { yazi: 'Videoya çek, paylaş', etki: { itibar: 5 }, sonuc: 'Video mahalle grubunda rekor kırdı.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: 1 }, sonuc: 'Kedi bir gol attı, herkes güldü.' },
  },
  {
    id: 'muhtar', baslik: 'Muhtar uğradı', metin: '{muhtar} {takim} maçını izlemeye geldi, sahayı inceliyor.', kotu: false,
    secenekler: [
      { yazi: 'Çay ve sohbet', etki: { enerji: -3, kontrol: 4 }, sonuc: 'Muhtar mahallede senden övgüyle bahsedecek.' },
      { yazi: 'Mahalle çocuklarına bedava saat sözü ver', etki: { nakit: -500, kontrol: 7, itibar: 2 }, sonuc: 'Muhtar çok etkilendi.' },
      { yazi: 'Kibarca selam ver', etki: { kontrol: 1 }, sonuc: 'Muhtar başıyla selam verdi.' },
    ],
    sessiz: { yazi: '', etki: { kontrol: -1 }, sonuc: 'Muhtar kimseyle görüşemeden gitti.' },
  },
  {
    id: 'rakip_casus', baslik: 'Rakibin adamı geldi', metin: '{rakip} tarafından gelen biri {takim} oyuncularına kendi sahasını överiyor.', kotu: true,
    secenekler: [
      { yazi: 'Kibarca dışarı çıkar', etki: { enerji: -3, sevgi: 1 }, sonuc: 'Adam kızarak gitti.' },
      { yazi: 'Takıma özel indirim sözü ver', etki: { nakit: -400, sevgi: 5 }, sonuc: 'Takım sana sadık kaldı.' },
      { yazi: 'Bırak konuşsun', etki: { sevgi: -4, kontrol: -2 }, sonuc: 'Takımdan bazıları rakibe kaydı.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -5, kontrol: -3 }, sonuc: 'Adam takımı ikna etmeye çalıştı.' },
  },
  {
    id: 'su_bitti', baslik: 'Sular kesildi!', metin: 'Maç sonu {takim} duşa girecekken sular kesildi.', kotu: true,
    secenekler: [
      { yazi: 'Damacana su getir', etki: { nakit: -250, sevgi: 2 }, sonuc: 'Kova ile duş, gülerek bitti.' },
      { yazi: 'Bir sonraki maça indirim', etki: { nakit: -400, sevgi: 4 }, sonuc: 'Takım anlayışla karşıladı.' },
      { yazi: 'Belediyeyi ara', etki: { enerji: -4 }, sonuc: 'Su yarım saat sonra geldi.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -5 }, sonuc: 'Terli terli gittiler.' },
  },
];

// ---------- Efsane formalar ----------
export type FormaBonus = 'fiyat' | 'gecefiyat' | 'enerji' | 'cay' | 'sevgi' | 'kontrol' | 'itibar' | 'yipranma' | 'derbi' | 'teklif';
export type FormaTanim = { id: string; ad: string; efsane: string; nadirlik: 0 | 1 | 2; bonus: FormaBonus; deger: number; renk1: string; renk2: string; numara: number };

export const BONUS_YAZI: Record<FormaBonus, (d: number) => string> = {
  fiyat: (d) => `Tüm fiyatlar +%${d}`,
  gecefiyat: (d) => `Gece maçları +%${d}`,
  enerji: (d) => `Her sabah +${d} enerji`,
  cay: (d) => `Çay ocağı +%${d}`,
  sevgi: (d) => `Her maçta +${d} sevgi`,
  kontrol: (d) => `Mahalle etkisi +%${d}`,
  itibar: (d) => `İtibar kazancı +%${d}`,
  yipranma: (d) => `Halı yıpranması -%${d}`,
  derbi: (d) => `Derbi geliri +%${d}`,
  teklif: (d) => `Teklif sayısı +%${d}`,
};

const EFSANELER: { ad: string; bonus: FormaBonus; renk1: string; renk2: string; numara: number }[] = [
  { ad: 'Üç Numara Halil', bonus: 'fiyat', renk1: '#DC2626', renk2: '#FBBF24', numara: 3 },
  { ad: 'Karın Kalecisi', bonus: 'yipranma', renk1: '#E5E7EB', renk2: '#1D4ED8', numara: 1 },
  { ad: 'Gece Yarısı Golcüsü', bonus: 'gecefiyat', renk1: '#111827', renk2: '#A78BFA', numara: 9 },
  { ad: 'Topçu Nevzat', bonus: 'teklif', renk1: '#059669', renk2: '#F9FAFB', numara: 10 },
  { ad: 'Rüzgâr Sami', bonus: 'enerji', renk1: '#0EA5E9', renk2: '#F9FAFB', numara: 7 },
  { ad: 'Fırtına Necmi', bonus: 'derbi', renk1: '#7C2D12', renk2: '#38BDF8', numara: 61 },
  { ad: 'Sol Bek Saadet', bonus: 'sevgi', renk1: '#BE185D', renk2: '#FDF2F8', numara: 3 },
  { ad: 'Kafa Vuruşu Kenan', bonus: 'itibar', renk1: '#F59E0B', renk2: '#1F2937', numara: 4 },
  { ad: 'Penaltıcı Pakize', bonus: 'fiyat', renk1: '#7C3AED', renk2: '#FDE68A', numara: 11 },
  { ad: 'Dripling Doğan', bonus: 'teklif', renk1: '#16A34A', renk2: '#FDE047', numara: 17 },
  { ad: 'Taç Atışı Turgut', bonus: 'kontrol', renk1: '#1E3A8A', renk2: '#F97316', numara: 2 },
  { ad: 'Yağmur Adamı Yaşar', bonus: 'yipranma', renk1: '#334155', renk2: '#93C5FD', numara: 5 },
  { ad: 'Çalım Cemile', bonus: 'sevgi', renk1: '#F43F5E', renk2: '#FFFFFF', numara: 8 },
  { ad: 'Çelik Duvar Celal', bonus: 'kontrol', renk1: '#4B5563', renk2: '#F3F4F6', numara: 6 },
  { ad: 'Kaptan Kâmil', bonus: 'itibar', renk1: '#B91C1C', renk2: '#FFFFFF', numara: 5 },
  { ad: 'Frikik Feride', bonus: 'cay', renk1: '#0F766E', renk2: '#FCD34D', numara: 10 },
  { ad: 'Uzun Top Ufuk', bonus: 'derbi', renk1: '#9A3412', renk2: '#FEF3C7', numara: 23 },
  { ad: 'Ters Köşe Tarık', bonus: 'gecefiyat', renk1: '#0B1220', renk2: '#F59E0B', numara: 99 },
  { ad: 'Son Dakika Selim', bonus: 'enerji', renk1: '#047857', renk2: '#ECFDF5', numara: 90 },
  { ad: 'Çaycı Bekir', bonus: 'cay', renk1: '#78350F', renk2: '#FDE68A', numara: 12 },
];
const NADIRLIK_AD = ['Ev forması', 'Deplasman forması', 'Efsane gece forması'];
const NADIRLIK_DEGER: Record<FormaBonus, number[]> = {
  fiyat: [2, 4, 7], gecefiyat: [4, 8, 14], enerji: [2, 4, 7], cay: [8, 15, 25], sevgi: [1, 1, 2],
  kontrol: [5, 10, 18], itibar: [5, 10, 18], yipranma: [5, 10, 18], derbi: [10, 20, 35], teklif: [4, 8, 14],
};

export const FORMALAR: FormaTanim[] = EFSANELER.flatMap((e, i) =>
  [0, 1, 2].map((n) => ({
    id: `f${i}_${n}`,
    ad: `${e.ad} — ${NADIRLIK_AD[n]}`,
    efsane: e.ad,
    nadirlik: n as 0 | 1 | 2,
    bonus: e.bonus,
    deger: NADIRLIK_DEGER[e.bonus][n],
    renk1: n === 1 ? e.renk2 : e.renk1,
    renk2: n === 1 ? e.renk1 : e.renk2,
    numara: e.numara,
  })),
);
export const NADIRLIK_YAZI = ['Sıradan', 'Nadir', 'Efsane'];
export const NADIRLIK_RENK = ['#94A3B8', '#38BDF8', '#F59E0B'];
export const SET_BONUS_FIYAT = 0.03; // tamamlanan her set +%3 fiyat

// ---------- Giriş serisi ----------
export const SERI_ODULLERI = [
  { yazi: '1.000 ₺', nakit: 1000 },
  { yazi: '+25 enerji', enerji: 25 },
  { yazi: '2.000 ₺', nakit: 2000 },
  { yazi: '+15 itibar', itibar: 15 },
  { yazi: '3.500 ₺', nakit: 3500 },
  { yazi: 'Çay ocağı dolu', cayDolu: true },
  { yazi: 'Nadir forma kutusu', forma: 1 },
] as const;

// ---------- Reklamlar ----------
export const REKLAM_LIMIT: Record<ReklamTuru, number> = {
  gecebekci: 1,
  caymola: 3,
  insaat: 2,
  sponsor: 3,
  mahalletv: 1,
  var: 2,
  menajer: 2,
  gununyildizi: 1,
  kredi: 1,
  seri: 1,
};
export const GECIS_REKLAM_ARALIK_GUN = 3;
export const GECIS_REKLAM_ILK_GUN = 4;

// ---------- Derbi ----------
export const DERBI_SAAT = 21;
export const DERBI_HAKEM = [
  { ad: 'Mahalle hakemi', ucret: 0, kavgaSans: 0.35 },
  { ad: 'Lisanslı hakem', ucret: 1500, kavgaSans: 0.05 },
];
export const DERBI_IKRAM = [
  { ad: 'İkram yok', ucret: 0, sevgi: 0 },
  { ad: 'Çay ve simit', ucret: 800, sevgi: 5 },
  { ad: 'Maç sonu kumpir', ucret: 2000, sevgi: 12 },
];

// ---------- Mahalle ----------
export const MAHALLE_GUNLUK_BONUS = 450; // sahip olunan mahalle başına (şehir çarpanıyla)
export const RAKIP_BASKI = 1.6; // fethedilmemiş mahalleye günlük rakip baskısı

// ---------- Hava ----------
export type HavaTanim = { id: string; ad: string; ikon: string; talep: number; isiticiKoruma: boolean };
export const HAVALAR: Record<string, HavaTanim> = {
  gunesli: { id: 'gunesli', ad: 'Güneşli', ikon: 'sunny', talep: 1.05, isiticiKoruma: false },
  bulutlu: { id: 'bulutlu', ad: 'Bulutlu', ikon: 'cloudy', talep: 1, isiticiKoruma: false },
  yagmur: { id: 'yagmur', ad: 'Yağmurlu', ikon: 'rainy', talep: 0.72, isiticiKoruma: true },
  kar: { id: 'kar', ad: 'Karlı', ikon: 'snow', talep: 0.55, isiticiKoruma: true },
  sicak: { id: 'sicak', ad: 'Kavurucu sıcak', ikon: 'thermometer', talep: 0.85, isiticiKoruma: false },
};
