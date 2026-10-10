import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, Plus, Search, Trash2, X } from "lucide-react";
import { previewPathPrefix } from "@/lib/preview-path-prefix";

type LoanStatus = "Dipinjam" | "Dikembalikan" | "Terlambat";

type Loan = {
  id: string;
  kode_anggota: string;
  nama_anggota: string;
  judul_buku: string;
  isbn: string | null;
  tanggal_pinjam: string;
  tanggal_jatuh_tempo: string;
  tanggal_kembali: string | null;
  status: LoanStatus;
  catatan: string | null;
  hari_terlambat: number;
};

type FieldError = { field: string; message: string };

type ApiBody = {
  success: boolean;
  message: string;
  data?: Loan | Loan[];
  errors?: FieldError[];
  meta?: { total?: number; storage?: string };
};

type Draft = {
  mode: "create" | "edit";
  id?: string;
  kode_anggota: string;
  nama_anggota: string;
  judul_buku: string;
  isbn: string;
  tanggal_pinjam: string;
  tanggal_jatuh_tempo: string;
  tanggal_kembali: string;
  catatan: string;
};

const FILTERS: { id: "" | LoanStatus; label: string }[] = [
  { id: "", label: "Semua" },
  { id: "Dipinjam", label: "Dipinjam" },
  { id: "Terlambat", label: "Terlambat" },
  { id: "Dikembalikan", label: "Kembali" },
];

function apiPath(path: string) {
  if (typeof window === "undefined") return path;
  const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
  return `${prefix ?? ""}${path}`;
}

function todayJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function plusDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

async function requestJson(path: string, method: string, body?: unknown) {
  const response = await fetch(apiPath(path), {
    method,
    headers: {
      accept: "application/json",
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json: ApiBody = { success: false, message: "Respons tidak valid." };
  try {
    json = JSON.parse(text) as ApiBody;
  } catch {
    /* keep fallback */
  }
  return { response, json, text };
}

function emptyDraft(): Draft {
  const pinjam = todayJakarta();
  return {
    mode: "create",
    kode_anggota: "",
    nama_anggota: "",
    judul_buku: "",
    isbn: "",
    tanggal_pinjam: pinjam,
    tanggal_jatuh_tempo: plusDays(pinjam, 14),
    tanggal_kembali: "",
    catatan: "",
  };
}

function draftFromLoan(loan: Loan): Draft {
  return {
    mode: "edit",
    id: loan.id,
    kode_anggota: loan.kode_anggota,
    nama_anggota: loan.nama_anggota,
    judul_buku: loan.judul_buku,
    isbn: loan.isbn ?? "",
    tanggal_pinjam: loan.tanggal_pinjam,
    tanggal_jatuh_tempo: loan.tanggal_jatuh_tempo,
    tanggal_kembali: loan.tanggal_kembali ?? "",
    catatan: loan.catatan ?? "",
  };
}

export function CirculationDesk() {
  const [status, setStatus] = useState<"" | LoanStatus>("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [counts, setCounts] = useState({ total: 0, Dipinjam: 0, Terlambat: 0, Dikembalikan: 0 });
  const [storage, setStorage] = useState("memory");
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [raw, setRaw] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    const qs = params.toString();
    const path = `/loans${qs ? `?${qs}` : ""}`;

    setLoading(true);
    fetch(apiPath(path), { signal: controller.signal, headers: { accept: "application/json" } })
      .then(async (response) => {
        const text = await response.text();
        const json = JSON.parse(text) as ApiBody;
        if (!response.ok || !json.success || !Array.isArray(json.data)) {
          throw new Error(json.message || "Gagal memuat peminjaman.");
        }
        setLoans(json.data);
        setStorage(json.meta?.storage ?? "memory");
        setRaw(JSON.stringify(json, null, 2));
        setBanner(null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setBanner(error instanceof Error ? error.message : "Gagal memuat peminjaman.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [status, debouncedQuery, tick]);

  useEffect(() => {
    let ignore = false;
    requestJson("/loans", "GET").then(({ json }) => {
      if (ignore || !Array.isArray(json.data)) return;
      const rows = json.data;
      setCounts({
        total: rows.length,
        Dipinjam: rows.filter((row) => row.status === "Dipinjam").length,
        Terlambat: rows.filter((row) => row.status === "Terlambat").length,
        Dikembalikan: rows.filter((row) => row.status === "Dikembalikan").length,
      });
    });
    return () => {
      ignore = true;
    };
  }, [tick]);

  const requestLine = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    const qs = params.toString();
    return `GET /loans${qs ? `?${qs}` : ""}`;
  }, [status, debouncedQuery]);

  function patchDraft(partial: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    setFormError(null);
    setFieldErrors([]);
    const payload = {
      kode_anggota: draft.kode_anggota,
      nama_anggota: draft.nama_anggota,
      judul_buku: draft.judul_buku,
      isbn: draft.isbn.trim() || null,
      tanggal_pinjam: draft.tanggal_pinjam,
      tanggal_jatuh_tempo: draft.tanggal_jatuh_tempo,
      tanggal_kembali: draft.tanggal_kembali || null,
      catatan: draft.catatan.trim() || null,
    };
    const path = draft.mode === "edit" && draft.id ? `/loans/${draft.id}` : "/loans";
    const method = draft.mode === "edit" ? "PUT" : "POST";
    try {
      const { response, json } = await requestJson(path, method, payload);
      setRaw(JSON.stringify(json, null, 2));
      if (!response.ok || !json.success) {
        setFormError(json.message || "Gagal menyimpan.");
        setFieldErrors(json.errors ?? []);
        return;
      }
      setDraft(null);
      setBanner(null);
      setTick((value) => value + 1);
    } catch {
      setFormError("Tidak terhubung ke API.");
    } finally {
      setSaving(false);
    }
  }

  async function returnToday(loan: Loan) {
    setSaving(true);
    setBanner(null);
    try {
      const { response, json } = await requestJson(`/loans/${loan.id}`, "PUT", {
        tanggal_kembali: todayJakarta(),
      });
      setRaw(JSON.stringify(json, null, 2));
      if (!response.ok || !json.success) setBanner(json.message || "Gagal mencatat pengembalian.");
      else setTick((value) => value + 1);
    } catch {
      setBanner("Tidak terhubung ke API.");
    } finally {
      setSaving(false);
    }
  }

  async function removeLoan(id: string) {
    setSaving(true);
    setFormError(null);
    try {
      const { response, json } = await requestJson(`/loans/${id}`, "DELETE");
      setRaw(JSON.stringify(json, null, 2));
      if (!response.ok || !json.success) {
        setFormError(json.message || "Gagal menghapus.");
        return;
      }
      setDraft(null);
      setTick((value) => value + 1);
    } catch {
      setFormError("Tidak terhubung ke API.");
    } finally {
      setSaving(false);
    }
  }

  const errorFor = (field: string) => fieldErrors.find((item) => item.field === field)?.message;

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <div className="h-1.5 bg-stamp" />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
        <header className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex size-11 items-center justify-center border border-stamp bg-stamp text-paper">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-widest text-stamp uppercase">Perpustakaan</p>
              <h1 className="font-display text-4xl leading-none text-ink">Aksara</h1>
              <p className="mt-1 max-w-md text-sm text-muted">
                Meja sirkulasi. Catat pinjam, pengembalian, dan keterlambatan anggota.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-stamp px-4 text-sm font-semibold text-paper hover:bg-stamp-deep sm:w-auto"
            onClick={() => {
              setFieldErrors([]);
              setFormError(null);
              setDraft(emptyDraft());
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Catat pinjam
          </button>
        </header>

        <section className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          <Stat label="Catatan" value={counts.total} />
          <Stat label="Dipinjam" value={counts.Dipinjam} />
          <Stat label="Terlambat" value={counts.Terlambat} tone="stamp" />
          <Stat label="Kembali" value={counts.Dikembalikan} />
        </section>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto">
            {FILTERS.map((filter) => {
              const active = status === filter.id;
              return (
                <button
                  key={filter.label}
                  type="button"
                  aria-pressed={active}
                  className={
                    "min-h-11 shrink-0 border px-3 text-sm font-medium " +
                    (active
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-paper-raised text-ink")
                  }
                  onClick={() => setStatus(filter.id)}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
          <label className="flex min-h-11 items-center gap-2 border border-line bg-paper-raised px-3">
            <Search className="size-4 text-muted" aria-hidden="true" />
            <span className="sr-only">Cari anggota atau judul</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, kode anggota, atau judul"
              className="w-full bg-transparent py-2 text-sm text-ink outline-none placeholder:text-muted"
            />
          </label>
          <p className="font-mono text-xs text-muted">
            {requestLine}
            <span className="mx-2 text-line">/</span>
            penyimpanan {storage === "supabase" ? "Supabase" : "memori demo"}
          </p>
        </div>

        {banner ? (
          <p className="border border-stamp bg-stamp-soft px-3 py-2 text-sm text-stamp" role="alert">
            {banner}
          </p>
        ) : null}

        {loading && loans.length === 0 ? (
          <div className="flex flex-col gap-3" aria-hidden="true">
            <div className="h-24 animate-pulse border border-line bg-paper-raised" />
            <div className="h-24 animate-pulse border border-line bg-paper-raised" />
            <div className="h-24 animate-pulse border border-line bg-paper-raised" />
          </div>
        ) : loans.length === 0 ? (
          <div className="border border-dashed border-line bg-paper-raised px-4 py-10 text-center">
            <p className="font-display text-2xl">Rak ini kosong</p>
            <p className="mt-1 text-sm text-muted">Tidak ada bon yang cocok dengan filter.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {loans.map((loan) => (
              <li key={loan.id}>
                <article
                  className={
                    "border border-line bg-paper-raised p-4 " +
                    (loan.status === "Terlambat" ? "border-l-4 border-l-stamp" : "")
                  }
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusMark loan={loan} />
                        <span className="text-xs tracking-wide text-muted uppercase">
                          {loan.kode_anggota}
                        </span>
                      </div>
                      <h2 className="font-display text-2xl leading-tight">{loan.judul_buku}</h2>
                      <p className="mt-1 text-sm text-muted">
                        {loan.nama_anggota}
                        {loan.isbn ? <span className="text-line"> · </span> : null}
                        {loan.isbn ? <span className="tabular-nums">{loan.isbn}</span> : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {loan.status !== "Dikembalikan" ? (
                        <button
                          type="button"
                          className="min-h-11 border border-line bg-paper px-3 text-sm font-medium"
                          onClick={() => returnToday(loan)}
                          disabled={saving}
                        >
                          Kembalikan
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="min-h-11 border border-ink px-3 text-sm font-medium"
                        onClick={() => {
                          setFieldErrors([]);
                          setFormError(null);
                          setDraft(draftFromLoan(loan));
                        }}
                      >
                        Ubah
                      </button>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-sm">
                    <DateCell label="Pinjam" value={formatDate(loan.tanggal_pinjam)} />
                    <DateCell label="Jatuh tempo" value={formatDate(loan.tanggal_jatuh_tempo)} />
                    <DateCell label="Kembali" value={formatDate(loan.tanggal_kembali)} />
                  </dl>
                  {loan.catatan ? <p className="mt-3 text-sm text-muted">{loan.catatan}</p> : null}
                </article>
              </li>
            ))}
          </ul>
        )}

        <details className="border border-line bg-paper-raised">
          <summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-medium">
            Respons API terakhir
          </summary>
          <pre className="overflow-x-auto border-t border-line px-4 py-3 font-mono text-xs leading-relaxed text-ink">
            {raw || "Belum ada respons."}
          </pre>
        </details>
      </div>

      <Dialog.Root open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
          <Dialog.Content className="fixed top-8 right-4 bottom-8 left-4 z-50 mx-auto max-w-lg overflow-y-auto border border-line bg-paper-raised p-5">
            {draft ? (
              <form
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveDraft();
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Dialog.Title className="font-display text-3xl leading-none">
                      {draft.mode === "create" ? "Catat pinjam" : "Ubah bon"}
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm text-muted">
                      Status dihitung dari tanggal: masih di luar tempo jadi Dipinjam, lewat tempo jadi
                      Terlambat, ada tanggal kembali jadi Dikembalikan.
                    </Dialog.Description>
                  </div>
                  <Dialog.Close className="flex size-11 items-center justify-center border border-line" aria-label="Tutup">
                    <X className="size-4" />
                  </Dialog.Close>
                </div>

                {formError ? (
                  <p className="border border-stamp bg-stamp-soft px-3 py-2 text-sm text-stamp" role="alert">
                    {formError}
                  </p>
                ) : null}

                <Field label="Kode anggota" error={errorFor("kode_anggota")}>
                  <input
                    required
                    value={draft.kode_anggota}
                    onChange={(event) => patchDraft({ kode_anggota: event.target.value })}
                    className={inputClass}
                    placeholder="AGT-1042"
                  />
                </Field>
                <Field label="Nama anggota" error={errorFor("nama_anggota")}>
                  <input
                    required
                    value={draft.nama_anggota}
                    onChange={(event) => patchDraft({ nama_anggota: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Judul buku" error={errorFor("judul_buku")}>
                  <input
                    required
                    value={draft.judul_buku}
                    onChange={(event) => patchDraft({ judul_buku: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="ISBN" error={errorFor("isbn")}>
                  <input
                    value={draft.isbn}
                    onChange={(event) => patchDraft({ isbn: event.target.value })}
                    className={inputClass}
                    inputMode="numeric"
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Tanggal pinjam" error={errorFor("tanggal_pinjam")}>
                    <input
                      required
                      type="date"
                      value={draft.tanggal_pinjam}
                      onChange={(event) => patchDraft({ tanggal_pinjam: event.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Jatuh tempo" error={errorFor("tanggal_jatuh_tempo")}>
                    <input
                      required
                      type="date"
                      value={draft.tanggal_jatuh_tempo}
                      onChange={(event) => patchDraft({ tanggal_jatuh_tempo: event.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Field label="Tanggal kembali" error={errorFor("tanggal_kembali")}>
                  <input
                    type="date"
                    value={draft.tanggal_kembali}
                    onChange={(event) => patchDraft({ tanggal_kembali: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Catatan" error={errorFor("catatan")}>
                  <textarea
                    value={draft.catatan}
                    onChange={(event) => patchDraft({ catatan: event.target.value })}
                    rows={3}
                    className={inputClass}
                  />
                </Field>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {draft.mode === "edit" && draft.id ? (
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center justify-center gap-2 px-3 text-sm font-medium text-stamp"
                      onClick={() => draft.id && void removeLoan(draft.id)}
                      disabled={saving}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Hapus
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-11 items-center justify-center bg-stamp px-4 text-sm font-semibold text-paper hover:bg-stamp-deep disabled:opacity-60"
                  >
                    {saving ? "Menyimpan…" : "Simpan"}
                  </button>
                </div>
              </form>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

const inputClass =
  "min-h-11 w-full border border-line bg-paper px-3 text-sm text-ink outline-none";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-stamp">{error}</span> : null}
    </label>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "stamp" }) {
  return (
    <div className="bg-paper-raised px-3 py-3">
      <p className="text-xs tracking-widest text-muted uppercase">{label}</p>
      <p className={"font-display text-3xl tabular-nums " + (tone === "stamp" ? "text-stamp" : "text-ink")}>
        {value}
      </p>
    </div>
  );
}

function DateCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted uppercase">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function StatusMark({ loan }: { loan: Loan }) {
  if (loan.status === "Terlambat") {
    return (
      <span className="-rotate-2 border border-stamp px-2 py-1 text-xs font-semibold tracking-widest text-stamp uppercase">
        Terlambat {loan.hari_terlambat} hari
      </span>
    );
  }
  if (loan.status === "Dikembalikan") {
    return (
      <span className="text-xs font-semibold tracking-widest text-muted uppercase">Dikembalikan</span>
    );
  }
  return <span className="text-xs font-semibold tracking-widest text-ink uppercase">Dipinjam</span>;
}
