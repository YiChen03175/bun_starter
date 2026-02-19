import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="mb-4 font-bold text-4xl tracking-tight">Bun Starter</h1>
      <p className="mb-8 text-muted-foreground">
        Full-stack Next.js + Elysia + Drizzle + Shadcn starter template.
      </p>
      <Button nativeButton={false} render={<Link href="/board" />}>
        Open Kanban Board
      </Button>
    </main>
  );
}
