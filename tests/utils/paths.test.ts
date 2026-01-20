import { test, expect, describe } from "bun:test";
import {
  getDirName,
  getRelativePath,
  getFilename,
  isMarkdownFile,
  getContentType,
  resolveAssetPath,
} from "../../src/utils/paths.ts";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";

describe("getDirName", () => {
  test("extracts directory name from path", () => {
    expect(getDirName("/Users/test/project/README.md")).toBe("project");
  });

  test("returns default for root path", () => {
    expect(getDirName("/README.md")).toBe("peekmd");
  });
});

describe("getRelativePath", () => {
  test("returns directory path", () => {
    expect(getRelativePath("src/components/Button.tsx")).toBe("src/components");
  });

  test("returns empty string for current directory", () => {
    expect(getRelativePath("README.md")).toBe("");
  });
});

describe("getFilename", () => {
  test("extracts filename from path", () => {
    expect(getFilename("/path/to/file.md")).toBe("file.md");
  });

  test("returns input if no path separator", () => {
    expect(getFilename("file.md")).toBe("file.md");
  });
});

describe("isMarkdownFile", () => {
  test("returns true for .md files", () => {
    expect(isMarkdownFile("README.md")).toBe(true);
  });

  test("returns true for .markdown files", () => {
    expect(isMarkdownFile("doc.markdown")).toBe(true);
  });

  test("returns true for .mdown files", () => {
    expect(isMarkdownFile("doc.mdown")).toBe(true);
  });

  test("returns false for other extensions", () => {
    expect(isMarkdownFile("script.js")).toBe(false);
    expect(isMarkdownFile("style.css")).toBe(false);
    expect(isMarkdownFile("image.png")).toBe(false);
  });

  test("is case insensitive", () => {
    expect(isMarkdownFile("README.MD")).toBe(true);
  });
});

describe("getContentType", () => {
  test("returns correct content type for images", () => {
    expect(getContentType("image.png")).toBe("image/png");
    expect(getContentType("image.jpg")).toBe("image/jpeg");
    expect(getContentType("image.jpeg")).toBe("image/jpeg");
    expect(getContentType("image.gif")).toBe("image/gif");
    expect(getContentType("image.svg")).toBe("image/svg+xml");
    expect(getContentType("image.webp")).toBe("image/webp");
  });

  test("returns correct content type for web files", () => {
    expect(getContentType("page.html")).toBe("text/html");
    expect(getContentType("style.css")).toBe("text/css");
    expect(getContentType("script.js")).toBe("application/javascript");
    expect(getContentType("data.json")).toBe("application/json");
  });

  test("returns octet-stream for unknown types", () => {
    expect(getContentType("file.xyz")).toBe("application/octet-stream");
  });
});

describe("resolveAssetPath", () => {
  const testDir = join(process.cwd(), "tests", "fixtures", "assets-test");

  test("setup test directory", () => {
    try {
      mkdirSync(testDir, { recursive: true });
      writeFileSync(join(testDir, "test.png"), "test");
    } catch {
      // Ignore if already exists
    }
  });

  test("resolves relative path in markdown directory", () => {
    const result = resolveAssetPath("test.png", testDir, process.cwd());
    expect(result).toBe(join(testDir, "test.png"));
  });

  test("blocks directory traversal", () => {
    const result = resolveAssetPath("../../../etc/passwd", testDir, process.cwd());
    expect(result).toBeNull();
  });

  test("returns null for non-existent files", () => {
    const result = resolveAssetPath("nonexistent.png", testDir, process.cwd());
    expect(result).toBeNull();
  });

  test("cleanup test directory", () => {
    try {
      rmSync(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });
});
