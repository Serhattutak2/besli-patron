// ============================================
// SAHA BİZİM — engine/anlar.ts
// Canlı maç anları: genel olaylar, şehre özel olaylar, tanıdık karakterler,
// günlere yayılan hikâye zincirleri ve nadir "altın anlar".
// Yer tutucular: {takim} {mahalle} {muhtar} {rakip} {rakipSaha} {cayci} {bekci}
//                {cocuk} {gazeteci} {zabita} {hakem} {sehir} {simge}
// ============================================
import { CANLI_ANLAR as ESKI } from './veri';

export type KarakterId = 'cocuk' | 'gazeteci' | 'zabita' | 'hakem' | 'muhtar' | 'rakip' | 'cayci' | 'bekci';

export type AnEtki = {
  nakit?: number;
  sevgi?: number;
  itibar?: number;
  kontrol?: number;
  enerji?: number;
  kalite?: number;
  forma?: 0 | 1 | 2; // en az bu nadirlikte forma
  iliski?: { kim: KarakterId; d: number };
  zincir?: { an: string; gun: number }; // n gün sonra devam eden olay
  bayrak?: string; // kalıcı hatıra (ör. kedi maskot oldu)
};

export type MiniOyunTuru = 'dokun' | 'yakala' | 'var' | 'pazarlik';

export type AnSecenek = {
  yazi: string;
  etki: AnEtki;
  sonuc: string;
  oyun?: MiniOyunTuru; // bu seçenek kısa bir beceri oyunu açar
  basarisiz?: { etki: AnEtki; sonuc: string }; // oyun kaybedilirse
};

export type SahneTuru =
  | 'top' | 'isik' | 'kavga' | 'yagmur' | 'sakatlik' | 'hirsiz' | 'komsu' | 'hakem' | 'yildiz' | 'pasta'
  | 'izci' | 'kedi' | 'muhtar' | 'casus' | 'su' | 'kamera' | 'para' | 'kar' | 'sicak' | 'kalabalik'
  | 'dugun' | 'cocuk' | 'zabita' | 'gazeteci' | 'deniz' | 'altin' | 'yemek' | 'sis' | 'muzik';

export type CanliAnTanim = {
  id: string;
  baslik: string;
  metin: string;
  kotu: boolean;
  sahne: SahneTuru;
  kosul?: 'gece' | 'yagmur' | 'kameraYok' | 'amator' | 'gunduz';
  sehir?: string[]; // sadece bu şehirlerde
  nadir?: boolean; // altın an
  takip?: boolean; // sadece hikâye zinciriyle gelir
  kim?: KarakterId; // olayın tanıdık karakteri
  bayrakGerek?: string;
  bayrakYok?: string;
  secenekler: AnSecenek[];
  sessiz: AnSecenek;
};

const ESKI_SAHNE: Record<string, SahneTuru> = {
  top_bahce: 'top', isik_sondu: 'isik', kavga: 'kavga', sakatlik: 'sakatlik', yagmur: 'yagmur', hirsiz: 'hirsiz',
  komsu: 'komsu', hakem: 'hakem', yildiz_oyuncu: 'yildiz', dogum_gunu: 'pasta', izci: 'izci', kedi: 'kedi',
  muhtar: 'muhtar', rakip_casus: 'casus', su_bitti: 'su',
};

// Var olan genel anlar; bazılarına beceri oyunu ve hikâye bağlantısı eklendi
const GENEL: CanliAnTanim[] = ESKI.map((a) => {
  const yeni: CanliAnTanim = { ...(a as any), sahne: ESKI_SAHNE[a.id] ?? 'kalabalik' };
  if (a.id === 'kavga') {
    yeni.secenekler = [
      { yazi: 'Araya gir: hızlı dokunarak ayır!', oyun: 'dokun', etki: { sevgi: 4, itibar: 3 }, sonuc: 'Patron otoritesi! Herkes tokalaştı.', basarisiz: { etki: { sevgi: -5, enerji: -6 }, sonuc: 'Ayırmaya çalıştın ama kavga büyüdü.' } },
      ...a.secenekler.slice(1),
    ];
  }
  if (a.id === 'top_bahce') {
    yeni.secenekler = [
      { yazi: 'Topu havada yakala!', oyun: 'yakala', etki: { sevgi: 3, itibar: 2 }, sonuc: 'Top bahçeye düşmeden yakaladın. Tribün alkışladı!', basarisiz: { etki: { nakit: -300, itibar: -1 }, sonuc: 'Kaçırdın, top domateslerin arasına daldı. Bir kasa domates borçlandın.' } },
      ...a.secenekler.slice(1),
    ];
  }
  if (a.id === 'hakem') {
    yeni.secenekler = [
      { yazi: 'Görüntüye bak, sen karar ver', oyun: 'var', etki: { sevgi: 4, itibar: 4 }, sonuc: 'Doğru karar! Herkes kabul etti.', basarisiz: { etki: { sevgi: -4, itibar: -2 }, sonuc: 'Yanlış karar, tartışma büyüdü.' } },
      ...a.secenekler.slice(0, 2),
    ];
  }
  if (a.id === 'kedi') {
    yeni.secenekler = [
      { yazi: 'Kediye mama koy, maskot yap', etki: { nakit: -100, itibar: 4, sevgi: 2, bayrak: 'kedi', zincir: { an: 'kedi_yavrular', gun: 4 } }, sonuc: 'Tesisin artık bir maskotu var: Halı.' },
      ...a.secenekler.slice(1),
    ];
    yeni.bayrakYok = 'kedi';
  }
  if (a.id === 'rakip_casus') {
    yeni.secenekler = [
      { yazi: 'Adamı yakala, telefonuna bak', etki: { enerji: -5, bayrak: 'rakip_sir', zincir: { an: 'rakip_sir', gun: 2 } }, sonuc: 'Telefonda rakibin bir planı vardı. Not aldın.' },
      ...a.secenekler.slice(1),
    ];
  }
  return yeni;
});

// ---------- Tanıdık karakterler ve hikâye zincirleri ----------
const KARAKTER: CanliAnTanim[] = [
  {
    id: 'cocuk_sizdi', baslik: 'Sahaya bir çocuk sızdı', kim: 'cocuk', sahne: 'cocuk', kotu: false, kosul: 'gunduz',
    metin: '{cocuk} tel örgünün altından girmiş, {takim} maçının kenarında top sektiriyor. Ayağı çok iyi.',
    secenekler: [
      { yazi: 'Kovma, izlemesine izin ver', etki: { iliski: { kim: 'cocuk', d: 20 }, zincir: { an: 'cocuk_yetenek', gun: 4 } }, sonuc: '{cocuk} gözlerini sahadan ayırmadı.' },
      { yazi: 'Takıma bir dakika kat', etki: { sevgi: 2, iliski: { kim: 'cocuk', d: 30 }, zincir: { an: 'cocuk_yetenek', gun: 3 } }, sonuc: '{cocuk} ilk topa dokunuşta herkesi çalımladı!' },
      { yazi: 'Dışarı çıkar', etki: { iliski: { kim: 'cocuk', d: -25 } }, sonuc: '{cocuk} boynu bükük gitti.' },
    ],
    sessiz: { yazi: '', etki: { iliski: { kim: 'cocuk', d: 5 } }, sonuc: '{cocuk} kenarda top sektirmeye devam etti.' },
  },
  {
    id: 'cocuk_yetenek', baslik: '{cocuk} geri döndü', takip: true, kim: 'cocuk', sahne: 'cocuk', kotu: false,
    metin: '{cocuk} annesiyle gelmiş. "Patron abi, oğlum sizin sahayı rüyasında görüyor. Akademiye yazılabilir mi?"',
    secenekler: [
      { yazi: 'Bursla akademiye al', etki: { nakit: -1500, itibar: 5, iliski: { kim: 'cocuk', d: 30 }, zincir: { an: 'cocuk_profesyonel', gun: 12 } }, sonuc: '{cocuk} artık senin akademinin öğrencisi.' },
      { yazi: 'Haftada bir bedava saat ver', etki: { nakit: -500, iliski: { kim: 'cocuk', d: 15 }, zincir: { an: 'cocuk_profesyonel', gun: 18 } }, sonuc: 'Annesi gözyaşlarıyla teşekkür etti.' },
      { yazi: 'Şu an imkânımız yok', etki: { iliski: { kim: 'cocuk', d: -15 } }, sonuc: 'Kapıdan üzgün çıktılar.' },
    ],
    sessiz: { yazi: '', etki: { iliski: { kim: 'cocuk', d: -5 } }, sonuc: 'Cevap alamadan gittiler.' },
  },
  {
    id: 'cocuk_profesyonel', baslik: 'Bir efsane doğuyor!', takip: true, kim: 'cocuk', sahne: 'yildiz', kotu: false,
    metin: '{cocuk} büyük bir kulübün altyapısına seçildi! Televizyona çıktı ve "Her şey {sehir}\'deki o halısahada başladı" dedi.',
    secenekler: [
      { yazi: 'Formasını duvara as', etki: { itibar: 20, forma: 2 }, sonuc: '{cocuk} imzalı efsane formasını gönderdi!' },
      { yazi: 'Akademiye adını ver', etki: { itibar: 25, kontrol: 10 }, sonuc: 'Akademinin adı artık mahallede efsane.' },
    ],
    sessiz: { yazi: '', etki: { itibar: 15 }, sonuc: 'Mahalle seninle gurur duyuyor.' },
  },
  {
    id: 'zabita_denetim', baslik: 'Ruhsat denetimi', kim: 'zabita', sahne: 'zabita', kotu: true,
    metin: '{zabita} {takim} maçı sürerken elinde dosyayla geldi: "Yangın tüpünüzün tarihi geçmiş."',
    secenekler: [
      { yazi: 'Cezayı öde, eksiği gider', etki: { nakit: -1200, itibar: 3, iliski: { kim: 'zabita', d: 20 }, zincir: { an: 'muhtar_ovgu', gun: 3 } }, sonuc: '{zabita} "Böyle işletmeci az" dedi.' },
      { yazi: 'Gizlice zarf uzat', etki: { nakit: -700, iliski: { kim: 'zabita', d: -30 }, zincir: { an: 'zabita_sorusturma', gun: 4 } }, sonuc: '{zabita} zarfı aldı ama yüzü asıldı.' },
      { yazi: 'Pazarlık et', oyun: 'pazarlik', etki: { nakit: -500, iliski: { kim: 'zabita', d: 5 } }, sonuc: 'Ceza yarıya indi.', basarisiz: { etki: { nakit: -1800, iliski: { kim: 'zabita', d: -10 } }, sonuc: 'Pazarlık ters tepti, ceza ikiye katlandı.' } },
    ],
    sessiz: { yazi: '', etki: { nakit: -1500, itibar: -3 }, sonuc: 'Kimse ilgilenmeyince ceza kesildi.' },
  },
  {
    id: 'zabita_sorusturma', baslik: 'Soruşturma!', takip: true, kim: 'zabita', sahne: 'zabita', kotu: true,
    metin: 'Zarf meselesi ortaya çıktı. {zabita} ifade verirken senin adını da söylemiş.',
    secenekler: [
      { yazi: 'Avukat tut', etki: { nakit: -3000, itibar: -3 }, sonuc: 'Dosya kapandı ama cebin yandı.' },
      { yazi: 'Özür dile, bağış yap', etki: { nakit: -2000, itibar: 2, kontrol: 3 }, sonuc: 'Mahalle hatanı kabul etmeni takdir etti.' },
    ],
    sessiz: { yazi: '', etki: { nakit: -2500, itibar: -10 }, sonuc: 'Gazetelere düştün.' },
  },
  {
    id: 'muhtar_ovgu', baslik: 'Muhtardan övgü', takip: true, kim: 'muhtar', sahne: 'muhtar', kotu: false,
    metin: '{muhtar} kahvede herkese "Kuralına uyan tek işletme bizim halısaha" demiş.',
    secenekler: [
      { yazi: 'Teşekkür için çay ısmarla', etki: { nakit: -200, kontrol: 8 }, sonuc: 'Kahvede adın övgüyle anılıyor.' },
      { yazi: 'Muhtarı maça davet et', etki: { enerji: -4, kontrol: 10, itibar: 3 }, sonuc: 'Muhtar kaleye geçti, mahalle bayıldı.' },
    ],
    sessiz: { yazi: '', etki: { kontrol: 5 }, sonuc: 'Övgüler mahallede dolaşıyor.' },
  },
  {
    id: 'gazeteci_roportaj', baslik: 'Gazeteci kapıda', kim: 'gazeteci', sahne: 'gazeteci', kotu: false,
    metin: '{gazeteci} "{sehir}\'in yükselen halısahası" diye haber hazırlıyor, {takim} maçını fotoğraflıyor.',
    secenekler: [
      { yazi: 'Tesisi gezdir', etki: { enerji: -4, itibar: 6, iliski: { kim: 'gazeteci', d: 20 }, zincir: { an: 'gazeteci_haber', gun: 2 } }, sonuc: '{gazeteci} defterini doldurdu.' },
      { yazi: 'Rakibi kötüle', etki: { itibar: 3, iliski: { kim: 'gazeteci', d: 5 }, zincir: { an: 'rakip_dava', gun: 3 } }, sonuc: '{gazeteci} "Bunu yazarım" dedi.' },
      { yazi: 'Meşgulüm, sonra', etki: { iliski: { kim: 'gazeteci', d: -15 } }, sonuc: '{gazeteci} kırıldı.' },
    ],
    sessiz: { yazi: '', etki: { iliski: { kim: 'gazeteci', d: -5 } }, sonuc: '{gazeteci} birkaç fotoğraf çekip gitti.' },
  },
  {
    id: 'gazeteci_haber', baslik: 'Gazetede çıktın!', takip: true, kim: 'gazeteci', sahne: 'gazeteci', kotu: false,
    metin: '{gazeteci}\'nin haberi çıktı: "Mahallenin kalbi bu sahada atıyor." Telefonlar susmuyor.',
    secenekler: [
      { yazi: 'Haberi tabelaya as', etki: { itibar: 12 }, sonuc: 'Tabelaya bakan herkes içeri giriyor.' },
      { yazi: 'Bir sponsorla görüş', etki: { nakit: 3500 }, sonuc: 'Haber sayesinde bir sponsor anlaşması imzaladın.' },
    ],
    sessiz: { yazi: '', etki: { itibar: 8 }, sonuc: 'Haber mahallede elden ele dolaşıyor.' },
  },
  {
    id: 'rakip_dava', baslik: '{rakip} öfkeli', takip: true, kim: 'rakip', sahne: 'casus', kotu: true,
    metin: 'Gazetedeki sözlerin {rakip}\'in kulağına gitti. Avukatıyla tehdit mektubu yolladı.',
    secenekler: [
      { yazi: 'Barış için çay davetine git', etki: { enerji: -6, itibar: 2 }, sonuc: '{rakip} homurdandı ama mektubu geri çekti.' },
      { yazi: 'Mahkemede görüşürüz', etki: { nakit: -2500, itibar: 6, kontrol: 4 }, sonuc: 'Davayı kazandın, mahalle arkanda durdu.' },
    ],
    sessiz: { yazi: '', etki: { nakit: -1500 }, sonuc: 'Dava masrafı çıktı.' },
  },
  {
    id: 'hakem_gonullu', baslik: 'Emekli hakem geldi', kim: 'hakem', sahne: 'hakem', kotu: false,
    metin: '{hakem} {takim} maçını izliyor, düdüğü cebinde. "Bu sahada derbileri ben yönetirim" diyor.',
    bayrakYok: 'hakem_dost',
    secenekler: [
      { yazi: 'Kabul! Derbiler artık onun', etki: { nakit: -400, bayrak: 'hakem_dost', iliski: { kim: 'hakem', d: 30 } }, sonuc: '{hakem} derbilerde kavgaları önleyecek.' },
      { yazi: 'Önce bir maç yönetsin', etki: { enerji: -3, sevgi: 3, iliski: { kim: 'hakem', d: 15 } }, sonuc: 'Maç tertemiz geçti.' },
      { yazi: 'Teşekkürler, gerek yok', etki: { iliski: { kim: 'hakem', d: -10 } }, sonuc: '{hakem} omuz silkti.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: '{hakem} maçı izleyip gitti.' },
  },
  {
    id: 'kedi_yavrular', baslik: 'Halı anne oldu!', takip: true, bayrakGerek: 'kedi', sahne: 'kedi', kotu: false,
    metin: 'Maskotun Halı soyunma odasında dört yavru doğurdu. Mahalle çocukları kapıda sıra oldu.',
    secenekler: [
      { yazi: 'Yavruları mahalleye sahiplendir', etki: { kontrol: 8, itibar: 5 }, sonuc: 'Her yavru bir eve gitti, her ev senin müşterin oldu.' },
      { yazi: 'Hepsini tesiste tut', etki: { nakit: -400, sevgi: 4, itibar: 6 }, sonuc: 'Tesis artık kedi cenneti.' },
    ],
    sessiz: { yazi: '', etki: { itibar: 3 }, sonuc: 'Yavrular tesisin neşesi oldu.' },
  },
  {
    id: 'rakip_sir', baslik: 'Rakibin sırrı', takip: true, bayrakGerek: 'rakip_sir', kim: 'rakip', sahne: 'casus', kotu: false,
    metin: '{rakip}\'in planı ortaya çıktı: en sadık takımlarına gizli indirim yapıyor. Bunu kullanabilirsin.',
    secenekler: [
      { yazi: 'Mahalleye duyur', etki: { kontrol: 10, itibar: 3 }, sonuc: 'Takımlar aldatıldıklarını anladı, sana yöneldi.' },
      { yazi: 'Aynı indirimi sen de yap', etki: { nakit: -1500, kontrol: 14 }, sonuc: '{rakipSaha} müşteri kaybediyor.' },
      { yazi: 'Kirli oyuna girmem', etki: { itibar: 8 }, sonuc: 'Mahalle dürüstlüğünü konuşuyor.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Fırsatı kaçırdın.' },
  },
  {
    id: 'bekci_gece', baslik: '{bekci} bir şey gördü', kim: 'bekci', sahne: 'hirsiz', kotu: true, kosul: 'gece',
    metin: '{bekci} fenerini sallayarak koştu: "Patron, tel örgüyü kesmeye çalışan biri var!"',
    secenekler: [
      { yazi: 'Feneri tut, yakala!', oyun: 'yakala', etki: { itibar: 5, iliski: { kim: 'bekci', d: 20 } }, sonuc: 'Hırsızı yakaladınız, polis geldi.', basarisiz: { etki: { nakit: -800 }, sonuc: 'Kaçtı ve tel örgüyü kesmişti bile.' } },
      { yazi: 'Projektörleri sonuna aç', etki: { enerji: -3 }, sonuc: 'Işığı gören kaçtı.' },
      { yazi: 'Bekçiye zam yap', etki: { nakit: -600, iliski: { kim: 'bekci', d: 25 } }, sonuc: '{bekci} artık gözünü kırpmıyor.' },
    ],
    sessiz: { yazi: '', etki: { nakit: -900, kalite: -0.3 }, sonuc: 'Sabah tel örgüde koca bir delik vardı.' },
  },
  {
    id: 'cayci_fikir', baslik: '{cayci}\'nın fikri', kim: 'cayci', sahne: 'yemek', kotu: false,
    metin: '{cayci}: "Patron, maç sonu {simge} satsak? Takımlar bayılır."',
    secenekler: [
      { yazi: 'Dene bakalım', etki: { nakit: -500, sevgi: 3, zincir: { an: 'cayci_basari', gun: 3 } }, sonuc: '{cayci} tezgâhı kurdu.' },
      { yazi: 'Bütçe yok', etki: { iliski: { kim: 'cayci', d: -10 } }, sonuc: '{cayci} söylene söylene çay demledi.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Fikir unutuldu.' },
  },
  {
    id: 'cayci_basari', baslik: '{simge} kapış kapış!', takip: true, kim: 'cayci', sahne: 'yemek', kotu: false,
    metin: '{cayci}\'nın {simge} tezgâhı mahallenin yeni durağı oldu. Sırf onun için gelen var.',
    secenekler: [
      { yazi: 'Kârı paylaş', etki: { nakit: 2500, iliski: { kim: 'cayci', d: 20 } }, sonuc: 'Kasa da {cayci} da mutlu.' },
      { yazi: 'Tabelaya yaz', etki: { itibar: 8 }, sonuc: '"Meşhur {simge}" yazısı herkesi çekiyor.' },
    ],
    sessiz: { yazi: '', etki: { nakit: 1500 }, sonuc: 'Tezgâh kendi kendine kazandırdı.' },
  },
];

// ---------- Şehre özel anlar ----------
const S = (sehir: string, a: Omit<CanliAnTanim, 'sehir'>): CanliAnTanim => ({ ...a, sehir: [sehir] });

const SEHIRE_OZEL: CanliAnTanim[] = [
  // İSTANBUL
  S('istanbul', {
    id: 'ist_dizi', baslik: 'Dizi ekibi sahada!', sahne: 'kamera', kotu: false,
    metin: 'Bir dizi ekibi sahnelerini senin sahanda çekmek istiyor. Başrol oyuncusu kenarda selfie veriyor.',
    secenekler: [
      { yazi: 'Sahayı kirala', etki: { nakit: 4000, sevgi: -4 }, sonuc: 'Çekim için {takim} maçı yarıda kaldı ama kasa doldu.' },
      { yazi: 'Maç bitsin, sonra çekin', etki: { nakit: 2000, sevgi: 2, itibar: 3 }, sonuc: 'Herkes mutlu, dizide sahan göründü.' },
      { yazi: 'Takıma figüranlık ayarla', etki: { sevgi: 8, itibar: 6, zincir: { an: 'ist_dizi_yayin', gun: 5 } }, sonuc: '{takim} dizide oynayacak!' },
    ],
    sessiz: { yazi: '', etki: { nakit: 1000 }, sonuc: 'Ekip birkaç plan çekip gitti.' },
  }),
  S('istanbul', {
    id: 'ist_dizi_yayin', baslik: 'Dizi yayında!', takip: true, sahne: 'kamera', kotu: false,
    metin: 'Dün akşamki bölümde senin saha göründü. Sosyal medyada "Bu halısaha nerede?" diye soruyorlar.',
    secenekler: [
      { yazi: '"Dizinin sahası" tabelası as', etki: { itibar: 15, kontrol: 5 }, sonuc: 'Turistler bile fotoğraf çekmeye geliyor.' },
      { yazi: 'Hayran turnuvası düzenle', etki: { nakit: 3500, enerji: -6 }, sonuc: 'Hayranlar sahayı doldurdu.' },
    ],
    sessiz: { yazi: '', etki: { itibar: 8 }, sonuc: 'Ün kendi kendine yayıldı.' },
  }),
  S('istanbul', {
    id: 'ist_vapur', baslik: 'Vapuru kaçırdılar', sahne: 'deniz', kotu: false,
    metin: '{takim} oyuncuları son vapuru kaçırdı, Anadolu yakasına dönemiyorlar.',
    secenekler: [
      { yazi: 'Bir saat bedava uzat', etki: { nakit: -700, sevgi: 8 }, sonuc: 'Gece yarısı maçı unutulmaz oldu.' },
      { yazi: 'Taksi ayarla', etki: { nakit: -400, sevgi: 5 }, sonuc: 'Evlerine güvenle döndüler.' },
      { yazi: 'Kendi bilecekleri iş', etki: { sevgi: -3 }, sonuc: 'Söylene söylene köprüye yürüdüler.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -2 }, sonuc: 'Kendi yollarını buldular.' },
  }),
  S('istanbul', {
    id: 'ist_lodos', baslik: 'Lodos çıktı!', sahne: 'yagmur', kotu: true,
    metin: 'Lodos tel örgüyü sallıyor, reklam panosu sökülmek üzere.',
    secenekler: [
      { yazi: 'Panoyu sabitle!', oyun: 'dokun', etki: { itibar: 2 }, sonuc: 'Pano yerinde kaldı.', basarisiz: { etki: { nakit: -900 }, sonuc: 'Pano uçtu, yenisi lazım.' } },
      { yazi: 'Maçı durdur', etki: { sevgi: -2 }, sonuc: 'Rüzgâr dinince maç sürdü.' },
    ],
    sessiz: { yazi: '', etki: { nakit: -1200, kalite: -0.2 }, sonuc: 'Pano halının üstüne devrildi.' },
  }),
  S('istanbul', {
    id: 'ist_simitci', baslik: 'Simitçi tezgâh açtı', sahne: 'yemek', kotu: false,
    metin: 'Bir simitçi kapının önüne tezgâh kurdu, {takim} oyuncuları devre arasında kuyrukta.',
    secenekler: [
      { yazi: 'Ortaklık teklif et', etki: { nakit: 800, sevgi: 2 }, sonuc: 'Her simitten pay alıyorsun.' },
      { yazi: 'Çay ocağıyla rekabet ediyor, gönder', etki: { iliski: { kim: 'cayci', d: 10 } }, sonuc: '{cayci} rahatladı.' },
      { yazi: 'Takıma simit ısmarla', etki: { nakit: -250, sevgi: 5 }, sonuc: 'Simit ve çay, maçın en güzel kısmı oldu.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Simitçi akşama kadar sattı.' },
  }),
  S('istanbul', {
    id: 'ist_trafik', baslik: 'Köprü trafiği', sahne: 'kalabalik', kotu: true,
    metin: '{takim} köprüde trafiğe takıldı, maça 25 dakika geç kalacaklar.',
    secenekler: [
      { yazi: 'Süreyi uzat', etki: { nakit: -500, sevgi: 5 }, sonuc: 'Tam süre oynadılar.' },
      { yazi: 'Ücretten indirim yap', etki: { nakit: -300, sevgi: 3 }, sonuc: 'Anlayışına teşekkür ettiler.' },
      { yazi: 'Saat saattir', etki: { sevgi: -4, itibar: 1 }, sonuc: 'Kısa maç, uzun yüzler.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -3 }, sonuc: 'Kısa bir maç oldu.' },
  }),
  S('istanbul', {
    id: 'ist_ezan', baslik: 'Akşam ezanı', sahne: 'muzik', kotu: false, kosul: 'gece',
    metin: 'Ezan okunurken {takim} oyuncuları saygıyla durdu. Yaşlı bir amca sana teşekkür etti.',
    secenekler: [
      { yazi: 'Maç sonu herkese çay', etki: { nakit: -200, kontrol: 4, sevgi: 2 }, sonuc: 'Mahallenin büyükleri seni sevdi.' },
      { yazi: 'Amcayla sohbet et', etki: { enerji: -3, kontrol: 5 }, sonuc: 'Amca eski Beşli günlerini hatırlattı.' },
    ],
    sessiz: { yazi: '', etki: { kontrol: 1 }, sonuc: 'Güzel bir an oldu.' },
  }),
  // ANKARA
  S('ankara', {
    id: 'ank_protokol', baslik: 'Bakanlık turnuvası', sahne: 'kalabalik', kotu: false,
    metin: 'Bir bakanlığın spor müdürü "Kurumlar arası turnuvayı burada yapalım ama protokol kusursuz olacak" diyor.',
    secenekler: [
      { yazi: 'Kırmızı halı, bayraklar!', etki: { nakit: -1500, itibar: 10, zincir: { an: 'ank_protokol_gun', gun: 3 } }, sonuc: 'Hazırlıklar başladı.' },
      { yazi: 'Sade ve düzgün yaparız', etki: { nakit: -500, itibar: 4, zincir: { an: 'ank_protokol_gun', gun: 3 } }, sonuc: 'Müdür ikna oldu.' },
      { yazi: 'Bu bize göre değil', etki: {}, sonuc: 'Turnuva {rakipSaha}\'ne gitti.' },
    ],
    sessiz: { yazi: '', etki: { itibar: -2 }, sonuc: 'Müdür cevap alamayınca gitti.' },
  }),
  S('ankara', {
    id: 'ank_protokol_gun', baslik: 'Turnuva günü', takip: true, sahne: 'kalabalik', kotu: false,
    metin: 'Takım elbiseli yöneticiler sahada. Biri ayakkabısını çıkarmadan halıya bastı, kalite müdürü kaşlarını çattı.',
    secenekler: [
      { yazi: 'Krampon dağıt, sorun çöz', etki: { nakit: 4000, itibar: 10 }, sonuc: 'Turnuva kusursuz geçti; ücret ve teşekkür plaketi aldın.' },
      { yazi: 'Kurallar herkes için geçerli', etki: { itibar: 6, sevgi: -2 }, sonuc: 'Müdür önce bozuldu, sonra saygı duydu.' },
    ],
    sessiz: { yazi: '', etki: { kalite: -0.5 }, sonuc: 'Halı biraz zarar gördü ama turnuva bitti.' },
  }),
  S('ankara', {
    id: 'ank_ayaz', baslik: 'Ankara ayazı', sahne: 'kar', kotu: true, kosul: 'gece',
    metin: 'Termometre eksi sekizi gösteriyor. {takim} oyuncularının nefesi buhar olmuş.',
    secenekler: [
      { yazi: 'Sıcak salep ikram et', etki: { nakit: -300, sevgi: 6 }, sonuc: 'Salep içen herkes yeniden ısındı.' },
      { yazi: 'Isıtıcıları sonuna aç', etki: { nakit: -500, sevgi: 4 }, sonuc: 'Saha buhar buhar ama sıcacık.' },
      { yazi: 'Futbol ısıtır!', etki: { sevgi: -3 }, sonuc: 'Maç bitince herkes donmuştu.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -4 }, sonuc: 'Takım titreyerek ayrıldı.' },
  }),
  S('ankara', {
    id: 'ank_cevdet_oglu', baslik: 'Rakibin oğlu kapıda', sahne: 'casus', kotu: false, kim: 'rakip',
    metin: '{rakip}\'in oğlu iş istemeye gelmiş: "Babamla anlaşamıyorum. Sizin yanınızda çalışmak istiyorum."',
    secenekler: [
      { yazi: 'İşe al', etki: { nakit: -1000, kontrol: 6, zincir: { an: 'ank_cevdet_baris', gun: 6 } }, sonuc: 'Genç çocuk çok hevesli.' },
      { yazi: 'Babanla barış önce', etki: { itibar: 6 }, sonuc: 'Çocuk düşünceli ayrıldı.' },
      { yazi: 'Casus olabilir, reddet', etki: {}, sonuc: 'Kapıdan döndü.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Cevap bekleyip gitti.' },
  }),
  S('ankara', {
    id: 'ank_cevdet_baris', baslik: '{rakip} barış istiyor', takip: true, kim: 'rakip', sahne: 'muhtar', kotu: false,
    metin: 'Oğlunun senin yanında mutlu olduğunu gören {rakip} bir kutu baklavayla geldi.',
    secenekler: [
      { yazi: 'Elini sık', etki: { itibar: 10, kontrol: 8 }, sonuc: 'Ankara\'nın iki patronu barıştı, mahalleler sevindi.' },
      { yazi: 'Rekabet sürer ama saygıyla', etki: { itibar: 6 }, sonuc: '{rakip} gülümsedi.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Baklava masada kaldı.' },
  }),
  S('ankara', {
    id: 'ank_memur_mesai', baslik: 'Mesai uzadı', sahne: 'kalabalik', kotu: true,
    metin: '{takim} kaptanı arıyor: "Toplantı uzadı, yarım saat geç geleceğiz, saati kaydırabilir misin?"',
    secenekler: [
      { yazi: 'Kaydır', etki: { sevgi: 6, enerji: -3 }, sonuc: 'Takım minnettar.' },
      { yazi: 'Kaydıramam ama indirim yaparım', etki: { nakit: -300, sevgi: 3 }, sonuc: 'Kısa ama keyifli maç.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -3 }, sonuc: 'Cevap alamadılar, sitem ettiler.' },
  }),
  S('ankara', {
    id: 'ank_simit_cay', baslik: 'Simit-çay devre arası', sahne: 'yemek', kotu: false,
    metin: '{cayci} devre arasında sahaya simitle çay taşıyor. Herkes "Ankara\'nın en iyi devre arası" diyor.',
    secenekler: [
      { yazi: 'Bunu gelenek yap', etki: { nakit: -200, sevgi: 4, itibar: 3 }, sonuc: 'Simitli devre arası markan oldu.' },
      { yazi: 'Ücretli yap', etki: { nakit: 400 }, sonuc: 'Kasa biraz kabardı.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: 1 }, sonuc: 'Çaylar içildi.' },
  }),
  // İZMİR
  S('izmir', {
    id: 'izm_boyoz', baslik: 'Boyoz yarışması', sahne: 'yemek', kotu: false,
    metin: 'İki fırıncı kapıda "En iyi boyoz bizimki" diye tartışıyor. {takim} hakem olmak istiyor.',
    secenekler: [
      { yazi: 'Maç sonu tadım yarışması!', etki: { nakit: -200, sevgi: 6, itibar: 4 }, sonuc: 'Saha boyoz kokusuyla doldu.' },
      { yazi: 'İkisiyle de anlaş', etki: { nakit: 900 }, sonuc: 'İki fırın da çay ocağına boyoz veriyor.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Tartışma sokakta sürdü.' },
  }),
  S('izmir', {
    id: 'izm_imbat', baslik: 'İmbat esti', sahne: 'deniz', kotu: false, kosul: 'gece',
    metin: 'Denizden gelen serin imbat sahayı ferahlattı. {takim} "Bu saha bambaşka" diyor.',
    secenekler: [
      { yazi: 'Akşam maçlarını öne çıkar', etki: { itibar: 4, sevgi: 3 }, sonuc: '"İmbatlı saha" diye anılıyorsun.' },
      { yazi: 'Takıma soğuk limonata', etki: { nakit: -200, sevgi: 5 }, sonuc: 'Limonata ve imbat, mükemmel ikili.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: 1 }, sonuc: 'Güzel bir akşamdı.' },
  }),
  S('izmir', {
    id: 'izm_dugun', baslik: 'Düğün maçı!', sahne: 'dugun', kotu: false,
    metin: 'Karşıyakalı damat ile Bornovalı gelin tarafı düğünden önce maç yapmak istiyor. Davul zurna hazır!',
    secenekler: [
      { yazi: 'Sahayı süsle', etki: { nakit: -600, sevgi: 8, itibar: 6, kontrol: 4 }, sonuc: 'Maç da düğün de efsane oldu.' },
      { yazi: 'Hakemliği sen yap', etki: { enerji: -6, kontrol: 6 }, sonuc: 'Berabere bitirdin, iki taraf da mutlu.' },
      { yazi: 'Normal ücret', etki: { nakit: 800 }, sonuc: 'Davul sesleri gece boyu sürdü.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Düğün maçı kendiliğinden yapıldı.' },
  }),
  S('izmir', {
    id: 'izm_kordon', baslik: 'Kordon festivali', sahne: 'muzik', kotu: true,
    metin: 'Kordon\'daki festival yüzünden yollar kapandı, {takim} oyuncularının yarısı gelemiyor.',
    secenekler: [
      { yazi: 'Eksik oyuncuya {cocuk}\'ları kat', etki: { sevgi: 4, iliski: { kim: 'cocuk', d: 15 } }, sonuc: 'Mahalle çocukları maçın yıldızı oldu.' },
      { yazi: 'Maçı ertele', etki: { nakit: -400, sevgi: 3 }, sonuc: 'Yarına bedava saat verdin.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -3 }, sonuc: 'Eksik kadro sıkıcı bir maç çıkardı.' },
  }),
  S('izmir', {
    id: 'izm_kumru', baslik: 'Kumrucu geldi', sahne: 'yemek', kotu: false,
    metin: 'Çeşmeli bir kumrucu, maç sonu sıcak kumru satmak için izin istiyor.',
    secenekler: [
      { yazi: 'İzin ver, pay al', etki: { nakit: 700 }, sonuc: 'Kumru kokusu müşteri getiriyor.' },
      { yazi: 'Takıma ısmarla', etki: { nakit: -300, sevgi: 6 }, sonuc: 'Kumrular bir anda bitti.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Kumrucu başka yere gitti.' },
  }),
  S('izmir', {
    id: 'izm_vapur_yarisi', baslik: 'Körfez meydan okuması', sahne: 'deniz', kotu: false,
    metin: '{takim} kaptanı: "Karşıyakalılar maçı kaybeden vapurda şarkı söylesin diyor. Sen şahit ol."',
    secenekler: [
      { yazi: 'Şahit oluyorum!', etki: { sevgi: 5, itibar: 5 }, sonuc: 'Kaybedenlerin vapur konseri sosyal medyada patladı.' },
      { yazi: 'Ödülü ben koyarım', etki: { nakit: -500, sevgi: 7, kontrol: 3 }, sonuc: 'Kupa senin adını taşıyor.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'İddia kendi aralarında kaldı.' },
  }),
  // ANTALYA
  S('antalya', {
    id: 'ant_turist', baslik: 'Turist kafilesi', sahne: 'kalabalik', kotu: false,
    metin: 'Otelden gelen 20 kişilik bir turist grubu oynamak istiyor ama kimse Türkçe bilmiyor.',
    secenekler: [
      { yazi: 'Tercüman bul', etki: { nakit: 3000, enerji: -5 }, sonuc: 'Turistler bahşişle ayrıldı.' },
      { yazi: 'El kol hareketleriyle anlaş', oyun: 'pazarlik', etki: { nakit: 2500, itibar: 3 }, sonuc: 'Kahkahalarla anlaştınız!', basarisiz: { etki: { nakit: 600 }, sonuc: 'Yanlış anlaşıldın, yarı fiyata oynadılar.' } },
      { yazi: 'Yerlilere ayrılmış', etki: { kontrol: 3 }, sonuc: 'Mahalle sadakatine sevindi.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Kafile otele geri döndü.' },
  }),
  S('antalya', {
    id: 'ant_sicak', baslik: '42 derece!', sahne: 'sicak', kotu: true, kosul: 'gunduz',
    metin: 'Halı yanıyor. {takim} oyuncuları top yerine gölge kovalıyor.',
    secenekler: [
      { yazi: 'Hortumla halıyı sula', etki: { enerji: -5, sevgi: 5 }, sonuc: 'Serinleyen oyuncular bayram etti.' },
      { yazi: 'Buz gibi ayran dağıt', etki: { nakit: -250, sevgi: 5 }, sonuc: 'Ayran molası maçı kurtardı.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -4, kalite: -0.2 }, sonuc: 'Sıcak hem halıyı hem takımı yordu.' },
  }),
  S('antalya', {
    id: 'ant_animator', baslik: 'Animatör şovu', sahne: 'muzik', kotu: false, kosul: 'gece',
    metin: 'Otel animatörleri maç arasında dans gösterisi yapmak istiyor. Tribün dolmuş!',
    secenekler: [
      { yazi: 'Sahne senin!', etki: { itibar: 6, sevgi: 3 }, sonuc: 'Gece eğlenceye döndü.' },
      { yazi: 'Bilet satalım', etki: { nakit: 1800 }, sonuc: 'Tribün dolu, kasa dolu.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Gösteri kısa sürdü.' },
  }),
  S('antalya', {
    id: 'ant_portakal', baslik: 'Portakal hasadı', sahne: 'yemek', kotu: false,
    metin: 'Komşu bahçe sahibi hasat bitince bir kamyon portakal getirdi: "Sahanın gürültüsü için kusura bakma, ben de seviyorum."',
    secenekler: [
      { yazi: 'Takımlara taze sıkma dağıt', etki: { sevgi: 6 }, sonuc: 'Taze portakal suyu maçın en güzel kısmı.' },
      { yazi: 'Çay ocağında sat', etki: { nakit: 900 }, sonuc: 'Portakal suyu kapış kapış.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Portakallar kasada kaldı.' },
  }),
  S('antalya', {
    id: 'ant_rus_takim', baslik: 'Yabancı takım meydan okudu', sahne: 'kavga', kotu: false,
    metin: 'Tatile gelmiş bir yabancı amatör takım, mahallenin en iyi takımına meydan okuyor.',
    secenekler: [
      { yazi: 'Mahalle karması kur', etki: { enerji: -6, kontrol: 6, itibar: 6 }, sonuc: 'Mahalle karması 7-4 kazandı!' },
      { yazi: 'Dostluk maçı, sonra mangal', etki: { nakit: -600, itibar: 8 }, sonuc: 'Kardeşlik maçı oldu.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Maç olmadı.' },
  }),
  S('antalya', {
    id: 'ant_kum', baslik: 'Kumlu ayakkabılar', sahne: 'su', kotu: true,
    metin: '{takim} plajdan direkt gelmiş, halının içi kum doldu.',
    secenekler: [
      { yazi: 'Kapıya ayakkabı yıkama koy', etki: { nakit: -400, kalite: 0.2 }, sonuc: 'Sorun kökten çözüldü.' },
      { yazi: 'Maç sonu süpür', etki: { enerji: -5 }, sonuc: 'Halı temizlendi.' },
    ],
    sessiz: { yazi: '', etki: { kalite: -0.4 }, sonuc: 'Kum halıyı aşındırdı.' },
  }),
  // TRABZON
  S('trabzon', {
    id: 'trb_hamsi', baslik: 'Hamsi festivali', sahne: 'yemek', kotu: false,
    metin: 'Balıkçılar maç sonu sahada hamsi tava yapmak istiyor. Koku tüm mahalleye yayılacak!',
    secenekler: [
      { yazi: 'Mangalları yak!', etki: { nakit: -500, sevgi: 7, kontrol: 5 }, sonuc: 'Hamsi şöleni mahallenin gündemi oldu.' },
      { yazi: 'Satış yapalım', etki: { nakit: 1500 }, sonuc: 'Hamsi tava kasaya yaradı.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Balıkçılar limana döndü.' },
  }),
  S('trabzon', {
    id: 'trb_sel', baslik: 'Sağanak ve sel!', sahne: 'yagmur', kotu: true,
    metin: 'Karadeniz yağmuru durmuyor, sahanın bir köşesi göle döndü.',
    secenekler: [
      { yazi: 'Kanalı aç, suyu tahliye et', oyun: 'dokun', etki: { itibar: 3 }, sonuc: 'Su çekildi, maç devam!', basarisiz: { etki: { kalite: -0.6 }, sonuc: 'Su halıya işledi.' } },
      { yazi: 'Maçı durdur, para iade', etki: { nakit: -800, sevgi: 3 }, sonuc: 'Takım anlayışla karşıladı.' },
      { yazi: 'Yağmurda oynamak Karadenizlidir', etki: { sevgi: 3, kalite: -0.3 }, sonuc: 'Çamur futbolu efsane oldu.' },
    ],
    sessiz: { yazi: '', etki: { kalite: -0.6, sevgi: -2 }, sonuc: 'Saha su altında kaldı.' },
  }),
  S('trabzon', {
    id: 'trb_horon', baslik: 'Maç sonu horon', sahne: 'muzik', kotu: false,
    metin: '{takim} kazanınca biri kemençeyi çıkardı. Herkes sahada horon tepmeye hazır!',
    secenekler: [
      { yazi: 'Sen de katıl!', etki: { enerji: -5, sevgi: 7, kontrol: 4 }, sonuc: 'Patron horonda bile önde!' },
      { yazi: 'Video çekip paylaş', etki: { itibar: 8 }, sonuc: 'Horon videosu herkesin telefonunda.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: 2 }, sonuc: 'Horon gece yarısına kadar sürdü.' },
  }),
  S('trabzon', {
    id: 'trb_tartisma', baslik: 'Tribün tartışması', sahne: 'kavga', kotu: true,
    metin: 'Kenarda izleyen iki dayı, dünkü profesyonel maçı yüzünden birbirine girdi.',
    secenekler: [
      { yazi: 'İkisine de çay koy', etki: { nakit: -150, kontrol: 3 }, sonuc: 'Çay içince futbolu bırakıp hamsi konuştular.' },
      { yazi: 'Araya gir: hızlı dokun!', oyun: 'dokun', etki: { itibar: 4 }, sonuc: 'Dayıları ayırdın, tokalaştılar.', basarisiz: { etki: { itibar: -2, enerji: -4 }, sonuc: 'Tartışma büyüdü, sen de laf işittin.' } },
    ],
    sessiz: { yazi: '', etki: { itibar: -2 }, sonuc: 'Tartışma maçı gölgede bıraktı.' },
  }),
  S('trabzon', {
    id: 'trb_yayla', baslik: 'Yayladan misafir', sahne: 'kalabalik', kotu: false,
    metin: 'Yayladan inen bir aile, çocuklarına saha göstermek istiyor. Ellerinde tereyağı ve peynir hediye.',
    secenekler: [
      { yazi: 'Çocuklara saha senin', etki: { nakit: -300, kontrol: 5, itibar: 3 }, sonuc: 'Çocuklar ilk kez halısahada oynadı.' },
      { yazi: 'Hediyeyi kabul et, teşekkür et', etki: { sevgi: 2 }, sonuc: 'Tereyağı çay ocağının yıldızı oldu.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Aile bir süre izleyip gitti.' },
  }),
  S('trabzon', {
    id: 'trb_sis', baslik: 'Sis bastı', sahne: 'sis', kotu: true,
    metin: 'Denizden gelen sis sahayı yuttu. Kaleyi göremeyen {takim} kendi kalesine gol attı.',
    secenekler: [
      { yazi: 'Projektörleri aç', etki: { nakit: -200, sevgi: 3 }, sonuc: 'Işıkla sis dağıldı.' },
      { yazi: 'Sis maçı da bir deneyim', etki: { sevgi: 2, itibar: 3 }, sonuc: 'Efsanevi "sis maçı" konuşuluyor.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -2 }, sonuc: 'Maç göremeden bitti.' },
  }),
  // BERLİN
  S('berlin', {
    id: 'ber_dugun', baslik: 'Gurbet düğünü maçı', sahne: 'dugun', kotu: false,
    metin: 'Kreuzberg\'de bir düğün var. Damadın arkadaşları düğünden önce son bir maç istiyor.',
    secenekler: [
      { yazi: 'Davulcuyu çağır!', etki: { nakit: -500, sevgi: 8, kontrol: 5 }, sonuc: 'Düğün sahada başladı.' },
      { yazi: 'Damada hediye saat', etki: { nakit: -900, itibar: 8 }, sonuc: 'Tüm düğün salonu senden bahsediyor.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Maç oynandı, düğüne gittiler.' },
  }),
  S('berlin', {
    id: 'ber_evrak', baslik: 'Almanca evrak', sahne: 'zabita', kim: 'zabita', kotu: true,
    metin: '{zabita} üç sayfalık bir form uzattı. İçinde "Lärmschutz" yazıyor ve kimse bir şey anlamıyor.',
    secenekler: [
      { yazi: '{cocuk}\'tan tercüme iste', etki: { iliski: { kim: 'cocuk', d: 15 }, itibar: 2 }, sonuc: '{cocuk} formu iki dakikada doldurdu.' },
      { yazi: 'Danışman tut', etki: { nakit: -1200 }, sonuc: 'Her şey usulüne uygun.' },
      { yazi: 'Sonra hallederim', etki: { zincir: { an: 'zabita_sorusturma', gun: 3 } }, sonuc: 'Form çekmecede kaldı.' },
    ],
    sessiz: { yazi: '', etki: { nakit: -800 }, sonuc: 'Gecikme cezası geldi.' },
  }),
  S('berlin', {
    id: 'ber_dede', baslik: 'Memleketten gelen dede', sahne: 'muhtar', kotu: false,
    metin: '{takim} oyuncusunun dedesi Konya\'dan gelmiş. "Torunumu oynarken görmeden dönmem" diyor.',
    secenekler: [
      { yazi: 'Dedeye en iyi koltuk', etki: { sevgi: 6, kontrol: 3 }, sonuc: 'Torun dedesinin önünde iki gol attı!' },
      { yazi: 'Dedeye bir dakika oynat', etki: { sevgi: 9, itibar: 5 }, sonuc: 'Dede topa vurdu, saha ayağa kalktı.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: 2 }, sonuc: 'Dede gururla izledi.' },
  }),
  S('berlin', {
    id: 'ber_doner', baslik: 'Dönerci rekabeti', sahne: 'yemek', kotu: false,
    metin: 'İki dönerci, maç sonu hangisinin dönerinin ikram edileceği için kapıda tartışıyor.',
    secenekler: [
      { yazi: 'Kör tadım yap', etki: { sevgi: 5, itibar: 4 }, sonuc: 'Kazanan dönerci artık sponsorun.' },
      { yazi: 'İkisiyle anlaş', etki: { nakit: 1100 }, sonuc: 'İki döner, iki gelir.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Tartışma sokakta sürdü.' },
  }),
  S('berlin', {
    id: 'ber_kar', baslik: 'Berlin kışı', sahne: 'kar', kotu: true,
    metin: 'Bir gecede 20 santim kar yağdı. {takim} kürekle geldi.',
    secenekler: [
      { yazi: 'Hep birlikte kar küre', etki: { enerji: -8, sevgi: 7 }, sonuc: 'Kar küreme maçtan eğlenceli geçti.' },
      { yazi: 'Kar makinesi kirala', etki: { nakit: -900, sevgi: 3 }, sonuc: 'Saha yarım saatte açıldı.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -3, kalite: -0.2 }, sonuc: 'Karla maç zor oldu.' },
  }),
  S('berlin', {
    id: 'ber_milli', baslik: 'Milli maç gecesi', sahne: 'kalabalik', kotu: false, kosul: 'gece',
    metin: 'Bu akşam milli maç var. {takim} maç bitince sahadaki dev ekranda izlemek istiyor.',
    secenekler: [
      { yazi: 'Ekranı aç, bayrakları as', etki: { nakit: -400, kontrol: 8, itibar: 5 }, sonuc: 'Gurbet sahası bayram yerine döndü.' },
      { yazi: 'Bilet sat', etki: { nakit: 2200 }, sonuc: 'Tribün tıklım tıklım.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Herkes evine gitti.' },
  }),
  // LONDRA
  S('londra', {
    id: 'lon_sis', baslik: 'Londra sisi', sahne: 'sis', kotu: true,
    metin: 'Sis öyle yoğun ki {takim} kaleciyi bulamıyor.',
    secenekler: [
      { yazi: 'Turuncu top getir', etki: { nakit: -150, sevgi: 4 }, sonuc: 'Turuncu top sisin içinde parladı.' },
      { yazi: 'Sis maçı efsanedir', etki: { itibar: 4 }, sonuc: '"Sisli gece kupası" doğdu.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -2 }, sonuc: 'Kimse kimseyi görmedi.' },
  }),
  S('londra', {
    id: 'lon_pub', baslik: 'Pub takımı meydan okudu', sahne: 'kavga', kotu: false,
    metin: 'Köşedeki pubın takımı "Sizin mahalle takımlarını yeneriz" diye bahse girdi.',
    secenekler: [
      { yazi: 'Kabul! Mahalle karması kur', etki: { enerji: -6, kontrol: 7, itibar: 5 }, sonuc: 'Mahalle karması kazandı, pub sahibi tebrik etti.' },
      { yazi: 'Kaybeden ikram etsin', etki: { sevgi: 5, nakit: 600 }, sonuc: 'Kaybeden pub çay ocağına sponsor oldu.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Bahis kendi aralarında kaldı.' },
  }),
  S('londra', {
    id: 'lon_tavla', baslik: 'Tavla turnuvası', sahne: 'muhtar', kotu: false,
    metin: '{hakem} maç kenarında tavla turnuvası kurmuş. Kıbrıslı dayılar sıraya girmiş.',
    secenekler: [
      { yazi: 'Turnuvaya ödül koy', etki: { nakit: -400, kontrol: 6 }, sonuc: 'Tavla şakırtısı tesisin müziği oldu.' },
      { yazi: 'Sen de oyna', etki: { enerji: -4, iliski: { kim: 'hakem', d: 20 }, itibar: 3 }, sonuc: '{hakem}\'i mars ettin!' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Zarlar gece boyu atıldı.' },
  }),
  S('londra', {
    id: 'lon_yagmur', baslik: 'Bitmeyen yağmur', sahne: 'yagmur', kotu: true,
    metin: 'Yine yağmur. {takim} kaptanı "Bu şehirde güneş masal" diyor.',
    secenekler: [
      { yazi: 'Şemsiyeli tribün kur', etki: { nakit: -700, sevgi: 5, itibar: 3 }, sonuc: 'Seyirciler kuru, oyuncular mutlu.' },
      { yazi: 'Maç sonu sıcak çorba', etki: { nakit: -300, sevgi: 5 }, sonuc: 'Mercimek çorbası her şeyi düzeltti.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -3 }, sonuc: 'Islak ve somurtkan bir maç oldu.' },
  }),
  S('londra', {
    id: 'lon_scout', baslik: 'Akademi gözlemcisi', sahne: 'izci', kotu: false,
    metin: 'Bir Premier Lig kulübünün gözlemcisi tribünde not alıyor. {takim} içinde biri dikkatini çekmiş.',
    secenekler: [
      { yazi: 'Oyuncuyu tanıştır', etki: { itibar: 10, sevgi: 6 }, sonuc: 'Oyuncu deneme antrenmanına çağrıldı!' },
      { yazi: 'Tesisi tanıt', etki: { itibar: 8, nakit: 1000 }, sonuc: 'Kulüp tesisinde altyapı seçmesi yapacak.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Gözlemci sessizce ayrıldı.' },
  }),
  S('londra', {
    id: 'lon_kebap', baslik: 'Ocakbaşı gecesi', sahne: 'yemek', kotu: false, kosul: 'gece',
    metin: 'Green Lanes\'teki ocakbaşı, maç sonu takımları yemeğe davet ediyor ama komisyon istiyor.',
    secenekler: [
      { yazi: 'Anlaş, komisyon al', etki: { nakit: 1400 }, sonuc: 'Her maçtan sonra masalar doluyor.' },
      { yazi: 'Takımları sen davet et', etki: { nakit: -900, sevgi: 8, kontrol: 4 }, sonuc: 'Adana kebap ve dostluk.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Takımlar evlerine gitti.' },
  }),
  // DUBAİ
  S('dubai', {
    id: 'dxb_seyh_oglu', baslik: 'Şeyhin oğlu geldi', sahne: 'para', kotu: false,
    metin: 'Altın kaplı bir arabadan inen genç, arkadaşlarıyla bu gece sahayı tamamen kapatmak istiyor.',
    secenekler: [
      { yazi: 'Tüm geceyi kirala', etki: { nakit: 9000, sevgi: -5 }, sonuc: 'Kasa doldu ama müdavimler bozuldu.' },
      { yazi: 'Bir saat ver, VIP hizmet', oyun: 'pazarlik', etki: { nakit: 5000, itibar: 6 }, sonuc: 'Şeyhin oğlu tekrar geleceğini söyledi.', basarisiz: { etki: { nakit: 2000 }, sonuc: 'Pazarlıkta geri adım attın.' } },
      { yazi: 'Rezervasyonlar dolu, kusura bakmayın', etki: { itibar: 6, kontrol: 4 }, sonuc: 'Müdavimlerin seni sevdi.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Araba gaza basıp gitti.' },
  }),
  S('dubai', {
    id: 'dxb_sicak', baslik: '45 derece', sahne: 'sicak', kotu: true, kosul: 'gunduz',
    metin: 'Gündüz maçında termometre 45\'i gösteriyor. Halıdan duman çıkıyor sanki.',
    secenekler: [
      { yazi: 'Sis fıskiyelerini aç', etki: { nakit: -600, sevgi: 5 }, sonuc: 'Saha bir anda serinledi.' },
      { yazi: 'Maçı geceye al', etki: { sevgi: 3, enerji: -3 }, sonuc: 'Gece maçı çok daha keyifli.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: -5, kalite: -0.3 }, sonuc: 'Sıcak çarptı.' },
  }),
  S('dubai', {
    id: 'dxb_kum', baslik: 'Kum fırtınası', sahne: 'sicak', kotu: true,
    metin: 'Çölden gelen kum fırtınası gökyüzünü turuncuya boyadı.',
    secenekler: [
      { yazi: 'Herkesi kapalı alana al', etki: { enerji: -4, sevgi: 3 }, sonuc: 'Fırtına geçti, maç sürdü.' },
      { yazi: 'Halıyı örtüyle koru', oyun: 'dokun', etki: { kalite: 0 }, sonuc: 'Halı kurtuldu.', basarisiz: { etki: { kalite: -0.7 }, sonuc: 'Kum halının içine doldu.' } },
    ],
    sessiz: { yazi: '', etki: { kalite: -0.8 }, sonuc: 'Halı kum altında kaldı.' },
  }),
  S('dubai', {
    id: 'dxb_hurma', baslik: 'Hurma ikramı', sahne: 'yemek', kotu: false,
    metin: '{takim} kaptanı memleketten gelen hurmaları herkesle paylaşmak istiyor.',
    secenekler: [
      { yazi: 'Çay ocağında servis et', etki: { sevgi: 5, kontrol: 2 }, sonuc: 'Hurma ve Türk çayı, beklenmedik ikili.' },
      { yazi: 'Teşekkür et, sen de baklava getir', etki: { nakit: -300, sevgi: 7 }, sonuc: 'Kültürler sahada buluştu.' },
    ],
    sessiz: { yazi: '', etki: { sevgi: 1 }, sonuc: 'Hurmalar bir anda bitti.' },
  }),
  S('dubai', {
    id: 'dxb_influencer', baslik: 'Ünlü fenomen', sahne: 'kamera', kotu: false,
    metin: 'Milyonlarca takipçisi olan bir fenomen sahanda "Penaltı meydan okuması" çekmek istiyor.',
    secenekler: [
      { yazi: 'Kaleye sen geç!', oyun: 'yakala', etki: { itibar: 15 }, sonuc: 'Penaltıyı kurtardın, video milyonlar izlendi!', basarisiz: { etki: { itibar: 6 }, sonuc: 'Gol yedin ama video yine de çok izlendi.' } },
      { yazi: 'Çekim ücreti iste', etki: { nakit: 4000 }, sonuc: 'Fenomen ücreti ödedi.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'Fenomen başka yere gitti.' },
  }),
  S('dubai', {
    id: 'dxb_isci', baslik: 'Şantiye işçileri', sahne: 'kalabalik', kotu: false, kosul: 'gece',
    metin: 'Gece vardiyasından çıkan şantiye işçileri sahayı izliyor ama ücreti karşılayamıyorlar.',
    secenekler: [
      { yazi: 'Gece yarısından sonra bedava', etki: { kontrol: 8, itibar: 8, nakit: -500 }, sonuc: 'Karama\'da adın dua ile anılıyor.' },
      { yazi: 'Yarı fiyat kampanyası', etki: { nakit: 800, kontrol: 4 }, sonuc: 'Saha gecenin üçünde bile dolu.' },
    ],
    sessiz: { yazi: '', etki: {}, sonuc: 'İşçiler izleyip gitti.' },
  }),
];

// ---------- Altın anlar (nadir) ----------
const ALTIN: CanliAnTanim[] = [
  {
    id: 'altin_efsane', baslik: 'Efsane futbolcu sahada!', nadir: true, sahne: 'altin', kotu: false,
    metin: 'Milli takımda yıllarca oynamış efsane bir futbolcu habersiz geldi ve {takim} ile oynamak istiyor!',
    secenekler: [
      { yazi: 'Formasını imzalat', etki: { itibar: 25, forma: 2 }, sonuc: 'İmzalı efsane forma duvarda!' },
      { yazi: 'Mahalleye duyur', etki: { kontrol: 20, itibar: 15 }, sonuc: 'Mahalle sahaya akın etti!' },
      { yazi: 'Akademide ders versin', etki: { itibar: 20, nakit: 5000 }, sonuc: 'Akademi kayıtları patladı.' },
    ],
    sessiz: { yazi: '', etki: { itibar: 10 }, sonuc: 'Efsane bir maç oynayıp gitti.' },
  },
  {
    id: 'altin_tv', baslik: 'Televizyon programı!', nadir: true, sahne: 'kamera', kotu: false,
    metin: 'Ulusal bir spor programı "Türkiye\'nin en iyi halısahaları" bölümünü senin sahanda çekmek istiyor.',
    secenekler: [
      { yazi: 'Tesisi baştan sona göster', etki: { itibar: 30, enerji: -10 }, sonuc: 'Yayından sonra herkes seni konuşuyor!' },
      { yazi: 'Sponsorları ekrana çıkar', etki: { nakit: 12000, itibar: 12 }, sonuc: 'Sponsorlar ödemeyi ikiye katladı.' },
    ],
    sessiz: { yazi: '', etki: { itibar: 12 }, sonuc: 'Ekip kısa bir çekim yaptı.' },
  },
  {
    id: 'altin_hazine', baslik: 'Toprak altından sandık!', nadir: true, sahne: 'altin', kotu: false,
    metin: 'Saha kenarındaki onarımda eski bir sandık çıktı. İçinde 1970\'lerden kalma mahalle takımı formaları var!',
    secenekler: [
      { yazi: 'Formaları duvara as', etki: { forma: 1, itibar: 10 }, sonuc: 'Tarihi formalar duvarı süslüyor.' },
      { yazi: 'Müzeye bağışla', etki: { itibar: 25, kontrol: 10 }, sonuc: 'Şehrin hafızasına katkın konuşuluyor.' },
    ],
    sessiz: { yazi: '', etki: { forma: 0 }, sonuc: 'Sandıktan bir forma aldın.' },
  },
  {
    id: 'altin_milyoner', baslik: 'Gizemli hayırsever', nadir: true, sahne: 'para', kotu: false,
    metin: 'Takım elbiseli bir adam {takim} maçını izledi ve kartvizitini bıraktı: "Gençliğim bu mahallede geçti. Sahana yatırım yapmak istiyorum."',
    secenekler: [
      { yazi: 'Yatırımı kabul et', etki: { nakit: 20000 }, sonuc: 'Kasaya büyük bir para girdi!' },
      { yazi: 'Çocuklar için burs fonu kur', etki: { nakit: 6000, itibar: 20, kontrol: 10 }, sonuc: 'Mahallenin çocukları artık bedava oynuyor.' },
    ],
    sessiz: { yazi: '', etki: { nakit: 5000 }, sonuc: 'Adam bir zarf bırakıp gitti.' },
  },
  {
    id: 'altin_gol', baslik: 'Yılın golü!', nadir: true, sahne: 'yildiz', kotu: false,
    metin: '{takim} oyuncusu orta sahadan rövaşata ile gol attı. Bütün tribün telefonla çekiyordu!',
    secenekler: [
      { yazi: 'Golü yarışmaya gönder', etki: { itibar: 18, sevgi: 10 }, sonuc: 'Gol ulusal yarışmada birinci oldu!' },
      { yazi: 'Golün yerine plaket koy', etki: { itibar: 12, kontrol: 8 }, sonuc: 'Plaketin önünde fotoğraf sırası var.' },
    ],
    sessiz: { yazi: '', etki: { itibar: 8 }, sonuc: 'Gol videosu mahallede dolaştı.' },
  },
];

export const TUM_ANLAR: CanliAnTanim[] = [...GENEL, ...KARAKTER, ...SEHIRE_OZEL, ...ALTIN];
export function anBulTanim(id: string): CanliAnTanim | undefined {
  return TUM_ANLAR.find((a) => a.id === id);
}
