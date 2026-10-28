// ============================================
// BEŞLİ PATRON — services/storage.ts
// Oyun kaydı: tek anahtar, sıralı yazma kuyruğu
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVE_KEY = 'beslipatron_save';

// Kayıtlar sırayla yazılsın diye zincir
let yazmaZinciri: Promise<unknown> = Promise.resolve();

export function saveGame(state: unknown): Promise<unknown> {
  const veri = JSON.stringify(state);
  yazmaZinciri = yazmaZinciri
    .catch(() => {})
    .then(() => AsyncStorage.setItem(SAVE_KEY, veri))
    .catch((e) => {
      console.error('Save failed:', e);
    });
  return yazmaZinciri;
}

export async function loadGame<T = any>(): Promise<T | null> {
  try {
    const ham = await AsyncStorage.getItem(SAVE_KEY);
    if (!ham) return null;
    return JSON.parse(ham) as T;
  } catch (e) {
    console.error('Load failed:', e);
    return null;
  }
}

export async function hasSavedGame(): Promise<boolean> {
  try {
    const ham = await AsyncStorage.getItem(SAVE_KEY);
    return ham !== null;
  } catch {
    return false;
  }
}

export async function deleteSave(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.error('Delete failed:', e);
  }
}
