<template>
  <view class="book-header">
    <!-- 项目册基本信息 -->
    <view class="header-top">
      <view class="book-icon" :style="{ backgroundColor: (bookData && bookData.color) || '#007AFF' }">
        <uni-icons color="#ffffff" size="24" :type="(bookData && bookData.icon) || 'folder'" />
      </view>
      <view class="book-meta">
        <text class="book-title">{{ (bookData && bookData.title) || '项目册' }}</text>
      </view>
      <!-- 搜索按钮 -->
      <view class="search-button" @click="handleSearchClick">
        <uni-icons color="#666666" size="20" type="search" />
        <!-- 搜索提示点 -->
        <view v-if="hasSearchKeyword" class="search-indicator"></view>
      </view>
      <!-- 更多操作按钮 -->
      <view class="actions-button" @click="handleMoreActions">
        <uni-icons color="#666666" size="20" type="more-filled" />
      </view>
    </view>

    <!-- 进度区域 -->
    <view class="progress-section">
      <ProgressBar
        :progress="overallProgress || 0"
        :color="(bookData && bookData.color) || '#007AFF'"
        :show-text="true"
        :animated="true"
        label="完成进度"
      />
    </view>

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
import { defineProps, defineEmits, watchEffect, computed } from 'vue'
import ProgressBar from '@/pages/todobooks/components/common/ProgressBar.vue'

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
  },
  searchKeyword: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['more-actions', 'search-click'])

// 检查是否有搜索关键词
const hasSearchKeyword = computed(() => {
  return props.searchKeyword && props.searchKeyword.trim().length > 0
})

// 处理搜索按钮点击
const handleSearchClick = () => {
  emit('search-click')
}

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
  padding: $padding-base;
}

.header-top {
  @include flex-start;
  align-items: center;
}

.book-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: $border-radius;
  @include flex-center;
  margin-right: $margin-base;
  flex-shrink: 0;
}

.book-meta {
  flex: 1;
}

.book-title {
  font-size: $font-size-xl;
  color: $text-primary;
  font-weight: $font-weight-semibold;
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

.search-button,
.actions-button {
  width: 40rpx;
  height: 40rpx;
  @include flex-center;
  border-radius: $border-radius-small;
  margin-left: $margin-sm;
  transition: background-color $transition-base;
  position: relative;
  
  &:hover {
    background-color: $gray-100;
  }
  
  &:active {
    background-color: $gray-200;
  }
}

/* 搜索提示点 */
.search-indicator {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 12rpx;
  height: 12rpx;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
  border-radius: 50%;
  border: 2rpx solid #ffffff;
  box-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.3);
  animation: search-indicator-pulse 2s infinite;
}

@keyframes search-indicator-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}
</style>