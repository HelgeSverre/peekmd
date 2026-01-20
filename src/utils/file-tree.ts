import { readdirSync, lstatSync } from "fs";
import { join } from "path";

export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  size?: string;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileTree(
  dir: string,
  maxDepth: number = 3,
  currentDepth: number = 0,
): FileNode[] {
  if (currentDepth >= maxDepth) return [];

  try {
    const items = readdirSync(dir);
    return items
      .slice(0, 20)
      .map((item) => {
        try {
          const fullPath = join(dir, item);
          const stats = lstatSync(fullPath);
          const isDir = stats.isDirectory();
          return {
            name: item,
            type: isDir ? "folder" : "file",
            children: isDir
              ? getFileTree(fullPath, maxDepth, currentDepth + 1)
              : undefined,
            size: isDir ? "" : formatSize(stats.size),
          };
        } catch {
          return null;
        }
      })
      .filter((node): node is FileNode => node !== null);
  } catch {
    return [];
  }
}

const FILE_ICON = `<svg aria-hidden="true" focusable="false" class="octicon octicon-file color-fg-muted" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path></svg>`;

const FOLDER_ICON = `<svg aria-hidden="true" focusable="false" class="octicon octicon-file-directory-fill color-fg-muted" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path></svg>`;

export function renderFileTree(nodes: FileNode[]): string {
  const rows = nodes.map((node, index) => {
    const icon = node.type === "folder" ? FOLDER_ICON : FILE_ICON;
    return `<tr class="react-directory-row" id="folder-row-${index}">
      <td class="react-directory-row-name-cell-small-screen" colspan="2">
        <div class="react-directory-filename-column">
          ${icon}
          <div class="overflow-hidden">
            <div class="react-directory-filename-cell">
              <div class="react-directory-truncate"><a title="${node.name}" class="Link--primary" href="#">${node.name}</a></div>
            </div>
          </div>
        </div>
      </td>
      <td class="react-directory-row-commit-cell hide-sm">
        <div class="react-directory-commit-message"><a data-pjax="true" title="Initial commit" class="Link--secondary" href="#">Initial commit</a></div>
      </td>
      <td>
        <div class="react-directory-commit-age">${node.size || ""}</div>
      </td>
    </tr>`;
  });

  return `<table class="Table-module__Box--KyMHK" aria-labelledby="folders-and-files">
  <thead class="DirectoryContent-module__OverviewHeaderRow--FlrUZ Table-module__Box_1--DkRqs">
    <tr class="Table-module__Box_2--l1wjV">
      <th colspan="2" class="DirectoryContent-module__Box--y3Nvf"><span class="text-bold">Name</span></th>
      <th class="hide-sm"><span class="text-bold">Last commit message</span></th>
      <th colspan="1" class="DirectoryContent-module__Box_2--h912w"><span class="text-bold">Last commit date</span></th>
    </tr>
  </thead>
  <tbody>
    ${rows.join("\n    ")}
  </tbody>
</table>`;
}
