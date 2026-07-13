# Flashy

**Flashy** is a study app for building flashcard decks and drilling them until they stick — with AI when you want speed, and a calm focus mode when it’s time to study.

Create sets from notes or by hand, organize them in folders, share public links, join classes, and track streaks and daily goals. Free and paid plans unlock more decks and AI actions.

## Tech stack

| Layer | Technology | What it does in Flashy |
|-------|------------|------------------------|
| **App framework** | Next.js 14 (App Router) + React | Pages, study UI, and API routes (`/api/...`) for AI, checkout, billing, and Firebase tokens. |
| **Styling** | Tailwind CSS | Design system (colors, layout, light/dark theme) across marketing and app screens. |
| **Auth** | Clerk | Sign up / log in, session cookies, and protected routes (library, create, study, account, etc.). |
| **Database** | Firebase Firestore | Stores users, decks, cards, folders, study sessions, classes, and plan usage. |
| **Auth bridge** | Firebase Admin + custom tokens | After Clerk login, the server mints a Firebase token so the browser can read/write Firestore securely under your rules. |
| **Payments** | Stripe | Subscription checkout for Basic/Pro, webhooks to update the user’s plan, optional customer portal for billing. |
| **AI** | OpenRouter | Powers generate-from-notes, explain, expand, coach, difficulty tags, and study plans (server-side; users don’t need their own key). |
| **Hosting** | Vercel | Runs the Next.js app in production and serves your domain. |

Fonts: **Syne** (display) + **Figtree** (body), loaded via `next/font`.

---

## Features

### Study sets
- Create decks with terms and definitions
- Optional image URLs and difficulty tags per card
- Folders, search, drag-and-drop, and bulk move/delete
- Undo after deleting a deck
- Import / export CSV
- Import notes from text files (paste PDF text to generate)

### AI tools
- Generate cards from pasted notes
- Add related cards without wiping your set
- Tag difficulty (easy / medium / hard)
- Explain any card in plain language
- Wrong-answer coach in Write mode
- Day-by-day study plan before an exam  
*(AI uses your daily plan quota.)*

### Study modes
- **Due today** — spaced review for cards ready now
- **Flashcards** — flip through terms (keyboard-friendly)
- **Learn** — still learning vs know it
- **Write** — type answers from memory
- **Match** — race to pair every card
- **Test** — mixed practice quiz with a score  
Press **?** during study for shortcuts.

### Sharing & discovery
- Make a set public and share a link
- Discover public sets and copy them into your library
- Classes with join codes and shared decks

### Progress & account
- Streaks and recent study sessions
- Daily card goal and optional reminders
- Plan usage (decks + AI today)
- Light / dark theme
- Pricing: Free, Basic, and Pro

---

Open the live site, sign up, and start with **Create a set**.
