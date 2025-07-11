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
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'

import BookHeader from '@/pages/todobooks/components/book/BookHeader.vue'
import TaskFilter from '@/pages/todobooks/components/task/TaskFilter.vue'
import TaskList from '@/pages/todobooks/components/task/TaskList.vue'
import LoadingState from '@/pages/todobooks/components/common/LoadingState.vue'
import ErrorState from '@/pages/todobooks/components/common/ErrorState.vue'

import { useBookData } from '@/pages/todobooks/composables/useBookData.js'
import { useTaskData } from '@/pages/todobooks/composables/useTaskData.js'
import { calculateUnreadCount } from '@/utils/commentUtils.js'
import { currentUserId } from '@/store/storage.js'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'

// 用于存储从路由获取的 bookId，初始为 null
const bookId = ref(null)

// 初始化组合式函数，此时不传入 bookId
const {
  bookData,
  loading: bookLoading,
  error: bookError,
  memberCount,
  loadBookDetail,
} = useBookData()

const {
  tasks,
  loading: tasksLoading,
  error: tasksError,
  activeFilter,
  filterTabs,
  filteredTasks,
  loadTasks,
  setActiveFilter,
  taskStats,
  overallProgress,
  toggleTaskStatus,
  toggleSubtaskStatus,
  deleteTask: removeTask
} = useTaskData()

// 组件本地状态
const currentTask = ref(null)
const hasInitialized = ref(false) // 用于 onShow 判断是否为首次进入页面
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

// 使用 onLoad 安全地获取页面参数
onLoad((options) => {
  if (options && options.id) {
    bookId.value = options.id
    loadBookDetail(bookId.value)
    loadTasks(bookId.value)
  } else {
    console.error('错误：未能从路由参数中获取到 id')
    uni.showToast({ title: '页面参数错误', icon: 'error' })
  }
})

// onMounted 在 onLoad 之后执行，适合用来标记页面已完成首次渲染
onMounted(() => {
  hasInitialized.value = true
})

// 页面再次显示时触发（例如从下一页返回）
onShow(() => {
  // 如果页面已经初始化过，并且 bookId 存在，则刷新数据
  if (hasInitialized.value && bookId.value) {
    Promise.all([
      loadTasks(bookId.value),
      loadBookDetail(bookId.value)
    ])
  }
})

// 下拉刷新
onPullDownRefresh(async () => {
  if (!bookId.value) {
    uni.stopPullDownRefresh()
    return
  }
  try {
    await Promise.all([
      loadBookDetail(bookId.value),
      loadTasks(bookId.value)
    ])
  } catch (error) {
    console.error('下拉刷新失败:', error)
  } finally {
    uni.stopPullDownRefresh()
  }
})

// 页面卸载时清理定时器
onUnmounted(() => {
  if (dragState.value.longPressTimer) {
    clearTimeout(dragState.value.longPressTimer)
  }
})



const getUnreadCommentCount = (task) => {
  try {
    if (!task || !task.comments) return 0
    return calculateUnreadCount(task._id, task.comments, currentUserId.value)
  } catch (error) {
    console.error('获取未读评论数量失败:', error)
    return 0
  }
}

const addTask = () => {
  uni.navigateTo({
    url: `/pages/tasks/create?bookId=${bookId.value}`
  })
}

const handleTaskClick = (task) => {
  if (task.subtask_count > 0) {
    task.expanded = !task.expanded
  } else {
    uni.navigateTo({
      url: `/pages/tasks/detail?id=${task._id}&bookId=${bookId.value}`
    })
  }
}

const showTaskMenu = (task) => {
  currentTask.value = task
}

const viewTaskDetail = (task) => {
  uni.navigateTo({
    url: `/pages/tasks/detail?id=${task._id}&bookId=${bookId.value}`
  })
}

const editTask = (task) => {
  uni.navigateTo({
    url: `/pages/tasks/edit?id=${task._id}&bookId=${bookId.value}`
  })
}

const deleteTask = async (task) => {
  let content = '确定要删除这个任务吗？'
  if (task.subtask_count > 0) {
    content = `此任务包含 ${task.subtask_count} 个子任务，删除后所有子任务也将被删除。确定要继续吗？`
  }
  
  uni.showModal({
    title: '确认删除',
    content: content,
    success: async (res) => {
      if (res.confirm) {
        try {
          await removeTask(task._id)
          uni.showToast({ title: '删除成功', icon: 'success' })
        } catch (error) {
          uni.showToast({ title: '删除失败', icon: 'error' })
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
    url: `/pages/tasks/detail?id=${subtask._id}&bookId=${bookId.value}`
  })
}

// --- 拖拽相关方法 ---
const handleSubtaskTouchStart = (subtask, index, parentTask, event) => {
  dragState.value.isDragging = false
  dragState.value.dragItem = subtask
  dragState.value.dragParent = parentTask
  dragState.value.originalIndex = index
  dragState.value.startY = event.touches[0].clientY
  
  dragState.value.longPressTimer = setTimeout(() => {
    dragState.value.isDragging = true
    uni.vibrateShort()
  }, 500)
}

const handleSubtaskTouchMove = (event) => {
  if (!dragState.value.isDragging) return
  dragState.value.currentY = event.touches[0].clientY
  // ... 拖拽移动逻辑 ...
}

const handleSubtaskTouchEnd = (event) => {
  if (dragState.value.longPressTimer) {
    clearTimeout(dragState.value.longPressTimer)
    dragState.value.longPressTimer = null
  }
  
  if (dragState.value.isDragging) {
    dragState.value.isDragging = false
    // ... 拖拽结束排序逻辑 ...
  }
}

// 在 <script setup> 中，所有在顶层声明的变量、计算属性和方法都会自动暴露给模板，无需手动 return。
</script>


<style lang="scss" scoped>
@import '@/pages/todobooks/styles/variables.scss';

.detail-page {
  min-height: 100vh;
  background-color: $bg-secondary;
  padding-bottom: $safe-area-bottom;
}
</style>