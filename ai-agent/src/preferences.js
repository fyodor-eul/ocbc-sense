
const languages = {
  chinese: { code: "zh", name: "Chinese" },
  mandarin: { code: "zh", name: "Chinese" },
  malay: { code: "ms", name: "Malay" },
  english: { code: "en", name: "English" }
};

function makePreference(action, value, message) {
  return {
    type: "preference_change",
    action,
    value,
    message,
    requires_confirmation: true
  };
}

function detectPreference(question) {
  if (typeof question !== "string") return null;

  const text = question.trim().toLowerCase();

  // Do not interpret negated requests as permission.
  if (/\b(don't|dont|do not|never|not|stop)\b/.test(text)) {
    return null;
  }

  // Explicit multilingual preference requests. Never infer a setting change
  // from a question merely written in another language.
  if (/(?:请|請)?(?:把|将|將)?(?:字体|字體|文字)(?:调|調|变|變)?(?:大|更大|放大)/u.test(text) || /(?:besarkan|perbesar)(?:\s+(?:saiz|ukuran))?\s+(?:teks|fon|tulisan)/i.test(text)) {
    return makePreference("increase_text_size", "large", "Would you like me to increase the text size?");
  }
  if (/(?:字体|字體|文字)(?:调|調|变|變)?(?:小|更小|缩小|縮小)/u.test(text) || /(?:kecilkan|kurangkan)(?:\s+(?:saiz|ukuran))?\s+(?:teks|fon|tulisan)/i.test(text)) {
    return makePreference("decrease_text_size", "default", "Would you like me to decrease the text size?");
  }
  if (/(?:切换|切換|更改|改成|换成|換成|设置|設置|使用)(?:为|為|到)?(?:中文|华语|華語|英语|英語|马来语|馬來語)/u.test(text)) {
    const lang = /(?:中文|华语|華語)/u.test(text) ? ["zh","Chinese"] : /(?:马来语|馬來語)/u.test(text) ? ["ms","Malay"] : ["en","English"];
    return makePreference("change_language", lang[0], `Would you like to change the application language to ${lang[1]}?`);
  }
  if (/(?:tukar|ubah|gunakan)\s+(?:bahasa\s+)?(?:cina|mandarin|melayu|inggeris)/i.test(text)) {
    const lang = /(?:cina|mandarin)/i.test(text) ? ["zh","Chinese"] : /melayu/i.test(text) ? ["ms","Malay"] : ["en","English"];
    return makePreference("change_language", lang[0], `Would you like to change the application language to ${lang[1]}?`);
  }
  if (/(?:简化|簡化)(?:说明|說明|文字|语言|語言)/u.test(text) || /(?:gunakan|buat)\s+(?:bahasa|ayat)\s+(?:yang\s+)?(?:lebih\s+)?mudah/i.test(text)) {
    return makePreference("simplify_language", true, "Would you like me to use simpler wording?");
  }
  if (/(?:读出来|讀出來|朗读|朗讀)/u.test(text) || /(?:bacakan|baca\s+(?:dengan\s+)?kuat)/i.test(text)) {
    return makePreference("read_aloud", true, "Would you like me to read the instructions aloud?");
  }

  // 1. Simplified wording takes priority over language switching.
  if (
    /\b(simpler|simple|simplify)\b/.test(text) &&
    /\b(english|words|wording|text|instructions|language)\b/.test(text)
  ) {
    return makePreference(
      "simplify_language",
      true,
      "Would you like me to use simpler wording?"
    );
  }

  // 2. Decrease text size.
  if (
    /\b(text|font|words)\b/.test(text) &&
    (
      /\b(smaller|decrease|reduce|shrink)\b/.test(text) ||
      /\btoo (big|large)\b/.test(text)
    )
  ) {
    return makePreference(
      "decrease_text_size",
      "default",
      "Would you like me to decrease the text size?"
    );
  }

  // 3. Increase text size.
  if (
    /\b(text|font|words)\b/.test(text) &&
    (
      /\b(bigger|larger|increase|enlarge)\b/.test(text) ||
      /\btoo small\b/.test(text)
    )
  ) {
    return makePreference(
      "increase_text_size",
      "large",
      "Would you like me to increase the text size?"
    );
  }

  // 4. Explicit language switching.
  if (
    /\b(change|switch|translate|use|speak)\b/.test(text)
  ) {
    for (const [name, language] of Object.entries(languages)) {
      if (new RegExp(`\\b${name}\\b`).test(text)) {
        return makePreference(
          "change_language",
          language.code,
          `Would you like to change the application language to ${language.name}?`
        );
      }
    }
  }

  // 5. Read aloud.
  if (
    /\bread\b.*\b(aloud|out loud)\b/.test(text) ||
    /\b(speak|say)\b.*\b(instructions|text)\b/.test(text)
  ) {
    return makePreference(
      "read_aloud",
      true,
      "Would you like me to read the instructions aloud?"
    );
  }

  return null;
}

module.exports = { detectPreference };
