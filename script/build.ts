import { build as viteBuild } from "vite";
import path from "path";
import viteConfig from "../vite.config";

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
