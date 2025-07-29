# Bug Report

## Bug Description
归档页面的归档项目册列表中，归档时间字段(`archived_at`)当前使用相对时间格式（今天、昨天、X天前等），但用户需要显示具体的日期时间，而不是相对时间格式。同时需要增加调试日志来验证后端返回的项目册数据是否正确。

## Reproduction Steps
1. 打开应用，导航到归档管理页面(`/pages/archive-management/index`)
2. 查看归档项目册列表中每个项目册的显示内容
3. 重点观察归档时间的显示格式和其他相关信息

## Expected Behavior
归档项目册列表应该显示以下完整信息：
- 项目册图标（带颜色背景）
- 项目册标题
- 归档时间（具体日期时间格式，如：2024-01-15 14:30）
- 任务统计（X任务 · X成员 · X%完成）
- 增加调试日志显示后端返回的完整数据结构

## Actual Behavior
当前代码实现：
- 归档时间通过`formatDate(book.archived_at)`显示为相对时间格式（今天、昨天、X天前等）
- 缺少后端数据的调试日志，无法确认`archived_at`字段是否正确返回
- 需要改为显示具体的日期时间格式
- 需要增加调试信息来验证数据完整性

## Environment
- 项目：uni-app + Vue 3 + uniCloud
- 相关文件：
  - `/pages/archive-management/index.vue` - 归档页面主文件  
  - `/pages/archive-management/composables/useArchiveData.js` - 数据管理
  - `/uniCloud-alipay/cloudfunctions/todobook-co/module/todobook/get-todobooks.js` - 云函数
  - `/uniCloud-alipay/database/todobooks.schema.json` - 数据库schema

## Impact and Severity
**Severity: Medium**
- 用户无法看到具体的归档时间，影响对归档历史的准确了解
- 缺少调试信息导致难以排查数据问题
- 影响用户体验和数据可读性

## Technical Analysis
通过代码分析发现的关键信息：

### 数据流程
1. **数据获取**: `useArchiveData.loadArchivedBooks()` 调用云函数 `todobook-co.getTodoBooks({archived_only: true})`
2. **字段返回**: 云函数应该返回 `archived_at` 字段（timestamp类型）
3. **时间格式化**: 前端使用 `formatDate()` 函数处理相对时间显示
4. **归档设置**: 通过 `useBookData.archiveTodoBook()` 设置 `archived_at: new Date()`

### 显示内容
归档页面每个项目册显示：
- 图标（带颜色背景）
- 标题
- 归档时间：`归档于 {{ formatDate(book.archived_at) }}`
- 统计信息：`{{ book.item_count || 0 }} 任务 · {{ book.member_count || 1 }} 成员 · {{ calculateProgress(book) }}% 完成`

### 潜在问题点
1. 云函数是否正确返回 `archived_at` 字段
2. 时间格式化函数是否处理空值情况
3. 统计数据（任务数、成员数、完成进度）是否准确

代码结构完整，建议进行实际测试验证。