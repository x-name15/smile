import { defineConfig } from "tsup";

export default defineConfig([
  // Library entry point — no shebang, just clean JS.
  // Types are generated separately via `tsc --declaration --emitDeclarationOnly`
  // because rollup-plugin-dts crashes with TypeScript 7.x (tracked bug).
  {
    entry: { "core/index": "src/core/index.ts" },
    format: ["cjs", "esm"],
    dts: false,
    clean: false,
    splitting: false,
    sourcemap: true,
  },
  // CLI entry point — needs the shebang so Node executes it directly.
  {
    entry: { "cli/index": "src/cli/index.ts" },
    format: ["cjs"],
    dts: false,
    clean: true,
    splitting: false,
    sourcemap: true,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
]);
