import assert from "node:assert/strict";
import { once } from "node:events";
import { beforeEach, describe, test } from "node:test";
import app from "../src/app.js";
import { dispatch } from "../src/dispatch.js";
import { resetStore } from "../src/loans.js";
import { SEED_IDS } from "../src/seed.js";

describe("peminjaman", { concurrency: 1 }, () => {
  beforeEach(() => {
    process.env.LOAN_TODAY = "2026-10-10";
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    resetStore();
  });

  test("GET /loans?status=Terlambat hanya mengembalikan yang jatuh tempo", async () => {
    const result = await dispatch({
      method: "GET",
      pathname: "/loans",
      searchParams: new URLSearchParams("status=terlambat"),
    });
    assert.equal(result.status, 200);
    assert.ok(result.body.data.length >= 1);
    assert.ok(result.body.data.every((row) => row.status === "Terlambat"));
    assert.ok(result.body.data.every((row) => row.hari_terlambat > 0));
  });

  test("menolak filter status yang tidak dikenal", async () => {
    const result = await dispatch({
      method: "GET",
      pathname: "/loans",
      searchParams: new URLSearchParams("status=Hilang"),
    });
    assert.equal(result.status, 400);
    assert.equal(result.body.success, false);
  });

  test("CRUD lewat HTTP", async () => {
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    const base = `http://127.0.0.1:${address.port}`;

    try {
      const createdRes = await fetch(`${base}/loans`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kode_anggota: "AGT-2001",
          nama_anggota: "Intan Prameswari",
          judul_buku: "Sejarah Dunia yang Disembunyikan",
          isbn: "9786020300000",
          tanggal_pinjam: "2026-10-01",
          tanggal_jatuh_tempo: "2026-10-20",
        }),
      });
      const created = await createdRes.json();
      assert.equal(createdRes.status, 201);
      assert.equal(created.data.status, "Dipinjam");
      assert.equal(created.data.nama_anggota, "Intan Prameswari");

      const detailRes = await fetch(`${base}/loans/${created.data.id}`);
      assert.equal(detailRes.status, 200);

      const updatedRes = await fetch(`${base}/loans/${created.data.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tanggal_kembali: "2026-10-09" }),
      });
      const updated = await updatedRes.json();
      assert.equal(updatedRes.status, 200);
      assert.equal(updated.data.status, "Dikembalikan");

      const searchRes = await fetch(`${base}/loans?q=Intan`);
      const search = await searchRes.json();
      assert.ok(search.data.some((row) => row.id === created.data.id));

      const deletedRes = await fetch(`${base}/loans/${created.data.id}`, { method: "DELETE" });
      assert.equal(deletedRes.status, 200);
      const missingRes = await fetch(`${base}/loans/${created.data.id}`);
      assert.equal(missingRes.status, 404);
    } finally {
      server.close();
      await once(server, "close");
    }
  });

  test("status otomatis Terlambat bila melewati jatuh tempo", async () => {
    const result = await dispatch({
      method: "POST",
      pathname: "/loans",
      body: {
        kode_anggota: "AGT-3002",
        nama_anggota: "Gilang Saputra",
        judul_buku: "Pulang",
        tanggal_pinjam: "2026-09-01",
        tanggal_jatuh_tempo: "2026-09-10",
      },
    });
    assert.equal(result.status, 201);
    assert.equal(result.body.data.status, "Terlambat");
  });

  test("seed siti dapat diambil", async () => {
    const result = await dispatch({
      method: "GET",
      pathname: `/loans/${SEED_IDS.siti}`,
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.data.judul_buku, "Bumi");
    assert.equal(result.body.data.status, "Terlambat");
  });

  test("body tidak lengkap ditolak", async () => {
    const result = await dispatch({
      method: "POST",
      pathname: "/loans",
      body: { nama_anggota: "Tanpa Kode" },
    });
    assert.equal(result.status, 400);
  });
});
