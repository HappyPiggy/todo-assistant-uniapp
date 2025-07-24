<template>
  <view class="virtual-task-list">
    <!-- 加载状态 -->
    <LoadingState v-if="loading" />
    
    <!-- 错误状态 -->
    <ErrorState 
      v-else-if="error" 
      :message="error"
      @retry="handleRetry" />
    
    
    <!-- 虚拟滚动容器 -->
    <scroll-view
      v-else
      ref="scrollViewRef"
      class="virtual-scroll-container"
      :scroll-y="true"
      :scroll-with-animation="false"
      :enhanced="true"
      :enable-flex="true"
      :bounces="scrollConfig.bounces"
      :refresher-enabled="scrollConfig.refresherEnabled"
      :refresher-triggered="refreshing"
      :refresher-threshold="scrollConfig.refresherThreshold"
      :refresher-default-style="'black'"
      :scroll-top="scrollTop"
      @scroll="handleScroll"
      @refresherrefresh="handleRefresh"
      @refresherrestore="handleRefreshRestore"
      :style="{ height: containerHeight + 'px' }">
      
      <!-- 项目册头部信息 -->
      <BookHeader
        v-if="bookData"
        :book-data="bookData"
        :overall-progress="overallProgress"
        :task-stats="taskStats"
        :member-count="memberCount"
        @more-actions="handleMoreActions"
        @search-click="handleSearchClick"
      />
      
      <!-- 任务筛选标签 -->
      <TaskFilter
        v-if="filterTabs"
        :filter-tabs="filterTabs"
        :active-filter="activeFilter"
        :available-tags="availableTags"
        :selected-tags="selectedTags"
        :todorbook-id="todorbookId"
        @filter-change="handleFilterChange"
        @tag-filter-change="handleTagFilterChange"
      />
      
      <!-- 任务列表内容区域 -->
      <view v-if="tasks.length === 0" class="empty-content">
        <EmptyState 
          :title="emptyText"
          :show-action="activeFilter === 'all'"
          action-text="创建第一个任务"
          @action="handleAddTask" />
      </view>
      <view v-else class="tasks-content">
        <!-- 上边距占位 -->
        <view :style="{ height: offsetTop + 'px' }"></view>
        
        <!-- 可见任务列表 -->
        <view class="visible-tasks">
          <TaskItem
            v-for="(task, index) in visibleTasks"
            :key="task._id"
            :task="task"
            :variant="'card'"
            :unreadCommentCount="unreadCountsMap[task._id]"
            @click="handleTaskClick"
            @statusToggle="handleStatusToggle"
            @menuClick="handleMenuClick"
            @subtaskStatusToggle="handleSubtaskStatusToggle"
            @subtaskMenuClick="handleSubtaskMenuClick"
            @subtaskClick="handleSubtaskClick"
          />
        </view>
        
        <!-- 下边距占位 -->
        <view :style="{ height: offsetBottom + 'px' }"></view>
      </view>
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
import { defineProps, defineEmits, defineExpose, ref, computed, watch, nextTick } from 'vue'
import { useVirtualList } from '@/pages/todobooks/composables/useVirtualList.js'
import { calculateUnreadCount } from '@/utils/commentUtils.js'
import { currentUserId } from '@/store/storage.js'
import { getGlobalCommentCache } from '@/pages/todobooks/composables/useTaskCommentCache.js'
import LoadingState from '@/pages/todobooks/components/common/LoadingState.vue'
import ErrorState from '@/pages/todobooks/components/common/ErrorState.vue'
import EmptyState from '@/pages/todobooks/components/common/EmptyState.vue'
import TaskItem from './TaskItem.vue'
import TaskMenuPopup from './TaskMenuPopup.vue'
import BookHeader from '@/pages/todobooks/components/book/BookHeader.vue'
import TaskFilter from './TaskFilter.vue'

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
  containerHeight: {
    type: Number,
    default: 600
  },
  // BookHeader 相关属性
  bookData: {
    type: Object,
    default: null
  },
  overallProgress: {
    type: Number,
    default: 0
  },
  taskStats: {
    type: Object,
    default: () => ({ total: 0, completed: 0, todo: 0 })
  },
  memberCount: {
    type: Number,
    default: 0
  },
  // TaskFilter 相关属性
  filterTabs: {
    type: Array,
    default: null
  },
  availableTags: {
    type: Array,
    default: () => []
  },
  selectedTags: {
    type: Array,
    default: () => []
  },
  todorbookId: {
    type: String,
    required: true
  },
  // 下拉刷新相关属性
  refreshing: {
    type: Boolean,
    default: false
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
  // BookHeader 相关事件
  'moreActions',
  'searchClick',
  // TaskFilter 相关事件
  'filterChange',
  'tagFilterChange',
  // 滚动事件
  'scroll',
  // 下拉刷新事件
  'refresh'
])

const taskMenuPopup = ref(null)
const currentTask = ref(null)

// 滚动配置：直接关闭 bounces 以解决抖动问题
const scrollConfig = ref({
  bounces: false, // 关闭弹性效果，防止抖动
  refresherEnabled: true, // 保持刷新功能
  refresherThreshold: 45 // 刷新阈值
})

// 获取全局评论缓存实例
const commentCache = getGlobalCommentCache()

// 本地工具函数：获取任务未读评论数量（兼容原有逻辑）
const getUnreadCommentCount = (task) => {
  try {
    if (!task || !task.comments) return 0
    return calculateUnreadCount(task._id, task.comments, currentUserId.value)
  } catch (error) {
    console.error('获取未读评论数量失败:', error)
    return 0
  }
}

// 已加载过未读数的任务ID集合
const loadedTaskIds = ref(new Set())
// 未读数缓存（保持兼容性）
const unreadCountsCache = ref({})

// 计算固定头部高度
const fixedHeaderHeight = computed(() => {
  let height = 0
  if (props.bookData) height += 200 // BookHeader 实际高度更大
  if (props.filterTabs) height += 60 // TaskFilter 实际高度
  return height
})

// 使用虚拟滚动组合函数
const {
  visibleTasks,
  offsetTop,
  offsetBottom,
  handleScroll: onScroll,
  updateItemHeight,
  scrollToIndex,
  scrollToTop: virtualScrollToTop,
  scrollToBottom,
  getDebugInfo,
  scrollTop: virtualScrollTop
} = useVirtualList(computed(() => props.tasks), {
  containerHeight: computed(() => props.containerHeight),
  estimatedItemHeight: 90, // 预估任务卡片高度，包含间距和内边距
  overscan: 5, // 预渲动数量，上下各5个缓冲，提升滚动流畅度
  fixedHeaderHeight: fixedHeaderHeight
})

// 监听可见任务变化，实现按需加载评论数据（优化版：批量静默加载）
watch(visibleTasks, async (newVisibleTasks) => {
  const needLoadTasks = []
  
  // 第一步：筛选需要加载的任务
  for (const task of newVisibleTasks) {
    // 跳过临时任务（以temp_开头的ID）
    if (task._id && task._id.startsWith('temp_')) {
      continue
    }
    
    // 多重检查：已处理的任务 OR 已有缓存的任务 OR 正在加载的任务
    if (!loadedTaskIds.value.has(task._id) && 
        !commentCache.hasCached(task._id) && 
        !commentCache.loadingTasks.value.has(task._id)) {
      
      // 标记为已处理，避免重复加载
      loadedTaskIds.value.add(task._id)
      needLoadTasks.push(task)
      
      // 立即设置为0，避免显示undefined
      unreadCountsCache.value[task._id] = 0
    }
    
    // 对于已有缓存的任务，立即更新未读数
    if (commentCache.hasCached(task._id)) {
      const unreadCount = commentCache.getTaskUnreadCount(task._id, task, currentUserId.value, true)
      unreadCountsCache.value[task._id] = unreadCount
    }
  }

  // 第二步：批量静默加载需要的评论数据
  if (needLoadTasks.length > 0) {
    
    for (const task of needLoadTasks) {
      try {
        // 使用智能加载的静默模式：不显示加载提示，批量合并请求
        await commentCache.smartLoadComments(
          task._id, 
          props.tasks,
          (taskId, commentData) => {
            // 加载完成回调：更新未读数缓存
            const unreadCount = commentCache.getTaskUnreadCount(taskId, task, currentUserId.value, true)
            unreadCountsCache.value[taskId] = unreadCount
          },
          true // 启用静默模式
        )
      } catch (error) {
        console.error(`任务 ${task._id} 评论加载失败:`, error)
        
        // 降级处理：使用原有逻辑
        if (task.comments) {
          const count = getUnreadCommentCount(task)
          unreadCountsCache.value[task._id] = count
        } else {
          unreadCountsCache.value[task._id] = 0
        }
      }
    }
  }
}, { immediate: true, deep: true })

// 优化的未读数映射计算 - 修复递归问题
const unreadCountsMap = computed(() => {
  const result = {}
  
  // 遍历所有可见任务
  visibleTasks.value.forEach(task => {
    const taskId = task._id
    
    // 优先使用本地缓存的未读数（避免重复计算）
    if (unreadCountsCache.value[taskId] !== undefined) {
      result[taskId] = unreadCountsCache.value[taskId]
    }
    // 回退到原有逻辑（如果任务已有评论数据）
    else if (task.comments) {
      result[taskId] = getUnreadCommentCount(task)
    }
    // 默认为0
    else {
      result[taskId] = 0
    }
  })
  
  return result
})

// 独立的滚动位置管理，用于程序化滚动（如 scrollToTop）
// 不直接绑定 virtualScrollTop 以避免滚动冲突
const scrollTop = ref(0)


const emptyText = computed(() => {
  const map = {
    all: '还没有任务，创建第一个吧',
    todo: '没有待办任务',
    completed: '还没有完成的任务'
  }
  return map[props.activeFilter] || '暂无数据'
})

// 滚动事件节流
let scrollTimer = null

// 处理滚动事件
const handleScroll = (event) => {
  const { scrollTop: newScrollTop } = event.detail
  onScroll(event)
  
  // 节流处理滚动事件向外暴露
  if (scrollTimer) {
    clearTimeout(scrollTimer)
  }
  scrollTimer = setTimeout(() => {
    emit('scroll', {
      scrollTop: newScrollTop,
      detail: event.detail
    })
  }, 16) // 约60fps
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


// BookHeader 事件处理
const handleMoreActions = () => {
  emit('moreActions')
}

const handleSearchClick = () => {
  emit('searchClick')
}

// TaskFilter 事件处理
const handleFilterChange = (filter) => {
  emit('filterChange', filter)
}

const handleTagFilterChange = (tags) => {
  emit('tagFilterChange', tags)
}

// 自定义滚动到顶部方法
const customScrollToTop = () => {
  console.log('VirtualTaskList: customScrollToTop 被调用')
  
  // 方案1：先尝试直接设置
  scrollTop.value = 0
  
  // 方案2：如果直接设置不生效，使用强制刷新
  nextTick(() => {
    // 强制触发scroll-view的更新
    const currentValue = scrollTop.value
    scrollTop.value = currentValue + 1
    nextTick(() => {
      scrollTop.value = 0
      console.log('VirtualTaskList: scrollTop设置为0')
    })
  })
  
  // 同时调用虚拟滚动的方法以同步内部状态
  virtualScrollToTop()
  
  return Promise.resolve()
}

// 清理评论缓存（供外部调用）
const clearCommentCache = () => {
  // 清理全局缓存
  commentCache.clearCache()
  
  // 清理本地状态
  loadedTaskIds.value.clear()
  unreadCountsCache.value = {}
  
  console.log('VirtualTaskList: 已清理所有评论缓存')
}

// 清理指定任务的缓存
const clearTaskCommentCache = (taskId) => {
  if (!taskId) return
  
  // 清理全局缓存
  commentCache.clearTaskCache(taskId)
  
  // 清理本地状态
  loadedTaskIds.value.delete(taskId)
  delete unreadCountsCache.value[taskId]
  
  console.log(`VirtualTaskList: 已清理任务 ${taskId} 的评论缓存`)
}

// 下拉刷新事件处理
const handleRefresh = () => {
  console.log('VirtualTaskList: 下拉刷新触发')
  emit('refresh')
}

const handleRefreshRestore = () => {
  console.log('VirtualTaskList: 下拉刷新完成')
}

// 暴露滚动控制方法和缓存管理方法
defineExpose({
  scrollToTop: customScrollToTop,
  scrollToBottom,
  scrollToIndex,
  clearCommentCache,
  clearTaskCommentCache
})
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


.empty-content {
  padding: $padding-lg $padding-base;
  min-height: 300rpx;
}

.tasks-content {
  flex: 1;
}

.visible-tasks {
  padding: 0 $padding-base;
  gap: $margin-sm;
}
</style>