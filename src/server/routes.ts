import type { Server } from "bun";
import { getHtml, type TemplateData } from "../template/html.ts";
import {
  isAssetRequest,
  extractAssetPath,
  serveAsset,
  rewriteAssetUrls,
} from "./assets.ts";
import {
  renderMarkdown,
  extractDescription,
  extractTopics,
} from "../markdown/parser.ts";
import { getFileTree, renderFileTree } from "../utils/file-tree.ts";

export interface RouteContext {
  filename: string;
  getContent: () => string;
  repoName: string;
  dirPath: string;
  markdownDir: string;
  server: Server<unknown> | null;
  onClose: () => void;
  onPing: () => void;
}

export async function handleRequest(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Asset proxy route
  if (isAssetRequest(pathname)) {
    const assetPath = extractAssetPath(pathname);
    const response = await serveAsset(assetPath, context.markdownDir);
    return response || new Response("Not found", { status: 404 });
  }

  // Close endpoint
  if (pathname === "/close") {
    context.onClose();
    return new Response("ok");
  }

  // Ping endpoint (keep alive on refresh)
  if (pathname === "/ping") {
    context.onPing();
    return new Response("ok");
  }

  // Main page
  if (pathname === "/") {
    return new Response(renderPage(context), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new Response("Not found", { status: 404 });
}

function renderPage(context: RouteContext): string {
  const content = context.getContent();
  const renderedContent = renderMarkdown(content);
  const contentWithProxiedAssets = rewriteAssetUrls(
    renderedContent,
    context.markdownDir,
  );
  const fileTree = renderFileTree(getFileTree(context.markdownDir, 3));
  const description = extractDescription(content);
  const topics = extractTopics(context.repoName)
    .map((t) => `<a href="#" class="topic-tag">${t}</a>`)
    .join("");

  const templateData: TemplateData = {
    filename: context.filename,
    content: contentWithProxiedAssets,
    rawContent: content,
    fileTree,
    repoName: context.repoName,
    dirPath: context.dirPath,
    description,
    topics,
  };

  return getHtml(templateData);
}
