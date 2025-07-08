# CLAUDE.md

本文件为 Claude Code 在处理此代码库时提供指导。

## 项目概述

这是一个基于 **uni-app + Vue 3 + uniCloud** 的现代化待办事项管理应用，支持分层级的任务管理和实时云端同步。应用采用 B/S 架构，支持多平台部署（H5、小程序、原生应用）。

## 技术栈

### 前端架构
- **框架**: uni-app (Vue 3 Composition API)
- **UI组件**: uni-ui 组件库
- **状态管理**: 自定义 Vuex 替代方案（基于 Vue 3 reactive API）
- **样式**: SCSS + uni-scss 设计系统
- **用户认证**: uni-id-pages 认证页面模块

### 后端架构
- **云平台**: uniCloud 阿里云版本
- **数据库**: MongoDB (uniCloud DB)
- **云函数**: Node.js 云对象（Object）
- **认证系统**: uni-id-common

## 项目结构

### 核心目录
```
/
├── pages/                    # 页面文件
│   ├── list/list.vue        # 项目册列表（首页）
│   ├── ucenter/ucenter.vue  # 用户中心
│   ├── todobooks/           # 项目册相关页面
│   │   ├── detail.vue       # 项目册详情
│   │   ├── create.vue       # 创建项目册
│   │   ├── edit.vue         # 编辑项目册
│   │   └── members.vue      # 成员管理
│   ├── tasks/               # 任务相关页面
│   │   ├── detail.vue       # 任务详情
│   │   └── create.vue       # 创建任务
│   ├── statistics/          # 统计页面
│   │   └── overview.vue     # 数据统计概览
│   └── debug/debug.vue      # 数据库调试页面
├── store/                   # 状态管理
│   ├── index.js            # 主状态管理文件
│   ├── storage.js          # 本地存储管理
│   └── sync.js             # 同步逻辑
├── uniCloud-alipay/        # 云端代码
│   ├── cloudfunctions/     # 云函数
│   │   ├── todobook-co/    # 项目册管理云对象
│   │   ├── sync-co/        # 数据同步云对象
│   │   └── user-co/        # 用户管理云对象
│   └── database/           # 数据库Schema
├── uni_modules/            # uni-app 模块
├── static/                 # 静态资源
└── main.js                 # 应用入口
```

### 页面路由配置
- **底部导航**: 项目册列表、用户中心
- **认证页面**: 登录、注册（基于 uni-id-pages）
- **保护路由**: 用户中心需要登录（`uniIdRouter.needLogin`）
- **应用标题**: "TODO助手"

## 数据库设计

### 核心表结构

#### 1. todobooks - 项目册表
```javascript
{
  _id: String,                    // 主键ID
  title: String,                  // 项目册标题（必填，1-100字符）
  description: String,            // 项目册描述（最大500字符）
  creator_id: String,             // 创建者ID（自动设置为当前用户）
  color: String,                  // 颜色（默认#007AFF）
  icon: String,                   // 图标（默认folder）
  is_shared: Boolean,             // 是否共享（默认false）
  share_type: String,             // 共享类型（private/public/member）
  member_count: Number,           // 成员数量（默认1）
  item_count: Number,             // 任务数量（默认0）
  completed_count: Number,        // 已完成任务数量（默认0）
  sort_order: Number,             // 排序顺序（默认0）
  is_archived: Boolean,           // 是否归档（默认false）
  archived_at: Date,              // 归档时间
  last_activity_at: Date,         // 最后活动时间（自动设置）
  created_at: Date,               // 创建时间（自动设置）
  updated_at: Date                // 更新时间（自动设置）
}
```

#### 2. todoitems - 任务表
```javascript
{
  _id: String,                    // 主键ID
  todobook_id: String,            // 所属项目册ID（必填）
  parent_id: String,              // 父任务ID（空为顶级任务）
  title: String,                  // 任务标题（必填，1-200字符）
  description: String,            // 任务描述（最大2000字符）
  creator_id: String,             // 创建者ID（自动设置）
  assignee_id: String,            // 指派用户ID
  status: String,                 // 状态（todo/in_progress/completed/cancelled）
  priority: String,               // 优先级（low/medium/high/urgent）
  tags: Array,                    // 标签列表
  due_date: Date,                 // 截止日期
  completed_at: Date,             // 完成时间
  level: Number,                  // 层级（0-2）
  progress: Number,               // 进度百分比（0-100）
  estimated_hours: Number,        // 预估工时
  actual_hours: Number,           // 实际工时
  sort_order: Number,             // 排序顺序
  subtask_count: Number,          // 子任务数量
  completed_subtask_count: Number,// 已完成子任务数量
  attachments: Array,             // 附件列表
  comments: Array,                // 评论列表
  is_recurring: Boolean,          // 是否循环任务
  recurrence_rule: Object,        // 循环规则
  last_activity_at: Date,         // 最后活动时间
  created_at: Date,               // 创建时间
  updated_at: Date                // 更新时间
}
```

#### 3. todobook_members - 成员表
```javascript
{
  _id: String,                    // 主键ID
  todobook_id: String,            // 项目册ID（必填）
  user_id: String,                // 用户ID（必填，自动设置）
  role: String,                   // 角色（owner/admin/member）
  permissions: Array,             // 权限列表
  joined_at: Date,                // 加入时间（自动设置）
  invited_by: String,             // 邀请人ID
  last_access_at: Date,           // 最后访问时间
  is_active: Boolean,             // 是否活跃（默认true）
  nickname: String,               // 项目册内昵称
  notification_settings: Object   // 通知设置
}
```

#### 4. sync_records - 同步记录表（系统表）
```javascript
{
  _id: String,                    // 主键ID
  user_id: String,                // 用户ID
  device_id: String,              // 设备ID
  sync_type: String,              // 同步类型（manual/auto）
  sync_direction: String,         // 同步方向（bidirectional）
  status: String,                 // 状态（in_progress/completed/failed）
  local_version: String,          // 本地版本
  remote_version: String,         // 远程版本
  created_at: Date,               // 创建时间
  completed_at: Date              // 完成时间
}
```

#### 5. user_settings - 用户设置表
```javascript
{
  _id: String,                    // 主键ID
  user_id: String,                // 用户ID（唯一索引）
  sync_on_startup: Boolean,       // 启动时同步
  sync_on_background: Boolean,    // 后台同步
  auto_sync_interval: Number,     // 自动同步间隔（秒）
  theme: String,                  // 主题
  language: String,               // 语言
  notification_enabled: Boolean,  // 通知开关
  created_at: Date,               // 创建时间
  updated_at: Date                // 更新时间
}
```

### 权限控制规则
所有表都配置了完整的权限控制：
- **基本权限**: read、create、update、delete、count 都要求用户已登录
- **所有者权限**: 只有创建者可以更新和删除项目册
- **成员权限**: 通过 `get()` 方法进行表关联验证
- **自动字段**: `creator_id`、`user_id`、`created_at`、`updated_at` 等字段自动设置

### 数据库索引
- `todobooks`: 按 `creator_id` 和 `created_at` 建立复合索引
- `todoitems`: 按 `todobook_id` 和 `status` 建立复合索引
- `todobook_members`: 按 `todobook_id` 和 `user_id` 建立复合索引
- `user_settings`: `user_id` 唯一索引

## 云函数架构

### 1. todobook-co - 项目册管理云对象
```javascript
// 主要方法
- getTodoBooks()           // 获取项目册列表
- getTodoBookDetail()      // 获取项目册详情
- createTodoBook()         // 创建项目册
- updateTodoBook()         // 更新项目册
- deleteTodoBook()         // 删除项目册
- createTodoItem()         // 创建任务
- updateTodoItemStatus()   // 更新任务状态
- deleteTodoItem()         // 删除任务
- addMember()             // 添加成员
- removeMember()          // 移除成员
- updateMemberRole()      // 更新成员角色
```

### 2. sync-co - 数据同步云对象
```javascript
// 主要方法
- startSync()             // 开始同步
- uploadData()            // 上传本地数据
- downloadData()          // 下载云端数据
- completeSync()          // 完成同步
- getSyncStatus()         // 获取同步状态
- cancelSync()            // 取消同步
```

### 3. user-co - 用户管理云对象
```javascript
// 主要方法
- getUserProfile()        // 获取用户信息
- updateUserProfile()     // 更新用户信息
- getUserSettings()       // 获取用户设置
- updateUserSettings()    // 更新用户设置
- getUserStatistics()     // 获取用户统计
```

## 状态管理系统

### 全局状态结构
```javascript
const state = {
  sync: {                        // 同步状态
    status: 'idle',              // 同步状态
    lastSyncTime: null,          // 上次同步时间
    syncProgress: 0,             // 同步进度
    errorMessage: ''             // 错误信息
  },
  todoBooks: {                   // 项目册数据
    list: [],                    // 项目册列表
    loading: false,              // 加载状态
    lastRefresh: null            // 上次刷新时间
  },
  currentBook: {                 // 当前项目册
    info: null,                  // 项目册信息
    tasks: [],                   // 任务列表
    members: [],                 // 成员列表
    loading: false               // 加载状态
  },
  cache: {                       // 本地缓存
    todoBooks: new Map(),        // 项目册缓存
    tasks: new Map(),            // 任务缓存
    lastUpdate: null             // 缓存更新时间
  },
  settings: {                    // 应用设置
    syncOnStartup: true,         // 启动时同步
    syncOnBackground: false,     // 后台同步
    autoSyncInterval: 300,       // 自动同步间隔
    theme: 'light',              // 主题
    language: 'zh-CN'            // 语言
  }
}
```

### 操作方法
- **syncActions**: 同步相关操作（`startSync`、`uploadData`、`downloadData`、`completeSync`）
- **todoBookActions**: 项目册操作（`loadTodoBooks`、`createTodoBook`、`loadBookDetail`、`updateTaskStatus`）
- **localStorageActions**: 本地存储操作（`getAllTodoBooks`、`getAllTasks`、`mergeCloudData`）
- **settingsActions**: 设置操作（`loadSettings`、`saveSettings`）

## 数据同步机制

### 同步策略
1. **双向同步**: 本地数据上传到云端，云端数据下载到本地
2. **增量同步**: 基于时间戳的增量数据同步
3. **冲突处理**: 使用更新时间较晚的数据覆盖冲突
4. **状态追踪**: 完整的同步状态追踪和错误处理

### 同步时机
- 应用启动时（可配置）
- 进入项目册详情时
- 用户手动触发
- 定时自动同步（可配置）
- 网络状态变化时

### 同步流程
1. 开始同步 → 创建同步记录
2. 上传本地数据 → 处理本地变更
3. 下载云端数据 → 获取远程更新
4. 合并数据 → 解决冲突
5. 完成同步 → 更新同步状态

## 开发指南

### 开发流程
1. 使用 HBuilderX 打开项目
2. 关联 uniCloud 服务空间
3. 上传部署云函数
4. 初始化数据库Schema
5. 运行到目标平台

### 主要命令
- **运行**: 通过 HBuilderX "运行" 菜单
- **构建**: 通过 HBuilderX "发行" 菜单
- **云函数部署**: 右键云函数目录选择"上传部署"
- **数据库部署**: 右键 database 目录选择"初始化数据库"

### 调试工具
- **数据库调试**: `pages/debug/debug.vue`
- **控制台日志**: 云函数和前端的 console.log
- **uniCloud控制台**: 云函数日志和数据库管理

## 核心功能特性

### 1. 分层级任务管理
- 支持 TodoBook → TodoItem → SubItem 三级结构
- 任务状态管理（待办、进行中、已完成、已取消）
- 优先级设置（低、中、高、紧急）
- 进度追踪和工时统计

### 2. 协作功能
- 项目册共享和成员管理
- 角色权限控制（所有者、管理员、成员）
- 任务分配和评论功能
- 实时协作和通知

### 3. 数据同步
- 实时云端同步
- 离线操作支持
- 冲突检测和解决
- 增量同步优化

### 4. 统计分析
- 任务完成率统计
- 优先级分布分析
- 活动时间统计
- 项目进度可视化

## 安全特性

### 数据安全
- 所有数据操作都需要用户认证
- 基于用户ID的数据隔离
- 严格的权限控制规则
- 防止数据越权访问

### 权限控制
- 项目册级别的权限管理
- 成员角色和权限配置
- 操作权限验证
- 敏感操作日志记录

## 性能优化

### 前端优化
- 组件懒加载
- 列表虚拟滚动
- 图片压缩和缓存
- 数据分页加载

### 后端优化
- 数据库索引优化
- 云函数冷启动优化
- 批量操作支持
- 缓存策略

### 存储优化
- 本地数据压缩
- 过期数据清理
- 缓存容量限制
- 智能预加载

## 错误处理

### 前端错误处理
- 网络错误重试机制
- 用户友好的错误提示
- 错误日志收集
- 降级处理策略

### 后端错误处理
- 统一错误码规范
- 详细错误日志记录
- 异常恢复机制
- 监控和告警

## 扩展性设计

### 模块化架构
- 功能模块独立开发
- 插件化扩展机制
- 标准化接口设计
- 配置化功能开关

### 云函数扩展
- 云对象模块化设计
- 通用模块复用
- 第三方服务集成
- 微服务架构支持

---

## 重要提醒

1. **开发环境**: 本项目依赖 HBuilderX 开发环境，没有传统的 npm scripts
2. **云函数部署**: 所有云函数都需要通过 HBuilderX 部署到 uniCloud
3. **数据库Schema**: 数据库结构变更需要在 uniCloud 控制台执行
4. **权限验证**: 所有数据操作都经过严格的权限验证
5. **同步机制**: 数据同步是应用的核心功能，需要特别注意同步状态管理

本项目采用现代化的云原生架构，具有良好的扩展性和维护性，适合作为企业级待办事项管理系统的基础架构。