# Aksara — REST API Peminjaman Buku

API pencatatan peminjaman buku perpustakaan. Petugas meja sirkulasi mencatat buku yang dipinjam anggota, memperbarui data (termasuk pengembalian), menghapus catatan yang salah, dan menyaring daftar — misalnya hanya yang **terlambat**.

Dibangun dengan **Node.js**, **Express.js**, dan **Supabase** (Postgres). Jika kredensial Supabase belum diisi, API tetap jalan dengan penyimpanan memori dan data contoh supaya endpoint bisa langsung diuji.

## Base URL

Deployment Vercel (diperbarui otomatis setelah publish):

**Belum dipublish.** Setelah repository terhubung ke Vercel, base URL berbentuk `https://<nama-proyek>.vercel.app`.

Contoh pemanggilan begitu URL itu ada:

```bash
curl "https://<nama-proyek>.vercel.app/loans?status=Terlambat"
```

## Struktur data

Satu catatan peminjaman (`loans`):

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | uuid | Dibuat server |
| `kode_anggota` | text | Kode anggota, wajib |
| `nama_anggota` | text | Nama anggota, wajib |
| `judul_buku` | text | Judul yang dipinjam, wajib |
| `isbn` | text / null | Opsional |
| `tanggal_pinjam` | date `YYYY-MM-DD` | Wajib |
| `tanggal_jatuh_tempo` | date | Wajib, tidak boleh sebelum tanggal pinjam |
| `tanggal_kembali` | date / null | Diisi saat buku dikembalikan |
| `status` | `Dipinjam` \| `Dikembalikan` \| `Terlambat` | **Dihitung dari tanggal**, bukan diketik bebas |
| `catatan` | text / null | Opsional |
| `hari_terlambat` | number | Turunan. `0` jika tidak terlambat. Tidak disimpan di tabel |
| `created_at`, `updated_at` | timestamptz | Diisi server |

Aturan status (zona tanggal **Asia/Jakarta**):

- ada `tanggal_kembali` → `Dikembalikan`
- belum kembali dan `tanggal_jatuh_tempo` sudah lewat → `Terlambat`
- selain itu → `Dipinjam`

Skema SQL ada di [`supabase/schema.sql`](supabase/schema.sql).

## Endpoint

| Method | Path | Fungsi |
| --- | --- | --- |
| `GET` | `/` dan `/health` | Info layanan |
| `GET` | `/loans` | Daftar peminjaman |
| `GET` | `/loans?status=Terlambat` | Filter status (`Dipinjam`, `Dikembalikan`, `Terlambat`). Tidak peka huruf besar/kecil |
| `GET` | `/loans?q=budi` | Cari nama, kode anggota, judul, atau ISBN |
| `GET` | `/loans/:id` | Detail |
| `POST` | `/loans` | Catat peminjaman baru |
| `PUT` / `PATCH` | `/loans/:id` | Ubah sebagian field |
| `DELETE` | `/loans/:id` | Hapus |

Respons sukses:

```json
{ "success": true, "message": "...", "data": {}, "meta": {} }
```

Respons gagal:

```json
{
  "success": false,
  "message": "Data belum lengkap.",
  "errors": [{ "field": "judul_buku", "message": "Judul buku wajib diisi." }]
}
```

## Contoh request dan response

### Daftar yang terlambat

```bash
curl "http://localhost:3001/loans?status=Terlambat"
```

```json
{
  "success": true,
  "message": "Daftar peminjaman berhasil diambil.",
  "data": [
    {
      "id": "44444444-4444-4444-8444-444444444444",
      "kode_anggota": "AGT-1215",
      "nama_anggota": "Budi Santoso",
      "judul_buku": "Atomic Habits",
      "isbn": "9786020633176",
      "tanggal_pinjam": "2026-09-10",
      "tanggal_jatuh_tempo": "2026-09-24",
      "tanggal_kembali": null,
      "status": "Terlambat",
      "catatan": "Sudah diingatkan lewat surel.",
      "hari_terlambat": 16,
      "created_at": "2026-09-10T02:00:00.000Z",
      "updated_at": "2026-10-10T02:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "filter": { "status": "Terlambat", "q": null },
    "storage": "memory"
  }
}
```

`hari_terlambat` dan tanggal pada data contoh mengikuti hari ini (WIB). Cuplikan di atas ilustrasi bila hari ini `2026-10-10`. Yang tetap sama: bentuk JSON, `status: "Terlambat"`, dan `success: true`.

### Catat peminjaman

```bash
curl -X POST http://localhost:3001/loans \
  -H "Content-Type: application/json" \
  -d '{
    "kode_anggota": "AGT-2001",
    "nama_anggota": "Intan Prameswari",
    "judul_buku": "Pulang",
    "isbn": "9786022911742",
    "tanggal_pinjam": "2026-10-01",
    "tanggal_jatuh_tempo": "2026-10-15"
  }'
```

```json
{
  "success": true,
  "message": "Peminjaman berhasil dicatat.",
  "data": {
    "id": "9b1c2d3e-4f50-4611-8a22-334455667788",
    "kode_anggota": "AGT-2001",
    "nama_anggota": "Intan Prameswari",
    "judul_buku": "Pulang",
    "isbn": "9786022911742",
    "tanggal_pinjam": "2026-10-01",
    "tanggal_jatuh_tempo": "2026-10-15",
    "tanggal_kembali": null,
    "status": "Dipinjam",
    "catatan": null,
    "hari_terlambat": 0,
    "created_at": "2026-10-10T05:00:00.000Z",
    "updated_at": "2026-10-10T05:00:00.000Z"
  },
  "meta": { "storage": "memory" }
}
```

`201` jika berhasil. Lewat jatuh tempo tanpa tanggal kembali → status otomatis `Terlambat`.

### Detail

```bash
curl http://localhost:3001/loans/11111111-1111-4111-8111-111111111111
```

Id di atas adalah data contoh Siti Rahmawati / *Bumi* (hanya ada di mode memori, sebelum diubah).

### Ubah / tandai kembali

```bash
curl -X PUT http://localhost:3001/loans/ID_DISINI \
  -H "Content-Type: application/json" \
  -d '{ "tanggal_kembali": "2026-10-10" }'
```

Status pada respons menjadi `Dikembalikan`.

### Hapus

```bash
curl -X DELETE http://localhost:3001/loans/ID_DISINI
```

`404` jika id tidak ada.

## Instalasi dan menjalankan lokal

Butuh Node.js 20 atau lebih baru.

```bash
git clone <url-repository-github-anda>.git
cd api-peminjaman-buku
npm install
npm start
```

Server mendengar di `http://localhost:3001`.

Uji:

```bash
curl http://localhost:3001/health
curl "http://localhost:3001/loans?status=Terlambat"
npm test
```

Mode pengembangan (restart otomatis saat file berubah):

```bash
npm run dev
```

### Menyambungkan Supabase

1. Buat project di [Supabase](https://supabase.com).
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu jalankan.
3. Salin `.env.example` menjadi `.env`.
4. Isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` (Settings → API). Jangan commit file `.env` dan jangan pakai service role key di browser.
5. Jalankan ulang `npm start`. `GET /health` menampilkan `"storage": "supabase"`.

Di Vercel, set kedua variabel yang sama di **Project → Settings → Environment Variables**, lalu redeploy. Tanpa variabel itu deployment tetap bisa diuji: data contoh hidup di memori instance (cocok untuk mencoba CRUD, hilang jika instance dingin / restart). Supabase dipakai agar data tetap ada.

## Deploy ke Vercel

Repository ini sudah berisi `vercel.json` dan mengekspor aplikasi Express dari `src/index.js` (entrypoint yang dikenali Vercel).

1. Import repository GitHub ini ke Vercel.
2. Framework preset: **Other**. Tidak perlu build command.
3. Tambahkan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` bila database sudah siap.
4. Deploy. Base URL ada di bagian atas dokumen ini.

## Lisensi data contoh

Judul buku pada data contoh hanya dipakai sebagai isi demo katalog.
