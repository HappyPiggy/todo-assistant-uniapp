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
      <view v-if="filteredTasks.length === 0" class="empty-content">
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
import { useTaskData } from '@/pages/todobooks/composables/useTaskData.js'
import { calculateUnreadCount } from '@/utils/commentUtils.js'
import { currentUserId } from '@/store/storage.js'
import LoadingState from '@/pages/todobooks/components/common/LoadingState.vue'
import ErrorState from '@/pages/todobooks/components/common/ErrorState.vue'
import EmptyState from '@/pages/todobooks/components/common/EmptyState.vue'
import TaskItem from './TaskItem.vue'
import TaskMenuPopup from './TaskMenuPopup.vue'
import BookHeader from '@/pages/todobooks/components/book/BookHeader.vue'
import TaskFilter from './TaskFilter.vue'

const props = defineProps({
  allTasks: {
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
  todorbookId: {
    type: String,
    required: true
  }
})

const emit = defineEmits([
  'retry',
  'addTask',
  'taskClick',
  'delete',
  'subtaskClick',
  // BookHeader 相关事件
  'moreActions',
  'searchClick',
  // 滚动事件
  'scroll'
])

const taskMenuPopup = ref(null)
const currentTask = ref(null)

// 使用 useTaskData 管理筛选逻辑
const {
  activeFilter,
  selectedTags,
  filterTabs,
  availableTags,
  filteredTasks,
  setActiveFilter,
  setSelectedTags,
  toggleTaskStatus,
  toggleSubtaskStatus,
  initializeTasks
} = useTaskData(props.todorbookId, computed(() => props.allTasks))

// 监听 allTasks 变化，初始化任务数据
watch(() => props.allTasks, (newTasks) => {
  if (newTasks && newTasks.length > 0) {
    initializeTasks(newTasks)
  }
}, { immediate: true, deep: true })

// 本地工具函数：获取任务未读评论数量
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
// 未读数缓存
const unreadCountsCache = ref({})

// 计算固定头部高度
const fixedHeaderHeight = computed(() => {
  let height = 0
  if (props.bookData) height += 200 // BookHeader 实际高度更大
  if (filterTabs.value) height += 60 // TaskFilter 实际高度
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
} = useVirtualList(filteredTasks, {
  containerHeight: computed(() => props.containerHeight),
  estimatedItemHeight: 90, // 预估任务卡片高度，包含间距和内边距
  overscan: 5, // 预渲动数量，上下各5个缓冲，提升滚动流畅度
  fixedHeaderHeight: fixedHeaderHeight
})

// 监听可见任务变化，为首次可见的任务加载未读数
watch(visibleTasks, (newVisibleTasks) => {
  newVisibleTasks.forEach(task => {
    if (!loadedTaskIds.value.has(task._id)) {
      // 首次可见，调用加载函数
      loadedTaskIds.value.add(task._id)
      const count = getUnreadCommentCount(task)
      unreadCountsCache.value[task._id] = count
    }
  })
}, { immediate: true, deep: true })

// 用于模板的未读数映射
const unreadCountsMap = computed(() => {
  return unreadCountsCache.value
})

// 直接使用虚拟滚动的 scrollTop
const scrollTop = virtualScrollTop


const emptyText = computed(() => {
  const map = {
    all: '还没有任务，创建第一个吧',
    todo: '没有待办任务',
    completed: '还没有完成的任务'
  }
  return map[activeFilter.value] || '暂无数据'
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
  toggleTaskStatus(task)
}

const handleMenuClick = (task) => {
  currentTask.value = task
  taskMenuPopup.value?.open()
}

const handleViewDetail = (task) => {
  uni.navigateTo({
    url: `/pages/tasks/detail?id=${task._id}&bookId=${props.todorbookId}`
  })
}

const handleEdit = (task) => {
  uni.navigateTo({
    url: `/pages/tasks/form?id=${task._id}&bookId=${props.todorbookId}`
  })
}

const handleDelete = async (task) => {
  let content = '确定要删除这个任务吗？'
  if (task.subtask_count > 0) {
    content = `此任务包含 ${task.subtask_count} 个子任务，删除后所有子任务也将被删除。确定要继续吗？`
  }
  
  uni.showModal({
    title: '确认删除',
    content: content,
    success: async (res) => {
      if (res.confirm) {
        emit('delete', task)
      }
    }
  })
}

const handleMenuCancel = () => {
  currentTask.value = null
}

const handleSubtaskStatusToggle = (subtask) => {
  toggleSubtaskStatus(subtask)
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
  setActiveFilter(filter)
}

const handleTagFilterChange = (tags) => {
  setSelectedTags(tags)
}

// 自定义滚动到顶部方法
const customScrollToTop = () => {
  return virtualScrollToTop()
}


// 暴露滚动控制方法
defineExpose({
  scrollToTop: customScrollToTop,
  scrollToBottom,
  scrollToIndex
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