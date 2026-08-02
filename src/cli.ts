#!/usr/bin/env bun
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { createServer, type ServerState } from "./server/index.ts";
import { openBrowser } from "./utils/browser.ts";
import {
  getDirName,
  getRelativePath,
  getFilename,
  isMarkdownFile,
} from "./utils/paths.ts";
import pkg from "../package.json";

export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--version") || args.includes("-v")) {
    console.log(pkg.version);
    process.exit(0);
  }

  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: peekmd <file.md>");
    console.log();
    console.log("  Opens a GitHub-style preview of a markdown file in your default browser.");
    console.log();
    console.log("Options:");
    console.log("  -v, --version   Print the version number");
    console.log("  --no-open       Do not open the browser (server only)");
    console.log("  --no-browser    Alias for --no-open");
    console.log("  -h, --help      Show this help");
    console.log();
    console.log("The file is watched and the preview live-reloads on save.");
    process.exit(0);
  }

  const noOpen =
    args.includes("--no-open") ||
    args.includes("--no-browser") ||
    process.env.CI === "true";

  const fileArg = args.find((a) => !a.startsWith("-"));
  if (!fileArg) {
    console.log("Usage: peekmd <file.md>");
    console.log(
      "  Opens a GitHub-style preview of a markdown file in your default browser.",
    );
    process.exit(1);
  }

  const filePath = resolve(fileArg);

  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  if (!isMarkdownFile(filePath)) {
    console.warn(`Warning: File '${filePath}' may not be a markdown file.`);
  }

  const content = await Bun.file(filePath).text();
  const filename = getFilename(filePath);
  const repoName = getDirName(filePath);
  const dirPath = getRelativePath(filePath);
  const markdownDir = dirname(filePath);

  const state: ServerState = { server: null, isOpen: false };

  const { port } = await createServer(
    {
      port: 3456,
      filePath,
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
  console.log(`Watching: ${filePath} (live reload on save)`);

  if (noOpen) {
    console.log("Skipping browser open (--no-open or CI detected).");
    console.log("Press Ctrl+C to stop the server.");
    await new Promise(() => {});
    return;
  }

  await openBrowser(url);
  state.isOpen = true;
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
