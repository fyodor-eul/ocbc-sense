
const { detectSensitiveData } = require("./src/sensitive-data");

const tests = [
  {
    message: "My OTP is 123456",
    expected: "otp"
  },
  {
    message: "My password is Secret123!",
    expected: "password"
  },
  {
    message: "My passport number is K1234567",
    expected: "passport_number"
  },
  {
    message: "What is an OTP?",
    expected: null
  },
  {
    message: "How do I scan my passport?",
    expected: null
  },
  {
    message: "Make the text bigger",
    expected: null
  }
];

let passed = 0;

for (const test of tests) {
  const result = detectSensitiveData(test.message);
  const success = result === test.expected;

  console.log(
    `${success ? "PASS" : "FAIL"} | Expected: ${test.expected} | Got: ${result}`
  );

  if (success) passed++;
}

console.log(`\nTests passed: ${passed}/${tests.length}`);
