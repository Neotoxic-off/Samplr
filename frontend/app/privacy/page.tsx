import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/logo";

export const metadata = {
  title: "Privacy · samplr",
};

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-semibold tracking-tight">Privacy policy</h1>
        </header>

        <Section title="Who we are">
          <p>
            samplr (&ldquo;we&rdquo;, &ldquo;the service&rdquo;) is a music guessing game that plays cropped samples
            from your Spotify playlists. samplr is not affiliated with, endorsed by, or sponsored by Spotify AB.
          </p>
        </Section>

        <Section title="What data we access">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Your Spotify display name, user ID, profile image, and email — via the Spotify Web API after you sign in.</li>
            <li>Your Spotify playlists (public and private), their metadata, and the tracks they contain.</li>
            <li>Spotify playback state limited to the &ldquo;samplr&rdquo; Web Playback SDK device while you play.</li>
          </ul>
        </Section>

        <Section title="What we store">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>HTTP-only cookies</strong> in your browser containing your Spotify OAuth access token and refresh
              token. These let samplr act on your behalf during a session. They are sent only to the samplr backend.
            </li>
            <li>
              <strong>Local storage</strong>: your preferred volume level. Nothing else.
            </li>
            <li>
              <strong>No server-side database.</strong> We do not store your playlists, listening history, scores, or
              any other personal data on our servers.
            </li>
          </ul>
        </Section>

        <Section title="What we share">
          <p>
            We share nothing with third parties. We do not run analytics, ads, or trackers. The only network calls
            your browser makes are to the samplr backend and to the Spotify Web API.
          </p>
        </Section>

        <Section title="Your rights">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Sign out</strong> at any time. This clears your cookies. Closing your browser also ends the
              session.
            </li>
            <li>
              <strong>Revoke access</strong> from your{" "}
              <a
                href="https://www.spotify.com/account/apps/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary)] underline"
              >
                Spotify account&rsquo;s connected apps
              </a>{" "}
              page at any time.
            </li>
            <li>
              <strong>Delete local storage</strong> via your browser&rsquo;s site settings.
            </li>
          </ul>
        </Section>

        <Section title="Children">
          <p>
            samplr requires a Spotify Premium account, which Spotify restricts to users aged 13+ (or older in some
            regions). We do not knowingly collect data from anyone under that age.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update this policy. The &ldquo;Last updated&rdquo; date above will change. Material changes will be
            highlighted on the home page when possible.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions or requests: <span className="font-mono">neotoxic.off@gmail.com</span>.
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
