import { test, expect, describe } from "bun:test";
import { renderMarkdown, extractDescription, extractTopics } from "../../src/markdown/parser.ts";

describe("renderMarkdown", () => {
  test("renders basic markdown", () => {
    const input = "# Hello World\n\nThis is a paragraph.";
    const output = renderMarkdown(input);

    expect(output).toContain("<h1");
    expect(output).toContain("Hello World");
    expect(output).toContain("<p>This is a paragraph.</p>");
  });

  test("renders code blocks with syntax highlighting", () => {
    const input = "```javascript\nconst x = 1;\n```";
    const output = renderMarkdown(input);

    expect(output).toContain("<pre>");
    expect(output).toContain("<code");
    expect(output).toContain("hljs");
  });

  test("renders lists", () => {
    const input = "- Item 1\n- Item 2\n- Item 3";
    const output = renderMarkdown(input);

    expect(output).toContain("<ul>");
    expect(output).toContain("<li>");
    expect(output).toContain("Item 1");
  });

  test("renders tables", () => {
    const input = "| A | B |\n|---|---|\n| 1 | 2 |";
    const output = renderMarkdown(input);

    expect(output).toContain("<table>");
    expect(output).toContain("<th>");
    expect(output).toContain("<td>");
  });

  test("renders links", () => {
    const input = "[Example](https://example.com)";
    const output = renderMarkdown(input);

    expect(output).toContain('<a href="https://example.com"');
    expect(output).toContain("Example");
  });

  test("renders inline code", () => {
    const input = "Use `const` for constants.";
    const output = renderMarkdown(input);

    expect(output).toContain("<code>");
    expect(output).toContain("const");
  });

  test("renders strikethrough", () => {
    const input = "This is ~~deleted~~ text.";
    const output = renderMarkdown(input);

    expect(output).toContain("<s>");
    expect(output).toContain("deleted");
    expect(output).toContain("</s>");
  });

  test("renders footnotes", () => {
    const input = "Here is a footnote[^1].\n\n[^1]: This is the footnote.";
    const output = renderMarkdown(input);

    expect(output).toContain("footnote");
    expect(output).toContain("sup");
  });

  test("renders autolinks", () => {
    const input = "Visit https://example.com for more.";
    const output = renderMarkdown(input);

    expect(output).toContain('href="https://example.com"');
  });
});

describe("extractDescription", () => {
  test("extracts first paragraph after heading", () => {
    const input = "# Title\n\nThis is the description.\n\nMore content.";
    const description = extractDescription(input);

    expect(description).toBe("This is the description.");
  });

  test("returns default when no description found", () => {
    const input = "# Title\n\n- List item\n- Another item";
    const description = extractDescription(input);

    expect(description).toBe("No description provided.");
  });

  test("strips markdown links", () => {
    const input = "# Title\n\nCheck out [this link](https://example.com) for more.";
    const description = extractDescription(input);

    expect(description).toContain("this link");
    expect(description).not.toContain("https://example.com");
  });

  test("skips images and finds text paragraph", () => {
    const input = "# Title\n\n![Badge](https://img.shields.io/badge.svg)\n\nActual description here.";
    const description = extractDescription(input);

    expect(description).toBe("Actual description here.");
  });

  test("removes inline images from description", () => {
    const input = "# Title\n\nA systems language with ![Rust](https://rust-lang.org) inside.";
    const description = extractDescription(input);

    expect(description).toBe("A systems language with inside.");
    expect(description).not.toContain("https://rust-lang.org");
  });

  test("skips lines starting with images", () => {
    const input = "# Title\n\n![Badge](https://example.com)\n\nReal description.";
    const description = extractDescription(input);

    expect(description).toBe("Real description.");
  });

  test("skips blockquotes", () => {
    const input = "# Title\n\n> This is a quote\n\nActual description.";
    const description = extractDescription(input);

    expect(description).toBe("Actual description.");
  });

  test("skips tables", () => {
    const input = "# Title\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\nDescription text.";
    const description = extractDescription(input);

    expect(description).toBe("Description text.");
  });

  test("strips formatting from description", () => {
    const input = "# Title\n\nThis is **bold** and *italic* and `code`.";
    const description = extractDescription(input);

    expect(description).toBe("This is bold and italic and code.");
  });
});

describe("extractTopics", () => {
  test("returns default topics", () => {
    const topics = extractTopics("my-repo");

    expect(topics).toContain("markdown");
    expect(topics).toContain("preview");
  });
});
