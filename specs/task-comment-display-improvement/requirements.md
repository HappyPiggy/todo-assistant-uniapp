# Requirements Document

## Introduction

这个功能旨在改进TodoBook详情页面中任务评论的显示方式。当前系统在每项任务中显示"未读消息有n条"的提示，用户希望改进为：1) 常驻显示每个任务下的评论总数；2) 当有未读评论时，用更简洁美观的方式（如红点提示）来显示未读状态，而无需显示具体的未读数量。

## Requirements

### Requirement 1

**User Story:** 作为TodoBook的用户，我希望能够在任务列表中看到每个任务的评论总数，以便我快速了解任务的讨论活跃度。

#### Acceptance Criteria

1. WHEN 用户查看TodoBook详情页面的任务列表 THEN 系统 SHALL 在每个任务项中显示该任务的评论总数
2. WHEN 任务没有评论 THEN 系统 SHALL 不显示任何文本
3. WHEN 任务有评论 THEN 系统 SHALL 显示"X条评论"（X为实际评论数量）
4. WHEN 任务评论数量发生变化 THEN 系统 SHALL 实时更新显示的评论数量

### Requirement 2

**User Story:** 作为TodoBook的用户，我希望当有未读评论时能够通过简洁的视觉提示（如红点）来知晓，而不需要看到具体的未读数量，这样界面更加简洁美观。

#### Acceptance Criteria

1. WHEN 任务有未读评论 THEN 系统 SHALL 显示一个红色圆点或类似的视觉提示器
2. WHEN 任务没有未读评论 THEN 系统 SHALL 不显示未读提示器
3. WHEN 用户查看了任务的评论 THEN 系统 SHALL 隐藏该任务的未读提示器
4. IF 任务有未读评论 THEN 未读提示器 SHALL 与评论总数显示在同一区域内，形成统一的视觉设计

### Requirement 3

**User Story:** 作为TodoBook的用户，我希望新的评论显示方式能够保持与现有UI设计的一致性，确保良好的用户体验。

#### Acceptance Criteria

1. WHEN 显示评论相关信息 THEN 系统 SHALL 使用与现有任务列表项一致的字体、颜色和间距
2. WHEN 未读提示器显示 THEN 系统 SHALL 使用符合应用整体设计语言的颜色和形状
3. WHEN 评论信息区域布局 THEN 系统 SHALL 确保不影响任务列表的整体排版和可读性
4. WHEN 在不同屏幕尺寸下显示 THEN 系统 SHALL 保持评论显示信息的清晰度和可访问性

### Requirement 4

**User Story:** 作为TodoBook的用户，我希望评论显示功能能够高效地处理数据，不影响页面的加载和滚动性能。

#### Acceptance Criteria

1. WHEN 加载任务列表 THEN 系统 SHALL 批量获取评论数量信息，避免为每个任务单独请求
2. WHEN 评论数据更新 THEN 系统 SHALL 使用增量更新机制，只更新变化的数据
3. WHEN 任务列表滚动 THEN 系统 SHALL 确保评论显示不影响虚拟滚动的性能
4. IF 评论数据加载失败 THEN 系统 SHALL 显示默认状态（如"--"），而不影响任务列表的正常显示