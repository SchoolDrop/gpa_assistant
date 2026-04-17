import bot from "../bot.js";
try {
  await import("../handler.js");
} catch (e) {}
export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const update =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      await bot.processUpdate(update);
    }
    res.status(200).send("ok");
  } catch (err) {
    console.error("Webhook error:", err); // this will show in Vercel logs
    res.status(200).json({ error: err.message, stack: err.stack }); // temporary - remove after fixing
  }
}
export const config = {
  api: {
    bodyParser: true, // keep true, but make sure it's not double-parsing
  },
};
