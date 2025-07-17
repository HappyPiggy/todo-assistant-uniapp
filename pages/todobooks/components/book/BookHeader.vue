<template>
  <view class="book-header">
    <!-- 项目册基本信息 -->
    <view class="header-top">
      <view class="book-icon" :style="{ backgroundColor: (bookData && bookData.color) || '#007AFF' }">
        <uni-icons color="#ffffff" size="32" :type="(bookData && bookData.icon) || 'folder'" />
      </view>
      <view class="book-meta">
        <text class="book-title">{{ (bookData && bookData.title) || '项目册' }}</text>
        <text class="book-description" v-if="bookData && bookData.description">{{ bookData.description }}</text>
      </view>
      <!-- 更多操作按钮 -->
      <view class="actions-button" @click="handleMoreActions">
        <uni-icons color="#666666" size="20" type="more-filled" />
      </view>
    </view>

    <!-- 进度区域 -->
    <!-- <view class="progress-section">
      <view class="progress-info">
        <text class="progress-text">完成进度</text>
        <text class="progress-percent">{{ overallProgress }}%</text>
      </view>
      <view class="progress-bar">
        <view 
          class="progress-fill" 
          :style="{ width: overallProgress + '%', backgroundColor: (bookData && bookData.color) || '#007AFF' }">
        </view>
      </view>
    </view> -->

    <!-- 统计区域 -->
    <!-- <view class="stats-section">
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
    </view> -->
  </view>
</template>

<script setup>
import { defineProps, defineEmits, watchEffect } from 'vue'

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

const emit = defineEmits(['more-actions'])

// 处理更多操作按钮点击
const handleMoreActions = () => {
  emit('more-actions')
}

// 监听 bookData 变化，添加调试日志
watchEffect(() => {
  // console.log('BookHeader 组件 bookData 变化:', props.bookData)
  // console.log('BookHeader 组件 bookData.title:', props.bookData && props.bookData.title)
  // console.log('BookHeader 组件 bookData 类型:', typeof props.bookData)
})
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

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

.actions-button {
  width: 40rpx;
  height: 40rpx;
  @include flex-center;
  border-radius: $border-radius-small;
  margin-left: $margin-sm;
  transition: background-color $transition-base;
  
  &:hover {
    background-color: $gray-100;
  }
  
  &:active {
    background-color: $gray-200;
  }
}
</style>