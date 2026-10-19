import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "Ocurrió un error inesperado. Recargá la página.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink px-6 text-center text-cream">
      <TriangleAlert className="size-10 text-gold" strokeWidth={1.75} aria-hidden="true" />
      <h1 className="font-display text-2xl">Algo se rompió</h1>
      <p className="max-w-md text-sm break-words text-cream-dim">{errorMessage(error)}</p>
    </main>
  );
}
