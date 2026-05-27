import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/logo";

export const metadata = {
  title: "Terms · samplr",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-8" />
          <span className="text-base font-semibold tracking-tight">samplr</span>
        </Link>
      </nav>

      <article className="mx-auto max-w-3xl space-y-8 px-4 pb-24 pt-8 sm:px-6">
        <header className="space-y-2">
          <p className="text-sm text-[var(--color-muted-foreground)]">Last updated: 2026-05-27</p>
          <h1 className="text-3xl font-semibold tracking-tight">Terms of use</h1>
        </header>

        <Section title="Acceptance">
          <p>
            By signing in to samplr you agree to these terms. If you do not agree, do not use the service.
          </p>
        </Section>

        <Section title="What samplr is">
          <p>
            samplr is a personal, non-commercial music guessing game. It uses the Spotify Web API and the Spotify Web
            Playback SDK to stream short audio samples from your own playlists for you to identify.
          </p>
        </Section>

        <Section title="Requirements">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>A valid Spotify Premium account. Free accounts cannot use the Web Playback SDK.</li>
            <li>A modern browser with audio playback support.</li>
            <li>You must comply with Spotify&rsquo;s own Terms of Service while using samplr.</li>
          </ul>
        </Section>

        <Section title="Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Attempt to bypass authentication or access other users&rsquo; data.</li>
            <li>Reverse-engineer, scrape, or automate the service.</li>
            <li>Record or redistribute audio streamed through samplr — it remains Spotify-licensed content.</li>
            <li>Use samplr in any way that violates Spotify&rsquo;s Developer Terms or applicable law.</li>
          </ul>
        </Section>

        <Section title="Content and attribution">
          <p>
            All track audio, artwork, and metadata are provided by Spotify. samplr does not host or own any of this
            content. samplr is not affiliated with Spotify AB.
          </p>
        </Section>

        <Section title="No warranty">
          <p>
            samplr is provided &ldquo;as is&rdquo;, without warranty of any kind. The service may be unavailable,
            change behaviour, or be discontinued at any time. We are not responsible for any damage arising from use of
            the service.
          </p>
        </Section>

        <Section title="Termination">
          <p>
            We may suspend or terminate access for users who violate these terms, abuse the service, or pose a risk to
            other users or to Spotify&rsquo;s platform.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            These terms may change. Continued use after a change means you accept the updated terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions: <span className="font-mono">neotoxic.off@gmail.com</span>.
          </p>
        </Section>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-3 text-sm text-[var(--color-foreground)]/90 [&_p]:leading-relaxed">{children}</div>
    </section>
  );
}
