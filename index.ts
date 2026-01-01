import { readFileSync, existsSync, readdirSync, lstatSync } from "fs";
import { extname, join, dirname, sep } from "path";
import { marked } from "marked";
import hljs from "highlight.js";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  size?: string;
}

function getFileTree(
  dir: string,
  maxDepth: number = 3,
  currentDepth: number = 0,
): FileNode[] {
  if (currentDepth >= maxDepth) return [];

  try {
    const items = readdirSync(dir);
    return items
      .slice(0, 20)
      .map((item) => {
        try {
          const fullPath = join(dir, item);
          const stats = lstatSync(fullPath);
          const isDir = stats.isDirectory();
          return {
            name: item,
            type: isDir ? "folder" : "file",
            children: isDir
              ? getFileTree(fullPath, maxDepth, currentDepth + 1)
              : undefined,
            size: isDir ? "" : formatSize(stats.size),
          };
        } catch {
          // Skip files/directories we can't access
          return null;
        }
      })
      .filter((node): node is FileNode => node !== null);
  } catch {
    return [];
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderFileTree(nodes: FileNode[], depth: number = 0): string {
  return nodes
    .map((node) => {
      const indent = "  ".repeat(depth);
      const icon = node.type === "folder" ? "📁" : "📄";
      const size = node.size
        ? ` <span class="file-size">${node.size}</span>`
        : "";
      const children =
        node.children && node.children.length > 0
          ? `\n${renderFileTree(node.children, depth + 1)}`
          : "";
      return `${indent}<li class="${node.type}"><span class="icon">${icon}</span><a href="#">${node.name}</a>${size}${children}</li>`;
    })
    .join("\n");
}

function getDirName(filePath: string): string {
  const dir = dirname(filePath);
  return dir.split(sep).pop() || "peekmd";
}

function getRelativePath(filePath: string): string {
  const dir = dirname(filePath);
  return dir === "." ? "" : dir;
}

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{filename}} - {{repoName}}</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📝</text></svg>">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
      font-size: 14px;
      line-height: 1.5;
      color: #1f2328;
      background-color: #f6f8fa;
    }

    /* GitHub Header */
    .AppHeader {
      background: #24292f;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .AppHeader-logo svg { fill: #fff; width: 32px; height: 32px; }
    .AppHeader-search {
      flex: 1;
      max-width: 272px;
      background: hsla(0,0%,100%,.12);
      border: 1px solid #57606a;
      border-radius: 6px;
      padding: 5px 12px;
      color: #fff;
      font-size: 14px;
    }
    .AppHeader-search::placeholder { color: hsla(0,0%,100%,.7); }
    .AppHeader-nav { display: flex; gap: 16px; margin-left: auto; }
    .AppHeader-nav a { color: #fff; text-decoration: none; font-size: 14px; font-weight: 600; }
    .AppHeader-nav a:hover { color: hsla(0,0%,100%,.7); }

    /* Repository Header */
    .repohead {
      background: #fff;
      border-bottom: 1px solid #d0d7de;
      padding: 16px 24px;
    }
    .repohead-details-container {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .repohead svg { fill: #656d76; width: 16px; height: 16px; flex-shrink: 0; }
    .repohead-name { font-size: 20px; }
    .repohead-name a { color: #0969da; text-decoration: none; font-weight: 600; }
    .repohead-name a:hover { text-decoration: underline; }
    .repohead-name .separator { color: #656d76; margin: 0 4px; font-weight: 300; }

    /* Underline Nav (tabs) */
    .UnderlineNav {
      background: #fff;
      border-bottom: 1px solid #d0d7de;
      padding: 0 24px;
    }
    .UnderlineNav-body {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      gap: 8px;
      overflow-x: auto;
    }
    .UnderlineNav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      color: #656d76;
      text-decoration: none;
      font-size: 14px;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
    }
    .UnderlineNav-item:hover { color: #1f2328; }
    .UnderlineNav-item.selected { color: #1f2328; border-bottom-color: #fd8c73; font-weight: 600; }
    .UnderlineNav-item svg { width: 16px; height: 16px; fill: currentColor; }
    .Counter {
      background: rgba(175,184,193,0.2);
      border-radius: 2em;
      padding: 0 6px;
      font-size: 12px;
      font-weight: 500;
      line-height: 18px;
      color: #1f2328;
    }

    /* Main Content - Two Column Layout */
    .container-xl {
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px;
    }
    .Layout {
      display: flex;
      gap: 24px;
    }
    .Layout-main {
      flex: 1;
      min-width: 0;
    }
    .Layout-sidebar {
      width: 296px;
      flex-shrink: 0;
    }

    /* Sidebar */
    .BorderGrid { border-top: 1px solid #d0d7de; }
    .BorderGrid-row { padding: 16px 0; border-bottom: 1px solid #d0d7de; }
    .BorderGrid-row:first-child { border-top: none; }
    .BorderGrid-cell h2 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .sidebar-about p { font-size: 14px; color: #1f2328; margin-bottom: 16px; }
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #656d76;
      text-decoration: none;
      font-size: 14px;
      margin-top: 8px;
    }
    .sidebar-link:hover { color: #0969da; }
    .sidebar-link svg { width: 16px; height: 16px; fill: currentColor; flex-shrink: 0; }
    .sidebar-link strong { color: #1f2328; }
    .topic-tag {
      display: inline-block;
      padding: 0 10px;
      font-size: 12px;
      font-weight: 500;
      line-height: 22px;
      color: #0969da;
      background-color: #ddf4ff;
      border-radius: 2em;
      text-decoration: none;
      margin: 0 4px 4px 0;
    }
    .topic-tag:hover { background-color: #b6e3ff; }
    .Progress {
      display: flex;
      height: 8px;
      overflow: hidden;
      background-color: #e6e8eb;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .Progress-item { height: 100%; }
    .lang-list { list-style: none; }
    .lang-item {
      display: inline-flex;
      align-items: center;
      font-size: 12px;
      margin-right: 16px;
      margin-bottom: 4px;
    }
    .lang-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 4px;
    }
    .lang-name { font-weight: 600; color: #1f2328; margin-right: 4px; }
    .lang-percent { color: #656d76; }

    /* File Box */
    .Box {
      background: #fff;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      overflow: hidden;
    }
    .Box-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: #f6f8fa;
      border-bottom: 1px solid #d0d7de;
    }
    .Box-header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
    }
    .Box-header-title svg { width: 16px; height: 16px; fill: #656d76; }
    .Box-header .btn-sm {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 12px;
      font-size: 12px;
      font-weight: 500;
      background: #f6f8fa;
      border: 1px solid rgba(31,35,40,0.15);
      border-radius: 6px;
      color: #1f2328;
      cursor: pointer;
    }
    .Box-header .btn-sm:hover { background: #f3f4f6; border-color: rgba(31,35,40,0.15); }
    .Box-header .btn-sm svg { width: 16px; height: 16px; fill: currentColor; }

    /* Markdown Body - GitHub's exact styling */
    .markdown-body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
      font-size: 16px;
      line-height: 1.5;
      word-wrap: break-word;
      padding: 32px;
      max-width: 1012px;
    }

    /* Headings */
    .markdown-body h1, .markdown-body h2 {
      padding-bottom: 0.3em;
      border-bottom: 1px solid hsla(210,18%,87%,1);
    }
    .markdown-body h1 { font-size: 2em; margin: 0.67em 0 16px; font-weight: 600; line-height: 1.25; }
    .markdown-body h1:first-child { margin-top: 0; }
    .markdown-body h2 { font-size: 1.5em; margin: 24px 0 16px; font-weight: 600; line-height: 1.25; }
    .markdown-body h3 { font-size: 1.25em; margin: 24px 0 16px; font-weight: 600; line-height: 1.25; }
    .markdown-body h4 { font-size: 1em; margin: 24px 0 16px; font-weight: 600; line-height: 1.25; }
    .markdown-body h5 { font-size: 0.875em; margin: 24px 0 16px; font-weight: 600; line-height: 1.25; }
    .markdown-body h6 { font-size: 0.85em; margin: 24px 0 16px; font-weight: 600; line-height: 1.25; color: #656d76; }

    /* Anchor links */
    .markdown-body h1 .anchor, .markdown-body h2 .anchor, .markdown-body h3 .anchor,
    .markdown-body h4 .anchor, .markdown-body h5 .anchor, .markdown-body h6 .anchor {
      float: left;
      padding-right: 4px;
      margin-left: -20px;
      line-height: 1;
      opacity: 0;
      text-decoration: none;
    }
    .markdown-body h1:hover .anchor, .markdown-body h2:hover .anchor, .markdown-body h3:hover .anchor,
    .markdown-body h4:hover .anchor, .markdown-body h5:hover .anchor, .markdown-body h6:hover .anchor {
      opacity: 1;
    }
    .markdown-body .anchor svg { fill: #1f2328; }

    /* Paragraphs and text */
    .markdown-body p { margin: 0 0 16px; }
    .markdown-body a { color: #0969da; text-decoration: none; }
    .markdown-body a:hover { text-decoration: underline; }
    .markdown-body strong, .markdown-body b { font-weight: 600; }
    .markdown-body em, .markdown-body i { font-style: italic; }
    .markdown-body del { text-decoration: line-through; }
    .markdown-body mark { background-color: #fff8c5; padding: 0.1em 0.2em; }
    .markdown-body sub, .markdown-body sup { font-size: 75%; line-height: 0; position: relative; vertical-align: baseline; }
    .markdown-body sup { top: -0.5em; }
    .markdown-body sub { bottom: -0.25em; }

    /* Code */
    .markdown-body code, .markdown-body tt {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      white-space: break-spaces;
      background-color: rgba(175,184,193,0.2);
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    }
    .markdown-body pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      color: #1f2328;
      background-color: #f6f8fa;
      border-radius: 6px;
      margin-bottom: 16px;
      word-wrap: normal;
    }
    .markdown-body pre code {
      display: inline;
      max-width: auto;
      padding: 0;
      margin: 0;
      overflow: visible;
      line-height: inherit;
      word-wrap: normal;
      background-color: transparent;
      border: 0;
      font-size: 100%;
      white-space: pre;
    }

    /* Lists */
    .markdown-body ul, .markdown-body ol { padding-left: 2em; margin-bottom: 16px; }
    .markdown-body ul ul, .markdown-body ul ol, .markdown-body ol ol, .markdown-body ol ul { margin-top: 0; margin-bottom: 0; }
    .markdown-body li { margin: 0.25em 0; }
    .markdown-body li > p { margin-top: 16px; }
    .markdown-body li + li { margin-top: 0.25em; }

    /* Task lists */
    .markdown-body .task-list-item { list-style-type: none; }
    .markdown-body .task-list-item label { font-weight: 400; }
    .markdown-body .task-list-item.enabled label { cursor: pointer; }
    .markdown-body .task-list-item + .task-list-item { margin-top: 4px; }
    .markdown-body .task-list-item-checkbox {
      margin: 0 0.2em 0.25em -1.4em;
      vertical-align: middle;
    }
    .markdown-body .contains-task-list:dir(rtl) .task-list-item-checkbox { margin: 0 -1.6em 0.25em 0.2em; }
    .markdown-body input[type="checkbox"] {
      appearance: none;
      width: 16px;
      height: 16px;
      border: 1px solid #d0d7de;
      border-radius: 3px;
      background: #fff;
      vertical-align: middle;
      cursor: pointer;
    }
    .markdown-body input[type="checkbox"]:checked {
      background-color: #0969da;
      border-color: #0969da;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='white' d='M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z'/%3E%3C/svg%3E");
      background-size: 12px 12px;
      background-position: center;
      background-repeat: no-repeat;
    }

    /* Blockquotes */
    .markdown-body blockquote {
      padding: 0 1em;
      color: #656d76;
      border-left: 0.25em solid #d0d7de;
      margin: 0 0 16px;
    }
    .markdown-body blockquote > :first-child { margin-top: 0; }
    .markdown-body blockquote > :last-child { margin-bottom: 0; }

    /* GitHub Alerts */
    .markdown-body .markdown-alert {
      padding: 8px 16px;
      margin-bottom: 16px;
      color: inherit;
      border-left: 0.25em solid;
      border-radius: 6px;
    }
    .markdown-body .markdown-alert > :first-child { margin-top: 0; }
    .markdown-body .markdown-alert > :last-child { margin-bottom: 0; }
    .markdown-body .markdown-alert-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .markdown-body .markdown-alert-title svg { width: 16px; height: 16px; fill: currentColor; }
    .markdown-body .markdown-alert-note { border-left-color: #0969da; background: #ddf4ff; }
    .markdown-body .markdown-alert-note .markdown-alert-title { color: #0969da; }
    .markdown-body .markdown-alert-tip { border-left-color: #1a7f37; background: #dafbe1; }
    .markdown-body .markdown-alert-tip .markdown-alert-title { color: #1a7f37; }
    .markdown-body .markdown-alert-important { border-left-color: #8250df; background: #fbefff; }
    .markdown-body .markdown-alert-important .markdown-alert-title { color: #8250df; }
    .markdown-body .markdown-alert-warning { border-left-color: #9a6700; background: #fff8c5; }
    .markdown-body .markdown-alert-warning .markdown-alert-title { color: #9a6700; }
    .markdown-body .markdown-alert-caution { border-left-color: #cf222e; background: #ffebe9; }
    .markdown-body .markdown-alert-caution .markdown-alert-title { color: #cf222e; }

    /* Tables */
    .markdown-body table {
      display: block;
      width: max-content;
      max-width: 100%;
      overflow: auto;
      margin-bottom: 16px;
      border-spacing: 0;
      border-collapse: collapse;
    }
    .markdown-body table th, .markdown-body table td {
      padding: 6px 13px;
      border: 1px solid #d0d7de;
    }
    .markdown-body table th {
      font-weight: 600;
      background-color: #f6f8fa;
    }
    .markdown-body table tr {
      background-color: #fff;
      border-top: 1px solid hsla(210,18%,87%,1);
    }
    .markdown-body table tr:nth-child(2n) {
      background-color: #f6f8fa;
    }

    /* Images */
    .markdown-body img {
      max-width: 100%;
      box-sizing: border-box;
      background-color: #fff;
    }
    .markdown-body img[align=right] { padding-left: 20px; }
    .markdown-body img[align=left] { padding-right: 20px; }

    /* HR */
    .markdown-body hr {
      height: 0.25em;
      padding: 0;
      margin: 24px 0;
      background-color: #d0d7de;
      border: 0;
    }

    /* Details/Summary */
    .markdown-body details { margin-bottom: 16px; }
    .markdown-body details summary { cursor: pointer; font-weight: 600; }
    .markdown-body details summary:focus { outline: none; }
    .markdown-body details[open] summary { margin-bottom: 8px; }

    /* Footnotes */
    .markdown-body .footnotes { font-size: 12px; color: #656d76; border-top: 1px solid #d0d7de; padding-top: 16px; margin-top: 32px; }
    .markdown-body .footnotes ol { padding-left: 16px; }
    .markdown-body .footnotes li { margin-bottom: 8px; }
    .markdown-body .footnotes li:target { background-color: #fff8c5; }
    .markdown-body sup a { font-size: 12px; }
    .markdown-body .data-footnote-backref { font-family: inherit; }

    /* Keyboard */
    .markdown-body kbd {
      display: inline-block;
      padding: 3px 5px;
      font: 11px ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      line-height: 10px;
      color: #1f2328;
      vertical-align: middle;
      background-color: #f6f8fa;
      border: 1px solid rgba(175,184,193,0.2);
      border-bottom-color: rgba(175,184,193,0.2);
      border-radius: 6px;
      box-shadow: inset 0 -1px 0 rgba(175,184,193,0.2);
    }

    /* Syntax Highlighting - highlight.js */
    .hljs { color: #1f2328; background: #f6f8fa; }
    .hljs-doctag, .hljs-keyword, .hljs-meta .hljs-keyword, .hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-variable.language_ { color: #cf222e; }
    .hljs-title, .hljs-title.class_, .hljs-title.class_.inherited__, .hljs-title.function_ { color: #8250df; }
    .hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta, .hljs-number, .hljs-operator, .hljs-selector-attr, .hljs-selector-class, .hljs-selector-id, .hljs-variable { color: #0550ae; }
    .hljs-meta .hljs-string, .hljs-regexp, .hljs-string { color: #0a3069; }
    .hljs-built_in, .hljs-symbol { color: #e36209; }
    .hljs-code, .hljs-comment, .hljs-formula { color: #6e7781; }
    .hljs-name, .hljs-quote, .hljs-selector-pseudo, .hljs-selector-tag { color: #116329; }
    .hljs-subst { color: #1f2328; }
    .hljs-section { color: #0550ae; font-weight: 700; }
    .hljs-bullet { color: #953800; }
    .hljs-emphasis { color: #1f2328; font-style: italic; }
    .hljs-strong { color: #1f2328; font-weight: 700; }
    .hljs-addition { color: #116329; background-color: #dafbe1; }
    .hljs-deletion { color: #82071e; background-color: #ffebe9; }

    /* Toast notification */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1f2328;
      color: #fff;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 1000;
    }
    .toast.show { opacity: 1; }

    /* Responsive */
    @media (max-width: 1012px) {
      .container-xl { padding: 16px; }
      .Layout { flex-direction: column-reverse; }
      .Layout-sidebar { width: 100%; }
      .markdown-body { padding: 24px 16px; }
    }
    @media (max-width: 768px) {
      .repohead, .UnderlineNav { padding-left: 16px; padding-right: 16px; }
      .markdown-body { padding: 16px; font-size: 14px; }
      .markdown-body h1 { font-size: 1.75em; }
      .markdown-body h2 { font-size: 1.35em; }
      .AppHeader-nav { display: none; }
    }
  </style>
</head>
<body>
  <header class="AppHeader">
    <div class="AppHeader-logo">
      <svg viewBox="0 0 16 16"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path></svg>
    </div>
    <input type="text" class="AppHeader-search" placeholder="Search or jump to...">
    <nav class="AppHeader-nav">
      <a href="#">Pull requests</a>
      <a href="#">Issues</a>
      <a href="#">Marketplace</a>
      <a href="#">Explore</a>
    </nav>
  </header>

  <div class="repohead">
    <div class="repohead-details-container">
      <svg viewBox="0 0 16 16"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1ZM5 12.25v3.25a.25.25 0 0 0 .4.2l1.45-1.087a.25.25 0 0 1 .3 0L8.6 15.7a.25.25 0 0 0 .4-.2v-3.25a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25Z"></path></svg>
      <div class="repohead-name">
        <a href="#">{{repoName}}</a>
        <span class="separator">/</span>
        <a href="#">{{filename}}</a>
      </div>
    </div>
  </div>

  <nav class="UnderlineNav">
    <div class="UnderlineNav-body">
      <a href="#" class="UnderlineNav-item selected">
        <svg viewBox="0 0 16 16"><path d="m11.28 3.22 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L13.94 8l-3.72-3.72a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215Zm-6.56 0a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L2.06 8l3.72 3.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L.47 8.53a.75.75 0 0 1 0-1.06Z"></path></svg>
        Code
      </a>
      <a href="#" class="UnderlineNav-item">
        <svg viewBox="0 0 16 16"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>
        Issues
      </a>
      <a href="#" class="UnderlineNav-item">
        <svg viewBox="0 0 16 16"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path></svg>
        Pull requests
      </a>
      <a href="#" class="UnderlineNav-item">
        <svg viewBox="0 0 16 16"><path d="M8 0a8.2 8.2 0 0 1 .701.031C6.444.095 4.07.52 2.392 1.699c-.428.301-.986.156-1.248-.308a.75.75 0 0 1 .191-.94C3.312-.567 6.186-.984 8.001.031A8.003 8.003 0 0 1 15.969 8 8.003 8.003 0 0 1 8 16a8.002 8.002 0 0 1-7.997-7.562.75.75 0 0 1 1.5-.063A6.502 6.502 0 0 0 14.5 8a6.502 6.502 0 0 0-6.5-6.5c-.364 0-.72.03-1.07.088ZM8 4.5a.75.75 0 0 1 .75.75v2.5h2a.75.75 0 0 1 0 1.5h-2.75a.75.75 0 0 1-.75-.75v-3.25A.75.75 0 0 1 8 4.5Z"></path></svg>
        Actions
      </a>
      <a href="#" class="UnderlineNav-item">
        <svg viewBox="0 0 16 16"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25ZM6.5 6.5v8h7.75a.25.25 0 0 0 .25-.25V6.5Zm8-1.5V1.75a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25V5Zm-8 1.5v8H1.75a.25.25 0 0 1-.25-.25V6.5Z"></path></svg>
        Projects
      </a>
      <a href="#" class="UnderlineNav-item">
        <svg viewBox="0 0 16 16"><path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667Zm.61 1.429a.25.25 0 0 0-.153 0l-5.25 1.68a.25.25 0 0 0-.174.238V7c0 1.358.275 2.666 1.057 3.86.784 1.194 2.121 2.34 4.366 3.297a.196.196 0 0 0 .154 0c2.245-.956 3.582-2.104 4.366-3.298C13.225 9.666 13.5 8.36 13.5 7V3.48a.251.251 0 0 0-.174-.237l-5.25-1.68ZM8.75 4.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 1.5 0ZM9 10.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>
        Security
      </a>
      <a href="#" class="UnderlineNav-item">
        <svg viewBox="0 0 16 16"><path d="M.75 8a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5h-4Zm8 0a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5h-4Zm-8 4a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5h-4Zm8 0a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5h-4Z"></path></svg>
        Insights
      </a>
    </div>
  </nav>

  <div class="container-xl">
    <div class="Layout">
      <div class="Layout-main">
        <article class="Box">
          <div class="Box-header">
            <div class="Box-header-title">
              <svg viewBox="0 0 16 16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path></svg>
              {{filename}}
            </div>
            <button class="btn-sm">
              <svg viewBox="0 0 16 16"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25ZM5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg>
              Copy
            </button>
          </div>
          <div class="markdown-body">{{content}}</div>
        </article>
      </div>
      <div class="Layout-sidebar">
        <div class="BorderGrid">
          <div class="BorderGrid-row">
            <div class="BorderGrid-cell sidebar-about">
              <h2>About</h2>
              <p>{{description}}</p>
              <div class="my-3">
                {{topics}}
              </div>
              <a class="sidebar-link" href="#readme-ov-file">
                <svg viewBox="0 0 16 16"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z"></path></svg>
                Readme
              </a>
              <a class="sidebar-link" href="#">
                <svg viewBox="0 0 16 16"><path d="M8.75.75V2h.985c.304 0 .603.08.867.231l1.29.736c.038.022.08.033.124.033h2.234a.75.75 0 0 1 0 1.5h-.427l2.111 4.692a.75.75 0 0 1-.154.838l-.53-.53.529.531-.001.002-.002.002-.006.006-.006.005-.01.01-.045.04c-.21.176-.441.327-.686.45C14.556 10.78 13.88 11 13 11a4.498 4.498 0 0 1-2.023-.454 3.544 3.544 0 0 1-.686-.45l-.045-.04-.016-.015-.006-.006-.004-.004v-.001a.75.75 0 0 1-.154-.838L12.178 4.5h-.162c-.305 0-.604-.079-.868-.231l-1.29-.736a.245.245 0 0 0-.124-.033H8.75V13h2.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5h2.5V3.5h-.984a.245.245 0 0 0-.124.033l-1.289.737c-.265.15-.564.23-.869.23h-.162l2.112 4.692a.75.75 0 0 1-.154.838l-.53-.53.529.531-.001.002-.002.002-.006.006-.016.015-.045.04c-.21.176-.441.327-.686.45C4.556 10.78 3.88 11 3 11a4.498 4.498 0 0 1-2.023-.454 3.544 3.544 0 0 1-.686-.45l-.045-.04-.016-.015-.006-.006-.004-.004v-.001a.75.75 0 0 1-.154-.838L2.178 4.5H1.75a.75.75 0 0 1 0-1.5h2.234a.249.249 0 0 0 .125-.033l1.288-.737c.265-.15.564-.23.869-.23h.984V.75a.75.75 0 0 1 1.5 0Zm2.945 8.477c.285.135.718.273 1.305.273s1.02-.138 1.305-.273L13 6.327Zm-10 0c.285.135.718.273 1.305.273s1.02-.138 1.305-.273L3 6.327Z"></path></svg>
                MIT license
              </a>
              <a class="sidebar-link" href="#">
                <svg viewBox="0 0 16 16"><path d="M6 2c.306 0 .582.187.696.471L10 10.731l1.304-3.26A.751.751 0 0 1 12 7h3.25a.75.75 0 0 1 0 1.5h-2.742l-1.812 4.528a.751.751 0 0 1-1.392 0L6 4.77 4.696 8.03A.75.75 0 0 1 4 8.5H.75a.75.75 0 0 1 0-1.5h2.742l1.812-4.529A.751.751 0 0 1 6 2Z"></path></svg>
                Activity
              </a>
              <a class="sidebar-link" href="#">
                <svg viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path></svg>
                <strong>{{stars}}</strong> stars
              </a>
              <a class="sidebar-link" href="#">
                <svg viewBox="0 0 16 16"><path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"></path></svg>
                <strong>{{watchers}}</strong> watching
              </a>
              <a class="sidebar-link" href="#">
                <svg viewBox="0 0 16 16"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg>
                <strong>{{forks}}</strong> forks
              </a>
            </div>
          </div>
          <div class="BorderGrid-row">
            <div class="BorderGrid-cell">
              <h2>Languages</h2>
              <div class="Progress">
                <span class="Progress-item" style="width: 100%; background-color: #083fa1;"></span>
              </div>
              <ul class="lang-list">
                <li class="lang-item">
                  <span class="lang-dot" style="background-color: #083fa1;"></span>
                  <span class="lang-name">Markdown</span>
                  <span class="lang-percent">100%</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="toast" id="toast"></div>
  <script>
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.close(); });
    window.addEventListener('beforeunload', () => { fetch('/close'); });
  </script>
</body>
</html>`;

function highlightCode(code: string, language: string): string {
  if (language && hljs.getLanguage(language)) {
    return hljs.highlight(code, { language }).value;
  }
  return hljs.highlightAuto(code).value;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

const ALERT_ICONS: Record<string, string> = {
  note: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>',
  tip: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg>',
  important:
    '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
  warning:
    '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
  caution:
    '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>',
};

function processAlerts(html: string): string {
  const alertBlockRegex = /<blockquote>([\s\S]*?)<\/blockquote>/gi;
  const alertPrefixRegex =
    /^\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:<br\s*\/?>(?:\s*)?|\s)*/i;

  return html.replace(alertBlockRegex, (match, inner) => {
    const prefixMatch = inner.match(alertPrefixRegex);
    if (!prefixMatch) {
      return match;
    }

    const typeKey = prefixMatch[1].toLowerCase();
    const icon = ALERT_ICONS[typeKey] || "";
    const title =
      prefixMatch[1].charAt(0) + prefixMatch[1].slice(1).toLowerCase();
    const cleanedContent = inner.replace(alertPrefixRegex, "<p>").trim();

    return `<div class="markdown-alert markdown-alert-${typeKey}">
      <p class="markdown-alert-title">${icon}${title}</p>
      ${cleanedContent}
    </div>`;
  });
}

function renderMarkdown(content: string): string {
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: false, // Match GitHub's single-line break behavior
    pedantic: false, // Conform to original markdown.pl
    smartLists: true, // Use smarter list behavior
    smartypants: false, // Use "smart" typographic punctuation
    mangle: false, // Don't mangle emails
    headerIds: false, // We handle header IDs manually for GitHub-style anchors
  });

  const renderer = new marked.Renderer();

  // Code blocks with syntax highlighting
  renderer.code = ({ text, lang }) => {
    if (lang) {
      return `<pre><code class="hljs language-${lang}">${highlightCode(text, lang)}</code></pre>`;
    }
    return `<pre><code class="hljs">${highlightCode(text, "")}</code></pre>`;
  };

  // Headings with anchor links
  renderer.heading = ({ text, depth }) => {
    const slug = slugify(text);
    const anchorIcon =
      '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"></path></svg>';
    return `<h${depth} id="${slug}"><a class="anchor" href="#${slug}">${anchorIcon}</a>${text}</h${depth}>\n`;
  };

  // List with task list support
  renderer.list = (token) => {
    const body = token.items
      .map((item: { task?: boolean; checked?: boolean; tokens: unknown[] }) => {
        // Parse tokens as block content (handles nested lists properly)
        const text = marked.parser(item.tokens as marked.Token[], { renderer });
        if (item.task) {
          const checkbox = item.checked
            ? '<input type="checkbox" class="task-list-item-checkbox" checked disabled>'
            : '<input type="checkbox" class="task-list-item-checkbox" disabled>';
          return `<li class="task-list-item">${checkbox}${text}</li>\n`;
        }
        return `<li>${text}</li>\n`;
      })
      .join("");
    const isTaskList = token.items.some(
      (item: { task?: boolean }) => item.task,
    );
    const listClass = isTaskList ? ' class="contains-task-list"' : "";
    if (token.ordered) {
      const startAttr = token.start !== 1 ? ` start="${token.start}"` : "";
      return `<ol${startAttr}${listClass}>\n${body}</ol>\n`;
    }
    return `<ul${listClass}>\n${body}</ul>\n`;
  };

  let html = marked.parse(content, { renderer }) as string;
  html = processAlerts(html);

  return html;
}

function extractDescription(content: string): string {
  // Try to find first paragraph after any heading
  const lines = content.split("\n");
  let foundHeading = false;
  let description = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      foundHeading = true;
      continue;
    }
    if (
      foundHeading &&
      trimmed &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("-") &&
      !trimmed.startsWith("*") &&
      !trimmed.startsWith("`")
    ) {
      description = trimmed.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // Remove markdown links
      break;
    }
  }

  return description || "No description provided.";
}

function extractTopics(repoName: string): string {
  // Generate some placeholder topics based on repo name
  const topics = ["markdown", "preview", "documentation"];
  return topics.map((t) => `<a href="#" class="topic-tag">${t}</a>`).join("");
}

function getHtml(
  filename: string,
  content: string,
  fileTree: string,
  repoName: string,
  dirPath: string,
): string {
  const rendered = renderMarkdown(content);
  const description = extractDescription(content);
  const topics = extractTopics(repoName);

  return HTML_TEMPLATE.replace(/\{\{filename\}\}/g, filename)
    .replace("{{content}}", rendered)
    .replace("{{fileTree}}", fileTree)
    .replace(/\{\{repoName\}\}/g, repoName)
    .replace("{{dirPath}}", dirPath)
    .replace("{{description}}", description)
    .replace("{{topics}}", topics)
    .replace("{{stars}}", "0")
    .replace("{{watchers}}", "1")
    .replace("{{forks}}", "0");
}

function showToast(message: string): void {
  console.log(`[peekmd] ${message}`);
}

async function openBrowser(url: string): Promise<void> {
  const { execSync } = await import("child_process");
  const platform = process.platform;

  try {
    if (platform === "darwin") {
      execSync(`open "${url}"`, { stdio: "ignore" });
    } else if (platform === "win32") {
      execSync(`start "" "${url}"`, { stdio: "ignore" });
    } else {
      execSync(`xdg-open "${url}"`, { stdio: "ignore" });
    }
  } catch {
    showToast(
      "Could not open browser automatically. Please open the URL manually.",
    );
  }
}

interface ServerState {
  port: number;
  isOpen: boolean;
}

const state: ServerState = { port: 0, isOpen: false };

export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: peekmd <file.md>");
    console.log(
      "  Opens a GitHub-style preview of a markdown file in your default browser.",
    );
    process.exit(1);
  }

  const filePath = args[0];

  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const ext = extname(filePath).toLowerCase();
  if (ext !== ".md" && ext !== ".markdown" && ext !== ".mdown") {
    console.warn(`Warning: File '${filePath}' may not be a markdown file.`);
  }

  const content = readFileSync(filePath, "utf-8");
  const filename = filePath.split(sep).pop() || filePath;
  const repoName = getDirName(filePath);
  const dirPath = getRelativePath(filePath) || "";
  const fileTree = renderFileTree(getFileTree(process.cwd(), 3));

  const port = 3456;
  state.port = port;

  const server = Bun.serve({
    port,
    routes: {
      "/": {
        GET: () => {
          const html = getHtml(filename, content, fileTree, repoName, dirPath);
          return new Response(html, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        },
      },
      "/close": {
        GET: () => {
          state.isOpen = false;
          setTimeout(() => {
            if (!state.isOpen) {
              server.stop();
              showToast("Server closed.");
            }
          }, 1000);
          return new Response("ok");
        },
      },
    },
    development: false,
  });

  const url = `http://localhost:${port}`;
  showToast(`Serving ${filename} at ${url}`);
  showToast("Press ESC or close this window to exit.");

  await openBrowser(url);
  state.isOpen = true;
}

