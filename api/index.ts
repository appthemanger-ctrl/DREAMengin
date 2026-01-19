import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getApp } from "./_handler";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  return (app as any)(req, res);
}
