import hljs from "highlight.js";
import type MarkdownIt from "markdown-it";

export function highlightCode(code: string, language: string): string {
  if (language && hljs.getLanguage(language)) {
    try {
      return hljs.highlight(code, { language }).value;
    } catch {
      // Fall through to auto-highlight
    }
  }
  return hljs.highlightAuto(code).value;
}

export function createHighlightPlugin(): (md: MarkdownIt) => void {
  return (md: MarkdownIt) => {
    md.options.highlight = (code: string, lang: string): string => {
      return highlightCode(code, lang);
    };
  };
}
