import { getStyles } from "./styles.ts";
import { getScripts, getMermaidInit } from "./scripts.ts";
import {
  ACTIVITY_ICON,
  CHEVRON_DOWN_ICON,
  CHEVRON_RIGHT_ICON,
  CODE_ICON,
  COPY_ICON,
  EYE_ICON,
  FOLDER_ICON,
  GIT_BRANCH_ICON,
  GIT_PULL_REQUEST_ICON,
  GITHUB_LOGO,
  GRAPH_ICON,
  ISSUE_ICON,
  LICENSE_ICON,
  MOON_ICON,
  PLAY_ICON,
  PROJECTS_ICON,
  README_ICON,
  REPO_ICON,
  SHIELD_ICON,
  STAR_ICON,
  SUN_ICON,
} from "./icons.ts";

export interface TemplateData {
  filename: string;
  content: string;
  rawContent: string;
  fileTree: string;
  repoName: string;
  dirPath: string;
  description: string;
  topics: string;
  stars?: string;
  watchers?: string;
  forks?: string;
}

interface NavItem {
  icon: string;
  label: string;
  selected?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: CODE_ICON, label: "Code", selected: true },
  { icon: ISSUE_ICON, label: "Issues" },
  { icon: GIT_PULL_REQUEST_ICON, label: "Pull requests" },
  { icon: PLAY_ICON, label: "Actions" },
  { icon: PROJECTS_ICON, label: "Projects" },
  { icon: SHIELD_ICON, label: "Security" },
  { icon: GRAPH_ICON, label: "Insights" },
];

function renderNav(): string {
  return NAV_ITEMS.map(
    (item) =>
      `<a href="#" class="UnderlineNav-item${item.selected ? " selected" : ""}">${item.icon}${item.label}</a>`,
  ).join("\n      ");
}

export function getHtml(data: TemplateData): string {
  const styles = getStyles();
  const scripts = getScripts();
  const mermaidInit = getMermaidInit();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.filename} - ${data.repoName}</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📝</text></svg>">
  <script type="module">${mermaidInit}</script>
  <style>${styles}</style>
</head>
<body>
  <header class="AppHeader" data-testid="header">
    <div class="AppHeader-logo">
      ${GITHUB_LOGO}
    </div>
    <input class="AppHeader-search" type="text" placeholder="Search or jump to..." readonly>
    <nav class="AppHeader-nav">
      <a href="#">Pull requests</a>
      <a href="#">Issues</a>
      <button class="dark-toggle" id="darkToggle" data-testid="theme-toggle" data-tooltip="Toggle dark mode">
        ${SUN_ICON}
        ${MOON_ICON}
      </button>
      <a class="btn-sign-in" href="#">Sign in</a>
    </nav>
  </header>

  <div class="repohead">
    <div class="repohead-details-container">
      ${REPO_ICON}
      <div class="repohead-name">
        <a href="#">${data.repoName}</a>
        <span class="separator">/</span>
        <a href="#">${data.filename}</a>
      </div>
    </div>
  </div>

  <nav class="UnderlineNav" data-testid="repo-nav">
    <div class="UnderlineNav-body">
      ${renderNav()}
    </div>
  </nav>

  <div class="container-xl">
    <div class="Layout">
      <div class="Layout-main">
        <div class="Box">
          <details class="Box-tree" data-testid="file-tree" open>
            <summary class="Box-header">
              <div class="Box-header-title">
                ${FOLDER_ICON}
                ${data.dirPath || "."}
              </div>
              <span class="Box-header-actions">
                <button class="btn-icon" id="copyBtn" data-testid="copy-button" aria-label="Copy" data-tooltip="Copy">
                  ${COPY_ICON}
                </button>
                <span class="details-toggle">
                  ${CHEVRON_DOWN_ICON}
                  ${CHEVRON_RIGHT_ICON}
                </span>
              </span>
            </summary>
            ${data.fileTree}
          </details>
          <div class="Box-readme">
            <div class="markdown-body" data-testid="markdown-body">${data.content}</div>
          </div>
        </div>
      </div>
      <div class="Layout-sidebar" data-testid="sidebar">
        <div class="BorderGrid">
          <div class="BorderGrid-row">
            <div class="BorderGrid-cell sidebar-about">
              <h2>About</h2>
              <p>${data.description}</p>
              <div class="my-3">
                ${data.topics}
              </div>
              <a class="sidebar-link" href="#readme-ov-file">
                ${README_ICON}
                Readme
              </a>
              <a class="sidebar-link" href="#">
                ${LICENSE_ICON}
                MIT license
              </a>
              <a class="sidebar-link" href="#">
                ${ACTIVITY_ICON}
                Activity
              </a>
              <a class="sidebar-link" href="#">
                ${STAR_ICON}
                <strong>${data.stars || "0"}</strong> stars
              </a>
              <a class="sidebar-link" href="#">
                ${EYE_ICON}
                <strong>${data.watchers || "1"}</strong> watching
              </a>
              <a class="sidebar-link" href="#">
                ${GIT_BRANCH_ICON}
                <strong>${data.forks || "0"}</strong> forks
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
  <script id="raw-content" type="application/json">${JSON.stringify(data.rawContent)}</script>
  <script>${scripts}</script>
</body>
</html>`;
}
