import express from "express";
import session from "express-session";
import type { Express } from "express";
import { registerRoutes } from "./routes";

export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const sessionSecret = process.env.SESSION_SECRET || "dev-secret-change-me";
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 30,
      },
    }),
  );

  registerRoutes(app);

  return app;
}
