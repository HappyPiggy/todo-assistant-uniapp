# 分析报告: 统计页面问题

## Root Cause

通过代码分析，发现了以下问题的根本原因：

1. **时间线排序问题**：
   - 在 `StatisticsOverviewTab.vue` 第94行，时间线数据使用了倒序排序：`sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))`
   - 这导致最新完成的任务显示在最前面，而不是最早完成的

2. **任务卡片信息过多**：
   - 在 `TaskTimelineChart.vue` 第41-88行，任务卡片显示了过多信息：
     - 任务标题、完成时间、优先级、层级、工时信息、标签
   - 卡片样式过于复杂，包含了渐变背景、阴影等多层效果

3. **页面整体样式偏素**：
   - `statistics.scss` 中的样式定义较为基础，缺乏视觉层次
   - 缺少高级的视觉效果如毛玻璃、微动画、渐变色等
   - 颜色使用单调，主要使用了基础的白色背景和简单阴影

## Affected Code Locations

1. `/pages/todobooks/components/statistics/StatisticsOverviewTab.vue`
   - 第91-100行：时间线数据处理逻辑

2. `/pages/todobooks/components/statistics/TaskTimelineChart.vue`
   - 第41-88行：任务卡片模板结构
   - 第318-445行：任务卡片相关样式

3. `/pages/todobooks/styles/statistics.scss`
   - 整体样式定义需要增强

## Fix Strategy

1. **修复时间线排序**：
   - 将排序逻辑改为正序：`sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))`
   - 确保最早完成的任务显示在最前面

2. **简化任务卡片显示**：
   - 只保留核心信息：任务标题、标签、完成时间
   - 移除或隐藏次要信息：优先级徽章、层级、工时信息
   - 简化卡片样式，减少视觉噪音

3. **提升页面视觉效果**：
   - 添加渐变背景和毛玻璃效果
   - 增强卡片阴影和边框效果
   - 添加微动画和过渡效果
   - 使用更丰富的颜色方案
   - 优化字体层次和间距

## Alternative Solutions

1. **时间线排序**：可以添加用户可选的排序方式（正序/倒序切换）
2. **任务卡片**：可以提供展开/收起功能，默认简洁显示，点击展开详情
3. **视觉样式**：可以提供主题切换功能，让用户选择简约或高级风格