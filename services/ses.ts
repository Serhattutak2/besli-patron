// ============================================
// SAHA BİZİM — services/ses.ts
// Arka plan müziği (gündüz / gece / maç) ve kısa efektler
// Müzik ve efekt parçaları oyuna özel üretildi (assets/sounds/muzik_*, ses_*).
// Tık, para ve alkış sesleri Pixabay lisanslı kayıtlardır.
// ============================================
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import { ayarlar, ayarDinle } from './ayarlar';

export type MuzikModu = 'gunduz' | 'gece' | 'mac';
export type Efekt = 'tik' | 'para' | 'alkis' | 'duduk' | 'fanfar' | 'odul' | 'kayip';

const MUZIK: Record<MuzikModu, number> = {
  gunduz: require('../assets/sounds/muzik_gunduz.mp3'),
  gece: require('../assets/sounds/muzik_gece.mp3'),
  mac: require('../assets/sounds/muzik_mac.mp3'),
};
const EFEKT: Record<Efekt, { kaynak: number; ses: number }> = {
  tik: { kaynak: require('../assets/sounds/ses_tik.mp3'), ses: 0.35 },
  para: { kaynak: require('../assets/sounds/ses_para.mp3'), ses: 0.55 },
  alkis: { kaynak: require('../assets/sounds/ses_alkis.mp3'), ses: 0.45 },
  duduk: { kaynak: require('../assets/sounds/ses_duduk.mp3'), ses: 0.4 },
  fanfar: { kaynak: require('../assets/sounds/ses_fanfar.mp3'), ses: 0.7 },
  odul: { kaynak: require('../assets/sounds/ses_odul.mp3'), ses: 0.6 },
  kayip: { kaynak: require('../assets/sounds/ses_kayip.mp3'), ses: 0.5 },
};

let calar: AudioPlayer | null = null;
let aktifMod: MuzikModu | null = null;
let istenenMod: MuzikModu | null = null;
let durduruldu = false; // reklam, arka plan vb.
let kilitAcik = Platform.OS !== 'web';
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const ac = () => {
    sesKilidiAc();
    document.removeEventListener('pointerdown', ac);
    document.removeEventListener('keydown', ac);
  };
  document.addEventListener('pointerdown', ac);
  document.addEventListener('keydown', ac);
} // web: ilk dokunuştan önce ses çalınamaz
let solma: ReturnType<typeof setInterval> | null = null;
const efektCalar: Partial<Record<Efekt, AudioPlayer>> = {};
const sonCalma: Partial<Record<Efekt, number>> = {};
let hazir = false;

async function hazirla() {
  if (hazir) return;
  hazir = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false });
  } catch {}
  ayarDinle(() => guncelle());
}

function hedefSes() {
  const a = ayarlar();
  return a.muzik ? Math.max(0, Math.min(1, a.muzikSes)) * 0.6 : 0;
}

function sol(hedef: number, sonra?: () => void) {
  if (solma) clearInterval(solma);
  const p = calar;
  if (!p) return sonra?.();
  const bas = p.volume;
  let adim = 0;
  solma = setInterval(() => {
    adim++;
    try {
      p.volume = bas + ((hedef - bas) * adim) / 10;
    } catch {}
    if (adim >= 10) {
      if (solma) clearInterval(solma);
      solma = null;
      sonra?.();
    }
  }, 60);
}

function guncelle() {
  const a = ayarlar();
  const calmali = kilitAcik && a.muzik && !durduruldu && istenenMod != null;
  if (!calmali) {
    if (calar && calar.playing) sol(0, () => calar?.pause());
    return;
  }
  const mod = istenenMod!;
  try {
    if (!calar) {
      calar = createAudioPlayer(MUZIK[mod]);
      calar.loop = true;
      calar.volume = 0;
      aktifMod = mod;
      calar.play();
      sol(hedefSes());
      return;
    }
    if (aktifMod !== mod) {
      sol(0, () => {
        try {
          calar!.replace(MUZIK[mod]);
          calar!.loop = true;
          aktifMod = mod;
          calar!.play();
          sol(hedefSes());
        } catch {}
      });
      return;
    }
    if (!calar.playing) calar.play();
    sol(hedefSes());
  } catch {}
}

/** Hangi müziğin çalacağını bildirir (değişmediyse bir şey yapmaz) */
export function muzikModu(mod: MuzikModu | null) {
  hazirla();
  if (mod === istenenMod) return;
  istenenMod = mod;
  guncelle();
}

/** Reklam oynarken veya uygulama arka plandayken müziği durdurur */
export function muzikDuraklat(durdur: boolean) {
  if (durduruldu === durdur) return;
  durduruldu = durdur;
  guncelle();
}

/** Web'de tarayıcı, ilk dokunuştan önce ses çalmaya izin vermez */
export function sesKilidiAc() {
  if (kilitAcik) return;
  kilitAcik = true;
  hazirla();
  guncelle();
}

export function efekt(ad: Efekt) {
  const a = ayarlar();
  if (!a.efekt || !kilitAcik) return;
  const simdi = Date.now();
  if (simdi - (sonCalma[ad] ?? 0) < (ad === 'tik' ? 60 : 400)) return;
  sonCalma[ad] = simdi;
  try {
    let p = efektCalar[ad];
    if (!p) {
      p = createAudioPlayer(EFEKT[ad].kaynak);
      efektCalar[ad] = p;
    }
    p.volume = EFEKT[ad].ses;
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {}
}
