// ============================================
// BEŞLİ PATRON — constants/sponsorConfig.ts
// Yıldız Saha reklam bandı sponsorları
// ============================================

export type SponsorTanim = {
  id: string;
  ad: string;
  aciklama: string;
  onOdeme: number;
  gunlukGelir: number;
  kosul: { asama?: number; upgrade?: { id: string; seviye: number } };
  renk: string;
  yazi: string;
};

export const MAX_SPONSOR = 3;

export const SPONSORLAR: SponsorTanim[] = [
  {
    id: 'topcuSpor',
    ad: 'Topçu Spor Malzemeleri',
    aciklama: 'Mahallenin eski futbolcusu, mağazasının reklamını formanı giyenlere sattırıyor.',
    onOdeme: 5000,
    gunlukGelir: 250,
    kosul: { asama: 5 },
    renk: '#38BDF8',
    yazi: 'TOPÇU SPOR',
  },
  {
    id: 'kralKahve',
    ad: 'Kral Kahve',
    aciklama: 'Tribünde satılan her kahveden sana pay — taraftar çokça, kahve akıcı.',
    onOdeme: 12000,
    gunlukGelir: 500,
    kosul: { asama: 5, upgrade: { id: 'tribun', seviye: 1 } },
    renk: '#F59E0B',
    yazi: 'KRAL KAHVE',
  },
  {
    id: 'guvenSigorta',
    ad: 'Güven Sigorta',
    aciklama: 'Saha hasarı, oyuncu sakatlığı — güvenin adresi panonda dursun.',
    onOdeme: 30000,
    gunlukGelir: 1100,
    kosul: { asama: 5, upgrade: { id: 'tribun', seviye: 2 } },
    renk: '#34D399',
    yazi: 'GÜVEN SİGORTA',
  },
  {
    id: 'jetTelefon',
    ad: 'Jet Telefon',
    aciklama: 'Gol anı 3 saniyede cebinde. Skorbordun en değerli köşesi onların.',
    onOdeme: 75000,
    gunlukGelir: 2400,
    kosul: { asama: 5, upgrade: { id: 'skorboard', seviye: 2 } },
    renk: '#A78BFA',
    yazi: 'JET TELEFON',
  },
  {
    id: 'aksamEnerji',
    ad: 'Akşam Enerji',
    aciklama: 'Projektörler yandığı her gece onların reklamı parlıyor. Gece maçlarının sponsoru.',
    onOdeme: 150000,
    gunlukGelir: 4200,
    kosul: { asama: 5, upgrade: { id: 'reklam', seviye: 1 } },
    renk: '#EF4444',
    yazi: 'AKŞAM ENERJİ',
  },
];

// Sponsor koşulları sağlanıyor mu? (inşaat aşaması + gerekli saha yükseltmesi)
export function sponsorUygunMu(
  sponsor: SponsorTanim,
  asama: number,
  upgrades?: Record<string, number> | null,
): boolean {
  if (sponsor.kosul.asama != null && asama < sponsor.kosul.asama) return false;
  if (sponsor.kosul.upgrade) {
    const sv = upgrades?.[sponsor.kosul.upgrade.id] ?? 0;
    if (sv < sponsor.kosul.upgrade.seviye) return false;
  }
  return true;
}

export function toplamSponsorGeliri(idler: string[]): number {
  return idler.reduce((top, id) => top + (SPONSORLAR.find((s) => s.id === id)?.gunlukGelir ?? 0), 0);
}

export function sponsorOnOdemesi(id: string): number {
  return SPONSORLAR.find((s) => s.id === id)?.onOdeme ?? 0;
}
