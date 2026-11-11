
const { handleMessage } = require("./src/router");
const { initializeKnowledge } = require("./src/retrieval");

async function main() {
  try {
    await initializeKnowledge();

    const tests = [
      {
        question: "Make the text bigger",
        pageId: "account.step3",
        screenId: "passport_scan_ready"
      },
      {
        question: "What is NFC?",
        pageId: "account.step3",
        screenId: "passport_scan_ready"
      },
      {
        question: "Change the language to Chinese",
        pageId: "account.step2",
        screenId: "get_ready"
      },
      {
        question: "Which documents are accepted?",
        pageId: "account.step5",
        screenId: "sms_verification"
      },
      {
        question: "I don't understand NFC",
        pageId: "account.step3",
        screenId: "passport_scan_ready"
      }
    ];

    for (const test of tests) {
      console.log("\n==============================");
      console.log("Customer:", test.question);

      const result = await handleMessage(test);

      console.log(
        "OCBC Sense:",
        JSON.stringify(result, null, 2)
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
