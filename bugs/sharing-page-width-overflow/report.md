# Bug Report: 分享管理页面宽度适配问题

## Bug Description
分享管理页面存在宽度适配问题，页面内容过宽导致在某些设备或屏幕尺寸下显示不全，影响用户体验。

## Reproduction Steps
1. 打开TodoBook分享功能相关页面
2. 进入分享管理页面
3. 观察页面在不同屏幕宽度下的显示效果
4. 发现页面内容超出可视区域，出现横向滚动或内容被截断

## Expected Behavior
分享管理页面应该能够：
- 在不同屏幕尺寸下正确适配
- 内容完整显示在可视区域内
- 提供良好的响应式体验
- 不出现不必要的横向滚动

## Actual Behavior
- 页面宽度过宽，超出屏幕可视区域
- 部分内容显示不全或被截断
- 在小屏幕设备上用户体验较差
- 可能出现横向滚动条

## Environment
- 项目：uni-app + Vue 3 + uniCloud 任务管理应用
- 框架：uni-app (Vue 3 Composition API)
- UI组件：uni-ui component library
- 样式：SCSS + uni-scss design system
- 平台：多平台支持 (H5, 小程序, 原生应用)

## Impact and Severity
- **影响范围**：所有使用分享管理功能的用户
- **严重级别**：Medium
- **用户体验影响**：中等 - 功能可用但体验不佳
- **业务影响**：可能影响用户使用分享功能的积极性