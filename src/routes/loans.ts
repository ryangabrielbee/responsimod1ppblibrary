import { createFileRoute } from "@tanstack/react-router";
import { handleLoanHttp } from "@/lib/loan-http";

export const Route = createFileRoute("/loans")({
  server: {
    handlers: {
      GET: ({ request }) => handleLoanHttp(request),
      POST: ({ request }) => handleLoanHttp(request),
      OPTIONS: ({ request }) => handleLoanHttp(request),
    },
  },
});
