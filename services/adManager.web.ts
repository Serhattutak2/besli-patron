// ============================================
// BEŞLİ PATRON — services/adManager.web.ts
// Web önizlemesi için reklam taklidi (gerçek reklam yalnızca telefonda)
// ============================================

export async function reklamlariBaslat(): Promise<void> {}

export function gecisReklamGoster(): boolean {
  return false;
}

export async function gunSonuReklamKontrol(): Promise<void> {}

export function odulluReklamIzle(): Promise<boolean> {
  return new Promise((resolve) => setTimeout(() => resolve(true), 600));
}
