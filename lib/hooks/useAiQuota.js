'use client';

import { useUser } from '@clerk/nextjs';
import { getAiUsage, incrementAiUsage, ensureUser } from '@/lib/firestore/users';
import { canGenerateAi, getPlanLimits } from '@/lib/plans';

/** Shared AI quota helper for client components. Returns { consume, error }. */
export function useAiQuota() {
  const { user } = useUser();

  const consume = async () => {
    if (!user) return { ok: false, error: 'Please sign in.' };
    const profile = await ensureUser(user.id);
    const plan = profile.plan || 'free';
    const used = await getAiUsage(user.id);
    if (!canGenerateAi(plan, used)) {
      const limits = getPlanLimits(plan);
      return {
        ok: false,
        error: `AI limit reached (${limits.aiGensPerDay}/day on ${limits.name}). Upgrade on Pricing.`,
      };
    }
    await incrementAiUsage(user.id);
    return { ok: true, error: '' };
  };

  return { consume };
}
