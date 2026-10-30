# Everafter Studio — full source code

Seluruh kode sumber wedding website maker: HTML, CSS, JavaScript, foto contoh, font, musik, pemeriksaan aplikasi, dan skrip pembuat aset. Kode aplikasi ada di folder `public/`, dapat diedit langsung, dan tidak memerlukan bundler atau proses build.

## Upload ke GitHub, lalu deploy ke Vercel

1. Ekstrak ZIP ini di komputer.
2. Buat repository baru di GitHub.
3. Upload **seluruh isi folder hasil ekstrak** ke root repository: folder `public/`, `package.json`, `vercel.json`, `README.md`, `verify.mjs`, `prepare_assets.py`, dan `.gitignore`.
4. Commit perubahan. Pastikan `vercel.json` dan `package.json` terlihat pada halaman utama repository. Upload file hasil ekstrak, bukan file ZIP.
5. Di dashboard Vercel, pilih **Add New → Project**, hubungkan GitHub, lalu impor repository tadi.
6. Root Directory: root repository, yaitu folder yang berisi `vercel.json`.
7. Framework Preset: **Other**. Output Directory: **public**. Build Command dan Install Command: kosong / skip. Nilai ini sudah disiapkan di `vercel.json`.
8. Klik **Deploy** dan tunggu URL website ditampilkan.

Tidak perlu menjalankan terminal untuk alur upload GitHub dan impor dashboard di atas. Tidak perlu API key, database, environment variable, atau login ChatGPT untuk aplikasi ini. Paket source ini belum dihubungkan dengan akun GitHub atau Vercel mana pun.

## Struktur kode

```text
everafter-full-source/
├── public/
│   ├── index.html          # Struktur halaman editor
│   ├── styles.css          # Desain dan tata letak responsif
│   ├── app.js              # Editor, upload, autosave, backup, ekspor
│   ├── invitation.js       # Tema dan generator halaman undangan
│   └── assets/             # Foto, musik, font, favicon, dan lisensi
├── package.json            # Metadata proyek dan perintah lokal
├── vercel.json             # Konfigurasi deployment Vercel
├── verify.mjs              # Pemeriksaan aplikasi
├── prepare_assets.py       # Skrip original pembuat musik/pengambil font
├── .gitignore
└── README.md
```

## Fitur

- Empat template, pilihan palet warna, warna kustom, dan tipografi.
- Editor nama pasangan, keluarga, cerita, tanggal, jam, zona waktu, tempat, dan alamat acara.
- Foto sampul dan galeri; unggah serta optimasi foto.
- Tiga musik piano bawaan, unggah lagu pribadi, volume, dan pemutaran musik.
- Empat gaya gerakan, kelopak dekoratif, dan dukungan reduced motion.
- Pratinjau desktop/ponsel, countdown, tautan lokasi, dan RSVP melalui WhatsApp.
- Autosave di IndexedDB, unduh/impor cadangan proyek JSON.
- Ekspor website undangan menjadi satu file HTML dengan foto, musik, dan font tertanam.

## Batas penyimpanan versi ini

Proyek tersimpan pada browser dan perangkat masing-masing. Belum ada akun pengguna, sinkronisasi cloud, atau database RSVP. RSVP diteruskan melalui WhatsApp. Backup `.json` bisa diimpor untuk memindahkan editan ke perangkat atau domain lain. Hasil ekspor HTML perlu diunggah ke hosting untuk memiliki tautan undangan publik tersendiri.

## Menjalankan secara lokal (opsional)

Jika Python tersedia, dari folder proyek jalankan:

```sh
python -m http.server 4173 --bind 127.0.0.1 --directory public
```

Buka http://127.0.0.1:4173/. Gunakan server HTTP/HTTPS, karena aplikasi memakai modul JavaScript.

Jika Node.js/npm tersedia, pemeriksaan kode dapat dijalankan dengan:

```sh
npm run check
```

## Aset dan lisensi

Foto contoh: Unsplash, ID `1519741497674-611481863552` dan `1511285560929-80b456fea0bc`.

Font: DM Sans dan Cormorant Garamond, menggunakan SIL Open Font License; berkas lisensi disertakan pada `public/assets/`.

Musik: tiga instrumental piano original yang dihasilkan oleh `prepare_assets.py`. Aset sudah tersedia di paket ini. Skrip tersebut hanya perlu dijalankan jika ingin membuat ulang aset, dan akan mengunduh font dari Google Fonts serta menulis ulang musik bawaan.

Referensi deployment: https://vercel.com/docs/git dan https://vercel.com/docs/builds/configure-a-build.
