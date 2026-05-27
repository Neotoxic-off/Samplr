import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)]">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-[var(--color-muted-foreground)] sm:flex-row sm:px-6">
        <p>
          samplr — not affiliated with Spotify AB. All track content © respective rightsholders.
        </p>
        <nav className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-[var(--color-foreground)]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[var(--color-foreground)]">
            Terms
          </Link>
          <a
            href="https://www.spotify.com/account/apps/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-foreground)]"
          >
            Revoke access
          </a>
        </nav>
      </div>
    </footer>
  );
}
