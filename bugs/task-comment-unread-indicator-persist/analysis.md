# 根本原因分析

## Root Cause
通过深入分析代码结构和评论状态管理机制，发现问题的根本原因是**缺少页面间的评论状态同步机制**。具体表现为：

1. **任务详情页面标记已读后没有通知机制**：在`pages/tasks/detail.vue`中，当用户停留1秒后会自动调用`markTaskAsRead`函数标记评论为已读，但该操作只更新了本地存储，没有触发任何事件来通知其他页面刷新评论状态。

2. **TodoBook详情页面缺少实时状态更新**：`pages/todobooks/detail.vue`通过`VirtualTaskList`组件显示任务列表，未读评论数通过`unreadCountsMap`计算，但该计算结果会被缓存，当用户从任务详情页返回时，不会主动重新计算未读状态。

3. **评论缓存清理时机不准确**：当前的`onShow`清理逻辑只在特定条件下执行（`fromListPage && !hasInitialized.value`），这意味着从任务详情页返回时不会触发缓存清理。

## Affected Code Locations

### 核心问题文件
1. **`/pages/tasks/detail.vue`** (第527-535行, onShow生命周期)
   - `markTaskAsRead`函数调用后缺少事件通知
   - 需要在标记已读后触发全局事件

2. **`/pages/todobooks/composables/useTaskComments.js`** (第253-266行)
   - `markTaskAsRead`函数实现完整但缺少事件触发
   - 需要添加事件分发机制

3. **`/pages/todobooks/detail.vue`** (第232-242行, onShow函数)
   - 评论缓存清理条件过于严格
   - 需要在页面显示时主动刷新评论状态

4. **`/pages/todobooks/components/task/VirtualTaskList.vue`** (未读计算逻辑)
   - `unreadCountsMap`计算结果被缓存，缺少实时更新机制
   - 需要监听评论状态变更事件

## Fix Strategy

### 策略概述
实现一个基于事件驱动的评论状态同步机制，确保任务详情页面的评论已读状态能够实时反映到TodoBook详情页面。

### 具体修复方案

#### 1. 在任务详情页面添加事件通知机制
- **位置**: `/pages/tasks/detail.vue` 和 `/pages/todobooks/composables/useTaskComments.js`
- **方案**: 在`markTaskAsRead`函数执行后，触发全局uni事件通知其他页面评论状态已更新
- **事件名称**: `task-comments-read`
- **事件数据**: `{ taskId, timestamp }`

#### 2. 在TodoBook详情页面监听评论状态更新事件
- **位置**: `/pages/todobooks/detail.vue`
- **方案**: 在页面生命周期中注册事件监听器，当收到评论已读事件时，清理对应任务的评论缓存并刷新显示
- **实现方式**: 使用`uni.$on`监听事件，调用`VirtualTaskList`的缓存清理方法

#### 3. 优化VirtualTaskList的缓存刷新机制
- **位置**: `/pages/todobooks/components/task/VirtualTaskList.vue`
- **方案**: 添加单个任务的评论缓存清理方法，避免清理全部缓存造成的性能损失
- **新增方法**: `clearTaskCommentCache(taskId)`

#### 4. 改进onShow的缓存清理逻辑
- **位置**: `/pages/todobooks/detail.vue` (onShow函数)
- **方案**: 移除过于严格的条件判断，确保每次页面显示时都能正确处理评论状态
- **优化**: 使用`nextTick`替代固定延时，提高响应速度

### 实现优先级
1. **高优先级**: 事件通知机制的添加（修复核心问题）
2. **中优先级**: 事件监听和缓存刷新逻辑
3. **低优先级**: onShow逻辑优化（提升用户体验）

## Alternative Solutions

### 方案A: 轮询刷新机制
定期检查本地存储中的已读记录变化，主动更新UI显示。
- **优点**: 实现简单，不需要复杂的事件系统
- **缺点**: 消耗更多资源，响应延迟较高，用户体验不佳

### 方案B: 全局状态管理
将评论未读状态放入全局状态管理器中统一管理。
- **优点**: 数据一致性更好，便于调试
- **缺点**: 增加系统复杂度，需要重构现有代码

### 选择当前策略的原因
当前选择的事件驱动方案具有以下优势：
- **最小化改动**: 在现有架构基础上添加事件机制，不需要大规模重构
- **性能优化**: 按需更新，避免不必要的计算和渲染
- **维护友好**: 符合Vue.js生态的最佳实践，便于后续维护
- **扩展性强**: 可以轻松扩展到其他类似的状态同步场景