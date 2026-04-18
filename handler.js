import { callDb } from "./callDb.js";
import { dataSaved, histories, historiesCalc } from "./schema.js";
import bot from "./bot.js";
import express from "express";
import dotenv from "dotenv";
import { initBot } from "./botCode.js";

dotenv.config();

const app = express();

app.post("/bot", (req, res) => {
  bot.processUpdate(req.body);
  initBot();
  res.status(200);
});

app.listen(process.env.PORT || "8080", () => {});
