<template>
  <view class="debug-page">
    <view class="debug-header">
      <text class="debug-title">虚拟滚动调试页面</text>
      <view class="debug-info">
        <text>任务总数: {{ tasks.length }}</text>
        <text>可见范围: {{ visibleRange.start }} - {{ visibleRange.end }}</text>
        <text>滚动位置: {{ Math.round(scrollTop) }}px</text>
      </view>
      <view class="debug-controls">
        <button @click="generateTasks" size="mini" type="primary">生成测试任务</button>
        <button @click="scrollToTop" size="mini">回到顶部</button>
        <button @click="scrollToBottom" size="mini">滚动到底部</button>
      </view>
    </view>
    
    <VirtualTaskList
      :tasks="tasks"
      :loading="false"
      :error="null"
      :active-filter="'all'"
      :get-unread-comment-count="getUnreadCommentCount"
      :container-height="containerHeight"
      @task-click="handleTaskClick"
      @status-toggle="handleStatusToggle"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import VirtualTaskList from './components/task/VirtualTaskList.vue'

const tasks = ref([])
const containerHeight = ref(500)
const scrollTop = ref(0)
const visibleRange = ref({ start: 0, end: 0 })

onMounted(() => {
  uni.getSystemInfo({
    success: (res) => {
      containerHeight.value = res.windowHeight - 200
    }
  })
  generateTasks()
})

const generateTasks = () => {
  const testTasks = []
  for (let i = 1; i <= 200; i++) {
    testTasks.push({
      _id: `debug-task-${i}`,
      title: `调试任务 ${i}`,
      description: i % 3 === 0 ? `这是第${i}个调试任务的描述` : null,
      status: i % 4 === 0 ? 'completed' : 'todo',
      priority: ['low', 'medium', 'high'][i % 3],
      tags: i % 2 === 0 ? [{ name: '测试', color: '#007AFF' }] : [],
      subtask_count: i % 5 === 0 ? 3 : 0,
      completed_subtask_count: i % 5 === 0 ? 1 : 0,
      expanded: false,
      subtasks: [],
      comments: [],
      due_date: null
    })
  }
  tasks.value = testTasks
  console.log('生成了200个测试任务')
}

const getUnreadCommentCount = () => 0

const handleTaskClick = (task) => {
  console.log('点击任务:', task.title)
}

const handleStatusToggle = (task) => {
  task.status = task.status === 'completed' ? 'todo' : 'completed'
  console.log('切换状态:', task.title, task.status)
}

const scrollToTop = () => {
  console.log('滚动到顶部')
}

const scrollToBottom = () => {
  console.log('滚动到底部')
}
</script>

<style lang="scss" scoped>
.debug-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.debug-header {
  background-color: #fff;
  padding: 20rpx;
  border-bottom: 1rpx solid #e0e0e0;
  flex-shrink: 0;
}

.debug-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.debug-info {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 20rpx;
  
  text {
    font-size: 24rpx;
    color: #666;
  }
}

.debug-controls {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}
</style>