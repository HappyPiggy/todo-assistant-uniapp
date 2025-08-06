# 分析报告

## 根本原因

经过代码分析，发现了两个问题的根本原因：

### 问题1：饼图首次进入时不显示

**根本原因**：组件生命周期和数据传递的时序问题
- 在 `statistics.vue:141` 处，切换到 `expense` tab 时会调用 `loadExpenseData()`
- `loadExpenseData()` 函数计算完数据后会更新 `tagGroups.value`，但此时 `ExpensePieChart` 组件可能还未完全渲染
- `ExpensePieChart.vue:146` 中的 `watch` 监听器设置了 `immediate: false`，导致初始数据不会触发绘制
- 在组件挂载时（`ExpensePieChart.vue:179`），由于数据传递的异步性，`props.chartData` 可能还是空数组

### 问题2：标签明细中预算和支出金额统计错误

**根本原因**：数据计算逻辑中的重复计算问题
- 在 `useExpenseData.js:103` 处，代码尝试避免重复计算任务金额，使用了 `group.tasks.find(t => t._id === task._id)` 来检查
- 但是这个逻辑存在问题：当一个任务有多个标签时，任务只会被添加到第一个标签的统计中，其他标签不会统计该任务的金额
- 正确的逻辑应该是：每个标签都应该完整统计分配给它的任务金额，而不是避免重复计算

## 受影响的代码位置

### 饼图显示问题：
1. `/pages/todobooks/statistics.vue:141` - Tab切换逻辑
2. `/pages/todobooks/components/statistics/ExpensePieChart.vue:146` - watch监听器配置
3. `/pages/todobooks/components/statistics/ExpensePieChart.vue:179` - 组件挂载时的绘制逻辑

### 金额统计问题：
1. `/pages/todobooks/composables/useExpenseData.js:103-114` - 重复任务检查逻辑

## 修复策略

### 修复1：饼图显示问题
1. 在 `ExpensePieChart.vue` 中将 watch 的 `immediate` 设置为 `true`，确保初始数据能触发绘制
2. 改进 `statistics.vue` 中的数据加载时序，确保在切换tab时数据已经准备好
3. 在 `ExpensePieChart.vue` 的挂载逻辑中增加更可靠的数据检查和延迟重试机制

### 修复2：金额统计问题
1. 移除 `useExpenseData.js` 中的重复任务检查逻辑（第103-114行）
2. 简化标签金额计算，确保每个标签都能正确统计分配给它的任务金额
3. 修改逻辑让每个任务的预算和支出按标签数平均分配，或者让每个标签都统计完整的任务金额

## 替代解决方案

### 替代方案1：完全重构数据传递
- 将消费数据计算移到 `statistics.vue` 的 `onLoad` 中，确保在任何tab切换之前数据都已准备完毕
- 但这可能影响页面首次加载性能

### 替代方案2：使用不同的标签统计策略
- 可以考虑按任务标签数平分金额，而不是每个标签统计全额
- 但这可能不符合用户期望的统计逻辑

选择当前修复策略是因为：
1. 保持了现有的数据统计逻辑语义
2. 修复范围最小，影响面可控
3. 符合用户对标签统计的预期行为