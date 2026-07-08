# PRD: TOEFL PBT English Practice App

## Ringkasan Produk

Sebuah aplikasi web berbasis latihan soal TOEFL Paper-Based Test (PBT) yang dikemas dalam antarmuka modern, editorial, dan berkarakter. Materi soal bersumber dari file markdown **TOEFL-PBT-Practice-test.md** yang memuat 17 Practice Test (Test 30–46) dengan total ±850 soal Reading Comprehension berbentuk pilihan ganda beserta kunci jawabannya.

---

## 1. Latar Belakang & Tujuan

| Item | Detail |
|------|--------|
| **Masalah** | Latihan TOEFL biasanya dilakukan secara manual dengan membaca PDF/buku, tidak ada feedback instan, dan sulit melacak progres. |
| **Solusi** | Web app interaktif yang menyajikan soal pilihan ganda secara digital, memberikan koreksi otomatis, timer sesi, dan merangkum performa pengguna per test. |
| **Target Pengguna** | Pelajar/mahasiswa Indonesia yang mempersiapkan diri menghadapi ujian TOEFL PBT — khususnya bagian Reading Comprehension. |
| **Platform** | Website (responsive — desktop & mobile) |
| **Bahasa Antarmuka** | **Bahasa Indonesia** |
| **Tech Stack** | **React + TypeScript + Vite** |

---

## 2. Analisis Data Sumber

### 2.1 Struktur Materi
File `TOEFL-PBT-Practice-test.md` memuat:

| Practice Test | Periode | Jumlah Soal (estimasi) |
|--------------|---------|----------------------|
| Test 30 | Oktober 1997 | 50 soal |
| Test 31 | Desember 1997 | 50 soal |
| Test 32 | Januari 1996 | 50 soal |
| Test 33 | – | 50 soal |
| Test 34 | – | 50 soal |
| Test 35 | – | 50 soal |
| Test 36 | – | 50 soal |
| Test 37 | Desember 1996 | 50 soal |
| Test 38 | – | ~33 soal |
| Test 39 | – | ~33 soal |
| Test 40 | – | 50 soal |
| Test 41 | – | 50 soal |
| Test 42 | – | 50 soal |
| Test 43 | – | ~38 soal |
| Test 44 | – | ~36 soal |
| Test 45 | – | ~36 soal |
| Test 46 | – | ~25 soal (Reading Only) |

**Total estimasi: ~750–850 soal**

### 2.2 Struktur Soal per Test
Setiap Practice Test terdiri dari:
- **Passage** (teks bacaan, 1–3 paragraf)
- **Question Group** (sekumpulan soal yang merujuk pada satu passage)
- **Pilihan jawaban** berformat: A, B, C, D

### 2.3 Format Kunci Jawaban
Kunci jawaban tersimpan di bagian akhir file dalam format string tanpa spasi per grup 5:
```
CDCBC DACBC DDDCC ABBAC DBCAD ABACD BABBC CAABB BBABC AACCD
```
→ Artinya: soal 1=C, soal 2=D, soal 3=C, soal 4=B, soal 5=C, dst.

> [!IMPORTANT]
> Format kunci jawaban beberapa test (38, 39, 43, 44, 45, 46) memiliki grup yang tidak selalu 5 karakter — perlu parsing khusus per test menggunakan pendekatan: hapus semua spasi → split per karakter.

---

## 3. Keputusan Teknis

| Pertanyaan | Keputusan |
|-----------|-----------|
| Parsing strategy | **Pre-parsed ke JSON** (bukan runtime) — lebih cepat, stabil, dan mudah di-debug |
| Scope soal | **Reading Comprehension saja** |
| Bahasa UI | **Bahasa Indonesia** |
| Timer | **Masuk MVP** |
| Tech stack | **React + TypeScript + Vite** |

---

## 4. Fitur Utama (MVP)

### F1 — Halaman Beranda (Pilih Test)
- Tampilan grid 17 kartu test
- Setiap kartu: nomor test, periode, jumlah soal, status pengerjaan + skor terakhir
- Tidak ada sidebar atau navbar yang kaku — layout editorial asimetris

### F2 — Mode Latihan Soal (Quiz Mode)
- **1 soal per layar**, step-by-step
- Setiap layar berisi:
  - Teks passage (panel scrollable)
  - Nomor soal + progress bar
  - Teks pertanyaan
  - 4 pilihan (A, B, C, D)
  - Tombol **"Jawab & Lanjut"** (aktif setelah memilih)
- Navigasi maju/mundur antar soal

### F3 — Timer Sesi
- **Standar TOEFL**: 55 menit untuk 50 soal, disesuaikan untuk test dengan soal lebih sedikit (prorata)
- Timer tampil prominently di header
- Peringatan visual saat tersisa < 5 menit (animasi warna)
- Ketika timer habis → otomatis submit dan tampilkan hasil

### F4 — Feedback Jawaban
- Setelah menekan "Jawab & Lanjut":
  - Jawaban benar → highlight warna sukses
  - Jawaban salah → highlight warna error + tampilkan jawaban benar
  - Animasi micro-interaction saat feedback muncul (bukan fade biasa)

### F5 — Halaman Hasil (Score Screen)
- Skor total (mis: 38 / 50)
- Persentase visual (arc/donut chart animasi)
- Estimasi skor TOEFL (skala 310–677)
- Ringkasan: berapa soal benar, salah, tidak dijawab
- Tombol: **"Ulangi Test"** | **"Pilih Test Lain"** | **"Review Jawaban"**

### F6 — Review Mode
- Lihat semua soal setelah test selesai
- Setiap soal ditandai ✓ atau ✗
- Jawaban benar selalu terlihat
- Bisa filter: "Tampilkan yang Salah Saja"

### F7 — Progress Tracker (Local Storage)
- Simpan riwayat setiap test di `localStorage`
- Kartu di beranda tampilkan: badge "Selesai", skor terakhir, tanggal

---

## 5. Desain & UI/UX

### 5.1 Filosofi Desain — Anti-Generic, Pro-Editorial

> Desain harus terasa seperti dibuat oleh desainer manusia yang berpengalaman — **bukan template AI**. Setiap keputusan visual harus terasa disengaja dan berkarakter.

**Prinsip Wajib:**
- ❌ Tidak ada layout hero-center + 3 kartu fitur generic
- ❌ Tidak ada rounded-xl + shadow-lg + p-6 card template
- ❌ Tidak ada gradient ungu-biru di atas putih polos
- ❌ Tidak ada font Inter/Roboto/sistem sans dengan bobot seragam
- ❌ Tidak ada animasi fade-in halaman yang lambat

**Prinsip Aktif:**
- ✅ Komposisi asimetris dan overlapping elemen
- ✅ Grid yang disengaja "dipatahkan" di beberapa titik untuk terasa organik
- ✅ Kontras bobot font ekstrem: display header 900 + body 400
- ✅ Palet warna yang tidak umum dan bertujuan
- ✅ Micro-interactions dengan `cubic-bezier` custom, bukan ease-in-out default
- ✅ Motion yang purposeful — hanya bergerak ketika ada makna di baliknya

### 5.2 Palet Warna

Inspirasi: Warna ink/kertas lama bertemu digital precision.

| Peran | Warna | Kode |
|------|-------|------|
| Background utama | Off-black editorial | `#0D0D0D` |
| Surface/panel | Charcoal hangat | `#1A1A18` |
| Aksen primer | Kuning amber tajam | `#E8C547` |
| Aksen sekunder | Putih keabuan | `#E8E4DC` |
| Error/salah | Merah bata | `#C0392B` |
| Sukses/benar | Hijau sage | `#4A7C59` |
| Teks utama | Off-white | `#F0EDE8` |
| Teks sekunder | Abu medium | `#8A8680` |

> [!NOTE]
> Tidak ada biru-ungu. Palet bertema **editorial + akademis** — membangkitkan nuansa majalah literasi premium, bukan aplikasi edtech generik.

### 5.3 Tipografi

```
Display/Judul    : "Playfair Display" — weight 900, untuk judul besar
Sub-judul        : "DM Sans"          — weight 600, untuk label & heading section
Body/Soal        : "Source Serif 4"   — weight 400, untuk teks passage & pertanyaan
Monospace/Skor   : "DM Mono"          — weight 500, untuk angka & kode
```

Kontras antar bobot harus terasa tajam — display 900 vs body 400 pada halaman yang sama.

### 5.4 Layout Komposisi

**Halaman Beranda:**
- Header: judul besar rata kiri, bukan center — dengan underscore dekoratif
- Sub-teks deskripsi ada di kanan, tidak sejajar vertikal dengan judul (asimetris)
- Grid kartu: tidak semua kolom sama lebar — ada kartu "featured" lebih besar
- Tidak ada navbar floating yang kaku

**Halaman Quiz:**
- Desktop: 2 panel — passage 45% | soal 55% — divider vertikal bukan border biasa
- Passage panel punya background sedikit lebih terang dengan tekstur grain subtle
- Nomor soal: besar, bold, kuning — posisi pojok kiri atas, bukan centered
- Progress: garis tipis horizontal di paling atas halaman, bukan progress bar tebal

**Halaman Hasil:**
- Skor ditampilkan sebagai angka besar di atas, bukan di dalam lingkaran
- Layout split: kiri = angka & level, kanan = breakdown detail
- Tidak ada confetti atau animasi celebrasi generik

### 5.5 Micro-interactions

- Pilihan jawaban: saat hover, border bergeser ke kiri 4px dengan `cubic-bezier(0.34, 1.56, 0.64, 1)` — terasa "snap"
- Saat pilihan dipilih: background berubah + karakter huruf opsi (A/B/C/D) rotate 0→90→0 singkat
- Feedback jawaban: bukan fade — gunakan "reveal" dari bawah dengan `transform: translateY` + `clip-path`
- Timer saat kritis (<5 menit): digit berkedip dengan animasi custom, bukan CSS `blink`
- Progress bar: smooth fill dengan easing berbeda antara maju dan mundur

---

## 6. Arsitektur Teknis

### 6.1 Stack

```
React 18 + TypeScript + Vite
├── src/
│   ├── main.tsx
│   ├── App.tsx                  # Router utama (react-router-dom)
│   ├── data/
│   │   └── questions.ts         # All 17 tests pre-parsed as TS const
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── store/
│   │   └── useProgress.ts       # Zustand store (localStorage sync)
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Quiz.tsx
│   │   └── Results.tsx
│   ├── components/
│   │   ├── TestCard.tsx
│   │   ├── QuestionPanel.tsx
│   │   ├── PassagePanel.tsx
│   │   ├── AnswerChoice.tsx
│   │   ├── Timer.tsx
│   │   ├── ScoreArc.tsx
│   │   └── ReviewList.tsx
│   └── styles/
│       ├── global.css
│       └── tokens.css           # CSS custom properties (design tokens)
└── scripts/
    └── parse-markdown.ts        # One-time parser: MD → questions.ts
```

**Dependencies utama:**
- `react-router-dom` — routing
- `zustand` — state management ringan
- `vite` — build tool

### 6.2 TypeScript Interfaces

```typescript
interface PracticeTest {
  id: string;              // "PT30"
  title: string;           // "Practice Test 30"
  period?: string;         // "Oktober 1997"
  totalQuestions: number;
  timerMinutes: number;    // Prorata dari 55 menit / 50 soal
  questionGroups: QuestionGroup[];
}

interface QuestionGroup {
  id: string;
  passageTitle?: string;
  passage: string;
  questions: Question[];
}

interface Question {
  id: string;
  number: number;
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

interface TestProgress {
  completed: boolean;
  score: number;
  total: number;
  timeTaken?: number;    // detik
  lastAttempt: string;  // ISO date
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>;
}
```

### 6.3 Penyimpanan Lokal (Zustand + localStorage)

```typescript
// localStorage key: "toefl_progress"
{
  "PT30": {
    "completed": true,
    "score": 42,
    "total": 50,
    "timeTaken": 2847,
    "lastAttempt": "2026-07-08",
    "answers": { "1": "C", "2": "D", ... }
  }
}
```

---

## 7. Pemetaan Kunci Jawaban

| Test | Raw Answer Key | Total Soal |
|------|---------------|------------|
| PT30 | `CDCBC DACBC DDDCC ABBAC DBCAD ABACD BABBC CAABB BBABC AACCD` | 50 |
| PT31 | `BDADC DACBC CBACD ACDBA DBCAD DBACB CCDDB BDACA BACDA BACCD` | 50 |
| PT32 | `ABBDC BCCDB BACCD BCDAB BABDD CBACA CBDAA DABCD BCAAB DCADD` | 50 |
| PT33 | `DBCCD CABAB DCCAC ABBCA BCADC DADCC BDBAA AADDB BBADB CBDDA` | 50 |
| PT34 | `CBADD CAAAD CBCBC ACABD BADAB ACBCD BDACD CADBA CBDCB CCADA` | 50 |
| PT35 | `ACBAB CCDDB DBBBC ACDAB CCABD DCABC ADBBA BABCA CBACD AACDC` | 50 |
| PT36 | `CCACC BCDCC AACDC BDABB DACAD DBBCA AADDC CDBAB AACBB AABDC` | 50 |
| PT37 | `BDCAD ADCBA DBBDD BBACC DADBC DACBD BCCCD BAABA CCBAC DDDAD` | 50 |
| PT38 | `CADCAB BDCAC CBACD BCCDAD CACBBCBC` | ~33 |
| PT39 | `ADBACB ABBCAC DAABAD BDDBD BBADDCC` | ~33 |
| PT40 | `DBBDC BACDC BACDA DABAB DADAC DCABD ADCDB BDDAB BDBAD DABCD` | 50 |
| PT41 | `CCBBA DCADA BDCDD AABDB CCDAD BDBAA DCCCD BAABB DABCC DBCAB` | 50 |
| PT42 | `BABAD BADAB BCBCD BBADC DCBCD BDADD CCBDD AAADB CDADB BBBCD` | 50 |
| PT43 | `DCDAB BDABCAB DADBCAB BDDACBA CBBC` | ~38 |
| PT44 | `DABDB CBBAADA DABADC ABDCBA BCDBDA` | ~36 |
| PT45 | `BADDBC DBDA AABDBB BBDCACAA BBCAAD` | ~36 |
| PT46 | `BCCACB CBDDACC CDAB CBBDADB ABCACD` | ~25 |

**Parsing logic:**
```typescript
function parseAnswerKey(raw: string): string[] {
  return raw.replace(/\s/g, '').split('');
}
```

---

## 8. Estimasi Timer per Test

Standar TOEFL PBT: 55 menit untuk 50 soal = **1.1 menit/soal**

| Jumlah Soal | Waktu Timer |
|-------------|-------------|
| 50 soal | 55 menit |
| ~38 soal | 42 menit |
| ~36 soal | 40 menit |
| ~33 soal | 36 menit |
| ~25 soal | 28 menit |

---

## 9. Scope & Milestone

### Phase 1 — Foundation (MVP Core)
- [ ] Script `parse-markdown.ts` → generate `questions.ts`
- [ ] Setup Vite + React + TypeScript + routing
- [ ] Design system: tokens, tipografi, palet warna
- [ ] Halaman Beranda (grid kartu test)
- [ ] Halaman Quiz (passage + soal + pilihan + feedback)
- [ ] Timer countdown dengan peringatan visual
- [ ] Halaman Hasil (skor, arc visual, ringkasan)

### Phase 2 — Polish
- [ ] Micro-interactions & animasi custom cubic-bezier
- [ ] Review Mode (filter soal salah)
- [ ] LocalStorage progress persistence
- [ ] Responsive mobile (layout 1-panel)
- [ ] Indikator status di kartu beranda

### Phase 3 — Enhancement (Opsional)
- [ ] Mode latihan cepat (N soal acak dari semua test)
- [ ] Dashboard statistik keseluruhan
- [ ] Export hasil sebagai gambar/PDF

---

## 10. Kriteria Keberhasilan

| Metrik | Target |
|--------|--------|
| Semua 17 test dapat dimainkan | ✅ |
| Kunci jawaban akurat vs file sumber | ✅ |
| First load < 2 detik | ✅ |
| Responsive 375px s/d 1920px | ✅ |
| Progres tersimpan setelah refresh | ✅ |
| Timer berjalan akurat | ✅ |
| Desain tidak terlihat generic/template-AI | ✅ |

---

## 11. Out of Scope

- Login / akun pengguna (data lokal saja)
- Section Listening atau Structure & Written Expression
- Backend / API eksternal
- Pembuatan soal baru oleh AI

---

*Revisi: 2026-07-08 — Update tech stack (React + TypeScript), bahasa (Indonesia), timer masuk MVP, design constraint anti-AI slop, pre-parsed JSON strategy.*
