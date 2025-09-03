# Repository Guidelines

- 始终使用中文回答

## Project Structure & Module Organization
- Source: `App.vue`, `main.js`, `pages/` (page SFCs), `composables/` (Composition API utilities), `store/` (state), `utils/` (helpers), `static/` (assets), `uni.scss`.
- Cloud: `uniCloud-aliyun/cloudfunctions/` (e.g., `user-co/`, `sync-co/`, `todobook-co/`).
- Config: `manifest.json`, `pages.json`.
- Docs & workflows: `README.md`, `specs/`, `bugs/`, `bug_workflow.md`, `spec_workflow.md`.

## Build, Run & Dev Workflow
- Development: Use HBuilderX 3.8+.
  - Run (H5): HBuilderX → Run → Run to Browser (H5). Output in `unpackage/`.
  - Build: HBuilderX → Release → select target (H5/APP/小程序).
  - Cloud deploy: Right‑click a folder in `uniCloud-aliyun/cloudfunctions/` → Upload/Deploy.
- Clone & open:
  - `git clone <repo>`; open folder in HBuilderX; associate cloud space for `uniCloud-aliyun`.
- Note: No `package.json` in repo; prefer HBuilderX tooling.

## Coding Style & Naming Conventions
- Vue SFCs with 2‑space indentation; SCSS in `uni.scss`.
- Pages: `pages/<feature>/<name>.vue` (folders kebab‑case). Components PascalCase.
- Composables: files named `useXxx.js` in `composables/`; export `useXxx` functions.
- JS: single quotes, trailing commas avoided, prefer explicit returns.
- Keep cloud object APIs cohesive per folder (e.g., `*-co/index.obj.js`).

## Testing Guidelines
- Current approach: manual test flows in `specs/`; reproducibles in `bugs/`.
- Before PR:
  - Verify H5 and at least one additional target (e.g., 微信小程序 or APP-Android) if relevant.
  - Add/adjust steps in `specs/` for new features; attach repro in `bugs/` for fixes.

## Commit & Pull Request Guidelines
- Commit style: Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`) as seen in history.
- PRs must include:
  - Summary, affected pages/components/cloud objects, and rationale.
  - Linked issue/bug (reference folder path if local, e.g., `bugs/2024-08-12-xxx`).
  - Screenshots/GIFs for UI changes and a brief test plan.

## Security & Configuration
- Do not commit secrets or uni‑id credentials; keep cloud keys out of VCS.
- Respect `.gitignore`; sensitive files (e.g., uni‑id configs) remain untracked.
- Update `manifest.json` and platform privacy files (e.g., `androidPrivacy.json`) when permissions change.

