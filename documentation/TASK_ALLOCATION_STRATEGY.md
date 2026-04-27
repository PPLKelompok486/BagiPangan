# Strategi Alokasi Tugas & Pencegahan Blocker (BagiPangan)

Berdasarkan analisis kemajuan di `PROGRESS_VS_PROPOSAL.md` dan struktur tim yang baru direvisi, pembagian tugas sebelumnya berpotensi besar menimbulkan *blocker* karena fitur yang saling bergantung (seperti API backend dan integrasi frontend) dikerjakan secara tidak sinkron, atau fitur krusial diberikan kepada anggota tim yang kurang berpengalaman.

Dokumen ini merumuskan strategi alokasi tugas yang optimal untuk mengeksekusi sisa *backlog* tanpa *bottleneck*.

## 1. Peran & Tanggung Jawab Tim (Revised)

| Nama | Peran | Fokus Utama |
|---|---|---|
| **Afif** | Lead | Arsitektur, Code Review rutin, *Unblocker* (membantu masalah teknis yang buntu), Backend *Security/Auth*. |
| **Repan** | Main Developer | Fitur inti (Backend & Frontend integrasi) khususnya modul Donatur. |
| **Natan** | Main Developer | Fitur inti (Backend & Frontend integrasi) khususnya modul Penerima (Receiver) & Peta. |
| **Niken** | JIRA Lead | Manajemen *backlog*, *Progress tracking*, QA/Testing mandiri, dan integrasi UI ringan. |
| **Aliffia** | Slack / Comms | Dokumentasi teknis, komunikasi tim, koordinasi *merge conflict*, perbaikan *bug/styling* kecil. |
| **Arap (Zacky)** | Free Agent | Fitur terisolasi (contoh: Notifikasi, Riwayat). |
| **Repa (Refa)** | Free Agent | Fitur CRUD sederhana (contoh: Kategori). |
| **Isabel** | Free Agent | Fitur CRUD UI/Profile atau tampilan statis. |

---

## 2. Analisis Potensi Blocker Utama Saat Ini

1. **Backend vs Frontend Desync:** Jika backend untuk "Posting Donasi" belum selesai, frontend tidak bisa membuat form dan list dengan benar. **Solusi:** Repan dan Natan harus mengerjakan fitur secara *Vertical Slice* (Backend + Frontend sekaligus untuk satu fitur), alih-alih memisahkan orang Frontend dan Backend murni.
2. **Ketergantungan Alur (Donasi -> Klaim -> Konfirmasi):** Fitur klaim tidak bisa dites jika fitur posting donasi belum jalan.
3. **Kapasitas Free Agents:** Memberikan fitur kompleks (seperti Moderasi atau Map Visualisasi) kepada *Free Agents* akan menyebabkan *pipeline* berhenti.

---

## 3. Rekomendasi Alokasi Task (Berdasarkan Sprint Recommendation)

Kita akan fokus pada menyelesaikan alur **Donor -> Receiver MVP flow**.

### Sprint A: Membuka Kunci Ekosistem (Post -> List -> Detail)
*Prioritas: Memastikan donasi bisa dibuat dan dilihat.*

*   **Penyelesaian Login & Session (FR-03)**
    *   **Assignee:** Afif (Lead)
    *   *Alasan:* Ini memblokir semua interaksi otentikasi. Lead harus mengamankan fondasi ini agar dev lain bisa pakai identitas *user*.
*   **Manajemen Posting Donasi CRUD (FR-06)**
    *   **Assignee:** Repan (Main Dev)
    *   *Alasan:* Ini adalah hulu dari semua data. Butuh developer kuat untuk memastikan API dan UI form posting (termasuk *upload* lokasi/foto jika ada) mulus.
*   **Pencarian & Detail Donasi (FR-08 & FR-09)**
    *   **Assignee:** Natan (Main Dev)
    *   *Alasan:* Melibatkan tampilan *list* dan *fetching* data. Natan yang sebelumnya pegang Map akan mudah mengintegrasikan *listing* geografis ini.
*   **Manajemen Kategori CRUD (FR-05) - Admin**
    *   **Assignee:** Repa (Free Agent)
    *   *Alasan:* Model/Tabel sudah ada. Tinggal buat CRUD API sederhana dan UI page admin. Cocok untuk *Free Agent*, terisolasi, dan tidak terlalu memblokir alur utama jika telat.

### Sprint B: Transaksi Klaim & Penyelesaian (Claim -> Proof -> History)
*Prioritas: Memfasilitasi penerimaan dan konfirmasi.*

*   **Klaim Donasi & Unggah Bukti (FR-10 & FR-11)**
    *   **Assignee:** Natan (Main Dev) (Frontend) & Repan (Main Dev) (Backend)
    *   *Alasan:* Kolaborasi dua *Main Dev* karena melibatkan perubahan *state* Donasi (Tersedia -> Diklaim -> Selesai) dan unggah file gambar (Mungkin ke lokal storage/S3).
*   **Riwayat Donasi & Riwayat Klaim (FR-13 & FR-14)**
    *   **Assignee:** Isabel & Arap (Free Agents) dibantu Niken (QA/JIRA)
    *   *Alasan:* Fitur ini pada dasarnya hanya `GET /api/donations?user_id=X`. Relatif mudah dari sisi backend dan hanya butuh tabel UI di frontend.
*   **Notifikasi Placeholder / UI (FR-12)**
    *   **Assignee:** Arap (Free Agent)
    *   *Alasan:* Membuat *dropdown* UI notifikasi statis di Header terlebih dahulu, API-nya mengekor.

### Tugas Berkelanjutan (Ongoing)
*   **Manajemen Profile (FR-04):** Repa atau Isabel.
*   **Audit Logging (Sisa FR-18) & Admin Moderation UI Finish:** Aliffia & Afif.

---

## 4. SOP Mencegah Blocker

1. **Gunakan API Mocking:** Jika backend belum siap, Natan/Repan di frontend HARUS menggunakan *dummy data* (JSON statis di codebase) agar UI bisa progres tanpa harus menunggu API selesai.
2. **Afif sebagai "Pemadam Kebakaran":** Afif tidak mengambil *user story* yang memakan banyak waktu untuk UI. Afif fokus pada infrastruktur (seperti Login), *Merge Pull Request*, memberi arahan di Slack (dibantu Aliffia), dan langsung *pair-programming* jika Repa/Isabel/Arap buntu lebih dari 1 hari.
3. **Daily Check-in di Slack (Tugas Aliffia):** Aliffia bertanggung jawab menanyakan 3 hal setiap hari: *Apa yang dikerjakan kemarin? Apa yang dikerjakan hari ini? Ada blocker?*
4. **Niken Menjaga JIRA:** Jika *story* terlalu besar, Niken memecahnya jadi *Sub-tasks* (misal: "Buat API Donasi", "Buat UI Donasi").
