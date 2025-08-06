# Bug Report: 统计页面问题

## Bug Description
统计页面存在多个用户体验和视觉问题，包括时间线排序错误、任务卡片信息过于复杂、整体页面样式不够高级。

## Reproduction Steps
1. 打开应用并登录
2. 进入任意TodoBook
3. 点击进入统计页面
4. 查看"总览"标签页的时间线
5. 观察时间线上的任务排序和样式
6. 切换查看其他统计标签页

## Expected Behavior
- 时间线应该按照完成时间正序排列（最早完成的在前）
- 任务卡片应该简洁清晰，只显示核心信息
- 页面整体视觉效果应该更加高级、专业

## Actual Behavior
- 时间线排序是倒序的（最新完成的在前）
- 任务卡片显示信息过多，视觉上显得拥挤
- 页面整体样式偏素，缺乏视觉层次感

## Environment
- 平台: uni-app H5/小程序
- 框架: Vue 3 + uni-app
- 页面路径: /pages/todobooks/statistics.vue

## Impact and Severity
- **影响**: 影响用户查看和理解统计数据的效率
- **严重程度**: Medium（中等）- 功能可用但用户体验不佳