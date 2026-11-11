const VOICE_LANG = {
  en: "en-SG",
  zh: "zh-CN",
  ms: "ms-MY",
};

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text, language = "en", onEnd) {
  if (!canSpeak() || !text) return false;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = VOICE_LANG[language] ?? "en-SG";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (canSpeak()) {
    window.speechSynthesis.cancel();
  }
}
