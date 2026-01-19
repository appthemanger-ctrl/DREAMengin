import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../server/app";

// Lazily initialize once per lambda container.
const appPromise = createApp();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await appPromise;
  return app(req as any, res as any);
}
