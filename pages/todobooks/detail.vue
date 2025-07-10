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

<script>
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

export default {
  components: {
    BookHeader,
    TaskFilter,
    TaskList,
    LoadingState,
    ErrorState
  },
  
  setup() {
    // 获取路由参数
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const bookId = currentPage.options.id

    // 使用组合函数
    const {
      bookData,
      loading: bookLoading,
      error: bookError,
      overallProgress: originalOverallProgress,
      taskStats: originalTaskStats,
      memberCount,
      loadBookDetail,
      updateLocalStats
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
      toggleTaskStatus: originalToggleTaskStatus,
      toggleSubtaskStatus: originalToggleSubtaskStatus,
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
    
    // 包装任务状态切换方法
    const toggleTaskStatus = async (task) => {
      await originalToggleTaskStatus(task)
    }
    
    // 包装子任务状态切换方法
    const toggleSubtaskStatus = async (subtask) => {
      await originalToggleSubtaskStatus(subtask)
    }
    
    // 查找子任务的父任务
    const findParentTask = (subtask) => {
      if (!subtask.parent_id) return null
      return tasks.value.find(task => task._id === subtask.parent_id)
    }
    
    // 重新计算任务统计，考虑父子任务关系
    const taskStats = computed(() => {
      let total = 0
      let completed = 0
      
      // 遍历所有任务（只统计父任务）
      tasks.value.forEach(task => {
        total++
        
        // 判断任务是否完成
        if (task.subtask_count === 0) {
          // 没有子任务，直接看任务状态
          if (task.status === 'completed') {
            completed++
          }
        } else {
          // 有子任务的任务
          // 由于父任务状态会自动更新，直接检查父任务状态即可
          if (task.status === 'completed') {
            completed++
          }
        }
      })
      
      // 统计所有子任务
      tasks.value.forEach(task => {
        if (task.subtasks && task.subtasks.length > 0) {
          total += task.subtasks.length
          // 统计已完成的子任务
          task.subtasks.forEach(subtask => {
            if (subtask.status === 'completed') {
              completed++
            }
          })
        }
      })
      
      return { total, completed, todo: total - completed }
    })
    
    // 重新计算完成进度
    const overallProgress = computed(() => {
      const stats = taskStats.value
      if (stats.total === 0) return 0
      return Math.round((stats.completed / stats.total) * 100)
    })

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
      // 根据是否有子任务设置不同的提示内容
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

    // 下拉刷新处理
    const handlePullDownRefresh = async () => {
      try {
        await Promise.all([
          loadBookDetail(),
          loadTasks()
        ])
      } catch (error) {
        console.error('下拉刷新失败:', error)
      } finally {
        uni.stopPullDownRefresh()
      }
    }

    // 标记是否已初始化
    const hasInitialized = ref(false)
    
    // 生命周期
    onMounted(() => {
      loadBookDetail()
      loadTasks()
      
      // 标记已初始化
      hasInitialized.value = true
    })

    onUnmounted(() => {
      if (dragState.value.longPressTimer) {
        clearTimeout(dragState.value.longPressTimer)
      }
    })

    // 返回给模板使用的数据和方法
    return {
      // 数据
      bookData,
      bookLoading,
      bookError,
      overallProgress,
      taskStats,
      memberCount,
      tasks,
      tasksLoading,
      tasksError,
      activeFilter,
      filterTabs,
      filteredTasks,
      currentUserId,
      currentTask,
      hasInitialized,
      
      // 方法
      loadBookDetail,
      loadTasks,
      setActiveFilter,
      getUnreadCommentCount,
      addTask,
      handleTaskClick,
      showTaskMenu,
      viewTaskDetail,
      editTask,
      deleteTask,
      toggleTaskStatus,
      toggleSubtaskStatus,
      showSubtaskMenu,
      handleSubtaskClick,
      handleSubtaskTouchStart,
      handleSubtaskTouchMove,
      handleSubtaskTouchEnd,
      handlePullDownRefresh
    }
  },
  
  // uni-app 生命周期钩子
  onShow() {
    // 如果不是第一次加载，则刷新数据
    if (this.hasInitialized) {
      // 同时刷新任务列表和项目册详情，以更新统计数据
      Promise.all([
        this.loadTasks(),
        this.loadBookDetail()
      ])
    }
  },
  
  onPullDownRefresh() {
    if (this.handlePullDownRefresh) {
      this.handlePullDownRefresh()
    } else {
      console.error('handlePullDownRefresh 方法不存在！')
      uni.stopPullDownRefresh()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/variables.scss';

.detail-page {
  min-height: 100vh;
  background-color: $bg-secondary;
  padding-bottom: $safe-area-bottom;
}
</style>