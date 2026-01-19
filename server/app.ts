import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";

/**
 * createApp builds the Express app without binding to a port.
 * This is required for Vercel serverless functions.
 */
export async function createApp(): Promise<Express> {
  const app = express();
  const httpServer = createServer(app);

  declare module "http" {
    interface IncomingMessage {
      rawBody: unknown;
    }
  }

  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        if (buf?.length) req.rawBody = buf.toString("utf8");
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));

  // Basic request log (kept lightweight for serverless).
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status || err?.statusCode || 500;
    const message = err?.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  return app;
}
