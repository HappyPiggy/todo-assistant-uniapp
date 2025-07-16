<template>
  <view class="distribution-chart">
    <!-- 优先级分布 -->
    <view class="chart-section">
      <view class="chart-header">
        <text class="chart-title">优先级分布</text>
        <text class="chart-subtitle">按任务优先级统计</text>
      </view>
      
      <view class="priority-chart">
        <view 
          v-for="(item, index) in priorityChartData" 
          :key="item.key"
          class="priority-item"
          :class="{ 'no-data': item.count === 0 }"
        >
          <view class="priority-header">
            <view class="priority-dot" :style="{ backgroundColor: item.color }"></view>
            <text class="priority-name">{{ item.name }}</text>
            <text class="priority-count">{{ item.count }}</text>
          </view>
          
          <view class="priority-bar">
            <view 
              class="priority-fill" 
              :style="{ 
                width: item.percentage + '%', 
                backgroundColor: item.color 
              }"
            ></view>
          </view>
          
          <text class="priority-percentage">{{ item.percentage }}%</text>
        </view>
      </view>
    </view>
    
    <!-- 状态分布 -->
    <view class="chart-section">
      <view class="chart-header">
        <text class="chart-title">状态分布</text>
        <text class="chart-subtitle">按任务状态统计</text>
      </view>
      
      <view class="status-chart">
        <view 
          v-for="item in statusChartData" 
          :key="item.key"
          class="status-item"
          :class="{ 'no-data': item.count === 0 }"
        >
          <view class="status-header">
            <view class="status-icon" :style="{ backgroundColor: item.color }">
              <uni-icons :type="item.icon" size="16" color="#ffffff"></uni-icons>
            </view>
            <text class="status-name">{{ item.name }}</text>
            <text class="status-count">{{ item.count }}</text>
          </view>
          
          <view class="status-bar">
            <view 
              class="status-fill" 
              :style="{ 
                width: item.percentage + '%', 
                backgroundColor: item.color 
              }"
            ></view>
          </view>
          
          <text class="status-percentage">{{ item.percentage }}%</text>
        </view>
      </view>
    </view>
    
    <!-- 标签云 -->
    <view class="chart-section" v-if="distributionData.topTags && distributionData.topTags.length > 0">
      <view class="chart-header">
        <text class="chart-title">热门标签</text>
        <text class="chart-subtitle">最常用的前10个标签</text>
      </view>
      
      <view class="tags-cloud">
        <view 
          v-for="(tag, index) in distributionData.topTags" 
          :key="tag.name"
          class="tag-item"
          :style="{ fontSize: getTagFontSize(tag.count, index) }"
          @click="handleTagClick(tag)"
        >
          <text class="tag-name">{{ tag.name }}</text>
          <text class="tag-count">({{ tag.count }})</text>
        </view>
      </view>
    </view>
    
    <!-- 层级分布 -->
    <view class="chart-section">
      <view class="chart-header">
        <text class="chart-title">层级分布</text>
        <text class="chart-subtitle">按任务层级统计</text>
      </view>
      
      <view class="level-chart">
        <view 
          v-for="item in levelChartData" 
          :key="item.key"
          class="level-item"
          :class="{ 'no-data': item.count === 0 }"
        >
          <view class="level-header">
            <view class="level-indicator" :class="'level-' + item.level">
              <text class="level-text">{{ item.level + 1 }}</text>
            </view>
            <text class="level-name">{{ item.name }}</text>
            <text class="level-count">{{ item.count }}</text>
          </view>
          
          <view class="level-bar">
            <view 
              class="level-fill" 
              :style="{ 
                width: item.percentage + '%',
                backgroundColor: item.color
              }"
            ></view>
          </view>
          
          <text class="level-percentage">{{ item.percentage }}%</text>
        </view>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view v-if="isEmpty" class="empty-state">
      <uni-icons type="info" size="40" color="#999"></uni-icons>
      <text class="empty-text">暂无分布数据</text>
    </view>
  </view>
</template>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  distributionData: {
    type: Object,
    default: () => ({
      priorityDistribution: {},
      statusDistribution: {},
      topTags: [],
      levelDistribution: {}
    })
  }
})

const emit = defineEmits(['tag-click'])

// 优先级分布数据
const priorityChartData = computed(() => {
  const distribution = props.distributionData.priorityDistribution || {}
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)
  
  const priorityConfig = [
    { key: 'urgent', name: '紧急', color: '#ff4d4f' },
    { key: 'high', name: '高', color: '#ff7a45' },
    { key: 'medium', name: '中', color: '#ffa940' },
    { key: 'low', name: '低', color: '#52c41a' }
  ]
  
  return priorityConfig.map(config => {
    const count = distribution[config.key] || 0
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0
    
    return {
      ...config,
      count,
      percentage
    }
  })
})

// 状态分布数据
const statusChartData = computed(() => {
  const distribution = props.distributionData.statusDistribution || {}
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)
  
  const statusConfig = [
    { key: 'completed', name: '已完成', color: '#52c41a', icon: 'checkmarkempty' },
    { key: 'in_progress', name: '进行中', color: '#faad14', icon: 'gear' },
    { key: 'todo', name: '待办', color: '#1890ff', icon: 'list' },
    { key: 'cancelled', name: '已取消', color: '#ff4d4f', icon: 'close' }
  ]
  
  return statusConfig
    .map(config => {
      const count = distribution[config.key] || 0
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0
      
      return {
        ...config,
        count,
        percentage
      }
    })
    .filter(item => item.count > 0) // 只显示有数据的状态
})

// 层级分布数据
const levelChartData = computed(() => {
  const distribution = props.distributionData.levelDistribution || {}
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)
  
  const levelConfig = [
    { key: 'level0', name: '主任务', level: 0, color: '#1890ff' },
    { key: 'level1', name: '子任务', level: 1, color: '#52c41a' },
    { key: 'level2', name: '三级任务', level: 2, color: '#faad14' }
  ]
  
  return levelConfig.map(config => {
    const count = distribution[config.key] || 0
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0
    
    return {
      ...config,
      count,
      percentage
    }
  })
})

// 是否为空状态
const isEmpty = computed(() => {
  const priority = Object.values(props.distributionData.priorityDistribution || {})
  const status = Object.values(props.distributionData.statusDistribution || {})
  const level = Object.values(props.distributionData.levelDistribution || {})
  
  const totalTasks = [...priority, ...status, ...level].reduce((sum, count) => sum + count, 0)
  return totalTasks === 0
})

// 获取标签字体大小
const getTagFontSize = (count, index) => {
  const maxCount = Math.max(...(props.distributionData.topTags || []).map(tag => tag.count))
  const minSize = 24 // 最小字体大小（rpx）
  const maxSize = 40 // 最大字体大小（rpx）
  
  if (maxCount === 0) return minSize + 'rpx'
  
  const ratio = count / maxCount
  const size = minSize + (maxSize - minSize) * ratio
  return Math.round(size) + 'rpx'
}

// 处理标签点击
const handleTagClick = (tag) => {
  emit('tag-click', tag)
  uni.showToast({
    title: `标签: ${tag.name} (${tag.count}个任务)`,
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.distribution-chart {
  @include card-style;
}

.chart-section {
  margin-bottom: $margin-xl;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.chart-header {
  margin-bottom: $margin-base;
  text-align: center;
}

.chart-title {
  display: block;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-bottom: $margin-xs;
}

.chart-subtitle {
  display: block;
  font-size: $font-size-sm;
  color: $text-secondary;
}

// 优先级分布样式
.priority-chart {
  // 样式容器
}

.priority-item {
  margin-bottom: $margin-base;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &.no-data {
    opacity: 0.5;
  }
}

.priority-header {
  @include flex-between;
  align-items: center;
  margin-bottom: $margin-xs;
}

.priority-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  margin-right: $margin-sm;
}

.priority-name {
  flex: 1;
  font-size: $font-size-base;
  color: $text-primary;
  margin-left: $margin-sm;
}

.priority-count {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-right: $margin-sm;
}

.priority-bar {
  height: 8rpx;
  background-color: $gray-200;
  border-radius: 4rpx;
  overflow: hidden;
  margin-bottom: $margin-xs;
}

.priority-fill {
  height: 100%;
  transition: width $transition-base;
  border-radius: 4rpx;
}

.priority-percentage {
  font-size: $font-size-sm;
  color: $text-secondary;
  text-align: right;
  display: block;
}

// 状态分布样式
.status-chart {
  // 样式容器
}

.status-item {
  margin-bottom: $margin-base;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &.no-data {
    opacity: 0.5;
  }
}

.status-header {
  @include flex-between;
  align-items: center;
  margin-bottom: $margin-xs;
}

.status-icon {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  @include flex-center;
  margin-right: $margin-sm;
}

.status-name {
  flex: 1;
  font-size: $font-size-base;
  color: $text-primary;
  margin-left: $margin-sm;
}

.status-count {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-right: $margin-sm;
}

.status-bar {
  height: 8rpx;
  background-color: $gray-200;
  border-radius: 4rpx;
  overflow: hidden;
  margin-bottom: $margin-xs;
}

.status-fill {
  height: 100%;
  transition: width $transition-base;
  border-radius: 4rpx;
}

.status-percentage {
  font-size: $font-size-sm;
  color: $text-secondary;
  text-align: right;
  display: block;
}

// 标签云样式
.tags-cloud {
  @include flex-center;
  flex-wrap: wrap;
  gap: $margin-base;
  padding: $padding-base;
  background-color: $bg-secondary;
  border-radius: $border-radius;
  min-height: 120rpx;
}

.tag-item {
  @include flex-center;
  padding: $padding-xs $padding-sm;
  background-color: $bg-primary;
  border-radius: $border-radius-large;
  border: 2rpx solid $border-color;
  transition: all $transition-base;
  cursor: pointer;
  
  &:active {
    transform: scale(0.95);
    background-color: #e6f7ff;
    border-color: $primary-color;
  }
}

.tag-name {
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-right: $margin-xs;
}

.tag-count {
  font-size: 0.8em;
  color: $text-secondary;
}

// 层级分布样式
.level-chart {
  // 样式容器
}

.level-item {
  margin-bottom: $margin-base;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &.no-data {
    opacity: 0.5;
  }
}

.level-header {
  @include flex-between;
  align-items: center;
  margin-bottom: $margin-xs;
}

.level-indicator {
  width: 32rpx;
  height: 32rpx;
  border-radius: 4rpx;
  @include flex-center;
  margin-right: $margin-sm;
  
  &.level-0 {
    background-color: #1890ff;
  }
  
  &.level-1 {
    background-color: #52c41a;
  }
  
  &.level-2 {
    background-color: #faad14;
  }
}

.level-text {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: #ffffff;
}

.level-name {
  flex: 1;
  font-size: $font-size-base;
  color: $text-primary;
  margin-left: $margin-sm;
}

.level-count {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-right: $margin-sm;
}

.level-bar {
  height: 8rpx;
  background-color: $gray-200;
  border-radius: 4rpx;
  overflow: hidden;
  margin-bottom: $margin-xs;
}

.level-fill {
  height: 100%;
  transition: width $transition-base;
  border-radius: 4rpx;
}

.level-percentage {
  font-size: $font-size-sm;
  color: $text-secondary;
  text-align: right;
  display: block;
}

// 空状态样式
.empty-state {
  @include flex-center;
  flex-direction: column;
  padding: $padding-xl;
  color: $text-tertiary;
}

.empty-text {
  font-size: $font-size-base;
  margin-top: $margin-sm;
}
</style>