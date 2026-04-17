import bot from "../bot";
import "../handler";

export default async function handler(req, res) {
  if (req.method === "POST") {
    bot.processUpdate(req.body);
  }

  res.status(200).send("ok");
}
