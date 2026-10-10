import { createFileRoute } from "@tanstack/react-router";
import { CirculationDesk } from "@/components/circulation-desk";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <CirculationDesk />;
}
