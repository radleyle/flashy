# Flash

Quizlet-style study app: decks, Learn / Write / Match, AI generate-from-notes, sharing, and streaks.

## Develop

```bash
cp .env.example .env.local
# fill in Clerk, Firebase, Stripe, OpenRouter
npm install
npm run dev
```

See [DEPLOY.md](./DEPLOY.md) for Firebase rules, Stripe webhooks, and Vercel.

## Stack

Next.js 14 · Clerk · Firebase (Auth custom tokens + Firestore) · Stripe · OpenRouter
