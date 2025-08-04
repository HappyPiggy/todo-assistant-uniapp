<template>
  <view class="detail-page">
    <!-- 加载状态 -->
    <LoadingState v-if="bookLoading" />
    
    <!-- 错误状态 -->
    <ErrorState 
      v-if="bookError" 
      :message="bookError"
      @retry="loadBookDetail" />

    <!-- 虚拟滚动任务列表（包含BookHeader和TaskFilter） -->
    <view 
      v-if="!bookLoading && !bookError"
      class="task-list-wrapper"
    >
      <VirtualTaskList
        ref="virtualTaskListRef"
        :tasks="sortedAndPinnedTasks"
        :loading="tasksLoading"
        :error="tasksError"
        :active-filter="activeFilter"
        :container-height="mainScrollHeight"
        :book-data="bookData"
        :overall-progress="overallProgress"
        :task-stats="taskStats"
        :member-count="memberCount"
        :filter-tabs="filterTabs"
        :available-tags="availableTags"
        :selected-tags="selectedTags"
        :current-sort="currentSort"
        :todorbook-id="bookId"
        :is-pinned="isPinned"
        :toggle-pin="togglePin"
        :is-archived="isArchived"
        :can-edit="canEdit"
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
        @more-actions="handleMoreActions"
        @search-click="handleSearchClick"
        @filter-change="setActiveFilter"
        @tag-filter-change="setSelectedTags"
        @sort-change="setSortOption"
        @scroll="handleScroll"
      />
    </view>

    <!-- 返回顶部按钮 -->
    <BackToTopButton 
      :visible="showBackToTop" 
      @scroll-to-top="scrollToTop" 
    />

    <!-- 浮动创建任务按钮 -->
    <view v-if="canEdit" class="fab-container">
      <view class="fab-button" @click="addTask">
        <uni-icons color="#ffffff" size="28" type="plus" />
      </view>
    </view>

    <!-- 搜索弹窗 -->
    <SearchOverlay
      :visible="showSearchOverlay"
      :keyword="searchKeyword"
      @search="handleSearchOverlaySearch"
      @clear="handleSearchOverlayClear"
      @close="handleSearchOverlayClose"
    />

    <!-- 操作弹窗 -->
    <TodoBookActionSheet
      ref="actionSheetRef"
      :book-data="bookData"
      :is-archived="isArchived"
      :show-delete="true"
      page-type="detail"
      @action-completed="handleActionCompleted"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { onLoad, onShow, onHide, onPullDownRefresh } from '@dcloudio/uni-app'

import VirtualTaskList from '@/pages/todobooks/components/task/VirtualTaskList.vue'
import LoadingState from '@/pages/todobooks/components/common/LoadingState.vue'
import ErrorState from '@/pages/todobooks/components/common/ErrorState.vue'
import SearchOverlay from '@/pages/todobooks/components/task/SearchOverlay.vue'
import BackToTopButton from '@/pages/todobooks/components/common/BackToTopButton.vue'
import TodoBookActionSheet from '@/pages/todobooks/components/TodoBookActionSheet.vue'

import { useBookData } from '@/pages/todobooks/composables/useBookData.js'
import { useTaskData } from '@/pages/todobooks/composables/useTaskData.js'
import { usePinning } from '@/composables/usePinning.js'
import { currentUserId } from '@/store/storage.js'

// 用于存储从路由获取的 bookId，初始为 null
let bookId = null
// 标记是否从list页面进入
let fromListPage = false
// 标记是否为归档项目册
let isFromArchive = false

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
  selectedTags,
  currentSort,
  filterTabs,
  availableTags,
  filteredTasks,
  sortedTasks,
  initializeTasks,
  setActiveFilter,
  setSearchKeyword,
  setSelectedTags,
  setSortOption,
  updateBookId,
  initializeSortFromStorage,
  taskStats,
  overallProgress,
  toggleTaskStatus,
  toggleSubtaskStatus,
  deleteTask: removeTask,
  updateTaskOptimistic,
  createTaskOptimistic
} = useTaskData(null, allTasks, bookData)

// 置顶功能（基于排序后的任务）
const { 
  sortedItems: sortedAndPinnedTasks, 
  isPinned, 
  togglePin, 
  refreshPinnedIds 
} = usePinning('tasks', sortedTasks)

// 监听availableTags变化
watch(availableTags, (newTags) => {
}, { deep: true, immediate: true })

// 监听用户切换，重新初始化排序状态
watch(currentUserId, (newUserId, oldUserId) => {
  if (newUserId && oldUserId && newUserId !== oldUserId && bookId) {
    console.log('👤 用户切换，重新初始化排序状态', { oldUserId, newUserId, bookId })
    // 用户切换后重新初始化排序状态
    initializeSortFromStorage()
  }
  if (newUserId && !oldUserId && bookId) {
    console.log('👤 用户ID现在可用，初始化排序状态', { newUserId, bookId })
    // 从无用户ID到有用户ID，初始化排序状态
    initializeSortFromStorage()
  }
}, { immediate: false })

// 归档状态检测
const isArchived = computed(() => {
  return bookData.value?.is_archived === true || isFromArchive
})

// 编辑权限检查
const canEdit = computed(() => {
  const result = !isArchived.value && !!bookData.value
  console.log('canEdit计算:', { isArchived: isArchived.value, bookData: !!bookData.value, result })
  return result
})

// 组件本地状态
const currentTask = ref(null)
const hasInitialized = ref(false) // 用于 onShow 判断是否为首次进入页面
const virtualListHeight = ref(600) // 虚拟滚动容器高度
const mainScrollHeight = ref(600) // 主滚动区域高度
const showSearchOverlay = ref(false) // 搜索弹窗显示状态
const showBackToTop = ref(false) // 返回顶部按钮显示状态
const virtualTaskListRef = ref(null) // VirtualTaskList 组件引用

// 使用 onLoad 安全地获取页面参数
onLoad(async (options) => {
  console.log("onLoad options", JSON.stringify(options, null, 2))
  if (options && options.id) {
    bookId = options.id
    // 检查是否从list页面进入
    fromListPage = options.from === 'list'
    // 检查是否从归档管理页面进入
    isFromArchive = options.from === 'archive' || options.archived === 'true'
    
    // 更新useTaskData中的bookId
    updateBookId(bookId)
    
    // 先加载项目册详情（包含任务数据）
    await loadBookDetail(bookId, { includeBasic: true, includeTasks:true })
    initializeTasks(allTasks.value)
    
    // 在任务初始化后，初始化排序状态
    initializeSortFromStorage()
    
    // 如果从列表页跳转过来，设置默认筛选
    if (options.filter === 'all') {
      setActiveFilter('all')
    } else if (options.filter === 'todo') {
      setActiveFilter('todo')
    }
    
    // 如果是归档项目册，显示归档状态提示
    if (isArchived.value) {
      console.log('当前项目册已归档，编辑功能受限')
    }
  } else {
    console.error('错误：未能从路由参数中获取到 id')
    uni.showToast({ title: '页面参数错误', icon: 'error' })
  }
})

// onMounted 在 onLoad 之后执行，适合用来标记页面已完成首次渲染
onMounted(() => {
  hasInitialized.value = true
  calculateVirtualListHeight()
  
  // 注册事件监听
  uni.$on('task-updated', updateTaskOptimistic)
  uni.$on('task-created', createTaskOptimistic)
  uni.$on('task-parent-changed', handleTaskParentChanged)
})

// 计算滚动区域高度
const calculateVirtualListHeight = () => {
  uni.getSystemInfo({
    success: (res) => {
      const screenHeight = res.windowHeight
      // 直接使用窗口高度，VirtualTaskList 组件内部会处理固定头部的高度
      mainScrollHeight.value = screenHeight
      // 虚拟列表高度与主滚动区域保持一致
      virtualListHeight.value = mainScrollHeight.value
    }
  })
}

// 页面再次显示时触发（例如从下一页返回）
onShow(() => {
  // 只有从list页面进入时才清理缓存，且只在首次显示时执行
  if (fromListPage && !hasInitialized.value) {
    // 延迟执行，确保组件已完成渲染
    setTimeout(() => {
      if (virtualTaskListRef.value && virtualTaskListRef.value.clearCommentCache) {
        virtualTaskListRef.value.clearCommentCache()
      }
    }, 500)
  }
})




// 页面卸载时清理
onUnmounted(() => {
  // 移除事件监听
  uni.$off('task-updated', updateTaskOptimistic)
  uni.$off('task-created', createTaskOptimistic)
  uni.$off('task-parent-changed', handleTaskParentChanged)
})

// 刷新任务数据
const refreshTasks = async () => {
  if (!bookId) return
  
  refreshPinnedIds() // 刷新置顶状态
  await loadBookDetail(bookId, { includeBasic: true, includeTasks: true })
  await initializeTasks(allTasks.value)
}

// 处理下拉刷新（原生下拉）
const handlePullDownRefresh = async () => {
  if (!bookId) return
  
  try {
    console.log('触发下拉刷新')
    
    // 清理评论缓存，确保获取最新数据
    if (virtualTaskListRef.value) {
      console.log('detail.vue handlePullDownRefresh: 清理评论缓存')
      virtualTaskListRef.value.clearCommentCache()
    }
    
    refreshPinnedIds() // 刷新置顶状态
    await refreshTasks()
    
    uni.showToast({
      title: '刷新成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('下拉刷新失败:', error)
    uni.showToast({
      title: '刷新失败，请重试',
      icon: 'none'
    })
  } finally {
    uni.stopPullDownRefresh()
  }
}

// 搜索弹窗处理函数
const handleSearchClick = () => {
  showSearchOverlay.value = true
}

const handleSearchOverlaySearch = (keyword) => {
  setSearchKeyword(keyword)
  showSearchOverlay.value = false
}

const handleSearchOverlayClear = () => {
  setSearchKeyword('')
}

const handleSearchOverlayClose = () => {
  showSearchOverlay.value = false
}

// 滚动处理函数
const handleScroll = (event) => {
  const scrollTop = event.detail.scrollTop
  // 当滚动超过200px时显示返回顶部按钮（大约滚动过BookHeader后）
  showBackToTop.value = scrollTop > 200
}

// 返回顶部函数（直接跳转，无动画）
const scrollToTop = () => {
  if (virtualTaskListRef.value) {
    try {
      const result = virtualTaskListRef.value.scrollToTop()
    } catch (error) {
      console.log('detail.vue: scrollToTop调用出错', JSON.stringify(error, null, 2))
    }
  } else {
    
    // 备用方案：直接操作页面滚动
    uni.pageScrollTo({
      scrollTop: 0,
      duration: 0,
      success: () => {
      },
      fail: (err) => {
        console.log('detail.vue: 备用方案uni.pageScrollTo失败', JSON.stringify(err, null, 2))
      }
    })
  }
}



// 弹窗相关数据
const actionSheetRef = ref(null)

const handleMoreActions = () => {
  actionSheetRef.value?.open()
}

// 处理操作完成事件
const handleActionCompleted = (result) => {
  console.log('操作完成:', result)
  
  // 对于删除操作，需要返回上一页
  if (result.type === 'delete' && result.success) {
    uni.navigateBack()
  }
}

const addTask = () => {
  if (isArchived.value) {
    uni.showToast({
      title: '归档项目册不能添加任务',
      icon: 'none'
    })
    return
  }
  
  uni.navigateTo({
    url: `/pages/tasks/form?bookId=${bookId}`
  })
}

const handleTaskClick = (task) => {
  if (task.subtask_count > 0) {
    // #ifdef MP-WEIXIN
    // 微信小程序专用处理逻辑
    const currentExpanded = task.expanded || false
    console.log(`[MP-WEIXIN] 处理任务点击: ${task.title}`, {
      currentExpanded,
      subtask_count: task.subtask_count,
      hasSubtasks: !!(task.subtasks),
      subtasksLength: task.subtasks?.length || 0
    })
    
    // 切换展开状态
    task.expanded = !currentExpanded
    
    // 强制触发响应式更新
    nextTick(() => {
      console.log(`[MP-WEIXIN] 任务 ${task.title} 展开状态已更新: ${task.expanded}`)
      // 如果展开了但没有子任务数据，尝试重新加载
      if (task.expanded && (!task.subtasks || task.subtasks.length === 0)) {
        console.warn(`[MP-WEIXIN] 任务展开但缺少子任务数据，需要重新加载`)
      }
    })
    // #endif
    
    // #ifndef MP-WEIXIN
    task.expanded = !task.expanded
    // #endif
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
  if (isArchived.value) {
    uni.showToast({
      title: '归档项目册中的任务不能编辑',
      icon: 'none'
    })
    return
  }
  
  uni.navigateTo({
    url: `/pages/tasks/form?id=${task._id}&bookId=${bookId}`
  })
}

const deleteTask = async (task) => {
  if (isArchived.value) {
    uni.showToast({
      title: '归档项目册中的任务不能删除',
      icon: 'none'
    })
    return
  }
  
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

// 处理任务父任务变更事件
const handleTaskParentChanged = async (eventData) => {
  console.log('handleTaskParentChanged: 收到父任务变更事件', JSON.stringify(eventData, null, 2))
  
  // 确保事件是针对当前项目册的
  if (eventData.bookId === bookId) {
    console.log('handleTaskParentChanged: 父任务变更涉及当前项目册，刷新任务列表')
    await refreshTasks()
  }
}

// 注册原生下拉刷新生命周期
onPullDownRefresh(() => {
  handlePullDownRefresh()
})

// 在 <script setup> 中，所有在顶层声明的变量、计算属性和方法都会自动暴露给模板，无需手动 return。
</script>


<style lang="scss" scoped>
@import '@/pages/todobooks/styles/variables.scss';

.detail-page {
  min-height: 100vh;
  background-color: $bg-secondary;
  padding-bottom: $safe-area-bottom;
}

/* 主滚动区域 */
.main-scroll-view {
  flex: 1;
  width: 100%;
}


/* 任务列表包装器 */
.task-list-wrapper {
  flex: 1;
  min-height: 0;
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

</style>