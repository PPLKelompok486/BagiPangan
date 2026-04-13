# 🚀 Panduan Setup Proyek BagiPangan

Halo! Terima kasih sudah bergabung di tim pengembang BagiPangan. Ikuti langkah-langkah di bawah ini untuk menjalankan proyek di perangkat lokal kamu.

## 🛠️ Prasyarat (Prerequisites)

Pastikan kamu sudah menginstal komponen berikut:
- **PHP 8.5+** (Wajib, proyek ini menggunakan fitur PHP terbaru)
- **Composer** (Untuk dependensi Laravel)
- **Node.js & npm** (Untuk dependensi Next.js & Frontend)
- **PostgreSQL** (Atau akses ke Supabase)

### Konfigurasi PHP
Pastikan extension berikut sudah aktif di `php.ini` kamu:
- `openssl`
- `mbstring`
- `curl`
- `fileinfo`
- `pdo_pgsql`
- `pgsql`

---

## 🏃 Langkah-langkah Instalasi

### 1. Clone Repositori
```bash
git clone <url-repo-bagipangan>
cd BagiPangan
```

### 2. Setup Backend (Laravel)
```bash
cd be-laravel

# Instal dependensi
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Jalankan migrasi database
php artisan migrate
```
> **Catatan:** Jangan lupa sesuaikan konfigurasi database (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) di file `.env` Laravel.

### 3. Setup Frontend (Next.js)
```bash
cd ../fe-nextjs

# Instal dependensi
npm install

# Copy environment file
cp .env.local.example .env.local
```

---

## 🚀 Menjalankan Proyek

Kamu bisa menjalankan backend dan frontend secara bersamaan dengan satu perintah dari **root directory**:

1. Kembali ke folder utama (`BagiPangan`).
2. Jalankan perintah:
```bash
npm run dev
```

Ini akan menjalankan:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000

---

## 📂 Struktur Proyek
- `be-laravel/`: API Backend menggunakan Laravel 13.
- `fe-nextjs/`: Antarmuka pengguna menggunakan Next.js.

## 🤝 Kontribusi
1. Checkout branch baru: `git checkout -b feature/nama-fitur`
2. Commit perubahan: `git commit -m "Add some feature"`
3. Push ke branch: `git push origin feature/nama-fitur`
4. Buat Pull Request.

Selamat ngoding! 🍳🥦
