import { test, expect, describe } from "bun:test";
import {
  formatSize,
  getFileTree,
  renderFileTree,
  type FileNode,
} from "../../src/utils/file-tree.ts";

describe("formatSize", () => {
  test("formats bytes", () => {
    expect(formatSize(100)).toBe("100 B");
    expect(formatSize(500)).toBe("500 B");
  });

  test("formats kilobytes", () => {
    expect(formatSize(1024)).toBe("1.0 KB");
    expect(formatSize(2048)).toBe("2.0 KB");
    expect(formatSize(1536)).toBe("1.5 KB");
  });

  test("formats megabytes", () => {
    expect(formatSize(1024 * 1024)).toBe("1.0 MB");
    expect(formatSize(2 * 1024 * 1024)).toBe("2.0 MB");
    expect(formatSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
});

describe("getFileTree", () => {
  test("returns array of FileNodes", () => {
    const tree = getFileTree(process.cwd(), 1);

    expect(Array.isArray(tree)).toBe(true);
    if (tree.length > 0) {
      expect(tree[0]).toHaveProperty("name");
      expect(tree[0]).toHaveProperty("type");
    }
  });

  test("respects max depth", () => {
    const tree = getFileTree(process.cwd(), 0);
    expect(tree).toEqual([]);
  });

  test("returns empty array for non-existent directory", () => {
    const tree = getFileTree("/non/existent/path", 1);
    expect(tree).toEqual([]);
  });

  test("limits items per directory", () => {
    const tree = getFileTree(process.cwd(), 1);
    expect(tree.length).toBeLessThanOrEqual(20);
  });
});

describe("renderFileTree", () => {
  test("renders empty tree", () => {
    const output = renderFileTree([]);

    expect(output).toContain("<table");
    expect(output).toContain("</table>");
  });

  test("renders file nodes", () => {
    const nodes: FileNode[] = [
      { name: "test.md", type: "file", size: "1.0 KB" },
    ];
    const output = renderFileTree(nodes);

    expect(output).toContain("test.md");
    expect(output).toContain("1.0 KB");
  });

  test("renders folder nodes", () => {
    const nodes: FileNode[] = [{ name: "src", type: "folder", children: [] }];
    const output = renderFileTree(nodes);

    expect(output).toContain("src");
    expect(output).toContain("octicon-file-directory-fill");
  });

  test("generates correct row IDs", () => {
    const nodes: FileNode[] = [
      { name: "file1.md", type: "file" },
      { name: "file2.md", type: "file" },
    ];
    const output = renderFileTree(nodes);

    expect(output).toContain('id="folder-row-0"');
    expect(output).toContain('id="folder-row-1"');
  });
});
