import { Syne, Figtree } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { FirebaseAuthProvider } from '@/components/providers/FirebaseAuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import MobileNav from '@/components/layout/MobileNav';
import SiteFooter from '@/components/layout/SiteFooter';
import PwaRegister from '@/components/providers/PwaRegister';
import ErrorReporter from '@/components/providers/ErrorReporter';
import OnboardingModal from '@/components/onboarding/OnboardingModal';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Flashy — Study smarter, not slower',
  description:
    'Create flashcard decks, study with Learn and Match, and generate cards from your notes with AI.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Flashy',
  },
};

export const viewport = {
  themeColor: '#FF5C4A',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('flash-theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`,
            }}
          />
          <link rel="apple-touch-icon" href="/icon-192.png" />
        </head>
        <body
          className={`${syne.variable} ${figtree.variable} font-sans antialiased bg-canvas text-ink`}
        >
          <ThemeProvider>
            <FirebaseAuthProvider>
              <div className="flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
                <SiteFooter />
              </div>
              <MobileNav />
              <PwaRegister />
              <ErrorReporter />
              <OnboardingModal />
            </FirebaseAuthProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
