<template>
  <view class="detail-page">
    <!-- 项目册头部信息 -->
    <BookHeader
      v-if="!bookLoading && !bookError"
      :book-data="bookData"
      :overall-progress="overallProgress"
      :task-stats="taskStats"
      :member-count="memberCount"
      @more-actions="handleMoreActions"
    />
    
    <!-- 加载状态 -->
    <LoadingState v-if="bookLoading" />
    
    <!-- 错误状态 -->
    <ErrorState 
      v-if="bookError" 
      :message="bookError"
      @retry="loadBookDetail" />

    <!-- 任务搜索框 - 固定在头部下方 -->
    <view class="search-sticky" v-if="!bookLoading && !bookError">
      <TaskSearch
        v-model="searchKeyword"
        @search="handleSearch"
        @clear="handleClearSearch"
      />
    </view>

    <!-- 任务筛选标签 - 固定在搜索框下方 -->
    <view class="filter-sticky" v-if="!bookLoading && !bookError">
      <TaskFilter
        :filter-tabs="filterTabs"
        :active-filter="activeFilter"
        @filter-change="setActiveFilter"
      />
    </view>

    <!-- 虚拟滚动任务列表 -->
    <view class="task-list-container" v-if="!bookLoading && !bookError">
      <VirtualTaskList
        :tasks="filteredTasks"
        :loading="tasksLoading"
        :error="tasksError"
        :active-filter="activeFilter"
        :get-unread-comment-count="getUnreadCommentCount"
        :container-height="virtualListHeight"
        @retry="refreshTasks"
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

    <!-- 浮动创建任务按钮 -->
    <view class="fab-container">
      <view class="fab-button" @click="addTask">
        <uni-icons color="#ffffff" size="28" type="plus" />
      </view>
    </view>

    <!-- 操作弹窗 -->
    <uni-popup ref="actionPopupRef" type="bottom" background-color="#ffffff" :safe-area="true">
      <view class="action-sheet">
        <view class="action-header">
          <text class="action-title">{{ bookData?.title }}</text>
        </view>
        <scroll-view scroll-y class="action-scroll">
          <view class="action-list">
            <view class="action-item" @click="handleEditTodoBook">
              <uni-icons color="#007AFF" size="20" type="compose" />
              <text class="action-text">编辑</text>
            </view>
            <view class="action-item" @click="handleMembers">
              <uni-icons color="#28a745" size="20" type="staff" />
              <text class="action-text">成员管理</text>
            </view>
            <view class="action-item" @click="handleShowStatistics">
              <uni-icons color="#17a2b8" size="20" type="bars" />
              <text class="action-text">数据统计</text>
            </view>
          </view>
        </scroll-view>
        <view class="action-cancel" @click="hideActionSheet">
          <text class="cancel-text">取消</text>
        </view>
        <!-- 底部占位空间，确保不被tab栏遮挡 -->
        <view class="bottom-spacer"></view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'

import BookHeader from '@/pages/todobooks/components/book/BookHeader.vue'
import TaskSearch from '@/pages/todobooks/components/task/TaskSearch.vue'
import TaskFilter from '@/pages/todobooks/components/task/TaskFilter.vue'
import VirtualTaskList from '@/pages/todobooks/components/task/VirtualTaskList.vue'
import LoadingState from '@/pages/todobooks/components/common/LoadingState.vue'
import ErrorState from '@/pages/todobooks/components/common/ErrorState.vue'

import { useBookData } from '@/pages/todobooks/composables/useBookData.js'
import { useTaskData } from '@/pages/todobooks/composables/useTaskData.js'
import { calculateUnreadCount } from '@/utils/commentUtils.js'
import { currentUserId } from '@/store/storage.js'

// 用于存储从路由获取的 bookId，初始为 null
let bookId = null

// 初始化组合式函数，此时不传入 bookId
const {
  bookData,
  allTasks,
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
  searchKeyword,
  filterTabs,
  filteredTasks,
  initializeTasks,
  setActiveFilter,
  setSearchKeyword,
  taskStats,
  overallProgress,
  toggleTaskStatus,
  toggleSubtaskStatus,
  deleteTask: removeTask
} = useTaskData()

// 组件本地状态
const currentTask = ref(null)
const hasInitialized = ref(false) // 用于 onShow 判断是否为首次进入页面
const virtualListHeight = ref(600) // 虚拟滚动容器高度
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
onLoad(async (options) => {
  console.log("onLoad options", JSON.stringify(options, null, 2))
  if (options && options.id) {
    bookId = options.id
    // 先加载项目册详情（包含任务数据）
    await loadBookDetail(bookId, { includeBasic: true, includeTasks:true })
    initializeTasks(allTasks.value)
  } else {
    console.error('错误：未能从路由参数中获取到 id')
    uni.showToast({ title: '页面参数错误', icon: 'error' })
  }
})

// onMounted 在 onLoad 之后执行，适合用来标记页面已完成首次渲染
onMounted(() => {
  hasInitialized.value = true
  calculateVirtualListHeight()
})

// 计算虚拟滚动容器高度
const calculateVirtualListHeight = () => {
  uni.getSystemInfo({
    success: (res) => {
      const screenHeight = res.windowHeight
      // 减去固定元素的高度：导航栏、搜索框、筛选器、底部安全区域等
      const fixedHeight = 200 // 预估固定元素高度
      virtualListHeight.value = screenHeight - fixedHeight
    }
  })
}

// 页面再次显示时触发（例如从下一页返回）
onShow(() => {
  // 如果页面已经初始化过，并且 bookId 存在，则刷新数据
  if (hasInitialized.value && bookId) {
    refreshTasks()
  }
})


// 下拉刷新
onPullDownRefresh(async () => {
  if (!bookId) {
    uni.stopPullDownRefresh()
    return
  }
  try {
    await refreshTasks()
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

// 刷新任务数据
const refreshTasks = async () => {
  if (!bookId) return
  
  await loadBookDetail(bookId, { includeBasic: true, includeTasks: true })
  await initializeTasks(allTasks.value)
}

// 搜索处理函数
const handleSearch = (keyword) => {
  setSearchKeyword(keyword)
}

// 清空搜索
const handleClearSearch = () => {
  setSearchKeyword('')
}



const getUnreadCommentCount = (task) => {
  try {
    if (!task || !task.comments) return 0
    return calculateUnreadCount(task._id, task.comments, currentUserId.value)
  } catch (error) {
    console.error('获取未读评论数量失败:', error)
    return 0
  }
}

// 弹窗相关数据
const actionPopupRef = ref(null)

const handleMoreActions = () => {
  actionPopupRef.value?.open()
}

const hideActionSheet = () => {
  actionPopupRef.value?.close()
}

// 处理各种操作
const handleEditTodoBook = () => {
  hideActionSheet()
  uni.navigateTo({
    url: `/pages/todobooks/form?id=${bookId}`
  })
}

const handleMembers = () => {
  hideActionSheet()
  uni.navigateTo({
    url: `/pages/todobooks/members?id=${bookId}&bookData=${encodeURIComponent(JSON.stringify(bookData.value))}`
  })
}

const handleShowStatistics = () => {
  hideActionSheet()
  uni.navigateTo({
    url: `/pages/todobooks/statistics?id=${bookId}`
  })
}

const addTask = () => {
  uni.navigateTo({
    url: `/pages/tasks/form?bookId=${bookId}`
  })
}

const handleTaskClick = (task) => {
  if (task.subtask_count > 0) {
    task.expanded = !task.expanded
  } else {
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
    url: `/pages/tasks/form?id=${task._id}&bookId=${bookId}`
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
          await refreshTasks()
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
    url: `/pages/tasks/detail?id=${subtask._id}&bookId=${bookId}`
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

/* 固定搜索框 */
.search-sticky {
  position: sticky;
  top: 0;
  z-index: 60;
  background-color: $bg-secondary;
  
  /* 确保在不同平台下都有足够的顶部空间 */
  /* #ifdef H5 */
  top: 44px;
  /* #endif */
  
  /* #ifdef MP-WEIXIN */
  top: 0;
  /* #endif */
  
  /* #ifdef APP-PLUS */
  top: 0;
  /* #endif */
}

/* 固定筛选器 */
.filter-sticky {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: $bg-secondary;
  padding-top: 8rpx;
  padding-bottom: 8rpx;
  margin-top: -8rpx;
  
  /* 确保在不同平台下都有足够的顶部空间，考虑搜索框的高度 */
  /* #ifdef H5 */
  top: calc(44px + 88rpx);
  /* #endif */
  
  /* #ifdef MP-WEIXIN */
  top: 88rpx;
  /* #endif */
  
  /* #ifdef APP-PLUS */
  top: 88rpx;
  /* #endif */
}

/* 操作弹窗 */
.action-sheet {
  background-color: #ffffff;
  border-radius: 20rpx 20rpx 0 0;
  padding-bottom: 40rpx;
  /* #ifndef APP-NVUE */
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  z-index: 9999;
  position: relative;
  /* #endif */
}

.action-header {
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  align-items: center;
}

.action-scroll {
  max-height: 60vh;
  flex: 1;
}

.action-title {
  font-size: 32rpx;
  color: #333333;
  font-weight: 500;
}

.action-list {
  padding: 0 20rpx;
}

.action-item {
  flex-direction: row;
  align-items: center;
  padding: 24rpx 20rpx;
  border-radius: 12rpx;
  margin: 8rpx 0;
}

.action-item:active {
  background-color: #f8f8f8;
}

.action-text {
  font-size: 30rpx;
  color: #333333;
  margin-left: 16rpx;
}

.action-cancel {
  margin: 20rpx;
  margin-bottom: 60rpx;
  padding: 24rpx;
  background-color: #f8f8f8;
  border-radius: 16rpx;
  align-items: center;
  /* #ifndef APP-NVUE */
  margin-bottom: calc(60rpx + env(safe-area-inset-bottom));
  /* #endif */
}

.action-cancel:active {
  background-color: #e8e8e8;
}

.cancel-text {
  font-size: 30rpx;
  color: #666666;
}

.bottom-spacer {
  height: 120rpx;
  /* #ifndef APP-NVUE */
  height: calc(120rpx + env(safe-area-inset-bottom));
  /* #endif */
}

/* 浮动添加按钮 */
.fab-container {
  position: fixed;
  bottom: 40rpx;
  right: 40rpx;
  z-index: 999;
  /* #ifndef APP-NVUE */
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  /* #endif */
}

.fab-button {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%);
  border-radius: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 122, 255, 0.3);
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.95);
    box-shadow: 0 4rpx 16rpx rgba(0, 122, 255, 0.4);
  }
}

/* 虚拟滚动任务列表容器 */
.task-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* 确保容器占用剩余空间 */
  min-height: 0;
}
</style>