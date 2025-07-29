# Requirements Document

## Introduction

这个功能旨在改进TodoBook详情页面中任务评论的显示方式。当前系统在每项任务中显示"未读消息有n条"的提示，用户希望改进为：1) 常驻显示每个任务下的评论总数；2) 当有未读评论时，用更简洁美观的方式（如红点提示）来显示未读状态，而无需显示具体的未读数量。

## Requirements

### Requirement 1

**User Story:** 作为TodoBook的用户，我希望能够在任务列表中看到每个任务的评论总数，以便我快速了解任务的讨论活跃度。

#### Acceptance Criteria

1. WHEN 用户查看TodoBook详情页面的任务列表 THEN 系统 SHALL 使用 `task.comments.length` 显示该任务的评论总数
2. WHEN 任务没有评论（comments.length === 0） THEN 系统 SHALL 不显示评论计数文本
3. WHEN 任务有评论（comments.length > 0） THEN 系统 SHALL 显示"X条评论"（X为task.comments.length的值）
4. WHEN 任务评论数量发生变化 THEN 系统 SHALL 通过现有的任务数据更新机制自动更新显示的评论数量

### Requirement 2

**User Story:** 作为TodoBook的用户，我希望当有未读评论时能够通过简洁的视觉提示（如红点）来知晓，而不需要看到具体的未读数量，这样界面更加简洁美观。

#### Acceptance Criteria

1. WHEN 任务有未读评论 THEN 系统 SHALL 复用现有的 `getTaskUnreadCount()` 函数判断未读状态，当返回值 > 0 时显示红色圆点提示器
2. WHEN 任务没有未读评论（getTaskUnreadCount() === 0） THEN 系统 SHALL 不显示未读提示器
3. WHEN 用户查看了任务的评论 THEN 系统 SHALL 通过现有的 `markTaskAsRead()` 函数标记已读并隐藏该任务的未读提示器
4. IF 任务有未读评论 THEN 未读提示器 SHALL 与评论总数显示在同一区域内，形成统一的视觉设计

### Requirement 3

**User Story:** 作为TodoBook的用户，我希望新的评论显示方式能够保持与现有UI设计的一致性，确保良好的用户体验。

#### Acceptance Criteria

1. WHEN 显示评论相关信息 THEN 系统 SHALL 复用现有TaskItem组件中的 `.comment-hint` 样式类，保持与现有设计的一致性
2. WHEN 未读提示器显示 THEN 系统 SHALL 使用现有的红色圆点样式（类似现有的 `uni-icons` 颜色 `#ff9800`）
3. WHEN 评论信息区域布局 THEN 系统 SHALL 在现有的 `.comment-hint` 区域内进行布局调整，确保不影响任务列表的整体排版
4. WHEN 在不同屏幕尺寸下显示 THEN 系统 SHALL 复用现有的响应式布局机制（card模式和item模式的差异化处理）

### Requirement 4

**User Story:** 作为TodoBook的用户，我希望评论显示功能能够高效地处理数据，不影响页面的加载和滚动性能。

#### Acceptance Criteria

1. WHEN 加载任务列表 THEN 系统 SHALL 复用现有的任务数据结构（task.comments数组已包含在任务数据中），无需额外请求评论数量
2. WHEN 评论数据更新 THEN 系统 SHALL 使用现有的 `useTaskCommentCache` 缓存机制和增量更新逻辑
3. WHEN 任务列表滚动 THEN 系统 SHALL 确保评论显示逻辑不会触发额外的数据请求，仅使用内存中的数据计算
4. IF 评论数据不可用 THEN 系统 SHALL 使用 `task.comments?.length || 0` 的安全访问方式，避免错误影响任务列表显示

### Requirement 5

**User Story:** 作为系统维护者，我希望新功能的实现尽可能简单，最大化复用现有代码，确保系统的稳定性和可维护性。

#### Acceptance Criteria

1. WHEN 实现评论总数显示 THEN 系统 SHALL 直接使用 `task.comments.length` 属性，不创建新的计算函数
2. WHEN 实现未读状态检查 THEN 系统 SHALL 复用现有的 `getTaskUnreadCount(taskId, task, currentUserId)` 函数
3. WHEN 修改UI组件 THEN 系统 SHALL 仅修改现有的 `TaskItem.vue` 组件中的 `.comment-hint` 区域，不创建新组件
4. WHEN 处理已读状态更新 THEN 系统 SHALL 复用现有的评论已读处理机制和事件通知系统