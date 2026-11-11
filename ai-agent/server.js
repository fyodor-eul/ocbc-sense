
const express = require("express");
const cors = require("cors");

const { handleMessage } = require("./src/router");
const { initializeKnowledge } = require("./src/retrieval");

const app = express();
const PORT = 3001;

// Allow requests from React during local development
app.use(cors({
  origin: ["http://localhost:5173"]
}));

// Accept JSON request bodies
app.use(express.json({ limit: "10kb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "OCBC Sense AI"
  });
});

// AI endpoint
app.post("/api/ai/message", async (req, res) => {
  try {
    const {
      question,
      step,
      stepTitle,
      stepText,
      verifiedInfo,
      lastError,
      wording,
      language
    } = req.body || {};

    // Validate customer question
    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 300
    ) {
      return res.status(400).json({
        error: "Invalid customer question."
      });
    }

    // Validate account-opening step
    if (
      !Number.isInteger(step) ||
      step < 1 ||
      step > 6
    ) {
      return res.status(400).json({
        error: "Step must be an integer from 1 to 6."
      });
    }

    // Validate optional context
    if (
      (stepTitle != null && typeof stepTitle !== "string") ||
      (stepText != null && typeof stepText !== "string") ||
      (verifiedInfo != null && typeof verifiedInfo !== "string") ||
      (lastError != null && typeof lastError !== "string") ||
      (wording != null && !["standard", "simple"].includes(wording)) ||
      (language != null && !["en", "zh", "ms"].includes(language))
    ) {
      return res.status(400).json({
        error: "Invalid request context."
      });
    }

    // Convert frontend step to AI page ID
    const pageId = `account.step${step}`;

    // Call existing AI router
    const result = await handleMessage({
      question,
      pageId,
      language: language || "en",
      wording: wording || "standard",
      // what the backend read from its database for this step
      context: { stepTitle, stepText, verifiedInfo, lastError }
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("AI request failed:", error.message);

    return res.status(500).json({
      type: "ai_answer",
      answer: "I'm unable to answer right now. Would you like to speak to a staff member?",
      action: null,
      requires_confirmation: false,
      fallback: true
    });
  }
});

// Initialize knowledge BEFORE starting the server
async function startServer() {
  try {
    console.log("Initializing OCBC Sense AI...");

    await initializeKnowledge();

    app.listen(PORT, () => {
      console.log(
        `OCBC Sense AI running at http://localhost:${PORT}`
      );
    });

  } catch (error) {
    console.error(
      "Failed to initialize AI:",
      error.message
    );

    process.exit(1);
  }
}

startServer();
