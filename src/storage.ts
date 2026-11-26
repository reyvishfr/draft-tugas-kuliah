// [Contoh TypeScript: Primitive Type (string)]
// Konstanta key untuk menyimpan daftar tugas di localStorage
export const TASKS_STORAGE_KEY: string = "daftar_tugas_kuliah_data";

// [Contoh TypeScript: Generics Sederhana]
// Fungsi generic <T> untuk membaca dan mem-parsing data JSON dari localStorage
// Mengembalikan tipe T jika data ditemukan dan valid, atau null jika kosong/error
export function loadFromStorage<T>(key: string): T | null {
  try {
    const rawData: string | null = localStorage.getItem(key);
    if (!rawData) {
      return null;
    }
    return JSON.parse(rawData) as T;
  } catch (error) {
    console.error(`Gagal memuat data dari localStorage untuk key "${key}":`, error);
    return null;
  }
}

// [Contoh TypeScript: Generics Sederhana]
// Fungsi generic <T> untuk menyimpan data bertipe apa pun ke dalam localStorage sebagai string JSON
export function saveToStorage<T>(key: string, data: T): boolean {
  try {
    const serialized: string = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Gagal menyimpan data ke localStorage untuk key "${key}":`, error);
    return false;
  }
}

