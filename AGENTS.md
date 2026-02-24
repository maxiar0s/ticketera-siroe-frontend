# AGENTS.md - ss-ticketera-front

## Purpose
This document gives coding agents the operational commands and coding conventions for this Angular 17 repository.

## Project Snapshot
- Framework: Angular 17 (standalone components, Angular CLI workspace)
- Language: TypeScript (strict mode enabled)
- Test runner: Karma + Jasmine (`ng test`)
- Package manager: npm (`package-lock.json` present)
- App type: SPA with lazy routes and HTTP API backend

## Environment and Setup
1. Use Node LTS compatible with Angular 17.
2. Install dependencies: `npm ci`
3. Local dev server: `npm start`
4. Demo dev server: `npm run start:demo`

### Skills Registry

Auto-generated from `./.agents/skills` (repo) and `~/.agents/skills` (global).

| Skill | Source | Description |
|-------|--------|-------------|
| `agents-gemini-sync` | global | Sync `AGENTS.md` and `GEMINI.md` skill registry sections from both repository-local skills (`./.agents/skills`) and global skills (`~/.agents/skills`). Use when creating, renaming, deleting, or updating skills and you need agent docs to reflect current available skills. |
| `error-handling-patterns` | global | Master error handling patterns across languages including exceptions, Result types, error propagation, and graceful degradation to build resilient applications. Use when implementing error handling, designing APIs, or improving application reliability. |
| `find-skills` | global | Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill should be used when the user is looking for functionality that might exist as an installable skill. |
| `frontend-design` | global | Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics. |
| `php-pro` | global | Use when building PHP applications with modern PHP 8.3+ features, Laravel, or Symfony frameworks. Invoke for strict typing, PHPStan level 9, async patterns with Swoole, PSR standards. |
| `skill-creator` | global | Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations. |
| `skill-sync` | global | Syncs skill metadata to AGENTS.md Auto-invoke sections. Trigger: When updating skill metadata (metadata.scope/metadata.auto_invoke), regenerating Auto-invoke tables, or running ./skills/skill-sync/assets/sync.sh (including --dry-run/--scope). |

## Build, Lint, and Test Commands

### Primary npm scripts
- `npm start` -> `ng serve` (default development configuration)
- `npm run start:demo` -> `ng serve --configuration demo`
- `npm run build` -> production build (`ng build`)
- `npm run build:demo` -> demo build (`ng build --configuration demo`)
- `npm run watch` -> development watch build
- `npm test` -> `ng test` (Karma watch mode)

### Non-watch / CI-friendly test command
- `npm test -- --watch=false --browsers=ChromeHeadless`

### Run a single spec file (most important)
- `npm test -- --watch=false --browsers=ChromeHeadless --include="src/app/shared/top-bar/top-bar.component.spec.ts"`
- Replace the `--include` path with the spec you need.

### Run multiple targeted spec files
- `npm test -- --watch=false --browsers=ChromeHeadless --include="src/app/pages/**/*.spec.ts"`

### Type-checking (no dedicated npm script yet)
- App types: `npx tsc --noEmit -p tsconfig.app.json`
- Test types: `npx tsc --noEmit -p tsconfig.spec.json`

### Linting status
- There is currently no configured `lint` script in `package.json`.
- There is no active Angular lint target in `angular.json`.
- Do not invent lint requirements in PRs unless requested.

## Expected Agent Workflow
1. Read relevant feature/module files first.
2. Make minimal, focused edits that match local style.
3. Run targeted tests first (single spec when possible).
4. Run full test/build only when change scope justifies it.
5. Report exact commands run and outcomes.

## Codebase Structure
- `src/app/pages/` -> feature screens (dashboard, tickets, etc.)
- `src/app/shared/` -> reusable UI components
- `src/app/services/` -> API and app state/services
- `src/app/interfaces/` -> domain types/interfaces
- `src/app/guards/` and `src/app/interceptors/` -> route/auth concerns
- `src/app/utils/`, `pipes/`, `directives/`, `validators/` -> helper layers
- `src/environments/` -> environment-specific config (base/prod/demo)

## TypeScript and Angular Standards

### Compiler strictness (must respect)
- `strict: true`
- `noImplicitOverride: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noPropertyAccessFromIndexSignature: true`
- `strictTemplates: true`

### Imports and module usage
- Prefer Angular/RxJS imports first, then local imports.
- Keep imports explicit; avoid wildcard imports.
- Use existing local style in touched files:
  - many files use relative paths (`../../services/...`)
  - path aliases are available (`@app/*`, `@env/*`) but not dominant
- Do not mass-rewrite import style in unrelated files.

### Standalone component conventions
- Most UI units are standalone components (`standalone: true`).
- Place dependencies in `imports: []` of `@Component`.
- Keep route-level lazy loading via `loadComponent` / `loadChildren`.

### Formatting conventions
- Follow `.editorconfig`:
  - UTF-8
  - 2-space indentation
  - trim trailing whitespace
  - final newline required
  - single quotes in `*.ts`
- Keep existing brace/line-break style in the file you edit.
- Avoid unrelated formatting churn.

## Global Styling Guidelines
- Global tokens live in `src/styles/theme.css` (`:root` + `[data-theme="dark"]`).
- Global baseline and shared utility classes live in `src/styles.css`.
- Prefer extending existing CSS variables over hardcoded colors/shadows/radius.
- For new global styles, add semantic tokens in `src/styles/theme.css` first and consume them from `src/styles.css` (token-driven, avoid raw hex/rgba when possible).
- Preserve visual parity between light and dark themes when adding new tokens.
- For broad UI refreshes, change shared classes first (`.primary-button`, `.ghost-button`, `.div-table`, `.modal-*`) before touching page-level CSS.
- Keep focus states accessible (`:focus-visible`) and maintain keyboard-visible outlines/shadows.
- Avoid introducing new font families without a clear visual reason; if added, define usage (display vs body) in global styles.
- Use component CSS (`src/app/**/**.css`) for local exceptions, not for overriding the whole design system.

## Naming Conventions
- Classes/components/services: `PascalCase` (`TicketsComponent`, `ApiService`)
- Functions/methods/variables/properties: `camelCase`
- Constants: `UPPER_SNAKE_CASE` when semantic constants (`MODULES`, `DASHBOARD_CONFIG`)
- Files: generally kebab-case (legacy exceptions exist; keep existing names unless asked)
- Interfaces/types:
  - common pattern: `*.interface.ts` with `PascalCase` type names
  - some legacy file names use uppercase initials (for example `Cuenta.interface.ts`); do not rename in broad refactors without explicit request

## Typing Rules
- Avoid introducing new `any` unless unavoidable at integration boundaries.
- Prefer explicit return types on public methods in services/components.
- Use unions/literals for constrained values (ticket state/priority patterns exist).
- Preserve nullability semantics already used by API contracts.
- Use `Record<K, V>`, `Partial<T>`, and typed DTO shapes where beneficial.

## RxJS and Async Patterns
- HTTP methods typically return `Observable<T>` from `ApiService`.
- Keep stream pipelines readable: `pipe(catchError(...), map(...))`.
- Use `finalize` for loading-state cleanup.
- For one-off UI subscriptions, preserve existing component style.
- Do not introduce new global state library unless requested.

## Error Handling Patterns
- Existing pattern logs errors with `console.error(...)` in services/components.
- Existing service behavior is mixed:
  - some endpoints rethrow (`throwError(() => error)`)
  - some fallback to safe values (`of([])`, `of(null)`)
- Match the local contract of the method you are touching.
- When adding new API methods, prefer:
  1. typed response
  2. explicit error strategy (rethrow vs fallback)
  3. predictable return type for callers

## Forms and UI Logic
- Reactive Forms are standard for complex forms.
- Keep validators close to form creation and dynamic validation logic.
- Guard against null/undefined values when mapping form payloads.
- Preserve UX state flags (`cargando`, `guardando`, `errorMensaje`, etc.) patterns.

## Routing and Access Control
- Routes are centralized in `src/app/app.routes.ts`.
- Guard stacking is common (`protegerRutaGuard`, role guards, `ModuleGuard`).
- When adding routes, include appropriate guard and `data.module` key when needed.

## Testing Guidelines
- Unit tests live as `*.spec.ts` beside implementation files.
- Default generated spec structure via `TestBed` is acceptable.
- For agent efficiency, run only impacted specs first using `--include`.
- If behavior spans many modules, run full `npm test -- --watch=false` before finishing.

## Cursor/Copilot Rule Integration
- Checked for Cursor rules:
  - `.cursorrules` not found
  - `.cursor/rules/` not found
- Checked for Copilot rules:
  - `.github/copilot-instructions.md` not found
- Therefore, no repository-specific Cursor/Copilot instruction overlays are currently applied.

## Change Safety Rules for Agents
- Do not alter environment files unless task requires it.
- Do not commit secrets or tokens.
- Prefer surgical edits over broad rewrites.
- Keep public API contracts backward-compatible unless explicitly requested.
- If you must choose between consistency and ideal style, prefer local consistency.
