import type { Server } from "bun";
import { handleRequest, type RouteContext } from "./routes.ts";
import { showToast } from "../utils/browser.ts";

export interface ServerOptions {
  port?: number;
  filename: string;
  content: string;
  repoName: string;
  dirPath: string;
  markdownDir: string;
}

export interface ServerState {
  server: Server | null;
  isOpen: boolean;
}

export function createServer(
  options: ServerOptions,
  state: ServerState,
): Server {
  const port = options.port || 3456;

  const context: RouteContext = {
    filename: options.filename,
    content: options.content,
    repoName: options.repoName,
    dirPath: options.dirPath,
    markdownDir: options.markdownDir,
    server: null,
    onClose: () => {
      state.isOpen = false;
      setTimeout(() => {
        if (!state.isOpen && state.server) {
          state.server.stop();
          showToast("Server closed.");
        }
      }, 1000);
    },
  };

  const server = Bun.serve({
    port,
    fetch: (request) => handleRequest(request, context),
    development: false,
  });

  context.server = server;
  state.server = server;

  return server;
}
