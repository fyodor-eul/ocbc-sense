// Load pages, synthetic sessions and events into MongoDB, and create indexes.
// Usage: node seed.js
// WARNING: this replaces everything in the pages, sessions, events and messages collections,
// including any live demo sessions.
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Page = require("./models/Page");
const Session = require("./models/Session");
const Event = require("./models/Event");
const Message = require("./models/Message");

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const read = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, "data", f), "utf8"));

async function main() {
  await mongoose.connect(MONGO_URL, { dbName: "askdontassume" });

  const models = [[Page, "pages.json"], [Session, "sessions.json"], [Event, "events.json"]];
  for (const [Model, file] of models) {
    await Model.deleteMany({});
    // insertMany validates every document against the schema,
    // and turns ISO date strings into real Dates
    const docs = await Model.insertMany(read(file));
    await Model.createIndexes();
    console.log(`${Model.collection.name}: ${docs.length}`);
  }

  // chat messages: no demo data, just start empty
  await Message.deleteMany({});
  await Message.createIndexes();
  console.log("messages: 0");

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch(async (err) => {
  console.error("Seeding failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
