'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import AppNav from '@/components/layout/AppNav';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import { ensureUser, getAiUsage, setDailyGoal } from '@/lib/firestore/users';
import { listDecks } from '@/lib/firestore/decks';
import { getPlanLimits } from '@/lib/plans';
import { useFirebaseAuth } from '@/components/providers/FirebaseAuthProvider';

const REMINDER_KEY = 'flash_daily_reminder';
const SUPPORT =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@flashy.study';

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const { ready: firebaseReady } = useFirebaseAuth();
  const [profile, setProfile] = useState(null);
  const [deckCount, setDeckCount] = useState(0);
  const [aiUsed, setAiUsed] = useState(0);
  const [goal, setGoal] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setReminder(localStorage.getItem(REMINDER_KEY) === '1');
  }, []);

  useEffect(() => {
    if (!isLoaded || !user || !firebaseReady) return;
    (async () => {
      setLoading(true);
      try {
        const [p, decks, used] = await Promise.all([
          ensureUser(user.id),
          listDecks(user.id),
          getAiUsage(user.id),
        ]);
        setProfile(p);
        setDeckCount(decks.length);
        setAiUsed(used);
        setGoal(p.dailyGoal || 20);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, user, firebaseReady]);

  const limits = getPlanLimits(profile?.plan || 'free');
  const today = new Date().toISOString().slice(0, 10);
  const studiedToday =
    profile?.cardsStudiedDate === today ? profile?.cardsStudiedToday || 0 : 0;
  const hasBilling = Boolean(profile?.stripeCustomerId);

  const saveGoal = async () => {
    setSaving(true);
    setMsg('');
    try {
      const next = await setDailyGoal(user.id, goal);
      setGoal(next);
      setProfile((p) => ({ ...p, dailyGoal: next }));
      setMsg('Daily goal saved.');
    } catch (e) {
      setMsg(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const openBillingPortal = async () => {
    setBillingLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not open billing');
      window.location.href = data.url;
    } catch (e) {
      setMsg(e.message || 'Could not open billing portal');
      setBillingLoading(false);
    }
  };

  const toggleReminder = async () => {
    const next = !reminder;
    if (next && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setMsg('Enable notifications in your browser to get reminders.');
        return;
      }
    }
    setReminder(next);
    localStorage.setItem(REMINDER_KEY, next ? '1' : '0');
    setMsg(next ? 'Daily reminder on (when you open Flashy).' : 'Reminder off.');
  };

  useEffect(() => {
    if (!reminder || !profile) return;
    const studied =
      profile.cardsStudiedDate === today ? profile.cardsStudiedToday || 0 : 0;
    const goalVal = profile.dailyGoal || 20;
    if (studied >= goalVal) return;
    const last = localStorage.getItem('flash_reminder_shown');
    if (last === today) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Flashy — daily goal', {
        body: `${studied}/${goalVal} cards studied today. Keep going!`,
      });
      localStorage.setItem('flash_reminder_shown', today);
    }
  }, [reminder, profile, today]);

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Account</h1>
        <p className="mt-1 text-sm text-muted">Usage, billing, goals, and support.</p>

        {loading ? (
          <div className="mt-8 space-y-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: 'Plan',
                  value: limits.name,
                  hint: (
                    <Link href="/pricing" className="text-accent font-bold">
                      Upgrade
                    </Link>
                  ),
                },
                {
                  label: 'Decks',
                  value: `${deckCount}${limits.maxDecks === Infinity ? '' : ` / ${limits.maxDecks}`}`,
                  hint: 'In your library',
                },
                {
                  label: 'AI today',
                  value: `${aiUsed} / ${limits.aiGensPerDay}`,
                  hint: 'Generations & tools',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-soft"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                    {s.label}
                  </p>
                  <p className="mt-1.5 font-display text-2xl font-bold text-ink">{s.value}</p>
                  <p className="mt-1 text-sm text-muted">{s.hint}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft space-y-3">
              <h2 className="font-display text-lg font-bold text-ink">Billing</h2>
              <p className="text-sm text-muted">
                {hasBilling
                  ? 'Update payment method, download invoices, or cancel in Stripe’s customer portal.'
                  : 'After you upgrade, you can manage your subscription here.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {hasBilling ? (
                  <Button onClick={openBillingPortal} disabled={billingLoading}>
                    {billingLoading ? 'Opening…' : 'Manage billing'}
                  </Button>
                ) : (
                  <Link href="/pricing">
                    <Button>View pricing</Button>
                  </Link>
                )}
                <a href={`mailto:${SUPPORT}?subject=Flashy%20support`}>
                  <Button variant="secondary">Email support</Button>
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft space-y-4">
              <h2 className="font-display text-lg font-bold text-ink">Daily goal</h2>
              <p className="text-sm text-muted">
                Today: {studiedToday} / {profile?.dailyGoal || 20} cards
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (studiedToday / (profile?.dailyGoal || 20)) * 100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-32">
                  <Input
                    label="Cards / day"
                    type="number"
                    min={5}
                    max={200}
                    value={goal}
                    onChange={(e) => setGoal(Number(e.target.value) || 20)}
                  />
                </div>
                <Button onClick={saveGoal} disabled={saving}>
                  {saving ? 'Saving…' : 'Save goal'}
                </Button>
                <Button variant="secondary" onClick={toggleReminder}>
                  {reminder ? 'Reminders on' : 'Enable reminders'}
                </Button>
              </div>
              {msg ? <p className="text-sm text-muted">{msg}</p> : null}
            </div>

            <p className="text-xs text-muted pt-2">
              <Link href="/terms" className="hover:text-ink">
                Terms
              </Link>
              {' · '}
              <Link href="/privacy" className="hover:text-ink">
                Privacy
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
