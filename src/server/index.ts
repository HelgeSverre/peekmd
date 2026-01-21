import type { Server } from "bun";
import getPort from "get-port";
import { handleRequest, type RouteContext } from "./routes.ts";

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

export interface CreateServerResult {
  server: Server;
  port: number;
}

export async function createServer(
  options: ServerOptions,
  state: ServerState,
): Promise<CreateServerResult> {
  const preferredPort = options.port || 3456;
  const port = await getPort({ port: preferredPort });

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} in use, using ${port} instead.`);
  }

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
        }
      }, 1000);
    },
    onPing: () => {
      state.isOpen = true;
    },
  };

  const server = Bun.serve({
    port,
    fetch: (request) => handleRequest(request, context),
    development: false,
  });

  context.server = server;
  state.server = server;

  return { server, port };
}
