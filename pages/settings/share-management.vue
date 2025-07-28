<template>
  <view class="share-management">
    <!-- 页面标题 -->
    <uni-nav-bar 
      title="分享管理" 
      left-icon="back" 
      @clickLeft="goBack"
      background-color="#ffffff"
      status-bar
    />

    <scroll-view 
      scroll-y 
      class="content-scroll"
      :style="{ height: scrollHeight + 'px' }"
    >
      <!-- 导入分享区域 -->
      <view class="section">
        <view class="section-header">
          <uni-icons color="#007AFF" size="20" type="download" />
          <text class="section-title">导入项目册</text>
        </view>
        <view class="section-content">
          <ImportShare @import-success="handleImportSuccess" />
        </view>
      </view>

      <!-- 我的分享区域 -->
      <view class="section">
        <view class="section-header">
          <uni-icons color="#28a745" size="20" type="redo" />
          <text class="section-title">我的分享</text>
          <text class="share-count">({{ myShares.length }}/2)</text>
        </view>
        <view class="section-content">
          <ShareList 
            :shares="myShares" 
            :loading="loading"
            @delete="handleDeleteShare"
            @refresh="loadShares"
          />
        </view>
      </view>

      <!-- 使用说明 -->
      <view class="section">
        <view class="section-header">
          <uni-icons color="#6c757d" size="20" type="help" />
          <text class="section-title">使用说明</text>
        </view>
        <view class="section-content">
          <view class="help-content">
            <view class="help-item">
              <text class="help-title">关于分享</text>
              <text class="help-desc">• 每个用户最多同时分享2个项目册</text>
              <text class="help-desc">• 分享码永久有效，直到主动删除</text>
              <text class="help-desc">• 分享的是项目册结构快照，不会实时同步</text>
            </view>
            <view class="help-item">
              <text class="help-title">关于导入</text>
              <text class="help-desc">• 导入的项目册与原项目册完全独立</text>
              <text class="help-desc">• 所有任务状态会重置为"未完成"</text>
              <text class="help-desc">• 导入后您将成为新项目册的拥有者</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

import ShareList from './components/ShareList.vue'
import ImportShare from './components/ImportShare.vue'
import { useShareData } from './composables/useShareData.js'

// 组合式函数
const { myShares, shareLoading, loadMyShares } = useShareData()

// 使用shareLoading作为加载状态
const loading = shareLoading

// 响应式数据
const scrollHeight = ref(0)

// 计算属性
const computedScrollHeight = computed(() => {
  const systemInfo = uni.getSystemInfoSync()
  // 获取更准确的导航栏高度
  const statusBarHeight = systemInfo.statusBarHeight || 0
  const navBarHeight = 44 + statusBarHeight // uni-nav-bar的实际高度包含状态栏
  const safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0
  
  return systemInfo.windowHeight - navBarHeight - safeAreaBottom
})

// 方法
const goBack = () => {
  uni.navigateBack()
}

const loadShares = async () => {
  try {
    await loadMyShares()
  } catch (error) {
    console.error('加载分享列表失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}

const handleDeleteShare = async (shareId) => {
  // 删除成功后重新加载分享列表
  console.log('分享已删除:', shareId)
  
  try {
    await loadShares()
  } catch (error) {
    console.error('刷新分享列表失败:', error)
  }
}

const handleImportSuccess = () => {
  uni.showToast({
    title: '导入成功',
    icon: 'success'
  })
  
  // 延迟跳转到首页，让用户看到导入的项目册
  setTimeout(() => {
    uni.switchTab({
      url: '/pages/list/list'
    })
  }, 1500)
}

// 更新高度的方法
const updateScrollHeight = () => {
  scrollHeight.value = computedScrollHeight.value
}

// 生命周期
onLoad(() => {
  updateScrollHeight()
})

onShow(() => {
  // 每次显示页面时刷新数据和高度
  updateScrollHeight()
  loadShares()
})

onMounted(() => {
  loadShares()
  // 监听窗口大小变化
  uni.onWindowResize(() => {
    updateScrollHeight()
  })
})
</script>

<style lang="scss" scoped>
.share-management {
  background-color: #f8f9fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  // 防止整个页面溢出
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
}

.content-scroll {
  padding: 12rpx 16rpx; // 使用rpx单位，小屏幕上减少padding
  flex: 1;
  // 防止内容区域溢出
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
  
  // 小屏幕适配
  @media (max-width: 375px) {
    padding: 8rpx 12rpx;
  }
  
  // 超小屏幕适配
  @media (max-width: 320px) {
    padding: 6rpx 10rpx;
  }
}

.section {
  margin-bottom: 16rpx; // 使用rpx单位，减少间距
  
  &:last-child {
    margin-bottom: 0;
  }
  
  // 小屏幕适配
  @media (max-width: 375px) {
    margin-bottom: 12rpx;
  }
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx; // 使用rpx单位，减少间距
  flex-wrap: wrap; // 允许换行，防止在小屏幕上溢出
  
  .section-title {
    font-size: 16px; // 减小字体
    font-weight: 600;
    color: #333333;
    margin-left: 6px; // 减小间距
    flex-shrink: 0;
    
    // 小屏幕适配
    @media (max-width: 375px) {
      font-size: 15px;
    }
  }
  
  .share-count {
    font-size: 13px; // 减小字体
    color: #666666;
    margin-left: 6px; // 减小间距
    flex-shrink: 0;
    
    // 小屏幕适配
    @media (max-width: 375px) {
      font-size: 12px;
    }
  }
}

.section-content {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  // 防止section内容溢出
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.help-content {
  padding: 20px;
}

.help-item {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .help-title {
    display: block;
    font-size: 16px;
    font-weight: 500;
    color: #333333;
    margin-bottom: 8px;
  }
  
  .help-desc {
    display: block;
    font-size: 14px;
    color: #666666;
    line-height: 1.5;
    margin-bottom: 4px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>