# Bug Report

## Bug Description
加载项目册时出现 `Cannot read property 'length' of undefined` 错误，导致页面渲染失败。用户怀疑是导入分享项目册功能引起的。

## Reproduction Steps
1. 启动应用
2. 尝试加载项目册列表
3. 应用报错 `Cannot read property 'length' of undefined`
4. 错误出现在 `pages\todobooks\composables\useBookData.js:28` 和相关位置

## Expected Behavior
- 项目册列表应该正常加载
- 不应该出现 JavaScript 运行时错误
- 页面应该正常渲染

## Actual Behavior
- Vue 渲染函数执行时出现未处理的错误
- 控制台输出多个 `Cannot read property 'length' of undefined` 错误
- 页面无法正常显示项目册列表

## Environment
- 项目类型: uni-app + Vue 3
- 运行环境: H5 浏览器
- 错误时间: 22:12:30
- 相关文件: 
  - `pages\todobooks\composables\useBookData.js`
  - `pages\list\list.vue`

## Impact and Severity
- **严重级别**: High
- **影响范围**: 核心功能无法使用
- **用户体验**: 应用基本功能失效，用户无法查看项目册列表