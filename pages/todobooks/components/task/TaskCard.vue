<template>
  <view class="task-card" :class="{ 'completed': task.status === 'completed' }" @click="handleTaskClick">
    <view class="task-header">
      <view class="task-left">
        <view class="task-priority" :class="task.priority">
          <text class="priority-text">{{ getPriorityText(task.priority) }}</text>
        </view>
        <view class="task-expand" v-if="task.subtask_count > 0">
          <uni-icons 
            color="#666666" 
            size="16" 
            :type="task.expanded ? 'arrowdown' : 'arrowright'" />
        </view>
        <view class="task-content">
          <view class="title-row">
            <text class="task-title" :class="{ completed: task.status === 'completed' }">{{ task.title }}</text><view class="task-tags" v-if="task.tags && Array.isArray(task.tags) && task.tags.length > 0"><view 
                v-for="(tag, index) in task.tags.slice(0, 2)" 
                :key="getTagKey(tag, index)" 
                class="tag-item"
                :style="{ backgroundColor: getTagColor(tag) }">
                <text class="tag-text">{{ getTagName(tag) }}</text>
              </view>
              <text v-if="task.tags.length > 2" class="more-tags">+{{ task.tags.length - 2 }}</text>
            </view>
          </view>
          <text class="task-description" v-if="task.description">{{ task.description }}</text>
        </view>
      </view>
      <view class="task-right">
        <view class="task-status" v-if="task.subtask_count === 0" @click.stop="handleStatusToggle">
          <uni-icons 
            v-if="task.status === 'completed'"
            color="#28a745" 
            size="28" 
            type="checkmarkempty" />
          <uni-icons 
            v-else
            color="#cccccc" 
            size="28" 
            type="circle" />
        </view>
        <view class="task-detail-btn" @click.stop="handleMenuClick">
          <uni-icons 
            color="#999999" 
            size="20" 
            type="more-filled" />
        </view>
      </view>
    </view>

    <view class="task-meta" v-if="hasMetaInfo">
      <view class="meta-left">
        <view class="due-date" v-if="task.due_date" :class="{ overdue: isOverdue(task.due_date) }">
          <uni-icons color="#999999" size="14" type="calendar" />
          <text class="due-text">{{ formatDueDate(task.due_date) }}</text>
        </view>
        <view class="subtasks" v-if="task.subtask_count > 0">
          <uni-icons color="#999999" size="14" type="list" />
          <text class="subtask-text">{{ task.completed_subtask_count }}/{{ task.subtask_count }}</text>
        </view>
        <!-- 未读评论提醒 -->
        <view v-if="unreadCommentCount > 0" class="comment-hint">
          <uni-icons color="#ff9800" size="14" type="chatbubble" />
          <text class="comment-count">{{ unreadCommentCount }}</text>
        </view>
      </view>
    </view>

    <!-- 子任务列表 -->
    <view v-if="task.expanded && task.subtasks && task.subtasks.length > 0" class="subtasks-container">
      <SubtaskItem
        v-for="(subtask, index) in task.subtasks"
        :key="subtask._id"
        :subtask="subtask"
        :index="index"
        :parentTask="task"
        :currentUserId="currentUserId.value"
        @statusToggle="handleSubtaskStatusToggle"
        @menuClick="handleSubtaskMenuClick"
        @click="handleSubtaskClick"
        @touchStart="handleSubtaskTouchStart"
        @touchMove="handleSubtaskTouchMove"
        @touchEnd="handleSubtaskTouchEnd"
      />
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { currentUserId } from '@/store/storage.js'
import SubtaskItem from './SubtaskItem.vue'
import { getPriorityText, formatDueDate } from '../../utils/taskUtils.js'
import { isOverdue } from '../../utils/dateUtils.js'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  unreadCommentCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'taskClick',
  'statusToggle', 
  'menuClick',
  'subtaskStatusToggle',
  'subtaskMenuClick',
  'subtaskClick',
  'subtaskTouchStart',
  'subtaskTouchMove',
  'subtaskTouchEnd'
])

const hasMetaInfo = computed(() => {
  return props.task.due_date || 
         props.task.subtask_count > 0 || 
         props.unreadCommentCount > 0
})

const handleTaskClick = () => {
  emit('taskClick', props.task)
}

const handleStatusToggle = () => {
  emit('statusToggle', props.task)
}

const handleMenuClick = () => {
  emit('menuClick', props.task)
}

const handleSubtaskStatusToggle = (subtask) => {
  emit('subtaskStatusToggle', subtask)
}

const handleSubtaskMenuClick = (subtask) => {
  emit('subtaskMenuClick', subtask)
}

const handleSubtaskClick = (subtask) => {
  emit('subtaskClick', subtask)
}

const handleSubtaskTouchStart = (subtask, index, parentTask, event) => {
  emit('subtaskTouchStart', subtask, index, parentTask, event)
}

const handleSubtaskTouchMove = (event) => {
  emit('subtaskTouchMove', event)
}

const handleSubtaskTouchEnd = (event) => {
  emit('subtaskTouchEnd', event)
}

// 标签相关方法
const getTagKey = (tag, index) => {
  if (typeof tag === 'object' && tag.id) {
    return tag.id
  }
  return index
}

const getTagName = (tag) => {
  if (typeof tag === 'object' && tag.name) {
    return tag.name
  }
  return tag // 兼容旧格式的字符串标签
}

const getTagColor = (tag) => {
  if (typeof tag === 'object' && tag.color) {
    return tag.color
  }
  return '#E5E5E5' // 默认灰色，兼容旧格式
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.task-card {
  @include card-style;
  @include card-hover;
  margin-bottom: $margin-sm;
  cursor: pointer;
  position: relative;
  transition: all $transition-base;
  
  &.completed {
    background-color: #f0f9f4;
    border: 1rpx solid #d4edda;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4rpx;
      background-color: #28a745;
      border-radius: $border-radius 0 0 $border-radius;
    }
  }
}

.task-header {
  @include flex-between;
  align-items: flex-start;
  margin-bottom: $margin-sm;
}

.task-left {
  @include flex-start;
  flex: 1;
}

.task-right {
  @include flex-start;
  gap: $margin-sm;
  flex-shrink: 0;
}

.task-priority {
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

.task-expand {
  width: 32rpx;
  height: 32rpx;
  @include flex-center;
  margin-right: $margin-sm;
  margin-top: 2rpx;
  flex-shrink: 0;
}

.task-content {
  flex: 1;
}

.title-row {
  @include flex-start;
  align-items: flex-start;
  gap: $margin-xs;
  margin-bottom: $margin-xs;
  flex-wrap: wrap;
}

.task-title {
  font-size: $font-size-lg;
  color: $text-primary;
  font-weight: $font-weight-medium;
  line-height: $line-height-base;
  
  &.completed {
    color: $text-tertiary;
    /* #ifndef APP-NVUE */
    text-decoration: line-through;
    /* #endif */
  }
}

.task-tags {
  @include flex-start;
  gap: $margin-xs;
  flex-shrink: 0;
}

.tag-item {
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  @include flex-center;
}

.tag-text {
  font-size: $font-size-xs;
  color: #ffffff;
  font-weight: $font-weight-medium;
}

.more-tags {
  font-size: $font-size-xs;
  color: $text-tertiary;
}

.task-description {
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: $line-height-base;
  display: block;
}

.task-status {
  @include icon-button(52rpx);
  border: 1rpx solid $border-color;
}

.task-detail-btn {
  @include icon-button(36rpx);
}

.task-meta {
  @include flex-between;
  align-items: center;
  margin-bottom: $margin-sm;
}

.meta-left {
  @include flex-start;
  gap: $margin-base;
}

.due-date,
.subtasks {
  @include flex-start;
  gap: 6rpx;
}

.due-text,
.subtask-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
}

.due-date.overdue .due-text {
  color: $error-color;
}

.comment-hint {
  @include flex-start;
  gap: 4rpx;
  background-color: $warning-color;
  background-color: rgba(255, 152, 0, 0.1);
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  border: 1rpx solid rgba(255, 152, 0, 0.3);
}

.comment-count {
  font-size: $font-size-xs;
  color: $warning-color;
  font-weight: $font-weight-medium;
  min-width: 16rpx;
  text-align: center;
}


.subtasks-container {
  margin-top: $margin-sm;
  padding-top: $margin-sm;
  border-top: 1rpx solid $border-color-light;
  gap: $margin-sm;
}
</style>