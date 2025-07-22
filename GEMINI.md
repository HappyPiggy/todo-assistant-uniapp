# GEMINI.MD: AI Collaboration Guide

This document provides essential context for AI models interacting with this project. Adhering to these guidelines will ensure consistency and maintain code quality.

## 1. Project Overview & Purpose

* **Primary Goal:** A modern, multi-platform to-do list application named "TODO助手". It supports hierarchical task management (TodoBook → TodoItem → SubItem), real-time cloud synchronization, and offline operations.
* **Business Domain:** Productivity, Task Management.

## 2. Core Technologies & Stack

* **Languages:** JavaScript (ES6+)
* **Frameworks & Runtimes:**
    * **Frontend:** Vue 3, uni-app (for cross-platform compilation to H5,小程序, and native apps).
    * **Backend:** uniCloud (Serverless platform based on Node.js).
* **Databases:** MongoDB (via uniCloud DB).
* **Key Libraries/Dependencies:**
    * **UI:** uni-ui (official component library for uni-app).
    * **State Management:** A custom, lightweight store implemented with Vue 3's Composition API (see `store/index.js`).
    * **Authentication:** uni-id (official authentication system for uniCloud).
* **Package Manager(s):** No traditional `package.json` at the root. Dependencies are managed through HBuilderX's plugin system (`uni_modules`). Backend dependencies are in `package.json` files within each cloud function/object directory (e.g., `uniCloud-alipay/cloudfunctions/user-co/package.json`).

## 3. Architectural Patterns

* **Overall Architecture:** Serverless Architecture. The frontend is a Vue 3 single-page application managed by uni-app. The backend logic is hosted on uniCloud as a set of serverless cloud functions and cloud objects.
* **Directory Structure Philosophy:**
    * `/pages`: Contains all application pages/views.
    * `/composables`: Reusable Vue 3 Composition API functions (hooks).
    * `/store`: Global state management.
    * `/static`: Static assets like images and fonts.
    * `/utils`: General utility functions.
    * `/uni_modules`: uni-app ecosystem modules and components.
    * `/uniCloud-alipay`: Backend code, including serverless functions (`cloudfunctions`) and database schemas, specifically for the Alipay cloud environment.

## 4. Coding Conventions & Style Guide

* **Formatting:**
    * **Style:** Follows standard Vue and JavaScript conventions.
    * **Indentation:** Appears to be 2 spaces for `.js` and `.vue` files.
    * **Styling:** Uses SCSS, with global variables defined in `uni.scss`.
* **Naming Conventions:**
    * `variables`, `functions`: camelCase (`myVariable`).
    * `components`, `pages`: kebab-case for files (`my-component.vue`), PascalCase for component names in templates (`<MyComponent />`).
    * `composables`: camelCase, prefixed with `use` (e.g., `useTaskDetail.js`).
* **API Design:** The backend consists of uniCloud Cloud Objects (`-co`). These are essentially RPC-style endpoints, not RESTful. The frontend calls methods on these objects to perform data operations.
* **Error Handling:** Primarily uses `try...catch` blocks for asynchronous operations, especially for uniCloud API calls.

## 5. Key Files & Entrypoints

* **Main Entrypoint(s):** `main.js` is the primary entry point for the Vue application. `App.vue` is the root component.
* **Configuration:**
    * `manifest.json`: Core application configuration for uni-app (AppID, permissions, icons, splash screen, etc.).
    * `pages.json`: Defines application pages, routes, tab bar, and global styles.
    * `uni.scss`: Global SCSS style variables.
* **CI/CD Pipeline:** No CI/CD configuration file (e.g., `.github/workflows`) was found in the project root.

## 6. Development & Testing Workflow

* **Local Development Environment:**
    * Requires HBuilderX IDE.
    * A uniCloud account (linked to Alipay) is necessary.
    * **Setup:**
        1. Clone the repository.
        2. Open the project in HBuilderX.
        3. Associate the `uniCloud-alipay` directory with a cloud service space.
        4. Deploy cloud functions and initialize the database using `database/db_init.json`.
        5. Run the project on a browser, emulator, or physical device via HBuilderX.
* **Testing:** No dedicated testing framework (like Jest or Vitest) or test files (`.spec.js`, `.test.js`) were found. The project seems to rely on manual testing, as indicated by the `pages/debug/debug.vue` page.
* **CI/CD Process:** No automated CI/CD process is defined. Deployment is likely done manually through HBuilderX.

## 7. Specific Instructions for AI Collaboration

* **Contribution Guidelines:** The `README.md` outlines a standard GitHub flow: Fork -> Create Feature Branch -> Commit -> Push -> Pull Request.
* **Infrastructure (IaC):** The `uniCloud-alipay` directory contains the backend infrastructure definition. Changes here directly affect the live backend. Deployments must be done carefully via HBuilderX.
* **Security:** Be mindful of security. Do not hardcode secrets or keys. Authentication is handled by `uni-id`, and page access rules are defined in `pages.json` under the `uniIdRouter` key.
* **Dependencies:** Frontend dependencies are added as `uni_modules`. Backend dependencies are managed via `package.json` files inside each cloud function's directory.
* **Commit Messages:** Follow the Conventional Commits specification. Use prefixes like `feat:`, `fix:`, `refactor:`, `docs:`, etc. (e.g., `feat: add user profile editing feature`).
