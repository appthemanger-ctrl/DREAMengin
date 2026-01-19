import type { VercelRequest, VercelResponse } from "@vercel/node";
import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

type AppInit = { app: express.Express };

let initPromise: Promise<AppInit> | null = null;

async function init(): Promise<AppInit> {
  const app = express();
  const httpServer = createServer(app);

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;

    const originalResJson = res.json.bind(res);
    let capturedJsonResponse: unknown;

    res.json = ((body: any) => {
      capturedJsonResponse = body;
      return originalResJson(body);
    }) as any;

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        const line = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse !== undefined) {
          console.log(`${line} :: ${JSON.stringify(capturedJsonResponse)}`);
        } else {
          console.log(line);
        }
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status || err?.statusCode || 500;
    const message = err?.message || "Internal Server Error";
    res.status(status).json({ error: message });
  });

  return { app };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!initPromise) initPromise = init();
  const { app } = await initPromise;
  return (app as any)(req, res);
}
