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
      ref="scrollViewRef"
      class="virtual-scroll-container"
      :scroll-y="true"
      :scroll-with-animation="true"
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
        @filter-change="handleFilterChange"
        @tag-filter-change="handleTagFilterChange"
      />
      
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
import { defineProps, defineEmits, defineExpose, ref, computed } from 'vue'
import { useVirtualList } from '../composables/useVirtualList.js'
import LoadingState from '../common/LoadingState.vue'
import ErrorState from '../common/ErrorState.vue'
import EmptyState from '../common/EmptyState.vue'
import TaskItem from './TaskItem.vue'
import TaskMenuPopup from './TaskMenuPopup.vue'
import BookHeader from '../book/BookHeader.vue'
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
  getUnreadCommentCount: {
    type: Function,
    required: true
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
  'subtaskTouchEnd',
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
const scrollViewRef = ref(null)

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
  estimatedItemHeight: 150, // 预估任务卡片高度，包含间距和内边距
  overscan: 3, // 预渲染数量，上下各3个缓冲
  fixedHeaderHeight: fixedHeaderHeight
})

// 直接使用虚拟滚动的 scrollTop
const scrollTop = virtualScrollTop

// 监听任务变化，输出调试信息
import { watch } from 'vue'
watch(() => props.tasks.length, (newLength) => {
  if (newLength > 0) {
    console.log('Virtual scroll info:', {
      totalTasks: newLength,
      visibleTasks: visibleTasks.value.length,
      containerHeight: props.containerHeight,
      effectiveHeight: props.containerHeight - fixedHeaderHeight.value,
      estimatedItemsPerPage: Math.floor((props.containerHeight - fixedHeaderHeight.value) / 150)
    })
  }
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
  
  // 向外暴露滚动事件
  emit('scroll', {
    scrollTop: newScrollTop,
    detail: event.detail
  })
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


.visible-tasks {
  padding: 0 $padding-base;
  gap: $margin-sm;
}
</style>