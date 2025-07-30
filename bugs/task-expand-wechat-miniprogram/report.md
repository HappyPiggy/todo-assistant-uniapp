# Bug Report: task-expand-wechat-miniprogram

## Bug Description
在TodoBook详情页面中，包含子任务的任务在H5模拟器中可以正常展开/收起，但在微信小程序中无法展开。

## Reproduction Steps
1. 打开TodoBook详情页面 (`pages/todobooks/detail.vue`)
2. 确保页面中存在包含子任务的任务项（`subtask_count > 0`）
3. 在H5模拟器中点击该任务项，任务可以正常展开/收起
4. 在微信小程序中点击同样的任务项，任务无法展开

## Expected Behavior
- 在微信小程序中点击包含子任务的任务时，应该能够展开显示子任务列表
- 再次点击时应该能够收起子任务列表
- 行为应该与H5模拟器中的表现一致

## Actual Behavior
- 在微信小程序中点击包含子任务的任务时，任务不会展开
- 没有任何响应或错误提示
- H5模拟器中功能正常，说明逻辑本身没有问题

## Environment
- **开发环境**: HBuilderX + uni-app
- **前端框架**: Vue 3 + uni-app
- **问题平台**: 微信小程序
- **正常平台**: H5模拟器
- **涉及组件**: VirtualTaskList组件 (通过`@task-click`事件处理)

## Impact and Severity
- **影响范围**: 微信小程序用户无法查看和管理子任务
- **严重程度**: High - 影响核心功能的用户体验
- **用户影响**: 微信小程序用户的任务管理功能受到限制