// ============================================
// SAHA BİZİM — engine/tipler.ts
// Oyun durumunun tüm tipleri
// ============================================

export type TakimTipi = 'ofis' | 'ogrenci' | 'esnaf' | 'emekli' | 'aile' | 'amator' | 'kurumsal' | 'kadin' | 'vardiya';

export type SahaTipi = 'mahalle' | 'minikler' | 'akademi' | 'vip' | 'arena';

export type FiyatSeviyesi = 0 | 1 | 2; // ucuz, normal, pahalı

export type Saha = {
  id: string;
  tip: SahaTipi;
  ad: string;
  asama: number; // 0 arsa yok, 1 arsa, 2-4 inşaat, 5 hizmette
  insaatBitisDakika: number | null; // oyun içi mutlak dakika; null = inşaat beklemiyor
  kalite: number; // 1-10 (ondalıklı, maçla yıpranır)
  yukseltmeler: Record<string, number>;
  fiyat: FiyatSeviyesi;
};

export type Rezervasyon = {
  id: string;
  takimId: string;
  sahaId: string;
  saat: number; // 9..26 (26 = 02:00)
  fiyat: number;
  abone: boolean;
  derbi?: boolean;
  ozel?: OzelMac;
  sozlesme?: boolean;
  kupa?: { tur: number; esleme: number };
  final?: boolean;
  lig?: boolean;
  durum: 'bekliyor' | 'oynaniyor' | 'bitti';
  skor?: [number, number];
};

export type OzelMac = 'dugun' | 'hayir' | 'meydan';

export type Teklif = {
  id: string;
  ozel?: OzelMac;
  takimId: string;
  saat: number;
  fiyat: number;
  bitisDakika: number; // bu oyun dakikasına kadar cevap verilmeli
  not?: string;
};

export type CanliAn = {
  id: string;
  anId: string;
  rezId: string; // boş olabilir (sahadan bağımsız hikâye anı)
  takimId: string;
  bitisZamani: number; // gerçek zaman (ms)
  nadir?: boolean;
};

export type TakimDurum = {
  sevgi: number; // 0-100 (her 20 = 1 kalp)
  abone: boolean;
  aboneGun: number; // haftanın günü 0-6
  aboneSaat: number;
  macSayisi: number;
  sonMacGun: number;
};

export type Haber = { gun: number; saat: number; metin: string; tur: 'iyi' | 'kotu' | 'bilgi' };

export type DerbiDurum = {
  gun: number;
  evMahalle: string;
  depMahalle: string;
  evTakim: string;
  depTakim: string;
  hakem: 0 | 1; // 0 mahalle hakemi, 1 lisanslı
  ikram: 0 | 1 | 2;
  hazir: boolean;
  sonuc?: { skor: [number, number]; gelir: number; mesaj: string; forma?: string };
};

export type GunRaporu = {
  gun: number;
  gelir: number;
  cayGeliri: number;
  gider: number;
  kira: number;
  fatura: number;
  maas: number;
  sahaGider: number;
  krediTaksit: number;
  net: number;
  macSayisi: number;
  itibarDegisim: number;
  notlar: string[];
};

export type GeceRaporu = {
  saat: number; // geçen gerçek saat (en fazla bekçi sınırı)
  cay: number;
  abone: number;
  toplam: number;
  bekci: string;
};

export type ReklamTuru =
  | 'gecebekci'
  | 'caymola'
  | 'insaat'
  | 'sponsor'
  | 'mahalletv'
  | 'var'
  | 'menajer'
  | 'gununyildizi'
  | 'kredi'
  | 'seri'
  | 'antrenman';

export type OyunDurumu = {
  surum: number;
  sehirId: string;
  sehirSira: number;
  gun: number;
  dakika: number; // gün içi dakika: 540 (09:00) .. 1620 (03:00)
  hiz: 1 | 2 | 4 | 8;
  duraklat: boolean;
  gunBitti: boolean; // 03:00'e gelindi, rapor bekliyor
  nakit: number;
  enerji: number;
  itibar: number;
  efsaneYildiz: number;
  toplamKazanc: number; // bu şehirde
  tumZamanKazanc: number;
  sahalar: Saha[];
  aktifSahaId: string;
  rezervasyonlar: Rezervasyon[]; // bugünün
  teklifler: Teklif[];
  canliAn: CanliAn | null;
  takimlar: Record<string, TakimDurum>;
  mahalleKontrol: Record<string, number>; // 0-100
  mahalleSahip: Record<string, boolean>;
  cayOcagi: number; // seviye 0-6
  cayBirikim: number;
  personel: Record<string, number>; // seviye
  formalar: string[];
  yeniFormalar: string[]; // görülmemiş
  hava: string;
  derbi: DerbiDurum | null;
  kredi: number; // kalan borç
  krediTaksit: number;
  negatifGun: number;
  // günlük sayaçlar
  bugunReklam: Record<string, number>;
  bugunGelir: number;
  bugunCay: number;
  bugunMac: number;
  bugunItibar: number;
  bugunReklamToplam: number;
  gununYildiziAlindi: boolean;
  sonRapor: GunRaporu | null;
  geceRaporu: GeceRaporu | null;
  // gerçek takvim ve dönüş döngüleri
  sonGirisTarihi: string; // YYYY-MM-DD
  girisSerisi: number;
  seriOdulAlindiTarih: string;
  seriKurtarilabilir: boolean;
  miniOyunTarih: string;
  miniOyunHak: number;
  miniOyunSeri: number;
  miniOyunRekor: number;
  sonKapanis: number; // gerçek zaman ms
  sonGecisReklamGun: number;
  haberler: Haber[];
  hikayeGoruldu: Record<string, boolean>;
  istatistik: { mac: number; derbi: number; derbiGalibiyet: number; anCevap: number; sehirFethi: number };
  rakipEtki: { carpan: number; bitisGun: number; metin: string } | null;
  kurtarmaTeklifi: boolean;
  iflas: boolean;
  bekleyenHikaye: string[];
  reklamTarih: string; // reklam sayaçlarının ait olduğu gerçek gün
  bekleyenOlaylar: { tur: string; metin: string }[]; // ekranda gösterilecek kısa bildirimler
  iliski: Record<string, number>; // tanıdık karakterlerle ilişki (-100..100)
  zincirler: { an: string; gun: number }[]; // bekleyen hikâye devamları
  bayraklar: Record<string, boolean>; // kalıcı hatıralar
  sonAnlar: string[]; // tekrarı önlemek için son görülen anlar
  sozlesme: Sozlesme | null;
  sozlesmeTeklifi: Sozlesme | null;
  kupa: Kupa | null;
  kupaSayisi: number;
  final: BuyukFinal | null;
  finalKazanildi: boolean;
  gorevler: GunlukGorevler;
  sezon: SezonKarti;
  takim: KendiTakim;
  tesisSus: TesisSus;
};

export type Mevki = 'K' | 'D' | 'O' | 'F';
export type Oyuncu = { id: string; ad: string; mevki: Mevki; guc: number; nereden: string; bedel: number };
export type LigTakim = { id: string; ad: string; guc: number; o: number; g: number; b: number; m: number; ag: number; yg: number };
export type LigSonuc = { hafta: number; a: string; b: string; skor: [number, number] };
export type Lig = { sezon: number; hafta: number; takimlar: LigTakim[]; fikstur: [string, string][][]; sonuclar: LigSonuc[]; bitti: boolean; sampiyon?: string };
export type KendiTakim = {
  kuruldu: boolean;
  oyuncular: Oyuncu[];
  adaylar: Oyuncu[];
  adayGun: number;
  antrenmanGun: number;
  lig: Lig | null;
  ligSezon: number;
  sampiyonluk: number;
};
export type TesisSus = { cim: number; tabela: number; bayrak: number; maskot: number; acik: string[] };

export type Sozlesme = {
  id: string;
  firma: string;
  saat: number;
  gunSayisi: number;
  kalanGun: number;
  ucret: number; // maç başı
  bonus: number;
  ceza: number;
  minKalite: number;
};

export type Kupa = {
  baslangic: number; // ilan edildiği gün
  odul: 0 | 1 | 2; // ödül havuzu seviyesi (0 = henüz seçilmedi)
  hazir: boolean;
  takimlar: string[]; // 8 takım
  turlar: { a: string; b: string; kazanan?: string; skor?: [number, number] }[][]; // çeyrek, yarı, final
  sampiyon?: string;
  bitti: boolean;
};

export type BuyukFinal = {
  gun: number;
  hazirlik: { yildiz: boolean; kamp: boolean; taraftar: boolean };
  sonuc?: { kazandik: boolean; skor: [number, number] };
  deneme: number;
};

export type GorevTuru = 'teklif' | 'mac' | 'gelir' | 'bakim' | 'an' | 'mini' | 'cay' | 'yukseltme' | 'reklam' | 'derbi' | 'abone';
export type Gorev = { id: string; tur: GorevTuru; hedef: number; ilerleme: number; xp: number; nakit: number; alindi: boolean };
export type GunlukGorevler = { gun: number; liste: Gorev[]; haftaBas: number; haftaTamam: number; haftaSandikAlindi: boolean };
export type SezonKarti = { no: number; baslangic: number; xp: number; alinan: number[] };
