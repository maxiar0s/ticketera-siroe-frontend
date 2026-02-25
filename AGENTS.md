# AGENTS.md - ss-ticketera-front

## Purpose
Operational guide for coding agents working in this Angular 17 frontend repository.
Use this as the default source for commands, conventions, and safety rules.

## Project Snapshot
- Framework: Angular 17 (standalone components, Angular CLI workspace)
- Language: TypeScript (strict mode + strict templates)
- Test stack: Karma + Jasmine
- Package manager: npm (`package-lock.json` present)
- Rich text editor: Quill via `ngx-quill`
- App type: SPA with lazy routes and HTTP backend integration

## Environment Setup
1. Use Node.js LTS compatible with Angular 17.
2. Install dependencies with `npm ci`.
3. Start local development server with `npm start`.
4. Start demo configuration with `npm run start:demo`.

## Build, Test, and Type-Check

### Primary npm scripts
- `npm start` -> `ng serve`
- `npm run start:demo` -> `ng serve --configuration demo`
- `npm run build` -> `ng build`
- `npm run build:demo` -> `ng build --configuration demo`
- `npm run watch` -> `ng build --watch --configuration development`
- `npm test` -> `ng test`

### CI-friendly tests (non-watch)
- `npm test -- --watch=false --browsers=ChromeHeadless`

### Run a single spec file (preferred for focused changes)
- `npm test -- --watch=false --browsers=ChromeHeadless --include="src/app/shared/top-bar/top-bar.component.spec.ts"`
- Replace the `--include` path with the target spec file.

### Run targeted spec groups
- `npm test -- --watch=false --browsers=ChromeHeadless --include="src/app/pages/**/*.spec.ts"`

### Type-checking commands
- App types: `npx tsc --noEmit -p tsconfig.app.json`
- Test types: `npx tsc --noEmit -p tsconfig.spec.json`

### Lint status
- There is no active `lint` script in `package.json`.
- There is no Angular lint target in `angular.json`.
- Do not invent lint tasks in PR checklists unless requested.

## Agent Workflow (Default)
1. Read only files needed for the task.
2. Keep edits minimal and local to affected modules.
3. Preserve existing patterns in touched files.
4. Run the smallest useful verification first (single spec or build).
5. Report exact commands run and key outcomes.

## Repository Layout
- `src/app/pages/` -> route-level feature screens
- `src/app/shared/` -> reusable components and shared UI
- `src/app/services/` -> API and app-level services
- `src/app/interfaces/` -> domain interfaces/types
- `src/app/guards/` -> route access rules
- `src/app/interceptors/` -> HTTP interceptors
- `src/app/utils/`, `pipes/`, `directives/`, `validators/` -> helper layers
- `src/environments/` -> environment config (`environment*`)

## TypeScript and Angular Standards

### Compiler strictness (must be respected)
- `strict: true`
- `noImplicitOverride: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noPropertyAccessFromIndexSignature: true`
- Angular templates use `strictTemplates: true`

### Imports and module usage
- Prefer explicit imports; avoid wildcard imports.
- Keep current file import style (relative paths are common).
- Path aliases exist, but do not mass-migrate imports unless asked.
- Avoid broad import cleanup unrelated to the task.

### Standalone component conventions
- Components are commonly `standalone: true`.
- Declare dependencies explicitly in `imports: []`.
- Preserve lazy loading patterns in routes.

## Formatting Rules
- Follow `.editorconfig` exactly:
  - UTF-8
  - 2-space indentation
  - final newline required
  - trim trailing whitespace
  - single quotes in `*.ts`
- Maintain local formatting style in the edited file.
- Avoid formatting-only churn.

## Naming Conventions
- Classes/components/services: `PascalCase`
- Methods/variables/properties: `camelCase`
- Constants: `UPPER_SNAKE_CASE` when semantic constants
- File names: typically kebab-case (honor existing legacy names)
- Type names: `PascalCase`

## Typing and Data Contracts
- Do not introduce new `any` unless unavoidable at external boundaries.
- Prefer explicit return types on public service/component methods.
- Model constrained values with unions/literals when practical.
- Preserve existing API contract nullability behavior.
- Prefer typed DTO-style objects over untyped maps.

## RxJS and Async Guidelines
- Service HTTP methods should keep returning typed `Observable<T>`.
- Use readable `pipe(...)` chains with clear operators.
- Use `finalize` for loading-flag cleanup when needed.
- Match local subscription lifecycle style in each component.
- Do not introduce a new state library unless explicitly requested.

## Error Handling
- Keep error strategy consistent per method:
  - rethrow when callers need to decide
  - fallback (`of([])`, `of(null)`) when UI needs graceful defaults
- Log actionable errors with context (`console.error(...)`) where existing style does.
- Avoid swallowing errors silently.

## Forms and UI Logic
- Prefer Reactive Forms for non-trivial forms.
- Keep validators close to form model creation.
- Guard null/undefined values before mapping form payloads.
- Preserve existing UX state flags (`cargando`, `guardando`, etc.).

## Routing and Security
- Routes live in `src/app/app.routes.ts`.
- Guard composition is common and should be preserved.
- New routes should include proper guard and metadata when required.
- Do not weaken auth/role checks without explicit request.

## Styling and Theming (Current Direction)
- Use theme tokens and CSS variables from global styles when possible.
- Keep modal behavior consistent with shared modal patterns.
- Prefer accessible contrast in both light and dark modes.
- Avoid hardcoded one-off colors when a token exists.

## Testing Guidance
- Keep tests beside implementation (`*.spec.ts`).
- For focused tasks, run only impacted specs first.
- For cross-cutting changes, run full non-watch tests.
- If tests are too slow/flaky locally, at minimum run `npm run build`.

## Cursor/Copilot Repository Rules
- `.cursorrules` not found.
- `.cursor/rules/` not found.
- `.github/copilot-instructions.md` not found.
- No repository-level Cursor/Copilot overlays are currently applied.

## Change Safety Rules
- Do not commit secrets, credentials, or tokens.
- Do not edit `src/environments/*` unless the task requires it.
- Prefer surgical edits over broad refactors.
- Keep public API behavior backward-compatible unless requested.
- If conventions conflict, prioritize local consistency in touched files.
