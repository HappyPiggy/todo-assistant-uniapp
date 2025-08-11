# Bug Report

## Bug Description
在iOS端，首次进入统计页面时，饼图无法看到（不可见），但是可以触发点击事件，说明组件已经渲染但视觉上不显示。

## Reproduction Steps
1. 在iOS设备上打开应用
2. 导航到TodoBook的统计页面
3. 首次加载时观察饼图区域
4. 尝试点击饼图区域

## Expected Behavior
饼图应该在首次加载时正常显示，包含正确的颜色、扇形和标签。

## Actual Behavior
- 饼图在首次加载时不可见（视觉上看不到）
- 但是饼图的点击事件仍然可以正常触发
- Canvas上下文需要重新初始化才能正常显示
- 需要通过延迟重绘和二次重绘来确保图表显示

## Environment
- **平台**: iOS端
- **组件**: PieChartCanvas.vue, EnhancedExpensePieChart.vue
- **技术栈**: uni-app + Vue 3 + Canvas
- **相关文件**: 
  - `pages\todobooks\components\statistics\PieChartCanvas.vue`
  - `pages\todobooks\components\statistics\EnhancedExpensePieChart.vue`
  - `pages\todobooks\components\statistics\ExpenseTagItem.vue`

## Impact and Severity
**严重程度**: Medium
**影响范围**: 仅影响iOS端用户首次查看统计数据的体验，功能本身可用但需要额外的重绘机制来确保显示。

## 相关日志
```
7 平台信息: {platform: "ios", isAndroid: false, isMP: false}
00:14:25.547 PieChartCanvas - Canvas上下文不存在，尝试重新初始化
00:14:25.547 PieChartCanvas - 重新初始化Canvas成功，继续绘制
00:14:25.580 延迟重绘：数据更新，触发Canvas重绘
00:14:25.782 二次重绘：确保图表显示
00:14:25.798 PieChartCanvas - 开始初始化Canvas
00:14:25.803 PieChartCanvas - 尝试初始化Canvas (第1次)
00:14:25.808 PieChartCanvas - Canvas上下文初始化成功
00:14:25.908 PieChartCanvas - 初始化完成，开始绘制图表
```