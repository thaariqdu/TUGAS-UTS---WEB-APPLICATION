/* PreOrder Kantin - logika prototype (tanpa backend, data di localStorage) */
(function () {
  'use strict';
  var D = window.KANTIN_DATA;
  var KEY = { cart: 'kantin_cart', orders: 'kantin_orders', stok: 'kantin_stok', jam: 'kantin_jam', user: 'kantin_user', open: 'kantin_open', last: 'kantin_last' };
  var mem = {};

  function load(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return k in mem ? mem[k] : def; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { mem[k] = v; } }
  function rp(n) { return 'Rp' + Number(n).toLocaleString('id-ID'); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function standName(id) { return (D.stands.filter(function (s) { return s.id === id; })[0] || {}).nama || ''; }
  function menuById(id) { return D.menu.filter(function (m) { return m.id === id; })[0]; }

  /* stok */
  function stokOf(m) { var s = load(KEY.stok, {}); return m.id in s ? s[m.id] : m.stok; }
  function setStok(id, n) { var s = load(KEY.stok, {}); s[id] = Math.max(0, n); save(KEY.stok, s); }
  function stokBadge(n) {
    if (n === 0) return '<span class="pill off">Habis</span>';
    if (n <= 5) return '<span class="pill wait">Sisa ' + n + '</span>';
    return '<span class="pill ok">Stok ' + n + '</span>';
  }

  /* keranjang: [{id, qty}] */
  function cart() { return load(KEY.cart, []); }
  function cartDetail() {
    return cart().map(function (c) { var m = menuById(c.id); return m ? { m: m, qty: c.qty } : null; }).filter(Boolean);
  }
  function cartTotal() { return cartDetail().reduce(function (a, c) { return a + c.m.harga * c.qty; }, 0); }
  function addCart(id) {
    var c = cart(), it = c.filter(function (x) { return x.id === id; })[0], m = menuById(id);
    if (it) { if (it.qty < stokOf(m)) it.qty++; } else c.push({ id: id, qty: 1 });
    save(KEY.cart, c);
  }
  function changeQty(id, d) {
    var c = cart(), m = menuById(id);
    c.forEach(function (x) { if (x.id === id) x.qty = Math.min(stokOf(m), x.qty + d); });
    save(KEY.cart, c.filter(function (x) { return x.qty > 0; }));
  }
  function cartCount() { return cart().reduce(function (a, c) { return a + c.qty; }, 0); }
  function getJam() { return load(KEY.jam, D.jam[1]); }

  /* pesanan */
  function orders() { return load(KEY.orders, []); }
  function nextNo(list) { return '#A-' + String(list.length + 14).padStart(3, '0'); }
  function now() { var d = new Date(); return String(d.getHours()).padStart(2, '0') + '.' + String(d.getMinutes()).padStart(2, '0'); }
  function seedIfEmpty() {
    if (orders().length) return;
    function o(no, items, jam, st, metode) {
      var total = items.reduce(function (a, i) { return a + menuById(i[0]).harga * i[1]; }, 0);
      return { no: no, items: items.map(function (i) { return { id: i[0], qty: i[1] }; }), jam: jam, status: st, metode: metode, total: total, bayar: 'berhasil', demo: true, log: [{ t: 'Pembayaran berhasil', d: 'Transaksi ' + metode + ' terverifikasi' }] };
    }
    save(KEY.orders, [
      o('#A-014', [[1, 1]], '11.45', 'Siap diambil', 'QRIS'),
      o('#A-019', [[2, 1]], '12.15', 'Dimasak', 'QRIS'),
      o('#A-021', [[1, 2]], '12.00', 'Menunggu', 'E-Wallet'),
      o('#A-023', [[2, 3]], '12.30', 'Menunggu', 'QRIS'),
      o('#A-024', [[3, 1], [4, 1]], '12.30', 'Menunggu', 'QRIS')
    ]);
  }
  function orderItemsText(o) { return o.items.map(function (i) { var m = menuById(i.id); return m.nama + ' x' + i.qty; }).join(', '); }
  function pillFor(st) { return { 'Menunggu': 'wait', 'Dimasak': 'cook', 'Siap diambil': 'ready', 'Diambil': 'done' }[st]; }

  /* ===== Halaman ===== */
  var pages = {};

  pages.daftar = function () {
    var tabs = $$('.tabs button'), fd = $('#form-daftar'), fm = $('#form-masuk');
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        tabs.forEach(function (x) { x.classList.toggle('on', x === b); });
        fd.classList.toggle('hidden', b.dataset.tab !== 'daftar');
        fm.classList.toggle('hidden', b.dataset.tab !== 'masuk');
      });
    });
    function go(e) {
      e.preventDefault();
      var f = e.target, role = (f.querySelector('input[name=role]:checked') || {}).value || 'mahasiswa';
      save(KEY.user, { nim: f.nim.value, nama: f.nama ? f.nama.value : '', wa: f.wa ? f.wa.value : '', role: role });
      location.href = role === 'tenan' ? 'tenan.html' : 'menu.html';
    }
    fd.addEventListener('submit', go); fm.addEventListener('submit', go);
  };

  pages.menu = function () {
    var filter = 0, q = '';
    function renderGrid() {
      var list = D.menu.filter(function (m) { return (!filter || m.stand === filter) && m.nama.toLowerCase().indexOf(q) > -1; });
      $('#menu-grid').innerHTML = list.length ? list.map(function (m, i) {
        var n = stokOf(m);
        return '<div class="menu-card"><div class="photo' + (m.id % 2 === 0 ? ' alt' : '') + '"><img src="Asset/image/bowl.svg" alt=""></div><div class="body">' +
          '<div class="stand">Stand ' + esc(standName(m.stand)) + '</div><div class="name">' + esc(m.nama) + '</div>' +
          '<div class="meta"><span class="price">' + rp(m.harga) + '</span>' + stokBadge(n) + '</div>' +
          (n === 0 ? '<button class="btn btn-disabled" disabled>Stok habis</button>' : '<button class="btn btn-primary" data-add="' + m.id + '">+ Tambah</button>') +
          '</div></div>';
      }).join('') : '<div class="empty">Menu tidak ditemukan.</div>';
    }
    function renderCart() {
      var det = cartDetail();
      $('#cart-count').textContent = cartCount();
      $('#cart-items').innerHTML = det.length ? det.map(function (c) {
        return '<div class="line-item"><div><b>' + esc(c.m.nama) + '</b><small>' + c.qty + ' x ' + rp(c.m.harga) + '</small></div><b>' + rp(c.m.harga * c.qty) + '</b></div>';
      }).join('') : '<div class="empty">Keranjang masih kosong.</div>';
      $('#cart-total').textContent = rp(cartTotal());
      $('#cart-n').textContent = cartCount() + ' item';
      $('#go-checkout').classList.toggle('btn-disabled', !det.length);
      $('#go-checkout').setAttribute('aria-disabled', det.length ? 'false' : 'true');
    }
    var chips = $('#stand-chips');
    chips.innerHTML = '<button class="on" data-s="0">Semua stand</button>' + D.stands.map(function (s) { return '<button data-s="' + s.id + '">' + esc(s.nama) + '</button>'; }).join('');
    chips.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; filter = +b.dataset.s; $$('button', chips).forEach(function (x) { x.classList.toggle('on', x === b); }); renderGrid(); });
    $('#cari').addEventListener('input', function (e) { q = e.target.value.toLowerCase(); renderGrid(); });
    $('#menu-grid').addEventListener('click', function (e) { var b = e.target.closest('[data-add]'); if (!b) return; addCart(+b.dataset.add); renderCart(); });
    var sel = $('#jam'); sel.innerHTML = D.jam.map(function (j) { return '<option' + (j === getJam() ? ' selected' : '') + '>' + j + '</option>'; }).join('');
    sel.addEventListener('change', function () { save(KEY.jam, sel.value); });
    $('#go-checkout').addEventListener('click', function (e) { if (!cart().length) e.preventDefault(); else save(KEY.jam, sel.value); });
    renderGrid(); renderCart();
  };

  pages.checkout = function () {
    function render() {
      var det = cartDetail();
      $('#co-items').innerHTML = det.length ? det.map(function (c) {
        return '<div class="order-item"><div><b>' + esc(c.m.nama) + '</b><small>Stand ' + esc(standName(c.m.stand)) + ' · ' + rp(c.m.harga) + '</small></div>' +
          '<div style="display:flex;align-items:center;gap:14px"><div class="qty"><button aria-label="Kurangi jumlah" data-q="-1" data-id="' + c.m.id + '">&minus;</button><span>' + c.qty + '</span><button aria-label="Tambah jumlah" data-q="1" data-id="' + c.m.id + '">+</button></div><b style="min-width:88px;text-align:right">' + rp(c.m.harga * c.qty) + '</b></div></div>';
      }).join('') : '<div class="empty">Keranjang kosong. <a href="menu.html" style="color:var(--green-dark);text-decoration:underline">Pilih menu</a></div>';
      $$('.t-total').forEach(function (e) { e.textContent = rp(cartTotal()); });
      $('#t-jam').textContent = getJam();
      $('#pay').classList.toggle('btn-disabled', !det.length);
      $$('#times button').forEach(function (b) { b.classList.toggle('on', b.textContent === getJam()); });
    }
    $('#times').innerHTML = D.jam.map(function (j) { return '<button type="button">' + j + '</button>'; }).join('');
    $('#times').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; save(KEY.jam, b.textContent); render(); });
    $('#co-items').addEventListener('click', function (e) { var b = e.target.closest('[data-q]'); if (!b) return; changeQty(+b.dataset.id, +b.dataset.q); render(); });
    $('#pay').addEventListener('click', function () {
      var det = cartDetail(); if (!det.length) return;
      var list = orders(), metode = ($('input[name=bayar]:checked') || {}).value || 'QRIS';
      var o = { no: nextNo(list), items: cart(), jam: getJam(), status: 'Menunggu', metode: metode, total: cartTotal(), bayar: 'berhasil',
        log: [{ t: 'Pembayaran berhasil', d: 'Transaksi ' + metode + ' terverifikasi (' + now() + ')' }, { t: 'Pesanan masuk ke stand', d: 'Tenan menerima notifikasi pesanan' }] };
      det.forEach(function (c) { setStok(c.m.id, stokOf(c.m) - c.qty); });
      list.push(o); save(KEY.orders, list); save(KEY.last, o.no); save(KEY.cart, []);
      location.href = 'status.html';
    });
    render();
  };

  pages.status = function () {
    function render() {
      var list = orders(), no = load(KEY.last, null);
      var o = list.filter(function (x) { return x.no === no; })[0] || list[list.length - 1];
      $('#empty').classList.toggle('hidden', !!o); $('#detail').classList.toggle('hidden', !o);
      if (!o) return;
      var idx = D.statusUrut.indexOf(o.status);
      $('#o-no').textContent = 'Pesanan ' + o.no;
      $('#o-title').textContent = { 'Menunggu': 'Pesananmu diterima stand', 'Dimasak': 'Pesananmu sedang dimasak', 'Siap diambil': 'Pesananmu siap diambil', 'Diambil': 'Pesanan sudah diambil' }[o.status];
      $('#o-progress').innerHTML = D.statusUrut.map(function (s, i) { return '<div class="' + (i <= idx ? 'on' : '') + '">' + s + '</div>'; }).join('');
      $('#o-jam').textContent = o.jam; $('#o-total').textContent = rp(o.total); $('#o-metode').textContent = o.metode;
      $('#o-items').innerHTML = o.items.map(function (i) { var m = menuById(i.id); return '<div class="rowline"><div><b>' + esc(m.nama) + '</b><small>Stand ' + esc(standName(m.stand)) + ' · ' + i.qty + ' porsi</small></div><b>' + rp(m.harga * i.qty) + '</b></div>'; }).join('');
      var logs = o.log.slice();
      if (idx >= 1) logs.push({ t: 'Sedang dimasak', d: 'Dijadwalkan sebelum jam takeaway' });
      if (idx >= 2) logs.push({ t: 'Siap diambil', d: 'Notifikasi pick-up dikirim' });
      if (idx >= 3) logs.push({ t: 'Diambil', d: 'Pesanan selesai' });
      $('#o-log').innerHTML = logs.map(function (l) { return '<div><span>' + esc(l.t) + '<small>' + esc(l.d) + '</small></span></div>'; }).join('');
      $('#wa').classList.toggle('hidden', idx < 2);
      $('#wa-text').textContent = 'Pesanan ' + o.no + ' sudah siap diambil. Tunjukkan nomor pesanan ke stand.';
      $('#wa-none').classList.toggle('hidden', idx >= 2);
    }
    $('#proof').addEventListener('click', function () { alert('Bukti pembayaran (contoh). Pada sistem asli, bukti dikirim dari payment gateway.'); });
    window.addEventListener('storage', render); setInterval(render, 2000); render();
  };

  pages.tenan = function () {
    seedIfEmpty();
    var open = load(KEY.open, true), sw = $('#open');
    function render() {
      var list = orders().slice().sort(function (a, b) { return a.jam < b.jam ? -1 : 1; });
      var c = function (s) { return list.filter(function (o) { return o.status === s; }).length; };
      $('#k-total').textContent = list.length; $('#k-wait').textContent = c('Menunggu'); $('#k-cook').textContent = c('Dimasak'); $('#k-ready').textContent = c('Siap diambil');
      var aksi = { 'Menunggu': ['Mulai masak', 'btn-primary'], 'Dimasak': ['Tandai siap', 'btn-orange'], 'Siap diambil': ['Sudah diambil', 'btn-outline'] };
      $('#jadwal').innerHTML = list.map(function (o) {
        var a = aksi[o.status];
        return '<tr><td><b>' + o.no + '</b></td><td>' + esc(orderItemsText(o)) + '</td><td><b>' + o.jam + '</b></td><td><span class="pill ' + pillFor(o.status) + '">' + o.status + '</span></td><td>' +
          (a ? '<button class="btn btn-sm ' + a[1] + '" data-no="' + o.no + '">' + a[0] + '</button>' : '<span class="muted">Selesai</span>') + '</td></tr>';
      }).join('') || '<tr><td colspan="5" class="muted">Belum ada pesanan.</td></tr>';
      $('#menu-stok').innerHTML = D.menu.filter(function (m) { return m.stand === 1; }).map(function (m) {
        return '<div class="mini"><div class="r"><b>' + esc(m.nama) + '</b><span class="price" style="font-size:15px">' + rp(m.harga) + '</span></div><div class="r"><span class="muted">Stok: <b style="color:var(--ink)">' + stokOf(m) + '</b></span><div class="sq"><button aria-label="Kurangi stok" data-s="-1" data-id="' + m.id + '">&minus;</button><button aria-label="Tambah stok" data-s="1" data-id="' + m.id + '">+</button></div></div></div>';
      }).join('');
      sw.setAttribute('aria-pressed', open ? 'true' : 'false'); $('#open-label').textContent = open ? 'Stand buka' : 'Stand tutup';
    }
    $('#jadwal').addEventListener('click', function (e) {
      var b = e.target.closest('[data-no]'); if (!b) return;
      var list = orders(); list.forEach(function (o) { if (o.no === b.dataset.no) { o.status = D.statusUrut[D.statusUrut.indexOf(o.status) + 1] || o.status; } });
      save(KEY.orders, list); render();
    });
    $('#menu-stok').addEventListener('click', function (e) { var b = e.target.closest('[data-s]'); if (!b) return; var m = menuById(+b.dataset.id); setStok(m.id, stokOf(m) + +b.dataset.s); render(); });
    sw.addEventListener('click', function () { open = !open; save(KEY.open, open); render(); });
    render();
  };

  pages.admin = function () {
    seedIfEmpty();
    var list = orders(), tot = list.reduce(function (a, o) { return a + o.total; }, 0);
    $('#a-pesanan').textContent = list.length; $('#a-total').textContent = rp(tot);
    $('#a-ok').textContent = list.filter(function (o) { return o.bayar === 'berhasil'; }).length; $('#a-gagal').textContent = list.filter(function (o) { return o.bayar === 'gagal'; }).length;
    $('#per-stand').innerHTML = D.stands.map(function (s) {
      var n = 0, t = 0;
      list.forEach(function (o) { var mine = o.items.filter(function (i) { return menuById(i.id).stand === s.id; }); if (mine.length) { n++; t += mine.reduce(function (a, i) { return a + menuById(i.id).harga * i.qty; }, 0); } });
      return '<tr><td><b>Stand ' + esc(s.nama) + '</b></td><td>' + n + '</td><td><b>' + rp(t) + '</b></td><td><span class="pill ' + (s.id === 3 ? 'off' : 'ok') + '">' + (s.id === 3 ? 'Tutup' : 'Buka') + '</span></td></tr>';
    }).join('');
    $('#stand-list').innerHTML = D.stands.map(function (s) { return '<div class="rowline"><div><b>Stand ' + esc(s.nama) + '</b><small>Pengelola: ' + esc(s.pengelola.replace('Pengelola ', '')) + '</small></div><button class="btn btn-outline btn-sm">Ubah</button></div>'; }).join('');
    var u = load(KEY.user, null), us = [{ n: 'Mahasiswa contoh', i: 'NIM 0000000001', r: 'Mahasiswa' }, { n: 'Dosen contoh', i: 'NIP 0000000002', r: 'Dosen' }, { n: 'Tenan contoh', i: 'ID 0000000003', r: 'Pengelola stand' }];
    if (u && u.nama) us.unshift({ n: u.nama, i: (u.role === 'dosen' ? 'NIP ' : 'NIM ') + u.nim, r: u.role.charAt(0).toUpperCase() + u.role.slice(1) });
    $('#user-list').innerHTML = us.map(function (x) { return '<div class="rowline"><div><b>' + esc(x.n) + '</b><small>' + esc(x.i) + '</small></div><span class="pill ok">' + esc(x.r) + '</span></div>'; }).join('');
    $('#unduh').addEventListener('click', function () {
      var csv = 'No Pesanan,Menu,Jam Takeaway,Metode,Status,Total\n' + list.map(function (o) { return [o.no, '"' + orderItemsText(o) + '"', o.jam, o.metode, o.status, o.total].join(','); }).join('\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'laporan-transaksi.csv'; a.click();
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    var p = document.body.dataset.page; if (pages[p]) pages[p]();
    $$('[data-reset]').forEach(function (b) { b.addEventListener('click', function () { try { localStorage.clear(); } catch (e) {} location.reload(); }); });
  });
})();
