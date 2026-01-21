import { test, expect, describe } from "bun:test";
import { handleRequest, type RouteContext } from "../../src/server/routes.ts";
import { resolve } from "path";

function createMockContext(
  overrides: Partial<RouteContext> = {},
): RouteContext {
  return {
    filename: "test.md",
    content: "# Hello World\n\nThis is a test.",
    repoName: "test-repo",
    dirPath: "",
    markdownDir: resolve(__dirname, "../fixtures"),
    server: null,
    onClose: () => {},
    ...overrides,
  };
}

function createRequest(path: string): Request {
  return new Request(`http://localhost:3456${path}`);
}

describe("handleRequest", () => {
  describe("GET /", () => {
    test("returns HTML response", async () => {
      const context = createMockContext();
      const response = await handleRequest(createRequest("/"), context);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "text/html; charset=utf-8",
      );
    });

    test("renders markdown content", async () => {
      const context = createMockContext({
        content: "# My Title\n\nSome paragraph text.",
      });
      const response = await handleRequest(createRequest("/"), context);
      const html = await response.text();

      expect(html).toContain("My Title");
      expect(html).toContain("Some paragraph text");
    });

    test("includes repo name in output", async () => {
      const context = createMockContext({ repoName: "my-awesome-repo" });
      const response = await handleRequest(createRequest("/"), context);
      const html = await response.text();

      expect(html).toContain("my-awesome-repo");
    });

    test("includes filename in output", async () => {
      const context = createMockContext({ filename: "README.md" });
      const response = await handleRequest(createRequest("/"), context);
      const html = await response.text();

      expect(html).toContain("README.md");
    });

    test("renders code blocks with syntax highlighting", async () => {
      const context = createMockContext({
        content: "```javascript\nconst x = 1;\n```",
      });
      const response = await handleRequest(createRequest("/"), context);
      const html = await response.text();

      expect(html).toContain("<pre>");
      expect(html).toContain("<code");
      expect(html).toContain("hljs");
    });
  });

  describe("GET /close", () => {
    test("returns ok response", async () => {
      const context = createMockContext();
      const response = await handleRequest(createRequest("/close"), context);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("ok");
    });

    test("calls onClose callback", async () => {
      let closeCalled = false;
      const context = createMockContext({
        onClose: () => {
          closeCalled = true;
        },
      });

      await handleRequest(createRequest("/close"), context);

      expect(closeCalled).toBe(true);
    });
  });

  describe("GET /__assets__/*", () => {
    test("returns 404 for non-existent asset", async () => {
      const context = createMockContext();
      const response = await handleRequest(
        createRequest("/__assets__/nonexistent.png"),
        context,
      );

      expect(response.status).toBe(404);
    });

    test("serves existing asset from markdown directory", async () => {
      // This test relies on fixtures directory having files
      // markdownDir must be within cwd for security check to pass
      const context = createMockContext({
        markdownDir: resolve(__dirname, "../fixtures"),
      });
      const response = await handleRequest(
        createRequest("/__assets__/basic.md"),
        context,
      );

      // basic.md exists in fixtures, should be served
      expect(response.status).toBe(200);
    });

    test("blocks directory traversal attempts", async () => {
      const context = createMockContext();
      const response = await handleRequest(
        createRequest("/__assets__/../../../etc/passwd"),
        context,
      );

      expect(response.status).toBe(404);
    });
  });

  describe("404 handling", () => {
    test("returns 404 for unknown routes", async () => {
      const context = createMockContext();

      const paths = ["/unknown", "/api/test", "/foo/bar"];
      for (const path of paths) {
        const response = await handleRequest(createRequest(path), context);
        expect(response.status).toBe(404);
        expect(await response.text()).toBe("Not found");
      }
    });
  });
});
