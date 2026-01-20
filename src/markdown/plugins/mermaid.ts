import type MarkdownIt from "markdown-it";

export function createMermaidPlugin(): (md: MarkdownIt) => void {
  return (md: MarkdownIt) => {
    const defaultFence =
      md.renderer.rules.fence ||
      ((tokens, idx, options, env, self) =>
        self.renderToken(tokens, idx, options));

    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const info = token.info.trim();

      if (info === "mermaid") {
        // Don't escape mermaid content - it's parsed by mermaid.js, not rendered as HTML
        // The content is plain text diagram definitions (arrows like --> would break if escaped)
        const code = token.content.trim();
        return `<pre class="mermaid">${code}</pre>\n`;
      }

      return defaultFence(tokens, idx, options, env, self);
    };
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
