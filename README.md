# Flashy

**Flashy** is a study app for building flashcard decks and drilling them until they stick — with AI when you want speed, and a calm focus mode when it’s time to study.

Create sets from notes or by hand, organize them in folders, share public links, join classes, and track streaks and daily goals. Free and paid plans unlock more decks and AI actions.

## Demo
<div>
    <a href="https://www.loom.com/share/5e2a7ea036dd4743bf543dc378afd71a">
      <p>Flashy demo - Watch Video</p>
    </a>
    <a href="https://www.loom.com/share/5e2a7ea036dd4743bf543dc378afd71a">
      <img style="max-width:300px;" src="https://cdn.loom.com/sessions/thumbnails/5e2a7ea036dd4743bf543dc378afd71a-913e812fa4c2eeea-full-play.gif#t=0.1">
    </a>
</div>
---

## Tech stack

| Layer | Technology | What it does in Flashy |
|-------|------------|------------------------|
| **App framework** | Next.js 14 (App Router) + React | Pages, study UI, and API routes (`/api/...`) for AI, checkout, billing, cron digests, and Firebase tokens. |
| **Styling** | Tailwind CSS | Design system (colors, layout, light/dark theme) across marketing and app screens. |
| **Auth** | Clerk | Sign up / log in, session cookies, and protected routes (library, create, study, account, etc.). |
| **Database** | Firebase Firestore | Stores users, decks, cards, folders, study sessions, classes, and plan usage. |
| **Auth bridge** | Firebase Admin + custom tokens | After Clerk login, the server mints a Firebase token so the browser can read/write Firestore securely under your rules. |
| **Payments** | Stripe | Subscription checkout for Basic/Pro, webhooks to update the user’s plan, optional customer portal for billing. |
| **AI** | OpenRouter | Powers generate-from-notes, explain, expand, coach, difficulty tags, and study plans (server-side; users don’t need their own key). |
| **Email** | Resend + Vercel Cron | Optional daily digests for due cards / study goals. |
| **Hosting** | Vercel | Runs the Next.js app in production and serves your domain. |

Fonts: **Syne** (display) + **Figtree** (body), loaded via `next/font`. Brand accent: coral.

---

## Features

### Study sets & library
- Create decks with terms and definitions
- Optional image URLs and difficulty tags per card
- Library with a **folder sidebar** (scales to many folders), search, drag-and-drop filing, and bulk move/delete
- Hide definitions by default on a set page (spoiler-safe browse) with a show/hide toggle
- New / due / learned counts and mastery hints from spaced review
- Undo after deleting a deck
- Import / export CSV
- Upload **PDF**, `.txt`, or `.md` notes — PDF text is extracted in the browser for AI generation

### AI tools
- Generate cards from pasted or uploaded notes
- Add related cards without wiping your set
- Tag difficulty (easy / medium / hard)
- Explain any card in plain language
- Wrong-answer coach in Write mode
- Day-by-day study plan before an exam  
*(AI uses your daily plan quota.)*

### Study modes
- **Due today** — spaced review for cards with a scheduled next-review date (info tooltip explains how it works)
- **Flashcards** — 3D flip, keyboard-friendly, pronounce buttons
- **Learn** — still learning vs know it, with mastery level and next-review hints
- **Write** — type answers from memory
- **Match** — race to pair every card
- **Test** — mixed practice quiz with a score  
Press **?** during study for shortcuts.

### Sharing & classes
- Make a set public and share a link
- Discover public sets and copy them into your library
- Classes with join codes; members can open and study decks the owner attaches

### Progress, account & product polish
- First-time **full-screen welcome** intro; **welcome back** after sign-in / long idle
- Streaks and recent study sessions
- Daily card goal, in-app reminders, and optional **email digests**
- Plan usage (decks + AI today)
- Light / dark theme
- PWA install prompt, offline banner, and cached decks for offline Flashcards / Learn / Write
- First-party product events (create deck, study start, AI generate, checkout) — no third-party ad trackers
- Pricing: Free, Basic, and Pro
- Terms, Privacy, and support mailto

---

## Local setup

Copy `.env.example` → `.env.local`. Use `FIREBASE_SERVICE_ACCOUNT_PATH` locally. On Vercel, prefer `FIREBASE_SERVICE_ACCOUNT_BASE64` or a valid one-line `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON object — not just the private key). See `DEPLOY.md` for production checklist (Clerk, Stripe, Resend, cron).

```bash
npm install
npm run dev
```

Open the live site, sign up, and start with **Create a set**.
