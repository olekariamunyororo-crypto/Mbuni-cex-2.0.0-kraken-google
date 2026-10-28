import { defineConfig } from "vitest/config";
import path from "node:path";

// =============================================================================
// Mbuni CEX — Vitest configuration
//
// Unit tests live next to the source file: src/lib/opencex/engine.test.ts
// Run with:  bun run test:unit        (one-shot)
//            bun run test:unit:watch  (watch mode)
//            just test-unit           (via justfile)
//            make test-unit           (via Makefile)
// =============================================================================

export default defineConfig({
  test: {
    // Test file glob — picks up *.test.ts and *.spec.ts anywhere in src/
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    // Exclude e2e tests (Playwright handles those)
    exclude: ["node_modules/", ".next/", "tests/e2e/", "playwright-report/"],
    // Coverage (optional — run with `vitest run --coverage`)
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**/*", "src/components/**/*"],
      exclude: ["src/components/ui/**"], // shadcn primitives — not our code
    },
    environment: "node", // tests run in Node by default (matching engine is pure logic)
    globals: false, // explicit imports — no global expect/describe
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
