import bot from "../bot.js";
import { initBot } from "../../handler.js";

initBot();
export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      bot.processUpdate(req.body);
    }

    res.status(200).end();
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).end();
  }
}
export const config = {
  api: {
    bodyParser: true, // keep true, but make sure it's not double-parsing
  },
};
