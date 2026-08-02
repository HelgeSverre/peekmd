import { watch, type FSWatcher } from "fs";
import { basename, dirname } from "path";

/**
 * Watches a file for changes and calls `onChange` (debounced).
 *
 * Watches the parent directory rather than the file itself, so it keeps
 * working across atomic saves (editors write a temp file + rename, which
 * replaces the inode and breaks `fs.watch` on the file).
 */
export function watchFile(
  filePath: string,
  onChange: () => void,
  debounceMs = 150,
): () => void {
  const targetName = basename(filePath);
  let watcher: FSWatcher;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(onChange, debounceMs);
  };

  try {
    watcher = watch(dirname(filePath), (_event, filename) => {
      if (filename === targetName) schedule();
    });
  } catch {
    // Directory unwatchable (e.g. deleted) - fall back to watching the file
    try {
      watcher = watch(filePath, () => schedule());
    } catch {
      return () => {};
    }
  }

  return () => {
    clearTimeout(timer);
    watcher.close();
  };
}
