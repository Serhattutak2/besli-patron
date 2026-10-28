// ============================================
// SAHA BİZİM — services/reklam.web.ts
// Web önizlemesi: gerçek reklam yerine 3 saniyelik "deneme reklamı" ekranı gösterilir,
// böylece reklamların oyunda nerede çıktığı görülebilir.
// ============================================
type Dinleyici = (tur: 'odullu' | 'gecis', bitti: (izlendi: boolean) => void) => void;
let dinleyici: Dinleyici | null = null;
export function denemeReklamDinle(d: Dinleyici | null) {
  dinleyici = d;
}
export async function reklamlariBaslat(): Promise<void> {}
export function odulluHazirMi(): boolean {
  return true;
}
export function odulluGoster(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!dinleyici) return resolve(true);
    dinleyici('odullu', resolve);
  });
}
export function gecisGoster(): Promise<void> {
  return new Promise((resolve) => {
    if (!dinleyici) return resolve();
    dinleyici('gecis', () => resolve());
  });
}
