import bot from "../bot.js";
import { Resend } from "resend";
const resend = new Resend(process.env.EMAIL);
try {
  await import("../handler.js");
  await resend.emails.send({
    to: "noakmanuelnwobodo@gmail.com",
    from: "error@schooldrop.de",
    text: "it worked",
  });
} catch (e) {
  await resend.emails.send({
    to: "noakmanuelnwobodo@gmail.com",
    from: "error@schooldrop.de",
    text: `Handler load error:", ${e}`,
  });
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
    await resend.emails.send({
      to: "noakmanuelnwobodo@gmail.com",
      from: "error@schooldrop.de",
      text: `webhook load error:", ${e}`,
    });
    console.error("Webhook error:", err); // this will show in Vercel logs
    res.status(200).json({ error: err.message, stack: err.stack }); // temporary - remove after fixing
  }
}
export const config = {
  api: {
    bodyParser: true, // keep true, but make sure it's not double-parsing
  },
};
