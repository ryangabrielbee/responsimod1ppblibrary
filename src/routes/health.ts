import { createFileRoute } from "@tanstack/react-router";
import { handleLoanHttp } from "@/lib/loan-http";

export const Route = createFileRoute("/health")({
  server: {
    handlers: {
      GET: ({ request }) => handleLoanHttp(request),
    },
  },
});
