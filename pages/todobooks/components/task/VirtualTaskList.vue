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
      :bounces="false"
      :scroll-top="scrollTop"
      @scroll="handleScroll"
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
import { defineProps, defineEmits, defineExpose, ref, computed, watch } from 'vue'
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
  'scroll'
])

const taskMenuPopup = ref(null)
const currentTask = ref(null)

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

// 监听可见任务变化，实现按需加载评论数据
watch(visibleTasks, async (newVisibleTasks) => {
  console.log(`👀 VirtualTaskList: 可见任务变化，当前可见 ${newVisibleTasks.length} 个任务`)
  
  for (const task of newVisibleTasks) {
    // 多重检查：已处理的任务 OR 已有缓存的任务 OR 正在加载的任务
    if (!loadedTaskIds.value.has(task._id) && 
        !commentCache.hasCached(task._id) && 
        !commentCache.loadingTasks.value.has(task._id)) {
      
      // 标记为已处理，避免重复加载
      loadedTaskIds.value.add(task._id)
      console.log(`🔄 VirtualTaskList: 开始处理任务 ${task._id} (${task.title?.substring(0, 20)}...)`)
      
      try {
        // 使用智能加载：优先缓存，缓存不存在则异步加载
        const hasImmediate = await commentCache.smartLoadComments(
          task._id, 
          props.tasks,
          (taskId, commentData) => {
            // 加载完成回调：更新未读数缓存
            const unreadCount = commentCache.getTaskUnreadCount(taskId, task, currentUserId.value, true)
            unreadCountsCache.value[taskId] = unreadCount
            console.log(`任务 ${taskId} 评论按需加载完成，未读数量: ${unreadCount}`)
          }
        )
        
        // 如果立即有可用数据，更新未读数
        if (hasImmediate) {
          const unreadCount = commentCache.getTaskUnreadCount(task._id, task, currentUserId.value, true)
          unreadCountsCache.value[task._id] = unreadCount
        } else {
          // 暂时设置为0，等待异步加载完成
          unreadCountsCache.value[task._id] = 0
        }
        
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

// 直接使用虚拟滚动的 scrollTop
const scrollTop = virtualScrollTop


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
  return virtualScrollToTop()
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