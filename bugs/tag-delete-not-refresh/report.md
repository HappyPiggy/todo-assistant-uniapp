# Bug Report - Tag删除后列表未刷新

## Bug Description
在tag标签页打开tag编辑功能，成功删除选中的tag后，虽然后端删除操作成功，但tag标签页的已有tag列表仍显示已删除的tag，列表未能自动刷新。

## Reproduction Steps
1. 进入tag标签页
2. 点击打开tag编辑功能
3. 选中一个需要删除的tag
4. 执行删除操作
5. 确认删除操作
6. 观察tag列表

## Expected Behavior
- 删除操作成功后，已删除的tag应立即从tag列表中消失
- tag列表应自动刷新，显示最新的tag数据

## Actual Behavior
- 后端删除操作成功（可通过数据库或网络请求确认）
- 但前端tag列表仍显示已删除的tag
- 需要手动刷新页面或重新进入才能看到更新后的列表

## Environment
- 应用框架：uni-app + Vue 3
- 运行平台：H5/小程序
- 浏览器版本：（待确认）
- 操作系统：（待确认）

## Impact and Severity
- **影响**：用户体验不佳，可能造成用户困惑，认为删除操作失败
- **严重程度**：Medium - 功能可用但体验不佳，不影响核心业务流程