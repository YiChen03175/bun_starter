"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";

export function Navbar() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.refresh();
  }

  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          Bun Starter
        </Link>
        <div className="flex items-center gap-4">
          {isPending ? null : session ? (
            <>
              <span className="text-muted-foreground text-sm">
                {session.user.name}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <Button size="sm" render={<Link href="/login" />}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
