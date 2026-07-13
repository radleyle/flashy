export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    maxDecks: 25,
    aiGensPerDay: 25,
    features: [
      '25 decks',
      '25 AI actions / day',
      'Explain, expand & study plan',
      'All study modes',
    ],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 5,
    maxDecks: 200,
    aiGensPerDay: 150,
    features: [
      '200 decks',
      '150 AI actions / day',
      'Folders & sharing',
      'Explain, expand & coach',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 10,
    maxDecks: Infinity,
    aiGensPerDay: 1000,
    features: [
      'Unlimited decks',
      '1000 AI actions / day',
      'Priority support',
      'Everything in Basic',
    ],
  },
};

export function getPlanLimits(planId) {
  return PLANS[planId] || PLANS.free;
}

export function canCreateDeck(planId, currentCount) {
  const limits = getPlanLimits(planId);
  return currentCount < limits.maxDecks;
}

export function canGenerateAi(planId, gensToday) {
  const limits = getPlanLimits(planId);
  return gensToday < limits.aiGensPerDay;
}
