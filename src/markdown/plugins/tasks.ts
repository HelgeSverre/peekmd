import { type MarkdownIt, type StateCore, type Token } from "markdown-it";

export function createTaskListPlugin(md: MarkdownIt): void {
  md.core.ruler.after("inline", "task_list", (state: StateCore) => {
    for (let i = 0; i < state.tokens.length; i++) {
      if (state.tokens[i]?.type === "bullet_list_open") {
        processTaskList(state, i);
      }
    }
  });
}

function processTaskList(state: StateCore, listIdx: number): void {
  let hasTaskItem = false;
  let depth = 0;

  for (let i = listIdx; i < state.tokens.length; i++) {
    const token = state.tokens[i];
    if (!token) continue;

    if (token.type === "bullet_list_open") {
      depth++;
    } else if (token.type === "bullet_list_close") {
      depth--;
      if (depth === 0) break;
    }

    if (depth === 1 && token.type === "list_item_open") {
      const inlineIdx = findInlineToken(state.tokens, i);
      if (inlineIdx === -1) continue;

      const inlineToken = state.tokens[inlineIdx];
      if (inlineToken && processTaskItem(state, inlineToken)) {
        hasTaskItem = true;
        token.attrSet("class", "task-list-item");
      }
    }
  }

  if (hasTaskItem) {
    state.tokens[listIdx]?.attrJoin("class", "contains-task-list");
  }
}

function findInlineToken(tokens: Token[], startIdx: number): number {
  for (let i = startIdx + 1; i < tokens.length; i++) {
    const type = tokens[i]?.type;
    if (type === "inline") return i;
    if (type === "list_item_close") return -1;
  }
  return -1;
}

function processTaskItem(state: StateCore, inlineToken: Token): boolean {
  const firstChild = inlineToken.children?.[0];
  if (!firstChild || firstChild.type !== "text") return false;

  const match = firstChild.content.match(/^\[([ xX])\]\s*/);
  const marker = match?.[1];
  if (!marker) return false;

  const checked = marker.toLowerCase() === "x";
  firstChild.content = firstChild.content.slice(match[0].length);

  const checkboxToken = new state.Token("html_inline", "", 0);
  checkboxToken.content = checked
    ? '<input type="checkbox" class="task-list-item-checkbox" checked disabled>'
    : '<input type="checkbox" class="task-list-item-checkbox" disabled>';

  inlineToken.children?.unshift(checkboxToken);

  return true;
}
