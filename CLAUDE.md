# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern task management application built with **uni-app + Vue 3 + uniCloud**, supporting hierarchical task management and real-time cloud synchronization. The application uses a B/S architecture and supports multi-platform deployment (H5, mini-programs, native apps).

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

#### Cache Architecture
- **Three-layer cache system**: Memory cache (`state.todoBooks.list`) → Local storage (with user ID isolation) → Cloud data, prioritizing the fastest available cache
- **User isolation mechanism**: All cache keys include user ID suffix (e.g., `cached_todobooks_userId`) to ensure data isolation in multi-user environments
- **Auto-update notification**: After updating cache via `updateTodoBooksCache()`, automatically emits `todobooks-cache-updated` event to notify all pages to refresh
- **Cache validity period**: Local storage cache has a default 10-minute validity period, automatically fetches from cloud after expiration
- **Graceful degradation**: Returns expired cache data on network failure to ensure offline usability

#### Cache Operation APIs
**Reading Cache:**
- `getTodoBooksFromCache()` - Read cache by priority (memory → local storage → return empty)
- `getCacheStatus()` - Get current cache status (count, update time, validity)

**Updating Cache:**
- `updateTodoBooksCache(books)` - Update all three cache layers and emit update event
- `loadTodoBooks(options, forceRefresh)` - Load data (supports cache-first or force refresh)
- `refreshTodoBooks()` - Force refresh from cloud and update cache

**Clearing Cache:**
- `clearTodoBooksCache()` - Clear all cache for current user
- `onUserSwitch(newUserId)` - Clear cache on user switch and emit switch event

**Cache Sync:**
- `silentSyncTodoBooks()` - Background silent sync without affecting current display
- `createTodoBook()` / `updateTodoBook()` / `deleteTodoBook()` - CRUD operations auto-update cache

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