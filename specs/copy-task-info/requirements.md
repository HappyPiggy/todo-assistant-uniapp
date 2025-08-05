# Requirements Document

## Introduction

本功能旨在为任务管理应用增加便捷的复制操作，让用户能够快速复制任务信息、任务描述和评论内容。通过长按手势触发复制操作，并提供友好的反馈提示，提升用户在分享和记录任务信息时的体验效率。

## Requirements

### Requirement 1

**User Story:** As a 用户, I want 在任务列表中长按任务项复制所有任务信息, so that 我可以方便地分享或保存完整的任务详情

#### Acceptance Criteria

1. WHEN 用户在任务列表中长按任务项超过500毫秒 THEN 系统 SHALL 触发复制操作
2. WHEN 复制操作触发 THEN 系统 SHALL 将任务的主要信息（标题、描述、标签、截止日期、创建时间、预算、实际花费等）格式化为易读的文本格式
3. WHEN 任务信息复制到剪贴板 THEN 系统 SHALL 显示toast提示"已复制任务信息"
4. IF 复制操作失败 THEN 系统 SHALL 显示错误提示"复制失败，请重试"
5. WHEN 任务包含子任务 THEN 系统 SHALL 在格式化文本中包含子任务信息

### Requirement 2

**User Story:** As a 用户, I want 在任务详情页面长按任务描述复制描述内容, so that 我可以快速复制任务的具体描述信息

#### Acceptance Criteria

1. WHEN 用户在任务详情页面长按任务描述区域超过500毫秒 THEN 系统 SHALL 触发复制操作
2. WHEN 复制操作触发 THEN 系统 SHALL 将任务描述的完整文本内容复制到剪贴板
3. WHEN 描述内容复制到剪贴板 THEN 系统 SHALL 显示toast提示"已复制任务描述"
4. IF 任务描述为空 THEN 系统 SHALL 不触发复制操作
5. WHEN 描述包含富文本格式 THEN 系统 SHALL 复制纯文本内容

### Requirement 3

**User Story:** As a 用户, I want 在评论区长按评论内容复制评论, so that 我可以引用或保存其他人的评论

#### Acceptance Criteria

1. WHEN 用户在评论区长按评论内容超过500毫秒 THEN 系统 SHALL 触发复制操作
2. WHEN 复制操作触发 THEN 系统 SHALL 将评论内容、评论者和评论时间格式化复制到剪贴板
3. WHEN 评论内容复制到剪贴板 THEN 系统 SHALL 显示toast提示"已复制评论"
4. IF 评论内容包含图片或附件 THEN 系统 SHALL 只复制文本内容，并在格式化文本中标注"[图片]"或"[附件]"
5. WHEN 用户长按自己的评论 THEN 系统 SHALL 同样支持复制操作

### Requirement 4

**User Story:** As a 用户, I want 复制的内容格式清晰易读, so that 我可以直接粘贴使用而无需二次编辑

#### Acceptance Criteria

1. WHEN 系统格式化任务信息 THEN 格式 SHALL 包含明确的字段标签和适当的换行
2. WHEN 系统格式化评论内容 THEN 格式 SHALL 包含评论者昵称、时间戳和评论正文
3. WHEN 复制内容包含时间信息 THEN 系统 SHALL 使用用户友好的时间格式（如：2024年1月1日 14:30）
4. IF 内容包含空值字段 THEN 系统 SHALL 在格式化时省略该字段或显示"未设置"
5. WHEN 内容过长（超过5000字符） THEN 系统 SHALL 在末尾添加"...[内容已截断]"提示