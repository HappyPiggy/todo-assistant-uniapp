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
        :current-sort="currentSort"
        :todorbook-id="todorbookId"
        @filter-change="handleFilterChange"
        @tag-filter-change="handleTagFilterChange"
        @sort-change="handleSortChange"
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
            :is-pinned="isPinned(task._id)"
            :is-archived="isArchived"
            :can-edit="canEdit"
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
      :is-pinned="isPinned(currentTask?._id)"
      :is-archived="isArchived"
      :can-edit="canEdit"
      @view-detail="handleViewDetail"
      @edit="handleEdit"
      @delete="handleDelete"
      @toggle-pin="handleTogglePin"
      @cancel="handleMenuCancel"
    />
  </view>
</template>

<script setup>
import { defineProps, defineEmits, defineExpose, ref, computed, nextTick } from 'vue'
import { useVirtualList } from '@/pages/todobooks/composables/useVirtualList.js'
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
  currentSort: {
    type: Object,
    default: () => ({ field: 'created_at', order: 'desc' })
  },
  todorbookId: {
    type: String,
    required: true
  },
  // 置顶功能相关
  isPinned: {
    type: Function,
    default: () => false
  },
  togglePin: {
    type: Function,
    default: () => {}
  },
  // 归档状态相关
  isArchived: {
    type: Boolean,
    default: false
  },
  canEdit: {
    type: Boolean,
    default: true
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
  'sortChange',
  // 滚动事件
  'scroll',
  // 下拉刷新事件
  'refresh'
])

const taskMenuPopup = ref(null)
const currentTask = ref(null)

// 滚动配置：直接关闭 bounces 以解决抖动问题
const scrollConfig = ref({
  bounces: false // 关闭弹性效果，防止抖动
})


// 计算固定头部高度
const fixedHeaderHeight = computed(() => {
  let height = 0
  if (props.bookData) height += 200 // BookHeader 实际高度更大
  if (props.filterTabs) height += 65 // TaskFilter 实际高度（压缩后）
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

const handleTogglePin = (task) => {
  props.togglePin(task._id)
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

const handleSortChange = (sortOption) => {
  console.log('VirtualTaskList: 排序变更', sortOption)
  emit('sortChange', sortOption)
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