import {
  type MarkdownIt,
  type RendererRule,
  type Token,
  type Env,
} from "markdown-it";

const MERMAID_INFO = "mermaid";

export function createMermaidPlugin(md: MarkdownIt): void {
  const defaultFence: RendererRule =
    md.renderer.rules.fence ??
    ((tokens, idx, options, _env, self) =>
      self.renderToken(tokens, idx, options));

  md.renderer.rules.fence = (
    tokens: Token[],
    idx: number,
    options,
    env: Env | undefined,
    self,
  ) => {
    const token = tokens[idx];
    if (!token) return "";

    const info = token.info.trim();

    if (info === MERMAID_INFO) {
      // Don't escape mermaid content - it's parsed by mermaid.js, not rendered as HTML
      const code = token.content.trim();
      return `<pre class="mermaid">${code}</pre>\n`;
    }

    return defaultFence(tokens, idx, options, env, self);
  };
}
