import { test, expect, describe } from "bun:test";
import {
  isAssetRequest,
  extractAssetPath,
  rewriteAssetUrls,
} from "../../src/server/assets.ts";

describe("isAssetRequest", () => {
  test("returns true for asset paths", () => {
    expect(isAssetRequest("/__assets__/image.png")).toBe(true);
    expect(isAssetRequest("/__assets__/./local.jpg")).toBe(true);
    expect(isAssetRequest("/__assets__/path/to/file.gif")).toBe(true);
  });

  test("returns false for non-asset paths", () => {
    expect(isAssetRequest("/")).toBe(false);
    expect(isAssetRequest("/close")).toBe(false);
    expect(isAssetRequest("/assets/image.png")).toBe(false);
  });
});

describe("extractAssetPath", () => {
  test("extracts asset path", () => {
    expect(extractAssetPath("/__assets__/image.png")).toBe("image.png");
    expect(extractAssetPath("/__assets__/./local.jpg")).toBe("./local.jpg");
  });

  test("decodes URL-encoded paths", () => {
    expect(extractAssetPath("/__assets__/path%20with%20spaces.png")).toBe("path with spaces.png");
    expect(extractAssetPath("/__assets__/.%2Fimage.png")).toBe("./image.png");
  });
});

describe("rewriteAssetUrls", () => {
  test("rewrites relative src paths", () => {
    const input = '<img src="./image.png">';
    const output = rewriteAssetUrls(input, "/path/to/md");

    expect(output).toContain("/__assets__/");
    expect(output).toContain(encodeURIComponent("./image.png"));
  });

  test("rewrites parent path references", () => {
    const input = '<img src="../assets/image.png">';
    const output = rewriteAssetUrls(input, "/path/to/md");

    expect(output).toContain("/__assets__/");
  });

  test("does not rewrite http URLs", () => {
    const input = '<img src="https://example.com/image.png">';
    const output = rewriteAssetUrls(input, "/path/to/md");

    expect(output).toBe(input);
  });

  test("does not rewrite data URIs", () => {
    const input = '<img src="data:image/png;base64,abc123">';
    const output = rewriteAssetUrls(input, "/path/to/md");

    expect(output).toBe(input);
  });

  test("preserves other img attributes", () => {
    const input = '<img src="./image.png" alt="Test" class="preview">';
    const output = rewriteAssetUrls(input, "/path/to/md");

    expect(output).toContain('alt="Test"');
    expect(output).toContain('class="preview"');
  });

  test("handles multiple images", () => {
    const input = '<img src="./a.png"><img src="./b.png">';
    const output = rewriteAssetUrls(input, "/path/to/md");

    expect(output).toContain(encodeURIComponent("./a.png"));
    expect(output).toContain(encodeURIComponent("./b.png"));
  });

  test("does not double-rewrite already proxied URLs", () => {
    const input = '<img src="/__assets__/%2E%2Fimage.png">';
    const output = rewriteAssetUrls(input, "/path/to/md");

    expect(output).toBe(input);
  });
});
