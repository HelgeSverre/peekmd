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
  // GitHub-style hardcoded file listing
  return `<table class="Table-module__Box--KyMHK" aria-labelledby="folders-and-files">
  <thead class="DirectoryContent-module__OverviewHeaderRow--FlrUZ Table-module__Box_1--DkRqs">
    <tr class="Table-module__Box_2--l1wjV">
      <th colspan="2" class="DirectoryContent-module__Box--y3Nvf"><span class="text-bold">Name</span></th>
      <th class="hide-sm"><span class="text-bold">Last commit message</span></th>
      <th colspan="1" class="DirectoryContent-module__Box_2--h912w"><span class="text-bold">Last commit date</span></th>
    </tr>
  </thead>
  <tbody>
    <tr class="react-directory-row" id="folder-row-0">
      <td class="react-directory-row-name-cell-small-screen" colspan="2">
        <div class="react-directory-filename-column">
          <svg aria-hidden="true" focusable="false" class="octicon octicon-file color-fg-muted" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path></svg>
          <div class="overflow-hidden">
            <div class="react-directory-filename-cell">
              <div class="react-directory-truncate"><a title=".gitignore" class="Link--primary" href="#">.gitignore</a></div>
            </div>
          </div>
        </div>
      </td>
      <td class="react-directory-row-commit-cell hide-sm">
        <div class="react-directory-commit-message"><a data-pjax="true" title="Initial commit" class="Link--secondary" href="#">Initial commit</a></div>
      </td>
      <td>
        <div class="react-directory-commit-age">2 days ago</div>
      </td>
    </tr>
    <tr class="react-directory-row" id="folder-row-1">
      <td class="react-directory-row-name-cell-small-screen" colspan="2">
        <div class="react-directory-filename-column">
          <svg aria-hidden="true" focusable="false" class="octicon octicon-file color-fg-muted" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path></svg>
          <div class="overflow-hidden">
            <div class="react-directory-filename-cell">
              <div class="react-directory-truncate"><a title="README.md" class="Link--primary" href="#">README.md</a></div>
            </div>
          </div>
        </div>
      </td>
      <td class="react-directory-row-commit-cell hide-sm">
        <div class="react-directory-commit-message"><a data-pjax="true" title="Update README" class="Link--secondary" href="#">Update README</a></div>
      </td>
      <td>
        <div class="react-directory-commit-age">1 day ago</div>
      </td>
    </tr>
    <tr class="react-directory-row" id="folder-row-2">
      <td class="react-directory-row-name-cell-small-screen" colspan="2">
        <div class="react-directory-filename-column">
          <svg aria-hidden="true" focusable="false" class="octicon octicon-file color-fg-muted" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path></svg>
          <div class="overflow-hidden">
            <div class="react-directory-filename-cell">
              <div class="react-directory-truncate"><a title="package.json" class="Link--primary" href="#">package.json</a></div>
            </div>
          </div>
        </div>
      </td>
      <td class="react-directory-row-commit-cell hide-sm">
        <div class="react-directory-commit-message"><a data-pjax="true" title="Add dependencies" class="Link--secondary" href="#">Add dependencies</a></div>
      </td>
      <td>
        <div class="react-directory-commit-age">3 days ago</div>
      </td>
    </tr>
    <tr class="react-directory-row" id="folder-row-3">
      <td class="react-directory-row-name-cell-small-screen" colspan="2">
        <div class="react-directory-filename-column">
          <svg aria-hidden="true" focusable="false" class="octicon octicon-file-directory-fill color-fg-muted" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path></svg>
          <div class="overflow-hidden">
            <div class="react-directory-filename-cell">
              <div class="react-directory-truncate"><a title="src" class="Link--primary" href="#">src</a></div>
            </div>
          </div>
        </div>
      </td>
      <td class="react-directory-row-commit-cell hide-sm">
        <div class="react-directory-commit-message"><a data-pjax="true" title="Add source files" class="Link--secondary" href="#">Add source files</a></div>
      </td>
      <td>
        <div class="react-directory-commit-age">5 days ago</div>
      </td>
    </tr>
  </tbody>
</table>`;
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
    *, *::before, *::after { transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, fill 0.2s ease; }
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
    .AppHeader-logo { position: relative; cursor: pointer; width: 32px; height: 32px; flex-shrink: 0; }
    .AppHeader-logo svg, .AppHeader-logo img { position: absolute; top: 0; left: 0; width: 32px; height: 32px; transition: opacity 0.15s ease, fill 0.2s ease; }
    .AppHeader-logo svg { fill: #fff; opacity: 1; }
    .AppHeader-logo img { border-radius: 50%; opacity: 0; }
    .AppHeader-logo:hover svg { opacity: 0; }
    .AppHeader-logo:hover img { opacity: 1; }
    .AppHeader-search {
      flex: 1;
      max-width: 272px;
      height: 30px;
      background: hsla(0,0%,100%,.08);
      border: 1px solid hsla(0,0%,100%,.2);
      border-radius: 6px;
      padding: 0 12px;
      color: #fff;
      font-size: 14px;
      outline: none;
    }
    .AppHeader-search:focus { border-color: #58a6ff; background: hsla(0,0%,100%,.12); }
    .AppHeader-search::placeholder { color: hsla(0,0%,100%,.5); }
    .AppHeader-nav { display: flex; align-items: center; gap: 16px; margin-left: auto; }
    .AppHeader-nav a { color: #fff; text-decoration: none; font-size: 14px; font-weight: 600; line-height: 1; }
    .AppHeader-nav a:hover { color: hsla(0,0%,100%,.7); }
    .dark-toggle { background: none; border: 1px solid hsla(0,0%,100%,.3); border-radius: 6px; width: 28px; height: 28px; padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .dark-toggle:hover { background: hsla(0,0%,100%,.1); }
    .dark-toggle svg { width: 16px; height: 16px; stroke: #fff; flex-shrink: 0; }
    .dark-toggle .icon-moon { display: none; }

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
      margin-bottom: 16px;
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

    /* File Tree - GitHub Table Styles */
    .Table-module__Box--KyMHK { width: 100%; border-collapse: separate; border-spacing: 0; }
    .DirectoryContent-module__OverviewHeaderRow--FlrUZ { background: #f6f8fa; }
    .Table-module__Box_1--DkRqs th { padding: 8px 16px; text-align: left; font-size: 12px; font-weight: 600; border-bottom: 1px solid #d0d7de; }
    .DirectoryContent-module__Box--y3Nvf { width: 40%; }
    .DirectoryContent-module__Box_2--h912w { width: 15%; }
    .hide-sm { display: none; }
    @media (min-width: 768px) { .hide-sm { display: table-cell; } }
    .react-directory-row { border-bottom: 1px solid #d0d7de; }
    .react-directory-row:hover { background: #f6f8fa; }
    .react-directory-row td { padding: 8px 16px; vertical-align: middle; }
    .react-directory-filename-column { display: flex; align-items: center; gap: 8px; }
    .react-directory-filename-column svg { flex-shrink: 0; }
    .react-directory-filename-column .overflow-hidden { flex: 1; min-width: 0; }
    .react-directory-filename-cell { overflow: hidden; }
    .react-directory-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .react-directory-truncate a { color: #0969da; text-decoration: none; font-size: 14px; }
    .react-directory-truncate a:hover { text-decoration: underline; }
    .react-directory-commit-message { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .react-directory-commit-message a { color: #656d76; text-decoration: none; font-size: 14px; }
    .react-directory-commit-message a:hover { color: #0969da; text-decoration: underline; }
    .react-directory-commit-age { color: #656d76; font-size: 14px; white-space: nowrap; }
    .text-bold { font-weight: 600; }
    .Link--primary { color: #0969da; }
    .Link--secondary { color: #656d76; }
    .color-fg-muted { fill: #656d76; }
    .octicon { display: inline-block; vertical-align: text-bottom; }


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

    /* Dark mode */
    .dark { color-scheme: dark; }
    .dark body { background: #0d1117; color: #e6edf3; }
    .dark .repohead { background: #161b22; border-color: #30363d; }
    .dark .repohead-details-container svg { fill: #e6edf3; }
    .dark .repohead-details-container a { color: #58a6ff; }
    .dark .repohead-details-container span { color: #8b949e; }
    .dark .UnderlineNav { background: #161b22; border-color: #30363d; }
    .dark .UnderlineNav-item { color: #e6edf3; }
    .dark .UnderlineNav-item:hover { background: #30363d; }
    .dark .UnderlineNav-item.selected { border-color: #f78166; }
    .dark .Layout-sidebar { background: #0d1117; border-color: #30363d; }
    .dark .Box { background: #161b22; border-color: #30363d; }
    .dark .Box-header { background: #161b22; border-color: #30363d; }
    .dark .Box-header .btn-octicon { color: #8b949e; }
    .dark .markdown-body { background: #0d1117; color: #e6edf3; }
    .dark .markdown-body h1, .dark .markdown-body h2 { border-color: #30363d; }
    .dark .markdown-body a { color: #58a6ff; }
    .dark .markdown-body code { background: rgba(110,118,129,0.4); }
    .dark .markdown-body pre { background: #161b22; }
    .dark .markdown-body blockquote { color: #8b949e; border-color: #30363d; }
    .dark .markdown-body table th, .dark .markdown-body table td { border-color: #30363d; }
    .dark .markdown-body table th { background: #161b22; }
    .dark .markdown-body table tr { background: #0d1117; border-color: #30363d; }
    .dark .markdown-body table tr:nth-child(2n) { background: #161b22; }
    .dark .markdown-body hr { background: #30363d; }
    .dark .Table-module__Box--KyMHK { background: #0d1117; }
    .dark .DirectoryContent-module__OverviewHeaderRow--FlrUZ { background: #161b22; }
    .dark .Table-module__Box_1--DkRqs th { border-bottom-color: #30363d; color: #e6edf3; }
    .dark .react-directory-row { border-bottom-color: #30363d; }
    .dark .react-directory-row:hover { background: #161b22; }
    .dark .react-directory-truncate a { color: #58a6ff; }
    .dark .react-directory-commit-message a { color: #8b949e; }
    .dark .react-directory-commit-message a:hover { color: #58a6ff; }
    .dark .react-directory-commit-age { color: #8b949e; }
    .dark .Link--primary { color: #58a6ff; }
    .dark .Link--secondary { color: #8b949e; }
    .dark .color-fg-muted { fill: #8b949e; }
    .dark .dark-toggle .icon-sun { display: none; }
    .dark .dark-toggle .icon-moon { display: block; }

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
      <img src="data:image/png;base64,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" alt="avatar">
    </div>    <input type="text" class="AppHeader-search" placeholder="Search or jump to...">
    <nav class="AppHeader-nav">
      <a href="#">Pull requests</a>
      <a href="#">Issues</a>
      <a href="#">Marketplace</a>
      <a href="#">Explore</a>
      <button class="dark-toggle" id="darkToggle" title="Toggle dark mode">
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
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
        <!-- File Tree Box -->
        <article class="Box">
          <div class="Box-header">
            <div class="Box-header-title">
              <svg viewBox="0 0 16 16"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path></svg>
              {{dirPath}}
            </div>
          </div>
          {{fileTree}}
        </article>

        <!-- README Box -->
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

    // Dark mode
    const toggle = document.getElementById('darkToggle');
    const setDark = (dark) => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('dark', dark); };
    const stored = localStorage.getItem('dark');
    setDark(stored !== null ? stored === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches);
    toggle.addEventListener('click', () => setDark(!document.documentElement.classList.contains('dark')));
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
