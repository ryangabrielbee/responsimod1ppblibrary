// @ts-nocheck
import {
  LoanError,
  STATUSES,
  createLoan,
  deleteLoan,
  getLoan,
  listLoans,
  storageMode,
  updateLoan,
} from "./loans.js";

export function serviceInfo() {
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
        { method: "GET", path: "/" },
        { method: "GET", path: "/health" },
        { method: "GET", path: "/loans" },
        { method: "GET", path: "/loans?status=Terlambat" },
        { method: "GET", path: "/loans/:id" },
        { method: "POST", path: "/loans" },
        { method: "PUT", path: "/loans/:id" },
        { method: "PATCH", path: "/loans/:id" },
        { method: "DELETE", path: "/loans/:id" },
      ],
    },
  };
}

function normalizePath(pathname) {
  const raw = String(pathname || "/").split("?")[0];
  let path = raw.startsWith("/") ? raw : `/${raw}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

function fail(error) {
  if (error instanceof LoanError) {
    return {
      status: error.statusCode,
      body: {
        success: false,
        message: error.message,
        ...(error.errors ? { errors: error.errors } : {}),
      },
    };
  }
  console.error(error);
  return {
    status: 500,
    body: { success: false, message: "Terjadi kesalahan pada server." },
  };
}

/**
 * @param {{ method?: string, pathname?: string, searchParams?: URLSearchParams, body?: unknown }} request
 */
export async function dispatch(request) {
  const method = String(request.method || "GET").toUpperCase();
  const path = normalizePath(request.pathname);
  const searchParams = request.searchParams || new URLSearchParams();

  try {
    if ((path === "/" || path === "/health") && method === "GET") {
      return { status: 200, body: serviceInfo() };
    }

    if (path === "/loans") {
      if (method === "GET") {
        const { rows, status, q } = await listLoans({
          status: searchParams.get("status") || undefined,
          q: searchParams.get("q") || undefined,
        });
        return {
          status: 200,
          body: {
            success: true,
            message: "Daftar peminjaman berhasil diambil.",
            data: rows,
            meta: {
              total: rows.length,
              filter: { status, q },
              storage: storageMode(),
            },
          },
        };
      }
      if (method === "POST") {
        const created = await createLoan(request.body);
        return {
          status: 201,
          body: {
            success: true,
            message: "Peminjaman berhasil dicatat.",
            data: created,
            meta: { storage: storageMode() },
          },
        };
      }
      return {
        status: 405,
        body: { success: false, message: "Method tidak diizinkan." },
      };
    }

    const detail = path.match(/^\/loans\/([^/]+)$/);
    if (detail) {
      const id = decodeURIComponent(detail[1]);
      if (method === "GET") {
        const loan = await getLoan(id);
        return {
          status: 200,
          body: {
            success: true,
            message: "Detail peminjaman berhasil diambil.",
            data: loan,
            meta: { storage: storageMode() },
          },
        };
      }
      if (method === "PUT" || method === "PATCH") {
        const loan = await updateLoan(id, request.body);
        return {
          status: 200,
          body: {
            success: true,
            message: "Peminjaman berhasil diperbarui.",
            data: loan,
            meta: { storage: storageMode() },
          },
        };
      }
      if (method === "DELETE") {
        const loan = await deleteLoan(id);
        return {
          status: 200,
          body: {
            success: true,
            message: "Peminjaman berhasil dihapus.",
            data: loan,
            meta: { storage: storageMode() },
          },
        };
      }
      return {
        status: 405,
        body: { success: false, message: "Method tidak diizinkan." },
      };
    }

    return {
      status: 404,
      body: { success: false, message: "Endpoint tidak ditemukan." },
    };
  } catch (error) {
    return fail(error);
  }
}
