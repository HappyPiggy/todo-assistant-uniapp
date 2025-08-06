<template>
  <view class="timeline-chart">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading" content-text="加载中..."></uni-load-more>
    </view>
    
    <!-- 空状态 -->
    <view v-else-if="!timelineData || timelineData.length === 0" class="empty-container">
      <uni-icons type="info" size="40" color="#999"></uni-icons>
      <text class="empty-text">暂无已完成任务</text>
    </view>
    
    <!-- 时序图内容 -->
    <scroll-view v-else scroll-y class="timeline-container" :style="{ height: containerHeight }">
      <view class="timeline-content">
        <!-- 时间轴线 -->
        <view class="timeline-line"></view>
        
        <!-- 任务节点 -->
        <view 
          v-for="(task, index) in timelineData" 
          :key="task.id"
          class="timeline-item"
          @click="handleTaskClick(task)"
        >
          <!-- 时间节点 -->
          <view class="timeline-node" :class="getNodeClass(task)">
            <view class="node-dot" :style="{ backgroundColor: getNodeColor(task) }"></view>
            <view class="node-index">{{ task.index }}</view>
          </view>
          
          <!-- 任务信息卡片 -->
          <view class="task-card">
            <!-- 任务标题 -->
            <text class="task-title">{{ task.title }}</text>
            
            <!-- 完成时间 -->
            <text class="task-time">{{ formatCompletedTime(task.completedAt) }}</text>
            
            <!-- 任务详情 -->
            <view class="task-details">
              <!-- 优先级 -->
              <view class="detail-item priority">
                <uni-tag 
                  :text="getPriorityText(task.priority)" 
                  :type="getPriorityType(task.priority)"
                  size="small"
                ></uni-tag>
              </view>
              
              <!-- 层级 -->
              <view class="detail-item level">
                <text class="level-text">{{ getLevelText(task.level) }}</text>
              </view>
              
              <!-- 工时信息 -->
              <view class="detail-item hours" v-if="task.actualHours > 0 || task.estimatedHours > 0">
                <text class="hours-text">
                  {{ task.actualHours || 0 }}h
                  <text v-if="task.estimatedHours > 0" class="estimated">
                    /{{ task.estimatedHours }}h
                  </text>
                </text>
              </view>
            </view>
            
            <!-- 标签 -->
            <view class="task-tags" v-if="task.tags && task.tags.length > 0">
              <view 
                v-for="(tag, tagIndex) in task.tags.slice(0, 2)" 
                :key="tagIndex"
                class="tag-item"
                :style="{ backgroundColor: getTagColor(tag) }"
              >
                <text class="tag-text">{{ getTagText(tag) }}</text>
              </view>
              <text v-if="task.tags.length > 2" class="more-tags">+{{ task.tags.length - 2 }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { defineProps, computed } from 'vue'

const emit = defineEmits(['task-click'])

const props = defineProps({
  timelineData: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  enableVirtualScroll: {
    type: Boolean,
    default: false
  },
  containerHeight: {
    type: String,
    default: '600rpx'
  }
})

const emit = defineEmits(['task-click'])

// 处理任务点击
const handleTaskClick = (task) => {
  emit('task-click', task)
  // 导航到任务详情页
  uni.navigateTo({
    url: `/pages/tasks/detail?id=${task._id || task.id}`
  })
}

// 获取节点样式类
const getNodeClass = (task) => {
  return {
    'node-urgent': task.priority === 'urgent',
    'node-high': task.priority === 'high',
    'node-medium': task.priority === 'medium',
    'node-low': task.priority === 'low'
  }
}

// 获取节点颜色
const getNodeColor = (task) => {
  const colorMap = {
    urgent: '#ff4d4f',    // 紧急 - 红色
    high: '#ff7a45',      // 高优先级 - 橙色
    medium: '#ffa940',    // 中优先级 - 黄色
    low: '#52c41a'        // 低优先级 - 绿色
  }
  return colorMap[task.priority] || '#1890ff'
}

// 格式化完成时间 - 优化显示格式
const formatCompletedTime = (completedAt) => {
  if (!completedAt) return ''
  
  const date = new Date(completedAt)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const time = `${hour}:${minute}`
  
  // 判断日期显示格式
  if (taskDate.getTime() === today.getTime()) {
    return `今天 ${time}`
  } else if (taskDate.getTime() === yesterday.getTime()) {
    return `昨天 ${time}`
  } else {
    const year = date.getFullYear()
    const currentYear = now.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    if (year === currentYear) {
      return `${month}月${day}日 ${time}`
    } else {
      return `${year}年${month}月${day}日 ${time}`
    }
  }
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const textMap = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return textMap[priority] || '普通'
}

// 获取优先级类型（用于uni-tag的type属性）
const getPriorityType = (priority) => {
  const typeMap = {
    urgent: 'error',
    high: 'warning',
    medium: 'primary',
    low: 'success'
  }
  return typeMap[priority] || 'default'
}

// 获取层级文本
const getLevelText = (level) => {
  const levelMap = {
    0: '主任务',
    1: '子任务',
    2: '三级任务'
  }
  return levelMap[level] || '任务'
}

// 获取标签文本
const getTagText = (tag) => {
  if (typeof tag === 'string') return tag
  return tag.name || tag.label || '标签'
}

// 获取标签颜色
const getTagColor = (tag) => {
  if (typeof tag === 'object' && tag.color) {
    return tag.color
  }
  return '#007AFF' // 默认蓝色
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.timeline-chart {
  @include card-style;
  padding: 0;
  position: relative;
  overflow: hidden;
}

.loading-container,
.empty-container {
  @include flex-center;
  padding: $padding-lg;
  min-height: 200rpx;
}

.empty-text {
  color: $text-secondary;
  font-size: $font-size-base;
  margin-top: $margin-sm;
}

.timeline-container {
  position: relative;
  padding: 12rpx 8rpx;
  @include custom-scrollbar;
}

.timeline-content {
  position: relative;
  padding-left: 36rpx;
  min-height: 100%;
}

.timeline-line {
  position: absolute;
  left: 24rpx;
  top: 0;
  bottom: 0;
  width: 1rpx;
  background: linear-gradient(to bottom, $primary-color 0%, rgba(0, 122, 255, 0.6) 50%, rgba(0, 122, 255, 0.2) 100%);
  z-index: 1;
}

.timeline-item {
  position: relative;
  margin-bottom: 12rpx;
  
  &:last-child {
    margin-bottom: 8rpx;
  }
}

.timeline-node {
  position: absolute;
  left: -36rpx;
  top: 3rpx;
  @include flex-center;
  flex-direction: column;
  z-index: 2;
  
  .node-dot {
    width: 8rpx;
    height: 8rpx;
    border-radius: 50%;
    border: 1rpx solid #ffffff;
    box-shadow: 0 0 0 1rpx rgba(255, 255, 255, 0.8), 0 1rpx 3rpx rgba(0,0,0,0.1);
    margin-bottom: 2rpx;
  }
  
  .node-index {
    font-size: 16rpx;
    color: $text-tertiary;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 0rpx 3rpx;
    border-radius: 3rpx;
    border: 0.5rpx solid rgba(0, 0, 0, 0.06);
    min-width: 18rpx;
    text-align: center;
    line-height: 1;
    backdrop-filter: blur(4rpx);
    font-weight: $font-weight-medium;
  }
}

.task-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  border-radius: 6rpx;
  padding: 8rpx 10rpx;
  border: 0.5rpx solid rgba(0, 0, 0, 0.04);
  box-shadow: 
    0 1rpx 3rpx rgba(0, 0, 0, 0.02),
    0 0 0 0.5rpx rgba(255, 255, 255, 0.8) inset;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  max-width: calc(100vw - 120rpx);
  box-sizing: border-box;
  backdrop-filter: blur(10rpx);
  
  &:active {
    transform: translateY(-0.5rpx) scale(0.995);
    box-shadow: 
      0 2rpx 8rpx rgba(0, 0, 0, 0.06),
      0 0 0 0.5rpx rgba(0, 122, 255, 0.1) inset;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  }
}

.task-title {
  font-size: 22rpx;
  color: $text-primary;
  font-weight: $font-weight-medium;
  display: block;
  margin-bottom: 2rpx;
  line-height: 1.25;
  @include text-line-clamp(1);
  word-break: break-all;
  letter-spacing: -0.2rpx;
}

.task-time {
  font-size: 16rpx;
  color: rgba(107, 114, 126, 0.8);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  display: block;
  margin-bottom: 4rpx;
  @include text-truncate;
  font-weight: $font-weight-medium;
  letter-spacing: 0.2rpx;
}

.task-details {
  @include flex-start;
  flex-wrap: wrap;
  gap: 3rpx;
  margin-bottom: 4rpx;
  align-items: flex-start;
}

.detail-item {
  @include flex-center;
  flex-shrink: 0;
  
  &.priority {
    order: 1;
  }
  
  &.level {
    order: 3;
    .level-text {
      font-size: 14rpx;
      color: rgba(107, 114, 126, 0.7);
      background: rgba(107, 114, 126, 0.06);
      padding: 1rpx 3rpx;
      border-radius: 3rpx;
      white-space: nowrap;
      font-weight: $font-weight-medium;
      letter-spacing: 0.1rpx;
    }
  }
  
  &.hours {
    order: 2;
    .hours-text {
      font-size: 14rpx;
      color: rgba(52, 199, 89, 0.9);
      background: rgba(52, 199, 89, 0.08);
      padding: 1rpx 3rpx;
      border-radius: 3rpx;
      white-space: nowrap;
      font-weight: $font-weight-medium;
      
      .estimated {
        color: rgba(107, 114, 126, 0.6);
        font-weight: $font-weight-normal;
      }
    }
  }
}

.task-tags {
  @include flex-start;
  flex-wrap: wrap;
  gap: 2rpx;
  max-width: 100%;
  overflow: hidden;
  margin-top: 2rpx;
}

.tag-item {
  padding: 1rpx 4rpx;
  border-radius: 3rpx;
  border: 0.5rpx solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0.5rpx 1rpx rgba(0, 0, 0, 0.1);
  
  .tag-text {
    font-size: 14rpx;
    color: #ffffff;
    font-weight: $font-weight-medium;
    text-shadow: 0 0.5rpx 1rpx rgba(0, 0, 0, 0.2);
    letter-spacing: -0.1rpx;
  }
}

.more-tags {
  font-size: 14rpx;
  color: rgba(107, 114, 126, 0.6);
  padding: 1rpx 3rpx;
  background: rgba(107, 114, 126, 0.04);
  border-radius: 3rpx;
  white-space: nowrap;
  font-weight: $font-weight-medium;
}

// 优先级节点样式
.node-urgent .node-dot {
  background: radial-gradient(circle, #ff4d4f 0%, #d32029 100%);
  box-shadow: 
    0 0 0 1rpx rgba(255, 255, 255, 0.8),
    0 0 0 2rpx rgba(255, 77, 79, 0.3),
    0 1rpx 3rpx rgba(0,0,0,0.1);
}

.node-high .node-dot {
  background: radial-gradient(circle, #ff7a45 0%, #d73527 100%);
  box-shadow: 
    0 0 0 1rpx rgba(255, 255, 255, 0.8),
    0 0 0 2rpx rgba(255, 122, 69, 0.3),
    0 1rpx 3rpx rgba(0,0,0,0.1);
}

.node-medium .node-dot {
  background: radial-gradient(circle, #ffa940 0%, #d77c2a 100%);
  box-shadow: 
    0 0 0 1rpx rgba(255, 255, 255, 0.8),
    0 0 0 2rpx rgba(255, 169, 64, 0.3),
    0 1rpx 3rpx rgba(0,0,0,0.1);
}

.node-low .node-dot {
  background: radial-gradient(circle, #52c41a 0%, #389e0d 100%);
  box-shadow: 
    0 0 0 1rpx rgba(255, 255, 255, 0.8),
    0 0 0 2rpx rgba(82, 196, 26, 0.3),
    0 1rpx 3rpx rgba(0,0,0,0.1);
}

// 响应式适配
@media screen and (max-width: 750rpx) {
  .timeline-container {
    padding: 8rpx 6rpx;
  }
  
  .timeline-content {
    padding-left: 32rpx;
  }
  
  .timeline-line {
    left: 20rpx;
  }
  
  .timeline-node {
    left: -32rpx;
    top: 2rpx;
    
    .node-dot {
      width: 6rpx;
      height: 6rpx;
      margin-bottom: 1rpx;
    }
    
    .node-index {
      font-size: 14rpx;
      padding: 0rpx 2rpx;
      min-width: 16rpx;
    }
  }
  
  .task-card {
    max-width: calc(100vw - 100rpx);
    padding: 6rpx 8rpx;
  }
  
  .task-title {
    font-size: 20rpx;
    margin-bottom: 1rpx;
  }
  
  .task-time {
    font-size: 14rpx;
    margin-bottom: 3rpx;
  }
  
  .task-details {
    gap: 2rpx;
    margin-bottom: 3rpx;
  }
  
  .detail-item {
    &.level .level-text,
    &.hours .hours-text {
      font-size: 12rpx;
      padding: 0.5rpx 2rpx;
    }
  }
  
  .tag-item {
    .tag-text {
      font-size: 12rpx;
    }
  }
  
  .more-tags {
    font-size: 12rpx;
  }
}

// 小屏幕优化
@media screen and (max-width: 600rpx) {
  .timeline-container {
    padding: 6rpx 4rpx;
  }
  
  .timeline-content {
    padding-left: 28rpx;
  }
  
  .timeline-line {
    left: 18rpx;
  }
  
  .timeline-node {
    left: -28rpx;
    
    .node-dot {
      width: 5rpx;
      height: 5rpx;
    }
    
    .node-index {
      font-size: 12rpx;
      padding: 0rpx 1rpx;
      min-width: 14rpx;
    }
  }
  
  .task-card {
    max-width: calc(100vw - 80rpx);
    padding: 4rpx 6rpx;
  }
  
  .task-title {
    font-size: 18rpx;
  }
  
  .task-time {
    font-size: 12rpx;
  }
  
  .task-details {
    gap: 1rpx;
  }
  
  .detail-item {
    &.level .level-text,
    &.hours .hours-text {
      font-size: 10rpx;
    }
  }
  
  .tag-item {
    .tag-text {
      font-size: 10rpx;
    }
  }
  
  .more-tags {
    font-size: 10rpx;
  }
}
</style>