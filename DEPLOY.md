# Deploy Flashy

## 1. Firebase
1. Enable **Authentication → Custom** (or leave providers empty; custom tokens still work).
2. Project settings → Service accounts → Generate new private key.
3. Save the JSON in the project root (gitignored) and set `FIREBASE_SERVICE_ACCOUNT_PATH=./your-file.json` in `.env.local`.
   On Vercel, paste the JSON as a **single line** into `FIREBASE_SERVICE_ACCOUNT_JSON`.
4. Deploy rules:
   ```bash
   npx firebase-tools deploy --only firestore:rules
   ```
5. If Progress “recent activity” asks for an index, create the composite index on `studySessions`: `userId` Asc + `endedAt` Desc (link appears in the browser console).

## 2. Clerk
- Add production domain to Clerk allowed origins.
- Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

## 3. Stripe
- Set publishable + secret keys.
- Webhook endpoint: `https://YOUR_DOMAIN/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.deleted`
- Copy signing secret → `STRIPE_WEBHOOK_SECRET`
- Enable **Customer Portal** in Stripe Dashboard → Settings → Billing → Customer portal
  (payment methods, invoices, cancel). Account → Manage billing uses this.

## 4. OpenRouter
- Set `OPENROUTER_API_KEY` for AI generate.

## 5. Support email
- Set `NEXT_PUBLIC_SUPPORT_EMAIL` (footer + Account “Email support”).

## 5b. Email digests (optional)
- Create a [Resend](https://resend.com) API key → `RESEND_API_KEY`
- Set `EMAIL_FROM` to a verified sender (e.g. `Flashy <hello@yourdomain.com>`)
- Set `CRON_SECRET` to a long random string
- Vercel Cron hits `/api/cron/due-digest` daily (see `vercel.json`); authorize with `Authorization: Bearer CRON_SECRET`
- Users opt in under Account → Enable email digests

## 6. Vercel
```bash
npx vercel
```
Set all vars from `.env.example`, with `NEXT_PUBLIC_BASE_URL` = your production URL.

Client errors are posted to `/api/errors` and appear in Vercel function logs.

## 7. Smoke test
- [ ] Sign up / sign in
- [ ] Create deck (manual + AI)
- [ ] Study Flashcards / Learn / Write / Match
- [ ] Progress streak increments
- [ ] Share public link works logged out
- [ ] Checkout → `/result` updates plan
- [ ] Account → Manage billing opens Stripe portal (after a paid checkout)
- [ ] `/terms` and `/privacy` load
