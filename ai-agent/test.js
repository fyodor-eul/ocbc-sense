
const { askAI } = require("./src/assistant");

const {
  initializeKnowledge,
  retrieveKnowledge
} = require("./src/retrieval");

async function main() {
  try {
    await initializeKnowledge();

    const tests = [
      {
        pageId: "account.step1",
        screenId: "eligibility_form",
        question: "What does passport country mean?"
      },
      {
        pageId: "account.step2",
        screenId: "get_ready",
        question: "What is a biometric passport?"
      },
      {
        pageId: "account.step3",
        screenId: "passport_scanning",
        question: "What does validating digital signature mean?"
      },
      {
        pageId: "account.step4",
        screenId: "selfie_face_check",
        question: "Where should I position my face?"
      },
      {
        pageId: "account.step5",
        screenId: "sms_verification",
        question: "Which documents are accepted?"
      },
      {
        pageId: "account.step6",
        screenId: "review_application",
        question: "Does submitting mean my account is approved?"
      },
      {
        pageId: "account.step3",
        screenId: "passport_scanning",
        question: "What is the interest rate?"
      },
      {
        pageId: "account.step1",
        screenId: "eligibility_form",
        fieldId: "passport_country",
        question: "What does this mean?"
      }
    ];

    for (const test of tests) {
      console.log("\n=================================");
      console.log("Page:", test.pageId);
      console.log("Customer:", test.question);

      const retrieved = await retrieveKnowledge(
        test.question,
        test.pageId,
        test.screenId,
        test.fieldId
      );

      console.log(
        "Retrieved:",
        retrieved.map(item => ({
          id: item.id,
          score: item.score.toFixed(3)
        }))
      );

      const answer = await askAI(
        test.question,
        test.pageId,
        test.screenId,
        test.fieldId
      );

      console.log("OCBC Sense AI:", answer);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
