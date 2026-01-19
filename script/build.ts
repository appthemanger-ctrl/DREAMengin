import { build as viteBuild } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import viteConfig from "../vite.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  await viteBuild({
    ...viteConfig,
    mode: "production",
    root: path.resolve(__dirname, "..", "client"),
    build: {
      outDir: path.resolve(__dirname, "..", "dist"),
      emptyOutDir: true,
    },
  } as any);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
