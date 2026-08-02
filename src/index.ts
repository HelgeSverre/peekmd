// Public API exports
export {
  renderMarkdown,
  createParser,
  extractDescription,
  extractTopics,
  type ParserOptions,
} from "./markdown/parser.ts";
export {
  processAlerts,
  ALERT_ICONS,
  type AlertType,
} from "./markdown/plugins/alerts.ts";
export { slugify } from "./markdown/plugins/anchors.ts";
export { highlightCode } from "./markdown/plugins/highlight.ts";

export {
  getFileTree,
  renderFileTree,
  formatSize,
  type FileNode,
} from "./utils/file-tree.ts";
export {
  getDirName,
  getRelativePath,
  getFilename,
  isMarkdownFile,
  getContentType,
  resolveAssetPath,
} from "./utils/paths.ts";
export { openBrowser } from "./utils/browser.ts";
export { watchFile } from "./utils/watcher.ts";

export {
  createServer,
  type ServerOptions,
  type ServerState,
  type CreateServerResult,
} from "./server/index.ts";
export { getHtml, type TemplateData } from "./template/html.ts";

export { main } from "./cli.ts";
