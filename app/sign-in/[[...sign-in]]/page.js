import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-display text-xl font-bold text-ink">
            Flashy
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <h1 className="mb-5 text-center font-display text-2xl font-bold text-ink">
            Log in
          </h1>
          <SignIn
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-soft border border-line bg-surface',
              },
            }}
          />
        </div>
      </main>
    </div>
  );
}
