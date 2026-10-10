import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as createFileRoute, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, v as createRootRoute, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { n as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-pdn6PAN-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* Path-based preview hosts serve the dev server under `/{port_id}/` and strip
* that prefix before forwarding, so SSR sees `/` while the browser URL keeps the
* prefix. TanStack Start resets `basepath` on hydration, so a `rewrite` keeps
* client routing and generated links aligned with the public URL.
*/
var PATH_BASED_PREVIEW_HOSTS = /* @__PURE__ */ new Set([
	"preview.grok.genai.mil",
	"preview.grok.mil",
	"preview.grokgsac.com"
]);
var PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;
function previewPathPrefix(hostname, pathname) {
	if (!PATH_BASED_PREVIEW_HOSTS.has(hostname.toLowerCase())) return void 0;
	return PORT_ID_PREFIX.exec(pathname)?.[0];
}
function prefixRewrite(prefix) {
	return {
		input: ({ url }) => {
			if (url.pathname === prefix) url.pathname = "/";
			else if (url.pathname.startsWith(`${prefix}/`)) url.pathname = url.pathname.slice(prefix.length);
			return url;
		},
		output: ({ url }) => {
			url.pathname = `${prefix}${url.pathname}`;
			return url;
		}
	};
}
function previewPathRewrite() {
	if (typeof window === "undefined") return void 0;
	const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
	return prefix ? prefixRewrite(prefix) : void 0;
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-Dpo-KW1w.css";
var APP_NAME = "Aksara";
var Route$4 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Meja sirkulasi pencatatan peminjaman buku perpustakaan."
			},
			{
				name: "theme-color",
				content: "#8E2F2A"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560;9..144,650&family=Outfit:wght@400;500;600&display=swap"
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "id",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter = () => import("./routes-CsdKkSa8.mjs");
var Route$3 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
/** Data contoh. Tanggal relatif terhadap "hari ini" agar status tetap masuk akal. */
var SEED_IDS = {
	siti: "11111111-1111-4111-8111-111111111111",
	ahmad: "22222222-2222-4222-8222-222222222222",
	dewi: "33333333-3333-4333-8333-333333333333",
	budi: "44444444-4444-4444-8444-444444444444",
	maya: "55555555-5555-4555-8555-555555555555",
	raka: "66666666-6666-4666-8666-666666666666",
	nadia: "77777777-7777-4777-8777-777777777777",
	farhan: "88888888-8888-4888-8888-888888888888"
};
function addDays(iso, days) {
	const [year, month, day] = iso.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
function row(partial, today) {
	return {
		isbn: null,
		tanggal_kembali: null,
		catatan: null,
		created_at: `${partial.tanggal_pinjam}T02:00:00.000Z`,
		updated_at: `${today}T02:00:00.000Z`,
		...partial
	};
}
function createSeedLoans(today) {
	return [
		row({
			id: SEED_IDS.siti,
			kode_anggota: "AGT-1042",
			nama_anggota: "Siti Rahmawati",
			judul_buku: "Bumi",
			isbn: "9786020301129",
			tanggal_pinjam: addDays(today, -40),
			tanggal_jatuh_tempo: addDays(today, -26),
			status: "Terlambat",
			catatan: "Perpanjangan ditolak — antrean reservasi."
		}, today),
		row({
			id: SEED_IDS.ahmad,
			kode_anggota: "AGT-1108",
			nama_anggota: "Ahmad Fauzi",
			judul_buku: "Laskar Pelangi",
			isbn: "9789793062792",
			tanggal_pinjam: addDays(today, -5),
			tanggal_jatuh_tempo: addDays(today, 9),
			status: "Dipinjam"
		}, today),
		row({
			id: SEED_IDS.dewi,
			kode_anggota: "AGT-0981",
			nama_anggota: "Dewi Lestari",
			judul_buku: "Filosofi Teras",
			isbn: "9786024125189",
			tanggal_pinjam: addDays(today, -21),
			tanggal_jatuh_tempo: addDays(today, -7),
			tanggal_kembali: addDays(today, -8),
			status: "Dikembalikan"
		}, today),
		row({
			id: SEED_IDS.budi,
			kode_anggota: "AGT-1215",
			nama_anggota: "Budi Santoso",
			judul_buku: "Atomic Habits",
			isbn: "9786020633176",
			tanggal_pinjam: addDays(today, -30),
			tanggal_jatuh_tempo: addDays(today, -16),
			status: "Terlambat",
			catatan: "Sudah diingatkan lewat surel."
		}, today),
		row({
			id: SEED_IDS.maya,
			kode_anggota: "AGT-1330",
			nama_anggota: "Maya Anggraini",
			judul_buku: "Laut Bercerita",
			isbn: "9786024246945",
			tanggal_pinjam: addDays(today, -2),
			tanggal_jatuh_tempo: addDays(today, 12),
			status: "Dipinjam"
		}, today),
		row({
			id: SEED_IDS.raka,
			kode_anggota: "AGT-0874",
			nama_anggota: "Raka Wijaya",
			judul_buku: "Negeri 5 Menara",
			isbn: "9789792248616",
			tanggal_pinjam: addDays(today, -50),
			tanggal_jatuh_tempo: addDays(today, -36),
			tanggal_kembali: addDays(today, -34),
			status: "Dikembalikan"
		}, today),
		row({
			id: SEED_IDS.nadia,
			kode_anggota: "AGT-1411",
			nama_anggota: "Nadia Kusuma",
			judul_buku: "Cantik Itu Luka",
			isbn: "9786020301112",
			tanggal_pinjam: addDays(today, -18),
			tanggal_jatuh_tempo: addDays(today, -4),
			status: "Terlambat"
		}, today),
		row({
			id: SEED_IDS.farhan,
			kode_anggota: "AGT-1560",
			nama_anggota: "Farhan Malik",
			judul_buku: "Sapiens",
			isbn: "9786024246946",
			tanggal_pinjam: addDays(today, -1),
			tanggal_jatuh_tempo: addDays(today, 13),
			status: "Dipinjam"
		}, today)
	];
}
var STATUSES = [
	"Dipinjam",
	"Dikembalikan",
	"Terlambat"
];
var STORE_KEY = "__aksaraLoanRows";
var TEXT_LIMITS = {
	kode_anggota: 32,
	nama_anggota: 120,
	judul_buku: 200,
	isbn: 20,
	catatan: 500
};
var LoanError = class extends Error {
	constructor(status, message, errors) {
		super(message);
		this.name = "LoanError";
		this.statusCode = status;
		this.errors = errors;
	}
};
function todayISO() {
	if (process.env.LOAN_TODAY && /^\d{4}-\d{2}-\d{2}$/.test(process.env.LOAN_TODAY)) return process.env.LOAN_TODAY;
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Jakarta",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(/* @__PURE__ */ new Date());
}
function storageMode() {
	return supabaseClient() ? "supabase" : "memory";
}
var cachedClient;
function supabaseClient() {
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
	if (!url || !key) return null;
	if (!cachedClient) cachedClient = createClient(url, key, { auth: {
		persistSession: false,
		autoRefreshToken: false
	} });
	return cachedClient;
}
function memoryRows() {
	if (!Array.isArray(globalThis[STORE_KEY])) globalThis[STORE_KEY] = createSeedLoans(todayISO());
	return globalThis[STORE_KEY];
}
function isISODate(value) {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
function daysBetween(from, to) {
	const start = Date.parse(`${from}T00:00:00Z`);
	const end = Date.parse(`${to}T00:00:00Z`);
	return Math.round((end - start) / 864e5);
}
function deriveStatus(loan, today = todayISO()) {
	if (loan.tanggal_kembali) return "Dikembalikan";
	if (loan.tanggal_jatuh_tempo < today) return "Terlambat";
	return "Dipinjam";
}
function present(row, today = todayISO()) {
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
		updated_at: row.updated_at
	};
}
function assertUuid(id) {
	if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new LoanError(400, "Id peminjaman tidak valid.");
}
function cleanText(value, field, { required }) {
	if (value === void 0 || value === null || value === "") {
		if (required) throw new LoanError(400, "Data belum lengkap.", [{
			field,
			message: `${label(field)} wajib diisi.`
		}]);
		return null;
	}
	if (typeof value !== "string") throw new LoanError(400, "Tipe data tidak sesuai.", [{
		field,
		message: `${label(field)} harus berupa teks.`
	}]);
	const trimmed = value.trim();
	if (!trimmed) {
		if (required) throw new LoanError(400, "Data belum lengkap.", [{
			field,
			message: `${label(field)} wajib diisi.`
		}]);
		return null;
	}
	const limit = TEXT_LIMITS[field];
	if (trimmed.length > limit) throw new LoanError(400, "Data terlalu panjang.", [{
		field,
		message: `${label(field)} maksimal ${limit} karakter.`
	}]);
	return trimmed;
}
function label(field) {
	return {
		kode_anggota: "Kode anggota",
		nama_anggota: "Nama anggota",
		judul_buku: "Judul buku",
		isbn: "ISBN",
		catatan: "Catatan",
		tanggal_pinjam: "Tanggal pinjam",
		tanggal_jatuh_tempo: "Tanggal jatuh tempo",
		tanggal_kembali: "Tanggal kembali",
		status: "Status"
	}[field] || field;
}
function cleanDate(value, field, { required }) {
	if (value === void 0 || value === null || value === "") {
		if (required) throw new LoanError(400, "Data belum lengkap.", [{
			field,
			message: `${label(field)} wajib diisi.`
		}]);
		return null;
	}
	if (!isISODate(value)) throw new LoanError(400, "Format tanggal tidak valid.", [{
		field,
		message: `${label(field)} harus YYYY-MM-DD.`
	}]);
	return value;
}
var WRITABLE = [
	"kode_anggota",
	"nama_anggota",
	"judul_buku",
	"isbn",
	"tanggal_pinjam",
	"tanggal_jatuh_tempo",
	"tanggal_kembali",
	"catatan",
	"status"
];
function parseLoanBody(body, { partial }) {
	if (body === void 0 || body === null) {
		if (partial) return {};
		throw new LoanError(400, "Body JSON wajib diisi.");
	}
	if (typeof body !== "object" || Array.isArray(body)) throw new LoanError(400, "Body harus berupa objek JSON.");
	const unknown = Object.keys(body).filter((key) => !WRITABLE.includes(key));
	if (unknown.length) throw new LoanError(400, "Ada field yang tidak dikenal.", [{
		field: unknown[0],
		message: `Field "${unknown[0]}" tidak didukung.`
	}]);
	if (partial && Object.keys(body).length === 0) throw new LoanError(400, "Tidak ada data yang diubah.");
	const patch = {};
	if (!partial || "kode_anggota" in body) patch.kode_anggota = cleanText(body.kode_anggota, "kode_anggota", { required: true });
	if (!partial || "nama_anggota" in body) patch.nama_anggota = cleanText(body.nama_anggota, "nama_anggota", { required: true });
	if (!partial || "judul_buku" in body) patch.judul_buku = cleanText(body.judul_buku, "judul_buku", { required: true });
	if ("isbn" in body || !partial) {
		if ("isbn" in body || body.isbn) patch.isbn = cleanText(body.isbn, "isbn", { required: false });
	}
	if (!partial || "tanggal_pinjam" in body) patch.tanggal_pinjam = cleanDate(body.tanggal_pinjam, "tanggal_pinjam", { required: true });
	if (!partial || "tanggal_jatuh_tempo" in body) patch.tanggal_jatuh_tempo = cleanDate(body.tanggal_jatuh_tempo, "tanggal_jatuh_tempo", { required: true });
	if ("tanggal_kembali" in body) patch.tanggal_kembali = cleanDate(body.tanggal_kembali, "tanggal_kembali", { required: false });
	if ("catatan" in body) patch.catatan = cleanText(body.catatan, "catatan", { required: false });
	if ("status" in body && body.status !== void 0 && body.status !== null && body.status !== "") {
		if (typeof body.status !== "string" || !STATUSES.includes(body.status)) throw new LoanError(400, "Status tidak dikenal.", [{
			field: "status",
			message: `Status harus salah satu dari: ${STATUSES.join(", ")}.`
		}]);
		patch.status = body.status;
	}
	return patch;
}
function assertDateOrder(loan) {
	if (loan.tanggal_jatuh_tempo < loan.tanggal_pinjam) throw new LoanError(400, "Tanggal tidak urut.", [{
		field: "tanggal_jatuh_tempo",
		message: "Tanggal jatuh tempo tidak boleh sebelum tanggal pinjam."
	}]);
	if (loan.tanggal_kembali && loan.tanggal_kembali < loan.tanggal_pinjam) throw new LoanError(400, "Tanggal tidak urut.", [{
		field: "tanggal_kembali",
		message: "Tanggal kembali tidak boleh sebelum tanggal pinjam."
	}]);
}
function assertStatusAgrees(loan) {
	if (!loan.status) return;
	const derived = deriveStatus(loan);
	if (loan.status !== derived) throw new LoanError(400, "Status tidak sesuai dengan tanggal.", [{
		field: "status",
		message: `Berdasarkan tanggal, status yang benar adalah "${derived}". Kosongkan field status agar dihitung otomatis, atau sesuaikan tanggal kembali / jatuh tempo.`
	}]);
}
function applyStatus(loan) {
	return {
		...loan,
		status: deriveStatus(loan)
	};
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
	if (/relation .*loans.* does not exist|could not find the table/i.test(message)) return new LoanError(500, "Tabel loans belum ada di Supabase. Jalankan file supabase/schema.sql di SQL Editor.");
	return new LoanError(500, "Gagal mengakses Supabase.", [{
		field: "supabase",
		message
	}]);
}
async function listLoans({ status, q } = {}) {
	let normalized = null;
	if (status) {
		normalized = STATUSES.find((item) => item.toLowerCase() === String(status).trim().toLowerCase());
		if (!normalized) throw new LoanError(400, "Filter status tidak dikenal.", [{
			field: "status",
			message: `Gunakan salah satu: ${STATUSES.join(", ")}.`
		}]);
	}
	const needle = typeof q === "string" ? q.trim().toLowerCase() : "";
	let rows = (await fetchAll()).map((row) => present(row));
	if (normalized) rows = rows.filter((row) => row.status === normalized);
	if (needle) rows = rows.filter((row) => [
		row.nama_anggota,
		row.judul_buku,
		row.kode_anggota,
		row.isbn
	].filter(Boolean).some((value) => String(value).toLowerCase().includes(needle)));
	const rank = {
		Terlambat: 0,
		Dipinjam: 1,
		Dikembalikan: 2
	};
	rows.sort((a, b) => rank[a.status] - rank[b.status] || a.tanggal_jatuh_tempo.localeCompare(b.tanggal_jatuh_tempo) || a.nama_anggota.localeCompare(b.nama_anggota, "id"));
	return {
		rows,
		status: normalized,
		q: needle || null
	};
}
async function getLoan(id) {
	assertUuid(id);
	const row = await fetchOne(id);
	if (!row) throw new LoanError(404, "Peminjaman tidak ditemukan.");
	return present(row);
}
async function createLoan(body) {
	const patch = parseLoanBody(body, { partial: false });
	const now = (/* @__PURE__ */ new Date()).toISOString();
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
		updated_at: now
	});
	assertDateOrder(loan);
	assertStatusAgrees({
		...loan,
		status: patch.status
	});
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
async function updateLoan(id, body) {
	assertUuid(id);
	const current = await fetchOne(id);
	if (!current) throw new LoanError(404, "Peminjaman tidak ditemukan.");
	const patch = parseLoanBody(body, { partial: true });
	const merged = applyStatus({
		...current,
		...patch,
		isbn: "isbn" in patch ? patch.isbn : current.isbn,
		catatan: "catatan" in patch ? patch.catatan : current.catatan,
		tanggal_kembali: "tanggal_kembali" in patch ? patch.tanggal_kembali : current.tanggal_kembali,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	});
	assertDateOrder(merged);
	if (patch.status) assertStatusAgrees({
		...merged,
		status: patch.status
	});
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
async function deleteLoan(id) {
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
function serviceInfo() {
	return {
		success: true,
		message: "Aksara API pencatatan peminjaman buku.",
		data: {
			name: "Aksara API Peminjaman Buku",
			version: "1.0.0",
			storage: storageMode(),
			timezone: "Asia/Jakarta",
			statuses: STATUSES,
			endpoints: [
				{
					method: "GET",
					path: "/"
				},
				{
					method: "GET",
					path: "/health"
				},
				{
					method: "GET",
					path: "/loans"
				},
				{
					method: "GET",
					path: "/loans?status=Terlambat"
				},
				{
					method: "GET",
					path: "/loans/:id"
				},
				{
					method: "POST",
					path: "/loans"
				},
				{
					method: "PUT",
					path: "/loans/:id"
				},
				{
					method: "PATCH",
					path: "/loans/:id"
				},
				{
					method: "DELETE",
					path: "/loans/:id"
				}
			]
		}
	};
}
function normalizePath(pathname) {
	const raw = String(pathname || "/").split("?")[0];
	let path = raw.startsWith("/") ? raw : `/${raw}`;
	if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
	return path;
}
function fail(error) {
	if (error instanceof LoanError) return {
		status: error.statusCode,
		body: {
			success: false,
			message: error.message,
			...error.errors ? { errors: error.errors } : {}
		}
	};
	console.error(error);
	return {
		status: 500,
		body: {
			success: false,
			message: "Terjadi kesalahan pada server."
		}
	};
}
/**
* @param {{ method?: string, pathname?: string, searchParams?: URLSearchParams, body?: unknown }} request
*/
async function dispatch(request) {
	const method = String(request.method || "GET").toUpperCase();
	const path = normalizePath(request.pathname);
	const searchParams = request.searchParams || new URLSearchParams();
	try {
		if ((path === "/" || path === "/health") && method === "GET") return {
			status: 200,
			body: serviceInfo()
		};
		if (path === "/loans") {
			if (method === "GET") {
				const { rows, status, q } = await listLoans({
					status: searchParams.get("status") || void 0,
					q: searchParams.get("q") || void 0
				});
				return {
					status: 200,
					body: {
						success: true,
						message: "Daftar peminjaman berhasil diambil.",
						data: rows,
						meta: {
							total: rows.length,
							filter: {
								status,
								q
							},
							storage: storageMode()
						}
					}
				};
			}
			if (method === "POST") return {
				status: 201,
				body: {
					success: true,
					message: "Peminjaman berhasil dicatat.",
					data: await createLoan(request.body),
					meta: { storage: storageMode() }
				}
			};
			return {
				status: 405,
				body: {
					success: false,
					message: "Method tidak diizinkan."
				}
			};
		}
		const detail = path.match(/^\/loans\/([^/]+)$/);
		if (detail) {
			const id = decodeURIComponent(detail[1]);
			if (method === "GET") return {
				status: 200,
				body: {
					success: true,
					message: "Detail peminjaman berhasil diambil.",
					data: await getLoan(id),
					meta: { storage: storageMode() }
				}
			};
			if (method === "PUT" || method === "PATCH") return {
				status: 200,
				body: {
					success: true,
					message: "Peminjaman berhasil diperbarui.",
					data: await updateLoan(id, request.body),
					meta: { storage: storageMode() }
				}
			};
			if (method === "DELETE") return {
				status: 200,
				body: {
					success: true,
					message: "Peminjaman berhasil dihapus.",
					data: await deleteLoan(id),
					meta: { storage: storageMode() }
				}
			};
			return {
				status: 405,
				body: {
					success: false,
					message: "Method tidak diizinkan."
				}
			};
		}
		return {
			status: 404,
			body: {
				success: false,
				message: "Endpoint tidak ditemukan."
			}
		};
	} catch (error) {
		return fail(error);
	}
}
var CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function json(body, status) {
	return Response.json(body, {
		status,
		headers: CORS
	});
}
async function handleLoanHttp(request) {
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: CORS
	});
	const url = new URL(request.url);
	let body;
	if (![
		"GET",
		"HEAD",
		"DELETE"
	].includes(request.method)) {
		const text = await request.text();
		if (text.trim()) try {
			body = JSON.parse(text);
		} catch {
			return json({
				success: false,
				message: "Body JSON tidak valid."
			}, 400);
		}
	}
	const result = await dispatch({
		method: request.method,
		pathname: url.pathname,
		searchParams: url.searchParams,
		body
	});
	return json(result.body, result.status);
}
var Route$2 = createFileRoute("/health")({ server: { handlers: { GET: ({ request }) => handleLoanHttp(request) } } });
var Route$1 = createFileRoute("/loans")({ server: { handlers: {
	GET: ({ request }) => handleLoanHttp(request),
	POST: ({ request }) => handleLoanHttp(request),
	OPTIONS: ({ request }) => handleLoanHttp(request)
} } });
var Route = createFileRoute("/loans/$id")({ server: { handlers: {
	GET: ({ request }) => handleLoanHttp(request),
	PUT: ({ request }) => handleLoanHttp(request),
	PATCH: ({ request }) => handleLoanHttp(request),
	DELETE: ({ request }) => handleLoanHttp(request),
	OPTIONS: ({ request }) => handleLoanHttp(request)
} } });
var IndexRoute = Route$3.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$4
});
var HealthRoute = Route$2.update({
	id: "/health",
	path: "/health",
	getParentRoute: () => Route$4
});
var LoansRoute = Route$1.update({
	id: "/loans",
	path: "/loans",
	getParentRoute: () => Route$4
});
var LoansRouteChildren = { LoansIdRoute: Route.update({
	id: "/$id",
	path: "/$id",
	getParentRoute: () => LoansRoute
}) };
var rootRouteChildren = {
	IndexRoute,
	HealthRoute,
	LoansRoute: LoansRoute._addFileChildren(LoansRouteChildren)
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		rewrite: previewPathRewrite(),
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { previewPathPrefix as n, router_exports as t };
