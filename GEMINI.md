# GEMINI.MD: AI Collaboration Guide

This document provides essential context for AI models interacting with this project. Adhering to these guidelines will ensure consistency and maintain code quality.

## 1. Project Overview & Purpose

* **Primary Goal:** A modern, multi-platform to-do list application named "TODO助手". It supports hierarchical task management (TodoBook → TodoItem → SubItem), real-time cloud synchronization, and offline operations.
* **Business Domain:** Productivity, Task Management.

## 工作流

<workflow>
0. 请注意！必须遵守以下的规则，每个环节完成后都需要由我进行确认后才可进行下一个环节；
1. 如果你判断我的输入提出的是一个新需求，可以按照下面的标准软件工程的方式独立开展工作，需要时才向我询问，可以采用 interactiveDialog 工具来收集
2. 每当我输入新的需求的时候，为了规范需求质量和验收标准，你首先会搞清楚问题和需求，然后再进入下一阶段
3. 需求文档和验收标准设计：首先完成需求的设计,按照 EARS 简易需求语法方法来描述,如果你判断需求涉及到前端页面，也可在需求中提前确定好设计风格和配色等，跟我进行确认需求细节，最终确认清楚后，需求定稿，然后再进入下一阶段，保存在 `specs/spec_name/requirements.md` 中，参考格式如下

```markdown
# 需求文档

## 介绍

需求描述

## 需求

### 需求 1 - 需求名称

**用户故事：** 用户故事内容

#### 验收标准

1. 采用 ERAS 描述的子句 While <可选前置条件>, when <可选触发器>, the <系统名称> shall <系统响应>，例如 When 选择"静音"时，笔记本电脑应当抑制所有音频输出。
2. ...
...
```
4. 技术方案设计： 在完成需求的设计之后，你会根据当前的技术架构和前面确认好的需求，进行需求的技术方案设计，精简但是能够准确的描述技术的架构（例如架构、技术栈、技术选型、数据库/接口设计、测试策略、安全性），必要时可以用 mermaid 来绘图，跟我确认清楚后，保存在  `specs/spec_name/design.md`  中，然后再进入下一阶段
5. 任务拆分：在完成技术方案设计后，你会根据需求文档和技术方案，细化具体要做的事情，跟我确认清楚后，，保存在`specs/spec_name/tasks.md` 中, 然后再进入下一阶段，开始正式执行任务，同时需要及时更新任务的状态，执行的时候尽可能独立自主运行，保证效率和质量

任务参考格式如下

``` markdown
# 实施计划

- [ ] 1. 任务信息
  - 具体要做的事情
  - ...
  - _需求: 相关的需求点的编号

```
</workflow>

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
