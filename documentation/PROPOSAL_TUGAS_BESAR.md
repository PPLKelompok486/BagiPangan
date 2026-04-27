# Proposal Tugas Besar










Proposal Pengembangan Produk

<BagiPangan>

Disusun oleh
<102042300189 - Afif Nur Sena>
<102042300174 - Muhammad Rayfan Pashya>
<102042300117 – Niken Citra Suhisman>
<102042300165 - Aliffia Humaira>
<102042300040 – Refa Dias I delia>
<102042300163 - Ahmad Zacky Al-Baqri>
<102042300161 – Yonathan Hezron>
<102042300176 – Isabella Widia Putri>




## 27/03/2026



Daftar Isi

Contents
1. Pendahuluan ............................................................................................................................ 1
1.1 Latar Belakang ................................................................................................................ 1
1.2 Tujuan ............................................................................................................................. 2
1.3 Output ............................................................................................................................. 2
2. Deskripsi Produk ..................................................................................................................... 4
2.1 Usulan Solusi .................................................................................................................. 4
2.2 Deskripsi Produk ............................................................................................................. 5
2.3 Proses Bisnis ................................................................................................................... 6
3. Kebutuhan Sistem ................................................................................................................... 8
3.1 Kebutuhan Fungsional .................................................................................................... 8
3.1.1 Daftar Kebutuhan .................................................................................................... 8
3.1.2 Karakteristik Pengguna ......................................................................................... 11
3.2 Kebutuhan Non Fungsional .......................................................................................... 11
3.3 Kebutuhan Teknis ......................................................................................................... 12
4. Rancangan Sistem ................................................................................................................. 13
4.1 Use Case Diagram......................................................................................................... 13
4.2 Arsitektur Sistem .......................................................................................................... 31
4.3 Rancangan ERD ............................................................................................................ 33
4.4 Class Diagram ............................................................................................................... 35
4.5 Mockup ......................................................................................................................... 36
5. Metode Pengembangan ......................................................................................................... 52
5.1 Jadwal Pengembangan .................................................................................................. 52
5.2 Tim Pengembang .......................................................................................................... 57




1. Pendahuluan
1.1 Latar Belakang
Indonesia masih menghadapi dua masalah yang berjalan bersamaan, yaitu tingginya jumlah sampah
makanan  dan  belum  meratanya  akses  terhadap  pangan.  Data  menunjukkan  bahwa  sebagian  besar  sampah
makanan yang dihasilkan setiap tahun di Indonesia sebenarnya masih dalam kondisi layak konsumsi. Di sisi
lain, masih terdapat kelompok masyarakat yang mengalami keterbatasan akses terhadap makanan yang cukup
dan layak.
Salah satu penyebab utama kondisi ini adalah belum optimalnya proses distribusi makanan berlebih.
Dalam  praktik  sehari-hari,  penyaluran  makanan  dari  donatur  seperti  rumah  tangga,  pelaku  usaha  makanan,
atau penyelenggara acara masih dilakukan secara manual melalui komunikasi pribadi seperti pesan instan atau
media sosial. Cara ini membuat informasi tidak tersebar luas, sulit diakses secara merata, dan sering kali tidak
terdokumentasi dengan baik. Akibatnya, makanan yang sebenarnya masih bisa dimanfaatkan tidak tersalurkan
secara efektif dan berpotensi terbuang.
Selain itu, proses manual juga tidak memiliki mekanisme pencatatan yang jelas terkait ketersediaan
makanan,  siapa  yang  menerima,  serta  waktu  distribusinya.  Hal  ini  menyebabkan  rendahnya  visibilitas  dan
akuntabilitas dalam proses penyaluran, sehingga menyulitkan evaluasi maupun pengelolaan distribusi secara
lebih terstruktur.
Berdasarkan kondisi tersebut, diperlukan suatu pendekatan yang dapat membantu memperjelas alur distribusi
makanan  berlebih  agar  informasi  dapat  diakses  dengan  lebih  mudah,  serta  proses  penyaluran  dapat  tercatat
dengan lebih sistematis.






1.2 Tujuan
Proyek “BagiPangan” bertujuan   untuk   menyediakan   solusi   berbasis   web   yang   membantu
memperbaiki  proses  distribusi  makanan  berlebih  agar  lebih  terstruktur,  mudah  diakses,  dan  terdokumentasi
dengan baik, sehingga dapat mendukung upaya pengurangan kelaparan dan pemborosan pangan.
### Adapun tujuan dari pengembangan sistem ini adalah sebagai berikut
● Menyediakan platform terpusat yang memungkinkan informasi makanan berlebih dapat diakses oleh lebih
banyak pengguna dibandingkan metode komunikasi manual seperti pesan instan atau media sosial.
● Menyederhanakan proses distribusi makanan berlebih melalui alur yang jelas mulai dari posting, klaim,
hingga konfirmasi, sehingga tidak bergantung pada komunikasi informal.
● Menyediakan pencatatan distribusi yang lebih akuntabel dengan menyimpan data donasi dan klaim secara
sistematis serta menampilkannya dalam dashboard sederhana.
● Mendukung  pengurangan  food  waste  dalam  skala  terbatas  dengan  memfasilitasi  penyaluran  makanan
layak konsumsi kepada pihak yang membutuhkan sebagai kontribusi terhadap SDG 2 dan SDG 12.
1.3 Output
Output dari pengembangan ini adalah sebuah platform digital berbasis web bernama “BagiPangan”,
yang berfungsi untuk memfasilitasi penyaluran makanan berlebih secara lebih terstruktur dan terdokumentasi.
Aplikasi ini dikembangkan menggunakan framework Laravel dan memiliki komponen utama sebagai
### berikut
1. Dashboard  Donor.  Antarmuka  bagi  donatur  untuk  mengelola  data  makanan  berlebih  yang  dimiliki.
Donatur  dapat  menambahkan  informasi  makanan  seperti  nama,  jumlah  porsi,  kategori,  lokasi,  serta
estimasi waktu layak konsumsi. Selain itu, donatur dapat melihat status distribusi dari makanan yang
diposting.
2. Sistem  Listing  dan  Klaim.  Sistem  menyediakan  halaman  daftar  makanan  yang  tersedia  dan  dapat
diakses  oleh  pengguna  lain.  Penerima  dapat  melihat  detail  makanan  dan  melakukan  klaim  secara
langsung  melalui  sistem.  Proses  ini  menggantikan  komunikasi  manual  yang sebelumnya  dilakukan
melalui media informal.
3. Konfirmasi Pengambilan. Setelah klaim dilakukan, penerima melakukan pengambilan makanan secara
langsung (offline) dan mengunggah bukti berupa foto sebagai konfirmasi. Sistem akan mencatat proses
ini sebagai bagian dari riwayat distribusi.



4. Dashboard  dan  Laporan  Sederhana.  Sistem  menyediakan  tampilan  dashboard  yang  menampilkan
ringkasan  data  seperti  jumlah  donasi,  status  distribusi,  serta  riwayat  penyaluran.  Data  ini  dapat
digunakan untuk monitoring sederhana.
Untuk menjaga kesesuaian dengan ruang lingkup proyek perkuliahan, sistem memiliki batasan sebagai
### berikut
1. Sistem  tidak  mencakup  fitur  pemetaan  berbasis  lokasi  atau  algoritma  otomatis,  sehingga  proses
pemilihan donasi dilakukan secara manual oleh pengguna.
2. Distribusi makanan dilakukan secara offline, di mana sistem hanya berfungsi sebagai media informasi
dan pencatatan tanpa integrasi logistik. Sistem hanya menangani makanan siap konsumsi yang masih
layak, dan tidak mencakup bahan mentah maupun limbah pangan.
3. Sistem tidak menyediakan fitur manajemen atau pendaftaran relawan, sehingga interaksi hanya terjadi
antara donatur dan penerima.
4. Akses sistem dibatasi pada pengguna yang telah memiliki akun, tanpa proses verifikasi lanjutan yang
kompleks.





2. Deskripsi Produk
2.1 Usulan Solusi
Berdasarkan  permasalahan  pada  proses  distribusi  makanan  berlebih  yang  masih  dilakukan  secara
manual dan tidak terstruktur, diusulkan sebuah sistem informasi berbasis web bernama BagiPangan. Sistem
ini dirancang untuk memfasilitasi penyaluran makanan melalui alur sederhana, yaitu post → lihat → klaim →
konfirmasi.
Dalam sistem ini, terdapat beberapa peran pengguna, yaitu Donatur, Penerima, dan Admin. Donatur
dapat  memposting  informasi  makanan  berlebih  seperti  nama  makanan,  jumlah,  lokasi,  dan  estimasi  waktu
layak konsumsi. Informasi tersebut kemudian ditampilkan dalam sistem sehingga dapat diakses oleh penerima
atau relawan yang membutuhkan.
Penerima  dapat  melihat  daftar  makanan  yang  tersedia  dan  melakukan  klaim  terhadap  makanan
tersebut.  Setelah  klaim  dilakukan,  proses  pengambilan  dilakukan  secara  langsung  (offline).  Sebagai  bentuk
konfirmasi, penerima mengunggah bukti berupa foto setelah makanan berhasil diambil. Admin berperan dalam
mengelola  data  serta  melakukan  moderasi  untuk  memastikan  informasi  yang  ditampilkan  tetap relevan  dan
valid.
Sistem  ini  juga  menyediakan  pencatatan  data  distribusi  secara  otomatis,  sehingga  setiap  aktivitas
donasi dan klaim terdokumentasi dengan baik. Selain itu, disediakan dashboard sederhana untuk menampilkan
ringkasan informasi seperti jumlah donasi, status distribusi, dan riwayat penyaluran.
Solusi ini dikembangkan sebagai aplikasi web menggunakan framework Laravel, dengan pengujian
fitur dilakukan secara otomatis menggunakan Laravel Dusk untuk memastikan setiap fungsi berjalan sesuai
kebutuhan.
Solusi yang diusulkan secara langsung menjawab permasalahan yang telah diidentifikasi. Penyebaran
informasi  yang  sebelumnya  terbatas  melalui  media  komunikasi  pribadi  diatasi  dengan  adanya  platform
terpusat,  sehingga  informasi  donasi  dapat  diakses  lebih  luas.  Proses  distribusi  yang  sebelumnya  tidak
terstruktur menjadi lebih jelas dengan adanya alur sistematis dari posting hingga konfirmasi.
Selain itu, keterbatasan dalam pencatatan pada proses manual diatasi melalui sistem yang menyimpan
seluruh data transaksi secara otomatis. Hal ini meningkatkan visibilitas dan memungkinkan monitoring melalui
dashboard yang tersedia.



Dengan pendekatan yang sederhana dan terarah, sistem ini tetap realistis untuk dikembangkan dalam
lingkup  proyek  perkuliahan,  namun  mampu  memberikan  peningkatan  dalam  efisiensi  dan  keteraturan
distribusi makanan berlebih.
2.2 Deskripsi Produk
BagiPangan  adalah  platform  berbasis  web  yang  dirancang  untuk  membantu  penyaluran  makanan
berlebih  dari  donatur  seperti  restoran,  katering,  atau  individu  kepada  pihak  yang  membutuhkan.  Sistem  ini
mengubah proses distribusi yang sebelumnya dilakukan secara manual dan tidak terdokumentasi menjadi lebih
terstruktur, mudah diakses, dan tercatat dalam satu platform.
### Fungsi utama
1. Sistem memungkinkan donatur untuk mengunggah informasi makanan berlebih seperti jenis makanan,
jumlah porsi, lokasi, dan estimasi waktu layak konsumsi agar dapat dilihat oleh pengguna lain.
2. Sistem  menyediakan  halaman  daftar  makanan  yang  dapat  diakses  oleh  penerima  untuk  melihat  dan
memilih donasi yang tersedia.
3. Sistem  memfasilitasi  proses  klaim  makanan  oleh  penerima  serta  pencatatan  status  distribusi  dari
tersedia hingga selesai.
4. Sistem  menyediakan  fitur  konfirmasi  pengambilan  melalui  unggahan  bukti  sederhana  berupa  foto
untuk memastikan makanan telah tersalurkan.
### Keunggulan produk
5. Sistem  menyediakan  fitur  konfirmasi  pengambilan  melalui  unggahan  bukti  sederhana  berupa  foto
untuk memastikan makanan telah tersalurkan.
6. Proses  distribusi  menjadi  lebih  cepat  dan  terorganisir  dibandingkan  metode  manual  seperti  pesan
instan yang terbatas jangkauannya.
7. Setiap  aktivitas  donasi  dan  klaim  tercatat  dalam  sistem,  sehingga  meningkatkan  transparansi  dan
kemudahan monitoring.
8. Sistem memiliki alur yang sederhana sehingga mudah digunakan dan realistis untuk dikembangkan
dalam lingkup proyek perkuliahan.
9. Platform  ini  tetap  memberikan  kontribusi  terhadap  pengurangan  food  waste  dengan  memfasilitasi
penyaluran makanan layak konsumsi secara lebih efektif.



2.3 Proses Bisnis
Proses bisnis BagiPangan dirancang untuk mentransformasi distribusi surplus pangan dari mekanisme
manual  yang  sporadis  menjadi  ekosistem  digital  yang  terstruktur,  tersentralisasi,  dan  akuntabel.  Sistem
mengadopsi alur linear "Post-Lihat-Klaim-Konfirmasi" yang melibatkan tiga aktor utama: Donatur (publikasi
data), Penerima (klaim dan verifikasi), dan Admin (manajemen sistem).
Operasional sistem dimulai dengan validasi data posting oleh Donatur, diikuti oleh pembaruan status
otomatis  (available hingga completed)  saat  klaim  dilakukan.  Untuk  menjamin  transparansi,  Penerima
diwajibkan  mengunggah  bukti  dokumentasi  visual  pasca-pengambilan  fisik.  Seluruh  aktivitas  ini  didukung
### oleh fitur-fitur fungsional strategis, meliputi
• FR-06 & FR-08: Publikasi informasi pangan komprehensif dan fitur pencarian berbasis lokasi/kategori.
• FR-10 & FR-12: Otomasi klaim serta mekanisme unggah bukti verifikasi.
• FR-13 & FR-16: Sistem notifikasi real-time dan dasbor pemantauan aktivitas distribusi.
Dibandingkan  metode  konvensional  melalui  pesan  instan  yang  tidak  terdokumentasi,  BagiPangan
menawarkan keunggulan berupa visibilitas data yang lebih luas dan eliminasi miskomunikasi. Digitalisasi ini
tidak  hanya  mempercepat  alur  distribusi,  tetapi  juga  menciptakan  sistem  pencatatan  yang  kredibel  guna
meminimalisir limbah pangan layak konsumsi secara sistematis.


Bagan 1 BPMN Eksisting



Sebelum implementasi sistem BagiPangan, distribusi surplus pangan dilakukan secara konvensional
melalui  media  komunikasi  personal  (WhatsApp/DM)  dan  perantara  komunitas.  Proses  ini  bersifat  informal
dan non-terstruktur, di mana diseminasi informasi dilakukan secara sporadis tanpa standar prioritas yang jelas.
Ketiadaan dokumentasi formal dan jejak audit digital menyebabkan proses verifikasi hanya bergantung pada
percakapan  chat,  yang  berimplikasi  pada rendahnya  akuntabilitas  dan  tingginya  risiko  miskomunikasi  serta
pembuangan pangan akibat keterlambatan distribusi.
### Beberapa kendala fundamental dalam model eksisting ini meliputi
• Fragmentasi Informasi: Jangkauan donasi terbatas pada lingkaran komunikasi tertentu sehingga tidak
terserap secara optimal.
• Subjektivitas  Alokasi:  Proses  seleksi  penerima  manfaat  dilakukan  secara  manual  dan  cenderung
subjektif tanpa parameter yang terukur.
• Absensi Histori Data: Ketiadaan rekam jejak digital menghambat proses pemantauan (monitoring) dan
evaluasi program.
• Keterbatasan  Skalabilitas:  Ketergantungan  tinggi  pada  koordinasi  manual  menurunkan  efisiensi
operasional saat volume donasi meningkat.


Gambar 1 BPMN To-Be
Berdasarkan BPMN proses Klaim Donasi, sistem informasi BagiPangan tidak menggantikan seluruh
aktivitas fisik, melainkan berperan sebagai Digital Enabler dan Orchestrator proses. Aktivitas yang diotomasi
dalam  sistem  meliputi  manajemen  status  donasi  (state management),  validasi  ketersediaan  stok  secara real-
time,  pendistribusian  notifikasi  klaim  kepada  donatur,  serta  pengarsipan  bukti  serah  terima  digital.  Melalui
sistem  ini,  setiap  perubahan  status  dari  Available  hingga  Completed  terdokumentasi  secara  otomatis  dalam
Audit Log.



Sementara  itu,  aktivitas  interaksi  fisik  seperti  penyerahan  makanan  secara  langsung  dan  penilaian
kualitas  makanan  di  lokasi  tetap  dilakukan  secara  manual  oleh  Donatur  dan  Penerima.  Sistem  informasi
menjembatani  aktivitas  manual  tersebut  melalui  fitur  Unggah  Foto  Bukti,  yang  kemudian  divalidasi  oleh
sistem/admin untuk menutup siklus transaksi. Dengan demikian, sistem informasi berfungsi untuk menjamin
integritas  data,  transparansi  distribusi,  dan  akurasi  inventaris  tanpa  menghilangkan  interaksi  sosial  dan
verifikasi manusia di lapangan.
3. Kebutuhan Sistem
3.1 Kebutuhan Fungsional
3.1.1 Daftar Kebutuhan
ID Kebutuhan
Fungsional
Deskripsi (fungsi & interaksi)
FR-01 Manajemen Akun
## (CRUD)
Sistem  harus  dapat  menyediakan  fitur  manajemen  akun  pengguna
(donor,  receiver,  dan  admin)  dan  pengelolaan  data  akun  dengan
penyimpanan  peran  (role)  untuk  menentukan  hak  akses  pengguna
dalam sistem.
FR-02 Registrasi Akun
Sistem harus dapat menyediakan fitur registrasi bagi pengguna untuk
membuat akun baru dengan menginputkan data yang dibutuhkan agar
dapat terdaftar dalam sistem.
FR-03 Login
Sistem  harus  dapat  menyediakan  fitur  login  bagi  pengguna  dengan
melakukan  validasi  kredensial  sehingga  pengguna  dapat  mengakses
sistem sesuai dengan perannya.
FR-04 Manajemen
Profile (CRUD)
Sistem  harus  dapat  menyediakan  fitur  pengelolaan  profil  pengguna
yang   memungkinkan   pengguna   untuk    melihat,   menambahkan,
mengubah, dan menghapus informasi profilnya.
FR-05 Manajemen
Kategori (CRUD)
Sistem harus dapat  menyediakan fitur pengelolaan  kategori makanan
yang  memungkinkan  admin  untuk  menambahkan,  mengubah,  dan
menghapus  kategori,  serta  menampilkan  kategori  tersebut  pada  form



posting  dan  fitur  pencarian  tanpa  menghapus  data  donasi  yang  telah
terkait. Perubahan kategori tidak menghapus data donasi yang terkait.
FR-06 Manajemen
Posting Donasi
## (CRUD)
Sistem  harus  dapat  menyediakan  fitur  pembuatan  dan  pengelolaan
posting  donasi  yang  memungkinkan  donor  untuk  menambahkan,
mengubah, melihat, dan menghapus data donasi yang mencakup judul,
deskripsi, kategori, jumlah porsi, lokasi, waktu kedaluwarsa, dan foto,
serta melakukan validasi terhadap data yang diinputkan.
FR-07 Edit dan
Pembatalan
Donasi
Sistem harus dapat menyediakan fitur bagi donor untuk mengubah data
posting   donasi   selama   status   masih   tersedia,   serta   melakukan
pembatalan donasi sehingga posting tidak dapat diakses oleh pengguna
lain.
FR-08 Pencarian Posting
Donasi
Sistem  harus  dapat  menyediakan  fitur  pencarian  dan  penelusuran
posting  donasi  bagi  pengguna  dengan  dukungan  filter  berdasarkan
kategori,  lokasi,  status,  dan  kata  kunci,  serta  menampilkan  daftar
donasi  secara  bertahap  seperti foto,  judul,  lokasi,  status,  dan  tanggal
kedaluwarsa.
FR-09 Melihat Detail
Posting Donasi
Sistem  harus  dapat  menyediakan  fitur  untuk  menampilkan  informasi
detail  dari  suatu  posting  donasi  yang  mencakup  informasi  donatur,
jumlah porsi tersisa, dan tanggal kedaluwarsa.
FR-10 Klaim Donasi Sistem harus dapat menyediakan fitur bagi receiver untuk melakukan
klaim terhadap donasi yang tersedia dengan melakukan validasi status,
mencatat data klaim, serta memperbarui status donasi secara otomatis.
FR-11 Unggah Bukti
Pengambilan
Sistem harus dapat menyediakan fitur bagi receiver untuk mengunggah
bukti pengambilan donasi berupa file gambar yang terhubung dengan
data klaim untuk proses verifikasi lebih lanjut.
FR-12 Menerima
Notifikasi   Klaim
Donasi
Sistem harus dapat menyediakan fitur notifikasi kepada donatur terkait
aktivitas penting, seperti jika penerima telah melakukan klaim donasi,
dan memungkinkan pengguna untuk melihat serta menandai notifikasi
sebagai telah dibaca.
FR-13 Melihat Riwayat
Donasi
Sistem  harus  dapat  menyediakan  fitur  riwayat  bagi  donor  untuk
melihat daftar donasi yang telah dibuat.



FR-14 Melihat Riwayat
Klaim
Sistem  harus  dapat  menyediakan  fitur  riwayat  bagi  receiver  untuk
melihat klaim yang telah dilakukan beserta statusnya.
FR-15 Dashboard
dan Laporan
Singkat
Sistem  harus  dapat  menyediakan  fitur  dashboard  yang  menampilkan
ringkasan data donasi dalam bentuk visualisasi, seperti jumlah donasi
per periode, distribusi status, dan daftar donor aktif.
FR-16 Manajemen    dan
Moderasi oleh
Admin
Sistem  harus  dapat  menyediakan  fitur  bagi  admin  untuk  melakukan
moderasi  terhadap  posting  donasi  serta  mengelola  data  pengguna,
termasuk melakukan persetujuan, penolakan, dan penonaktifan akun.
FR-17 Export Laporan Sistem harus dapat menyediakan fitur untuk mengekspor data donasi
dan  klaim  dalam  bentuk  file  dengan  format  tertentu  untuk  keperluan
pelaporan.
FR-18 Audit    Trail    &
Logging
Sistem  harus  dapat  menyediakan  fitur  pencatatan  aktivitas  penting
dalam sistem, seperti pembuatan posting, klaim, perubahan status, dan
aksi admin untuk keperluan audit dan evaluasi.
FR-19 Visualisasi    Peta
Lokasi Donasi
Sistem harus dapat menyediakan fitur visualisasi peta pada dashboard
yang memungkinkan pengguna untuk melihat persebaran lokasi donasi
dalam  bentuk  titik-titik  lokasi,  sehingga  pengguna  dapat  mengetahui
dan menemukan donatur terdekat berdasarkan posisi geografis.

3.1.2 Karakteristik Pengguna
Tabel 1 Karakteristik Pengguna
Kategori
Pengguna
Deskripsi Hak Akses
Donatur
(Donor)
Individu atau pelaku
usaha (restoran,
katering, rumah
tangga) yang
memiliki makanan
berlebih layak
konsumsi.
Melakukan Create, Read, Update, Delete (CRUD) pada
postingan donasi pribadi, melihat riwayat donasi, dan
mengakses dashboard ringkas.
Penerima
(Receiver)
Masyarakat atau
pihak yang
membutuhkan akses
Melihat daftar donasi (listing), melakukan klaim
makanan, mengunggah bukti foto pengambilan, dan
melihat riwayat klaim pribadi.



terhadap makanan
layak konsumsi.
Admin
Pengelola platform
yang bertanggung
jawab atas
pemeliharaan data
sistem secara
keseluruhan
Mengelola data master kategori, memantau log aktivitas
(audit trail), mengelola status akun pengguna, serta
melakukan ekspor laporan distribusi

3.2 Kebutuhan Non Fungsional
ID Kebutuhan Non-
Fungsional
Deskripsi
NFR-01 Keamanan     Data
(Security)
Sistem harus menggunakan protokol HTTPS (SSL/TLS) untuk
melindungi   data   pengguna   serta   menerapkan   autentikasi
berbasis  akun.  Data  penting  seperti  aktivitas  donasi  dan  klaim
harus  tercatat  dengan  baik  dan  tidak  dapat  diubah  secara
sembarangan.
NFR-02 Kinerja
(Performance)
Sistem harus memiliki waktu respon yang cepat dengan rata-rata
kurang  dari 5 detik  untuk  operasi  utama  seperti  membuka
halaman, mengunggah data, dan melakukan klaim.
NFR-03 Keandalan
(Reliability)
Sistem  harus  dapat  digunakan  secara  stabil  tanpa  error  pada
fungsi  utama  seperti  posting,  klaim,  dan  upload  bukti  selama
proses pengujian berlangsung.
NFR-04 Kemudahan
Penggunaan
(Usability)
Antarmuka  sistem  harus  sederhana  dan  mudah  dipahami  oleh
pengguna,  sehingga  proses  posting  dan  klaim  dapat  dilakukan
tanpa pelatihan khusus.



ID Kebutuhan Non-
Fungsional
Deskripsi
NFR-05 Kompatibilitas
(Compatibility)
Sistem  harus  dapat  diakses  melalui  browser  umum  seperti
Chrome atau Edge tanpa memerlukan instalasi tambahan.
NFR-06 Maintainability Struktur  kode  harus  mengikuti  standar  framework  Laravel dan
NextJS agar mudah dikembangkan dan dipelihara oleh tim.
3.3 Kebutuhan Teknis
ID Kebutuhan Teknis Deskripsi
TR-01 PHP 8.2 Menggunakan PHP (versi 8.2 atau terbaru) sebagai bahasa utama
di sisi server-side.
TR-02 Framework
Backend
Menggunakan framework Laravel untuk mempercepat proses
pengembangan dan memastikan struktur kode yang rapi.
TR-03 Sistem Basis Data Postgres & Supabase digunakan untuk menyimpan data
pengguna, postingan donasi, klaim, dan log aktivitas.
TR-04 Testing Tool Laravel Dusk digunakan untuk menjalankan pengujian fitur
secara otomatis (Automated E2E Tests) guna memastikan
fungsionalitas berjalan lancar.
TR-05 Web Server Menggunakan Apache sebagai web server untuk menjalankan
aplikasi pada lingkungan hosting atau lokal.
TR-06 Frontend Stack Menggunakan NextJS dikombinasikan dengan Tailwind CSS
untuk membangun antarmuka (mockup) yang responsif.
TR-07 Storage &
Security
Menggunakan sistem penyimpanan cloud (Cloud Storage) untuk
menyimpan foto bukti pengambilan dan protokol HTTPS untuk
keamanan transmisi data.
TR-08 Environment Perangkat keras minimal berupa PC/Laptop dengan RAM 8GB
dan akses internet untuk proses deployment dan sinkronisasi
data.



4. Rancangan Sistem
4.1 Use Case Diagram


1) Registrasi Akun
## ID 001
Tittle Registrasi Akun



Description Donatur  dan  Penerima  melakukan  registrasi  atau
pembuatan akun ke dalam sistem BagiPangan.
Primary Actor Donatur, dan Penerima
Precondition Pengguna belum memiliki akun.
Postcondition Akun pengguna berhasil dibuat.
Error Situations Pengguna gagal melakukan registrasi.
System state in the event of an error Sistem    menampilkan    pesan    kesalahan    bahwa
pengguna gagal registrasi.
Trigger Pengguna  ingin  mendaftar  ke  dalam  sistem  untuk
melakukan perannya masing-masing, seperti donatur
yang ingin membagikan makanannya melalui sistem
BagiPangan untuk orang-orang yang membutuhkan.
Main Success Scenario
Donatur Sistem
1. Mengakses halaman registrasi sistem 2. Menampilkan form registrasi
3. Memasukkan data registrasi yang diminta
sistem

4. Klik button register
5. Melakukan verifikasi data yang diinput
6. Menampilkan halaman login
Alternative Scenario
4. Klik button register
5. Melakukan verifikasi data yang diinput
6. Menampilkan pesan kesalahan
“Data tidak valid.”
Extention
Frequency of use 10 times/day
Status -
Owner
Priority Level 1

2) Login Akun
## ID 002
Tittle Manajemen Akun Pengguna
Description Seluruh  pengguna  login  ke  sistem  dengan  akun
masing-masing.
Primary Actor Admin, Donatur, dan Penerima
Precondition Akun   pengguna   sudah   berhasil terregistrasi ke
database sistem.
Postcondition Pengguna    berhasil    masuk    ke    dalam    sistem
BagiPangan.
Error Situations Pengguna gagal masuk ke dalam sistem.
System state in the event of an error Sistem  menampilkan  pesan  kesalahan  bahwa login
telah gagal dilakukan.



Trigger Pengguna   ingin masuk ke   dalam   sistem   untuk
melakukan perannya masing-masing, seperti donatur
yang ingin membagikan makanannya melalui sistem
BagiPangan untuk orang-orang yang membutuhkan.
Main Success Scenario
Donatur Sistem
1. Mengakses halaman login sistem 2. Menampilkan form login username dan password
3. Memasukkan username dan password
4. Klik button log-in
5. Melakukan verifikasi username dan password
6. Menampilkan halaman dashboard sistem
Alternative Scenario
4. Klik button log-in
5. Melakukan verifikasi username dan password
6. Menampilkan pesan dashboard sistem
Extention
Frequency of use 20 times/day
Status -
Owner
Priority Level 1

3) Manajemen Akun
## ID 003
Tittle Login Akun
Description Sistem  harus  dapat  menyediakan  fitur  manajemen
akun  pengguna  (donor,  receiver,  dan  admin)  yang
mencakup  autentikasi,  dan  pengelolaan  data  akun
dengan penyimpanan peran (role) untuk menentukan
hak akses pengguna dalam sistem.
Primary Actor Admin
Precondition Akun sudah login ke dalam sistem.
Postcondition Perubahan pada akun pengguna berhasil disimpan ke
database sistem.
Error Situations Admin gagal menambahkan/mengedit/menghapus
akun pengguna karena data tidak valid.
System state in the event of an error Sistem    menampilkan    pesan    kesalahan    bahwa
validasi data gagal dilakukan.
Trigger Admin  ingin  memberikan  peran kepada  masing-
masing  akun  agar  akun  tersebut  dapat melakukan
fungsinya sesuai hak akses yang diberikan.
Main Success Scenario
Admin Sistem
1. Mengakses halaman manajemen akun 2. Menampilkan daftar akun yang terdaftar
3. Memilih opsi tambah akun



4. Memasukkan data peran untuk sebuah
akun yang dipilih

5. Melakukan validasi data
6. Klik button simpan
7. Menyimpan akun yang baru dibuat ke database

8. Menampilkan pesan berhasil
“Peran akun berhasil ditambahkan.”
Alternative Scenario
3. Memilih opsi edit akun
4. Memperbarui data peran untuk sebuah
akun yang dipilih

5. Melakukan validasi data
6. Klik button simpan perubahan
7. Menyimpan perubahan akun ke database
8. Menampilkan pesan berhasil
“Peran akun berhasil diperbarui.”
Alternative Scenario
3. Memilih opsi hapus akun
4. Menghapus data sebuah akun yang
dipilih

5. Melakukan konfirmasi penghapusan akun
6. Klik button Ya
7. Menyimpan perubahan daftar akun ke database
8. Menampilkan pesan berhasil
“Akun berhasil dihapus.”
Extention -
Frequency of use 15 times/day
Status -
Owner
Priority Level 1

4) Manajemen Profile
## ID 004
Tittle Manajemen Profile Akun Pengguna
Description Sistem  harus  dapat  menyediakan  fitur  pengelolaan
profil   pengguna   yang   memungkinkan   pengguna
untuk   melihat,   menambahkan,   mengubah,   dan
menghapus informasi profilnya.
Primary Actor Admin, Donatur, dan Penerima
Precondition Pengguna sudah login ke dalam sistem.
Postcondition Informasi  profil  pengguna  telah  diperbarui  sesuai
input terbaru.



Error Situations Pengguna  gagal
menambahkan/mengedit/menghapus data profile
pengguna karena data tidak valid.
System state in the event of an error Sistem    menampilkan    pesan    kesalahan    bahwa
validasi data gagal dilakukan.
Trigger Pengguna ingin melihat atau memperbarui informasi
profilnya.
Main Success Scenario
Penerima Sistem
1. Mengakses halaman profile akun 2. Menampilkan data profile akun pengguna
3. Memilih opsi tambah data profile akun
pengguna

4. Memasukkan data profile akun pengguna
5. Melakukan validasi data
6. Klik button simpan
7. Menyimpan data profile yang baru dibuat ke
database
8. Menampilkan pesan berhasil
“Informasi profile akun berhasil disimpan.”
Alternative Scenario
3. Memilih opsi edit akun

4. Memperbarui data profile akun pengguna
5. Melakukan validasi data
6. Klik button simpan perubahan

7. Menyimpan perubahan data profile ke database
8. Menampilkan pesan berhasil
“Informasi profile akun berhasil diperbarui.”
Alternative Scenario
3. Memilih opsi hapus data profile akun
4. Menghapus data profile akun
6. Klik button simpan perubahan
7. Menyimpan perubahan data profile ke database
8. Menampilkan pesan berhasil
“Informasi profile akun berhasil diperbarui..”
Extention -
Frequency of use 5 times/day
Status -
Owner
Priority Level 1

5) Manajemen Kategori
## ID 005
Tittle Manajemen Kategori Makanan untuk Donasi



Description Sistem  harus  dapat  menyediakan  fitur  pengelolaan
kategori makanan yang memungkinkan admin untuk
menambahkan, mengubah, dan menghapus kategori,
serta   menampilkan   kategori   tersebut   pada   form
posting  dan  fitur  pencarian  tanpa  menghapus  data
donasi  yang  telah terkait.  Perubahan  kategori  tidak
menghapus data donasi yang terkait.
Primary Actor Admin
Precondition Admin sudah login ke dalam sistem.
Postcondition Data kategori berhasil ditambahkan, diperbarui, atau
dihapus.
Error Situations Nama kategori sudah digunakan (duplikasi).
System state in the event of an error Sistem  menampilkan  pesan  kesalahan  bahwa nama
kategori sudah ada.
Trigger Admin   ingin   menambahkan   kategori   makanan
donasi yang baru.
Main Success Scenario
Admin Sistem
1. Mengakses halaman manajemen kategori 2. Menampilkan daftar kategori
3. Memilih opsi tambah data kategori
4. Memasukkan data kategori
5. Melakukan validasi data
6. Klik button simpan
7. Menyimpan kategori yang baru dibuat ke
database
8. Menampilkan pesan berhasil
“Kategori berhasil disimpan.”
Alternative Scenario
3. Memilih opsi edit data kategori
4. Memperbarui data kategori
5. Melakukan validasi data
6. Klik button simpan perubahan
7. Menyimpan perubahan data kategori ke database
8. Menampilkan pesan berhasil
“Data kategori berhasil diperbarui.”
Alternativa Scenario
3. Memilih opsi hapus data kategori
4. Menghapus data kategori yang dipilih
5. Melakukan konfirmasi penghapusan akun
6. Klik button Ya
7. Menyimpan perubahan daftar kategori ke
database
8. Menampilkan pesan berhasil
“Kategori berhasil dihapus.”
Extention -



Frequency of use 15 times/day
Status -
Owner
Priority Level 2

6) Manajemen Posting Donasi
## ID 006
Tittle Manajemen Posting Donasi
Description Sistem  harus  dapat  menyediakan  fitur  pembuatan
dan pengelolaan posting donasi yang
memungkinkan donor untuk menambahkan,
mengubah,  melihat,  dan  menghapus  data  donasi
yang  mencakup  judul,  deskripsi,  kategori,  jumlah
porsi,  lokasi,  waktu  kedaluwarsa,  dan  foto,  serta
melakukan validasi terhadap data yang diinputkan.
Primary Actor Donatur
Precondition Donatur sudah dapat mengakses fitur posting donasi.
Postcondition Posting   donasi   ditampilkan   pada   daftar   donasi
dengan status available.
Error Situations Data posting tidak lengkap.
System state in the event of an error Sistem  menampilkan  pesan  kesalahan validasi  data
gagal karena ada data yang belum terisi.
Trigger Donatur  ingin  membuat  atau  mengelola  posting
donasi.
Main Success Scenario
Donatur Sistem
1. Mengakses halaman posting donasi 2. Menampilkan form posting donasi
3. Memilih opsi tambah posting donasi
4. Mengisi data donasi (judul, deskripsi,
kategori, porsi, lokasi, dan tanggal
kedaluwarsa)

5. Melakukan validasi data
6. Klik button simpan
7. Menyimpan posting donasi yang baru dibuat ke
database

8. Mengunggah posting donasi dengan pesan
“Permintaan posting donasi berhasil diajukan.”
Alternative Scenario
3. Memilih opsi edit posting donasi

4. Memperbarui data donasi (judul,
deskripsi, kategori, porsi, lokasi, dan
tanggal kedaluwarsa) di posting donasi
yang dipilih

5. Melakukan validasi data



6. Klik button simpan perubahan
7. Menyimpan perubahan posting donasi ke
database
8. Menampilkan pesan berhasil
“Data posting donasi berhasil diperbarui.”
Alternative Scenario
3. Memilih opsi hapus posting donasi
4. Menghapus salah satu posting donasi
yang dipilih

5. Melakukan konfirmasi penghapusan posting
donasi
6. Klik button Ya


7. Menyimpan perubahan daftar posting donasi ke
database
8. Menampilkan pesan berhasil
“Posting donasi berhasil dihapus.”
Extention -
Frequency of use 25 times/day
Status -
Owner
Priority Level 3

7) Edit dan Pembatalan Donasi
## ID 007
Tittle Edit dan Pembatalan Donasi
Description Sistem  harus  dapat  menyediakan  fitur  bagi  donor
untuk  mengubah  data  posting  donasi  selama  status
masih  tersedia,  serta  melakukan  pembatalan  donasi
sehingga posting tidak dapat diakses oleh pengguna
lain.
Primary Actor Donatur
Precondition Donatur memiliki posting donasi.
Postcondition Data donasi berhasil diperbarui atau dibatalkan.
Error Situations Donasi sudah berstatus claimed atau status lain
selain available.
System state in the event of an error Sistem menampilkan pesan kesalahan sesuai kondisi
(misalnya, tidak bisa diubah karena sudah diklaim).
Trigger Donatur ingin mengubah atau membatalkan posting
donasi.
Main Success Scenario
Donatur Sistem
1. Membuka daftar posting donasi 2. Menampilkan daftar posting donasi
3. Memilih posting donasi yang akan diedit
4. Menampilkan detail posting



5. Mengubah data donasi menjadi
dibatalkan

6. Klik button simpan
7. Memvalidasi status (harus available)
8. Memvalidasi data input
9. Menyimpan perubahan ke database
10. Menampilkan pesan berhasil
“Posting donasi berhasil dibatalkan.”
Alternative Scenario
4. Klik button simpan
5. Status bukan available.
6. Menampilkan pesan bahwa edit atau pembatalan
donasi tidak dapat dilakukan.
Extention -
Frequency of use 5 times/day
Status -
Owner
Priority Level 3

8) Mencari Postingan Donasi
## ID 008
Tittle Mencari Postingan Donasi
Description Sistem harus dapat menyediakan fitur pencarian dan
penelusuran  posting  donasi  bagi  pengguna  dengan
dukungan filter berdasarkan kategori, lokasi, status,
dan  kata  kunci,  serta  menampilkan  daftar  donasi
secara bertahap seperti foto, judul, lokasi, status, dan
tanggal kedaluwarsa.
Primary Actor Penerima
Precondition Data posting donasi tersedia di dalam sistem
Postcondition Sistem  menampilkan  daftar  posting  donasi  sesuai
dengan kriteria pencarian
Error Situations Tidak ada data yang sesuai dengan filter atau kata
kunci.
System state in the event of an error Jika tidak ada hasil, maka sistem akan menampilkan
empty state (data tidak ditemukan).
Trigger Penerima  ingin  mencari  atau  menelusuri  posting
donasi berdasarkan kebutuhan tertentu.
Main Success Scenario
Penerima Sistem
1. Membuka halaman pencarian donasi 2. Menampilkan daftar awal posting donasi
3. Memasukkan kata kunci atau memilih
filter (kategori/lokasi/status)

4. Klik tombol cari / apply filter
5. Memproses permintaan pencarian



6. Mengambil data sesuai kriteria
7. Menampilkan hasil pencarian
Alternative Scenario
4. Klik tombol cari / apply filter
5. Memproses permintaan pencarian.
6. Menampilkan pesan bahwa data tidak
ditemukan.
7. Mengubah filter/kata kunci
8. Melakukan pencarian ulang
Extention -
Frequency of use 45 times/day
Status -
Owner
Priority Level 3

9) Melihat Detail Posting Donasi
## ID 009
Tittle Melihat Detail Posting Donasi
Description Sistem    harus    dapat    menyediakan    fitur    untuk
menampilkan  informasi  detail  dari  suatu  posting
donasi  yang  mencakup  informasi  donatur,  jumlah
porsi tersisa, dan tanggal kedaluwarsa.
Primary Actor Penerima
Precondition Data posting donasi tersedia di dalam sistem
Postcondition Sistem menampilkan informasi detail posting donasi
secara lengkap
Error Situations Penerima gagal melihat detail posting donasi karena
masalah jaringan.
System state in the event of an error Sistem   tidak   dapat   menampilkan   detail   posting
donasi.
Trigger Penerima  ingin memilih  salah  satu  posting  donasi
dari daftar pencarian atau daftar donasi.
Main Success Scenario
Penerima Sistem
1.  Memilih salah satu posting donasi 2. Mengambil data detail dari database
3. Klik button lihat detail
4. Menampilkan informasi detail (donatur, porsi,
expiry)
5. Melihat informasi detail donasi
Alternative Scenario
3. Klik button lihat detail
4. Menampilkan pesan bahwa sistem tidak dapat
memuat detail posting donasi karena masalah
jaringan.



Extention -
Frequency of use 10 times/day
Status -
Owner
Priority Level 3

10) Melakukan Klaim Donasi
## ID 010
Tittle Melakukan Klaim Donasi
Description Sistem harus dapat menyediakan fitur bagi receiver
untuk   melakukan   klaim   terhadap   donasi   yang
tersedia dengan melakukan validasi status, mencatat
data  klaim,  serta  memperbarui  status  donasi  secara
otomatis.
Primary Actor Penerima
Precondition Status donasi masih available
Postcondition Data klaim berhasil disimpan ke dalam sistem
Error Situations
Jaringan penerima tidak stabil
System state in the event of an error Sistem menampilkan pesan bahwa klaim gagal
Trigger Penerima  ingin melakukan  klaim  terhadap  suatu
donasi.
Main Success Scenario
Penerima Sistem
1. Memilih salah satu posting donasi 2. Mengambil data detail dari database
3. Klik button klaim
4. Menyimpan data klaim ke dalam database
5. Mengubah status menjadi claimed

6. Menampilkan notifikasi bahwa donasi sudah
diklaim
Alternative Scenario
4. Klik button klaim

4. Menyimpan data klaim ke dalam database
5. Menampilkan pesan
“Klaim gagal. Silakan cek jaringan Anda.”
Extention -
Frequency of use 45 times/day
Status -
Owner
Priority Level 3

11) Manajemen dan Moderasi
## ID 011



Tittle Manjemen dan Moderasi
Description Sistem    menyediakan    fitur    bagi    admin    untuk
melakukan  moderasi  terhadap  posting  donasi  serta
mengelola data pengguna.
Primary Actor Admin
Precondition Admin sudah login ke dalam sistem
Postcondition Data berhasil dimoderasi
Error Situations
Data tidak valid
System state in the event of an error Sistem menampilkan pesan kesalahan
Trigger Admin ingin memoderasi data
Main Success Scenario
Admin Sistem
1. Mengakses halaman moderasi 2. Menampilkan data moderasi
3. Memilih data moderasi
4. Memilih aksi menerima
5. Menyimpan perubahan
6. Menampilkan pesan sukses
Alternative Scenario
4. Memilih aksi menolak 5. Menyimpan perubahan
6.  Menampilkan pesan sukses
Extention -
Frequency of use 10 times/day
Status -
Owner -
Priority Level 1

12) Export laporan
## ID 012
Tittle Export laporan
Description Sistem    harus    dapat    menyediakan    fitur    untuk
mengekspor data donasi dan klaim ke dalam bentuk
fil   tertentu   seperti   PDF   atau   Excel   yang   dapat
digunakan untuk keperluan pelaporan dan
dokumentasi
Primary Actor Admin
Precondition Admin sudah login ke dalam sistem dan data laporan
tersedia
Postcondition File  laporan  berhasil  diexport  dan  diunduh  oleh
admin
Error Situations
Proses Eexport gagal karena data tidak tersedia atau
terjadi kesalahan sistem
System state in the event of an error Sistem menampilkan pesan kesalahan bahwa export
laporan gagal dilakukan



Trigger Admin  ingin  mengunduh  laporan  data  donasi  dan
klaim
Main Success Scenario
Admin Sistem
1. Mengakses halaman laporan 2. Menampilkan data laporan donasi dan klaim
3. Memilih rentang waktu atau filter data
(tanggal/jenis aktivitas)

4. Memilih format file (PDF/Excel)
5. Klik tombol export
6. Memproses data sesuai filter data
7. Menghasilkan file laporan
8. Mengunduh file ke perangkat admin
9. Menampilkan pesan sukses “Laporan berhasil
diunduh”
Alternative Scenario
5. klik tombol export
6.  Memproses data
7.  Menampilkan pesan error “Data tidak tersedia
atau gagal diekspor”
Extention -
Frequency of use 5 times/day
Status -
Owner -
Priority Level 2

13) Audit Trail dan Logging
## ID 013
Tittle Audit Trail dan Logging
Description Sistem  harus  dapat  menyediakan fitur  pencatatan
aktivitas    penting    pengguna    seperti    pembuatan
posting,   klaim   donasi,   perubahan   status,   serta
aktivitas  admin untuk  keperluan  audit  dan  evaluasi
sistem
Primary Actor Admin
Precondition Sistem telah mencatat aktivitas pengguna
Postcondition Data log aktivitas berhasil ditampilkan
Error Situations Data log gagal dimuat
System state in the event of an error Sistem menampilkan pesan kesalahan
Trigger Admin ingin melihat aktivitas sistem
Main Success Scenario
Admin Sistem
1. Mengakses halaman audit trail 2. Menampilkan daftar aktivitas sistem
3. Memilih filter (tanggal/jenis aktivitas)



4. Klik tombol filter

5. Memproses permintaan

6. Menampilkan data log sesuai filter
Alternative Scenario
4. Klik tombol filter


Aaaaa   5. Gagal memproses data

6. Menampilkan data log sesuai filter
Extention -
Frequency of use 5 times/day
Status -
Owner -
Priority Level 2

14) Menerima Notifikasi Klaim Donasi
## ID 014
Tittle Menerima Notifikasi Klaim Donasi
Description Sistem  harus  dapat  menyediakan  fitur notifikasi
kepada   donatur   ketika   terdapat   penerima   yang
melakukan klaim terhadap donasi yang diposting
Primary Actor Donatur
Precondition Donasi telah diklaim oleh penerima
Postcondition Donatur menerima notifikasi klaim
Error Situations Notifikasi gagal dikirim
System state in the event of an error Sistem tidak menampilkan notifikasi
Trigger Terjadi klaim donasi oleh penerima
Main Success Scenario
Donatur Sistem
1. Mendeteksi adanya klaim donasi
2. Mengirim notifikasi ke donatur
3.  Membuka notifikasi

4. Menampilkan detail klaim donasi
Alternative Scenario

2. Gagal mengirim notifikasi

3. Notifikasi tidak muncul
Extention -
Frequency of use 20 times/day
Status -
Owner -
Priority Level 2

15) Melihat Riwayat dan Donasi



## ID 015
Tittle Melihat Riwayat dan Donasi
Description Sistem  harus  dapat  menyediakan fitur  bagi  donatur
untuk  melihat  daftar  donasi  yang  pernah  dibuat
beserta status distribusinya
Primary Actor Donatur
Precondition Donatur sudah login ke dalam sistem
Postcondition Riwayat donasi berhasil ditampilkan
Error Situations
Data riwayat donasi tidak ditemukan
System state in the event of an error Sistem   menampilkan   pesan bahwa   data   tidak
tersedia
Trigger Donatur ingin melihat riwayat donasi
Main Success Scenario
Donatur Sistem
1. Mengakses halaman riwayat donasi 2. Mengambil data riwayat donasi dari database
3. Menampilkan daftar riwayat donasi
4. Memilih salah satu data
5. Menampilkan detail donasi
Alternative Scenario
1.  Mengakses halaman riwayat donasi


2. Data tidak ditemukan

3. Menampilkan pesan “Data riwayat tidak
tersedia”
Extention -
Frequency of use 10 times/day
Status -
Owner -
Priority Level 2

16) Melihat Dashboard dan Laporan Singkat
## ID 016
Tittle Melihat Dashboard dan Laporan Singkat
Description Sistem  harus  dapat  menyediakan  dashboard  yang
menampilkan     ringkasan     data     donasi,     status
distribusi, dan statistik sederhana.
Primary Actor Admin, Donatur, dan Penerima
Precondition Penerima sudah login ke dalam sistem
Postcondition Dashboard berhasil ditampilkan
Error Situations Data gagal dimuat
System state in the event of an error Sistem menampilkan pesan kesalahan
Trigger Penerima membuka dashboard
Main Success Scenario
Penerima Sistem



1. Mengakses halaman dashboard 2. Mengambil data dari database
3. Mengolah data statistik
4. Menampilkan dashboard berupa grafik dan
ringkasan
Alternative Scenario
1. Mengakses halaman dashboard
2. Gagal mengambil data
3. Menampilkan pesan error
Extention -
Frequency of use 10 times/day
Status -
Owner -
Priority Level 2

17) Melihat Peta Lokasi Donasi
## ID 017
Tittle Melihat Peta Donasi Lokasi
Description Sistem  harus  dapat  menyediakan fitur  visualisasi
peta untuk menampilkan lokasi donasi dalam bentuk
titik lokasi
Primary Actor Penerima
Precondition Data lokasi donasi tersedia
Postcondition Peta lokasi ditampilkan
Error Situations
Data log gagal dimuat
System state in the event of an error Data lokasi tidak tersedia
Trigger Penerima membuka fitur peta lokasi donasi
Main Success Scenario
Penerima Sistem
1. Mengakses halaman peta lokasi donasi 2. Mengambil data lokasi
3. Mengolah koordinat menjadi titik peta
4. Menampilkan peta dengan titik lokasi donasi
Alternative Scenario
1. Mengakses halaman peta lokasi donasi
2. Data tidak tersedia
3. Menampilkan pesan “Data lokasi tidak
ditemukan”
Extention -
Frequency of use 8 times/day
Status -
Owner -
Priority Level 3




18) Unggah bukti pengambilan
## ID 018
Tittle Unggah bukti pengambilan
Description Sistem harus dapat menyediakan fitur bagi penerima
untuk    mengunggah    bukti    pengambilan    donasi
berupa foto sebagai konfirmasi.
Primary Actor Penerima
Precondition Donasi telah diklaim oleh penerima
Postcondition buti berhasil diunggah dan tersimpan
Error Situations
Data log gagal dimuat
System state in the event of an error File tidak valid atau gagal upload
Trigger Penerima ingin mengunggah bukti pengambilan
Main Success Scenario
Penerima Sistem
1. Mengakses halaman upload bukti 2. Menampilkan form upload
3. Memilih file gambar
4. Klik tombol upload
5. Melakukan validasi file
6. Menyimpan file ke database
7. Menghubungkan dengan data klaim
8. Menampilkan pesan sukses “Bukti bethasil
diunggah”
Alternative Scenario
4. Klik tombol upload
5. File tidak valid
6. Menampilak pesan “”Upload gagal. Format file
tidak sesuai.”
Extention -
Frequency of use 30 times/day
Status -
Owner -
Priority Level 1

19) Melihat Riwayat Klaim
## ID 019
Tittle Melihat Riwayat Klaim
Description Sistem    harus    dapat    mennyediakan    fitur    bagi
penerima  untuk  melihat  riwayat  klaim  donasi  yang
pernah dilakukan beserta statusnya.
Primary Actor Penerima
Precondition penerima sudah login ke dalam sistem
Postcondition Data riwayat klaim ditampilkan



Error Situations Data tidak ditemukan
System state in the event of an error Sistem   menampilkan   pesan bahwa   data   tidak
tersedia
Trigger Penerima ingin melihat riwayat klaim
Main Success Scenario
Penerima Sistem
1. Mengakses halaman riwayat klaim 2. Mengambil data dari database
3. Menampilkan daftar klaim
4. Memilih salah satu klaim
5. Menampilkan detail klaim.
Alternative Scenario
1. Mengakses halaman riwayat klaim


2. Data tidak tersedia

3. Menampilkan pesan “Data riwayat klaim tidak
ditemukan”
Extention -
Frequency of use 15 times/day
Status -
Owner -
Priority Level 2
4.1 Arsitektur Sistem
Arsitektur sistem BagiPangan dirancang menggunakan pendekatan Microservices N‑Tier
Architecture untuk memastikan skalabilitas, modularitas, serta kemudahan pengembangan lintas tim.
Pada  tahap  implementasi awal,  seluruh  layanan  tetap  dibangun  dengan  prinsip  pemisahan  domain
(logical  microservices),  namun  dijalankan  menggunakan  satu  basis  data  terpusat  (monolithic
database) untuk mengurangi kompleksitas operasional. Seiring pertumbuhan sistem, setiap  layanan
dapat dipisahkan menjadi basis data independen sesuai prinsip database per service.
### Gambar berikut menunjukkan arsitektur sistem secara keseluruhan




Bagan 2 diagram arsitektur to be
Arsitektur  sistem  BagiPangan  dirancang  menggunakan  pendekatan  layered  architecture
dengan pemisahan tanggung jawab yang jelas antara lapisan presentasi, akses, aplikasi, dan data. Pada
sisi Client/Presentation Layer, pengguna yang terdiri dari Donatur, Penerima, dan Admin mengakses
sistem melalui Next.js Web App yang mendukung Server‑Side Rendering (SSR) dan Client‑Side
Rendering  (CSR).  Aplikasi  frontend  ini  berkomunikasi  dengan  backend  menggunakan  protokol
HTTPS  melalui  API  Gateway/Reverse  Proxy,  yang  berfungsi  sebagai  gerbang  utama  untuk
melakukan  routing  request,  pengaturan  CORS,  pembatasan  akses  (rate  limiting),  serta  penerusan
informasi  autentikasi  ke  layanan  backend.  Pendekatan  ini  memastikan  keamanan  komunikasi
sekaligus menyederhanakan manajemen akses ke layanan aplikasi.

Pada sisi backend, sistem menerapkan pendekatan logical microservices yang dikembangkan
menggunakan Laravel, di mana setiap layanan merepresentasikan domain fungsi tertentu seperti Auth
Service, User/Profile Service, Donation Service, Claim Service, Media Service, Notification Service,
serta Reporting/Dashboard Service. Meskipun logika aplikasi dipisahkan ke dalam beberapa service,
seluruh  layanan  tersebut  menggunakan  satu  basis  data  terpusat  (monolithic  database)  berbasis
Supabase  PostgreSQL  untuk  menjaga konsistensi  data  dan  mengurangi  kompleksitas  integrasi,
khususnya  pada  tahap  pengembangan  awal.  Penyimpanan  file  gambar  bukti  pengambilan  dikelola
melalui Supabase Object Storage yang diakses oleh Media Service. Dengan desain ini, sistem tetap



modular,  mudah  dikembangkan,  serta  siap  untuk  ditingkatkan  skalanya  di  masa  depan  tanpa
mengorbankan kesederhanaan implementasi dalam lingkup proyek perkuliahan.
4.2 Rancangan ERD


ERD (Entity Relationship Diagram) pada sistem BagiPangan dibuat untuk menggambarkan
bagaimana data dalam sistem saling terhubung dikelola secara terstruktur. Sistem ini sendiri dibuat
untuk membantu proses distribusi makanan berlebih agar tidak terbuang sia-sia dan bisa sampai ke
orang  yang  membutuhkan.  Sebelumnya  proses  ini  masih  dilakukan  secara  manual  lewat chat  atau
media sosial, sehingga tidak rapi, sulit dilacak, dan sering tidak terdokumentasi dengan baik.

Dengan  adanya  ERD  ini,  kita  bisa  melihat  dengan  jelas  data  apa  saja  yang  dibutuhkan,
bagaimana hubungan antar data (misalnya antara user, donasi, dan klaim), serta memastikan sistem
dapat berjalan dengan lebih terorganisir. Tujuan utama dibuatya ERD adalah sebagai panduan dalam
membangun   database   agar   sesuai   dengan   kebutuhan   sistem,   mengurangi   kesalahan   saat
pengembangan,  dan  memastikan semua  proses  seperti  posting  donasi,  klaim,  hingga  konfirmasi
tercatat dengan baik.

1) User
Menyimpan data akun pengguna dalam sistem

Atribut Keterangan
id_user (PK) ID unik user
name Nama pengguna



email Email login
password Kata sandi
role_id (FK) Menghubungkan ke role


2) Role
Menentukan jenis atau peran user

Atribut Keterangan
id_role (PK) ID role
role_name Nama role (admin, donor, penerima)



3) Donation
Menyimpan data donasi makanan

Atribut Keterangan
Id_donation (PK) ID donasi
user_id (FK) Siapa yang donasi
category_id (FK) Kategori makanan
title Judul donasi
description Deskripsi
portion Jumlah porsi
location Lokasi
expired_at Batas waktu
status Status (available, claimed, dll)



4) Category
Kategori makanan

Atribut Keterangan
id_category (PK) ID kategori
name Nama kategori


5) Claim
Menyimpan data klaim dari pengguna

Atribut Keterangan
id_claim (PK) Id klaim
user_id (FK) Siapa yang klaim
donation_id (FK) Donasi yang dikalaim



claim_date Tanggal klaim
status Status kalim


6) Proof
Bukti pengambilan donasi

Atribut Keterangan
id_proof (PK) ID bukti
claim_id (FK) Relasi ke klaim
image_url Foto bukti
uploaded_at Waktu upload


7) Audit Log
Mencatat aktivitas penting dalam sistem

Atribut Keterangan
id_audit_log (PK) ID log
user_id (FK) User yang melakukan aksi
action Aksi yang dilakukan
timestamp Waktu kejadian

4.3 Class Diagram

Class diagram sistem BagiPangan menunjukkan dua bagian utama, yaitu Domain Model dan
Service Layer. Pada bagian Domain Model, kelas abstrak User berfungsi sebagai induk bagi tiga tipe
pengguna: Admin, Donor, dan Receiver. Ketiganya mewarisi atribut dasar seperti nama, email, dan
password,  namun  memiliki  perilaku  tambahan  sesuai  perannya  masingmasing.  Admin  memiliki
fungsi  moderasi  seperti  menyetujui  dan  menolak  donasi,  Donor  dapat  membuat  dan  mengelola
posting donasi, sedangkan Receiver memiliki kemampuan untuk mengklaim donasi dan mengunggah
bukti pengambilan. Setiap user memiliki satu role dan dapat menghasilkan banyak AuditLog sebagai
catatan aktivitas sistem.







Entity  lain  seperti Category, Donation, Claim,  dan Proof merepresentasikan  data  inti  alur
donasi.  Donation  menyimpan  informasi  makanan  berlebih  serta  status  distribusinya,  dan  berelasi
dengan Donor, Category, serta Claim. Claim dibuat oleh Receiver untuk mengklaim donasi tertentu
dan dapat memiliki satu Proof sebagai bukti pengambilan. Relasi antar entity ini mencerminkan alur
distribusi makanan dari Donor ke Receiver yang terdokumentasi dengan baik.

Pada  sisi  Service  Layer,  logika  bisnis  dipisahkan  dalam  kelas  layanan  seperti  AuthService,
DonationService,   ClaimService,   ProofService,   NotificationService,   dan   ReportService.   Setiap
service  menangani  fungsinya  masingmasing,  mulai  dari  proses  autentikasi, pengelolaan  donasi,
pengelolaan klaim, unggahan bukti, pengiriman notifikasi, hingga pembuatan laporan. Pemisahan ini
memastikan sistem memiliki struktur modular yang memudahkan pengembangan, pemeliharaan, dan
ekspansi fitur di masa mendatang.

4.4 Mockup
• Landing Page



o Landing Page Utama: Halaman penyambutan publik yang menonjolkan nilai utama
aplikasi ("Bagi Makanan, Kurangi Pemborosan"). Halaman ini menampilkan statistik
dampak (social proof) seperti jumlah donatur (1.200+), penerima (15.000+), serta
daftar fitur unggulan (Posting Donasi, Klaim & Ambil, Dashboard Real-time).
o Login / Masuk: Formulir autentikasi yang bersih dan sederhana di mana pengguna
dapat memasukkan kredensial (Email dan Kata Sandi) untuk masuk ke sistem sesuai
peran mereka (Admin, Donatur, atau Penerima).

### Tampilan 
1. Login

2. Landing Page




• Antar Muka Admin



o Profil: Halaman pengaturan akun tempat Admin dapat mengubah informasi dasar,
memperbarui kata sandi, atau menghapus akun.
o Dashboard Admin: Pusat kendali eksekutif yang menampilkan metrik utama sistem.
Berdasarkan blueprint, dashboard ini memuat ringkasan data seperti total donasi,
grafik tren donasi harian/mingguan, breakdown status distribusi (tersedia, diklaim,
selesai), serta daftar donatur paling aktif (Top Donors).
o Users (Manajemen Pengguna): Tabel daftar pengguna terdaftar. Melalui antarmuka
ini, Admin berwenang untuk memantau data pengguna dan melakukan tindakan
moderasi seperti menangguhkan (suspend) akun yang melanggar aturan.
o Categories (Manajemen Kategori): Halaman khusus bagi Admin untuk menambah,
mengubah, atau menghapus kategori makanan (contoh: Makanan Siap Saji, Sayur,
Minuman).
o Donation (Moderasi Donasi): Antarmuka kontrol kualitas di mana Admin dapat
melihat daftar posting donasi terbaru untuk disetujui (approve) atau ditolak (reject)
agar platform tetap aman dan relevan.
o Reports (Laporan): Layar khusus untuk memfilter data berdasarkan status dan
kategori, yang dilengkapi dengan fungsi ekspor (Export) untuk mengunduh laporan
aktivitas ke dalam format CSV.
o  dari sistem.

### Tampilan 
1. Profile





2. Dashboard





3. Users


4. Categories





5. Donation


6. Notification





7. Reports









• Donatur
o Profil: Pengaturan akun pribadi donatur.
o Dashboard Donatur: Halaman beranda personalized yang menampilkan ringkasan
performa donasi individu. Terdapat dua tombol pintasan utama yang sangat
menonjol: "Buat Donasi Baru" dan "Lihat Klaim Masuk" untuk mempercepat
navigasi.
o Buat Donasi (Create): Formulir lengkap untuk mempublikasikan makanan. Donatur
wajib mengisi detail seperti Kategori, Judul, Deskripsi, Jumlah Porsi, Kecamatan
(Lokasi), Tanggal Kedaluwarsa, dan mengunggah foto makanan berkualitas baik.
o Donasi Saya (Riwayat Donasi): Tabel riwayat (history) yang memperlihatkan daftar
semua donasi yang pernah dibuat oleh donatur beserta status distribusinya.
o Verifikasi Klaim: Halaman untuk melihat permintaan klaim yang masuk dari
penerima dan melakukan peninjauan.
o Notification: Pusat notifikasi agar donatur langsung mendapat pemberitahuan (real-
time) ketika ada penerima yang melakukan klaim terhadap makanannya.

### Tampilan 
1. Profile





2. Donor – Dashboard





3. Donor – Claim


4. Donor -Donation





5. Donor – Donation – create


6. Notification





• Penerima
o Profil: Pengaturan akun pribadi penerima.
o Dashboard Penerima: Beranda yang difokuskan pada akses pencarian. Terdapat bar
pencarian "Cari Donasi" untuk menemukan makanan terdekat dan pintasan ke
"Klaim Saya".
o Daftar Donasi (Listing & Search): Ini adalah halaman eksplorasi utama.
Menampilkan katalog donasi dalam format grid responsif berupa kartu (bento card).
Pengguna dapat mencari kata kunci dan menggunakan dropdown filter (Kategori,
Lokasi, Status). Setiap kartu menampilkan thumbnail foto, judul makanan, lokasi,
label status warna hijau, dan waktu kedaluwarsa.
o Detail Donasi & Klaim: Jika pengguna mengeklik sebuah kartu donasi, mereka akan
melihat foto resolusi penuh, detail porsi, dan sebuah tombol hijau yang menonjol
bertuliskan "Klaim Donasi" (muncul secara dinamis jika statusnya tersedia).
o Klaim Saya (Riwayat Klaim): Halaman riwayat (history) yang menampilkan daftar
donasi yang telah berhasil diklaim. Di antarmuka ini pula, penerima akan mengakses
tombol/form untuk Mengunggah Bukti Pengambilan (Proof of Pickup) berupa foto
pasca-pengambilan fisik.
o Notification: Menampilkan pesan status terkini mengenai klaim atau informasi
penting lainnya dari sistem.

### Tampilan 
1. Profile





2. Receiver – Dashboard





3. Receiver – Claim


4. Donation





5. Notification







5. Metode Pengembangan
Metode   pengembangan   sistem   yang   digunakan   dalam   penelitian   ini   adalah   Agile
Development. Agile merupakan pendekatan pengembangan perangkat lunak yang bersifat iteratif dan
inkremental, di mana proses pengembangan dilakukan secara bertahap dengan fokus pada fleksibilitas
dan  kemampuan beradaptasi terhadap  perubahan  kebutuhan  pengguna.  Metode  ini  menekankan
kolaborasi antara pengembang dan pengguna, serta menghasilkan bagian sistem yang dapat diuji pada
setiap  tahapan  pengembangan,  sehingga  kualitas  sistem  dapat  terus  ditingkatkan  selama  proses
berlangsung.
Kerangka  kerja  Agile  yang  digunakan  adalah  Scrum,  yaitu  metode  yang  membagi  proses
pengembangan   ke dalam beberapa   siklus   kerja   pendek   yang   disebut   sprint.   Dalam   Scrum,
pengembangan  sistem  dimulai  dengan  penyusunan  product  backlog  yang  berisi  daftar  kebutuhan
sistem berdasarkan prioritas. Setiap sprint mencakup proses perencanaan, pengembangan, pengujian,
dan evaluasi hasil. Penggunaan Scrum memungkinkan tim pengembang untuk memantau kemajuan
proyek  secara  berkala  dan  melakukan  perbaikan  secara  berkelanjutan  agar  sistem  yang  dihasilkan
sesuai dengan kebutuhan pengguna.
5.1 Jadwal Pengembangan




Sprint 1 (6 – 10 April)
Fokus: Setup awal & autentikasi
• FR-02: Registrasi Akun
• FR-03: Login
• Setup database & struktur project
### Output
• User bisa daftar & login
• Sistem autentikasi dasar berjalan

Sprint 2 (13 – 17 April)
Fokus: Manajemen user & profil
• FR-01: Manajemen Akun (CRUD)
• FR-04: Manajemen Profile (CRUD)
### Output
• Admin/User bisa kelola akun
• Profil user dapat diubah

Minggu Perbaikan (20 – 24 April)
• FR-20: Bug Fix
• Improvement UI/UX
• Enhancement fitur login & akun
• Testing awal & review

Sprint Preparation (27 – 30 April)
• Refinement backlog
• Finalisasi kebutuhan sprint berikutnya






Sprint 3 (4 – 8 Mei)
Fokus: Kategori & Posting Donasi
• FR-05: Manajemen Kategori (CRUD)
• FR-06: Manajemen Posting Donasi (CRUD)
### Output
• User bisa membuat & melihat posting donasi
• Sistem kategori berjalan

Sprint 4 (11 – 15 Mei)
Fokus: Interaksi Donasi
• FR-07: Edit & Pembatalan Donasi
• FR-08: Pencarian Posting Donasi
• FR-09: Detail Posting Donasi
### Output
• User bisa cari & lihat detail donasi
• Edit/pembatalan tersedia




Sprint 5 (18 – 22 Mei)
Fokus: Proses Klaim Donasi
• FR-10: Klaim Donasi
• FR-11: Upload Bukti Pengambilan
• FR-12: Notifikasi Klaim
### Output
• Alur klaim donasi end-to-end berjalan
• Notifikasi sistem aktif

Minggu Stabilization (25 – 29 Mei)
• Bug Fix
• Improvement
• Enhancement fitur donasi
• Testing & review menyeluruh



Sprint 6 (1 – 10 Juli)
Fokus: Reporting & Advanced Features
• FR-13: Riwayat Donasi
• FR-14: Riwayat Klaim



• FR-15: Dashboard & Laporan
• FR-17: Export Laporan
### Output
• Dashboard monitoring tersedia
• Data bisa diexport

Sprint 7 (13 Juli)
Fokus: Admin & Security
• FR-16: Manajemen & Moderasi Admin
• FR-18: Audit Trail & Logging
### Output
• Admin bisa kontrol sistem
• Aktivitas user tercatat
Sprint 8 (Tambahan fitur lokasi)
• FR-19: Visualisasi Peta Lokasi Donasi
### Output
• Donasi bisa dilihat berbasis lokasi (map)

5.2 Tim Pengembang
Nama Lengkap Peran
Tanggung    Jawab    &    PBI
(Fullstack)
Afif Nur Sena Fullstack Developer & Lead
Bertanggung jawab atas
implementasi PBI [FR-15, 17,
### 18] yang mencakup
### 1. Dashboard & Visualisasi
Ringkasan data donasi dan
distribusi status.
2. Export Laporan: Fitur
ekspor data donasi/klaim
dalam format file.



### 3. Audit Trail & Logging
Pencatatan log aktivitas sistem
untuk keperluan audit.
Muhammad Rayfan Pashya Fullstack Developer
Bertanggung jawab atas
implementasi PBI [FR-01, 08,
### 09] yang mencakup
### 1. Manajemen Akun
Pengelolaan CRUD User dan
Role akses (RBAC).
2. Pencarian & Filter: Fitur
penelusuran donasi
berdasarkan kategori dan
lokasi.
3. Detail Posting: Halaman
informasi lengkap donatur dan
sisa porsi makanan.
Niken Citra Suhisman Fullstack Developer
Bertanggung jawab atas
implementasi PBI [FR-02, 06,
### 07] yang mencakup
1. Registrasi Akun: Alur
pembuatan akun baru
pengguna.
### 2. Manajemen Posting
CRUD data donasi (judul,
foto, porsi, dan waktu
kedaluwarsa).
3. Edit & Pembatalan: Fitur
perubahan data atau
pembatalan posting donasi.
Yonathan Hezron Fullstack Developer
Bertanggung jawab atas
implementasi PBI [FR-10, 11,
### 19] yang mencakup
1. Sistem Klaim: Logika
reservasi makanan dan update
status otomatis.
2. Unggah Bukti: Fitur upload
foto pengambilan untuk
verifikasi klaim.
3. Visualisasi Peta: Peta
persebaran lokasi donasi (GIS)
pada dashboard.
Ahmad Zacky Al-Baqri Fullstack Developer
Bertanggung jawab atas
implementasi PBI [FR-12, 13,
### 14] yang mencakup
### 1. Sistem Notifikasi
Pemberitahuan real-time



kepada donatur jika makanan
diklaim.
2. Riwayat Donasi: Halaman
daftar kontribusi makanan
yang pernah dibuat donor.
3. Riwayat Klaim: Daftar
histori pengambilan makanan
bagi receiver.
Refa Dias I Delia Fullstack Developer
Bertanggung jawab atas
implementasi PBI [FR-03, 05]
### yang mencakup
1. Login & Validasi: Sistem
keamanan kredensial dan hak
akses user.
### 2. Manajemen Kategori
Pengelolaan kategori makanan
(CRUD) oleh Admin.
Aliffia Humaira Fullstack Developer
Bertanggung jawab atas
implementasi PBI [FR-04, 16]
### yang mencakup
1. Manajemen Profil: Fitur
pengelolaan data diri
pengguna (melihat dan
mengubah profil).
2. Moderasi Admin: Fitur
bagi admin untuk menyetujui,
menolak, atau menonaktifkan
akun/postingan.



