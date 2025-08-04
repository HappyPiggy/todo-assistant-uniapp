# Bug Report

## Bug Description
标签管理页面存在两个问题：
1. 编辑和删除按钮在UI上融为一体，视觉分离不明显
2. 编辑标签颜色后，修改没有同步应用到包含该标签的任务中

## Reproduction Steps
1. 打开应用并导航到标签管理页面 (`/pages/tags/manage.vue`)
2. 查看已有标签列表右上角的编辑和删除按钮
3. 点击编辑按钮，修改某个标签的颜色
4. 保存修改
5. 返回任务列表，查看包含该标签的任务

## Expected Behavior
1. 编辑和删除按钮合并为单一的编辑入口
2. 修改标签颜色后，所有包含该标签的任务应该立即显示新的颜色

## Actual Behavior
1. 编辑和删除按钮在视觉上融为一体，难以区分
2. 修改标签颜色后，包含该标签的任务仍显示旧颜色

## Environment
- 框架：uni-app + Vue 3
- 平台：H5/小程序
- 后端：uniCloud

## Impact and Severity
- 影响：用户体验差，标签管理功能不完整
- 严重程度：Medium（中等）- 影响功能使用但不阻塞核心流程