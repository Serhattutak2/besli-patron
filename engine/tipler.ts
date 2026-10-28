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
  durum: 'bekliyor' | 'oynaniyor' | 'bitti';
  skor?: [number, number];
};

export type Teklif = {
  id: string;
  takimId: string;
  saat: number;
  fiyat: number;
  bitisDakika: number; // bu oyun dakikasına kadar cevap verilmeli
  not?: string;
};

export type CanliAn = {
  id: string;
  anId: string;
  rezId: string;
  takimId: string;
  bitisZamani: number; // gerçek zaman (ms)
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
  | 'seri';

export type OyunDurumu = {
  surum: number;
  sehirId: string;
  sehirSira: number;
  gun: number;
  dakika: number; // gün içi dakika: 540 (09:00) .. 1620 (03:00)
  hiz: 1 | 2 | 4;
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
};
