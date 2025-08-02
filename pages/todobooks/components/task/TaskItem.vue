<template>
  <view 
    class="task-item"
    :class="{ 
      'task-item--card': variant === 'card',
      'task-item--item': variant === 'item',
      'task-item--completed': task.status === 'completed',
      [priorityClass]: true
    }"
    :style="{ marginLeft: level > 0 ? (level * 40) + 'rpx' : '0' }"
    @click="handleClick">
    
    <!-- 主要内容区域 -->
    <view class="task-header">
      <view class="task-left">
        <!-- 状态切换按钮（仅在没有子任务或item模式时显示，且可编辑时） -->
        <view 
          v-if="(task.subtask_count === 0 || variant === 'item') && canEdit"
          class="task-status task-status--square" 
          :class="{ 'task-status--completed': task.status === 'completed' }"
          @click.stop="handleStatusToggle">
          <uni-icons 
            v-if="task.status === 'completed'"
            color="#28a745" 
            :size="variant === 'card' ? 16 : 14" 
            type="checkmarkempty" />
        </view>
        
        <!-- 状态显示（不可编辑时） -->
        <view 
          v-if="(task.subtask_count === 0 || variant === 'item') && !canEdit && task.status === 'completed'"
          class="task-status-readonly task-status--square task-status--completed">
          <uni-icons 
            color="#28a745" 
            :size="variant === 'card' ? 16 : 14" 
            type="checkmarkempty" />
        </view>
        
        <!-- 展开/收起按钮（仅card模式且有子任务时显示） -->
        <view 
          v-if="variant === 'card' && task.subtask_count > 0" 
          class="task-expand"
          @click.stop="handleExpandClick">
          <uni-icons 
            color="#666666" 
            size="16" 
            :type="task.expanded ? 'arrowdown' : 'arrowright'" />
        </view>
        
        <!-- 任务内容 -->
        <view class="task-content">
          <view class="title-row">
            <uni-icons 
              v-if="isPinned" 
              color="#FF6B6B" 
              size="14" 
              type="star-filled" 
              class="pin-icon"
            />
            <text class="task-title" :class="{ completed: task.status === 'completed' }">
              {{ task.title }}
            </text>
            <!-- 工程倒计时（到期日期）显示在title后 -->
            <view v-if="task.due_date" class="countdown-inline" :class="{ overdue: isOverdue(task.due_date) }">
              <uni-icons color="#999999" size="12" type="calendar" />
              <text class="countdown-text">{{ formatDueDate(task.due_date) }}</text>
            </view>
          </view>
          
          <!-- 描述 -->
          <text v-if="task.description" class="task-description">{{ task.description }}</text>
          
          <!-- Item模式的底部信息栏：评论和标签 -->
          <view 
            v-if="variant === 'item' && (shouldShowCommentInfo || (task.tags && Array.isArray(task.tags) && task.tags.length > 0))" 
            class="item-bottom-info">
            <!-- 评论信息 -->
            <view 
              v-if="shouldShowCommentInfo" 
              class="comment-hint comment-hint--item">
              <uni-icons color="#ff9800" size="12" type="chatbubble" />
              <text v-if="commentCount > 0" class="comment-count">{{ commentDisplayText }}</text>
              <view v-if="hasUnreadComments" class="unread-dot"></view>
            </view>
            
            <!-- 标签 -->
            <view 
              v-if="task.tags && Array.isArray(task.tags) && task.tags.length > 0" 
              class="task-tags-right">
              <text v-if="task.tags.length > 4" class="more-tags">+{{ task.tags.length - 4 }}</text>
              <view 
                v-for="(tag, index) in task.tags.slice(0, 4).reverse()" 
                :key="getTagKey(tag, index)" 
                class="tag-item"
                :style="{ backgroundColor: getTagColor(tag) }">
                <text class="tag-text">{{ getTagName(tag) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 右侧操作区 -->
      <view class="task-right">
        <!-- 更多操作按钮 -->
        <view v-if="canEdit" class="task-detail-btn" @click.stop="handleMenuClick">
          <uni-icons 
            color="#999999" 
            :size="variant === 'card' ? 20 : 18" 
            type="more-filled" />
        </view>
      </view>
    </view>

    <!-- 元数据区域（仅card模式） -->
    <view v-if="variant === 'card' && (hasMetaInfo || (task.tags && Array.isArray(task.tags) && task.tags.length > 0))" class="task-meta">
      <view class="meta-left">
        <!-- 子任务进度 -->
        <view v-if="task.subtask_count > 0" class="subtasks">
          <uni-icons color="#999999" size="14" type="list" />
          <text class="subtask-text">{{ task.completed_subtask_count }}/{{ task.subtask_count }}</text>
        </view>
        
        <!-- 评论信息 -->
        <view v-if="shouldShowCommentInfo" class="comment-hint">
          <uni-icons color="#ff9800" size="14" type="chatbubble" />
          <text v-if="commentCount > 0" class="comment-count">{{ commentDisplayText }}</text>
          <view v-if="hasUnreadComments" class="unread-dot"></view>
        </view>
      </view>
      
      <!-- 标签区域 -->
      <view 
        v-if="task.tags && Array.isArray(task.tags) && task.tags.length > 0" 
        class="task-tags-right">
        <text v-if="task.tags.length > 4" class="more-tags">+{{ task.tags.length - 4 }}</text>
        <view 
          v-for="(tag, index) in task.tags.slice(0, 4).reverse()" 
          :key="getTagKey(tag, index)" 
          class="tag-item"
          :style="{ backgroundColor: getTagColor(tag) }">
          <text class="tag-text">{{ getTagName(tag) }}</text>
        </view>
      </view>
    </view>

    <!-- 子任务列表（仅card模式） -->
    <view 
      v-if="shouldShowSubtasks" 
      class="subtasks-container">
      
      <!-- #ifdef MP-WEIXIN -->
      <!-- 微信小程序专用内联子任务 -->
      <view 
        v-for="(subtask, index) in task.subtasks"
        :key="'subtask-' + subtask._id"
        class="wx-subtask-item"
        :class="{ 
          'wx-subtask-completed': subtask.status === 'completed',
          [getWXSubtaskPriorityClass(subtask)]: true
        }"
        @click="handleSubtaskItemClick(subtask)">
        
        <!-- 连接线 -->
        <view class="wx-subtask-connector"></view>
        
        <!-- 子任务内容 -->
        <view class="wx-subtask-header">
          <view class="wx-subtask-left">
            <!-- 状态切换按钮 -->
            <view 
              v-if="canEdit"
              class="wx-subtask-status wx-subtask-status--square" 
              :class="{ 'wx-subtask-status--completed': subtask.status === 'completed' }"
              @click.stop="handleSubtaskStatusClick(subtask)">
              <uni-icons 
                v-if="subtask.status === 'completed'"
                color="#28a745" 
                size="14" 
                type="checkmarkempty" />
            </view>
            
            <!-- 状态显示（不可编辑时） -->
            <view 
              v-if="!canEdit && subtask.status === 'completed'"
              class="wx-subtask-status-readonly wx-subtask-status--square wx-subtask-status--completed">
              <uni-icons 
                color="#28a745" 
                size="14" 
                type="checkmarkempty" />
            </view>
            
            <view class="wx-subtask-content">
              <view class="wx-subtask-title-row">
                <text 
                  class="wx-subtask-title" 
                  :class="{ 'wx-subtask-title-completed': subtask.status === 'completed' }">
                  {{ subtask.title }}
                </text>
                <!-- 工程倒计时（到期日期）显示在title后 -->
                <view v-if="subtask.due_date" class="wx-subtask-countdown-inline" :class="{ overdue: isOverdue(subtask.due_date) }">
                  <uni-icons color="#999999" size="10" type="calendar" />
                  <text class="wx-subtask-countdown-text">{{ formatDueDate(subtask.due_date) }}</text>
                </view>
              </view>
              
              <!-- 描述 -->
              <text v-if="subtask.description" class="wx-subtask-description">{{ subtask.description }}</text>
              
              <!-- 子任务底部信息栏：评论和标签 -->
              <view 
                v-if="(getWXSubtaskCommentCount(subtask) > 0 || getSubtaskUnreadCount(subtask) > 0) || (subtask.tags && Array.isArray(subtask.tags) && subtask.tags.length > 0)" 
                class="wx-subtask-bottom-info">
                <!-- 评论信息 -->
                <view 
                  v-if="getWXSubtaskCommentCount(subtask) > 0 || getSubtaskUnreadCount(subtask) > 0" 
                  class="wx-subtask-comment-hint">
                  <uni-icons color="#ff9800" size="12" type="chatbubble" />
                  <text v-if="getWXSubtaskCommentCount(subtask) > 0" class="wx-subtask-comment-count">{{ getWXSubtaskCommentCount(subtask) }}条评论</text>
                  <view v-if="getSubtaskUnreadCount(subtask) > 0" class="wx-subtask-unread-dot"></view>
                </view>
                
                <!-- 标签 -->
                <view 
                  v-if="subtask.tags && Array.isArray(subtask.tags) && subtask.tags.length > 0" 
                  class="wx-subtask-tags-right">
                  <text v-if="subtask.tags.length > 4" class="wx-subtask-more-tags">+{{ subtask.tags.length - 4 }}</text>
                  <view 
                    v-for="(tag, tagIndex) in subtask.tags.slice(0, 4).reverse()" 
                    :key="getTagKey(tag, tagIndex)" 
                    class="wx-subtask-tag-item"
                    :style="{ backgroundColor: getTagColor(tag) }">
                    <text class="wx-subtask-tag-text">{{ getTagName(tag) }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 右侧操作区 -->
          <view class="wx-subtask-right">
            <!-- 更多操作按钮 -->
            <view 
              v-if="canEdit" 
              class="wx-subtask-detail-btn" 
              @click.stop="handleSubtaskMoreClick(subtask)">
              <uni-icons 
                color="#999999" 
                size="18" 
                type="more-filled" />
            </view>
          </view>
        </view>
      </view>
      <!-- #endif -->
      
      <!-- #ifndef MP-WEIXIN -->
      <!-- 其他平台使用嵌套TaskItem -->
      <TaskItem
        v-for="(subtask, index) in task.subtasks"
        :key="subtask._id"
        :task="subtask"
        :variant="'item'"
        :level="level + 1"
        :index="index"
        :parentTask="task"
        :isArchived="isArchived"
        :canEdit="canEdit"
        :unreadCommentCount="getSubtaskUnreadCount(subtask)"
        @click="handleSubtaskClick"
        @statusToggle="handleSubtaskStatusToggle"
        @menuClick="handleSubtaskMenuClick"
      />
      <!-- #endif -->
    </view>
  </view>
</template>

<script>
export default {
  name: 'TaskItem'
}
</script>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { currentUserId } from '@/store/storage.js'
import { getPriorityText, formatDueDate } from '../../utils/taskUtils.js'
import { isOverdue } from '../../utils/dateUtils.js'
import { getTaskCommentCount } from '@/utils/commentUtils.js'

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
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  canEdit: {
    type: Boolean,
    default: true
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

// 优先级CSS类名计算属性
const priorityClass = computed(() => {
  const priority = props.task.priority || 'medium'
  return `task-item--priority-${priority}`
})

// 评论相关计算属性
const commentCount = computed(() => {
  try {
    // 使用统一的评论计数函数，确保包含所有回复
    return getTaskCommentCount(props.task, true)
  } catch (error) {
    console.error('获取评论总数失败:', error)
    return 0
  }
})

const hasUnreadComments = computed(() => {
  try {
    return (props.unreadCommentCount || 0) > 0
  } catch (error) {
    console.error('检查未读状态失败:', error)
    return false
  }
})

const commentDisplayText = computed(() => {
  try {
    const count = commentCount.value
    return count > 0 ? `${count}条评论` : ''
  } catch (error) {
    console.error('格式化评论显示文本失败:', error)
    return ''
  }
})

const shouldShowCommentInfo = computed(() => {
  try {
    return commentCount.value > 0 || hasUnreadComments.value
  } catch (error) {
    console.error('检查是否显示评论信息失败:', error)
    return false
  }
})

const hasMetaInfo = computed(() => {
  return props.task.subtask_count > 0 || 
         shouldShowCommentInfo.value
})

// 微信小程序专用：子任务显示条件计算属性
const shouldShowSubtasks = computed(() => {
  const result = props.variant === 'card' && 
         props.task.expanded && 
         props.task.subtasks && 
         Array.isArray(props.task.subtasks) && 
         props.task.subtasks.length > 0
  
  // #ifdef MP-WEIXIN
  // 详细调试信息
  if (props.task.subtask_count > 0) {
    console.log(`[MP-WEIXIN] TaskItem [${props.task.title}] 子任务显示检查:`, {
      variant: props.variant,
      expanded: props.task.expanded,
      subtask_count: props.task.subtask_count,
      hasSubtasksArray: !!(props.task.subtasks),
      subtasksArrayLength: props.task.subtasks?.length || 0,
      subtasksArrayType: typeof props.task.subtasks,
      isArray: Array.isArray(props.task.subtasks),
      finalResult: result,
      timestamp: new Date().toLocaleTimeString()
    })
    
    // 如果有子任务数量但没有子任务数组，输出警告
    if (props.task.subtask_count > 0 && (!props.task.subtasks || props.task.subtasks.length === 0)) {
      console.warn(`[MP-WEIXIN] 任务 "${props.task.title}" 有子任务计数但缺少子任务数据`)
    }
  }
  // #endif
  
  return result
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

// 处理展开按钮点击 - 微信小程序专用优化
const handleExpandClick = () => {
  // #ifdef MP-WEIXIN
  console.log(`[MP-WEIXIN] 展开按钮被点击: ${props.task.title}, 当前展开状态: ${props.task.expanded}`)
  // #endif
  
  // 直接触发任务点击事件，让父组件处理展开逻辑
  emit('click', props.task)
}

// 微信小程序和其他平台通用的子任务事件处理
const handleSubtaskItemClick = (subtask) => {
  emit('subtaskClick', subtask)
}

const handleSubtaskStatusClick = (subtask) => {
  emit('subtaskStatusToggle', subtask)
}

const handleSubtaskMoreClick = (subtask) => {
  emit('subtaskMenuClick', subtask)
}

// 微信小程序专用辅助方法
const getWXSubtaskPriorityClass = (subtask) => {
  const priority = subtask.priority || 'medium'
  console.log(`[WX-Inline] 子任务 "${subtask.title}" 优先级: ${priority}`)
  return `wx-subtask--priority-${priority}`
}

const getWXSubtaskCommentCount = (subtask) => {
  try {
    return getTaskCommentCount(subtask, true)
  } catch (error) {
    console.error('获取子任务评论总数失败:', error)
    return 0
  }
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
    
    // 移除完成状态的背景色影响，完成状态只通过勾选框体现
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
    
    // 移除完成状态的背景色影响，完成状态只通过勾选框体现
    
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
      
      &--square {
        width: 24rpx;
        height: 24rpx;
        border-radius: 4rpx;
        border: 1rpx solid #cccccc;
        background-color: #ffffff;
        @include flex-center;
        margin-right: $margin-xs;
        
        &:hover {
          background-color: $gray-100;
        }
        
        &:active {
          background-color: $gray-200;
        }
        
        &.task-status--completed {
          border-color: #28a745;
          background-color: #f8fff9;
        }
      }
    }
    
    .task-status-readonly {
      width: 44rpx;
      height: 44rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      
      &--square {
        width: 24rpx;
        height: 24rpx;
        border-radius: 4rpx;
        border: 1rpx solid #cccccc;
        background-color: #ffffff;
        @include flex-center;
        margin-right: $margin-xs;
        opacity: 0.6;
        
        &.task-status--completed {
          border-color: #28a745;
          background-color: #f8fff9;
        }
      }
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

// 优先级边框样式
.task-item--priority-low {
  @include priority-border($priority-border-low);
}

.task-item--priority-medium {
  @include priority-border($priority-border-medium);
}

.task-item--priority-high {
  @include priority-border($priority-border-high);
}

.task-item--priority-urgent {
  @include priority-border($priority-border-urgent);
}

.task-expand {
  width: 32rpx;
  height: 32rpx;
  @include flex-center;
  margin-right: $margin-sm;
  margin-top: 2rpx;
  flex-shrink: 0;
}

.pin-icon {
  margin-right: 8rpx;
}

.pin-text {
	color: #ff9900;
	font-weight: 500;
	margin-right: 8rpx;
	font-size: $font-size-sm;
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

// 原来的 task-tags 样式保留用于其他可能的地方
.task-tags {
  @include flex-start;
  gap: $margin-xs;
  flex-shrink: 0;
}

// Item模式底部信息栏：评论和标签
.item-bottom-info {
  @include flex-between;
  align-items: center;
  margin-top: $margin-sm;
  gap: $margin-sm;
}

// 右侧标签容器样式（从右到左排列）
.task-tags-right {
  @include flex-start;
  flex-direction: row-reverse;
  gap: $margin-xs;
  flex-wrap: wrap;
  align-items: center;
}

// 新增：倒计时内联样式
.countdown-inline {
  @include flex-start;
  gap: 4rpx;
  background-color: rgba(108, 117, 125, 0.1);
  padding: 2rpx 6rpx;
  border-radius: 6rpx;
  border: 1rpx solid rgba(108, 117, 125, 0.3);
  margin-left: $margin-xs;
  
  &.overdue {
    background-color: rgba(220, 53, 69, 0.1);
    border-color: rgba(220, 53, 69, 0.3);
    
    .countdown-text {
      color: $error-color;
    }
  }
}

.countdown-text {
  font-size: $font-size-xs;
  color: $text-tertiary;
  font-weight: $font-weight-medium;
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
  
  &--square {
    width: 28rpx;
    height: 28rpx;
    border-radius: 4rpx;
    border: 1rpx solid #cccccc;
    background-color: #ffffff;
    @include flex-center;
    margin-right: $margin-sm;
    
    &:hover {
      background-color: $gray-100;
    }
    
    &:active {
      background-color: $gray-200;
    }
    
    &.task-status--completed {
      border-color: #28a745;
      background-color: #f8fff9;
    }
  }
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
  align-items: center;
  gap: 4rpx;
  background-color: rgba(255, 152, 0, 0.05);
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  border: 1rpx solid rgba(255, 152, 0, 0.2);
  
  &--item {
    margin-top: 0;
    align-self: flex-start;
  }
}

.comment-count {
  font-size: $font-size-xs;
  color: #ff9800;
  font-weight: $font-weight-medium;
  min-width: 16rpx;
  text-align: center;
  
  .comment-hint--item & {
    min-width: 12rpx;
    font-size: $font-size-xs;
  }
}

.unread-dot {
  width: 16rpx;
  height: 16rpx;
  background-color: $warning-color;
  border-radius: 50%;
  margin-left: 8rpx;
  flex-shrink: 0;
}

.subtasks-container {
  position: relative;
  margin-top: $margin-sm;
  padding-top: $margin-sm;
  
  /* #ifndef MP-WEIXIN */
  padding-left: $subtask-indent;
  
  // 垂直连接线
  &::before {
    content: '';
    position: absolute;
    left: 10rpx;
    top: 0;
    bottom: 20rpx;
    width: $subtask-connector-width;
    background-color: $subtask-connector-color;
  }
  /* #endif */
  
  /* #ifdef MP-WEIXIN */
  // 微信小程序简化版样式
  padding-left: $padding-base;
  /* #endif */
  
  // 子任务项样式 - 微信小程序兼容版
  /* #ifndef MP-WEIXIN */
  :deep(.task-item--item) {
    position: relative;
    
    // 水平连接线
    &::after {
      content: '';
      position: absolute;
      left: -10rpx;
      top: 50%;
      width: 10rpx;
      height: $subtask-connector-width;
      background-color: $subtask-connector-color;
      transform: translateY(-50%);
    }
  }
  /* #endif */
  
  /* #ifdef MP-WEIXIN */
  .subtask-wrapper .task-item--item {
    position: relative;
    
    // 水平连接线
    &::after {
      content: '';
      position: absolute;
      left: -10rpx;
      top: 50%;
      width: 10rpx;
      height: $subtask-connector-width;
      background-color: $subtask-connector-color;
      transform: translateY(-50%);
    }
  }
  /* #endif */
}

// 响应式优化
@media (max-width: 480rpx) {
  .subtasks-container {
    padding-left: 16rpx; // 小屏幕下减少缩进
    
    &::before {
      left: 8rpx; // 调整连接线位置
    }
    
    /* #ifndef MP-WEIXIN */
    :deep(.task-item--item) {
      &::after {
        left: -8rpx;
        width: 8rpx;
      }
    }
    /* #endif */
    
    /* #ifdef MP-WEIXIN */
    .subtask-wrapper .task-item--item {
      &::after {
        left: -8rpx;
        width: 8rpx;
      }
    }
    /* #endif */
  }
  
  // 小屏幕下优先级边框宽度调整  
  .task-item--priority-low,
  .task-item--priority-medium,
  .task-item--priority-high,
  .task-item--priority-urgent {
    border-left-width: 3rpx;
  }
}

/* #ifdef MP-WEIXIN */
// 微信小程序内联子任务样式
.wx-subtask-item {
  cursor: pointer;
  position: relative;
  padding: $padding-sm;
  background-color: $gray-100;
  border-radius: $border-radius-small;
  margin-bottom: $margin-xs;
  
  &:active {
    background-color: $gray-200;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
  
  // 优先级边框样式
  &--priority-low {
    @include priority-border($priority-border-low);
    border-left: $priority-border-width solid $priority-border-low !important;
    background-color: rgba(128, 128, 128, 0.1) !important;
  }
  
  &--priority-medium {
    @include priority-border($priority-border-medium);
    border-left: $priority-border-width solid $priority-border-medium !important;
    background-color: rgba(255, 152, 0, 0.1) !important;
  }
  
  &--priority-high {
    @include priority-border($priority-border-high);
    border-left: $priority-border-width solid $priority-border-high !important;
    background-color: rgba(255, 193, 7, 0.1) !important;
  }
  
  &--priority-urgent {
    @include priority-border($priority-border-urgent);
    border-left: $priority-border-width solid $priority-border-urgent !important;
    background-color: rgba(220, 53, 69, 0.1) !important;
  }
}

.wx-subtask-connector {
  position: absolute;
  left: -10rpx;
  top: 50%;
  width: 10rpx;
  height: $subtask-connector-width;
  background-color: $subtask-connector-color;
  transform: translateY(-50%);
}

.wx-subtask-header {
  @include flex-between;
  align-items: center;
  margin-bottom: 0;
}

.wx-subtask-left {
  @include flex-start;
  flex: 1;
  align-items: flex-start;
}

.wx-subtask-right {
  @include flex-start;
  gap: $margin-sm;
  flex-shrink: 0;
}

.wx-subtask-content {
  flex: 1;
  margin-left: $margin-sm;
}

.wx-subtask-title-row {
  @include flex-start;
  align-items: flex-start;
  gap: $margin-xs;
  margin-bottom: 4rpx;
  flex-wrap: wrap;
}

.wx-subtask-title {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: $font-weight-medium;
  line-height: $line-height-base;
  
  &-completed {
    color: $text-tertiary;
    text-decoration: line-through;
  }
}

// 原来的微信子任务标签样式保留
.wx-subtask-tags {
  @include flex-start;
  gap: $margin-xs;
  flex-shrink: 0;
}

// 微信子任务底部信息栏：评论和标签
.wx-subtask-bottom-info {
  @include flex-between;
  align-items: center;
  margin-top: $margin-xs;
  gap: $margin-sm;
}

// 微信子任务右侧标签容器样式（从右到左排列）
.wx-subtask-tags-right {
  @include flex-start;
  flex-direction: row-reverse;
  gap: $margin-xs;
  flex-wrap: wrap;
  align-items: center;
}

// 新增：微信子任务倒计时内联样式
.wx-subtask-countdown-inline {
  @include flex-start;
  gap: 3rpx;
  background-color: rgba(108, 117, 125, 0.1);
  padding: 1rpx 4rpx;
  border-radius: 4rpx;
  border: 1rpx solid rgba(108, 117, 125, 0.3);
  margin-left: $margin-xs;
  
  &.overdue {
    background-color: rgba(220, 53, 69, 0.1);
    border-color: rgba(220, 53, 69, 0.3);
    
    .wx-subtask-countdown-text {
      color: $error-color;
    }
  }
}

.wx-subtask-countdown-text {
  font-size: $font-size-xs;
  color: $text-tertiary;
  font-weight: $font-weight-medium;
}

.wx-subtask-tag-item {
  padding: 2rpx 6rpx;
  border-radius: 6rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  @include flex-center;
}

.wx-subtask-tag-text {
  font-size: $font-size-xs;
  color: #ffffff;
  font-weight: $font-weight-medium;
}

.wx-subtask-more-tags {
  font-size: $font-size-xs;
  color: $text-tertiary;
}

.wx-subtask-description {
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: $line-height-base;
  display: block;
}

.wx-subtask-status {
  @include icon-button(44rpx);
  border: 1rpx solid $border-color;
  
  &--square {
    width: 20rpx;
    height: 20rpx;
    border-radius: 3rpx;
    border: 1rpx solid #cccccc;
    background-color: #ffffff;
    @include flex-center;
    margin-right: $margin-xs;
    
    &:hover {
      background-color: $gray-100;
    }
    
    &:active {
      background-color: $gray-200;
    }
    
    &.wx-subtask-status--completed {
      border-color: #28a745;
      background-color: #f8fff9;
    }
  }
}

.wx-subtask-status-readonly {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  
  &--square {
    width: 20rpx;
    height: 20rpx;
    border-radius: 3rpx;
    border: 1rpx solid #cccccc;
    background-color: #ffffff;
    @include flex-center;
    margin-right: $margin-xs;
    opacity: 0.6;
    
    &.wx-subtask-status--completed {
      border-color: #28a745;
      background-color: #f8fff9;
    }
  }
}

.wx-subtask-detail-btn {
  @include icon-button(32rpx);
}

.wx-subtask-comment-hint {
  @include flex-start;
  align-items: center;
  gap: 4rpx;
  background-color: rgba(255, 152, 0, 0.05);
  padding: 4rpx 8rpx;
  border-radius: 10rpx;
  border: 1rpx solid rgba(255, 152, 0, 0.2);
  margin-top: 0;
  align-self: flex-start;
}

.wx-subtask-comment-count {
  font-size: $font-size-xs;
  color: #ff9800;
  font-weight: $font-weight-medium;
  min-width: 12rpx;
  text-align: center;
}

.wx-subtask-unread-dot {
  width: 16rpx;
  height: 16rpx;
  background-color: $warning-color;
  border-radius: 50%;
  margin-left: 8rpx;
  flex-shrink: 0;
}

/* #endif */

</style>