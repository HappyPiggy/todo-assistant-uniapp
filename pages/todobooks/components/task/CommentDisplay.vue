<template>
  <view class="comment-display-test">
    <text class="test-title">评论显示改进功能测试</text>
    
    <!-- 测试场景1: 有评论且有未读 -->
    <view class="test-section">
      <text class="section-title">场景1: 有评论且有未读</text>
      <TaskItem
        :task="taskWithCommentsAndUnread"
        :variant="'card'"
        :unreadCommentCount="3"
      />
    </view>

    <!-- 测试场景2: 有评论但无未读 -->
    <view class="test-section">
      <text class="section-title">场景2: 有评论但无未读</text>
      <TaskItem
        :task="taskWithCommentsNoUnread"
        :variant="'card'"
        :unreadCommentCount="0"
      />
    </view>

    <!-- 测试场景3: 无评论 -->
    <view class="test-section">
      <text class="section-title">场景3: 无评论</text>
      <TaskItem
        :task="taskWithoutComments"
        :variant="'card'"
        :unreadCommentCount="0"
      />
    </view>

    <!-- 测试场景4: item模式 -->
    <view class="test-section">
      <text class="section-title">场景4: item模式有评论和未读</text>
      <TaskItem
        :task="taskWithCommentsAndUnread"
        :variant="'item'"
        :unreadCommentCount="2"
      />
    </view>
  </view>
</template>

<script setup>
import TaskItem from './TaskItem.vue'

// 测试数据
const taskWithCommentsAndUnread = {
  _id: 'test1',
  title: '测试任务 - 有评论有未读',
  description: '这是一个测试任务',
  status: 'todo',
  priority: 'medium',
  comments: [
    { _id: 'c1', content: '评论1', user_id: 'u1', created_at: '2024-01-01T00:00:00Z' },
    { _id: 'c2', content: '评论2', user_id: 'u2', created_at: '2024-01-02T00:00:00Z' },
    { _id: 'c3', content: '评论3', user_id: 'u3', created_at: '2024-01-03T00:00:00Z' },
    { _id: 'c4', content: '评论4', user_id: 'u1', created_at: '2024-01-04T00:00:00Z' },
    { _id: 'c5', content: '评论5', user_id: 'u2', created_at: '2024-01-05T00:00:00Z' }
  ]
}

const taskWithCommentsNoUnread = {
  _id: 'test2', 
  title: '测试任务 - 有评论无未读',
  description: '这是另一个测试任务',
  status: 'in_progress',
  priority: 'high',
  comments: [
    { _id: 'c6', content: '评论6', user_id: 'u1', created_at: '2024-01-01T00:00:00Z' },
    { _id: 'c7', content: '评论7', user_id: 'u2', created_at: '2024-01-02T00:00:00Z' }
  ]
}

const taskWithoutComments = {
  _id: 'test3',
  title: '测试任务 - 无评论',
  description: '这个任务没有评论',
  status: 'completed',
  priority: 'low',
  comments: []
}
</script>

<style lang="scss" scoped>
.comment-display-test {
  padding: 20rpx;
}

.test-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  color: #333;
}

.test-section {
  margin-bottom: 40rpx;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 500;
  margin-bottom: 20rpx;
  color: #666;
}
</style>