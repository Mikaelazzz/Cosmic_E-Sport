# 🚀 Repositori Website Cosmic E-Sport UKM

[](https://nextjs.org/)
[](https://www.typescriptlang.org/)
[](https://heroui.com/)
[](https://tailwindcss.com/)
[](https://www.framer.com/motion/)
[](https://www.google.com/search?q=LICENSE)

-----

## 🌟 Deskripsi Proyek

Website **Cosmic E-Sport UKM (Unit Kegiatan Mahasiswa)** adalah *platform* resmi untuk manajemen dan pusat komunitas organisasi E-Sport universitas. Dibangun dengan teknologi modern **Next.js 14 (App Router)** dan *stack* **TypeScript** yang kuat, *platform* ini menyediakan alat komprehensif untuk:

  * **Manajemen Anggota dan Tim:** Pendaftaran, pengelolaan tim, dan pembaruan profil.
  * **Acara dan Pertemuan:** Pembuatan *event*, turnamen, dan penjadwalan pertemuan rutin.
  * **Absensi Digital:** Pelacakan kehadiran anggota menggunakan pemindaian QR Code *real-time*.
  * **Organisasi Internal:** Peran khusus untuk Administrator, Moderator, dan Anggota biasa.

-----

## 📋 Daftar Isi

  * [🌟 Deskripsi Proyek](https://www.google.com/search?q=%23%F0%9F%8C%9F-deskripsi-proyek)
  * [🚀 Fitur Utama Berdasarkan Peran](https://www.google.com/search?q=%23%F0%9F%9A%80-fitur-utama-berdasarkan-peran)
      * [Autentikasi (Auth)](https://www.google.com/search?q=%23autentikasi-auth)
      * [Administrator (Admin)](https://www.google.com/search?q=%23administrator-admin)
      * [Moderator](https://www.google.com/search?q=%23moderator)
      * [Pengguna (User)](https://www.google.com/search?q=%23pengguna-user)
  * [✨ Fitur Tambahan](https://www.google.com/search?q=%23%E2%9C%A8-fitur-tambahan)
  * [🛠️ Teknologi yang Digunakan](https://www.google.com/search?q=%23%EF%B8%8F-teknologi-yang-digunakan)
  * [🔑 Prasyarat & Instalasi](https://www.google.com/search?q=%23%F0%9F%94%91-prasyarat--instalasi)
  * [📁 Struktur Proyek](https://www.google.com/search?q=%23-struktur-proyek)
  * [🗺️ Rencana Pengembangan (Roadmap)](https://www.google.com/search?q=%23%EF%B8%8F-rencana-pengembangan-roadmap)
  * [🤝 Panduan Kontribusi](https://www.google.com/search?q=%23%F0%9F%A4%9D-panduan-kontribusi)
  * [⚖️ Lisensi](https://www.google.com/search?q=%23%EF%B8%8F-lisensi)
  * [📧 Kontak & Tim](https://www.google.com/search?q=%23%F0%9F%93%A7-kontak--tim)

-----

## 🚀 Fitur Utama Berdasarkan Peran

### Autentikasi (Auth)

  * ✅ **Pendaftaran Aman:** Menyediakan proses pendaftaran dengan **Verifikasi Email** yang harus dipenuhi pengguna baru.
  * ✅ **Login & Logout:** Fungsi login dan logout standar.
  * ✅ **Lupa Kata Sandi:** Fitur reset kata sandi dengan alur **Verifikasi Email** yang aman.

[kembali ke atas](https://www.google.com/search?q=%23%F0%9F%93%8B-daftar-isi)

### Administrator (Admin)

  * 🛠️ **Manajemen Periode (CRUD):** Fungsionalitas CRUD penuh untuk mengelola periode akademik (semester), termasuk penentuan status periode aktif.
  * 👥 **Manajemen Pengurus (CRUD):** Mengelola daftar pengurus (Moderator) berdasarkan NIM. Sistem akan otomatis mengatur ulang peran (reset *role*) pengurus menjadi 'user' ketika periode kepengurusan berakhir.
  * 🏆 **Manajemen Prestasi (CRUD):** Fungsionalitas CRUD untuk mencatat dan melacak pencapaian organisasi, termasuk unggah gambar dan kategorisasi berdasarkan tingkat acara (Kampus, Nasional, dll.).
  * 📊 **Dashboard Analitik:** Menyajikan *overview* statistik organisasi seperti total anggota, *event*, dan tren pendaftaran.

[kembali ke atas](https://www.google.com/search?q=%23%F0%9F%93%8B-daftar-isi)

### Moderator

  * 👨‍💻 **Manajemen Pengguna (CRUD):** Mengelola pengguna non-admin (Anggota), termasuk menambah, mengedit detail pengguna, melihat riwayat kehadiran, dan potensi fitur *reset* kata sandi.
  * 📅 **Penjadwalan Pertemuan (CRUD):** Membuat, mengelola, dan melacak jadwal pertemuan rutin (*Jadwal Pertemuan*).
  * 📲 **Absensi QR Real-Time:** Memulai dan mengakhiri sesi pertemuan untuk mengaktifkan **Generasi QR Code Real-Time** yang digunakan anggota untuk memindai kehadiran. Mendukung pembaruan absensi manual dan ekspor ke PDF/CSV.
  * ⭐ **Manajemen Event (CRUD):** Fungsionalitas CRUD untuk mengorganisir *event* dan kompetisi E-Sport.
  * 🏟️ **Sistem Turnamen:** Membuat dan mengelola struktur turnamen lanjutan seperti *bracket* **Single Elimination** dan **Group Stage**, memperbarui skor pertandingan, dan menghitung *win rate* tim.
  * 👥 **Persetujuan Peserta:** Mengelola pendaftar *event*, termasuk menyetujui/menolak aplikasi (dengan alasan penolakan) dan melacak bukti pembayaran.
  * 📣 **Manajemen Informasi (CRUD):** Membuat dan mengelola pengumuman (*Informasi*) dengan status publikasi terjadwal (Aktif/Terjadwal/Kedaluwarsa ditentukan otomatis berdasarkan tanggal).

[kembali ke atas](https://www.google.com/search?q=%23%F0%9F%93%8B-daftar-isi)

### Pengguna (User)

  * 🫂 **Manajemen Tim (CRUD):** Pengguna dapat **Membuat** atau **Mengirim Permintaan Bergabung** ke satu tim. Pemimpin tim memiliki alat untuk mengelola anggota (Setujui/Tolak permintaan, Hapus anggota, Ganti pemimpin).
  * 🎮 **Partisipasi Event:** Mendaftar ke *event* sebagai **Individu** atau mendaftarkan **Tim**. Termasuk unggah **Bukti Pembayaran** dan pelacakan status pendaftaran (Menunggu/Disetujui/Ditolak).
  * 📱 **Absensi Pertemuan:** Merekam kehadiran pertemuan dengan cepat menggunakan **QR Scanner** bawaan pada *dashboard*.
  * ⚙️ **Manajemen Profil:** Memperbarui detail pribadi (Nama, NIM, Jabatan) dan mengelola **Gambar Profil** (dengan alat *cropping* 1:1 di aplikasi).
  * 🕹️ **Games/Utilities:** Akses alat-alat menyenangkan yang berinteraksi dengan API *gaming* publik.
      * **Hero Shuffle:** Mengacak pilihan *hero* dan *role*.
      * **Tebak Gambar:** Kuis gambar untuk menebak nama *hero* dari bagian gambar yang diperbesar.
      * **Cek Region:** Utilitas untuk memeriksa ID pengguna/zona terhadap API publik.

[kembali ke atas](https://www.google.com/search?q=%23%F0%9F%93%8B-daftar-isi)

## ✨ Fitur Tambahan

  * 🎨 **UI Modern & Responsif:** Dibangun menggunakan **HeroUI v2** dan **Tailwind CSS** untuk pengalaman pengguna yang profesional dan sepenuhnya responsif.
  * 🎬 **UX Dinamis:** Menggunakan **GSAP** dan **Framer Motion** untuk animasi yang menarik pada *landing page* dan transisi yang mulus.
  * 🌓 **Mode Gelap (Dark Mode):** Perpindahan tema yang mulus didukung oleh `next-themes`.
  * ⚙️ **Next.js API Routes:** Logika *backend* yang bersih dan modular diimplementasikan menggunakan *API routes* Next.js 14 untuk semua interaksi database (diasumsikan menggunakan Supabase).
  * **Penerapan Peran:** Setiap rute dilindungi oleh *middleware* untuk memastikan hanya peran yang tepat (Admin, Moderator, User) yang dapat mengakses halaman yang bersangkutan.

[kembali ke atas](https://www.google.com/search?q=%23%F0%9F%93%8B-daftar-isi)

## 🛠️ Teknologi yang Digunakan

| Kategori | Teknologi | Versi / Detail | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js** | **14.x** (App Router) | *Framework* React untuk produksi. |
| **Bahasa Pemrograman** | **TypeScript** | ^5.x | *Superset* JavaScript yang memiliki *type* yang kuat. |
| **UI/Styling** | **HeroUI** | **v2** | Pustaka komponen UI modern berbasis utilitas. |
| | **Tailwind CSS** | ^4.x | *Framework* CSS *utility-first*. |
| | **Tailwind Variants** | ^2.x | Memungkinkan manajemen variasi komponen yang lebih baik. |
| **Animasi** | **Framer Motion** | ^11.x | Pustaka untuk animasi siap produksi. |
| | **GSAP** | ^3.x | Pustaka animasi JavaScript tingkat profesional untuk *landing page*. |
| **Database/Backend** | **Supabase** | `supabase-js` ^2.x | Digunakan untuk database, autentikasi, dan penyimpanan file (implied). |
| **Utilities** | **next-themes** | ^0.4.x | Pengelolaan tema (Mode Gelap) untuk aplikasi Next.js. |
| | **`jsPDF`** | ^3.x | Digunakan untuk generasi laporan PDF (Absensi). |
| | **`qrcode` / `jsqr` / `qr-scanner`** | Terbaru | Digunakan untuk generasi dan pemindaian QR Code. |

[kembali ke atas](https://www.google.com/search?q=%23%F0%9F%93%8B-daftar-isi)

## 🔑 Prasyarat & Instalasi

### Prasyarat

Pastikan Anda telah menginstal yang berikut ini:

  * **Node.js**: Versi 18+ (LTS direkomendasikan).
  * **npm, yarn, atau pnpm**: Manajer paket pilihan Anda.
  * **Git**: Untuk *cloning* repositori.
  * **Supabase Project**: Anda harus memiliki proyek Supabase yang berjalan untuk *backend* database dan *storage*.

### Konfigurasi Lingkungan

Buat file bernama `.env.local` di direktori *root* dan konfigurasikan variabel berikut:

```.env.local
# --- Supabase Configuration ---
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"

# --- Email Configuration (for verification/password reset) ---
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="YOUR_SENDER_EMAIL@gmail.com"
EMAIL_PASS="YOUR_APP_PASSWORD"
EMAIL_FROM="Cosmic E-Sport <YOUR_SENDER_EMAIL@gmail.com>"
EMAIL_FROM_NAME="Cosmic E-Sport"
```

### Instalasi & Penggunaan

1.  **Clone repositori:**

    ```bash
    git clone <repository-url>
    cd cosmic_e-sport
    ```

2.  **Instal dependensi:**

    ```bash
    npm install
    # ATAU
    # yarn install
    # ATAU
    # pnpm install
    ```

3.  **Pengaturan `pnpm` (Opsional)**
    Jika Anda menggunakan **`pnpm`**, Anda perlu menambahkan konfigurasi *hoisting* berikut ke file **`.npmrc`** di direktori *root*:

    ```bash
    public-hoist-pattern[]=*@heroui/*
    ```

    Setelah membuat file, jalankan `pnpm install` lagi untuk memastikan instalasi yang benar.

4.  **Jalankan *development server*:**

    ```bash
    npm run dev
    # ATAU
    # yarn dev
    # ATAU
    # pnpm dev --turbo
    ```

Aplikasi akan dapat diakses di [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000).

[kembali ke atas](https://www.google.com/search?q=%23%F0%9F%93%8B-daftar-isi)

## 📁 Struktur Proyek

Proyek ini mengikuti struktur standar Next.js 14 App Router, yang memisahkan logika *frontend* dan *backend* (API *routes*) dengan jelas:

```
cosmic_e-sport/
├── .next/                    # Output build
├── app/                      # Logika aplikasi utama (App Router)
│   ├── api/                  # Backend API routes untuk semua CRUD
│   │   ├── admin/            # Endpoint API khusus Admin
│   │   ├── auth/             # Endpoint Autentikasi (login, register, dll.)
│   │   ├── moderator/        # Endpoint API khusus Moderator
│   │   ├── user/             # Endpoint API khusus Pengguna
│   │   └── ...
│   ├── admin/                # Halaman Dashboard Admin
│   ├── auth/                 # Halaman Autentikasi
│   ├── moderator/            # Halaman Dashboard Moderator
│   ├── user/                 # Halaman Dashboard Pengguna (tim, event, games)
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/               # Komponen React yang dapat digunakan kembali
├── config/                   # File konfigurasi (site metadata, fonts)
├── context/                  # Contexts Global (AuthContext)
├── lib/                      # Fungsi utilitas (db, auth, cookies, dll.)
├── public/                   # Aset statis (gambar, logo, font)
├── styles/                   # CSS global dan custom styles
├── types/                    # Definisi TypeScript
├── package.json
└── README.md
```

[kembali ke atas](https://www.google.com/search?q=%23%F0%9F%93%8B-daftar-isi)

## 🗺️ Rencana Pengembangan (Roadmap)

Fitur-fitur berikut direncanakan untuk pengembangan lebih lanjut:

  * **Template Email HTML:** Menerapkan *template* HTML yang dapat disesuaikan untuk email (Verifikasi, Reset Password, Notifikasi).
  * **Layout & Responsif:** Menyelesaikan konsistensi *layout* dan responsivitas untuk *dashboard* Moderator, User, dan *Landing Page*.
  * **Fitur Games:** Menerapkan fitur yang tersisa di bagian 'Games' (misalnya, *First Purchase* dan fitur lainnya).
  * **Notifikasi WEB & HP:** Menyempurnakan implementasi sistem notifikasi web/mobile untuk pembaruan penting (fitur sebelumnya gagal).

[kembali ke atas](https://www.google.com/search?q=%23%F0%9F%93%8B-daftar-isi)

## 🤝 Panduan Kontribusi

Kami menyambut kontribusi dari siapa pun\! Untuk berkontribusi pada proyek ini, ikuti langkah-langkah di bawah ini:

1.  **Fork** repositori ini.
2.  **Clone** repositori yang telah Anda *fork*.
3.  Buat *branch* fitur baru (`git checkout -b feature/nama-fitur-anda`).
4.  *Commit* perubahan Anda mengikuti konvensi pesan *commit* yang jelas dan deskriptif.
5.  *Push* *branch* Anda ke *fork* Anda.
6.  Buka **Pull Request** ke *branch* `main` dari repositori ini.

Pastikan kode Anda mematuhi standar *coding* proyek.

[kembali ke atas](https://www.google.com/search?q=%23%F0%9F%93%8B-daftar-isi)

## ⚖️ Lisensi

Proyek ini dilisensikan di bawah **Lisensi MIT**.

```
MIT License

Copyright (c) 2023 Next UI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

[kembali ke atas](https://www.google.com/search?q=%23%F0%9F%93%8B-daftar-isi)

## 📧 Kontak & Tim

Untuk pertanyaan, masalah, atau permintaan kolaborasi, silakan hubungi:

  * **Pengembang Utama:** [Mikaelaazz](https://www.google.com/search?q=https://github.com/Mikaelaazz)
  * **Email UKM Cosmic E-Sport :** [cosmic e-sport](mailto:cosmic.esport@ukdc.ac.id)
  * **Instagram:** [@cosmic.ukdc](https://www.instagram.com/cosmic.ukdc/)

-----
