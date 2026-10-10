import { createFileRoute } from "@tanstack/react-router";
import { handleLoanHttp } from "@/lib/loan-http";

export const Route = createFileRoute("/loans/$id")({
  server: {
    handlers: {
      GET: ({ request }) => handleLoanHttp(request),
      PUT: ({ request }) => handleLoanHttp(request),
      PATCH: ({ request }) => handleLoanHttp(request),
      DELETE: ({ request }) => handleLoanHttp(request),
      OPTIONS: ({ request }) => handleLoanHttp(request),
    },
  },
});
