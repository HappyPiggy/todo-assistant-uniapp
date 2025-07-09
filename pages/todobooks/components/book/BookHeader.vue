<template>
  <view class="book-header">
    <!-- 项目册基本信息 -->
    <view class="header-top">
      <view class="book-icon" :style="{ backgroundColor: bookData?.color || '#007AFF' }">
        <uni-icons color="#ffffff" size="32" :type="bookData?.icon || 'folder'" />
      </view>
      <view class="book-meta">
        <text class="book-title">{{ bookData?.title || '项目册' }}</text>
        <text class="book-description" v-if="bookData?.description">{{ bookData.description }}</text>
      </view>
    </view>

    <!-- 进度区域 -->
    <view class="progress-section">
      <view class="progress-info">
        <text class="progress-text">完成进度</text>
        <text class="progress-percent">{{ overallProgress }}%</text>
      </view>
      <view class="progress-bar">
        <view 
          class="progress-fill" 
          :style="{ width: overallProgress + '%', backgroundColor: bookData?.color || '#007AFF' }">
        </view>
      </view>
    </view>

    <!-- 统计区域 -->
    <view class="stats-section">
      <view class="stat-item">
        <text class="stat-number">{{ taskStats.total }}</text>
        <text class="stat-label">总任务</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ taskStats.completed }}</text>
        <text class="stat-label">已完成</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ memberCount }}</text>
        <text class="stat-label">成员</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  bookData: {
    type: Object,
    default: () => ({})
  },
  overallProgress: {
    type: Number,
    default: 0
  },
  taskStats: {
    type: Object,
    default: () => ({ total: 0, completed: 0, todo: 0 })
  },
  memberCount: {
    type: Number,
    default: 0
  }
})
</script>

<style lang="scss" scoped>
@import '../../styles/mixins.scss';

.book-header {
  @include card-style;
  margin-bottom: $margin-base;
}

.header-top {
  @include flex-start;
  margin-bottom: $margin-base;
}

.book-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: $border-radius;
  @include flex-center;
  margin-right: $margin-base;
  flex-shrink: 0;
}

.book-meta {
  flex: 1;
}

.book-title {
  font-size: $font-size-2xl;
  color: $text-primary;
  font-weight: $font-weight-semibold;
  margin-bottom: $margin-xs;
  display: block;
}

.book-description {
  font-size: $font-size-base;
  color: $text-secondary;
  line-height: $line-height-lg;
  display: block;
}

.progress-section {
  margin-bottom: $margin-base;
}

.progress-info {
  @include flex-between;
  margin-bottom: $margin-sm;
}

.progress-text {
  font-size: $font-size-base;
  color: $text-secondary;
}

.progress-percent {
  font-size: $font-size-xl;
  color: $text-primary;
  font-weight: $font-weight-semibold;
}

.progress-bar {
  height: 8rpx;
  background-color: $gray-300;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width $transition-base;
}

.stats-section {
  @include flex-between;
}

.stat-item {
  @include flex-column;
  align-items: center;
}

.stat-number {
  font-size: $font-size-xl;
  color: $text-primary;
  font-weight: $font-weight-semibold;
  margin-bottom: $margin-xs;
}

.stat-label {
  font-size: $font-size-sm;
  color: $text-tertiary;
}
</style>