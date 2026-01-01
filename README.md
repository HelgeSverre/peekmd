# peekmd

A CLI tool to preview markdown files with GitHub-style rendering in your browser.

## Features

- GitHub-flavored markdown rendering
- Syntax highlighting for code blocks
- Opens in your default browser automatically
- Self-contained binary (no runtime dependencies required)
- Cross-platform: macOS, Linux, Windows

## Installation

### From Source

```bash
git clone https://github.com/yourusername/peekmd.git
cd peekmd
bun install
bun build ./index.ts --compile --outfile peekmd
chmod +x peekmd
./peekmd README.md
```

### Download Pre-built Binary

```bash
# macOS (Apple Silicon)
curl -L https://github.com/yourusername/peekmd/releases/download/v1.0.0/peekmd-macos-arm64 -o peekmd
chmod +x peekmd

# macOS (Intel)
curl -L https://github.com/yourusername/peekmd/releases/download/v1.0.0/peekmd-macos-x64 -o peekmd
chmod +x peekmd

# Linux (x64)
curl -L https://github.com/yourusername/peekmd/releases/download/v1.0.0/peekmd-linux-x64 -o peekmd
chmod +x peekmd

# Windows
curl -L https://github.com/yourusername/peekmd/releases/download/v1.0.0/peekmd-windows-x64.exe -o peekmd.exe
```

## Usage

```bash
# Preview a README file
./peekmd README.md

# Preview any markdown file
./peekmd docs/guide.md

# Preview with full path
./peekmd /path/to/file.md
```

## Options

No options required. Simply pass the markdown file path.

## Controls

- Press `ESC` to close the preview
- Close the browser tab to exit

## Building

```bash
# Install dependencies
bun install

# Build self-contained binary
bun build ./index.ts --compile --outfile peekmd

# Binary will be ~60MB and include all dependencies
```

## Requirements

- macOS, Linux, or Windows
- No external dependencies (self-contained binary)
- Default browser for preview

## License

MIT
