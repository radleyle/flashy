export function speechSupported() {
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
}

export function speak(text, lang) {
  if (!speechSupported() || !text?.trim()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.trim());
    if (lang) u.lang = lang;
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}
