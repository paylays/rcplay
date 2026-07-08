# RCPlay — TOEFL PBT Reading Comprehension Practice App

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Zustand](https://img.shields.io/badge/zustand-%23333333.svg?style=flat)](https://github.com/pmndrs/zustand)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

Aplikasi latihan interaktif berbasis web khusus untuk bagian **Reading Comprehension TOEFL PBT**. Berisi 17 paket soal lengkap (PT30–PT46) dengan total 525 soal autentik. Dirancang dengan pendekatan desain editorial premium, dilengkapi dengan mode terang/gelap, timer dinamis, dan sistem verifikasi voucher donasi Trakteer.id.

---

## ✨ Fitur Utama

- 📖 **17 Paket Soal Autentik (PT30–PT46)**: Menyediakan total 525 soal Reading Comprehension lengkap dengan bacaan teks aslinya.
- ⏱️ **Timer Fleksibel**: Hitung mundur dinamis yang disesuaikan secara proporsional dengan jumlah soal di setiap tes.
- 📊 **Statistik & Analisis Kemajuan**: Dasbor lengkap untuk memantau rata-rata akurasi, estimasi skor TOEFL PBT secara langsung (skala 310-677), serta grafik kemajuan per tes menggunakan SVG.
- 🎨 **Desain Editorial Premium (Light/Dark Mode)**: Antarmuka yang terinspirasi oleh majalah/surat kabar klasik. Menggunakan perpaduan warna asimetris *off-black & amber*, tipografi Playfair Display & Source Serif 4, dan transisi cubic-bezier yang halus.
- 🔒 **Donation Gate (Freemium)**: 
  - **Akses Gratis**: 3 tes pertama (PT30, PT31, PT32) dapat dicoba secara gratis.
  - **Akses Premium**: Buka akses ke seluruh 17 tes dengan donasi minimal Rp10.000 melalui platform Trakteer.
- 🎟️ **Verifikasi Voucher Mandiri (Tanpa Backend)**: Integrasi dengan *Pesan Terima Kasih* Trakteer.id. Kode diverifikasi secara aman menggunakan SHA-256 hash di sisi klien.
- 💾 **Penyimpanan Lokal (Persistence)**: Semua kemajuan belajar, skor, dan status pembayaran disimpan dengan aman di `localStorage` web browser Anda.
- 📱 **Desain Responsif**: Dukungan penuh untuk perangkat ponsel (layout single-panel dengan tab toggle) hingga layar desktop ultra-lebar.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/) dengan [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (dengan middleware `persist` untuk sinkronisasi `localStorage`)
- **Styling**: Vanilla CSS (CSS Variables untuk Dark/Light mode)

---

## 🚀 Memulai (Lokal)

### 1. Prasyarat
Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) (versi 18 ke atas disarankan).

### 2. Kloning Repositori
```bash
git clone https://github.com/paylays/rcplay.git
cd rcplay
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Jalankan Server Dev
```bash
npm run dev
```
Buka [http://localhost:5173/](http://localhost:5173/) di browser Anda.

---

## 🗂️ Struktur Proyek

```
rcplay/
├── vite.config.ts        # Konfigurasi bundler Vite & base path
├── scripts/
│   └── parse-markdown.mjs # Script untuk mengekstrak markdown TOEFL ke dalam data aplikasi
├── src/
    ├── App.tsx           # Router & Logika Middleware Akses
    ├── index.css         # Pusat seluruh stylesheet (Sistem Desain, Tema & Komponen)
    ├── components/       # Komponen global (ThemeToggle, LockedModal, dll.)
    ├── store/            # Pengaturan Zustand store (useAccess & useProgress)
    ├── utils/            # Utilitas pembantu (crypto, exportResult)
    └── pages/            # Halaman aplikasi (Gate, Home, Quiz, Results, Dashboard)
```

---

## 📄 Lisensi & Kredit

- **Sumber Soal**: TOEFL PBT Practice Tests 30–46 (Reading Comprehension Section).
- **Pengembang**: Ditulis dan dikembangkan oleh [paylays](https://github.com/paylays).

Proyek ini berada di bawah lisensi MIT. Silakan gunakan dan sesuaikan untuk keperluan belajar atau komersial Anda secara bertanggung jawab.
