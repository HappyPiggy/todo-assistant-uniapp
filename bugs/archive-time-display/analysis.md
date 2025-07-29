# Root Cause Analysis

## Root Cause
经过代码分析，问题的根本原因是：

1. **时间格式化问题**: `pages/archive-management/index.vue` 中的 `formatDate()` 函数将归档时间格式化为相对时间格式（今天、昨天、X天前），而用户需要显示具体的日期时间。

2. **缺少调试日志**: 当前代码缺少足够的调试日志来验证后端返回的 `archived_at` 字段数据是否正确，难以排查潜在的数据问题。

## Affected Code Locations

### 需要修改的文件
1. **`/pages/archive-management/index.vue`**
   - **修改位置**: `formatDate()` 函数 (第100-113行)
   - **修改原因**: 当前返回相对时间格式，需要改为具体日期时间格式

2. **`/pages/archive-management/composables/useArchiveData.js`**
   - **修改位置**: `loadArchivedBooks()` 函数 (第49-92行)
   - **修改原因**: 增加详细的调试日志，输出后端返回的完整数据结构

### 当前问题代码
```javascript
// pages/archive-management/index.vue 第100-113行
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}
```

## Fix Strategy

### 1. 修改时间格式化函数
将 `formatDate()` 函数修改为返回具体的日期时间格式：
- 显示格式：`YYYY-MM-DD HH:mm`
- 处理空值情况
- 保持良好的可读性

### 2. 增加调试日志
在 `useArchiveData.js` 的 `loadArchivedBooks()` 函数中增加详细日志：
- 记录云函数调用参数
- 记录返回的完整数据结构
- 特别关注 `archived_at` 字段的值和格式
- 记录每个归档项目册的关键字段

### 3. 数据验证
确保前端正确处理后端返回的时间戳数据：
- 验证 `archived_at` 字段存在且有效
- 处理可能的时区问题
- 确保时间格式化不会出错

## Alternative Solutions

### 方案1（推荐）: 显示具体日期时间
- 优点：信息准确，用户可以知道确切的归档时间
- 缺点：显示内容较长
- 格式：`2024-01-15 14:30`

### 方案2: 同时显示相对时间和具体时间
- 优点：既有直观性又有准确性
- 缺点：显示内容更长，可能影响UI布局
- 格式：`2024-01-15 14:30 (3天前)`

### 方案3: 可配置的时间显示格式
- 优点：用户可以选择偏好的显示方式
- 缺点：增加复杂性，需要额外的设置功能
- 实现：添加用户设置选项

基于用户需求和实现复杂度，推荐采用**方案1**，直接显示具体的日期时间。

## Implementation Plan

1. **第一步**: 修改 `formatDate()` 函数，改为返回具体日期时间格式
2. **第二步**: 在 `useArchiveData.js` 中增加详细的调试日志
3. **第三步**: 测试验证修改后的显示效果和数据正确性
4. **第四步**: 确保其他使用相同函数的地方不受影响（如果有的话）