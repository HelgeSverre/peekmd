#!/usr/bin/env bun
import { main } from "./index.ts";

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
