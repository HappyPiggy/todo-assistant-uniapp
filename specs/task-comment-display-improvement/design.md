# Design Document

## Overview

本设计文档描述了如何改进TodoBook详情页面中任务评论的显示方式。设计基于现有的TaskItem组件架构，通过最小化修改实现从"未读消息有n条"文本提示改进为：1) 常驻显示评论总数；2) 使用简洁的红点提示未读状态。

设计遵循"最大化复用现有代码"的原则，主要在现有的`.comment-hint`区域内进行布局调整，复用现有的数据获取和缓存机制。

## Architecture

### 系统架构模式

采用现有的分层架构模式，无需新增组件或服务：

```mermaid
graph TD
    A[VirtualTaskList] --> B[TaskItem Component]
    B --> C[.comment-hint Display Area]
    C --> D[Comments Count Display]
    C --> E[Unread Indicator]
    
    F[Task Data] --> G[task.comments.length]
    H[Comment Cache] --> I[getTaskUnreadCount()]
    
    G --> D
    I --> E
    
    J[User Interaction] --> K[markTaskAsRead()]
    K --> L[Update Local Storage]
    L --> E
```

### 数据流架构

复用现有的三层数据获取策略：

1. **缓存层**: 使用现有的 `useTaskCommentCache` 机制
2. **任务数据层**: 直接访问 `task.comments.length`
3. **本地存储层**: 复用现有的已读状态管理

## Components and Interfaces

### 核心组件修改

#### TaskItem.vue 组件修改

**修改位置**: 现有的 `.comment-hint` 区域（第62-67行和第126-129行）

**修改策略**:
- 保持现有的样式类和布局框架
- 调整内部元素的组织方式
- 复用现有的props和事件处理

**新的组件接口**:
```vue
<TaskItem
  :task="task"
  :variant="'card'|'item'"
  :unreadCommentCount="unreadCount"  // 现有prop，用于红点显示判断
  @click="handleTaskClick"
/>
```

**内部计算属性**:
```javascript
// 新增计算属性
const commentCount = computed(() => {
  return props.task?.comments?.length || 0
})

const hasUnreadComments = computed(() => {
  return props.unreadCommentCount > 0
})
```

### UI组件设计

#### 评论显示区域布局

**Card模式布局**:
```
┌─────────────────────────────┐
│ [💬] X条评论 [🔴]           │  ← meta-left区域
└─────────────────────────────┘
```

**Item模式布局**:
```
┌─────────────────────────────┐
│ 任务内容                     │
│ [💬] X条评论 [🔴]           │  ← 任务内容下方
└─────────────────────────────┘
```

#### 视觉元素规范

**评论总数显示**:
- 文字: `${commentCount}条评论`
- 字体: `$font-size-xs` (22rpx)
- 颜色: `$text-tertiary` (#999999)
- 图标: `uni-icons` chatbubble，尺寸与现有保持一致

**未读提示器**:
- 形状: 圆形红点
- 尺寸: 16rpx × 16rpx
- 颜色: `$warning-color` (#ff9800)
- 位置: 评论文字右侧，间距8rpx

## Data Models

### 数据结构使用

#### Task数据模型
```javascript
// 复用现有的task数据结构
{
  _id: "task_id",
  title: "任务标题",
  comments: [              // 直接使用现有comments数组
    {
      _id: "comment_id",
      user_id: "user_id",
      content: "评论内容",
      created_at: "2024-01-01T00:00:00Z",
      replies: []
    }
  ]
}
```

#### 缓存数据模型
```javascript
// 复用现有的缓存数据结构
{
  taskId: {
    comments: [...],        // 评论数据
    total: 10,             // 评论总数
    lastUpdateTime: 1640995200000,
    unreadCount: 2         // 通过calculateUnreadCount计算
  }
}
```

#### 已读状态数据模型
```javascript
// 复用现有的本地存储结构
{
  "task_comment_read_records": {
    "task_id": {
      "comment_id": 1640995200000  // 已读时间戳
    }
  }
}
```

## Error Handling

### 数据获取错误处理

#### 评论总数获取失败
```javascript
const commentCount = computed(() => {
  try {
    return props.task?.comments?.length || 0
  } catch (error) {
    console.error('获取评论总数失败:', error)
    return 0  // 默认值，不影响UI显示
  }
})
```

#### 未读状态检查失败
```javascript
const hasUnreadComments = computed(() => {
  try {
    return (props.unreadCommentCount || 0) > 0
  } catch (error) {
    console.error('检查未读状态失败:', error)
    return false  // 默认为无未读，避免误导用户
  }
})
```

### 缓存错误处理

复用现有的 `useTaskCommentCache` 错误处理机制：
- 缓存读取失败时回退到任务数据
- 网络请求失败时使用本地缓存数据
- 本地存储异常时不显示未读提示

### UI渲染错误处理

```vue
<template>
  <!-- 使用v-if进行条件渲染，避免渲染错误 -->
  <view v-if="shouldShowCommentInfo" class="comment-hint">
    <uni-icons :color="iconColor" :size="iconSize" type="chatbubble" />
    <text class="comment-count">{{ commentDisplayText }}</text>
    <view v-if="hasUnreadComments" class="unread-dot"></view>
  </view>
</template>
```

## Testing Strategy

### 单元测试策略

#### 组件逻辑测试
- 测试评论总数计算的正确性
- 测试未读状态判断逻辑
- 测试错误边界情况处理

#### 数据处理测试
- 测试空评论数组的处理
- 测试undefined/null数据的安全访问
- 测试缓存数据与实际数据的一致性

### 集成测试策略

#### 用户交互测试
- 测试点击任务后未读状态的清除
- 测试评论添加后总数的实时更新
- 测试不同模式下的UI渲染

#### 性能测试
- 测试大量任务列表的渲染性能
- 测试频繁滚动时的计算性能
- 测试缓存机制的有效性

### 视觉回归测试
- 对比新旧UI的视觉效果
- 测试不同屏幕尺寸下的显示效果
- 验证与现有设计系统的一致性

## Implementation Notes

### 关键设计决策

#### 1. 复用现有样式系统
- **决策**: 在现有 `.comment-hint` 样式基础上进行调整
- **理由**: 保持视觉一致性，降低实现复杂度
- **影响**: 无需新增CSS类，减少样式冲突风险

#### 2. 使用计算属性而非新函数
- **决策**: 通过Vue计算属性处理显示逻辑
- **理由**: 响应式更新，无需手动管理状态同步
- **影响**: 自动依赖追踪，性能优化由Vue框架处理

#### 3. 保持现有数据流
- **决策**: 不修改props传递方式和数据获取逻辑
- **理由**: 避免影响其他组件，降低回归风险
- **影响**: 实现简单，测试范围可控

### 性能优化考虑

#### 计算缓存优化
```javascript
// 使用computed确保只在依赖变化时重新计算
const commentDisplayText = computed(() => {
  const count = commentCount.value
  return count > 0 ? `${count}条评论` : ''
})
```

#### 条件渲染优化
```vue
<!-- 避免不必要的DOM渲染 -->
<view v-if="commentCount > 0 || hasUnreadComments" class="comment-hint">
  <!-- 评论信息 -->
</view>
```

### 向后兼容性

#### 样式兼容性
- 保持现有的`.comment-hint`类名不变
- 新增样式使用CSS后代选择器，不影响现有样式
- 支持现有的card/item模式差异化处理

#### 功能兼容性
- 保持现有的props接口不变
- 现有的事件处理逻辑继续有效
- 缓存和数据获取机制保持不变

这个设计确保了最小化的代码更改，最大化了现有架构和组件的复用，同时提供了更好的用户体验。