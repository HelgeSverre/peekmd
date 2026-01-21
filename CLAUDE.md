# peekmd

A CLI tool that opens a GitHub-style preview of markdown files in your default browser.

## Commands

```sh
# Development - preview a markdown file
bun run dev

# Build standalone binary (no Bun runtime required)
bun run compile

# Run tests
bun test

# Run tests with watch
bun test --watch

# Run tests with coverage
bun test --coverage

# Manual testing with kitchen-sink file (all features)
bun run test:manual

# Format code
bun run format

# Run directly
bun run ./src/cli.ts <file.md>
```

## Project Structure

```
src/
  cli.ts                 # CLI entry point
  index.ts               # Public API exports

  markdown/
    parser.ts            # markdown-it configuration
    plugins/
      alerts.ts          # [!NOTE], [!TIP], etc.
      anchors.ts         # Heading anchor links
      highlight.ts       # Syntax highlighting
      mermaid.ts         # Diagram support
      strikethrough.ts   # ~~strikethrough~~ text
      tasks.ts           # Task list checkboxes

  server/
    index.ts             # Bun.serve() setup
    routes.ts            # Route handlers
    assets.ts            # Asset proxy middleware

  template/
    html.ts              # HTML structure
    styles.ts            # Embedded CSS
    styles.css           # Source CSS (edit this)
    scripts.ts           # Client-side JS

  utils/
    file-tree.ts         # Directory tree generation
    browser.ts           # Cross-platform browser opening
    paths.ts             # Path resolution, content-types

tests/
  markdown/*.test.ts     # Markdown rendering tests
  server/*.test.ts       # Server tests
  utils/*.test.ts        # Utility tests
  fixtures/              # Test markdown files
```

## Distribution

This package ships TypeScript source directly (no build step). Bun runs TypeScript natively.

- `bunx peekmd` - runs via Bun
- `bun run compile` - creates standalone binary (~60MB) that works without Bun installed

## Key Dependencies

- `markdown-it` - Markdown parser (CommonMark compliant)
- `markdown-it-footnote` - Footnote support
- `highlight.js` - Syntax highlighting for code blocks
- `get-port` - Auto port selection

## How It Works

1. Reads markdown file from CLI argument
2. Renders to HTML using `markdown-it` with GitHub-style styling
3. Starts a local Bun server on port 3456
4. Opens the preview in the default browser
5. Server auto-closes when browser window closes (via `/close` endpoint)
6. Asset proxy rewrites relative image paths for local images

## Features

- GitHub Flavored Markdown (GFM)
- Syntax highlighting for code blocks
- GitHub-style alerts (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, etc.)
- Task lists with checkboxes
- Strikethrough text (`~~deleted~~`)
- Footnotes
- Anchor links on headings
- File tree sidebar with collapse state persistence
- Mermaid diagram rendering
- Dark mode support
- Local image proxying

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
