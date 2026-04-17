import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config({
  path: ".env",
});
const bot = new TelegramBot(process.env.TEL_KEY);

export default bot;
