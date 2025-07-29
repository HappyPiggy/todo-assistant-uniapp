# Bug Report

## Bug Description

在TaskItem.vue组件中，commentDisplayText的刷新机制存在两套不同的逻辑，导致评论显示不一致。一套刷新任务下的所有评论（包含所有回复），另一套不包含所有回复。需要统一成包含所有回复的版本。

## Reproduction Steps

1. 打开 `/pages/todobooks/detail.vue` 页面，进入任务列表
2. 观察任务的评论显示文本（commentDisplayText），此时显示的是一套逻辑
3. 上下拖动任务列表，触发静默加载评论功能
4. 观察评论显示文本被覆盖，显示为另一套不同的逻辑
5. 对比两次显示的差异：初始进入时显示一套计数，静默加载后显示另一套计数

## Expected Behavior

所有情况下，commentDisplayText都应该显示任务下的所有评论，包括所有回复的总数。评论计数应该保持一致性。

## Actual Behavior

存在两套不同的评论刷新逻辑：
- **初始加载逻辑**：刚进入 `/pages/todobooks/detail.vue` 时显示的评论计数（一套逻辑）
- **静默加载逻辑**：上下拖动任务列表时，触发静默加载评论功能，覆盖之前的显示（另一套逻辑）

这两套逻辑在评论计数方式上不一致，导致同一任务的评论显示数量在不同时机下可能不同。

## Environment

- **Framework**: uni-app + Vue 3
- **Component**: /pages/todobooks/components/task/TaskItem.vue
- **Affected Function**: commentDisplayText computed property (line 232-241)
- **Related Code**: commentCount computed property (line 214-221)

## Impact and Severity

**Severity**: Medium

**Impact**: 
- 用户体验不一致，评论数显示混乱
- 可能导致用户对评论功能的困惑
- 影响任务管理的准确性判断