<template>
  <view class="virtual-task-list">
    <!-- 加载状态 -->
    <LoadingState v-if="loading" />
    
    <!-- 错误状态 -->
    <ErrorState 
      v-else-if="error" 
      :message="error"
      @retry="handleRetry" />
    
    <!-- 空状态 -->
    <EmptyState 
      v-else-if="tasks.length === 0"
      :title="emptyText"
      :show-action="activeFilter === 'all'"
      action-text="创建第一个任务"
      @action="handleAddTask" />
    
    <!-- 虚拟滚动容器 -->
    <scroll-view
      v-else
      class="virtual-scroll-container"
      :scroll-y="true"
      :scroll-with-animation="true"
      :scroll-top="scrollTop"
      @scroll="handleScroll"
      :style="{ height: containerHeight + 'px' }">
      
      <!-- 上边距占位 -->
      <view :style="{ height: offsetTop + 'px' }"></view>
      
      <!-- 可见任务列表 -->
      <view class="visible-tasks">
        <TaskItem
          v-for="(task, index) in visibleTasks"
          :key="task._id"
          :task="task"
          :variant="'card'"
          :unreadCommentCount="getUnreadCommentCount(task)"
          @click="handleTaskClick"
          @statusToggle="handleStatusToggle"
          @menuClick="handleMenuClick"
          @subtaskStatusToggle="handleSubtaskStatusToggle"
          @subtaskMenuClick="handleSubtaskMenuClick"
          @subtaskClick="handleSubtaskClick"
          @touchStart="handleSubtaskTouchStart"
          @touchMove="handleSubtaskTouchMove"
          @touchEnd="handleSubtaskTouchEnd"
        />
      </view>
      
      <!-- 下边距占位 -->
      <view :style="{ height: offsetBottom + 'px' }"></view>
    </scroll-view>
    
    <!-- 任务菜单弹窗 -->
    <TaskMenuPopup
      ref="taskMenuPopup"
      :current-task="currentTask"
      @view-detail="handleViewDetail"
      @edit="handleEdit"
      @delete="handleDelete"
      @cancel="handleMenuCancel"
    />
  </view>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
import { useVirtualList } from '../composables/useVirtualList.js'
import LoadingState from '../common/LoadingState.vue'
import ErrorState from '../common/ErrorState.vue'
import EmptyState from '../common/EmptyState.vue'
import TaskItem from './TaskItem.vue'
import TaskMenuPopup from './TaskMenuPopup.vue'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  activeFilter: {
    type: String,
    default: 'all'
  },
  getUnreadCommentCount: {
    type: Function,
    required: true
  },
  containerHeight: {
    type: Number,
    default: 600
  }
})

const emit = defineEmits([
  'retry',
  'addTask',
  'taskClick',
  'statusToggle',
  'menuClick',
  'viewDetail',
  'edit',
  'delete',
  'subtaskStatusToggle',
  'subtaskMenuClick',
  'subtaskClick',
  'subtaskTouchStart',
  'subtaskTouchMove',
  'subtaskTouchEnd'
])

const taskMenuPopup = ref(null)
const currentTask = ref(null)
const scrollTop = ref(0)

// 使用虚拟滚动组合函数
const {
  visibleTasks,
  offsetTop,
  offsetBottom,
  handleScroll: onScroll,
  updateItemHeight,
  scrollToIndex
} = useVirtualList(computed(() => props.tasks), {
  containerHeight: props.containerHeight,
  estimatedItemHeight: 120, // 预估任务卡片高度
  overscan: 3 // 预渲染数量
})

const emptyText = computed(() => {
  const map = {
    all: '还没有任务，创建第一个吧',
    todo: '没有待办任务',
    completed: '还没有完成的任务'
  }
  return map[props.activeFilter] || '暂无数据'
})

// 处理滚动事件
const handleScroll = (event) => {
  const { scrollTop: newScrollTop } = event.detail
  scrollTop.value = newScrollTop
  onScroll(event)
}

// 简化版本不需要动态高度测量

// 事件处理函数
const handleRetry = () => {
  emit('retry')
}

const handleAddTask = () => {
  emit('addTask')
}

const handleTaskClick = (task) => {
  emit('taskClick', task)
}

const handleStatusToggle = (task) => {
  emit('statusToggle', task)
}

const handleMenuClick = (task) => {
  currentTask.value = task
  taskMenuPopup.value?.open()
}

const handleViewDetail = (task) => {
  emit('viewDetail', task)
}

const handleEdit = (task) => {
  emit('edit', task)
}

const handleDelete = (task) => {
  emit('delete', task)
}

const handleMenuCancel = () => {
  currentTask.value = null
}

const handleSubtaskStatusToggle = (subtask) => {
  emit('subtaskStatusToggle', subtask)
}

const handleSubtaskMenuClick = (subtask) => {
  currentTask.value = subtask
  taskMenuPopup.value?.open()
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

// 简化版本不需要清理资源
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.virtual-task-list {
  flex: 1;
  height: 100%;
}

.virtual-scroll-container {
  width: 100%;
  height: 100%;
}

.visible-tasks {
  padding: 0 $padding-base;
  gap: $margin-sm;
}
</style>