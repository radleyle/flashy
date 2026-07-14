import AppNav from '@/components/layout/AppNav';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Flashy',
};

export default function PrivacyPage() {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@flashy.study';

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent mb-2">
          Legal
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted">Last updated: July 13, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink">
          <section>
            <h2 className="font-display text-lg font-bold mb-2">1. Overview</h2>
            <p className="text-muted">
              This policy describes how Flashy collects and uses information when you use our
              website and app. We aim to collect only what we need to run the product.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-2">2. Information we collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted">
              <li>
                <strong className="text-ink">Account data</strong> — name/email via Clerk
                authentication.
              </li>
              <li>
                <strong className="text-ink">Study content</strong> — decks, cards, folders, and
                study session history you create.
              </li>
              <li>
                <strong className="text-ink">Usage</strong> — plan, AI usage counts, streaks, and
                first-party product events (for example: create deck, start study, AI generate) that
                we log on our servers. We do not use third-party ad trackers.
              </li>
              <li>
                <strong className="text-ink">Billing</strong> — handled by Stripe (card details stay
                with Stripe; we store customer/subscription IDs).
              </li>
            </ul>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-2">3. How we use data</h2>
            <p className="text-muted">
              To provide Flashy (auth, sync, study modes), enforce plan limits, process payments,
              improve reliability, and respond to support requests. When you use AI features, your
              prompts/card text are sent to our AI provider (OpenRouter) to generate responses.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-2">4. Sharing</h2>
            <p className="text-muted">
              We use processors such as Clerk (auth), Firebase/Google (database), Stripe (payments),
              Vercel (hosting), and OpenRouter (AI). We do not sell your personal data. Public decks
              you choose to share are visible to others by design.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-2">5. Retention</h2>
            <p className="text-muted">
              We keep account and content data while your account is active. You may delete decks
              anytime. Contact support to request account deletion.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-2">6. Security</h2>
            <p className="text-muted">
              We use industry-standard providers and access controls (including Firestore security
              rules). No method of transmission is 100% secure.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-2">7. Your choices</h2>
            <p className="text-muted">
              Update account details in Clerk, export cards via CSV where available, manage billing
              in Stripe&apos;s portal, and contact us for deletion requests.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-2">8. Contact</h2>
            <p className="text-muted">
              Privacy questions:{' '}
              <a className="font-bold text-accent hover:text-accent-hover" href={`mailto:${support}`}>
                {support}
              </a>
              . Also see our{' '}
              <Link href="/terms" className="font-bold text-accent hover:text-accent-hover">
                Terms of Service
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
