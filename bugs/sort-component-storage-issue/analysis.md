# 分析报告: 排序组件存储问题

## Root Cause

通过代码分析，发现问题的根本原因是**排序组件的初始化和本地存储读取逻辑不同步**：

### 具体技术原因：

1. **useTaskData组合式函数的初始化时机不当**
   - 在 `useTaskData.js:290-291` 中，组合式函数在创建时会调用 `loadSortFromStorage(bookId)` 加载本地排序偏好
   - 但此时的 `currentSort` ref对象已经被设置为 `initialSort`，并且这个值被传递给了所有子组件

2. **TaskSort组件显示逻辑问题**
   - 在 `TaskSort.vue:41-51` 中，`currentSortText` 计算属性直接依赖 `props.currentSort`
   - 该props来自父组件传递的 `currentSort` 状态，始终显示 `useTaskData` 初始化时的值

3. **TaskSortPicker组件存储逻辑正确但未被应用**
   - `TaskSortPicker.vue:168-196` 中的 `loadSortFromLocal()` 函数能正确读取存储的数据
   - 但该函数只在组件挂载时被调用，用于设置弹窗内的选中状态 (`tempSelectedSort`)
   - 存储的排序偏好没有在页面初始化时被应用到实际的任务排序中

4. **数据流断层**
   - `useTaskData` 在初始化时加载存储偏好，但如果 `bookId` 为空或用户ID未准备好，会返回默认排序
   - `TaskSortPicker` 独立地加载存储偏好用于显示选中状态，但这个加载结果没有回传给父组件

## Affected Code Locations

需要修改的文件和具体位置：

### 1. `/pages/todobooks/composables/useTaskData.js`
- **行267-286**: `loadSortFromStorage` 函数 - 需要确保在用户ID和bookId都准备好后再调用
- **行288-302**: `useTaskData` 函数初始化部分 - 需要添加重新加载存储偏好的逻辑
- **行764-772**: `setSortOption` 函数 - 需要在设置排序时同时保存到本地存储

### 2. `/pages/todobooks/components/task/TaskSortPicker.vue`
- **行217-236**: `onMounted` 钩子 - 当检测到存储的排序与当前不同时，需要自动应用
- **行239-252**: `currentUserId` 监听器 - 需要在用户ID变化时通知父组件重新应用排序

### 3. `/pages/todobooks/detail.vue`
- 需要在组件挂载后检查并应用存储的排序偏好

## Fix Strategy

采用**统一的排序状态管理策略**，确保存储读取、状态更新和UI显示的一致性：

### 核心修复逻辑：

1. **延迟初始化排序状态**
   - 在 `useTaskData` 中，不在创建时立即设置排序，而是等待 `bookId` 和 `currentUserId` 都准备好
   - 添加 `initializeSortFromStorage()` 方法，在合适时机调用

2. **统一存储管理**
   - 将排序的保存逻辑移动到 `useTaskData` 的 `setSortOption` 方法中
   - 移除 `TaskSortPicker` 中的独立存储逻辑，避免重复

3. **响应式排序状态同步**
   - 在 `detail.vue` 中监听 `currentUserId` 和 `bookId` 的变化
   - 当两者都准备好时，主动调用排序初始化方法

4. **UI状态自动更新**
   - 确保 `TaskSort` 组件能正确响应 `currentSort` 的变化
   - 确保任务列表的 `sortedTasks` 计算属性能及时更新

### 修复步骤：

1. **第一步**: 修改 `useTaskData.js`，添加排序初始化方法和统一的存储逻辑
2. **第二步**: 修改 `TaskSortPicker.vue`，移除独立的存储逻辑，专注于UI交互
3. **第三步**: 修改 `detail.vue`，在合适时机调用排序初始化
4. **第四步**: 测试验证修复效果

## Alternative Solutions

### 方案A: 事件驱动的排序同步（当前选择）
- 优点：逻辑清晰，责任分离明确
- 缺点：需要修改多个文件

### 方案B: 全局排序状态管理
- 将排序状态提升到全局store中管理
- 优点：状态集中管理，一致性更强
- 缺点：改动范围更大，可能影响其他功能

### 方案C: 组件内部状态同步
- 在每个组件内部单独处理存储同步
- 优点：改动最小
- 缺点：容易出现状态不一致问题

选择方案A是因为它在保持现有架构的基础上，通过明确的数据流和责任分离来解决问题，风险最小且效果最好。