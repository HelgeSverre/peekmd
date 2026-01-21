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
  content: string;
  repoName: string;
  dirPath: string;
  markdownDir: string;
  server: Server | null;
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
    const renderedContent = renderMarkdown(context.content);
    const contentWithProxiedAssets = rewriteAssetUrls(
      renderedContent,
      context.markdownDir,
    );
    const fileTree = renderFileTree(getFileTree(process.cwd(), 3));
    const description = extractDescription(context.content);
    const topics = extractTopics(context.repoName)
      .map((t) => `<a href="#" class="topic-tag">${t}</a>`)
      .join("");

    const templateData: TemplateData = {
      filename: context.filename,
      content: contentWithProxiedAssets,
      fileTree,
      repoName: context.repoName,
      dirPath: context.dirPath,
      description,
      topics,
    };

    const html = getHtml(templateData);
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new Response("Not found", { status: 404 });
}
