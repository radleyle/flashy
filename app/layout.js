import { Outfit, Manrope } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { FirebaseAuthProvider } from '@/components/providers/FirebaseAuthProvider';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata = {
  title: 'Flash — Study smarter, not slower',
  description: 'Create flashcard decks, study with Learn and Match, and generate cards from your notes with AI.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${outfit.variable} ${manrope.variable} font-sans antialiased`}>
          <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
