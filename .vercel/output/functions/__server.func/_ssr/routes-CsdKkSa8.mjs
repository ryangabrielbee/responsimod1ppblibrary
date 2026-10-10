import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as Plus, i as Search, o as BookOpen, r as Trash2, t as X } from "../_libs/lucide-react.mjs";
import { n as previewPathPrefix } from "./router-pdn6PAN-.mjs";
import { a as DialogOverlay, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CsdKkSa8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FILTERS = [
	{
		id: "",
		label: "Semua"
	},
	{
		id: "Dipinjam",
		label: "Dipinjam"
	},
	{
		id: "Terlambat",
		label: "Terlambat"
	},
	{
		id: "Dikembalikan",
		label: "Kembali"
	}
];
function apiPath(path) {
	if (typeof window === "undefined") return path;
	return `${previewPathPrefix(window.location.hostname, window.location.pathname) ?? ""}${path}`;
}
function todayJakarta() {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Jakarta",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(/* @__PURE__ */ new Date());
}
function plusDays(iso, days) {
	const [year, month, day] = iso.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
function formatDate(iso) {
	if (!iso) return "—";
	const [year, month, day] = iso.split("-").map(Number);
	return new Intl.DateTimeFormat("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC"
	}).format(new Date(Date.UTC(year, month - 1, day)));
}
async function requestJson(path, method, body) {
	const response = await fetch(apiPath(path), {
		method,
		headers: {
			accept: "application/json",
			...body !== void 0 ? { "content-type": "application/json" } : {}
		},
		body: body !== void 0 ? JSON.stringify(body) : void 0
	});
	const text = await response.text();
	let json = {
		success: false,
		message: "Respons tidak valid."
	};
	try {
		json = JSON.parse(text);
	} catch {}
	return {
		response,
		json,
		text
	};
}
function emptyDraft() {
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
		catatan: ""
	};
}
function draftFromLoan(loan) {
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
		catatan: loan.catatan ?? ""
	};
}
function CirculationDesk() {
	const [status, setStatus] = (0, import_react.useState)("");
	const [query, setQuery] = (0, import_react.useState)("");
	const [debouncedQuery, setDebouncedQuery] = (0, import_react.useState)("");
	const [loans, setLoans] = (0, import_react.useState)([]);
	const [counts, setCounts] = (0, import_react.useState)({
		total: 0,
		Dipinjam: 0,
		Terlambat: 0,
		Dikembalikan: 0
	});
	const [storage, setStorage] = (0, import_react.useState)("memory");
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [banner, setBanner] = (0, import_react.useState)(null);
	const [raw, setRaw] = (0, import_react.useState)("");
	const [draft, setDraft] = (0, import_react.useState)(null);
	const [fieldErrors, setFieldErrors] = (0, import_react.useState)([]);
	const [formError, setFormError] = (0, import_react.useState)(null);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [tick, setTick] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const timer = window.setTimeout(() => setDebouncedQuery(query), 250);
		return () => window.clearTimeout(timer);
	}, [query]);
	(0, import_react.useEffect)(() => {
		const controller = new AbortController();
		const params = new URLSearchParams();
		if (status) params.set("status", status);
		if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
		const qs = params.toString();
		const path = `/loans${qs ? `?${qs}` : ""}`;
		setLoading(true);
		fetch(apiPath(path), {
			signal: controller.signal,
			headers: { accept: "application/json" }
		}).then(async (response) => {
			const text = await response.text();
			const json = JSON.parse(text);
			if (!response.ok || !json.success || !Array.isArray(json.data)) throw new Error(json.message || "Gagal memuat peminjaman.");
			setLoans(json.data);
			setStorage(json.meta?.storage ?? "memory");
			setRaw(JSON.stringify(json, null, 2));
			setBanner(null);
		}).catch((error) => {
			if (error instanceof DOMException && error.name === "AbortError") return;
			setBanner(error instanceof Error ? error.message : "Gagal memuat peminjaman.");
		}).finally(() => {
			if (!controller.signal.aborted) setLoading(false);
		});
		return () => controller.abort();
	}, [
		status,
		debouncedQuery,
		tick
	]);
	(0, import_react.useEffect)(() => {
		let ignore = false;
		requestJson("/loans", "GET").then(({ json }) => {
			if (ignore || !Array.isArray(json.data)) return;
			const rows = json.data;
			setCounts({
				total: rows.length,
				Dipinjam: rows.filter((row) => row.status === "Dipinjam").length,
				Terlambat: rows.filter((row) => row.status === "Terlambat").length,
				Dikembalikan: rows.filter((row) => row.status === "Dikembalikan").length
			});
		});
		return () => {
			ignore = true;
		};
	}, [tick]);
	const requestLine = (0, import_react.useMemo)(() => {
		const params = new URLSearchParams();
		if (status) params.set("status", status);
		if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
		const qs = params.toString();
		return `GET /loans${qs ? `?${qs}` : ""}`;
	}, [status, debouncedQuery]);
	function patchDraft(partial) {
		setDraft((current) => current ? {
			...current,
			...partial
		} : current);
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
			catatan: draft.catatan.trim() || null
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
	async function returnToday(loan) {
		setSaving(true);
		setBanner(null);
		try {
			const { response, json } = await requestJson(`/loans/${loan.id}`, "PUT", { tanggal_kembali: todayJakarta() });
			setRaw(JSON.stringify(json, null, 2));
			if (!response.ok || !json.success) setBanner(json.message || "Gagal mencatat pengembalian.");
			else setTick((value) => value + 1);
		} catch {
			setBanner("Tidak terhubung ke API.");
		} finally {
			setSaving(false);
		}
	}
	async function removeLoan(id) {
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
	const errorFor = (field) => fieldErrors.find((item) => item.field === field)?.message;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-paper text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1.5 bg-stamp" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 flex size-11 items-center justify-center border border-stamp bg-stamp text-paper",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
									className: "size-5",
									"aria-hidden": "true"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-semibold tracking-widest text-stamp uppercase",
									children: "Perpustakaan"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "font-display text-4xl leading-none text-ink",
									children: "Aksara"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 max-w-md text-sm text-muted",
									children: "Meja sirkulasi. Catat pinjam, pengembalian, dan keterlambatan anggota."
								})
							] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "inline-flex min-h-11 w-full items-center justify-center gap-2 bg-stamp px-4 text-sm font-semibold text-paper hover:bg-stamp-deep sm:w-auto",
							onClick: () => {
								setFieldErrors([]);
								setFormError(null);
								setDraft(emptyDraft());
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
								className: "size-4",
								"aria-hidden": "true"
							}), "Catat pinjam"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Catatan",
								value: counts.total
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Dipinjam",
								value: counts.Dipinjam
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Terlambat",
								value: counts.Terlambat,
								tone: "stamp"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Kembali",
								value: counts.Dikembalikan
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-2 overflow-x-auto",
								children: FILTERS.map((filter) => {
									const active = status === filter.id;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-pressed": active,
										className: "min-h-11 shrink-0 border px-3 text-sm font-medium " + (active ? "border-ink bg-ink text-paper" : "border-line bg-paper-raised text-ink"),
										onClick: () => setStatus(filter.id),
										children: filter.label
									}, filter.label);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex min-h-11 items-center gap-2 border border-line bg-paper-raised px-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
										className: "size-4 text-muted",
										"aria-hidden": "true"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "sr-only",
										children: "Cari anggota atau judul"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: query,
										onChange: (event) => setQuery(event.target.value),
										placeholder: "Cari nama, kode anggota, atau judul",
										className: "w-full bg-transparent py-2 text-sm text-ink outline-none placeholder:text-muted"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-mono text-xs text-muted",
								children: [
									requestLine,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mx-2 text-line",
										children: "/"
									}),
									"penyimpanan ",
									storage === "supabase" ? "Supabase" : "memori demo"
								]
							})
						]
					}),
					banner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "border border-stamp bg-stamp-soft px-3 py-2 text-sm text-stamp",
						role: "alert",
						children: banner
					}) : null,
					loading && loans.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3",
						"aria-hidden": "true",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-24 animate-pulse border border-line bg-paper-raised" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-24 animate-pulse border border-line bg-paper-raised" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-24 animate-pulse border border-line bg-paper-raised" })
						]
					}) : loans.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border border-dashed border-line bg-paper-raised px-4 py-10 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl",
							children: "Rak ini kosong"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "Tidak ada bon yang cocok dengan filter."
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-col gap-3",
						children: loans.map((loan) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "border border-line bg-paper-raised p-4 " + (loan.status === "Terlambat" ? "border-l-4 border-l-stamp" : ""),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mb-2 flex flex-wrap items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusMark, { loan }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs tracking-wide text-muted uppercase",
													children: loan.kode_anggota
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "font-display text-2xl leading-tight",
												children: loan.judul_buku
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-1 text-sm text-muted",
												children: [
													loan.nama_anggota,
													loan.isbn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-line",
														children: " · "
													}) : null,
													loan.isbn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "tabular-nums",
														children: loan.isbn
													}) : null
												]
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex shrink-0 gap-2",
										children: [loan.status !== "Dikembalikan" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "min-h-11 border border-line bg-paper px-3 text-sm font-medium",
											onClick: () => returnToday(loan),
											disabled: saving,
											children: "Kembalikan"
										}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "min-h-11 border border-ink px-3 text-sm font-medium",
											onClick: () => {
												setFieldErrors([]);
												setFormError(null);
												setDraft(draftFromLoan(loan));
											},
											children: "Ubah"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
									className: "mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateCell, {
											label: "Pinjam",
											value: formatDate(loan.tanggal_pinjam)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateCell, {
											label: "Jatuh tempo",
											value: formatDate(loan.tanggal_jatuh_tempo)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateCell, {
											label: "Kembali",
											value: formatDate(loan.tanggal_kembali)
										})
									]
								}),
								loan.catatan ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm text-muted",
									children: loan.catatan
								}) : null
							]
						}) }, loan.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
						className: "border border-line bg-paper-raised",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
							className: "min-h-11 cursor-pointer px-4 py-3 text-sm font-medium",
							children: "Respons API terakhir"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
							className: "overflow-x-auto border-t border-line px-4 py-3 font-mono text-xs leading-relaxed text-ink",
							children: raw || "Belum ada respons."
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: draft !== null,
				onOpenChange: (open) => !open && setDraft(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-40 bg-ink/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "fixed top-8 right-4 bottom-8 left-4 z-50 mx-auto max-w-lg overflow-y-auto border border-line bg-paper-raised p-5",
					children: draft ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "flex flex-col gap-4",
						onSubmit: (event) => {
							event.preventDefault();
							saveDraft();
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
									className: "font-display text-3xl leading-none",
									children: draft.mode === "create" ? "Catat pinjam" : "Ubah bon"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
									className: "mt-2 text-sm text-muted",
									children: "Status dihitung dari tanggal: masih di luar tempo jadi Dipinjam, lewat tempo jadi Terlambat, ada tanggal kembali jadi Dikembalikan."
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
									className: "flex size-11 items-center justify-center border border-line",
									"aria-label": "Tutup",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
								})]
							}),
							formError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "border border-stamp bg-stamp-soft px-3 py-2 text-sm text-stamp",
								role: "alert",
								children: formError
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Kode anggota",
								error: errorFor("kode_anggota"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									required: true,
									value: draft.kode_anggota,
									onChange: (event) => patchDraft({ kode_anggota: event.target.value }),
									className: inputClass,
									placeholder: "AGT-1042"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Nama anggota",
								error: errorFor("nama_anggota"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									required: true,
									value: draft.nama_anggota,
									onChange: (event) => patchDraft({ nama_anggota: event.target.value }),
									className: inputClass
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Judul buku",
								error: errorFor("judul_buku"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									required: true,
									value: draft.judul_buku,
									onChange: (event) => patchDraft({ judul_buku: event.target.value }),
									className: inputClass
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "ISBN",
								error: errorFor("isbn"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: draft.isbn,
									onChange: (event) => patchDraft({ isbn: event.target.value }),
									className: inputClass,
									inputMode: "numeric"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Tanggal pinjam",
									error: errorFor("tanggal_pinjam"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										required: true,
										type: "date",
										value: draft.tanggal_pinjam,
										onChange: (event) => patchDraft({ tanggal_pinjam: event.target.value }),
										className: inputClass
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Jatuh tempo",
									error: errorFor("tanggal_jatuh_tempo"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										required: true,
										type: "date",
										value: draft.tanggal_jatuh_tempo,
										onChange: (event) => patchDraft({ tanggal_jatuh_tempo: event.target.value }),
										className: inputClass
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Tanggal kembali",
								error: errorFor("tanggal_kembali"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "date",
									value: draft.tanggal_kembali,
									onChange: (event) => patchDraft({ tanggal_kembali: event.target.value }),
									className: inputClass
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Catatan",
								error: errorFor("catatan"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: draft.catatan,
									onChange: (event) => patchDraft({ catatan: event.target.value }),
									rows: 3,
									className: inputClass
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
								children: [draft.mode === "edit" && draft.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "inline-flex min-h-11 items-center justify-center gap-2 px-3 text-sm font-medium text-stamp",
									onClick: () => draft.id && void removeLoan(draft.id),
									disabled: saving,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Hapus"]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									disabled: saving,
									className: "inline-flex min-h-11 items-center justify-center bg-stamp px-4 text-sm font-semibold text-paper hover:bg-stamp-deep disabled:opacity-60",
									children: saving ? "Menyimpan…" : "Simpan"
								})]
							})
						]
					}) : null
				})] })
			})
		]
	});
}
var inputClass = "min-h-11 w-full border border-line bg-paper px-3 text-sm text-ink outline-none";
function Field({ label, error, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex flex-col gap-1 text-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-medium",
				children: label
			}),
			children,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-stamp",
				children: error
			}) : null
		]
	});
}
function Stat({ label, value, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-paper-raised px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs tracking-widest text-muted uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-3xl tabular-nums " + (tone === "stamp" ? "text-stamp" : "text-ink"),
			children: value
		})]
	});
}
function DateCell({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-xs tracking-wide text-muted uppercase",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "tabular-nums",
		children: value
	})] });
}
function StatusMark({ loan }) {
	if (loan.status === "Terlambat") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "-rotate-2 border border-stamp px-2 py-1 text-xs font-semibold tracking-widest text-stamp uppercase",
		children: [
			"Terlambat ",
			loan.hari_terlambat,
			" hari"
		]
	});
	if (loan.status === "Dikembalikan") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "text-xs font-semibold tracking-widest text-muted uppercase",
		children: "Dikembalikan"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "text-xs font-semibold tracking-widest text-ink uppercase",
		children: "Dipinjam"
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirculationDesk, {});
}
//#endregion
export { Home as component };
