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
          <view class="task-card" :class="{ 'card-left': index % 2 === 1 }">
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
              <uni-tag 
                v-for="(tag, tagIndex) in task.tags.slice(0, 3)" 
                :key="tagIndex"
                :text="getTagText(tag)" 
                type="default"
                size="small"
              ></uni-tag>
              <text v-if="task.tags.length > 3" class="more-tags">+{{ task.tags.length - 3 }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  timelineData: {
    type: Array,
    default: () => []
  },
  loading: {
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
  // 可以在这里添加跳转到任务详情的逻辑
  uni.showToast({
    title: `任务: ${task.title}`,
    icon: 'none'
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

// 格式化完成时间
const formatCompletedTime = (completedAt) => {
  if (!completedAt) return ''
  
  const date = new Date(completedAt)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays === 1) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays <= 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
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
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.timeline-chart {
  @include card-style;
  padding: 0;
  position: relative;
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
  padding: $padding-base;
}

.timeline-content {
  position: relative;
  padding-left: 80rpx;
}

.timeline-line {
  position: absolute;
  left: 60rpx;
  top: 0;
  bottom: 0;
  width: 4rpx;
  background: linear-gradient(to bottom, $primary-color, #40a9ff);
  border-radius: 2rpx;
}

.timeline-item {
  position: relative;
  margin-bottom: $margin-xl;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.timeline-node {
  position: absolute;
  left: -80rpx;
  top: 10rpx;
  @include flex-center;
  flex-direction: column;
  
  .node-dot {
    width: 20rpx;
    height: 20rpx;
    border-radius: 50%;
    border: 4rpx solid #ffffff;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
    margin-bottom: $margin-xs;
  }
  
  .node-index {
    font-size: $font-size-xs;
    color: $text-tertiary;
    background-color: $bg-primary;
    padding: 2rpx 8rpx;
    border-radius: $border-radius-small;
    border: 1rpx solid $border-color;
  }
}

.task-card {
  background-color: $bg-primary;
  border-radius: $border-radius;
  padding: $padding-base;
  border: 1rpx solid $border-color;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
  transition: all $transition-base;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  }
  
  &.card-left {
    margin-left: -120rpx;
    margin-right: 40rpx;
  }
}

.task-title {
  font-size: $font-size-lg;
  color: $text-primary;
  font-weight: $font-weight-semibold;
  display: block;
  margin-bottom: $margin-xs;
  line-height: $line-height-base;
}

.task-time {
  font-size: $font-size-sm;
  color: $text-secondary;
  display: block;
  margin-bottom: $margin-sm;
}

.task-details {
  @include flex-start;
  flex-wrap: wrap;
  gap: $margin-sm;
  margin-bottom: $margin-sm;
}

.detail-item {
  @include flex-center;
  
  &.priority {
    // uni-tag 已有样式
  }
  
  &.level {
    .level-text {
      font-size: $font-size-xs;
      color: $text-tertiary;
      background-color: $gray-100;
      padding: 4rpx 8rpx;
      border-radius: $border-radius-small;
    }
  }
  
  &.hours {
    .hours-text {
      font-size: $font-size-sm;
      color: $text-secondary;
      
      .estimated {
        color: $text-tertiary;
      }
    }
  }
}

.task-tags {
  @include flex-start;
  flex-wrap: wrap;
  gap: $margin-xs;
}

.more-tags {
  font-size: $font-size-xs;
  color: $text-tertiary;
  padding: 4rpx 8rpx;
  background-color: $gray-100;
  border-radius: $border-radius-small;
}

// 优先级节点样式
.node-urgent .node-dot {
  background-color: #ff4d4f;
}

.node-high .node-dot {
  background-color: #ff7a45;
}

.node-medium .node-dot {
  background-color: #ffa940;
}

.node-low .node-dot {
  background-color: #52c41a;
}
</style>