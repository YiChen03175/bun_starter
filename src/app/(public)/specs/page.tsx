import { env } from "@/env";
import { api } from "@/lib/eden";
import type { SpecChange } from "@/server/modules/spec/model";
import { SpecBrowser } from "./_components/spec-browser";

export default async function SpecsPage() {
  const { data: specs, error: specsError } = await api.api.specs.get();
  if (specsError) throw specsError;

  let devChanges: SpecChange[] = [];
  if (env.NODE_ENV === "development") {
    const { data, error: devError } = await api.api.specs.dev.changes.get();
    if (devError) throw devError;
    devChanges = data ?? [];
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-6xl shrink-0 px-4 pt-12 pb-6">
        <h1 className="font-bold text-3xl tracking-tight">
          Feature Specifications
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse parsed feature specs — structured from markdown source files.
        </p>
      </div>
      <div className="mx-auto min-h-0 w-full max-w-6xl flex-1 px-4 pb-4">
        <SpecBrowser specs={specs ?? []} devChanges={devChanges} />
      </div>
    </main>
  );
}
