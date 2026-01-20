import { dirname } from "path";
import { resolveAssetPath, getContentType } from "../utils/paths.ts";

const ASSETS_PREFIX = "/__assets__/";

export function isAssetRequest(pathname: string): boolean {
  return pathname.startsWith(ASSETS_PREFIX);
}

export function extractAssetPath(pathname: string): string {
  return decodeURIComponent(pathname.slice(ASSETS_PREFIX.length));
}

export async function serveAsset(
  assetPath: string,
  markdownDir: string,
): Promise<Response | null> {
  const resolvedPath = resolveAssetPath(assetPath, markdownDir);

  if (!resolvedPath) {
    return new Response("Asset not found", { status: 404 });
  }

  try {
    const file = Bun.file(resolvedPath);
    const exists = await file.exists();

    if (!exists) {
      return new Response("Asset not found", { status: 404 });
    }

    const contentType = getContentType(resolvedPath);

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch {
    return new Response("Error serving asset", { status: 500 });
  }
}

export function rewriteAssetUrls(html: string, _markdownDir: string): string {
  // Rewrite relative image src attributes to use the asset proxy
  // Matches: src="./path" src="../path" src="path" (not http:// or data:)
  return html.replace(
    /(<img[^>]*\ssrc=["'])(?!https?:\/\/|data:|\/\/)([^"']+)(["'][^>]*>)/gi,
    (match, prefix, src, suffix) => {
      // Skip if already proxied
      if (src.startsWith(ASSETS_PREFIX)) {
        return match;
      }
      return `${prefix}${ASSETS_PREFIX}${encodeURIComponent(src)}${suffix}`;
    },
  );
}
