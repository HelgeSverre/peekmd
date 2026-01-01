# peekmd

A CLI tool that opens a GitHub-style preview of markdown files in your default browser.

## Commands

```sh
# Development - preview a markdown file with hot reload
bun run dev

# Build for distribution
bun run build

# Format code
bun run format

# Run directly (development)
bun run ./index.ts <file.md>
```

## Project Structure

- `index.ts` - Main module with markdown rendering, HTML template, and Bun server
- `cli.ts` - CLI entry point (shebang script that calls `main()`)
- `dist/` - Built output for npm publishing

## Key Dependencies

- `marked` - Markdown parser
- `highlight.js` - Syntax highlighting for code blocks

## How It Works

1. Reads markdown file from CLI argument
2. Renders to HTML using `marked` with GitHub-style styling
3. Starts a local Bun server on port 3456
4. Opens the preview in the default browser
5. Server auto-closes when browser window closes (via `/close` endpoint)

## Features

- GitHub Flavored Markdown (GFM)
- Syntax highlighting for code blocks
- GitHub-style alerts (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, etc.)
- Task lists with checkboxes
- Anchor links on headings
- File tree sidebar

---

## Bun Guidelines

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

### APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

### Testing

Use `bun test` to run tests.

```ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```
