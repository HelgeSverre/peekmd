/// <reference path="./styles.d.ts" />

// CSS is embedded for binary compatibility (single source of truth: styles.css)
import styles from "./styles.css" with { type: "text" };

export function getStyles(): string {
  return styles;
}
