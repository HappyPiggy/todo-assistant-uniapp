# Bug Report

## Bug Description
导入他人分享的 TodoBook 项目册后，子任务（SubItem）没有正常显示，但是任务数量统计显示正常。

## Reproduction Steps
1. 用户 A 创建一个 TodoBook，包含多个任务（TodoItem）和子任务（SubItem）
2. 用户 A 将该 TodoBook 分享，生成分享码
3. 用户 B 使用分享码导入该 TodoBook 
4. 用户 B 在导入的 TodoBook 中查看任务详情
5. 观察到任务数量统计正常显示，但子任务列表为空或不显示

## Expected Behavior
导入分享的 TodoBook 后，应该完整显示所有的任务和子任务，包括：
- 所有 TodoItem 正常显示
- 所有 SubItem 在对应的 TodoItem 下正常显示
- 任务数量统计与实际显示的任务/子任务数量一致

## Actual Behavior
- TodoItem 正常显示
- 任务数量统计正常（说明数据可能已保存）
- SubItem 不显示或显示为空

## Environment
- Framework: uni-app + Vue 3
- Backend: uniCloud (MongoDB)
- 相关功能模块: TodoBook 分享功能 (`/specs/todobook-sharing`)
- 涉及文件: 分享导入相关的 cloud functions 和前端组件

## Impact and Severity
**严重级别**: Medium
**影响范围**: 
- 影响用户间 TodoBook 分享协作功能
- 导致导入的项目数据不完整
- 用户体验受损，可能导致用户误以为数据丢失

## Additional Notes
需要排查的关键点：
1. 后端创建/导入时是否正确保存了 SubItem 数据
2. 前端显示时是否正确读取和渲染 SubItem 数据
3. 数据关联关系是否正确（todobook_id, todoitem_id 等外键关系）