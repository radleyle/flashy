import AppNav from '@/components/layout/AppNav';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Flashy',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent mb-2">
          Legal
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted">Last updated: July 13, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink">
          <section>
            <h2 className="font-display text-lg font-bold mb-2">1. Agreement</h2>
            <p className="text-muted">
              By creating an account or using Flashy, you agree to these Terms. If you do not agree,
              do not use the service.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-2">2. The service</h2>
            <p className="text-muted">
              Flashy provides flashcard creation, study modes, progress tracking, and optional AI
              features. We may change or discontinue features with reasonable notice when
              practical.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-2">3. Accounts</h2>
            <p className="text-muted">
              You are responsible for your account credentials and for activity under your account.
              Provide accurate information and keep your login secure.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-2">4. Plans and billing</h2>
            <p className="text-muted">
              Free and paid plans include different limits (decks, AI usage). Paid subscriptions are
              billed through Stripe. You can manage or cancel via the billing portal on your Account
              page. Fees are generally non-refundable except where required by law.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-2">5. Your content</h2>
            <p className="text-muted">
              You own the decks and cards you create. You grant Flashy a limited license to host and
              process that content so we can provide the service (including AI features you request).
              Do not upload illegal, harmful, or infringing material.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-2">6. Acceptable use</h2>
            <p className="text-muted">
              Do not abuse AI endpoints, attempt to break security, scrape other users&apos; private
              data, or use Flashy to violate applicable law. We may suspend accounts that abuse the
              service.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-2">7. Disclaimer</h2>
            <p className="text-muted">
              Flashy is provided &quot;as is.&quot; Study tools and AI output may be inaccurate. We do
              not guarantee exam results or uninterrupted availability.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-2">8. Contact</h2>
            <p className="text-muted">
              Questions about these terms:{' '}
              <a
                className="font-bold text-accent hover:text-accent-hover"
                href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@flashy.study'}`}
              >
                {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@flashy.study'}
              </a>
              . See also our{' '}
              <Link href="/privacy" className="font-bold text-accent hover:text-accent-hover">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
