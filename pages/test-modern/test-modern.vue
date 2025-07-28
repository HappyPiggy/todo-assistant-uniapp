<template>
  <view class="modern-test-page">
    <view class="page-header">
      <text class="page-title">Modern 任务样式展示</text>
      <text class="page-subtitle">新的现代化任务卡片设计</text>
    </view>
    
    <view class="style-selector">
      <button 
        class="style-btn"
        :class="{ active: currentStyle === 'card' }"
        @click="switchStyle('card')">
        卡片样式
      </button>
      <button 
        class="style-btn"
        :class="{ active: currentStyle === 'modern' }"
        @click="switchStyle('modern')">
        Modern样式
      </button>
      <button 
        class="style-btn"
        :class="{ active: currentStyle === 'item' }"
        @click="switchStyle('item')">
        列表样式
      </button>
    </view>
    
    <scroll-view class="tasks-container" scroll-y>
      <TaskItem
        v-for="task in sampleTasks"
        :key="task._id"
        :task="task"
        :variant="currentStyle"
        :is-pinned="task.pinned"
        :unread-comment-count="task.unreadComments"
        @click="handleTaskClick"
        @statusToggle="handleStatusToggle"
        @menuClick="handleMenuClick"
      />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import TaskItem from '@/pages/todobooks/components/task/TaskItem.vue'

const currentStyle = ref('modern')

const sampleTasks = ref([
  {
    _id: '1',
    title: '完成项目需求分析文档',
    description: '详细分析用户需求，制定技术方案和开发计划',
    priority: 'urgent',
    status: 'todo',
    due_date: '2024-01-15T10:00:00Z',
    tags: [
      { id: '1', name: '重要', color: '#FF6B6B' },
      { id: '2', name: '文档', color: '#4ECDC4' }
    ],
    subtask_count: 3,
    completed_subtask_count: 1,
    pinned: true,
    unreadComments: 2,
    expanded: false
  },
  {
    _id: '2',
    title: '优化数据库查询性能',
    description: '分析慢查询，优化索引和查询语句',
    priority: 'high',
    status: 'in_progress',
    due_date: '2024-01-20T16:00:00Z',
    tags: [
      { id: '3', name: '性能优化', color: '#45B7D1' },
      { id: '4', name: '数据库', color: '#96CEB4' }
    ],
    subtask_count: 0,
    completed_subtask_count: 0,
    pinned: false,
    unreadComments: 0,
    expanded: false
  },
  {
    _id: '3',
    title: '设计用户界面原型',
    description: '根据需求文档设计界面原型和交互流程',
    priority: 'medium',
    status: 'todo',
    tags: [
      { id: '5', name: 'UI设计', color: '#FFEAA7' },
      { id: '6', name: '原型', color: '#DDA0DD' }
    ],
    subtask_count: 5,
    completed_subtask_count: 2,
    pinned: false,
    unreadComments: 1,
    expanded: false
  },
  {
    _id: '4',
    title: '编写单元测试',
    description: '',
    priority: 'low',
    status: 'completed',
    tags: [
      { id: '7', name: '测试', color: '#98D8C8' }
    ],
    subtask_count: 0,
    completed_subtask_count: 0,
    pinned: false,
    unreadComments: 0,
    expanded: false
  },
  {
    _id: '5',
    title: '部署生产环境',
    description: '配置生产服务器，部署应用并进行测试',
    priority: 'high',
    status: 'todo',
    due_date: '2024-01-25T09:00:00Z',
    tags: [
      { id: '8', name: '部署', color: '#FDA7DF' },
      { id: '9', name: '生产环境', color: '#E17055' },
      { id: '10', name: '服务器', color: '#6C5CE7' }
    ],
    subtask_count: 4,
    completed_subtask_count: 1,
    pinned: false,
    unreadComments: 0,
    expanded: false
  }
])

const switchStyle = (style) => {
  currentStyle.value = style
}

const handleTaskClick = (task) => {
  console.log('点击任务:', task.title)
  uni.showToast({
    title: `点击了任务：${task.title}`,
    icon: 'none'
  })
}

const handleStatusToggle = (task) => {
  console.log('切换状态:', task.title)
  // 模拟状态切换
  const targetTask = sampleTasks.value.find(t => t._id === task._id)
  if (targetTask) {
    targetTask.status = targetTask.status === 'completed' ? 'todo' : 'completed'
  }
}

const handleMenuClick = (task) => {
  console.log('菜单点击:', task.title)
  uni.showActionSheet({
    itemList: ['查看详情', '编辑', '删除', '置顶'],
    success: (res) => {
      const actions = ['查看详情', '编辑', '删除', '置顶']
      uni.showToast({
        title: `${actions[res.tapIndex]}：${task.title}`,
        icon: 'none'
      })
    }
  })
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/variables.scss';
@import '@/pages/todobooks/styles/mixins.scss';

.modern-test-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: $padding-base;
}

.page-header {
  text-align: center;
  margin-bottom: $margin-xl;
  padding-top: $padding-lg;
  
  .page-title {
    display: block;
    font-size: $font-size-xxl;
    font-weight: $font-weight-bold;
    color: white;
    margin-bottom: $margin-sm;
  }
  
  .page-subtitle {
    display: block;
    font-size: $font-size-base;
    color: rgba(255, 255, 255, 0.8);
  }
}

.style-selector {
  @include flex-center;
  gap: $margin-sm;
  margin-bottom: $margin-xl;
  
  .style-btn {
    padding: $padding-sm $padding-base;
    border-radius: $border-radius-large;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-size: $font-size-base;
    border: 1rpx solid rgba(255, 255, 255, 0.3);
    transition: $transition-fast;
    
    &.active {
      background: rgba(255, 255, 255, 0.9);
      color: $text-primary;
      font-weight: $font-weight-semibold;
    }
    
    &:not(.active):active {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.tasks-container {
  height: calc(100vh - 200rpx);
  background: transparent;
}
</style>