const LABELS = { en: 'English', zh: 'Simplified Chinese', ms: 'Malay' };

function detectMessageLanguage(message) {
  const text = String(message || '').trim();
  if (/[\u3400-\u9FFF]/u.test(text)) return 'zh';
  // Conservative Malay phrase matching; avoid treating English words as Malay.
  if (/\b(apa itu|bagaimana|mengapa|kenapa|bolehkah|tolong|saya|anda|pasport|telefon|akaun|imbas|bahasa melayu|saiz teks|lebih besar|lebih kecil|terangkan|tidak faham)\b/i.test(text)) return 'ms';
  return null;
}

function resolveLanguage(message, selectedLanguage = 'en') {
  return detectMessageLanguage(message) || (LABELS[selectedLanguage] ? selectedLanguage : 'en');
}

module.exports = { LABELS, detectMessageLanguage, resolveLanguage };
