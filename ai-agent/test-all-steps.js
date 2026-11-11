
const { handleMessage } = require("./src/router");
const { initializeKnowledge } = require("./src/retrieval");

const tests = [
  {
    step: 1,
    question: "Why do I need to check my eligibility?"
  },
  {
    step: 2,
    question: "How do I know if my passport is biometric?"
  },
  {
    step: 3,
    question: "What is NFC and why is it needed?"
  },
  {
    step: 4,
    question: "Why do I need to take a selfie?"
  },
  {
    step: 5,
    question: "Which documents are accepted?"
  },
  {
    step: 6,
    question: "Why do I need to review my details before submitting?"
  }
];

async function main() {
  try {
    await initializeKnowledge();

    let passed = 0;

    for (const test of tests) {
      const result = await handleMessage({
        question: test.question,
        pageId: `account.step${test.step}`
      });

      console.log("\n================================");
      console.log(`STEP ${test.step}`);
      console.log("Question:", test.question);
      console.log("Answer:", result.answer);
      console.log("Fallback:", result.fallback);
      console.log("Type:", result.type);

      if (
        result.type === "ai_answer" &&
        result.fallback === false &&
        typeof result.answer === "string" &&
        result.answer.trim()
      ) {
        passed++;
        console.log("RESULT: PASS");
      } else {
        console.log("RESULT: REVIEW NEEDED");
      }
    }

    console.log("\n================================");
    console.log(`Initial checks passed: ${passed}/${tests.length}`);

  } catch (error) {
    console.error("Test error:", error.message);
  }
}

main();
