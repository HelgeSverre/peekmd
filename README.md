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

## Installation

```bash
# Run directly with npx (no install needed)
npx peekmd README.md

# Or with bunx
bunx peekmd README.md

# Or install globally
npm install -g peekmd
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

## Development

```bash
# Clone and install
git clone https://github.com/HelgeSverre/peekmd.git
cd peekmd
bun install

# Run in development
bun run dev

# Build for distribution
bun run build
```

## License

MIT
