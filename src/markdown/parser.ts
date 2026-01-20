import MarkdownIt from "markdown-it";
import footnotePlugin from "markdown-it-footnote";
import { createHighlightPlugin } from "./plugins/highlight.ts";
import { createAnchorsPlugin } from "./plugins/anchors.ts";
import { createMermaidPlugin } from "./plugins/mermaid.ts";
import { createTaskListPlugin } from "./plugins/tasks.ts";
import { createStrikethroughPlugin } from "./plugins/strikethrough.ts";
import { processAlerts } from "./plugins/alerts.ts";

export interface ParserOptions {
  html?: boolean;
  linkify?: boolean;
  typographer?: boolean;
}

export function createParser(options: ParserOptions = {}): MarkdownIt {
  const md = new MarkdownIt({
    html: options.html ?? true,
    linkify: options.linkify ?? true,
    typographer: options.typographer ?? false,
    breaks: false,
  });

  // Apply plugins
  md.use(createHighlightPlugin());
  md.use(createMermaidPlugin());
  md.use(createTaskListPlugin());
  md.use(createStrikethroughPlugin());
  md.use(footnotePlugin);
  md.use(createAnchorsPlugin());

  return md;
}

export function renderMarkdown(
  content: string,
  options?: ParserOptions,
): string {
  const md = createParser(options);
  let html = md.render(content);
  html = processAlerts(html);
  return html;
}

export function extractDescription(content: string): string {
  const lines = content.split("\n");
  let foundHeading = false;
  let description = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      foundHeading = true;
      continue;
    }
    // Skip non-text content
    if (
      !foundHeading ||
      !trimmed ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("-") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("`") ||
      trimmed.startsWith("!") || // Images
      trimmed.startsWith("|") || // Tables
      trimmed.startsWith(">") || // Blockquotes
      trimmed.startsWith("[!") || // Alerts
      /^\d+\./.test(trimmed) || // Ordered lists
      /^</.test(trimmed) || // HTML tags
      /^\[.*\]:/.test(trimmed) // Reference links
    ) {
      continue;
    }

    // Found a text paragraph - extract it
    description = trimmed
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "") // Remove images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert links to text
      .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
      .replace(/\*([^*]+)\*/g, "$1") // Remove italic
      .replace(/`([^`]+)`/g, "$1") // Remove inline code
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    if (description) {
      break;
    }
  }

  return description || "No description provided.";
}

export function extractTopics(_repoName: string): string[] {
  return ["markdown", "preview", "documentation"];
}
