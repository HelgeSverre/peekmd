#!/usr/bin/env bun
import { existsSync } from "fs";
import { extname, dirname, resolve, sep } from "path";
import { createServer, type ServerState } from "./server/index.ts";
import { showToast, openBrowser } from "./utils/browser.ts";
import { getDirName, getRelativePath, getFilename } from "./utils/paths.ts";

export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: peekmd <file.md>");
    console.log(
      "  Opens a GitHub-style preview of a markdown file in your default browser.",
    );
    process.exit(1);
  }

  const filePath = resolve(args[0]);

  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const ext = extname(filePath).toLowerCase();
  if (ext !== ".md" && ext !== ".markdown" && ext !== ".mdown") {
    console.warn(`Warning: File '${filePath}' may not be a markdown file.`);
  }

  const content = await Bun.file(filePath).text();
  const filename = getFilename(filePath);
  const repoName = getDirName(filePath);
  const dirPath = getRelativePath(filePath) || "";
  const markdownDir = dirname(filePath);

  const port = 3456;
  const state: ServerState = { server: null, isOpen: false };

  const server = createServer(
    {
      port,
      filename,
      content,
      repoName,
      dirPath,
      markdownDir,
    },
    state,
  );

  const url = `http://localhost:${port}`;
  showToast(`Serving ${filename} at ${url}`);
  showToast("Press ESC or close this window to exit.");

  await openBrowser(url);
  state.isOpen = true;
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
