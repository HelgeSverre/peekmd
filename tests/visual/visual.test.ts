import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { resolve } from "path";
import { startTestServer, type TestServer } from "./utils/server.ts";
import {
  captureScreenshot,
  captureGistScreenshot,
  closeBrowser,
} from "./utils/screenshot.ts";
import { compareImages, saveBaseline, loadBaseline } from "./utils/compare.ts";

const KITCHEN_SINK_PATH = resolve(__dirname, "../fixtures/kitchen-sink.md");
const BASELINES_DIR = resolve(__dirname, "baselines");
const DIFFS_DIR = resolve(__dirname, "diffs");

const GIST_URL =
  "https://gist.github.com/HelgeSverre/c2942523db19a5c399861a24c320e70b";

const UPDATE_BASELINES = process.env.UPDATE_BASELINES === "true";
const SKIP_GIST_COMPARISON = process.env.SKIP_GIST_COMPARISON === "true";

// Viewport configurations
const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 667 },
] as const;

type ViewportName = (typeof VIEWPORTS)[number]["name"];
type ColorMode = "light" | "dark";

let testServer: TestServer;

beforeAll(async () => {
  testServer = await startTestServer(KITCHEN_SINK_PATH);
  console.log(`Test server started at ${testServer.url}`);
});

afterAll(async () => {
  if (testServer) {
    testServer.stop();
  }
  await closeBrowser();
});

/**
 * Retry utility for flaky network tests
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        console.log(
          `Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * Run a baseline comparison test for a specific mode and viewport
 */
async function runBaselineTest(
  mode: ColorMode,
  viewport: { name: ViewportName; width: number; height: number },
): Promise<void> {
  const baselinePath = resolve(
    BASELINES_DIR,
    mode,
    viewport.name,
    "peekmd-kitchen-sink.png",
  );
  const diffPath = resolve(DIFFS_DIR, `${mode}-${viewport.name}-diff.png`);
  const actualPath = resolve(DIFFS_DIR, `${mode}-${viewport.name}-actual.png`);
  const darkMode = mode === "dark";

  const screenshot = await captureScreenshot({
    url: testServer.url,
    darkMode,
    viewport: { width: viewport.width, height: viewport.height },
  });

  if (UPDATE_BASELINES) {
    await saveBaseline(screenshot, baselinePath);
    console.log(`Updated baseline: ${baselinePath}`);
    return;
  }

  const baseline = await loadBaseline(baselinePath);
  if (!baseline) {
    // No baseline exists, create it
    await saveBaseline(screenshot, baselinePath);
    console.log(`Created baseline: ${baselinePath}`);
    return;
  }

  const result = await compareImages(screenshot, baseline, {
    threshold: 0.1,
    maxDiffPercentage: 0.5,
    diffOutputPath: diffPath,
    actualOutputPath: actualPath,
  });

  if (!result.match) {
    console.log(
      `${mode} mode (${viewport.name}) diff: ${result.diffPercentage.toFixed(2)}%`,
    );
    console.log(`Diff image saved to: ${result.diffImagePath}`);
    if (result.actualImagePath) {
      console.log(`Actual image saved to: ${result.actualImagePath}`);
    }
    if (result.dimensions.sizeMismatch) {
      console.log(
        `Size mismatch: actual ${result.dimensions.actual.width}x${result.dimensions.actual.height}, ` +
          `expected ${result.dimensions.expected.width}x${result.dimensions.expected.height}`,
      );
    }
  }

  expect(result.match).toBe(true);
}

/**
 * Run a gist comparison test for a specific mode
 */
async function runGistTest(mode: ColorMode): Promise<void> {
  const diffPath = resolve(DIFFS_DIR, `gist-${mode}-diff.png`);
  const actualPath = resolve(DIFFS_DIR, `gist-${mode}-actual.png`);
  const darkMode = mode === "dark";

  const [peekmdScreenshot, gistScreenshot] = await Promise.all([
    captureScreenshot({
      url: testServer.url,
      darkMode,
    }),
    captureGistScreenshot(GIST_URL, darkMode),
  ]);

  const result = await compareImages(peekmdScreenshot, gistScreenshot, {
    threshold: 0.1,
    maxDiffPercentage: 20, // Allow more variance for cross-platform differences
    diffOutputPath: diffPath,
    actualOutputPath: actualPath,
  });

  console.log(
    `Gist comparison (${mode}): ${result.diffPercentage.toFixed(2)}% difference`,
  );

  if (!result.match) {
    console.log(`Diff image saved to: ${result.diffImagePath}`);
    if (result.actualImagePath) {
      console.log(`Actual image saved to: ${result.actualImagePath}`);
    }
  }

  // Gist comparison uses a higher tolerance since we expect some differences
  expect(result.diffPercentage).toBeLessThan(20);
}

describe("Visual Regression Tests", () => {
  describe("Baseline comparisons", () => {
    // Generate tests for each mode and viewport combination
    for (const mode of ["light", "dark"] as const) {
      for (const viewport of VIEWPORTS) {
        test(`${mode} mode (${viewport.name}) matches baseline`, async () => {
          await runBaselineTest(mode, viewport);
        }, 30000);
      }
    }
  });

  describe("GitHub Gist comparison", () => {
    for (const mode of ["light", "dark"] as const) {
      test.skipIf(SKIP_GIST_COMPARISON)(
        `${mode} mode resembles GitHub gist rendering`,
        async () => {
          await withRetry(() => runGistTest(mode), 2, 2000);
        },
        60000,
      );
    }
  });
});
