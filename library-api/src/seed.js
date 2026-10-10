// @ts-nocheck
/** Data contoh. Tanggal relatif terhadap "hari ini" agar status tetap masuk akal. */

export const SEED_IDS = {
  siti: "11111111-1111-4111-8111-111111111111",
  ahmad: "22222222-2222-4222-8222-222222222222",
  dewi: "33333333-3333-4333-8333-333333333333",
  budi: "44444444-4444-4444-8444-444444444444",
  maya: "55555555-5555-4555-8555-555555555555",
  raka: "66666666-6666-4666-8666-666666666666",
  nadia: "77777777-7777-4777-8777-777777777777",
  farhan: "88888888-8888-4888-8888-888888888888",
};

function addDays(iso, days) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function row(partial, today) {
  const tanggalPinjam = partial.tanggal_pinjam;
  return {
    isbn: null,
    tanggal_kembali: null,
    catatan: null,
    created_at: `${tanggalPinjam}T02:00:00.000Z`,
    updated_at: `${today}T02:00:00.000Z`,
    ...partial,
  };
}

export function createSeedLoans(today) {
  return [
    row(
      {
        id: SEED_IDS.siti,
        kode_anggota: "AGT-1042",
        nama_anggota: "Siti Rahmawati",
        judul_buku: "Bumi",
        isbn: "9786020301129",
        tanggal_pinjam: addDays(today, -40),
        tanggal_jatuh_tempo: addDays(today, -26),
        status: "Terlambat",
        catatan: "Perpanjangan ditolak — antrean reservasi.",
      },
      today,
    ),
    row(
      {
        id: SEED_IDS.ahmad,
        kode_anggota: "AGT-1108",
        nama_anggota: "Ahmad Fauzi",
        judul_buku: "Laskar Pelangi",
        isbn: "9789793062792",
        tanggal_pinjam: addDays(today, -5),
        tanggal_jatuh_tempo: addDays(today, 9),
        status: "Dipinjam",
      },
      today,
    ),
    row(
      {
        id: SEED_IDS.dewi,
        kode_anggota: "AGT-0981",
        nama_anggota: "Dewi Lestari",
        judul_buku: "Filosofi Teras",
        isbn: "9786024125189",
        tanggal_pinjam: addDays(today, -21),
        tanggal_jatuh_tempo: addDays(today, -7),
        tanggal_kembali: addDays(today, -8),
        status: "Dikembalikan",
      },
      today,
    ),
    row(
      {
        id: SEED_IDS.budi,
        kode_anggota: "AGT-1215",
        nama_anggota: "Budi Santoso",
        judul_buku: "Atomic Habits",
        isbn: "9786020633176",
        tanggal_pinjam: addDays(today, -30),
        tanggal_jatuh_tempo: addDays(today, -16),
        status: "Terlambat",
        catatan: "Sudah diingatkan lewat surel.",
      },
      today,
    ),
    row(
      {
        id: SEED_IDS.maya,
        kode_anggota: "AGT-1330",
        nama_anggota: "Maya Anggraini",
        judul_buku: "Laut Bercerita",
        isbn: "9786024246945",
        tanggal_pinjam: addDays(today, -2),
        tanggal_jatuh_tempo: addDays(today, 12),
        status: "Dipinjam",
      },
      today,
    ),
    row(
      {
        id: SEED_IDS.raka,
        kode_anggota: "AGT-0874",
        nama_anggota: "Raka Wijaya",
        judul_buku: "Negeri 5 Menara",
        isbn: "9789792248616",
        tanggal_pinjam: addDays(today, -50),
        tanggal_jatuh_tempo: addDays(today, -36),
        tanggal_kembali: addDays(today, -34),
        status: "Dikembalikan",
      },
      today,
    ),
    row(
      {
        id: SEED_IDS.nadia,
        kode_anggota: "AGT-1411",
        nama_anggota: "Nadia Kusuma",
        judul_buku: "Cantik Itu Luka",
        isbn: "9786020301112",
        tanggal_pinjam: addDays(today, -18),
        tanggal_jatuh_tempo: addDays(today, -4),
        status: "Terlambat",
      },
      today,
    ),
    row(
      {
        id: SEED_IDS.farhan,
        kode_anggota: "AGT-1560",
        nama_anggota: "Farhan Malik",
        judul_buku: "Sapiens",
        isbn: "9786024246946",
        tanggal_pinjam: addDays(today, -1),
        tanggal_jatuh_tempo: addDays(today, 13),
        status: "Dipinjam",
      },
      today,
    ),
  ];
}
