import { test, expect, describe } from "bun:test";
import { slugify } from "../../src/markdown/plugins/anchors.ts";

describe("slugify", () => {
  test("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  test("replaces spaces with hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  test("removes special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world");
  });

  test("removes HTML tags", () => {
    expect(slugify("Hello <code>World</code>")).toBe("hello-world");
  });

  test("handles multiple spaces", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  test("trims whitespace", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });

  test("preserves hyphens", () => {
    expect(slugify("hello-world")).toBe("hello-world");
  });

  test("handles underscores", () => {
    expect(slugify("hello_world")).toBe("hello_world");
  });

  test("handles numbers", () => {
    expect(slugify("Version 2.0")).toBe("version-20");
  });

  test("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  test("handles only special characters", () => {
    expect(slugify("!@#$%")).toBe("");
  });
});
