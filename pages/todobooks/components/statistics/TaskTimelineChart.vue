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
    
    <!-- 虚拟滚动时序图（大数据量） -->
    <VirtualTaskList 
      v-else-if="enableVirtualScroll && timelineData && timelineData.length > 0"
      :items="timelineData"
      :container-height="containerHeight"
      @task-click="handleTaskClick"
    />
    
    <!-- 普通时序图内容（小数据量） -->
    <scroll-view v-else-if="!enableVirtualScroll && timelineData && timelineData.length > 0" scroll-y class="timeline-container" :style="{ height: containerHeight }">
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
          <!-- 时间信息区域（左侧） -->
          <view class="timeline-time">
            <text class="time-text">{{ formatCompletedTime(task.completedAt) }}</text>
          </view>
          
          <!-- 中间的连接点 -->
          <view class="timeline-node">
            <view class="node-dot"></view>
          </view>
          
          <!-- 任务信息卡片（右侧） -->
          <view class="task-card">
            <!-- 第一行：任务标题 -->
            <view class="task-title-row">
              <text class="task-title">{{ task.title }}</text>
            </view>
            
            <!-- 第二行：标签 -->
            <view class="task-tags" v-if="task.tags && task.tags.length > 0">
              <view 
                v-for="(tag, tagIndex) in task.tags.slice(0, 4)" 
                :key="tagIndex"
                class="tag-item"
                :style="{ backgroundColor: getTagColor(tag) }"
              >
                <text class="tag-text">{{ getTagText(tag) }}</text>
              </view>
              <text v-if="task.tags.length > 4" class="more-tags">+{{ task.tags.length - 4 }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { defineProps, computed } from 'vue'
import VirtualTaskList from './VirtualTaskList.vue'

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
  padding: 0;
  position: relative;
  overflow: hidden;
  background: transparent;
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
  padding-left: 0;
  min-height: 100%;
}

.timeline-line {
  position: absolute;
  left: 160rpx;
  top: 0;
  bottom: 0;
  width: 2rpx;
  background: linear-gradient(to bottom, 
    rgba(102, 126, 234, 0.8) 0%, 
    rgba(118, 75, 162, 0.6) 50%, 
    rgba(240, 147, 251, 0.3) 100%);
  z-index: 1;
  box-shadow: 0 0 8rpx rgba(102, 126, 234, 0.2);
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 24rpx;
  animation: slide-in 0.5s ease-out backwards;
  
  @for $i from 1 through 20 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.05}s;
    }
  }
  
  &:last-child {
    margin-bottom: 16rpx;
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.timeline-time {
  width: 140rpx;
  text-align: right;
  padding-right: 16rpx;
  padding-top: 8rpx;
  
  .time-text {
    font-size: 22rpx;
    font-weight: 500;
    color: rgba(102, 126, 234, 0.8);
    line-height: 1.2;
    display: block;
  }
}

.timeline-node {
  width: 24rpx;
  @include flex-center;
  z-index: 2;
  padding-top: 12rpx;
  
  .node-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: 3rpx solid #ffffff;
    box-shadow: 
      0 0 0 2rpx rgba(102, 126, 234, 0.3),
      0 3rpx 10rpx rgba(102, 126, 234, 0.2);
    animation: node-glow 3s ease-in-out infinite;
  }
  
  @keyframes node-glow {
    0%, 100% {
      box-shadow: 
        0 0 0 2rpx rgba(102, 126, 234, 0.3),
        0 3rpx 10rpx rgba(102, 126, 234, 0.2);
    }
    50% {
      box-shadow: 
        0 0 0 4rpx rgba(102, 126, 234, 0.2),
        0 4rpx 15rpx rgba(102, 126, 234, 0.3);
    }
  }
}

.task-card {
  flex: 1;
  margin-left: 16rpx;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 255, 0.9) 100%);
  backdrop-filter: blur(15rpx);
  border-radius: 12rpx;
  padding: 16rpx 18rpx;
  border: 1rpx solid rgba(102, 126, 234, 0.15);
  box-shadow: 
    0 4rpx 20rpx rgba(102, 126, 234, 0.08),
    0 0 0 1rpx rgba(255, 255, 255, 0.5) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  
  &:hover,
  &:active {
    transform: translateY(-2rpx) translateX(4rpx);
    box-shadow: 
      0 8rpx 30rpx rgba(102, 126, 234, 0.15),
      0 0 0 1rpx rgba(102, 126, 234, 0.2) inset;
    border-color: rgba(102, 126, 234, 0.3);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 255, 0.95) 100%);
  }
}

.task-title-row {
  margin-bottom: 10rpx;
  
  .task-title {
    font-size: 28rpx;
    color: #333;
    font-weight: 600;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
    word-break: break-word;
    letter-spacing: 0.3rpx;
  }
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
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
  max-width: 100%;
  overflow: hidden;
}

.tag-item {
  padding: 3rpx 10rpx;
  border-radius: 14rpx;
  opacity: 0.9;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 1;
    transform: scale(1.05);
  }
  
  .tag-text {
    font-size: 20rpx;
    color: #ffffff;
    font-weight: 500;
    text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
  }
}

.more-tags {
  font-size: 18rpx;
  color: rgba(102, 126, 234, 0.7);
  padding: 3rpx 8rpx;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 14rpx;
  white-space: nowrap;
  font-weight: 500;
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
  
  .timeline-line {
    left: 120rpx;
  }
  
  .timeline-time {
    width: 100rpx;
    padding-right: 12rpx;
    
    .time-text {
      font-size: 20rpx;
    }
  }
  
  .timeline-node {
    width: 20rpx;
    
    .node-dot {
      width: 10rpx;
      height: 10rpx;
      border-width: 2rpx;
    }
  }
  
  .task-card {
    margin-left: 12rpx;
    padding: 14rpx 16rpx;
    
    .task-title {
      font-size: 26rpx;
    }
    
    .tag-item {
      .tag-text {
        font-size: 18rpx;
      }
    }
    
    .more-tags {
      font-size: 16rpx;
    }
  }
}

// 小屏幕优化
@media screen and (max-width: 600rpx) {
  .timeline-container {
    padding: 6rpx 4rpx;
  }
  
  .timeline-line {
    left: 100rpx;
  }
  
  .timeline-time {
    width: 80rpx;
    padding-right: 10rpx;
    
    .time-text {
      font-size: 18rpx;
    }
  }
  
  .timeline-node {
    width: 18rpx;
    
    .node-dot {
      width: 8rpx;
      height: 8rpx;
      border-width: 2rpx;
    }
  }
  
  .task-card {
    margin-left: 10rpx;
    padding: 12rpx 14rpx;
    
    .task-title {
      font-size: 24rpx;
    }
    
    .tag-item {
      padding: 2rpx 8rpx;
      
      .tag-text {
        font-size: 16rpx;
      }
    }
    
    .more-tags {
      font-size: 14rpx;
      padding: 2rpx 6rpx;
    }
  }
}
</style>