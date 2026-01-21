import { dirname, sep, resolve, extname, normalize } from "path";
import { existsSync, statSync } from "fs";

export function getDirName(filePath: string): string {
  const dir = dirname(filePath);
  return dir.split(sep).pop() || "peekmd";
}

export function getRelativePath(filePath: string): string {
  const dir = dirname(filePath);
  return dir === "." ? "" : dir;
}

export function getFilename(filePath: string): string {
  return filePath.split(sep).pop() || filePath;
}

export function isMarkdownFile(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return ext === ".md" || ext === ".markdown" || ext === ".mdown";
}

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

export function getContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || "application/octet-stream";
}

export function resolveAssetPath(
  assetPath: string,
  markdownDir: string,
  cwd: string = process.cwd(),
): string | null {
  // Normalize the path to prevent directory traversal
  const normalizedPath = normalize(assetPath);

  // Block directory traversal attempts
  if (normalizedPath.includes("..")) {
    return null;
  }

  // Handle absolute paths
  if (normalizedPath.startsWith("/")) {
    if (existsSync(normalizedPath) && isValidAssetPath(normalizedPath, cwd)) {
      return normalizedPath;
    }
    return null;
  }

  // Resolution order:
  // 1. Relative to markdown file directory
  const relativeToMd = resolve(markdownDir, normalizedPath);
  if (existsSync(relativeToMd) && isValidAssetPath(relativeToMd, cwd)) {
    return relativeToMd;
  }

  // 2. Relative to CWD
  const relativeToCwd = resolve(cwd, normalizedPath);
  if (existsSync(relativeToCwd) && isValidAssetPath(relativeToCwd, cwd)) {
    return relativeToCwd;
  }

  return null;
}

function isValidAssetPath(resolvedPath: string, cwd: string): boolean {
  // Security: ensure path is within allowed directories
  const normalizedResolved = normalize(resolvedPath);
  const normalizedCwd = normalize(cwd);

  // Path must be within CWD or its subdirectories
  if (!normalizedResolved.startsWith(normalizedCwd)) {
    return false;
  }

  // Must be a file, not a directory
  try {
    return statSync(resolvedPath).isFile();
  } catch {
    return false;
  }
}
