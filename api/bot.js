import bot from "../bot.js";

try {
  await import("../handler.js");
  handlerLoaded = true;
} catch (e) {
  console.error("Handler load error:", e);
}
export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const update =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      await bot.processUpdate(update);
    }

    res.status(200).send("ok");
  } catch (err) {
    res.status(200).send("ok");
  }
}
export const config = {
  api: {
    bodyParser: true, // keep true, but make sure it's not double-parsing
  },
};
