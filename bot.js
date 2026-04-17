import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot(process.env.TEL_KEY, {
  polling: true,
});

export default bot;
