import type { Server, ServerWebSocket } from "bun";
import getPort from "get-port";
import { handleRequest, type RouteContext } from "./routes.ts";
import { watchFile } from "../utils/watcher.ts";

export interface ServerOptions {
  port?: number;
  filePath: string;
  filename: string;
  content: string;
  repoName: string;
  dirPath: string;
  markdownDir: string;
}

export interface ServerState {
  server: Server<unknown> | null;
  isOpen: boolean;
}

export interface CreateServerResult {
  server: Server<unknown>;
  port: number;
  stop: () => void;
}

type Client = ServerWebSocket<unknown>;

export async function createServer(
  options: ServerOptions,
  state: ServerState,
): Promise<CreateServerResult> {
  const preferredPort = options.port || 3456;
  const port = await getPort({ port: preferredPort });

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} in use, using ${port} instead.`);
  }

  let content = options.content;
  const clients = new Set<Client>();

  const context: RouteContext = {
    filename: options.filename,
    getContent: () => content,
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

  const broadcastReload = () => {
    for (const client of clients) {
      client.send("reload");
    }
  };

  const reloadFromDisk = async () => {
    try {
      content = await Bun.file(options.filePath).text();
      broadcastReload();
    } catch {
      // File temporarily unreadable (mid-save) - ignore, next event will retry
    }
  };

  const unwatch = watchFile(options.filePath, reloadFromDisk);

  const server = Bun.serve({
    port,
    fetch: (request, server) => {
      const url = new URL(request.url);

      if (url.pathname === "/ws") {
        if (server.upgrade(request)) return;
        return new Response("Upgrade failed", { status: 400 });
      }

      return handleRequest(request, context);
    },
    websocket: {
      open: (ws) => {
        clients.add(ws);
      },
      close: (ws) => {
        clients.delete(ws);
      },
      message: () => {},
    },
    development: false,
  });

  context.server = server;
  state.server = server;

  return {
    server,
    port,
    stop: () => {
      unwatch();
      server.stop();
    },
  };
}
