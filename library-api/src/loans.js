// @ts-nocheck
import { createClient } from "@supabase/supabase-js";
import { createSeedLoans } from "./seed.js";

export const STATUSES = ["Dipinjam", "Dikembalikan", "Terlambat"];
const STORE_KEY = "__aksaraLoanRows";
const TEXT_LIMITS = {
  kode_anggota: 32,
  nama_anggota: 120,
  judul_buku: 200,
  isbn: 20,
  catatan: 500,
};

export class LoanError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = "LoanError";
    this.statusCode = status;
    this.errors = errors;
  }
}

export function todayISO() {
  if (process.env.LOAN_TODAY && /^\d{4}-\d{2}-\d{2}$/.test(process.env.LOAN_TODAY)) {
    return process.env.LOAN_TODAY;
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function storageMode() {
  return supabaseClient() ? "supabase" : "memory";
}

export function resetStore() {
  delete globalThis[STORE_KEY];
}

let cachedClient;

function supabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedClient;
}

function memoryRows() {
  if (!Array.isArray(globalThis[STORE_KEY])) {
    globalThis[STORE_KEY] = createSeedLoans(todayISO());
  }
  return globalThis[STORE_KEY];
}

function isISODate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function daysBetween(from, to) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / 86400000);
}

export function deriveStatus(loan, today = todayISO()) {
  if (loan.tanggal_kembali) return "Dikembalikan";
  if (loan.tanggal_jatuh_tempo < today) return "Terlambat";
  return "Dipinjam";
}

export function present(row, today = todayISO()) {
  const status = deriveStatus(row, today);
  return {
    id: row.id,
    kode_anggota: row.kode_anggota,
    nama_anggota: row.nama_anggota,
    judul_buku: row.judul_buku,
    isbn: row.isbn ?? null,
    tanggal_pinjam: row.tanggal_pinjam,
    tanggal_jatuh_tempo: row.tanggal_jatuh_tempo,
    tanggal_kembali: row.tanggal_kembali ?? null,
    status,
    catatan: row.catatan ?? null,
    hari_terlambat: status === "Terlambat" ? daysBetween(row.tanggal_jatuh_tempo, today) : 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function assertUuid(id) {
  if (
    typeof id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  ) {
    throw new LoanError(400, "Id peminjaman tidak valid.");
  }
}

function cleanText(value, field, { required }) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new LoanError(400, "Data belum lengkap.", [
        { field, message: `${label(field)} wajib diisi.` },
      ]);
    }
    return null;
  }
  if (typeof value !== "string") {
    throw new LoanError(400, "Tipe data tidak sesuai.", [
      { field, message: `${label(field)} harus berupa teks.` },
    ]);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    if (required) {
      throw new LoanError(400, "Data belum lengkap.", [
        { field, message: `${label(field)} wajib diisi.` },
      ]);
    }
    return null;
  }
  const limit = TEXT_LIMITS[field];
  if (trimmed.length > limit) {
    throw new LoanError(400, "Data terlalu panjang.", [
      { field, message: `${label(field)} maksimal ${limit} karakter.` },
    ]);
  }
  return trimmed;
}

function label(field) {
  return (
    {
      kode_anggota: "Kode anggota",
      nama_anggota: "Nama anggota",
      judul_buku: "Judul buku",
      isbn: "ISBN",
      catatan: "Catatan",
      tanggal_pinjam: "Tanggal pinjam",
      tanggal_jatuh_tempo: "Tanggal jatuh tempo",
      tanggal_kembali: "Tanggal kembali",
      status: "Status",
    }[field] || field
  );
}

function cleanDate(value, field, { required }) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new LoanError(400, "Data belum lengkap.", [
        { field, message: `${label(field)} wajib diisi.` },
      ]);
    }
    return null;
  }
  if (!isISODate(value)) {
    throw new LoanError(400, "Format tanggal tidak valid.", [
      { field, message: `${label(field)} harus YYYY-MM-DD.` },
    ]);
  }
  return value;
}

const WRITABLE = [
  "kode_anggota",
  "nama_anggota",
  "judul_buku",
  "isbn",
  "tanggal_pinjam",
  "tanggal_jatuh_tempo",
  "tanggal_kembali",
  "catatan",
  "status",
];

export function parseLoanBody(body, { partial }) {
  if (body === undefined || body === null) {
    if (partial) return {};
    throw new LoanError(400, "Body JSON wajib diisi.");
  }
  if (typeof body !== "object" || Array.isArray(body)) {
    throw new LoanError(400, "Body harus berupa objek JSON.");
  }
  const unknown = Object.keys(body).filter((key) => !WRITABLE.includes(key));
  if (unknown.length) {
    throw new LoanError(400, "Ada field yang tidak dikenal.", [
      { field: unknown[0], message: `Field "${unknown[0]}" tidak didukung.` },
    ]);
  }
  if (partial && Object.keys(body).length === 0) {
    throw new LoanError(400, "Tidak ada data yang diubah.");
  }

  const patch = {};
  if (!partial || "kode_anggota" in body) {
    patch.kode_anggota = cleanText(body.kode_anggota, "kode_anggota", { required: true });
  }
  if (!partial || "nama_anggota" in body) {
    patch.nama_anggota = cleanText(body.nama_anggota, "nama_anggota", { required: true });
  }
  if (!partial || "judul_buku" in body) {
    patch.judul_buku = cleanText(body.judul_buku, "judul_buku", { required: true });
  }
  if ("isbn" in body || !partial) {
    if ("isbn" in body || body.isbn) patch.isbn = cleanText(body.isbn, "isbn", { required: false });
  }
  if (!partial || "tanggal_pinjam" in body) {
    patch.tanggal_pinjam = cleanDate(body.tanggal_pinjam, "tanggal_pinjam", { required: true });
  }
  if (!partial || "tanggal_jatuh_tempo" in body) {
    patch.tanggal_jatuh_tempo = cleanDate(body.tanggal_jatuh_tempo, "tanggal_jatuh_tempo", {
      required: true,
    });
  }
  if ("tanggal_kembali" in body) {
    patch.tanggal_kembali = cleanDate(body.tanggal_kembali, "tanggal_kembali", { required: false });
  }
  if ("catatan" in body) {
    patch.catatan = cleanText(body.catatan, "catatan", { required: false });
  }
  if ("status" in body && body.status !== undefined && body.status !== null && body.status !== "") {
    if (typeof body.status !== "string" || !STATUSES.includes(body.status)) {
      throw new LoanError(400, "Status tidak dikenal.", [
        { field: "status", message: `Status harus salah satu dari: ${STATUSES.join(", ")}.` },
      ]);
    }
    patch.status = body.status;
  }
  return patch;
}

function assertDateOrder(loan) {
  if (loan.tanggal_jatuh_tempo < loan.tanggal_pinjam) {
    throw new LoanError(400, "Tanggal tidak urut.", [
      {
        field: "tanggal_jatuh_tempo",
        message: "Tanggal jatuh tempo tidak boleh sebelum tanggal pinjam.",
      },
    ]);
  }
  if (loan.tanggal_kembali && loan.tanggal_kembali < loan.tanggal_pinjam) {
    throw new LoanError(400, "Tanggal tidak urut.", [
      {
        field: "tanggal_kembali",
        message: "Tanggal kembali tidak boleh sebelum tanggal pinjam.",
      },
    ]);
  }
}

function assertStatusAgrees(loan) {
  if (!loan.status) return;
  const derived = deriveStatus(loan);
  if (loan.status !== derived) {
    throw new LoanError(400, "Status tidak sesuai dengan tanggal.", [
      {
        field: "status",
        message: `Berdasarkan tanggal, status yang benar adalah "${derived}". Kosongkan field status agar dihitung otomatis, atau sesuaikan tanggal kembali / jatuh tempo.`,
      },
    ]);
  }
}

function applyStatus(loan) {
  const next = { ...loan, status: deriveStatus(loan) };
  return next;
}

async function fetchAll() {
  const client = supabaseClient();
  if (!client) return memoryRows().map((row) => ({ ...row }));
  const { data, error } = await client.from("loans").select("*");
  if (error) throw mapSupabaseError(error);
  return data ?? [];
}

async function fetchOne(id) {
  const client = supabaseClient();
  if (!client) {
    const found = memoryRows().find((row) => row.id === id);
    return found ? { ...found } : null;
  }
  const { data, error } = await client.from("loans").select("*").eq("id", id).maybeSingle();
  if (error) throw mapSupabaseError(error);
  return data;
}

function mapSupabaseError(error) {
  const message = String(error.message || error);
  if (/relation .*loans.* does not exist|could not find the table/i.test(message)) {
    return new LoanError(
      500,
      "Tabel loans belum ada di Supabase. Jalankan file supabase/schema.sql di SQL Editor.",
    );
  }
  return new LoanError(500, "Gagal mengakses Supabase.", [{ field: "supabase", message }]);
}

export async function listLoans({ status, q } = {}) {
  let normalized = null;
  if (status) {
    normalized = STATUSES.find((item) => item.toLowerCase() === String(status).trim().toLowerCase());
    if (!normalized) {
      throw new LoanError(400, "Filter status tidak dikenal.", [
        { field: "status", message: `Gunakan salah satu: ${STATUSES.join(", ")}.` },
      ]);
    }
  }
  const needle = typeof q === "string" ? q.trim().toLowerCase() : "";
  let rows = (await fetchAll()).map((row) => present(row));
  if (normalized) rows = rows.filter((row) => row.status === normalized);
  if (needle) {
    rows = rows.filter((row) =>
      [row.nama_anggota, row.judul_buku, row.kode_anggota, row.isbn]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }
  const rank = { Terlambat: 0, Dipinjam: 1, Dikembalikan: 2 };
  rows.sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      a.tanggal_jatuh_tempo.localeCompare(b.tanggal_jatuh_tempo) ||
      a.nama_anggota.localeCompare(b.nama_anggota, "id"),
  );
  return { rows, status: normalized, q: needle || null };
}

export async function getLoan(id) {
  assertUuid(id);
  const row = await fetchOne(id);
  if (!row) throw new LoanError(404, "Peminjaman tidak ditemukan.");
  return present(row);
}

export async function createLoan(body) {
  const patch = parseLoanBody(body, { partial: false });
  const now = new Date().toISOString();
  const loan = applyStatus({
    id: crypto.randomUUID(),
    kode_anggota: patch.kode_anggota,
    nama_anggota: patch.nama_anggota,
    judul_buku: patch.judul_buku,
    isbn: patch.isbn ?? null,
    tanggal_pinjam: patch.tanggal_pinjam,
    tanggal_jatuh_tempo: patch.tanggal_jatuh_tempo,
    tanggal_kembali: patch.tanggal_kembali ?? null,
    catatan: patch.catatan ?? null,
    status: patch.status,
    created_at: now,
    updated_at: now,
  });
  assertDateOrder(loan);
  assertStatusAgrees({ ...loan, status: patch.status });
  loan.status = deriveStatus(loan);

  const client = supabaseClient();
  if (!client) {
    memoryRows().push(loan);
    return present(loan);
  }
  const { data, error } = await client.from("loans").insert(loan).select("*").single();
  if (error) throw mapSupabaseError(error);
  return present(data);
}

export async function updateLoan(id, body) {
  assertUuid(id);
  const current = await fetchOne(id);
  if (!current) throw new LoanError(404, "Peminjaman tidak ditemukan.");
  const patch = parseLoanBody(body, { partial: true });
  const merged = applyStatus({
    ...current,
    ...patch,
    isbn: "isbn" in patch ? patch.isbn : current.isbn,
    catatan: "catatan" in patch ? patch.catatan : current.catatan,
    tanggal_kembali:
      "tanggal_kembali" in patch ? patch.tanggal_kembali : current.tanggal_kembali,
    updated_at: new Date().toISOString(),
  });
  assertDateOrder(merged);
  if (patch.status) assertStatusAgrees({ ...merged, status: patch.status });
  merged.status = deriveStatus(merged);

  const client = supabaseClient();
  if (!client) {
    const rows = memoryRows();
    const index = rows.findIndex((row) => row.id === id);
    rows[index] = merged;
    return present(merged);
  }
  const { data, error } = await client.from("loans").update(merged).eq("id", id).select("*").single();
  if (error) throw mapSupabaseError(error);
  return present(data);
}

export async function deleteLoan(id) {
  assertUuid(id);
  const current = await fetchOne(id);
  if (!current) throw new LoanError(404, "Peminjaman tidak ditemukan.");
  const client = supabaseClient();
  if (!client) {
    const rows = memoryRows();
    const index = rows.findIndex((row) => row.id === id);
    rows.splice(index, 1);
    return present(current);
  }
  const { error } = await client.from("loans").delete().eq("id", id);
  if (error) throw mapSupabaseError(error);
  return present(current);
}
