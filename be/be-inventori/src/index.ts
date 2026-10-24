import express from "express";
import { mountApp } from "./create-app";
import { ensureDb } from "./db";
import { env } from "./utils/env";

const app = mountApp(express(), ensureDb);

// Di Vercel, app diekspor sebagai function; lokal dijalankan sebagai server biasa.
if (!process.env.VERCEL) {
  ensureDb()
    .then(() => app.listen(env.PORT, () => console.log(`server running on :${env.PORT}`)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export default app;
