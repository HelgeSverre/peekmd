import { test, expect, describe } from "bun:test";
import { resolve } from "path";

const CLI_PATH = resolve(__dirname, "../src/cli.ts");

describe("CLI", () => {
  test("shows usage when no arguments provided", async () => {
    const proc = Bun.spawn(["bun", CLI_PATH], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();

    expect(exitCode).toBe(1);
    expect(stdout).toContain("Usage: peekmd");
  });

  test("errors on non-existent file", async () => {
    const proc = Bun.spawn(["bun", CLI_PATH, "/nonexistent/file.md"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    const stderr = await new Response(proc.stderr).text();

    expect(exitCode).toBe(1);
    expect(stderr).toContain("File not found");
  });

  test("warns on non-markdown file extension", async () => {
    // Create a temp file with wrong extension
    const tempFile = "/tmp/test-peekmd.txt";
    await Bun.write(tempFile, "# Test content");

    const proc = Bun.spawn(["bun", CLI_PATH, tempFile], {
      stdout: "pipe",
      stderr: "pipe",
    });

    // Kill after a short delay (we just want to check the warning)
    setTimeout(() => proc.kill(), 500);

    const stderr = await new Response(proc.stderr).text();
    expect(stderr).toContain("may not be a markdown file");
  });
});
