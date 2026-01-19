import type { IncomingMessage, ServerResponse } from "http";
import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";
import { serveStatic } from "../server/static";
import { log } from "../server/vite";

let cached: ((req: IncomingMessage, res: ServerResponse) => void) | null = null;

async function init() {
  const app = express();
  const httpServer = createServer(app);

  declare module "http" {
    interface IncomingMessage {
      rawBody: unknown;
    }
  }

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined;

    const originalResJson = res.json.bind(res);
    res.json = ((bodyJson: any, ...args: any[]) => {
      capturedJsonResponse = bodyJson;
      return originalResJson(bodyJson, ...args);
    }) as any;

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status || err?.statusCode || 500;
    const message = err?.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  serveStatic(app);

  cached = app as any;
}

export async function getApp() {
  if (!cached) {
    await init();
  }
  return cached!;
}
