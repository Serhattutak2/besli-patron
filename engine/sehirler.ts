// ============================================
// SAHA BİZİM — engine/sehirler.ts
// Şehirler: her şehrin kendi karakterleri, mahalleleri, müdavim takımları ve hikâyesi.
// Şehir değişince hikâyedeki tüm isimler o şehre göre değişir.
// ============================================
import type { TakimTipi } from './tipler';

export type TakimTanim = {
  id: string;
  ad: string;
  tip: TakimTipi;
  not: string; // kısa karakter cümlesi
  dusman?: string; // anlaşamadığı takım id'si
};

export type MahalleTanim = {
  id: string;
  ad: string;
  huy: string; // mahallenin karakteri
  takimlar: TakimTanim[];
};

export type SehirTanim = {
  id: string;
  ad: string;
  ulke: string;
  sira: number;
  kiraGunluk: number;
  faturaGunluk: number;
  fiyatCarpani: number; // bölgenin fiyat seviyesi
  paraBirimiNotu?: string;
  karakter: {
    cayci: string;
    bekci: string;
    rakip: string; // rakip patron
    rakipSaha: string;
    muhtar: string;
  };
  giris: string[]; // şehre gelişte Ela'nın anlattığı kısa hikâye
  fetihMesaji: string;
  mahalleler: MahalleTanim[];
};

const t = (id: string, ad: string, tip: TakimTipi, not: string, dusman?: string): TakimTanim => ({ id, ad, tip, not, dusman });

export const SEHIRLER: SehirTanim[] = [
  {
    id: 'istanbul',
    ad: 'İstanbul',
    ulke: 'Türkiye',
    sira: 0,
    kiraGunluk: 2400,
    faturaGunluk: 650,
    fiyatCarpani: 1,
    karakter: {
      cayci: 'Çaycı Rami',
      bekci: 'Dursun Amca',
      rakip: 'Kemal',
      rakipSaha: 'Kemal Arena',
      muhtar: 'Muhtar Necati',
    },
    giris: [
      'Beşli, kramponlarını astığın gün bu tozlu arsayı devraldın.',
      'Karşı sokakta Kemal Arena ışıl ışıl. Bütün mahalle orada oynuyor.',
      'Önce kendi mahalleni kazan. Sonra Kadıköy\'den Bağcılar\'a herkes "Saha bizim" diyecek.',
    ],
    fetihMesaji: 'İstanbul artık senin! Kemal pes etti, sahasını sana devretmek istiyor. Yeni bir şehir seni bekliyor.',
    mahalleler: [
      {
        id: 'kadikoy',
        ad: 'Kadıköy',
        huy: 'Genç, öğrenci dolu, gece hayatı canlı',
        takimlar: [
          t('ist_kadikoy_uni', 'Moda Üniversiteliler', 'ogrenci', 'Bütçe dar, enerji bitmez.', 'ist_levent_ofis'),
          t('ist_kadikoy_esnaf', 'Çarşı Esnafı', 'esnaf', 'Dükkân kapanınca sahaya koşarlar.'),
        ],
      },
      {
        id: 'levent',
        ad: 'Levent',
        huy: 'Plazalar ve kurumsal takımlar, para var ama sabır yok',
        takimlar: [
          t('ist_levent_ofis', 'Plaza Ofisçileri', 'ofis', 'Toplantıdan çıkıp kravatla gelirler.', 'ist_kadikoy_uni'),
          t('ist_levent_kurum', 'Banka Kulübü', 'kurumsal', 'VIP ister, iyi öder.'),
        ],
      },
      {
        id: 'uskudar',
        ad: 'Üsküdar',
        huy: 'Köklü aileler ve 50 yaş üstü dayılar',
        takimlar: [
          t('ist_uskudar_50', 'Üsküdar 50+ Kafalar', 'emekli', 'Sabah maçı, ardından çay ve uzun muhabbet.'),
          t('ist_uskudar_aile', 'Pazar Babaları', 'aile', 'Çocuklarıyla gelirler, temizlik şart.'),
        ],
      },
      {
        id: 'besiktas',
        ad: 'Beşiktaş',
        huy: 'Hararetli, rekabetçi, maç asla sadece maç değil',
        takimlar: [
          t('ist_besiktas_amator', 'Çarşı Gençlik', 'amator', 'Kaybedince ortalık karışır.', 'ist_bagcilar_amator'),
          t('ist_besiktas_kadin', 'Boğaz Kadın FK', 'kadin', 'Disiplinli ve dakik, güvenlik ister.'),
        ],
      },
      {
        id: 'bagcilar',
        ad: 'Bağcılar',
        huy: 'Kalabalık ve pazarlıkçı, sadakat zor kazanılır',
        takimlar: [
          t('ist_bagcilar_amator', 'Bağcılar Yıldızları', 'amator', 'Mahallenin namusu onlardan sorulur.', 'ist_besiktas_amator'),
          t('ist_bagcilar_taksi', 'Taksiciler Birliği', 'vardiya', 'Vardiya bitince, gecenin üçünde gelirler.'),
        ],
      },
      {
        id: 'fatih',
        ad: 'Fatih',
        huy: 'Tarihi sokaklar, hastaneler, gece vardiyası',
        takimlar: [
          t('ist_fatih_hastane', 'Hastane Vardiyası', 'vardiya', 'Nöbet arasında bir saatlik kaçamak.'),
          t('ist_fatih_esnaf', 'Kapalıçarşı Kuyumcuları', 'kurumsal', 'Pahalı ama titiz müşteriler.'),
        ],
      },
    ],
  },
  {
    id: 'ankara',
    ad: 'Ankara',
    ulke: 'Türkiye',
    sira: 1,
    kiraGunluk: 2100,
    faturaGunluk: 600,
    fiyatCarpani: 0.95,
    karakter: {
      cayci: 'Çaycı Ali',
      bekci: 'Hasan Amca',
      rakip: 'Cevdet Bey',
      rakipSaha: 'Cevdet Spor Tesisleri',
      muhtar: 'Muhtar Hayri',
    },
    giris: [
      'Başkente geldin. Burada işler protokolle yürür, maçlar mesai sonrası başlar.',
      'Cevdet Bey yirmi yıldır bu şehrin halısahalarını yönetiyor. Kimseye yer bırakmıyor.',
      'Memurların, öğrencilerin ve esnafın gönlünü kazan; Ankara ayazında bile sahan dolsun.',
    ],
    fetihMesaji: 'Ankara seni kabul etti. Cevdet Bey emekliye ayrıldı ve anahtarları sana bıraktı.',
    mahalleler: [
      {
        id: 'kizilay',
        ad: 'Kızılay',
        huy: 'Şehrin kalbi, öğrenciler ve kalabalık',
        takimlar: [
          t('ank_kizilay_uni', 'Kızılay Öğrenci Evi', 'ogrenci', 'Sınav haftası bile maçı kaçırmazlar.'),
          t('ank_kizilay_esnaf', 'Sakarya Caddesi Esnafı', 'esnaf', 'Gece yarısı maçının müdavimi.'),
        ],
      },
      {
        id: 'cankaya',
        ad: 'Çankaya',
        huy: 'Bürokratlar ve kurumsal takımlar',
        takimlar: [
          t('ank_cankaya_memur', 'Bakanlık Memurları', 'ofis', 'Mesai 17:30\'da biter, 18:00\'de sahadalar.'),
          t('ank_cankaya_kurum', 'Büyükelçilik Kulübü', 'kurumsal', 'Protokol ister, iyi öder.'),
        ],
      },
      {
        id: 'kecioren',
        ad: 'Keçiören',
        huy: 'Aileler ve emekliler',
        takimlar: [
          t('ank_kecioren_50', 'Keçiören Dayılar', 'emekli', 'Sabah sporu kutsaldır.'),
          t('ank_kecioren_aile', 'Bağlar Aileleri', 'aile', 'Hafta sonu çocuklarla gelirler.'),
        ],
      },
      {
        id: 'mamak',
        ad: 'Mamak',
        huy: 'Sıkı rekabet, mahalle gururu',
        takimlar: [
          t('ank_mamak_amator', 'Mamak Gücü', 'amator', 'Her maç final gibi.', 'ank_etimesgut_amator'),
          t('ank_mamak_kadin', 'Başkent Kadın FK', 'kadin', 'Turnuvaya hazırlanıyorlar.'),
        ],
      },
      {
        id: 'etimesgut',
        ad: 'Etimesgut',
        huy: 'Yeni siteler, genç aileler',
        takimlar: [
          t('ank_etimesgut_amator', 'Eryaman Kartalları', 'amator', 'Mamak\'la aralarından su sızmaz.', 'ank_mamak_amator'),
          t('ank_etimesgut_site', 'Site Yöneticileri', 'ofis', 'Aidat toplantısından sonra maç.'),
        ],
      },
      {
        id: 'ulus',
        ad: 'Ulus',
        huy: 'Eski Ankara, gece çalışanları',
        takimlar: [
          t('ank_ulus_hastane', 'Numune Nöbetçileri', 'vardiya', 'Gecenin ikisinde bile enerjikler.'),
          t('ank_ulus_hal', 'Hal Esnafı', 'esnaf', 'Sabah hale, gece sahaya.'),
        ],
      },
    ],
  },
  {
    id: 'izmir',
    ad: 'İzmir',
    ulke: 'Türkiye',
    sira: 2,
    kiraGunluk: 2300,
    faturaGunluk: 620,
    fiyatCarpani: 1.05,
    karakter: {
      cayci: 'Çaycı Efe',
      bekci: 'Mustafa Dayı',
      rakip: 'Ozan',
      rakipSaha: 'Kordon Spor Center',
      muhtar: 'Muhtar Sevim Hanım',
    },
    giris: [
      'Ege\'nin incisi. Burada maç akşam serinliğinde, deniz kokusuyla oynanır.',
      'Ozan, Kordon\'daki lüks tesisiyle herkesi etkilemiş. Ama mahalle sıcaklığından anlamıyor.',
      'Boyoz ve çayla gönülleri fethet; İzmir\'in her semti senin sahanda buluşsun.',
    ],
    fetihMesaji: 'İzmir senin! Ozan tesisini satıp yurt dışına gitti. Akdeniz kıyısı seni çağırıyor.',
    mahalleler: [
      {
        id: 'alsancak',
        ad: 'Alsancak',
        huy: 'Gece hayatı ve gençlik',
        takimlar: [
          t('izm_alsancak_uni', 'Kordon Öğrencileri', 'ogrenci', 'Maçtan sonra sahile koşarlar.'),
          t('izm_alsancak_kadin', 'Alsancak Kadın FK', 'kadin', 'Şehrin en disiplinli takımı.'),
        ],
      },
      {
        id: 'karsiyaka',
        ad: 'Karşıyaka',
        huy: 'Tutkulu, kendi kimliğine düşkün',
        takimlar: [
          t('izm_karsiyaka_amator', 'Karşıyaka Kafası', 'amator', 'Karşı yakadan kimseyi sevmezler.', 'izm_bornova_amator'),
          t('izm_karsiyaka_50', 'Çarşı Dayıları', 'emekli', 'Sabah maçından sonra boyoz şart.'),
        ],
      },
      {
        id: 'bornova',
        ad: 'Bornova',
        huy: 'Kampüs ve aileler',
        takimlar: [
          t('izm_bornova_amator', 'Bornova Ateşi', 'amator', 'Karşıyaka maçı derbi gibi.', 'izm_karsiyaka_amator'),
          t('izm_bornova_aile', 'Kampüs Aileleri', 'aile', 'Pazar sabahı çocuk maçı.'),
        ],
      },
      {
        id: 'konak',
        ad: 'Konak',
        huy: 'İş merkezleri ve esnaf',
        takimlar: [
          t('izm_konak_ofis', 'Konak Plaza', 'ofis', 'Mesai sonrası terlemek isterler.'),
          t('izm_konak_esnaf', 'Kemeraltı Esnafı', 'esnaf', 'Çarşı kapanınca sahaya.'),
        ],
      },
      {
        id: 'bayrakli',
        ad: 'Bayraklı',
        huy: 'Yeni gökdelenler, kurumsal para',
        takimlar: [
          t('izm_bayrakli_kurum', 'Gökdelen Yöneticileri', 'kurumsal', 'Sadece en iyisi.'),
          t('izm_bayrakli_vardiya', 'Liman İşçileri', 'vardiya', 'Gemi yanaşmadığı her gece buradalar.'),
        ],
      },
      {
        id: 'buca',
        ad: 'Buca',
        huy: 'Kalabalık ve samimi',
        takimlar: [
          t('izm_buca_uni', 'Buca Yurtları', 'ogrenci', 'Ucuz saat bulurlarsa her gün gelirler.'),
          t('izm_buca_esnaf', 'Buca Pazarcıları', 'esnaf', 'Pazar dağılınca maç.'),
        ],
      },
    ],
  },
  {
    id: 'antalya',
    ad: 'Antalya',
    ulke: 'Türkiye',
    sira: 3,
    kiraGunluk: 2600,
    faturaGunluk: 750,
    fiyatCarpani: 1.12,
    karakter: {
      cayci: 'Çaycı Yusuf',
      bekci: 'Ramazan Amca',
      rakip: 'Serkan',
      rakipSaha: 'Lara Resort Sahaları',
      muhtar: 'Muhtar Gülay Hanım',
    },
    giris: [
      'Güneşin hiç batmadığı şehir. Turistler, oteller ve sıcak geceler.',
      'Serkan otellerin sahalarını kapatmış, turist takımlarını bir avuç parayla ağırlıyor.',
      'Yerlileri de turistleri de kazan. Antalya\'da gece maçı, sabaha kadar sürer.',
    ],
    fetihMesaji: 'Antalya senin! Oteller bile turnuvalarını senin sahanda yapıyor. Karadeniz\'den bir davet var.',
    mahalleler: [
      {
        id: 'lara',
        ad: 'Lara',
        huy: 'Oteller ve turist takımları',
        takimlar: [
          t('ant_lara_turist', 'Otel Animatörleri', 'vardiya', 'Gösteriden sonra gece yarısı maçı.'),
          t('ant_lara_kurum', 'Turist Kafileleri', 'kurumsal', 'Bir gecelik ama çok iyi öderler.'),
        ],
      },
      {
        id: 'kaleici',
        ad: 'Kaleiçi',
        huy: 'Tarihi sokaklar, esnaf',
        takimlar: [
          t('ant_kaleici_esnaf', 'Kaleiçi Esnafı', 'esnaf', 'Sezon bitince maç günü uzar.'),
          t('ant_kaleici_50', 'Liman Dayıları', 'emekli', 'Balık tutmadıkları her sabah.'),
        ],
      },
      {
        id: 'konyaalti',
        ad: 'Konyaaltı',
        huy: 'Sahil, aileler, spor tutkunları',
        takimlar: [
          t('ant_konyaalti_aile', 'Sahil Aileleri', 'aile', 'Güneş batarken maç.'),
          t('ant_konyaalti_kadin', 'Konyaaltı Kadın FK', 'kadin', 'Plaj voleybolundan futbola geçtiler.'),
        ],
      },
      {
        id: 'muratpasa',
        ad: 'Muratpaşa',
        huy: 'Şehir merkezi, ofisler',
        takimlar: [
          t('ant_muratpasa_ofis', 'Merkez Ofisçileri', 'ofis', 'Klimadan kaçıp sahaya.'),
          t('ant_muratpasa_amator', 'Muratpaşa Akdeniz', 'amator', 'Kepez\'i görünce sinirlenirler.', 'ant_kepez_amator'),
        ],
      },
      {
        id: 'kepez',
        ad: 'Kepez',
        huy: 'Kalabalık ve mücadeleci',
        takimlar: [
          t('ant_kepez_amator', 'Kepez Gençlik', 'amator', 'Her topa son nefesle giderler.', 'ant_muratpasa_amator'),
          t('ant_kepez_uni', 'Kampüs Kartalları', 'ogrenci', 'Yaz okulunda bile maç.'),
        ],
      },
      {
        id: 'belek',
        ad: 'Belek',
        huy: 'Golf ve lüks, hep daha fazlası',
        takimlar: [
          t('ant_belek_kurum', 'Golf Kulübü Yöneticileri', 'kurumsal', 'Halısaha onlara yeni bir macera.'),
          t('ant_belek_vardiya', 'Resepsiyon Ekibi', 'vardiya', 'Gece vardiyası çıkışı.'),
        ],
      },
    ],
  },
  {
    id: 'trabzon',
    ad: 'Trabzon',
    ulke: 'Türkiye',
    sira: 4,
    kiraGunluk: 1900,
    faturaGunluk: 600,
    fiyatCarpani: 0.98,
    karakter: {
      cayci: 'Çaycı Temel',
      bekci: 'İdris Dayı',
      rakip: 'Cemal Reis',
      rakipSaha: 'Reis Halısaha',
      muhtar: 'Muhtar Fadime Hanım',
    },
    giris: [
      'Karadeniz! Yağmur yağsa da kar yağsa da maç oynanır burada.',
      'Cemal Reis sahasını sandığı gibi korur, yabancıya kolay kolay yer vermez.',
      'Futbol burada din gibidir. Saygıyı kazan, gerisi kendiliğinden gelir.',
    ],
    fetihMesaji: 'Karadeniz seni bağrına bastı! Avrupa\'daki gurbetçiler senin sahalarını konuşuyor.',
    mahalleler: [
      {
        id: 'ortahisar',
        ad: 'Ortahisar',
        huy: 'Şehrin merkezi, futbol tutkusu',
        takimlar: [
          t('trb_ortahisar_amator', 'Meydan Gençliği', 'amator', 'Maç bitse de tartışma bitmez.', 'trb_akcaabat_amator'),
          t('trb_ortahisar_esnaf', 'Uzun Sokak Esnafı', 'esnaf', 'Dükkân kapanınca top başına.'),
        ],
      },
      {
        id: 'akcaabat',
        ad: 'Akçaabat',
        huy: 'Köfteciler ve tutkulu gençler',
        takimlar: [
          t('trb_akcaabat_amator', 'Akçaabat Fırtınası', 'amator', 'Ortahisar maçı için yaşarlar.', 'trb_ortahisar_amator'),
          t('trb_akcaabat_50', 'Köfteci Dayılar', 'emekli', 'Sabah maçı, sonra köfte.'),
        ],
      },
      {
        id: 'yomra',
        ad: 'Yomra',
        huy: 'Sahil ve aileler',
        takimlar: [
          t('trb_yomra_aile', 'Yomra Aileleri', 'aile', 'Çocuklar topa erken başlar.'),
          t('trb_yomra_kadin', 'Karadeniz Kadın FK', 'kadin', 'Yağmurda bile antrenman.'),
        ],
      },
      {
        id: 'kanuni',
        ad: 'Kanuni',
        huy: 'Kampüs ve öğrenciler',
        takimlar: [
          t('trb_kanuni_uni', 'Kampüs Hamsileri', 'ogrenci', 'Bütçe az, gürültü çok.'),
          t('trb_kanuni_ofis', 'Teknokent Ekibi', 'ofis', 'Kod yazmaktan yorulunca.'),
        ],
      },
      {
        id: 'liman',
        ad: 'Liman',
        huy: 'Balıkçılar ve gece çalışanları',
        takimlar: [
          t('trb_liman_vardiya', 'Balıkçı Tayfası', 'vardiya', 'Tekne dönünce sabaha karşı maç.'),
          t('trb_liman_kurum', 'Lojistik Şirketi', 'kurumsal', 'Takım ruhu için harcarlar.'),
        ],
      },
      {
        id: 'boztepe',
        ad: 'Boztepe',
        huy: 'Tepeden şehri izleyenler, sakin',
        takimlar: [
          t('trb_boztepe_50', 'Boztepe Çaycıları', 'emekli', 'Maçtan çok çay muhabbeti.'),
          t('trb_boztepe_ofis', 'Belediye Ekibi', 'ofis', 'Mesai sonrası düzenli gelirler.'),
        ],
      },
    ],
  },
  {
    id: 'berlin',
    ad: 'Berlin',
    ulke: 'Almanya',
    sira: 5,
    kiraGunluk: 3200,
    faturaGunluk: 900,
    fiyatCarpani: 1.3,
    karakter: {
      cayci: 'Çaycı Mehmet Abi',
      bekci: 'Hüseyin Amca',
      rakip: 'Klaus',
      rakipSaha: 'Klaus Soccerhalle',
      muhtar: 'Dernek Başkanı Nuri',
    },
    giris: [
      'Gurbetin kalbi Berlin. Kreuzberg\'de çay kokusu, Neukölln\'de mahalle maçı.',
      'Klaus\'un kapalı salonları düzenli ama ruhsuz. Gurbetçiler memleket havası arıyor.',
      'Burada sahan sadece saha değil: memleket hasreti, bir bardak çay, bir dost sohbeti.',
    ],
    fetihMesaji: 'Berlin\'de herkes "Saha bizim" diyor! Londra\'daki dernekler seni davet etti.',
    mahalleler: [
      {
        id: 'kreuzberg',
        ad: 'Kreuzberg',
        huy: 'Gurbetçilerin kalbi',
        takimlar: [
          t('ber_kreuzberg_esnaf', 'Kottbusser Esnafı', 'esnaf', 'Dükkân kapanınca memleket maçı.'),
          t('ber_kreuzberg_amator', 'Kreuzberg 36', 'amator', 'Wedding\'e asla yenilmezler.', 'ber_wedding_amator'),
        ],
      },
      {
        id: 'neukolln',
        ad: 'Neukölln',
        huy: 'Kalabalık, çok kültürlü',
        takimlar: [
          t('ber_neukolln_aile', 'Sonnenallee Aileleri', 'aile', 'Pazar günleri üç nesil birlikte.'),
          t('ber_neukolln_uni', 'Öğrenci Derneği', 'ogrenci', 'Erasmus\'tan kalma bir takım.'),
        ],
      },
      {
        id: 'wedding',
        ad: 'Wedding',
        huy: 'İşçi mahallesi, gururlu',
        takimlar: [
          t('ber_wedding_amator', 'Wedding Aslanları', 'amator', 'Kreuzberg\'i yenmek için yaşarlar.', 'ber_kreuzberg_amator'),
          t('ber_wedding_vardiya', 'Fabrika Vardiyası', 'vardiya', 'Gece vardiyası çıkışında.'),
        ],
      },
      {
        id: 'mitte',
        ad: 'Mitte',
        huy: 'Start-up\'lar ve kurumsal',
        takimlar: [
          t('ber_mitte_ofis', 'Start-up Kodcuları', 'ofis', 'Sprint bitince maç.'),
          t('ber_mitte_kurum', 'Banka Şubesi', 'kurumsal', 'Takım günü için büyük bütçe.'),
        ],
      },
      {
        id: 'spandau',
        ad: 'Spandau',
        huy: 'Emekli gurbetçiler',
        takimlar: [
          t('ber_spandau_50', 'İlk Kuşak Amcalar', 'emekli', '60\'larda gelen, topu hâlâ bırakmayan.'),
          t('ber_spandau_kadin', 'Spandau Kadın FK', 'kadin', 'Bölge şampiyonu olmak istiyorlar.'),
        ],
      },
      {
        id: 'charlottenburg',
        ad: 'Charlottenburg',
        huy: 'Varlıklı ve seçici',
        takimlar: [
          t('ber_charl_kurum', 'Diplomatlar', 'kurumsal', 'Saat dakikası dakikasına.'),
          t('ber_charl_esnaf', 'Restoran Sahipleri', 'esnaf', 'Mutfak kapanınca, gece yarısı.'),
        ],
      },
    ],
  },
  {
    id: 'londra',
    ad: 'Londra',
    ulke: 'İngiltere',
    sira: 6,
    kiraGunluk: 3800,
    faturaGunluk: 1050,
    fiyatCarpani: 1.45,
    karakter: {
      cayci: 'Çaycı Hakan',
      bekci: 'Kıbrıslı Andreas',
      rakip: 'Mr. Whitfield',
      rakipSaha: 'Whitfield Five-a-side',
      muhtar: 'Dernek Başkanı Ayşe Hanım',
    },
    giris: [
      'Futbolun anavatanı Londra. Yağmur hiç durmaz, maç hiç durmaz.',
      'Mr. Whitfield\'ın sahaları zincir mağaza gibi: her yerde aynı, hiçbirinde ruh yok.',
      'Haringey\'den Hackney\'e Türk mahallelerini kazan, sonra bütün şehri.',
    ],
    fetihMesaji: 'Londra sana şapka çıkardı! Körfezden çok büyük bir teklif geldi.',
    mahalleler: [
      {
        id: 'haringey',
        ad: 'Haringey',
        huy: 'Green Lanes\'in Türk esnafı',
        takimlar: [
          t('lon_haringey_esnaf', 'Green Lanes Esnafı', 'esnaf', 'Ocakbaşı kapanınca maç.'),
          t('lon_haringey_amator', 'Haringey Hilal', 'amator', 'Hackney\'le ezeli rakip.', 'lon_hackney_amator'),
        ],
      },
      {
        id: 'hackney',
        ad: 'Hackney',
        huy: 'Sanatçılar ve gençler',
        takimlar: [
          t('lon_hackney_amator', 'Dalston Gençleri', 'amator', 'Haringey maçı her şeydir.', 'lon_haringey_amator'),
          t('lon_hackney_uni', 'Sanat Okulu', 'ogrenci', 'Topa bile sanatla vururlar.'),
        ],
      },
      {
        id: 'enfield',
        ad: 'Enfield',
        huy: 'Aileler ve sakin bahçeler',
        takimlar: [
          t('lon_enfield_aile', 'Enfield Aileleri', 'aile', 'Cumartesi sabahı çocuk ligi.'),
          t('lon_enfield_50', 'Kıbrıslı Dayılar', 'emekli', 'Tavla ile futbol arasında.'),
        ],
      },
      {
        id: 'city',
        ad: 'City',
        huy: 'Finans dünyası',
        takimlar: [
          t('lon_city_kurum', 'Borsa Ekibi', 'kurumsal', 'Kaybetmeye tahammülleri yok.'),
          t('lon_city_ofis', 'Sigortacılar', 'ofis', 'Cuma akşamı ritüeli.'),
        ],
      },
      {
        id: 'brixton',
        ad: 'Brixton',
        huy: 'Müzik ve gece hayatı',
        takimlar: [
          t('lon_brixton_vardiya', 'Gece Kulübü Ekibi', 'vardiya', 'Sabahın üçünde ısınırlar.'),
          t('lon_brixton_kadin', 'Brixton Ladies', 'kadin', 'Şehrin en hızlı forvetleri.'),
        ],
      },
      {
        id: 'camden',
        ad: 'Camden',
        huy: 'Pazar yerleri ve turistler',
        takimlar: [
          t('lon_camden_esnaf', 'Pazar Tezgâhları', 'esnaf', 'Pazar kapanınca top başına.'),
          t('lon_camden_uni', 'Camden Kampüs', 'ogrenci', 'Ucuz saat avcıları.'),
        ],
      },
    ],
  },
  {
    id: 'dubai',
    ad: 'Dubai',
    ulke: 'BAE',
    sira: 7,
    kiraGunluk: 4500,
    faturaGunluk: 1400,
    fiyatCarpani: 1.7,
    karakter: {
      cayci: 'Çaycı Selim',
      bekci: 'Rashid Amca',
      rakip: 'Şeyh Faris',
      rakipSaha: 'Faris Sports City',
      muhtar: 'İş Konseyi Başkanı Leyla Hanım',
    },
    giris: [
      'Çölün ortasında gökdelenler. Gündüz 45 derece, maç ancak gece başlar.',
      'Şeyh Faris\'in sahaları altın kaplama. Ama kimse orada kendini evinde hissetmiyor.',
      'Son durak, en büyük meydan okuma: Halısaha Kralı unvanı burada kazanılır.',
    ],
    fetihMesaji: 'Dubai bile senin! Artık efsanesin. İstersen yeni bir tur başlat; yıldızların seninle gelir.',
    mahalleler: [
      {
        id: 'marina',
        ad: 'Marina',
        huy: 'Yatlar ve lüks',
        takimlar: [
          t('dxb_marina_kurum', 'Yat Kulübü', 'kurumsal', 'Para sorun değil, kalite şart.'),
          t('dxb_marina_vardiya', 'Otel Personeli', 'vardiya', 'Gece yarısından sonra özgürler.'),
        ],
      },
      {
        id: 'deira',
        ad: 'Deira',
        huy: 'Eski çarşı ve esnaf',
        takimlar: [
          t('dxb_deira_esnaf', 'Altın Çarşısı Esnafı', 'esnaf', 'Çarşı kapanınca gece maçı.'),
          t('dxb_deira_50', 'Liman Ağabeyleri', 'emekli', 'Serin sabahların müdavimi.'),
        ],
      },
      {
        id: 'jumeirah',
        ad: 'Jumeirah',
        huy: 'Aileler ve villalar',
        takimlar: [
          t('dxb_jumeirah_aile', 'Villa Aileleri', 'aile', 'Hafta sonu çocuk şenliği.'),
          t('dxb_jumeirah_kadin', 'Jumeirah Ladies FC', 'kadin', 'Gece serinliğinde antrenman.'),
        ],
      },
      {
        id: 'downtown',
        ad: 'Downtown',
        huy: 'Gökdelenler ve şirketler',
        takimlar: [
          t('dxb_downtown_ofis', 'Kule Ofisçileri', 'ofis', 'Asansörden sahaya.'),
          t('dxb_downtown_kurum', 'Holding Yönetimi', 'kurumsal', 'En pahalı saati isterler.'),
        ],
      },
      {
        id: 'karama',
        ad: 'Karama',
        huy: 'Göçmen işçiler ve tutkulu amatörler',
        takimlar: [
          t('dxb_karama_amator', 'Karama Kaplanları', 'amator', 'Al Quoz\'u yenmek tek hedef.', 'dxb_alquoz_amator'),
          t('dxb_karama_uni', 'Üniversite Şehri', 'ogrenci', 'Burs parası maça gider.'),
        ],
      },
      {
        id: 'alquoz',
        ad: 'Al Quoz',
        huy: 'Atölyeler ve gece vardiyası',
        takimlar: [
          t('dxb_alquoz_amator', 'Al Quoz Yıldızları', 'amator', 'Karama derbisi için her şey.', 'dxb_karama_amator'),
          t('dxb_alquoz_vardiya', 'Atölye Vardiyası', 'vardiya', 'Sabaha karşı maç.'),
        ],
      },
    ],
  },
];

export function sehirBul(id: string): SehirTanim {
  return SEHIRLER.find((s) => s.id === id) ?? SEHIRLER[0];
}

export function tumTakimlar(sehir: SehirTanim): (TakimTanim & { mahalleId: string })[] {
  return sehir.mahalleler.flatMap((m) => m.takimlar.map((tk) => ({ ...tk, mahalleId: m.id })));
}
