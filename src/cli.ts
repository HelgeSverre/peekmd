#!/usr/bin/env bun
import { existsSync } from "fs";
import { extname, dirname, resolve } from "path";
import { createServer, type ServerState } from "./server/index.ts";
import { openBrowser } from "./utils/browser.ts";
import { getDirName, getRelativePath, getFilename } from "./utils/paths.ts";
import pkg from "../package.json";

export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--version") || args.includes("-v")) {
    console.log(pkg.version);
    process.exit(0);
  }

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

  const state: ServerState = { server: null, isOpen: false };

  const { server, port } = await createServer(
    {
      port: 3456,
      filename,
      content,
      repoName,
      dirPath,
      markdownDir,
    },
    state,
  );

  const url = `http://localhost:${port}`;
  console.log(`Web UI:   ${url}`);
  console.log(`Markdown: ${filePath}`);

  await openBrowser(url);
  state.isOpen = true;
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
