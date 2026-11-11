
const {
  validatePreference
} = require("./src/preference-validator");

const tests = [
  ["change_language", "zh", true],
  ["change_language", "fr", false],
  ["increase_text_size", "large", true],
  ["increase_text_size", "invalid", false],
  ["decrease_text_size", "default", true],
  ["decrease_text_size", "small", false],
  ["change_language", "ta", false],
  ["simplify_language", true, true],
  ["read_aloud", true, true],
  ["delete_account", true, false]
];

for (const [action, value, expected] of tests) {
  const result = validatePreference(action, value);

  console.log(
    `${result === expected ? "PASS" : "FAIL"} |`,
    action,
    value,
    "=>",
    result
  );
}
