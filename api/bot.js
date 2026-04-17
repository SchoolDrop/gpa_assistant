import bot from "../bot.js";
import "../handler.js";

export default async function handler(req, res) {
  if (req.method === "POST") {
    bot.processUpdate(req.body);
  }

  res.status(200).send("ok");
}
