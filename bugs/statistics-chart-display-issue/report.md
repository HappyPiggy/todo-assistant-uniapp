# Bug报告

## Bug描述
消费统计页面首次进入时，饼图无法正常显示，需要手动切换一次标签（如从"实际支出"切换到"预算"再切换回来）才能看到饼图。

## 复现步骤
1. 打开uni-uitest应用
2. 进入任意TodoBook
3. 点击"数据统计"进入统计页面
4. 切换到"消费统计"标签页
5. 观察饼图区域是否正常显示

## 期望行为
首次进入消费统计页面时，应该立即显示饼图，无需用户进行额外操作。

## 实际行为
首次进入时饼图区域为空白或显示加载状态，必须手动切换标签（预算/实际支出）才能触发饼图正常渲染。

## 环境
- 框架: uni-app + Vue 3
- 组件: EnhancedExpensePieChart.vue
- 平台: 支持多平台 (H5, 小程序, APP)
- 相关文件: 
  - pages/todobooks/statistics.vue
  - pages/todobooks/components/statistics/StatisticsExpenseTab.vue
  - pages/todobooks/components/statistics/EnhancedExpensePieChart.vue

## 影响和严重级别
**严重程度: Medium**
- 影响用户体验，需要额外操作才能查看数据
- 不影响核心功能，但降低了界面的易用性
- 可能导致用户认为功能异常或数据加载失败