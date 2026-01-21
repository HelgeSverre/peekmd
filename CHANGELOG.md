# Changelog

## [2.1.1] - 2026-01-21

### Added

- Copy-to-clipboard button to copy raw markdown source with toast notification

## [2.1.0] - 2026-01-21

### Added

- `--version` / `-v` flag to display version
- Auto port selection when default port 3456 is in use (uses `get-port`)
- File tree collapse state persistence (remembers open/closed folders)
- CSS tooltips on file tree items

### Fixed

- Add ping endpoint to keep server alive on page refresh
- Simplify absolute path handling in asset resolver
- Remove misleading "Press ESC to close" message (ESC doesn't work in browser tabs)
- Remove dead ESC keydown handler code

### Performance

- Instant theme switching (removed universal transition delay)

## [2.0.0] - 2026-01-20

### Added

- Visual regression testing with Playwright
  - Baseline comparison tests for light and dark modes
  - Multiple viewport support (desktop, tablet, mobile)
  - GitHub gist comparison tests
  - Automatic diff image generation on failures
- GitHub Actions CI workflow for visual tests
- Font loading wait for consistent screenshot rendering

### Changed

- Restructured project with `src/` and `tests/` directories
- Refactored visual tests with parameterized helpers to reduce duplication
- Enhanced failure output with actual image saving and dimension info
- Added retry logic for flaky network-dependent tests

### Developer Experience

- New test commands:
  - `bun test:visual` - Run visual regression tests
  - `bun test:visual:update` - Update baseline images
  - `bun test:visual:local` - Run without gist comparison

## [1.1.0] - 2026-01-15

### Added

- Mermaid diagram rendering support with dark mode
- Dark mode toggle in the UI
- Enhanced styling for GitHub-like appearance

### Changed

- Replaced dynamic file tree with GitHub-style file listing
- Updated to Bun-native distribution model

## [1.0.0] - 2026-01-01

### Added

- GitHub-style markdown preview in your default browser
- GitHub Flavored Markdown (GFM) support
- Syntax highlighting for code blocks via highlight.js
- GitHub-style alerts (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!IMPORTANT]`, `[!CAUTION]`)
- Task lists with checkboxes
- Anchor links on headings
- File tree sidebar
- Auto-close server when browser window closes
- Cross-platform support (macOS, Windows, Linux)

### Usage

```bash
npx peekmd README.md
# or
bunx peekmd README.md
```
