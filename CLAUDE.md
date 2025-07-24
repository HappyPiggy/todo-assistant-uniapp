# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern task management application built with **uni-app + Vue 3 + uniCloud**, supporting hierarchical task management and real-time cloud synchronization. The application uses a B/S architecture and supports multi-platform deployment (H5, mini-programs, native apps).

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


## Tech Stack

### Frontend Architecture
- **Framework**: uni-app (Vue 3 Composition API)
- **UI Components**: uni-ui component library
- **State Management**: Custom Vuex alternative (based on Vue 3 reactive API)
- **Styling**: SCSS + uni-scss design system
- **Authentication**: uni-id-pages authentication module

### Backend Architecture
- **Cloud Platform**: uniCloud Aliyun version
- **Database**: MongoDB (uniCloud DB)
- **Cloud Functions**: Node.js Cloud Objects
- **Authentication System**: uni-id-common

## Project Structure

### Core Directories
```
/
├── pages/                    # Page files
│   ├── list/list.vue        # TodoBook list (homepage)
│   ├── ucenter/ucenter.vue  # User center
│   ├── todobooks/           # TodoBook pages
│   │   ├── detail.vue       # TodoBook details
│   │   ├── create.vue       # Create TodoBook
│   │   ├── edit.vue         # Edit TodoBook
│   │   └── members.vue      # Member management
│   ├── tasks/               # Task pages
│   │   ├── detail.vue       # Task details
│   │   └── create.vue       # Create task
│   ├── statistics/          # Statistics pages
│   │   └── overview.vue     # Data overview
│   └── debug/debug.vue      # Database debugging page
├── store/                   # State management
│   ├── index.js            # Main state management file
│   ├── storage.js          # Local storage management
│   └── sync.js             # Sync logic
├── uniCloud-alipay/        # Cloud code
│   ├── cloudfunctions/     # Cloud functions
│   │   ├── todobook-co/    # TodoBook cloud object
│   │   ├── sync-co/        # Data sync cloud object
│   │   └── user-co/        # User management cloud object
│   └── database/           # Database Schema
├── uni_modules/            # uni-app modules
├── static/                 # Static resources
└── main.js                 # Application entry
```

## Common Development Commands

### Running the Application
Since this is a uni-app project, use HBuilderX IDE for development:

1. **Run to Browser (H5)**:
   - Open project in HBuilderX
   - Click "Run" → "Run to Browser" → Select browser
   - Default dev server runs on http://localhost:8080

2. **Run to WeChat Mini Program**:
   - Configure WeChat AppID in manifest.json
   - Click "Run" → "Run to Mini Program Simulator" → "WeChat Developer Tools"

3. **Run to Mobile App**:
   - Click "Run" → "Run to Phone or Emulator" → Select target

### Cloud Function Development

1. **Deploy Cloud Functions**:
   - Right-click on cloud function folder in HBuilderX
   - Select "Upload and Deploy"

2. **Initialize Database**:
   - Access uniCloud web console
   - Create database collections based on schemas in `/uniCloud-alipay/database/`

### Testing and Debugging

- **Database Debugging**: Navigate to `/pages/debug/debug.vue` in the running app
- **Console Logging**: Use `console.log()` for debugging, objects should be logged with `JSON.stringify(object, null, 2)`

## Architecture Patterns

### Frontend Patterns
- **Component Design**: Single File Components (SFC) with Composition API
- **State Management**: Centralized store using Vue 3 reactive system (see `/store/index.js`)
- **Data Flow**: Unidirectional data flow with reactive state
- **Routing**: uni-app built-in routing system (configured in `pages.json`)

### Backend Patterns
- **Cloud Objects**: Object-oriented cloud functions replacing traditional functions
- **Module Organization**: Each cloud object organized by functional modules
- **Permission Control**: Schema-based permission configuration

### Data Architecture
- **Database**: MongoDB document store
- **Schema Validation**: JSON Schema validation
- **Relationships**: Foreign key references (e.g., todobook_id, user_id)
- **Sync Strategy**: Incremental sync with conflict detection

## Key Features

### Hierarchical Task Management
- Three-level structure: TodoBook → TodoItem → SubItem
- Task states: todo, in_progress, completed
- Priority levels: low, medium, high, urgent

### Real-time Cloud Sync
- Incremental sync mechanism
- Conflict detection and resolution
- Offline operation support
- Auto/manual sync modes

### Team Collaboration
- TodoBook sharing
- Member role management (owner, admin, member)
- Permission control system

## Development Guidelines

### Code Conventions
- Follow existing code style in neighboring files
- Use uni-ui components when available
- Maintain consistent naming patterns
- Log objects using `JSON.stringify(object, null, 2)` for debugging

### State Management
- Global state is managed in `/store/index.js`
- Use `store.state` for accessing state
- Use `store.mutations` for state updates
- Local storage managed via `/store/storage.js`

#### Data Management
- **Direct cloud data access**: All data operations directly request the latest data from the cloud, no local caching
- **Composable function pattern**: TodoBook operations are handled by `useBookData` composable function in `/pages/todobooks/composables/useBookData.js`
- **Auto-update notification**: After data operations, automatically emits `todobooks-updated` event to notify all pages to refresh
- **Real-time synchronization**: Every access and modification requests the latest data from the cloud to ensure data freshness

#### Data Operation APIs (via useBookData composable)
**Import and Usage:**
```javascript
import { useBookData } from '@/pages/todobooks/composables/useBookData.js'

// In component setup
const { 
  loadTodoBooks, 
  createTodoBook, 
  updateTodoBook, 
  deleteTodoBook,
  refreshTodoBooks,
  clearTodoBooks,
  onUserSwitch
} = useBookData()
```

**Available Methods:**
- `loadTodoBooks(options)` - Load data directly from cloud
- `refreshTodoBooks()` - Refresh data from cloud
- `createTodoBook(data)` / `updateTodoBook(id, data)` / `deleteTodoBook(id)` - CRUD operations with real-time cloud sync
- `archiveTodoBook(id)` - Archive a TodoBook
- `clearTodoBooks()` - Clear local memory data
- `onUserSwitch(newUserId)` - Clear data on user switch and emit switch event
- `loadBookDetail(id, loadTasks)` - Load detailed TodoBook data
- `loadStatisticsData(id)` / `refreshStatistics(id)` - Load and refresh statistics data

**Store Role:**
- The global store (`/store/index.js`) now only manages sync-related state and app settings
- All TodoBook business logic has been moved to the `useBookData` composable function
- TodoBook data is managed entirely through the `useBookData` composable and event system

### Component Development
- Check existing components in `/pages/todobooks/components/` for patterns
- Use Composition API for new components
- Implement proper props validation
- Handle loading and error states

### Cloud Function Development
- Follow the cloud object pattern in existing functions
- Implement proper error handling
- Add permission checks for sensitive operations
- Return consistent response formats

## Important Notes

- This is a uni-app project requiring HBuilderX IDE for full functionality
- Cloud functions require uniCloud account and space configuration
- Database collections must be created before first use
- Authentication is handled by uni-id system

## Language Guidelines

- 回答使用中文
- 专属词、特定词不用翻译（如：uni-app, Vue, TodoBook, Cloud Functions 等技术术语保持英文）

## Development Memories

- 新增vue文件时，需要将css/scss分离到不同文件，如果template里的样式复杂，需要创建组件来实现。如果逻辑复杂，需要拆分出组合式函数，导出到vue使用。vue文件遵守vue3的开发规范