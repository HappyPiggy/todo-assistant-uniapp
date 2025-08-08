# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern task management application built with **uni-app + Vue 3 + uniCloud**, supporting hierarchical task management and real-time cloud synchronization. The application uses a B/S architecture and supports multi-platform deployment (H5, mini-programs, native apps).

## Tech Stack

### Frontend Architecture
- **Framework**: uni-app (Vue 3 Composition API)
- **UI Components**: uni-ui component library + custom unified components
- **State Management**: Custom reactive store (based on Vue 3 reactive API)
- **Styling**: SCSS + unified design system with mixins
- **Authentication**: uni-id-pages authentication module

### Backend Architecture
- **Cloud Platform**: uniCloud alipay version
- **Database**: MongoDB (uniCloud DB)
- **Cloud Functions**: Modular Node.js Cloud Objects
- **Authentication System**: uni-id-common

## Project Structure

### Core Directories
```
/
├── pages/                    # Page files
│   ├── list/list.vue        # TodoBook list (homepage with pinning)
│   ├── ucenter/ucenter.vue  # User center
│   ├── todobooks/           # TodoBook pages
│   │   ├── detail.vue       # TodoBook details with task management
│   │   ├── create.vue       # Create new TodoBook
│   │   ├── edit.vue         # Edit TodoBook
│   │   ├── members.vue      # Member management
│   │   ├── statistics.vue   # Statistics visualization
│   │   ├── components/      # TodoBook components
│   │   │   ├── common/      # Unified components (UniTag, etc.)
│   │   │   ├── book/        # TodoBook specific components
│   │   │   └── task/        # Task related components
│   │   ├── composables/     # Composition functions
│   │   │   ├── useBookData.js    # TodoBook data management
│   │   │   ├── useBookForm.js    # Form handling
│   │   │   └── useTaskData.js    # Task filtering & sorting
│   │   ├── utils/           # Utility functions
│   │   └── styles/          # SCSS modules
│   ├── tasks/               # Task pages
│   │   ├── detail.vue       # Task details with comments
│   │   └── form.vue         # Create/Edit task
│   ├── tags/                # Tag management
│   │   └── manage.vue       # Tag CRUD operations
│   ├── archive-management/  # Archive management
│   │   └── index.vue        # Archived TodoBooks management
│   ├── settings/            # Settings pages
│   │   └── share-management.vue  # Share management
│   └── debug/debug.vue      # Database debugging page
├── composables/             # Global composables
│   ├── usePinning.js       # User-level pinning preferences
│   └── useCommentsCache.js # LRU cache for comments
├── store/                   # State management
│   ├── index.js            # Main store (sync state & settings)
│   ├── storage.js          # Local storage management
│   └── sync.js             # Sync logic
├── uniCloud-alipay/        # Cloud code
│   ├── cloudfunctions/     # Cloud functions
│   │   ├── todobook-co/    # TodoBook cloud object
│   │   │   └── module/     # Modular architecture
│   │   │       ├── todobook/    # TodoBook management
│   │   │       ├── task/        # Task management
│   │   │       ├── member/      # Member management
│   │   │       ├── comments/    # Comment system
│   │   │       └── share/       # Share functionality
│   │   ├── sync-co/        # Data sync cloud object
│   │   └── user-co/        # User management cloud object
│   └── database/           # Database Schema
├── uni_modules/            # uni-app modules
├── static/                 # Static resources
├── bugs/                   # Bug tracking and fixes
├── unit-test/              # Unit test files
│   ├── composables/        # Tests for composables
│   ├── pages/              # Tests for page components
│   ├── store/              # Tests for store modules
│   └── utils/              # Tests for utility functions
└── main.js                 # Application entry
```

## Common Development Commands

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
- **Performance Testing**: Use browser DevTools for performance profiling

## Architecture Patterns

### Frontend Patterns
- **Component Design**: Single File Components (SFC) with Composition API
- **State Management**: Event-driven architecture with direct cloud access
- **Data Flow**: Unidirectional data flow with reactive state
- **Routing**: uni-app built-in routing system (configured in `pages.json`)
- **Component Organization**: Feature-based directory structure

### Backend Patterns
- **Cloud Objects**: Modular cloud functions with clear separation of concerns
- **Module Organization**: Each feature as a separate module in cloud objects
- **Permission Control**: Schema-based permission configuration
- **Error Handling**: Unified error response format

### Data Architecture
- **Database**: MongoDB document store with referential integrity
- **Schema Validation**: JSON Schema validation with strict type checking
- **Relationships**: Foreign key references (todobook_id, user_id, parent_id)
- **Data Access Pattern**: Direct cloud access without local caching

## Key Features

### Hierarchical Task Management
- **Three-level structure**: TodoBook → TodoItem → SubItem
- **Task states**: todo, in_progress, completed
- **Priority levels**: low, medium, high, urgent
- **Virtual scrolling**: Performance optimization for large task lists

### Real-time Cloud Sync
- **Direct cloud access**: Every operation fetches latest data
- **Event-driven updates**: Cross-page synchronization via events
- **Conflict prevention**: Server-side data validation
- **Optimistic UI**: Immediate feedback with rollback on error

### Team Collaboration
- **TodoBook sharing**: Share via invitation codes
- **Member roles**: owner, admin, member with different permissions
- **Archive management**: Archived TodoBooks with read-only access
- **Activity tracking**: Member actions and timestamps

### UI/UX Features
- **Unified components**: Consistent design language (UniTag system)
- **Macaron color scheme**: Soft, pleasant visual experience
- **Responsive design**: Mobile-first approach
- **Performance optimizations**: Virtual lists, lazy loading, LRU caching

## Development Guidelines

### Code Conventions
- **File naming**: kebab-case for files, PascalCase for components
- **Component structure**: `<template>`, `<script setup>`, `<style lang="scss">`
- **Import paths**: Use `@/` alias for project root
- **Logging**: Use `JSON.stringify(object, null, 2)` for object logging

### State Management
- **Global store**: Only for sync state and app settings
- **Business logic**: Use composables (useBookData, useTaskData)
- **Event system**: `uni.$emit` / `uni.$on` for cross-component communication
- **Local storage**: Managed via `/store/storage.js`

### Data Management Best Practices

#### Direct Cloud Access Pattern
```javascript
// Always fetch fresh data from cloud
import { useBookData } from '@/pages/todobooks/composables/useBookData.js'

const { loadTodoBooks, createTodoBook } = useBookData()

// Operations automatically emit update events
await createTodoBook(data) // Emits 'todobooks-updated'
```

#### Event-Driven Updates
```javascript
// Listen for updates in any component
onMounted(() => {
  uni.$on('todobooks-updated', refreshData)
})

onUnmounted(() => {
  uni.$off('todobooks-updated', refreshData)
})
```

### Component Development
- **Composition API**: Always use `<script setup>` syntax
- **Props validation**: Define props with proper types and validators
- **Error handling**: Show user-friendly error messages
- **Loading states**: Always implement loading indicators
- **Empty states**: Design meaningful empty state UI

### Performance Optimization
- **Virtual scrolling**: Use `VirtualTaskList` for large lists
- **Lazy loading**: Comments and images load on demand
- **Debouncing**: Search and filter operations are debounced
- **Caching strategy**: LRU cache for frequently accessed data

### Cloud Function Development
- **Modular structure**: Separate modules for different features
- **Input validation**: Validate all inputs at cloud function level
- **Error responses**: Return consistent error format
- **Permission checks**: Always verify user permissions
- **Transaction support**: Use database transactions for critical operations

## Testing Guidelines

### Unit Testing
- **Test location**: All unit tests must be placed in `/unit-test/` directory at project root
- **Directory structure**: Mirror the source code structure within unit-test directory
  ```
  /unit-test/
  ├── composables/      # Tests for composables
  ├── pages/            # Tests for page components
  ├── store/            # Tests for store modules
  └── utils/            # Tests for utility functions
  ```
- **Naming convention**: Test files should follow `[filename].test.js` pattern
- **Test framework**: Use appropriate testing framework for uni-app
- Test composables independently
- Mock cloud function calls
- Test error scenarios

### Integration Testing
- Test complete user flows
- Verify data consistency
- Test permission boundaries

### Performance Testing
- Monitor render performance
- Check memory usage
- Optimize bundle size

## Important Notes

- **IDE requirement**: HBuilderX is required for full functionality
- **Cloud configuration**: uniCloud account and space setup needed
- **Database initialization**: Collections must be created before use
- **Authentication**: uni-id system handles all authentication
- **File separation**: Complex templates need component extraction, complex logic needs composable extraction


## Language Guidelines

- 回答使用中文
- 专属词、特定词不用翻译（如：uni-app, Vue, TodoBook, Cloud Functions 等技术术语保持英文）
- 代码注释使用中文，便于团队协作

## Development Memories

- 新增vue文件时，需要将css/scss分离到不同文件，如果template里的样式复杂，需要创建组件来实现
- 如果逻辑复杂，需要拆分出组合式函数，导出到vue使用
- vue文件遵守vue3的开发规范，使用 `<script setup>` 语法
- 所有数据操作通过对应的 composable 函数进行，不直接调用云函数
- 组件间通信优先使用事件系统，保持松耦合
- 生成单元测试时，统一放在根目录的 `/unit-test/` 目录下，按照源代码结构组织测试文件
- 新增后端云函数时，参数传递不要传递对象，同样前端调用云函数时，也不要传递对象，参数逐一传递即可
- 新增功能时，要考虑兼容web、安卓、微信小程序