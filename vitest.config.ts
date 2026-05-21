import { defineConfig } from 'vitest/config'

// Minimal Vitest config for pure-function unit tests.
//
// Scope:
// - `node` environment — no DOM. Tests target lib/ pure functions.
// - No globals — tests must import { describe, it, expect } explicitly.
//   Avoids polluting the type surface and keeps test files behaving
//   like the rest of the codebase.
// - `include` matches the conventional `__tests__` directory under lib/.
//   Playwright specs live under `tests/` and are excluded automatically
//   by not matching the include glob.
//
// Run via: `npm run test:unit`. Watch mode is intentionally not wired
// up; add it later if it becomes useful.
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['lib/**/__tests__/**/*.test.ts'],
  },
})
