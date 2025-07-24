<template>
  <view 
    class="task-item"
    :class="{ 
      'task-item--card': variant === 'card',
      'task-item--item': variant === 'item',
      'task-item--completed': task.status === 'completed'
    }"
    :style="{ marginLeft: level > 0 ? (level * 40) + 'rpx' : '0' }"
    @click="handleClick">
    
    <!-- 主要内容区域 -->
    <view class="task-header">
      <view class="task-left">
        <!-- 优先级标签 -->
        <view class="task-priority" :class="task.priority">
          <text class="priority-text">{{ getPriorityText(task.priority) }}</text>
        </view>
        
        <!-- 展开/收起按钮（仅card模式且有子任务时显示） -->
        <view 
          v-if="variant === 'card' && task.subtask_count > 0" 
          class="task-expand">
          <uni-icons 
            color="#666666" 
            size="16" 
            :type="task.expanded ? 'arrowdown' : 'arrowright'" />
        </view>
        
        <!-- 任务内容 -->
        <view class="task-content">
          <view class="title-row">
            <text class="task-title" :class="{ completed: task.status === 'completed' }">
              {{ task.title }}
            </text>
            <!-- 标签 -->
            <view 
              v-if="task.tags && Array.isArray(task.tags) && task.tags.length > 0" 
              class="task-tags">
              <view 
                v-for="(tag, index) in task.tags.slice(0, 4)" 
                :key="getTagKey(tag, index)" 
                class="tag-item"
                :style="{ backgroundColor: getTagColor(tag) }">
                <text class="tag-text">{{ getTagName(tag) }}</text>
              </view>
              <text v-if="task.tags.length > 4" class="more-tags">+{{ task.tags.length - 4 }}</text>
            </view>
          </view>
          
          <!-- 描述 -->
          <text v-if="task.description" class="task-description">{{ task.description }}</text>
          
          <!-- 评论提醒（item模式） -->
          <view 
            v-if="variant === 'item' && unreadCommentCount > 0" 
            class="comment-hint comment-hint--item">
            <uni-icons color="#ff9800" size="12" type="chatbubble" />
            <text class="comment-count">{{ unreadCommentCount }}</text>
          </view>
        </view>
      </view>
      
      <!-- 右侧操作区 -->
      <view class="task-right">
        <!-- 状态切换（仅在没有子任务或item模式时显示） -->
        <view 
          v-if="task.subtask_count === 0 || variant === 'item'"
          class="task-status" 
          @click.stop="handleStatusToggle">
          <uni-icons 
            v-if="task.status === 'completed'"
            color="#28a745" 
            :size="variant === 'card' ? 28 : 24" 
            type="checkmarkempty" />
          <uni-icons 
            v-else
            color="#cccccc" 
            :size="variant === 'card' ? 28 : 24" 
            type="circle" />
        </view>
        
        <!-- 更多操作按钮 -->
        <view class="task-detail-btn" @click.stop="handleMenuClick">
          <uni-icons 
            color="#999999" 
            :size="variant === 'card' ? 20 : 18" 
            type="more-filled" />
        </view>
      </view>
    </view>

    <!-- 元数据区域（仅card模式） -->
    <view v-if="variant === 'card' && hasMetaInfo" class="task-meta">
      <view class="meta-left">
        <!-- 到期日期 -->
        <view v-if="task.due_date" class="due-date" :class="{ overdue: isOverdue(task.due_date) }">
          <uni-icons color="#999999" size="14" type="calendar" />
          <text class="due-text">{{ formatDueDate(task.due_date) }}</text>
        </view>
        
        <!-- 子任务进度 -->
        <view v-if="task.subtask_count > 0" class="subtasks">
          <uni-icons color="#999999" size="14" type="list" />
          <text class="subtask-text">{{ task.completed_subtask_count }}/{{ task.subtask_count }}</text>
        </view>
        
        <!-- 评论提醒 -->
        <view v-if="unreadCommentCount > 0" class="comment-hint">
          <uni-icons color="#ff9800" size="14" type="chatbubble" />
          <text class="comment-count">{{ unreadCommentCount }}</text>
        </view>
      </view>
    </view>

    <!-- 子任务列表（仅card模式） -->
    <view 
      v-if="variant === 'card' && task.expanded && task.subtasks && task.subtasks.length > 0" 
      class="subtasks-container">
      <TaskItem
        v-for="(subtask, index) in task.subtasks"
        :key="subtask._id"
        :task="subtask"
        :variant="'item'"
        :level="level + 1"
        :index="index"
        :parentTask="task"
        :unreadCommentCount="getSubtaskUnreadCount(subtask)"
        @click="handleSubtaskClick"
        @statusToggle="handleSubtaskStatusToggle"
        @menuClick="handleSubtaskMenuClick"
      />
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { currentUserId } from '@/store/storage.js'
import { getPriorityText, formatDueDate } from '../../utils/taskUtils.js'
import { isOverdue } from '../../utils/dateUtils.js'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  variant: {
    type: String,
    default: 'card',
    validator: (value) => ['card', 'item'].includes(value)
  },
  level: {
    type: Number,
    default: 0
  },
  index: {
    type: Number,
    default: 0
  },
  parentTask: {
    type: Object,
    default: null
  },
  unreadCommentCount: {
    type: Number,
    default: undefined
  },
})

const emit = defineEmits([
  'click',
  'statusToggle', 
  'menuClick',
  'subtaskStatusToggle',
  'subtaskMenuClick',
  'subtaskClick'
])

const hasMetaInfo = computed(() => {
  return props.task.due_date || 
         props.task.subtask_count > 0 || 
         props.unreadCommentCount > 0
})

const handleClick = () => {
  emit('click', props.task)
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


// 获取子任务未读评论数
const getSubtaskUnreadCount = (subtask) => {
  // 这里可以根据实际需求实现子任务未读评论数的计算
  return 0
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
  return tag
}

const getTagColor = (tag) => {
  if (typeof tag === 'object' && tag.color) {
    return tag.color
  }
  return '#E5E5E5'
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.task-item {
  cursor: pointer;
  position: relative;
  
  // Card模式样式
  &--card {
    @include card-style;
    @include card-hover;
    margin-bottom: $margin-sm;
    
    &.task-item--completed {
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
  
  // Item模式样式
  &--item {
    padding: $padding-sm;
    background-color: $gray-100;
    border-radius: $border-radius-small;
    margin-bottom: $margin-xs;
    
    &:active {
      background-color: $gray-200;
    }
    
    &.task-item--completed {
      background-color: #e8f5e9;
      border: 1rpx solid #c3e6cb;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3rpx;
        background-color: #28a745;
        border-radius: $border-radius-small 0 0 $border-radius-small;
      }
    }
    
    .task-header {
      align-items: center;
      margin-bottom: 0;
    }
    
    .task-content {
      .title-row {
        margin-bottom: 4rpx;
      }
    }
    
    .task-title {
      font-size: $font-size-base;
    }
    
    .tag-item {
      padding: 2rpx 6rpx;
      border-radius: 6rpx;
    }
    
    .tag-text {
      font-size: $font-size-xs;
    }
    
    .task-description {
      font-size: $font-size-sm;
    }
    
    .task-detail-btn {
      @include icon-button(32rpx);
    }
    
    .task-status {
      @include icon-button(44rpx);
    }
  }
  
}

.task-header {
  @include flex-between;
  align-items: flex-start;
  margin-bottom: $margin-sm;
  
  .task-item--item & {
    margin-bottom: 0;
  }
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
  background-color: rgba(255, 152, 0, 0.1);
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  border: 1rpx solid rgba(255, 152, 0, 0.3);
  
  &--item {
    margin-top: $margin-xs;
    align-self: flex-start;
  }
}

.comment-count {
  font-size: $font-size-xs;
  color: $warning-color;
  font-weight: $font-weight-medium;
  min-width: 16rpx;
  text-align: center;
  
  .comment-hint--item & {
    min-width: 12rpx;
  }
}

.subtasks-container {
  margin-top: $margin-sm;
  padding-top: $margin-sm;
  border-top: 1rpx solid $border-color-light;
  gap: $margin-sm;
}
</style>