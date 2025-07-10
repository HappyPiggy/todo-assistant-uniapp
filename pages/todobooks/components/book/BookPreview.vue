<template>
  <view v-if="showPreview" class="book-preview">
    <view class="preview-card">
      <view class="card-header">
        <view class="book-icon" :style="{ backgroundColor: (previewData && previewData.color) || '#007AFF' }">
          <uni-icons color="#ffffff" size="24" :type="(previewData && previewData.icon) || 'folder'" />
        </view>
        <view class="book-info">
          <text class="book-title">{{ (previewData && previewData.title) || '项目册' }}</text>
          <text class="book-description" v-if="previewData && previewData.description">{{ previewData.description }}</text>
        </view>
      </view>
      <view class="card-stats">
        <view class="stat-item">
          <text class="stat-number">{{ (previewData && previewData.stats && previewData.stats.total) || 0 }}</text>
          <text class="stat-label">总任务</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ (previewData && previewData.stats && previewData.stats.completed) || 0 }}</text>
          <text class="stat-label">已完成</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ (previewData && previewData.stats && previewData.stats.members) || 1 }}</text>
          <text class="stat-label">成员</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ (previewData && previewData.stats && previewData.stats.progress) || 0 }}%</text>
          <text class="stat-label">进度</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  previewData: {
    type: Object,
    default: () => ({
      title: '项目册',
      description: '',
      color: '#007AFF',
      icon: 'folder',
      stats: {
        total: 0,
        completed: 0,
        members: 1,
        progress: 0
      }
    })
  },
  showPreview: {
    type: Boolean,
    default: false
  }
})
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.book-preview {
  margin-top: $margin-base;
}

.preview-card {
  background-color: $bg-light;
  border-radius: $border-radius;
  padding: $padding-base;
  border: 1rpx solid $border-color-light;
}

.card-header {
  @include flex-start;
  margin-bottom: $margin-lg;
}

.book-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: $border-radius-small;
  @include flex-center;
  margin-right: $margin-base;
  flex-shrink: 0;
}

.book-info {
  flex: 1;
}

.book-title {
  font-size: $font-size-xl;
  color: $text-primary;
  font-weight: $font-weight-medium;
  margin-bottom: $margin-xs;
  display: block;
}

.book-description {
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: $line-height-base;
  display: block;
}

.card-stats {
  @include flex-between;
}

.stat-item {
  @include flex-column;
  align-items: center;
}

.stat-number {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: $font-weight-semibold;
  margin-bottom: 4rpx;
}

.stat-label {
  font-size: $font-size-xs;
  color: $text-tertiary;
}
</style>