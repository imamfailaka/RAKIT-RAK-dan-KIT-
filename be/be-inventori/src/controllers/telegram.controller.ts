import { timingSafeEqual } from "node:crypto";
import { Request, Response } from "express";
import { env } from "../utils/env";
import { botContext } from "../services/telegram-notify";
import { handleUpdate } from "../services/telegram";

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export default {
  /** Telegram memanggil ini; header rahasia wajib cocok, selain itu ditolak. */
  async webhook(req: Request, res: Response) {
    const secret = env.TELEGRAM_WEBHOOK_SECRET;
    const given = String(req.header("x-telegram-bot-api-secret-token") ?? "");
    if (!secret || !same(given, secret)) return res.status(403).json({ meta: { status: 403, message: "forbidden" }, data: null });
    try {
      if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) await handleUpdate(req.body, botContext());
    } catch {
      /* selalu jawab 200 agar Telegram tidak mengulang kiriman */
    }
    res.json({ ok: true });
  },
  /** Daftarkan webhook sekali setelah env diisi: buka /api/telegram/setup?key=<TELEGRAM_WEBHOOK_SECRET>. */
  async setup(req: Request, res: Response) {
    const secret = env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret || !env.TELEGRAM_BOT_TOKEN || !same(String(req.query.key ?? ""), secret)) {
      return res.status(403).json({ meta: { status: 403, message: "forbidden" }, data: null });
    }
    const host = String(req.header("x-forwarded-host") ?? req.header("host") ?? "");
    const url = `https://${host}/api/telegram/webhook`;
    const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, secret_token: secret, allowed_updates: ["message"] }),
    });
    const body: any = await r.json().catch(() => ({}));
    res.status(r.ok ? 200 : 502).json({ meta: { status: r.ok ? 200 : 502, message: body.description ?? "ok" }, data: { webhook: url } });
  },
};
