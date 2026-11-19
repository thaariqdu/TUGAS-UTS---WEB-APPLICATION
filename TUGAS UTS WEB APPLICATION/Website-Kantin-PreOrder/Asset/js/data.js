/* Data contoh. Ganti dengan data asli dari backend/database. */
window.KANTIN_DATA = {
  stands: [
    { id: 1, nama: 'Nasi & Lauk', pengelola: 'Pengelola A' },
    { id: 2, nama: 'Mie & Soto', pengelola: 'Pengelola B' },
    { id: 3, nama: 'Minuman', pengelola: 'Pengelola C' }
  ],
  menu: [
    { id: 1, stand: 1, nama: 'Nasi Ayam Geprek', harga: 17000, stok: 12 },
    { id: 2, stand: 1, nama: 'Nasi Goreng Spesial', harga: 16000, stok: 0 },
    { id: 3, stand: 2, nama: 'Mie Goreng Telur', harga: 14000, stok: 4 },
    { id: 4, stand: 2, nama: 'Soto Ayam', harga: 15000, stok: 9 },
    { id: 5, stand: 3, nama: 'Es Teh Manis', harga: 5000, stok: 30 },
    { id: 6, stand: 3, nama: 'Jus Alpukat', harga: 12000, stok: 3 },
    { id: 7, stand: 1, nama: 'Nasi Telur Balado', harga: 13000, stok: 5 }
  ],
  jam: ['12.00', '12.15', '12.30', '12.45'],
  statusUrut: ['Menunggu', 'Dimasak', 'Siap diambil', 'Diambil']
};
