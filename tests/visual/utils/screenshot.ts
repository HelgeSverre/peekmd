import { chromium, type Browser, type Page, type BrowserContext } from "playwright";

export interface ScreenshotOptions {
  url: string;
  selector?: string;
  darkMode?: boolean;
  waitForMermaid?: boolean;
  viewport?: { width: number; height: number };
}

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function captureScreenshot(options: ScreenshotOptions): Promise<Buffer> {
  const {
    url,
    selector = ".markdown-body",
    darkMode = false,
    waitForMermaid = true,
    viewport = { width: 1280, height: 800 },
  } = options;

  const browser = await getBrowser();
  const context: BrowserContext = await browser.newContext({
    viewport,
    colorScheme: darkMode ? "dark" : "light",
  });

  const page: Page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle" });

    // If dark mode, click the theme toggle button
    if (darkMode) {
      const themeToggle = page.locator('[data-theme-toggle], .theme-toggle, #theme-toggle');
      if (await themeToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
        await themeToggle.click();
        await page.waitForTimeout(300); // Wait for transition
      }
    }

    // Wait for Mermaid diagrams to render
    if (waitForMermaid) {
      await waitForMermaidDiagrams(page);
    }

    // Wait for fonts to load
    await waitForFonts(page);

    // Find the target element
    const element = page.locator(selector).first();
    await element.waitFor({ state: "visible", timeout: 5000 });

    // Capture screenshot of the element
    const screenshot = await element.screenshot({
      type: "png",
    });

    return Buffer.from(screenshot);
  } finally {
    await context.close();
  }
}

async function waitForMermaidDiagrams(page: Page, timeout: number = 10000): Promise<void> {
  try {
    // Check if there are any mermaid containers
    const mermaidContainers = page.locator(".mermaid, pre.mermaid, [data-mermaid]");
    const count = await mermaidContainers.count();

    if (count === 0) {
      return; // No mermaid diagrams
    }

    // Wait for mermaid to finish rendering (look for rendered SVGs)
    await page.waitForFunction(
      () => {
        const containers = document.querySelectorAll(".mermaid, pre.mermaid, [data-mermaid]");
        if (containers.length === 0) return true;

        // Check if all containers have SVGs rendered
        return Array.from(containers).every(
          (container) => container.querySelector("svg") !== null
        );
      },
      { timeout }
    );

    // Additional small wait for any animations
    await page.waitForTimeout(200);
  } catch {
    // Timeout waiting for mermaid - continue anyway
    console.warn("Timeout waiting for Mermaid diagrams to render");
  }
}

async function waitForFonts(page: Page, timeout: number = 5000): Promise<void> {
  try {
    await page.evaluate(() => document.fonts.ready);
    // Small additional wait for font rendering to settle
    await page.waitForTimeout(100);
  } catch {
    console.warn("Timeout waiting for fonts to load");
  }
}

export async function captureGistScreenshot(
  gistUrl: string,
  darkMode: boolean = false
): Promise<Buffer> {
  const browser = await getBrowser();
  const context: BrowserContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: darkMode ? "dark" : "light",
  });

  const page: Page = await context.newPage();

  try {
    await page.goto(gistUrl, { waitUntil: "networkidle" });

    // GitHub gist uses .markdown-body for rendered markdown
    const element = page.locator(".markdown-body").first();
    await element.waitFor({ state: "visible", timeout: 10000 });

    // Wait for fonts to load
    await waitForFonts(page);

    // Wait a bit for any dynamic content
    await page.waitForTimeout(500);

    const screenshot = await element.screenshot({
      type: "png",
    });

    return Buffer.from(screenshot);
  } finally {
    await context.close();
  }
}
