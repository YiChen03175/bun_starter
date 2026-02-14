import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="mb-4 font-bold text-2xl">Page not found</h1>
      <p className="mb-8 text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
      >
        Go home
      </Link>
    </main>
  );
}
