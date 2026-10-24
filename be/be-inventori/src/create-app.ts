import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { env } from "./utils/env";
import { swaggerDocument } from "./docs/swagger";
import router from "./routes/api";

/** Memasang middleware dan rute ke app. app dibuat di index.ts agar Vercel mengenali express di berkas entri. */
export function mountApp(app: Express, ensureDb: () => Promise<void>) {
  app.use(cors({ origin: env.CLIENT_HOST }));
  app.use(express.json());
  app.get("/", (_req, res) => res.json({ message: "Server is running", data: null }));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use("/api", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await ensureDb();
      next();
    } catch (e) {
      console.error(e);
      res.status(503).json({ meta: { status: 503, message: "database unavailable" }, data: null });
    }
  }, router);
  return app;
}
