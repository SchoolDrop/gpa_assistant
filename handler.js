import { callDb } from "./callDb.js";
import { dataSaved, histories, historiesCalc } from "./schema.js";
import bot from "./bot.js";
import express from "express";
import dotenv from "dotenv";
import { initBot } from "./botCode.js";

dotenv.config();

const app = express();

initBot();
// let isPolling = false;

// const startBot = () => {
//   if (isPolling) return;

//   bot.startPolling();
//   isPolling = true;

//   console.log("✅ Polling safely started");
// };

app.get("/", (req, res) => {
  res.status(200).send("yes");
});

app.listen(process.env.PORT || "8080", () => {
  // startBot();
});
