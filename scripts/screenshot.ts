#!/usr/bin/env bun
/**
 * Captures screenshots of peekmd for use in README.
 * Usage: bun run scripts/screenshot.ts
 */
import { resolve, dirname } from "path";
import { chromium } from "playwright";
import { createServer, type ServerState } from "../src/server/index.ts";
import {
  getDirName,
  getRelativePath,
  getFilename,
} from "../src/utils/paths.ts";

const FIXTURE = resolve("README.md");
const OUTPUT_LIGHT = resolve("screenshots/light.png");
const OUTPUT_DARK = resolve("screenshots/dark.png");

async function startServer() {
  const filePath = resolve(FIXTURE);
  const content = await Bun.file(filePath).text();
  const filename = getFilename(filePath);
  const repoName = getDirName(filePath);
  const dirPath = getRelativePath(filePath) || "";
  const markdownDir = dirname(filePath);

  const state: ServerState = { server: null, isOpen: true };
  const { server, port } = await createServer(
    { port: 0, filename, content, repoName, dirPath, markdownDir },
    state,
  );

  return { url: `http://localhost:${port}`, stop: () => server.stop() };
}

async function capture(
  url: string,
  outputPath: string,
  darkMode: boolean,
) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: darkMode ? "dark" : "light",
  });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "networkidle" });

  // Dark mode is auto-detected from colorScheme preference.
  // For light mode, ensure we're not in dark mode (in case localStorage persists).
  if (!darkMode) {
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("dark", "false");
    });
  }
  await page.waitForTimeout(200);

  // Wait for mermaid diagrams
  try {
    await page.waitForFunction(
      () => {
        const containers = document.querySelectorAll("pre.mermaid");
        if (containers.length === 0) return true;
        return Array.from(containers).every((c) => c.querySelector("svg"));
      },
      { timeout: 10000 },
    );
    await page.waitForTimeout(200);
  } catch {
    console.warn("Mermaid timeout, continuing...");
  }

  // Wait for fonts
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);

  // Close the file tree to show a cleaner view
  const fileTreeDetails = page.locator("details.Box").first();
  if (await fileTreeDetails.getAttribute("open") !== null) {
    await fileTreeDetails.locator("summary").click();
    await page.waitForTimeout(100);
  }

  // Take a viewport-sized screenshot (above the fold)
  const screenshot = await page.screenshot({ type: "png" });

  await Bun.write(outputPath, screenshot);
  console.log(`Saved: ${outputPath}`);

  await browser.close();
}

async function main() {
  // Ensure output directory exists
  const { mkdirSync } = await import("fs");
  mkdirSync(resolve("screenshots"), { recursive: true });

  const { url, stop } = await startServer();
  console.log(`Server running at ${url}`);

  try {
    await capture(url, OUTPUT_LIGHT, false);
    await capture(url, OUTPUT_DARK, true);
  } finally {
    stop();
  }
  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
