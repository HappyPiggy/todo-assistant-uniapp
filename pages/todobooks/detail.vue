<template>
  <view class="detail-page">
    <!-- 项目册头部信息 -->
    <BookHeader
      v-if="!bookLoading && !bookError"
      :book-data="bookData"
      :overall-progress="overallProgress"
      :task-stats="taskStats"
      :member-count="memberCount"
    />
    
    <!-- 加载状态 -->
    <LoadingState v-if="bookLoading" />
    
    <!-- 错误状态 -->
    <ErrorState 
      v-if="bookError" 
      :message="bookError"
      @retry="loadBookDetail" />

    <!-- 任务筛选标签 -->
<TaskFilter
      v-if="!bookLoading && !bookError"
      :filter-tabs="filterTabs"
      :active-filter="activeFilter"
      @filter-change="setActiveFilter"
      @add-task="addTask"
    />

    <!-- 任务列表 -->
    <TaskList
      v-if="!bookLoading && !bookError"
      :tasks="filteredTasks"
      :loading="tasksLoading"
      :error="tasksError"
      :active-filter="activeFilter"
      :current-user-id="currentUserId"
      :get-unread-comment-count="getUnreadCommentCount"
      @retry="loadTasks"
      @add-task="addTask"
      @task-click="handleTaskClick"
      @status-toggle="toggleTaskStatus"
      @menu-click="showTaskMenu"
      @view-detail="viewTaskDetail"
      @edit="editTask"
      @delete="deleteTask"
      @subtask-status-toggle="toggleSubtaskStatus"
      @subtask-menu-click="showSubtaskMenu"
      @subtask-click="handleSubtaskClick"
      @subtask-touch-start="handleSubtaskTouchStart"
      @subtask-touch-move="handleSubtaskTouchMove"
      @subtask-touch-end="handleSubtaskTouchEnd"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BookHeader from '@/pages/todobooks/components/book/BookHeader.vue'
import TaskFilter from '@/pages/todobooks/components/task/TaskFilter.vue'
import TaskList from '@/pages/todobooks/components/task/TaskList.vue'
import LoadingState from '@/pages/todobooks/components/common/LoadingState.vue'
import ErrorState from '@/pages/todobooks/components/common/ErrorState.vue'
import { useBookData } from '@/pages/todobooks/composables/useBookData.js'
import { useTaskData } from '@/pages/todobooks/composables/useTaskData.js'
import { calculateUnreadCount, extractCommentIds } from '@/utils/commentUtils.js'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'

// 获取路由参数
const pages = getCurrentPages()
const currentPage = pages[pages.length - 1]
const bookId = currentPage.options.id

// 使用组合函数
const {
  bookData,
  loading: bookLoading,
  error: bookError,
  overallProgress,
  taskStats,
  memberCount,
  loadBookDetail
} = useBookData(bookId)

const {
  tasks,
  loading: tasksLoading,
  error: tasksError,
  activeFilter,
  filterTabs,
  filteredTasks,
  loadTasks,
  setActiveFilter,
  toggleTaskStatus,
  toggleSubtaskStatus,
  deleteTask: removeTask
} = useTaskData(bookId)

// 当前用户ID
const currentUserId = computed(() => {
  return (store.userInfo && store.userInfo._id) || ''
})

// 当前任务（用于菜单操作）
const currentTask = ref(null)

// 拖拽状态
const dragState = ref({
  isDragging: false,
  dragItem: null,
  dragParent: null,
  startY: 0,
  currentY: 0,
  originalIndex: -1,
  newIndex: -1,
  longPressTimer: null
})

// 获取未读评论数量
const getUnreadCommentCount = (task) => {
  try {
    if (!task || !task.comments) {
      return 0
    }
    return calculateUnreadCount(task._id, task.comments, currentUserId.value)
  } catch (error) {
    console.error('获取未读评论数量失败:', error)
    return 0
  }
}

// 页面方法
const addTask = () => {
  uni.navigateTo({
    url: `/pages/tasks/create?bookId=${bookId}`
  })
}

const handleTaskClick = (task) => {
  if (task.subtask_count > 0) {
    // 有子任务，展开/收起
    task.expanded = !task.expanded
  } else {
    // 无子任务，打开详情页
    uni.navigateTo({
      url: `/pages/tasks/detail?id=${task._id}&bookId=${bookId}`
    })
  }
}

const showTaskMenu = (task) => {
  currentTask.value = task
}

const viewTaskDetail = (task) => {
  uni.navigateTo({
    url: `/pages/tasks/detail?id=${task._id}&bookId=${bookId}`
  })
}

const editTask = (task) => {
  uni.navigateTo({
    url: `/pages/tasks/edit?id=${task._id}&bookId=${bookId}`
  })
}

const deleteTask = async (task) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个任务吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await removeTask(task._id)
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
        } catch (error) {
          uni.showToast({
            title: '删除失败',
            icon: 'error'
          })
        }
      }
    }
  })
}

const showSubtaskMenu = (subtask) => {
  currentTask.value = subtask
}

const handleSubtaskClick = (subtask) => {
  uni.navigateTo({
    url: `/pages/tasks/detail?id=${subtask._id}&bookId=${bookId}`
  })
}

const handleSubtaskTouchStart = (subtask, index, parentTask, event) => {
  // 拖拽开始逻辑
  dragState.value.isDragging = false
  dragState.value.dragItem = subtask
  dragState.value.dragParent = parentTask
  dragState.value.originalIndex = index
  dragState.value.startY = event.touches[0].clientY
  
  // 长按开始拖拽
  dragState.value.longPressTimer = setTimeout(() => {
    dragState.value.isDragging = true
    uni.vibrateShort()
  }, 500)
}

const handleSubtaskTouchMove = (event) => {
  if (!dragState.value.isDragging) return
  
  dragState.value.currentY = event.touches[0].clientY
  // 计算新位置逻辑
}

const handleSubtaskTouchEnd = (event) => {
  if (dragState.value.longPressTimer) {
    clearTimeout(dragState.value.longPressTimer)
    dragState.value.longPressTimer = null
  }
  
  if (dragState.value.isDragging) {
    // 完成拖拽排序
    dragState.value.isDragging = false
    // 保存新顺序逻辑
  }
}

// 生命周期
onMounted(() => {
  console.log('detail.vue onMounted 开始')
  console.log('detail.vue bookId:', bookId)
  console.log('detail.vue 初始 bookData:', bookData.value)
  console.log('detail.vue 初始 bookLoading:', bookLoading.value)
  console.log('detail.vue 初始 bookError:', bookError.value)
  
  loadBookDetail()
  loadTasks()
  
  console.log('detail.vue onMounted 结束')
})

onUnmounted(() => {
  if (dragState.value.longPressTimer) {
    clearTimeout(dragState.value.longPressTimer)
  }
})
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/variables.scss';

.detail-page {
  min-height: 100vh;
  background-color: $bg-secondary;
  padding-bottom: $safe-area-bottom;
}
</style>