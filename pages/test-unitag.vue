<template>
  <view class="test-page">
    <view class="header">
      <text class="title">UniTag 组件测试</text>
    </view>
    
    <!-- 基础尺寸测试 -->
    <view class="section">
      <text class="section-title">尺寸测试</text>
      <view class="tags-row">
        <UniTag text="Small" size="small" color="#007AFF" />
        <UniTag text="Medium" size="medium" color="#28a745" />
        <UniTag text="Large" size="large" color="#ff9800" />
      </view>
    </view>
    
    <!-- 颜色测试 -->
    <view class="section">
      <text class="section-title">颜色测试</text>
      <view class="tags-row">
        <UniTag text="蓝色" color="#007AFF" />
        <UniTag text="绿色" color="#28a745" />
        <UniTag text="橙色" color="#ff9800" />
        <UniTag text="红色" color="#FF4757" />
        <UniTag text="紫色" color="#AF52DE" />
      </view>
    </view>
    
    <!-- 文本截断测试 -->
    <view class="section">
      <text class="section-title">文本截断测试</text>
      <view class="tags-row">
        <UniTag text="短文本" color="#007AFF" />
        <UniTag text="这是一个很长的标签文本" color="#28a745" />
        <UniTag text="超长文本测试标签" color="#ff9800" :maxLength="8" />
      </view>
    </view>
    
    <!-- 点击事件测试 -->
    <view class="section">
      <text class="section-title">点击事件测试</text>
      <view class="tags-row">
        <UniTag text="点击我" color="#007AFF" @click="handleTagClick" />
        <UniTag text="禁用状态" color="#999999" :disabled="true" @click="handleTagClick" />
      </view>
      <text class="click-info">{{ clickInfo }}</text>
    </view>
    
    <!-- 插槽测试 -->
    <view class="section">
      <text class="section-title">插槽测试</text>
      <view class="tags-row">
        <UniTag color="#ff9800">
          <template #icon>
            <uni-icons color="#ffffff" size="12" type="star" />
          </template>
          带图标
        </UniTag>
        
        <UniTag color="#17a2b8">
          <view class="custom-content">
            <text>自定义</text>
            <text class="count">(3)</text>
          </view>
        </UniTag>
      </view>
    </view>
    
    <!-- 实际使用场景模拟 -->
    <view class="section">
      <text class="section-title">实际场景模拟</text>
      <view class="mock-task">
        <text class="task-title">完成项目文档编写</text>
        <view class="task-tags">
          <UniTag text="紧急" color="#FF4757" size="small" />
          <UniTag text="文档" color="#007AFF" size="small" />
          <UniTag text="工作" color="#28a745" size="small" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import UniTag from '@/pages/todobooks/components/common/UniTag.vue'

const clickInfo = ref('点击标签查看效果')

const handleTagClick = (event) => {
  clickInfo.value = `标签被点击了! 时间: ${new Date().toLocaleTimeString()}`
  console.log('Tag clicked:', event)
}
</script>

<style lang="scss" scoped>
.test-page {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
  
  .title {
    font-size: 36rpx;
    font-weight: 600;
    color: #333333;
  }
}

.section {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  
  .section-title {
    font-size: 28rpx;
    font-weight: 500;
    color: #333333;
    margin-bottom: 20rpx;
    display: block;
  }
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  align-items: center;
}

.click-info {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #666666;
  display: block;
}

.custom-content {
  display: flex;
  align-items: center;
  gap: 4rpx;
  
  .count {
    opacity: 0.8;
    font-size: 0.9em;
  }
}

.mock-task {
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 20rpx;
  background-color: #fafafa;
  
  .task-title {
    font-size: 28rpx;
    color: #333333;
    margin-bottom: 12rpx;
    display: block;
  }
  
  .task-tags {
    display: flex;
    gap: 8rpx;
    flex-wrap: wrap;
  }
}
</style>