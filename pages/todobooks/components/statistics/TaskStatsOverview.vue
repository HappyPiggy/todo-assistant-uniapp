<template>
  <view class="stats-overview">
    <!-- 核心指标网格 -->
    <view class="metrics-grid">
      <!-- 总任务数 -->
      <view class="metric-card primary">
        <view class="metric-icon">
          <uni-icons type="list" size="24" color="#ffffff"></uni-icons>
        </view>
        <view class="metric-content">
          <text class="metric-number">{{ statsData.total || 0 }}</text>
          <text class="metric-label">总任务</text>
        </view>
      </view>
      
      <!-- 完成率 -->
      <view class="metric-card success">
        <view class="metric-icon">
          <uni-icons type="checkmarkempty" size="24" color="#ffffff"></uni-icons>
        </view>
        <view class="metric-content">
          <text class="metric-number">{{ statsData.completionRate || 0 }}%</text>
          <text class="metric-label">完成率</text>
        </view>
      </view>
      
      <!-- 进行中 -->
      <view class="metric-card warning">
        <view class="metric-icon">
          <uni-icons type="gear" size="24" color="#ffffff"></uni-icons>
        </view>
        <view class="metric-content">
          <text class="metric-number">{{ statsData.inProgress || 0 }}</text>
          <text class="metric-label">进行中</text>
        </view>
      </view>
      
      <!-- 逾期任务 -->
      <view class="metric-card error">
        <view class="metric-icon">
          <uni-icons type="calendar" size="24" color="#ffffff"></uni-icons>
        </view>
        <view class="metric-content">
          <text class="metric-number">{{ statsData.overdueTasks || 0 }}</text>
          <text class="metric-label">逾期</text>
        </view>
      </view>
    </view>
    
    <!-- 详细统计列表 -->
    <view class="detailed-stats">
      <!-- 任务状态分布 -->
      <view class="stat-section">
        <text class="section-title">任务状态</text>
        <view class="stat-row">
          <text class="stat-name">已完成</text>
          <view class="stat-bar">
            <view 
              class="stat-fill completed" 
              :style="{ width: getPercentage(statsData.completed, statsData.total) + '%' }"
            ></view>
          </view>
          <text class="stat-value">{{ statsData.completed || 0 }}</text>
        </view>
        
        <view class="stat-row">
          <text class="stat-name">进行中</text>
          <view class="stat-bar">
            <view 
              class="stat-fill in-progress" 
              :style="{ width: getPercentage(statsData.inProgress, statsData.total) + '%' }"
            ></view>
          </view>
          <text class="stat-value">{{ statsData.inProgress || 0 }}</text>
        </view>
        
        <view class="stat-row">
          <text class="stat-name">待办</text>
          <view class="stat-bar">
            <view 
              class="stat-fill todo" 
              :style="{ width: getPercentage(statsData.todo, statsData.total) + '%' }"
            ></view>
          </view>
          <text class="stat-value">{{ statsData.todo || 0 }}</text>
        </view>
        
        <view class="stat-row" v-if="statsData.cancelled > 0">
          <text class="stat-name">已取消</text>
          <view class="stat-bar">
            <view 
              class="stat-fill cancelled" 
              :style="{ width: getPercentage(statsData.cancelled, statsData.total) + '%' }"
            ></view>
          </view>
          <text class="stat-value">{{ statsData.cancelled || 0 }}</text>
        </view>
      </view>
      
      <!-- 效率指标 -->
      <view class="stat-section">
        <text class="section-title">效率指标</text>
        
        <view class="efficiency-row">
          <view class="efficiency-item">
            <text class="efficiency-label">平均完成时间</text>
            <text class="efficiency-value">{{ statsData.avgCompletionDays || 0 }} 天</text>
          </view>
          
          <view class="efficiency-item">
            <text class="efficiency-label">逾期任务</text>
            <text class="efficiency-value error-text">{{ statsData.overdueTasks || 0 }}</text>
          </view>
        </view>
      </view>
      
      <!-- 工时统计 -->
      <view class="stat-section" v-if="showHoursStats">
        <text class="section-title">工时统计</text>
        
        <view class="hours-grid">
          <view class="hours-item">
            <text class="hours-label">预估总工时</text>
            <text class="hours-value">{{ statsData.totalEstimatedHours || 0 }}h</text>
          </view>
          
          <view class="hours-item">
            <text class="hours-label">实际总工时</text>
            <text class="hours-value">{{ statsData.totalActualHours || 0 }}h</text>
          </view>
          
          <view class="hours-item">
            <text class="hours-label">工时偏差</text>
            <text 
              class="hours-value"
              :class="{ 
                'success-text': (statsData.hoursVariance || 0) <= 0,
                'error-text': (statsData.hoursVariance || 0) > 0 
              }"
            >
              {{ formatHoursVariance(statsData.hoursVariance) }}
            </text>
          </view>
        </view>
        
        <!-- 工时准确率 -->
        <view class="hours-accuracy" v-if="hoursAccuracy >= 0">
          <text class="accuracy-label">工时预估准确率</text>
          <view class="accuracy-bar">
            <view 
              class="accuracy-fill" 
              :style="{ width: hoursAccuracy + '%' }"
            ></view>
          </view>
          <text class="accuracy-value">{{ hoursAccuracy }}%</text>
        </view>
      </view>
      
      <!-- 项目册信息 -->
      <view class="stat-section" v-if="bookData && bookData.title">
        <text class="section-title">项目册信息</text>
        
        <view class="book-info">
          <view class="book-row">
            <text class="book-label">项目名称</text>
            <text class="book-value">{{ bookData.title }}</text>
          </view>
          
          <view class="book-row" v-if="bookData.description">
            <text class="book-label">项目描述</text>
            <text class="book-value">{{ bookData.description }}</text>
          </view>
          
          <view class="book-row" v-if="bookData.created_at">
            <text class="book-label">创建时间</text>
            <text class="book-value">{{ formatDate(bookData.created_at) }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  statsData: {
    type: Object,
    default: () => ({
      total: 0,
      completed: 0,
      inProgress: 0,
      todo: 0,
      cancelled: 0,
      completionRate: 0,
      avgCompletionDays: 0,
      overdueTasks: 0,
      totalEstimatedHours: 0,
      totalActualHours: 0,
      hoursVariance: 0
    })
  },
  bookData: {
    type: Object,
    default: () => ({})
  }
})

// 是否显示工时统计
const showHoursStats = computed(() => {
  return (props.statsData.totalEstimatedHours || 0) > 0 || (props.statsData.totalActualHours || 0) > 0
})

// 工时准确率计算
const hoursAccuracy = computed(() => {
  const estimated = props.statsData.totalEstimatedHours || 0
  const actual = props.statsData.totalActualHours || 0
  
  if (estimated === 0 || actual === 0) return -1
  
  const variance = Math.abs(actual - estimated)
  const accuracy = Math.max(0, 100 - (variance / estimated) * 100)
  return Math.round(accuracy)
})

// 计算百分比
const getPercentage = (value, total) => {
  if (!total || total === 0) return 0
  return Math.round((value / total) * 100)
}

// 格式化工时偏差
const formatHoursVariance = (variance) => {
  if (!variance || variance === 0) return '0h'
  if (variance > 0) return `+${variance}h`
  return `${variance}h`
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.stats-overview {
  @include card-style;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $margin-base;
  margin-bottom: $margin-xl;
}

.metric-card {
  @include flex-start;
  padding: $padding-base;
  border-radius: $border-radius;
  align-items: center;
  
  &.primary {
    background: linear-gradient(135deg, $primary-color, #40a9ff);
  }
  
  &.success {
    background: linear-gradient(135deg, #52c41a, #73d13d);
  }
  
  &.warning {
    background: linear-gradient(135deg, #faad14, #ffc53d);
  }
  
  &.error {
    background: linear-gradient(135deg, #ff4d4f, #ff7875);
  }
}

.metric-icon {
  width: 48rpx;
  height: 48rpx;
  @include flex-center;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  margin-right: $margin-base;
}

.metric-content {
  flex: 1;
}

.metric-number {
  display: block;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: #ffffff;
  line-height: 1.2;
}

.metric-label {
  display: block;
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.8);
  margin-top: $margin-xs;
}

.detailed-stats {
  // 分组样式
}

.stat-section {
  margin-bottom: $margin-xl;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: block;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-bottom: $margin-base;
  padding-bottom: $padding-xs;
  border-bottom: 2rpx solid $border-color;
}

.stat-row {
  @include flex-between;
  align-items: center;
  margin-bottom: $margin-base;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.stat-name {
  font-size: $font-size-base;
  color: $text-secondary;
  min-width: 120rpx;
}

.stat-bar {
  flex: 1;
  height: 12rpx;
  background-color: $gray-200;
  border-radius: 6rpx;
  margin: 0 $margin-base;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  transition: width $transition-base;
  border-radius: 6rpx;
  
  &.completed {
    background-color: #52c41a;
  }
  
  &.in-progress {
    background-color: #faad14;
  }
  
  &.todo {
    background-color: $primary-color;
  }
  
  &.cancelled {
    background-color: #ff4d4f;
  }
}

.stat-value {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: $font-weight-semibold;
  min-width: 60rpx;
  text-align: right;
}

.efficiency-row {
  @include flex-between;
  gap: $margin-base;
}

.efficiency-item {
  flex: 1;
  text-align: center;
  padding: $padding-base;
  background-color: $bg-secondary;
  border-radius: $border-radius;
}

.efficiency-label {
  display: block;
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: $margin-xs;
}

.efficiency-value {
  display: block;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  
  &.error-text {
    color: #ff4d4f;
  }
}

.hours-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $margin-base;
  margin-bottom: $margin-base;
}

.hours-item {
  text-align: center;
  padding: $padding-base;
  background-color: $bg-secondary;
  border-radius: $border-radius;
}

.hours-label {
  display: block;
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: $margin-xs;
}

.hours-value {
  display: block;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  
  &.success-text {
    color: #52c41a;
  }
  
  &.error-text {
    color: #ff4d4f;
  }
}

.hours-accuracy {
  @include flex-between;
  align-items: center;
  padding: $padding-base;
  background-color: $bg-secondary;
  border-radius: $border-radius;
}

.accuracy-label {
  font-size: $font-size-base;
  color: $text-secondary;
  min-width: 120rpx;
}

.accuracy-bar {
  flex: 1;
  height: 12rpx;
  background-color: $gray-200;
  border-radius: 6rpx;
  margin: 0 $margin-base;
  overflow: hidden;
}

.accuracy-fill {
  height: 100%;
  background: linear-gradient(90deg, #52c41a, #73d13d);
  border-radius: 6rpx;
  transition: width $transition-base;
}

.accuracy-value {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: $font-weight-semibold;
  min-width: 60rpx;
  text-align: right;
}

.book-info {
  background-color: $bg-secondary;
  border-radius: $border-radius;
  padding: $padding-base;
}

.book-row {
  @include flex-between;
  margin-bottom: $margin-base;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.book-label {
  font-size: $font-size-base;
  color: $text-secondary;
  min-width: 160rpx;
}

.book-value {
  flex: 1;
  font-size: $font-size-base;
  color: $text-primary;
  text-align: right;
  word-break: break-all;
}
</style>