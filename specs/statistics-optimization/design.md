# 设计文档

## 概述

本设计文档描述了项目册统计页面的优化方案。通过重新组织统计功能为"总览统计"和"消费统计"两个核心模块，提供更直观的数据可视化和分析能力。设计充分利用现有的组件化架构和数据模型，确保与现有系统的无缝集成。

## 架构

### 整体架构

```
统计页面 (statistics.vue)
├── Tab切换控制器 (StatisticsTabBar)
├── 总览统计模块 (OverviewTab)
│   ├── 项目册信息卡片
│   ├── 任务完成时间线
│   └── 任务详情导航
└── 消费统计模块 (ExpenseTab)
    ├── 总预算/支出卡片
    ├── 标签支出饼图
    ├── 标签详细列表
    └── 视图切换控制
```

### 数据流设计

1. **数据获取层**
   - 页面初始化时通过 `useBookData` 一次性获取所有任务数据
   - 数据缓存在组件状态中，避免重复请求
   - 新增 `useExpenseData` composable 处理消费相关数据计算

2. **数据处理层（纯前端计算）**
   - 总览统计：在前端聚合任务状态、计算完成率、处理时间线数据
   - 消费统计：在前端进行预算/支出聚合、按标签分组计算、排序处理
   - 所有计算使用 computed 属性，确保响应式更新和缓存优化

3. **展示层**
   - 使用响应式数据绑定展示计算结果
   - Tab 切换时直接使用已计算的数据，无需重新请求或计算
   - 实现虚拟滚动优化大数据量展示
   - 图表组件采用 uni-app 兼容的可视化方案

## 组件和接口

### 主要组件

#### 1. StatisticsTabBar (修改现有)
```javascript
// 更新为只包含两个tab
const tabs = [
  { key: 'overview', label: '总览统计', icon: '📊' },
  { key: 'expense', label: '消费统计', icon: '💰' }
]
```

#### 2. StatisticsOverviewTab (新建)
- **功能**：展示项目册概览信息和任务时间线
- **Props**：
  - `bookData`: 项目册基本信息
  - `tasksData`: 所有任务数据
  - `statsData`: 统计汇总数据

#### 3. StatisticsExpenseTab (新建)
- **功能**：展示消费统计和标签分析
- **Props**：
  - `expenseData`: 消费统计数据
  - `tagsData`: 标签分组数据
  - `viewMode`: 'actual' | 'budget'

#### 4. TaskTimeline (优化现有 TaskTimelineChart)
- **优化点**：
  - 实现虚拟滚动处理大量数据
  - 增加任务点击导航功能
  - 优化时间格式显示

#### 5. ExpensePieChart (新建)
- **功能**：可视化标签支出分布
- **特性**：
  - 支持切换预算/实际视图
  - 响应式图表尺寸
  - 点击交互反馈

### Composable Functions

#### 1. useExpenseData (新建)
```javascript
export function useExpenseData() {
  // 计算总预算和总支出
  const calculateTotals = (tasks) => { ... }
  
  // 按标签分组统计
  const groupByTags = (tasks, mode) => { ... }
  
  // 排序处理
  const sortByAmount = (tagGroups) => { ... }
  
  return {
    totalBudget,
    totalExpense,
    tagGroups,
    calculateExpenseData
  }
}
```

#### 2. useBookData (扩展现有)
- 新增获取所有任务完成时间的方法
- 优化数据缓存策略

## 数据模型

### 统计数据结构

```javascript
// 总览统计数据
const overviewStats = {
  totalTasks: Number,        // 总任务数
  completedTasks: Number,    // 完成任务数
  completionRate: Number,    // 完成率(百分比)
  timeline: [                // 时间线数据
    {
      id: String,
      title: String,
      completedAt: Date,
      priority: String,
      tags: Array
    }
  ]
}

// 消费统计数据
const expenseStats = {
  totalBudget: Number,       // 总预算
  totalActualCost: Number,   // 总实际支出
  tagGroups: [               // 标签分组
    {
      tagId: String,
      tagName: String,
      tagColor: String,
      budget: Number,
      actualCost: Number,
      percentage: Number,    // 占比
      taskCount: Number      // 任务数量
    }
  ]
}
```

### 前端数据处理

所有统计计算在前端完成，避免多次后端请求：
- 页面加载时一次性获取所有任务数据
- 使用 JavaScript 进行数据过滤、分组和排序
- 利用 computed 属性缓存计算结果
- Tab 切换时复用已加载的数据，无需重新请求

## 错误处理

### 数据异常处理
1. **空数据状态**
   - 无任务时显示友好提示
   - 无标签时隐藏饼图，显示说明文字

2. **数据加载失败**
   - 显示错误提示组件
   - 提供重试机制

3. **大数据量处理**
   - 任务数超过100时自动启用虚拟滚动
   - 分批加载时间线数据

### 用户交互错误
1. **导航错误**
   - 任务已删除时提示并返回
   - 权限不足时显示相应提示

2. **视图切换**
   - 平滑过渡动画
   - 保存用户偏好设置

## 性能优化策略

### 渲染优化
1. **虚拟滚动实现**
```javascript
// 使用 uni-app 的 scroll-view 配合计算可视区域
const visibleItems = computed(() => {
  const start = Math.floor(scrollTop / itemHeight)
  const end = start + Math.ceil(viewportHeight / itemHeight)
  return items.slice(start, end)
})
```

2. **图表懒加载**
   - 仅在切换到消费统计tab时加载图表库
   - 使用轻量级图表方案

### 数据优化
1. **缓存策略**
   - 使用 LRU 缓存已计算的统计数据
   - Tab切换时复用已加载数据

2. **计算优化**
   - 使用 computed 缓存计算结果
   - 避免在模板中进行复杂计算

## 实现细节

### Tab管理机制
```javascript
// 保存用户偏好
const saveTabPreference = (tab) => {
  uni.setStorageSync(`statistics_tab_${bookId}`, tab)
}

// 恢复用户偏好
const restoreTabPreference = () => {
  return uni.getStorageSync(`statistics_tab_${bookId}`) || 'overview'
}
```

### 时间线优化
```javascript
// 虚拟滚动配置
const VISIBLE_COUNT = 20  // 可见项数量
const BUFFER_SIZE = 5     // 缓冲区大小

// 处理大量数据
const handleLargeTimeline = (tasks) => {
  if (tasks.length > 100) {
    return implementVirtualScroll(tasks)
  }
  return tasks
}
```

### 饼图数据处理
```javascript
// 计算标签占比
const calculateTagPercentage = (tagGroups, mode) => {
  const total = tagGroups.reduce((sum, group) => {
    return sum + (mode === 'budget' ? group.budget : group.actualCost)
  }, 0)
  
  return tagGroups.map(group => ({
    ...group,
    percentage: (group[mode === 'budget' ? 'budget' : 'actualCost'] / total * 100).toFixed(1)
  }))
}
```

## 迁移计划

### 现有代码重构
1. 保留可复用组件
   - `LoadingState`
   - `ErrorState`
   - 部分统计工具函数

2. 移除冗余代码
   - 清理现有的时间分析tab
   - 移除未使用的统计组件

### 数据兼容性
- 确保与现有数据结构完全兼容
- 不修改数据库 schema
- 保持云函数接口不变

## 风险和缓解措施

### 技术风险
1. **图表库兼容性**
   - 风险：uni-app平台图表库选择有限
   - 缓解：使用经过验证的 ucharts 或自定义 Canvas 实现

2. **性能瓶颈**
   - 风险：大数据量导致页面卡顿
   - 缓解：实现虚拟滚动和分页加载

### 用户体验风险
1. **学习成本**
   - 风险：用户不适应新界面
   - 缓解：保持直观的设计，提供引导提示

2. **数据准确性**
   - 风险：统计计算错误
   - 缓解：充分的单元测试覆盖