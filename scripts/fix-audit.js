const fs = require("fs");
const path = require("path");
const { Project } = require("ts-morph");

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
  skipAddingFilesFromTsConfig: false,
});

function walk(dir, files = []) {
  for (const item of fs.readdirSync(dir)) {
    if (
      item === "node_modules" ||
      item === ".next" ||
      item === ".git" ||
      item === "dist"
    ) {
      continue;
    }

    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(full)) {
      files.push(full);
    }
  }

  return files;
}

const files = walk(process.cwd());

for (const filePath of files) {
  let text = fs.readFileSync(filePath, "utf8");

  // Remove duplicate Database imports
  const seen = new Set();

  text = text.replace(
    /import\s+type\s+\{\s*Database\s*\}\s+from\s+['"][^'"]+['"];?\n/g,
    (match) => {
      const trimmed = match.trim();

      if (seen.has(trimmed)) {
        return "";
      }

      seen.add(trimmed);
      return match;
    }
  );

  // Fix catch typing
  text = text.replace(
    /catch\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*\{/g,
    "catch ($1: any) {"
  );

  // Fix invalid NextResponse typing
  text = text.replace(
    /:\s*NextResponse<unknown>/g,
    ": Response"
  );

  // Fix unknown casting spam
  text = text.replace(
    /as unknown as/g,
    "as any as"
  );

  // Remove empty exports
  text = text.replace(
    /export\s+\{\s*\};/g,
    ""
  );

  fs.writeFileSync(filePath, text, "utf8");
}

for (const sourceFile of project.getSourceFiles()) {
  try {
    sourceFile.fixUnusedIdentifiers();
    sourceFile.organizeImports();
  } catch (err) {
    console.error(err);
  }
}

project.saveSync();

console.log("Audit autofix completed.");
