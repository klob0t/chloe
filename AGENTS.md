# Repository Guidelines

## Project Structure & Module Organization
- `src/app` follows the Next.js App Router; pages live beside route-specific assets (for example, `chat/[id]/page.tsx` handles threaded conversations).
- UI building blocks sit in `src/app/components`; keep each component paired with its `.module.css` file and co-locate story/docs if you add them.
- Shared state and helpers are under `src/app/lib` (`store` holds Zustand slices, `utils/request.ts` wraps API calls, `tools` powers the search tool wiring).
- API handlers live in `src/app/api/*/route.ts` and expect a `POLLINATIONS_API_KEY` during runtime.
- `public/` stores static assets such as `logo3.glb`. `chloe-v1/` is a legacy snapshot—reference only when needed.

## Build, Test, and Development Commands
- `npm install` – install dependencies; rerun after touching `package.json`.
- `npm run dev` – launch the Next.js dev server with Turbopack.
- `npm run build` – create a production build; run this before tagging releases.
- `npm run start` – serve the production build locally.
- `npm run lint` – run the ESLint suite (`next/core-web-vitals` rules); add `--fix` when cleaning up.

## Coding Style & Naming Conventions
- TypeScript everywhere; prefer named exports for shared utilities and keep components as PascalCase files (for example, `Scene.tsx`).
- Use 2-space indentation in React/TS files and keep Zustand stores on single quotes to match current formatting.
- Derive hooks/stores with camelCase (`useChatStore`), and keep CSS module class names kebab-cased.
- Avoid inline styles when a `.module.css` exists; co-locate new styles in the same directory.

## Testing Guidelines
- No automated test harness is configured yet; run `npm run lint` and exercise core chat/image flows manually before merging.
- When you add tests, prefer React Testing Library and group files under `src/app/__tests__` or beside the module in a `__tests__` folder.
- Include regression steps in the PR description until an automated suite exists.

## Commit & Pull Request Guidelines
- Recent history shows short, informal one-liners; tighten messages to a single imperative sentence (e.g., `add sidebar sync guard`).
- Reference related issues in the body and call out breaking changes explicitly.
- PRs should include purpose, screenshots for UI tweaks, affected routes, and any follow-up TODOs. Request at least one review before merging.

## Security & Configuration Tips
- Create a `.env.local` with `POLLINATIONS_API_KEY` and any third-party keys; never commit secrets.
- Audit external fetches when touching `src/app/api/**` and ensure errors are sanitized before returning to clients.
- Rotate hard-coded credentials immediately; revoke temporary keys before release.
