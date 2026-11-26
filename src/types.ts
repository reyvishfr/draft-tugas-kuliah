// [Contoh TypeScript: Type Alias + Union Type]
// Mendefinisikan tipe status tugas yang hanya boleh bernilai "Belum Selesai" atau "Selesai"
export type TaskStatus = "Belum Selesai" | "Selesai";

// [Contoh TypeScript: Type Alias + Union Type untuk filter tampilan]
export type FilterStatus = "Semua" | TaskStatus;

// [Contoh TypeScript: Interface & Primitive Types]
// Mendefinisikan struktur objek Task menggunakan primitive types (string, number, boolean)
export interface Task {
  id: string;          // [Contoh Primitive Type: string] - ID unik tugas
  title: string;       // [Contoh Primitive Type: string] - Judul tugas kuliah
  course: string;      // [Contoh Primitive Type: string] - Nama mata kuliah
  deadline: string;    // [Contoh Primitive Type: string] - Tanggal batas pengumpulan (YYYY-MM-DD)
  status: TaskStatus;  // [Contoh Union Type] - Status penyelesaian tugas
  completed: boolean;  // [Contoh Primitive Type: boolean] - Penanda boolean apakah tugas sudah selesai
  createdAt: number;   // [Contoh Primitive Type: number] - Timestamp waktu pembuatan tugas (ms)
}

