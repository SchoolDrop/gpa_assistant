import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot(process.env.TEL_KEY);

export default bot;
