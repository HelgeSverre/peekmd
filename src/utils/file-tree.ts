import { readdirSync, lstatSync } from "fs";
import { join } from "path";
import { FILE_ICON, FOLDER_ICON } from "../template/icons.ts";

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
    const nodes: (FileNode | null)[] = items.slice(0, 20).map((item) => {
      try {
        const fullPath = join(dir, item);
        const stats = lstatSync(fullPath);
        const isDir = stats.isDirectory();
        const node: FileNode = {
          name: item,
          type: isDir ? "folder" : "file",
          children: isDir
            ? getFileTree(fullPath, maxDepth, currentDepth + 1)
            : undefined,
          size: isDir ? "" : formatSize(stats.size),
        };
        return node;
      } catch {
        return null;
      }
    });
    return nodes.filter((node): node is FileNode => node !== null);
  } catch {
    return [];
  }
}

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
