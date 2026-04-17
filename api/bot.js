import bot from "../bot.js";
import "../handler.js";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const update =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      await bot.processUpdate(update);
    }

    res.status(200).send("ok");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(200).send("ok");
  }
}
export const config = {
  api: {
    bodyParser: true, // keep true, but make sure it's not double-parsing
  },
};
