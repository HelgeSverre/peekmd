import type MarkdownIt from "markdown-it";

export function createTaskListPlugin(): (md: MarkdownIt) => void {
  return (md: MarkdownIt) => {
    md.core.ruler.after("inline", "task_list", (state) => {
      const tokens = state.tokens;

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === "bullet_list_open") {
          processTaskList(tokens, i);
        }
      }
    });
  };
}

function processTaskList(tokens: MarkdownIt.Token[], listIdx: number): void {
  let hasTaskItem = false;
  let depth = 0;

  for (let i = listIdx; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === "bullet_list_open") {
      depth++;
    } else if (token.type === "bullet_list_close") {
      depth--;
      if (depth === 0) break;
    }

    if (depth === 1 && token.type === "list_item_open") {
      const inlineIdx = findInlineToken(tokens, i);
      if (inlineIdx !== -1) {
        const inlineToken = tokens[inlineIdx];
        const result = processTaskItem(inlineToken);
        if (result) {
          hasTaskItem = true;
          token.attrSet("class", "task-list-item");
        }
      }
    }
  }

  if (hasTaskItem) {
    tokens[listIdx].attrJoin("class", "contains-task-list");
  }
}

function findInlineToken(tokens: MarkdownIt.Token[], startIdx: number): number {
  for (let i = startIdx + 1; i < tokens.length; i++) {
    if (tokens[i].type === "inline") return i;
    if (tokens[i].type === "list_item_close") return -1;
  }
  return -1;
}

function processTaskItem(
  inlineToken: MarkdownIt.Token,
): { checked: boolean } | null {
  if (!inlineToken.children || inlineToken.children.length === 0) {
    return null;
  }

  const firstChild = inlineToken.children[0];
  if (firstChild.type !== "text") return null;

  const match = firstChild.content.match(/^\[([ xX])\]\s*/);
  if (!match) return null;

  const checked = match[1].toLowerCase() === "x";
  firstChild.content = firstChild.content.slice(match[0].length);

  // Insert checkbox token at the beginning
  const checkboxToken = new (inlineToken.constructor as any)(
    "html_inline",
    "",
    0,
  );
  checkboxToken.content = checked
    ? '<input type="checkbox" class="task-list-item-checkbox" checked disabled>'
    : '<input type="checkbox" class="task-list-item-checkbox" disabled>';

  inlineToken.children.unshift(checkboxToken);

  return { checked };
}
