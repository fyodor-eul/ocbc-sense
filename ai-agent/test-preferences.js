
const { detectPreference } = require("./src/preferences");

const questions = [
  "Make the text bigger",
  "The font is too small",
  "Make the text smaller",
  "Use simpler English",
  "Change the language to Chinese",
  "Switch to Malay",
  "Use Tamil",
  "Read this aloud",
  "Don't make the text bigger",
  "What is NFC?",
  "I don't understand NFC"
];

for (const question of questions) {
  console.log("\nCustomer:", question);
  console.log("Result:", detectPreference(question));
}
