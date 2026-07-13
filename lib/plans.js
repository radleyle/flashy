export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    maxDecks: 5,
    aiGensPerDay: 3,
    features: ['5 decks', '3 AI generations / day', 'Flashcards, Learn & Match'],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 5,
    maxDecks: 50,
    aiGensPerDay: 20,
    features: ['50 decks', '20 AI generations / day', 'Folders & sharing', 'All study modes'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 10,
    maxDecks: Infinity,
    aiGensPerDay: 100,
    features: ['Unlimited decks', '100 AI generations / day', 'Priority support', 'Everything in Basic'],
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
