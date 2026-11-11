
const { handleMessage } = require("./src/router");

const tests = [
  {
    name: "Block OTP",
    question: "My OTP is 123456",
    expectedFallback: true
  },
  {
    name: "Block password",
    question: "My password is Secret123!",
    expectedFallback: true
  },
  {
    name: "Block passport number",
    question: "My passport number is K1234567",
    expectedFallback: true
  }
];

async function main() {
  let passed = 0;

  for (const test of tests) {
    const result = await handleMessage({
      question: test.question,
      pageId: "account.step5"
    });

    const success =
      result.type === "ai_answer" &&
      result.fallback === test.expectedFallback &&
      result.action === null &&
      result.answer.includes("For your security");

    console.log(
      `${test.name}: ${success ? "PASS" : "FAIL"}`
    );

    if (success) passed++;
  }

  console.log(`\nTests passed: ${passed}/${tests.length}`);
}

main().catch(error => {
  console.error("Test failed:", error.message);
});
