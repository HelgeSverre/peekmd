import type MarkdownIt from "markdown-it";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";

export function createStrikethroughPlugin(): (md: MarkdownIt) => void {
  return (md: MarkdownIt) => {
    md.inline.ruler.before("emphasis", "strikethrough", strikethroughTokenize);
    md.inline.ruler2.before(
      "emphasis",
      "strikethrough",
      strikethroughPostProcess,
    );
  };
}

function strikethroughTokenize(state: StateInline, silent: boolean): boolean {
  const start = state.pos;
  const max = state.posMax;
  const marker = state.src.charCodeAt(start);

  if (marker !== 0x7e /* ~ */) return false;
  if (start + 1 >= max || state.src.charCodeAt(start + 1) !== 0x7e)
    return false;

  if (silent) return false;

  const scanned = state.scanDelims(start, true);
  if (scanned.length < 2) return false;

  const count = scanned.length;
  const token = state.push("text", "", 0);
  token.content = "~".repeat(count);

  state.delimiters.push({
    marker: 0x7e,
    length: count,
    token: state.tokens.length - 1,
    end: -1,
    open: scanned.can_open,
    close: scanned.can_close,
  });

  state.pos += count;
  return true;
}

function strikethroughPostProcess(state: StateInline): boolean {
  const delimiters = state.delimiters;
  const max = delimiters.length;

  // Find matching pairs
  for (let i = max - 1; i >= 0; i--) {
    const startDelim = delimiters[i];
    if (startDelim.marker !== 0x7e || !startDelim.open) continue;

    for (let j = i + 1; j < max; j++) {
      const endDelim = delimiters[j];
      if (endDelim.marker !== 0x7e || !endDelim.close || endDelim.end !== -1)
        continue;

      // Found a pair
      const startToken = state.tokens[startDelim.token];
      const endToken = state.tokens[endDelim.token];

      startToken.type = "s_open";
      startToken.tag = "s";
      startToken.nesting = 1;
      startToken.markup = "~~";
      startToken.content = "";

      endToken.type = "s_close";
      endToken.tag = "s";
      endToken.nesting = -1;
      endToken.markup = "~~";
      endToken.content = "";

      // Handle extra tildes
      if (startDelim.length > 2) {
        startToken.content = "~".repeat(startDelim.length - 2);
        state.tokens.splice(startDelim.token, 0, {
          ...startToken,
          type: "text",
          tag: "",
          nesting: 0,
          markup: "",
          content: "~".repeat(startDelim.length - 2),
        } as any);
      }

      startDelim.end = j;
      endDelim.end = i;
      break;
    }
  }

  return true;
}
