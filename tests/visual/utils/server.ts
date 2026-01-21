import { resolve, dirname } from "path";
import { createServer, type ServerState } from "../../../src/server/index.ts";
import {
  getDirName,
  getRelativePath,
  getFilename,
} from "../../../src/utils/paths.ts";

export interface TestServer {
  url: string;
  port: number;
  stop: () => void;
}

export async function startTestServer(
  markdownPath: string,
  port?: number,
): Promise<TestServer> {
  const filePath = resolve(markdownPath);
  const content = await Bun.file(filePath).text();
  const filename = getFilename(filePath);
  const repoName = getDirName(filePath);
  const dirPath = getRelativePath(filePath) || "";
  const markdownDir = dirname(filePath);

  // Find an available port if not specified
  const serverPort = port || (await findAvailablePort());

  const state: ServerState = { server: null, isOpen: true };

  const { server } = await createServer(
    {
      port: serverPort,
      filename,
      content,
      repoName,
      dirPath,
      markdownDir,
    },
    state,
  );

  const url = `http://localhost:${serverPort}`;

  // Wait for server to be ready
  await waitForServer(url);

  return {
    url,
    port: serverPort,
    stop: () => {
      server.stop();
    },
  };
}

async function findAvailablePort(startPort: number = 4000): Promise<number> {
  for (let port = startPort; port < startPort + 100; port++) {
    try {
      const testServer = Bun.serve({
        port,
        fetch: () => new Response("test"),
      });
      testServer.stop();
      return port;
    } catch {
      // Port in use, try next
    }
  }
  throw new Error("Could not find available port");
}

async function waitForServer(
  url: string,
  timeout: number = 5000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeout}ms`);
}
