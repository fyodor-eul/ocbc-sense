const { resolveLanguage } = require("./language");

const { validatePreference } = require("./preference-validator");
const { detectPreference } = require("./preferences");
const { detectSensitiveData } = require("./sensitive-data");
const { askAI } = require("./assistant");

async function handleMessage({
  question,
  pageId,
  screenId = null,
  fieldId = null,
  language = "en",
  wording = "standard",
  context = {}
}) {
  // Validate customer message
  if (
    typeof question !== "string" ||
    !question.trim() ||
    question.length > 300
  ) {
    throw new Error("Invalid customer message.");
  }

  const replyLanguage = resolveLanguage(question, language);

  // Step 1: Detect sensitive information before using AI
  const sensitiveData = detectSensitiveData(question);

  if (sensitiveData) {
    return {
      type: "ai_answer",
      answer:
        ({zh:"为了您的安全，请勿向助手提供验证码、密码或护照号码。请仅在应用程序的安全输入栏中填写这些资料。",ms:"Demi keselamatan anda, jangan kongsi OTP, kata laluan atau nombor pasport dengan pembantu ini. Masukkan maklumat hanya dalam ruangan selamat aplikasi."})[replyLanguage] || "For your security, please do not share OTPs, passwords, passport numbers or other sensitive information with this assistant. Enter required information only in the application's designated secure fields.",
      action: null,
      requires_confirmation: false,
      fallback: true
    };
  }

  // Step 2: Detect preference requests
  const preference = detectPreference(question);

  if (preference) {
    // Check whether the preference action is supported
    if (
      !validatePreference(
        preference.action,
        preference.value
      )
    ) {
      return {
        type: "ai_answer",
        answer:
          "I couldn't prepare that preference change. Would you like assistance?",
        action: null,
        requires_confirmation: false,
        fallback: true
      };
    }

    // Return preference request for frontend confirmation
    return {
      type: "preference_change",
      answer: preference.message,
      action: preference.action,
      value: preference.value,
      requires_confirmation: true,
      fallback: false
    };
  }

  // Step 3: Otherwise use RAG
  const answer = await askAI(
    question,
    pageId,
    screenId,
    fieldId,
    replyLanguage,
    wording,
    context
  );

  return {
    type: "ai_answer",
    answer: answer,
    action: null,
    requires_confirmation: false,
    fallback: ["I don't have enough verified information", "我没有足够的已核实信息", "Saya tidak mempunyai maklumat"].some(prefix => answer.startsWith(prefix))
  };
}

// Export the function
module.exports = { handleMessage };
