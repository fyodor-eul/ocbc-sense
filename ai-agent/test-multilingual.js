const assert = require("node:assert/strict");
const { detectMessageLanguage, resolveLanguage } = require("./src/language");
const { detectPreference } = require("./src/preferences");
const tests = [
  ["什么是 NFC？", "zh"],
  ["Apa itu NFC?", "ms"],
  ["What is NFC?", null],
];
for (const [message, expected] of tests) assert.equal(detectMessageLanguage(message), expected);
assert.equal(resolveLanguage("Apa itu NFC?", "en"), "ms");
assert.equal(resolveLanguage("What is NFC?", "zh"), "zh");
assert.equal(detectPreference("把字体调大")?.action, "increase_text_size");
assert.equal(detectPreference("Besarkan saiz teks")?.action, "increase_text_size");
assert.equal(detectPreference("切换到中文")?.value, "zh");
assert.equal(detectPreference("Tukar bahasa melayu")?.value, "ms");
assert.equal(detectPreference("什么是 NFC？"), null);
console.log("10 multilingual routing/preference assertions passed.");
