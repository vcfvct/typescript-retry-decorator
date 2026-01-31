# AGENTS.md

This repository is `typescript-retry-decorator`: a small TypeScript library that provides a `@Retryable` decorator (supports both legacy `experimentalDecorators` and TS5 “standard decorators” runtime signature).

## Scope & Goals

- Keep changes small and focused; avoid refactors not required by the task.
- Preserve public API behavior (exports from `src/index.ts` → `dist/`).
- Prefer correctness + tests over cleverness.
- Maintain "0 dependency" philosophy for runtime code.

## Repo Layout

- `src/`: library source + tests
  - `src/retry.decorator.ts`: main implementation
  - `src/utils.ts`: helpers (e.g. `sleep`)
  - `src/*.test.ts`: Vitest tests (e.g. `src/retry.decorator.test.ts`)
- `dist/`: TypeScript build output (generated) - contains `cjs` and `esm` folders.
- Config: `tsconfig.json` (base), `tsconfig.cjs.json`, `tsconfig.esm.json`, `eslint.config.mjs`, `vitest.config.mts`.
- `esm-package.json`: Copied to `dist/esm/package.json` during build to mark ESM output as `"type": "module"`.

## Package Manager

- Use `pnpm` only.
- Install deps: `pnpm install`

## Build / Lint / Test

### Build

- Build TypeScript (emits to `dist/cjs` and `dist/esm`): `pnpm build`
  - Scripts: `pnpm run build:cjs` and `pnpm run build:esm`

### Lint

- Lint source: `pnpm lint`
  - Script: `eslint src/`
- **ESLint 9** with flat config format (`eslint.config.mjs`)

### Test

- **Runner**: Vitest (replaced Jest)
- Run all tests: `pnpm test`
- Watch mode: `pnpm test:watch`

#### Run a single test file

- `pnpm test -- src/retry.decorator.test.ts`

#### Run a single test by name

- Substring/regex match by `-t`:
  - `pnpm test -- -t "exceed max retry"`
  - `pnpm test -- -t "standard decorators signature"`

#### Run a single test by file + name

- `pnpm test -- src/retry.decorator.test.ts -t "standard decorators signature works"`

## TypeScript & Build Configuration

- **Dual Build**: CommonJS (`dist/cjs`) and ESM (`dist/esm`).
- **Decorators**:
  - Legacy `experimentalDecorators: true` enabled.
  - Supports TS5 standard decorators (stage 3) via runtime detection.
- **Strictness**: `noImplicitAny`, `strictNullChecks` are enabled.

## Code Style (Enforced by ESLint)

See `eslint.config.mjs` for rules.

### Formatting & Syntax
- **Indentation**: 2 spaces.
- **Quotes**: Single quotes (`'`), template strings allowed.
- **Semicolons**: Required (`always`).
- **Trailing Spaces**: Disallowed.
- **Async**: Always use `async/await` over raw promises where possible.
- **Functions**:
  - Prefer arrow functions for callbacks.
  - Prefer named functions for top-level exports if hoisting is beneficial (though `const` exports are common here).

### Imports
- Prefer relative imports within `src/` with `.js` extensions for ESM compatibility (e.g., `import { sleep } from './utils.js';`).
- **NO** absolute imports or path aliases (keep it simple for library portability).
- Keep external and internal imports grouped separately.

### Naming Conventions
- **Classes/Types**: `PascalCase` (e.g., `RetryOptions`).
- **Functions/Vars**: `camelCase` (e.g., `applyBackoffStrategy`).
- **Files**: Dot-separated (e.g., `retry.decorator.ts`). Match existing patterns.
- **Tests**: `describe` blocks with clear subject names; `it` or `test` with behavioral descriptions.

## Error Handling & Logging

- **Errors**: Throw `Error` or custom subclasses.
- **Stack Traces**: Preserve stack traces when wrapping errors (e.g., `MaxAttemptsError`).
- **Logging**: Do NOT use `console.log` directly in library code. Use the provided `useConsoleLogger` option or a custom logger interface if strictly necessary.

## Decorator Compatibility

The `Retryable` decorator must support two distinct call signatures:
1. **Legacy**: `(target, propertyKey, descriptor)`
2. **Standard (TS5)**: `(value, context)`

**Critical**: When modifying the decorator, ensure `this` context is preserved using `fn.apply(this, args)` or `fn.call(this, ...args)`.

## Testing Guidance

- **Mocking**: Use `vi` (Vitest) for mocking, not `jest`.
  - Example: `vi.fn()`, `vi.spyOn()`.
- **Timers**: Use fake timers for backoff testing to avoid slow tests.
  - `vi.useFakeTimers()`, `vi.advanceTimersByTime(...)`.
- **Determinism**: Ensure tests do not rely on real wall-clock time if possible.

## Generated Artifacts

- Do NOT edit files in `dist/`.
- `dist/` structure is managed by the build scripts (`build:cjs`, `build:esm`).

## Cursor / Copilot Rules

- No specific rules files found (`.cursorrules`, `.github/copilot-instructions.md`).
- Follow the guidelines in this file as the source of truth.
