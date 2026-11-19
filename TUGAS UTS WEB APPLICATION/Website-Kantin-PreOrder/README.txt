PreOrder Kantin - Prototype Website (HTML statis)

Cara membuka: ekstrak folder, lalu buka index.html di browser. Tidak perlu server atau instalasi.

Struktur
  index.html      Beranda
  daftar.html     Daftar & Masuk
  menu.html       Pilih menu (mahasiswa & dosen)
  checkout.html   Keranjang, jam takeaway, bayar QRIS
  status.html     Status pesanan & notifikasi
  tenan.html      Dashboard pengelola stand
  admin.html      Dashboard pengelola kantin
  Asset/css/      style.css
  Asset/js/       data.js (data contoh), app.js (logika prototype)
  Asset/image/    logo.svg, bowl.svg, qr-placeholder.svg

Alur uji: menu -> tambah item -> keranjang -> "Saya sudah membayar" -> status.
Buka tenan.html di tab lain, klik "Mulai masak" / "Tandai siap", lalu lihat status pesanan berubah.
Tombol "Reset data demo" (di sidebar dashboard) mengosongkan data.

Catatan
- Data (keranjang, pesanan, stok) disimpan di localStorage browser, bukan database.
- Menu, harga, stok, dan nama stand adalah data contoh (Asset/js/data.js).
- Kode QRIS dan foto makanan masih placeholder. Pembayaran dan notifikasi WhatsApp hanya simulasi;
  integrasi payment gateway dan WhatsApp perlu backend.
- Font Plus Jakarta Sans dimuat dari Google Fonts; tanpa internet, browser memakai font sistem.
