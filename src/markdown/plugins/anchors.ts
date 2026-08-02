import { type MarkdownIt, type StateCore, type Token } from "markdown-it";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

const ANCHOR_ICON = `<svg class="octicon" viewBox="0 0 16 16" width="16" height="16"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"></path></svg>`;

function addAnchor(state: StateCore, token: Token, inlineToken: Token): void {
  const text = getHeadingText(inlineToken.children ?? []);
  const slug = slugify(text);

  token.attrSet("id", slug);

  if (inlineToken.children && inlineToken.children.length > 0) {
    const anchorToken = new state.Token("html_inline", "", 0);
    anchorToken.content = `<a class="anchor" href="#${slug}">${ANCHOR_ICON}</a>`;
    inlineToken.children.unshift(anchorToken);
  }
}

export function createAnchorsPlugin(md: MarkdownIt): void {
  md.core.ruler.push("github_anchors", (state: StateCore) => {
    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i];
      if (token?.type !== "heading_open") continue;

      const inlineToken = state.tokens[i + 1];
      if (inlineToken?.type === "inline") {
        addAnchor(state, token, inlineToken);
      }
    }
  });
}

function getHeadingText(tokens: Token[]): string {
  return tokens
    .filter((t) => t.type === "text" || t.type === "code_inline")
    .map((t) => t.content)
    .join("");
}
