# Bug Analysis

## Root Cause

经过详细的代码分析，问题的根本原因在于：**前端缺少对归档状态的权限控制检查**。具体表现为：

### 1. 任务状态修改问题
- 在 `/pages/todobooks/detail.vue` 中，虽然有 `isArchived` 计算属性来检测归档状态，但在实际的任务状态切换操作中，没有对归档状态进行阻止
- `toggleTaskStatus` 和 `toggleSubtaskStatus` 方法在 `/pages/todobooks/composables/useTaskData.js` 中实现，但没有加入归档状态的检查逻辑
- 前端组件传递了 `is-archived` 属性到子组件，但子组件可能没有正确使用这个属性来禁用操作

### 2. 后端权限控制存在但不完整
- 后端云函数在 `/uniCloud-alipay/cloudfunctions/todobook-co/lib/utils/permission.js` 中有权限检查机制
- 但权限检查主要基于用户身份和成员权限，**没有检查项目册的归档状态**
- 即使项目册已归档，如果用户有权限，仍然可以修改任务状态

### 3. 权限控制不一致
- 前端的 `canEdit` 计算属性考虑了归档状态：`!isArchived.value && hasPermission.value`
- 但这个检查没有一致地应用到所有需要编辑权限的操作上
- 任务增删改、评论功能的权限检查不够全面

## Affected Code Locations

### 前端文件需要修改：
1. `/pages/todobooks/composables/useTaskData.js:313` - `toggleTaskStatus` 方法
2. `/pages/todobooks/composables/useTaskData.js:466` - `toggleSubtaskStatus` 方法  
3. `/pages/todobooks/detail.vue:355` - `addTask` 方法
4. `/pages/todobooks/detail.vue:381` - `editTask` 方法
5. `/pages/todobooks/detail.vue:387` - `deleteTask` 方法
6. 评论相关组件 - 需要检查评论输入功能是否有归档状态限制

### 后端云函数需要修改：
1. `/uniCloud-alipay/cloudfunctions/todobook-co/lib/utils/permission.js:77` - `checkTaskPermission` 方法
2. `/uniCloud-alipay/cloudfunctions/todobook-co/lib/utils/permission.js:14` - `checkTodoBookPermission` 方法
3. `/uniCloud-alipay/cloudfunctions/todobook-co/module/comments/add-task-comment.js:19` - `addTaskComment` 方法

## Fix Strategy

### 1. 前端权限控制增强
- 在所有任务相关操作前添加归档状态检查
- 修改 `toggleTaskStatus` 和 `toggleSubtaskStatus` 方法，在执行前检查项目册的归档状态
- 确保 `addTask`、`editTask`、`deleteTask` 方法都有归档状态检查
- 在任务组件中正确使用 `isArchived` 属性来禁用相关操作按钮

### 2. 后端权限控制完善  
- 在权限检查函数中增加归档状态验证
- 修改 `checkTaskPermission` 和 `checkTodoBookPermission` 方法，当项目册处于归档状态时拒绝写操作
- 在任务状态更新、评论添加等关键操作前检查归档状态
- 保持读权限不受归档状态影响

### 3. 一致性保证
- 确保前后端对归档状态的权限控制逻辑一致
- 在前端显示适当的错误提示信息
- 添加单元测试验证权限控制的正确性

### 4. 用户体验优化
- 在归档状态下显示明确的提示信息
- 禁用相关操作按钮而不是在操作时才报错
- 保持界面的一致性和可用性

## Alternative Solutions

### 方案一：仅前端控制（不推荐）
- 优点：实现简单，响应快速
- 缺点：安全性不足，可通过API绕过限制

### 方案二：仅后端控制（部分有效）
- 优点：安全性高
- 缺点：用户体验差，操作后才知道被拒绝

### 方案三：前后端双重控制（推荐方案）
- 优点：既保证安全性又提供良好用户体验
- 缺点：实现复杂度略高，但收益明显