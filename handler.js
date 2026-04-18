import { callDb } from "./callDb.js";
import { dataSaved, histories, historiesCalc } from "./schema.js";
import bot from "./bot.js";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

let initialized = false;

app.post("/", (req, res) => {
  initBot();
  bot.processUpdate(req.body);
  res.status(200);
});

app.listen(process.env.PORT || "8080", () => {});
