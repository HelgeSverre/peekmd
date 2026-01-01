# peekmd

[![npm version](https://img.shields.io/npm/v/peekmd.svg)](https://www.npmjs.com/package/peekmd)
[![npm downloads](https://img.shields.io/npm/dm/peekmd.svg)](https://www.npmjs.com/package/peekmd)
[![GitHub release](https://img.shields.io/github/v/release/HelgeSverre/peekmd)](https://github.com/HelgeSverre/peekmd/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A CLI tool to preview markdown files with GitHub-style rendering in your browser.

## Features

- GitHub Flavored Markdown (GFM) rendering
- Syntax highlighting for code blocks
- GitHub-style alerts (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!IMPORTANT]`, `[!CAUTION]`)
- Task lists with checkboxes
- Anchor links on headings
- File tree sidebar
- Opens in your default browser automatically
- Auto-closes when you close the browser tab
- Cross-platform: macOS, Linux, Windows

## Requirements

**[Bun](https://bun.sh) is required** to run peekmd. Install it with:

```bash
curl -fsSL https://bun.sh/install | bash
```

## Installation

### Quick Run (no install)

```bash
# Using bunx (recommended)
bunx peekmd README.md

# Using npx (requires Bun in PATH)
npx peekmd README.md
```

### Global Installation

```bash
# Using bun (recommended)
bun install -g peekmd

# Using npm (requires Bun in PATH)
npm install -g peekmd
```

Then run from anywhere:

```bash
peekmd README.md
```

### Manual Installation (from source)

Clone the repository and choose one of the following approaches:

```bash
git clone https://github.com/HelgeSverre/peekmd.git
cd peekmd
bun install
```

#### Option A: Link for Development

This creates a symlink so you can run `peekmd` from anywhere. Requires Bun to be in your PATH.

```bash
bun link
```

Now you can run:

```bash
peekmd /path/to/file.md
```

To unlink later:

```bash
bun unlink peekmd
```

#### Option B: Build Standalone Binary

This creates a self-contained executable that works without Bun installed at runtime.

```bash
bun run compile
```

This creates a `peekmd` binary in the project directory. Move it to your PATH:

```bash
# macOS/Linux
sudo mv peekmd /usr/local/bin/

# Or add to your local bin
mv peekmd ~/.local/bin/
```

## Usage

```bash
# Preview a README file
peekmd README.md

# Preview any markdown file
peekmd docs/guide.md

# Preview with full path
peekmd /path/to/file.md
```

## Controls

- Press `ESC` to close the preview
- Close the browser tab to exit

## What it does

peekmd renders your markdown files with a GitHub-style interface by:

1. **Reading the markdown file** specified in the CLI argument
2. **Extracting metadata**:
   - **Description**: Finds the first paragraph after any heading (filters out headings, lists, and code blocks)
   - **Topics**: Generates placeholder tags based on the repository name (currently hardcoded: "markdown", "preview", "documentation")
   - **Repository stats**: Placeholder values for stars (0), watchers (1), and forks (0)
3. **Generating a file tree**: Creates a directory tree view of the current working directory (up to 3 levels deep, max 20 items per level)
4. **Rendering the markdown**: Converts markdown to HTML with:
   - GitHub Flavored Markdown (GFM) support
   - Syntax highlighting for code blocks
   - GitHub-style alerts (`[!NOTE]`, `[!TIP]`, etc.)
   - Task lists with checkboxes
   - Anchor links on headings
5. **Replacing template placeholders**:
   - `{{filename}}` - The markdown filename
   - `{{repoName}}` - The parent directory name
   - `{{dirPath}}` - The relative directory path
   - `{{content}}` - The rendered markdown HTML
   - `{{fileTree}}` - The directory tree structure
   - `{{description}}` - The extracted description
   - `{{topics}}` - The generated topic tags
   - `{{stars}}`, `{{watchers}}`, `{{forks}}` - Repository stats
6. **Starting a local server** on port 3456 and opening the preview in your default browser

## Development

```bash
# Run in development mode
bun run dev

# Format code
bun run format

# Build standalone binary
bun run compile
```

## Why Bun?

peekmd uses Bun's built-in HTTP server (`Bun.serve()`) for its simplicity and performance. This means:

- Zero configuration HTTP server
- Native TypeScript execution
- Fast startup time
- Small package size (ships TypeScript source, no build step needed)

## Troubleshooting

### "bun: command not found"

Bun is not installed or not in your PATH. Install it:

```bash
curl -fsSL https://bun.sh/install | bash
```

Then restart your terminal or run:

```bash
source ~/.bashrc  # or ~/.zshrc
```

### "ReferenceError: Bun is not defined"

You're running with Node.js instead of Bun. This can happen if:

- You installed an older version of peekmd
- The shebang is incorrect

Update to the latest version:

```bash
bun install -g peekmd@latest
```

Or if running from source, make sure `cli.ts` has `#!/usr/bin/env bun` as the first line.

## License

MIT
