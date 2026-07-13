import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-canvas/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <Link href="/" className="font-display text-xl font-bold text-ink">
            Flash
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-center font-display text-2xl font-semibold text-ink">
            Log in
          </h1>
          <SignIn
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-soft border border-line',
              },
            }}
          />
        </div>
      </main>
    </div>
  );
}
