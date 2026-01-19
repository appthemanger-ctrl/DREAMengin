import { createApp } from "./app";
import { serveStatic } from "./static";
import { createServer } from "http";

async function main() {
  const app = await createApp();
  const httpServer = createServer(app);

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    { port, host: "0.0.0.0", reusePort: true },
    () => console.log(`serving on port ${port}`),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
