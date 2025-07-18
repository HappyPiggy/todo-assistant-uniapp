<template>
  <view class="virtual-test-page">
    <view class="test-header">
      <text class="test-title">虚拟滚动性能测试</text>
      <view class="test-info">
        <text>总任务数: {{ totalTasks }}</text>
        <text>可见任务数: {{ visibleTasksCount }}</text>
        <text>滚动位置: {{ Math.round(scrollPosition) }}px</text>
      </view>
      <view class="test-controls">
        <button @click="generateTasks(100)" size="mini">生成100个任务</button>
        <button @click="generateTasks(500)" size="mini" type="primary">生成500个任务</button>
        <button @click="generateTasks(1000)" size="mini" type="warn">生成1000个任务</button>
        <button @click="clearTasks" size="mini" type="default">清空任务</button>
      </view>
    </view>
    
    <VirtualTaskList
      :tasks="testTasks"
      :loading="false"
      :error="null"
      :active-filter="'all'"
      :get-unread-comment-count="getUnreadCommentCount"
      :container-height="500"
      @task-click="handleTaskClick"
      @status-toggle="handleStatusToggle"
    />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import VirtualTaskList from './VirtualTaskList.vue'

const testTasks = ref([])
const scrollPosition = ref(0)

const totalTasks = computed(() => testTasks.value.length)
const visibleTasksCount = computed(() => {
  // 估算可见任务数量（容器高度500px，平均任务高度120px）
  return Math.min(Math.ceil(500 / 120) + 3, totalTasks.value)
})

// 生成测试任务
const generateTasks = (count) => {
  console.log(`生成 ${count} 个测试任务...`)
  const tasks = []
  
  for (let i = 1; i <= count; i++) {
    const hasSubtasks = i % 5 === 0 // 每5个任务有一个包含子任务
    const subtaskCount = hasSubtasks ? Math.floor(Math.random() * 5) + 1 : 0
    
    const task = {
      _id: `test-task-${i}`,
      title: `测试任务 ${i} - ${getRandomTaskTitle()}`,
      description: i % 3 === 0 ? `这是第${i}个测试任务的详细描述，用于测试长文本的显示效果。` : null,
      status: getRandomStatus(),
      priority: getRandomPriority(),
      due_date: i % 4 === 0 ? getRandomDate() : null,
      tags: i % 3 === 0 ? getRandomTags() : [],
      subtask_count: subtaskCount,
      completed_subtask_count: hasSubtasks ? Math.floor(Math.random() * subtaskCount) : 0,
      expanded: false,
      subtasks: hasSubtasks ? generateSubtasks(i, subtaskCount) : [],
      comments: [],
      created_at: new Date().toISOString()
    }
    
    tasks.push(task)
  }
  
  testTasks.value = tasks
  console.log(`成功生成 ${count} 个测试任务`)
}

// 生成子任务
const generateSubtasks = (parentIndex, count) => {
  const subtasks = []
  for (let j = 1; j <= count; j++) {
    subtasks.push({
      _id: `test-subtask-${parentIndex}-${j}`,
      title: `子任务 ${parentIndex}.${j}`,
      description: null,
      status: getRandomStatus(),
      priority: 'medium',
      parent_id: `test-task-${parentIndex}`,
      comments: []
    })
  }
  return subtasks
}

// 随机任务标题
const getRandomTaskTitle = () => {
  const titles = [
    '完成项目需求分析',
    '设计用户界面原型',
    '实现核心功能模块',
    '编写单元测试用例',
    '优化系统性能',
    '修复已知bug',
    '更新技术文档',
    'Code Review',
    '部署到测试环境',
    '收集用户反馈'
  ]
  return titles[Math.floor(Math.random() * titles.length)]
}

// 随机状态
const getRandomStatus = () => {
  const statuses = ['todo', 'in_progress', 'completed']
  return statuses[Math.floor(Math.random() * statuses.length)]
}

// 随机优先级
const getRandomPriority = () => {
  const priorities = ['low', 'medium', 'high', 'urgent']
  return priorities[Math.floor(Math.random() * priorities.length)]
}

// 随机日期
const getRandomDate = () => {
  const now = new Date()
  const randomDays = Math.floor(Math.random() * 30) - 15 // -15到+15天
  const date = new Date(now.getTime() + randomDays * 24 * 60 * 60 * 1000)
  return date.toISOString()
}

// 随机标签
const getRandomTags = () => {
  const allTags = [
    { id: '1', name: '紧急', color: '#ff4757' },
    { id: '2', name: '重要', color: '#ffa502' },
    { id: '3', name: '前端', color: '#3742fa' },
    { id: '4', name: '后端', color: '#2ed573' },
    { id: '5', name: '测试', color: '#ff6b35' },
    { id: '6', name: '文档', color: '#a4b0be' }
  ]
  
  const count = Math.floor(Math.random() * 3) + 1 // 1-3个标签
  const shuffled = [...allTags].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// 清空任务
const clearTasks = () => {
  testTasks.value = []
  console.log('已清空所有测试任务')
}

// 事件处理
const handleTaskClick = (task) => {
  console.log('点击任务:', task.title)
  if (task.subtask_count > 0) {
    task.expanded = !task.expanded
  }
}

const handleStatusToggle = (task) => {
  console.log('切换任务状态:', task.title)
  task.status = task.status === 'completed' ? 'todo' : 'completed'
}

const getUnreadCommentCount = () => {
  return Math.floor(Math.random() * 5) // 随机未读评论数
}

// 初始化时生成一些测试数据
generateTasks(50)
</script>

<style lang="scss" scoped>
.virtual-test-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.test-header {
  background-color: #fff;
  padding: 20rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.test-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.test-info {
  display: flex;
  gap: 30rpx;
  margin-bottom: 20rpx;
  
  text {
    font-size: 24rpx;
    color: #666;
  }
}

.test-controls {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}
</style>