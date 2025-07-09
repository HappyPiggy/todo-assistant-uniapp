<template>
  <view 
    class="subtask-item"
    :class="{ 'dragging': isDragging }"
    @click="handleClick"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd">
    <view class="subtask-left">
      <view class="subtask-priority" :class="subtask.priority">
        <text class="priority-text">{{ getPriorityText(subtask.priority) }}</text>
      </view>
      <view class="subtask-content">
        <text class="subtask-title" :class="{ completed: subtask.status === 'completed' }">{{ subtask.title }}</text>
        <text class="subtask-description" v-if="subtask.description">{{ subtask.description }}</text>
        <!-- 子任务未读评论提醒 -->
        <view v-if="unreadCommentCount > 0" class="subtask-comment-hint">
          <uni-icons color="#ff9800" size="12" type="chatbubble" />
          <text class="subtask-comment-count">{{ unreadCommentCount }}</text>
        </view>
      </view>
    </view>
    <view class="subtask-actions">
      <view class="subtask-detail-btn" @click.stop="handleMenuClick">
        <uni-icons 
          color="#999999" 
          size="18" 
          type="more-filled" />
      </view>
      <view class="subtask-status" @click.stop="handleStatusToggle">
        <uni-icons 
          v-if="subtask.status === 'completed'"
          color="#28a745" 
          size="20" 
          type="checkmarkempty" />
        <uni-icons 
          v-else
          color="#cccccc" 
          size="20" 
          type="circle" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { getPriorityText } from '../../utils/taskUtils.js'

const props = defineProps({
  subtask: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  parentTask: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: String,
    required: true
  },
  isDragging: {
    type: Boolean,
    default: false
  },
  unreadCommentCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'click',
  'statusToggle',
  'menuClick',
  'touchStart',
  'touchMove',
  'touchEnd'
])

const handleClick = () => {
  emit('click', props.subtask)
}

const handleStatusToggle = () => {
  emit('statusToggle', props.subtask)
}

const handleMenuClick = () => {
  emit('menuClick', props.subtask)
}

const handleTouchStart = (event) => {
  emit('touchStart', props.subtask, props.index, props.parentTask, event)
}

const handleTouchMove = (event) => {
  emit('touchMove', event)
}

const handleTouchEnd = (event) => {
  emit('touchEnd', event)
}
</script>

<style lang="scss" scoped>
@import '../../styles/mixins.scss';

.subtask-item {
  @include flex-between;
  align-items: center;
  padding: $padding-sm;
  background-color: $gray-100;
  border-radius: $border-radius-small;
  margin-left: $margin-lg;
  transition: all $transition-base;
  cursor: pointer;
  
  &:active {
    background-color: $gray-200;
  }
  
  &.dragging {
    transform: scale(1.02);
    box-shadow: $box-shadow-heavy;
    background-color: $bg-white;
    border: 2rpx solid $primary-color;
    z-index: 1000;
  }
}

.subtask-left {
  @include flex-start;
  flex: 1;
}

.subtask-priority {
  @include tag-style;
  margin-right: $margin-sm;
  flex-shrink: 0;
  
  &.low {
    @include priority-low;
  }
  
  &.medium {
    @include priority-medium;
  }
  
  &.high {
    @include priority-high;
  }
  
  &.urgent {
    @include priority-urgent;
  }
}

.priority-text {
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
}

.subtask-content {
  flex: 1;
}

.subtask-title {
  font-size: $font-size-base;
  color: $text-primary;
  margin-bottom: 4rpx;
  display: block;
  
  &.completed {
    color: $text-tertiary;
    /* #ifndef APP-NVUE */
    text-decoration: line-through;
    /* #endif */
  }
}

.subtask-description {
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: $line-height-base;
  display: block;
}

.subtask-comment-hint {
  @include flex-start;
  gap: 4rpx;
  background-color: rgba(255, 152, 0, 0.1);
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  border: 1rpx solid rgba(255, 152, 0, 0.3);
  margin-top: $margin-xs;
  align-self: flex-start;
}

.subtask-comment-count {
  font-size: $font-size-xs;
  color: $warning-color;
  font-weight: $font-weight-medium;
  min-width: 12rpx;
  text-align: center;
}

.subtask-actions {
  @include flex-start;
  gap: $margin-sm;
  flex-shrink: 0;
}

.subtask-detail-btn {
  @include icon-button(32rpx);
}

.subtask-status {
  @include icon-button(36rpx);
}
</style>