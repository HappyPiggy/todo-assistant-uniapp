<template>
  <view class="task-list">
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
    
    <!-- 任务卡片列表 -->
    <view v-else class="tasks-container">
      <TaskCard
        v-for="task in tasks"
        :key="task._id"
        :task="task"
        :current-user-id="currentUserId"
        :unread-comment-count="getUnreadCommentCount(task)"
        @task-click="handleTaskClick"
        @status-toggle="handleStatusToggle"
        @menu-click="handleMenuClick"
        @subtask-status-toggle="handleSubtaskStatusToggle"
        @subtask-menu-click="handleSubtaskMenuClick"
        @subtask-click="handleSubtaskClick"
        @subtask-touch-start="handleSubtaskTouchStart"
        @subtask-touch-move="handleSubtaskTouchMove"
        @subtask-touch-end="handleSubtaskTouchEnd"
      />
    </view>
    
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
import LoadingState from '../common/LoadingState.vue'
import ErrorState from '../common/ErrorState.vue'
import EmptyState from '../common/EmptyState.vue'
import TaskCard from './TaskCard.vue'
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
  currentUserId: {
    type: String,
    required: true
  },
  getUnreadCommentCount: {
    type: Function,
    required: true
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

const emptyText = computed(() => {
  const map = {
    all: '还没有任务，创建第一个吧',
    todo: '没有待办任务',
    completed: '还没有完成的任务'
  }
  return map[props.activeFilter] || '暂无数据'
})

const handleRetry = () => {
  emit('retry')
}

const handleAddTask = () => {
  emit('addTask')
}

const handleTaskClick = (task) => {
  if (task.subtask_count > 0) {
    // 有子任务，展开/收起
    task.expanded = !task.expanded
  } else {
    // 无子任务，打开详情页
    emit('taskClick', task)
  }
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
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.task-list {
  flex: 1;
}

.tasks-container {
  padding: 0 $padding-base;
  gap: $margin-sm;
}
</style>