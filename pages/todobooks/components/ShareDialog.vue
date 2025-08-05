<template>
  <uni-popup ref="popupRef" type="dialog" background-color="#ffffff" :safe-area="true">
    <view class="share-dialog">
      <!-- 对话框标题 -->
      <view class="dialog-header">
        <text class="dialog-title">{{ dialogTitle }}</text>
        <view class="close-btn" @click="close">
          <uni-icons color="#999999" size="20" type="closeempty" />
        </view>
      </view>

      <!-- 加载中 -->
      <view v-if="isCheckingStatus" class="dialog-content">
        <view class="loading-container">
          <uni-loading color="#007AFF" />
          <text class="loading-text">检查分享状态...</text>
        </view>
      </view>

      <!-- 分享设置（未分享） -->
      <view v-else-if="!shareResult && shareStatus && !shareStatus.isShared" class="dialog-content">
        <view class="project-info">
          <view class="project-icon" :style="{ backgroundColor: todoBokData?.color || '#007AFF' }">
            <uni-icons color="#ffffff" size="24" :type="todoBokData?.icon || 'folder'" />
          </view>
          <view class="project-details">
            <text class="project-name">{{ todoBokData?.title || '项目册' }}</text>
            <text class="project-desc">{{ todoBokData?.description || '暂无描述' }}</text>
          </view>
        </view>

        <view class="settings-section">
          <view class="setting-item">
            <text class="setting-label">包含评论</text>
            <switch 
              :checked="includeComments" 
              @change="handleCommentsChange"
              color="#007AFF"
            />
          </view>
          <view class="setting-desc">
            <text class="desc-text">开启后，项目册中的任务评论也会被包含在分享中</text>
          </view>
        </view>
      </view>

      <!-- 同步选项（已分享） -->
      <view v-else-if="!shareResult && shareStatus && shareStatus.isShared" class="dialog-content">
        <view class="project-info">
          <view class="project-icon" :style="{ backgroundColor: todoBokData?.color || '#007AFF' }">
            <uni-icons color="#ffffff" size="24" :type="todoBokData?.icon || 'folder'" />
          </view>
          <view class="project-details">
            <text class="project-name">{{ todoBokData?.title || '项目册' }}</text>
            <text class="project-desc">{{ todoBokData?.description || '暂无描述' }}</text>
          </view>
        </view>

        <view class="share-status-section">
          <view class="status-item">
            <text class="status-label">分享码</text>
            <text class="status-value">{{ shareStatus.shareInfo.shareCode }}</text>
          </view>
          <view class="status-item">
            <text class="status-label">上次同步时间</text>
            <text class="status-value">{{ formatSyncTime(shareStatus.shareInfo.lastSyncAt) }}</text>
          </view>
          <view class="status-item">
            <text class="status-label">同步次数</text>
            <text class="status-value">{{ shareStatus.shareInfo.syncCount || 0 }}次</text>
          </view>
        </view>

        <view v-if="!shareStatus.shareInfo.canSync" class="sync-limit-tips">
          <uni-icons color="#ff9500" size="16" type="info-filled" />
          <text class="tips-text">{{ getSyncLimitMessage() }}</text>
        </view>

        <view class="sync-desc">
          <text class="desc-text">同步将更新云端分享内容为最新版本，分享码保持不变</text>
        </view>
      </view>

      <!-- 分享结果 -->
      <view v-if="shareResult" class="dialog-content">
        <view class="success-icon">
          <uni-icons color="#28a745" size="48" type="checkmarkempty" />
        </view>
        <view class="success-text">
          <text class="success-title">分享创建成功！</text>
          <text class="success-desc">请将分享码发送给对方</text>
        </view>

        <view class="share-code-section">
          <view class="share-code-label">
            <text>分享码</text>
          </view>
          <view class="share-code-container">
            <text class="share-code">{{ shareResult.share_code }}</text>
            <view class="copy-btn" @click="copyShareCode">
              <uni-icons color="#007AFF" size="18" type="copy" />
              <text class="copy-text">复制</text>
            </view>
          </view>
        </view>

        <view class="share-tips">
          <text class="tips-text">• 分享码永久有效，删除分享后失效</text>
          <text class="tips-text">• 每个用户最多同时分享2个项目册</text>
          <text class="tips-text">• 导入的项目册与原项目册相互独立</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="dialog-actions">
        <!-- 检查状态中 -->
        <view v-if="isCheckingStatus" class="single-action">
          <button class="cancel-btn" @click="close">取消</button>
        </view>
        
        <!-- 创建分享按钮 -->
        <view v-else-if="!shareResult && shareStatus && !shareStatus.isShared" class="action-buttons">
          <button class="cancel-btn" @click="close">取消</button>
          <button 
            class="confirm-btn" 
            :disabled="loading"
            @click="handleCreateShare"
          >
            {{ loading ? '创建中...' : '确认分享' }}
          </button>
        </view>
        
        <!-- 同步按钮 -->
        <view v-else-if="!shareResult && shareStatus && shareStatus.isShared" class="action-buttons">
          <button class="cancel-btn" @click="close">取消</button>
          <button 
            class="confirm-btn" 
            :disabled="syncLoading || !shareStatus.shareInfo.canSync"
            @click="handleSyncShare"
          >
            {{ syncLoading ? '同步中...' : '同步到云端' }}
          </button>
        </view>
        
        <!-- 完成按钮 -->
        <view v-else class="single-action">
          <button class="done-btn" @click="close">完成</button>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useShareData } from '@/pages/settings/composables/useShareData.js'

// Props
const props = defineProps({
  todoBokId: String,
  todoBokData: Object
})

// 组合式函数
const { createShare, checkShareStatus, syncShare, copyToClipboard } = useShareData()

// 响应式数据
const popupRef = ref(null)
const includeComments = ref(false)
const loading = ref(false)
const shareResult = ref(null)
const shareStatus = ref(null) // 分享状态信息
const isCheckingStatus = ref(false) // 检查状态中
const syncLoading = ref(false) // 同步中

// 计算属性
const dialogTitle = computed(() => {
  if (isCheckingStatus.value) {
    return '分享项目册'
  }
  if (shareStatus.value?.isShared) {
    return '同步项目册'
  }
  return '分享项目册'
})

// 方法
const open = async () => {
  // 重置状态
  includeComments.value = false
  loading.value = false
  shareResult.value = null
  shareStatus.value = null
  isCheckingStatus.value = true
  
  // 先打开弹窗
  popupRef.value?.open()
  
  // 检查分享状态
  try {
    const status = await checkShareStatus(props.todoBokId)
    shareStatus.value = status
  } catch (error) {
    console.error('检查分享状态失败:', error)
    // 如果检查失败，默认显示创建分享界面
    shareStatus.value = { isShared: false }
  } finally {
    isCheckingStatus.value = false
  }
}

const close = () => {
  popupRef.value?.close()
}

const handleCommentsChange = (e) => {
  includeComments.value = e.detail.value
}

const handleCreateShare = async () => {
  if (!props.todoBokId) {
    uni.showToast({
      title: '项目册ID不能为空',
      icon: 'none'
    })
    return
  }

  loading.value = true

  try {
    const result = await createShare(props.todoBokId, includeComments.value)
    shareResult.value = result
    
    uni.showToast({
      title: '分享创建成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('创建分享失败:', error)
    
    // 显示错误信息
    uni.showToast({
      title: error.message || '创建分享失败',
      icon: 'none',
      duration: 3000
    })
  } finally {
    loading.value = false
  }
}

const copyShareCode = () => {
  if (shareResult.value?.share_code) {
    copyToClipboard(shareResult.value.share_code, '分享码已复制')
  }
}

const handleSyncShare = async () => {
  if (!shareStatus.value?.shareInfo?.shareId) {
    uni.showToast({
      title: '分享信息不存在',
      icon: 'none'
    })
    return
  }

  syncLoading.value = true

  try {
    const result = await syncShare(shareStatus.value.shareInfo.shareId)
    
    // 同步成功，显示结果
    shareResult.value = {
      share_code: shareStatus.value.shareInfo.shareCode,
      syncedAt: result.syncedAt
    }
    
    uni.showToast({
      title: '同步成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('同步失败:', error)
    
    if (error.code === 2001) {
      // 时间限制错误，显示特殊提示
      const hours = Math.ceil((error.data.nextSyncTime - new Date()) / (1000 * 60 * 60))
      uni.showToast({
        title: `请在${hours}小时后重试`,
        icon: 'none',
        duration: 3000
      })
    }
  } finally {
    syncLoading.value = false
  }
}

const formatSyncTime = (timestamp) => {
  if (!timestamp) {
    return '从未同步'
  }
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  // 转换为小时
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60))
    return minutes < 1 ? '刚刚' : `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else {
    const days = Math.floor(hours / 24)
    return `${days}天前`
  }
}

const getSyncLimitMessage = () => {
  if (!shareStatus.value?.shareInfo?.nextSyncTime) {
    return '同步频率限制'
  }
  
  const nextTime = new Date(shareStatus.value.shareInfo.nextSyncTime)
  const now = new Date()
  const diff = nextTime - now
  
  const hours = Math.ceil(diff / (1000 * 60 * 60))
  
  if (hours > 0) {
    return `${hours}小时后可同步`
  } else {
    return '即将可以同步'
  }
}

// 暴露方法给父组件
defineExpose({
  open,
  close
})
</script>

<style lang="scss" scoped>
.share-dialog {
  width: 320px;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f0f0f0;
  
  .dialog-title {
    font-size: 18px;
    font-weight: 600;
    color: #333333;
  }
  
  .close-btn {
    padding: 4px;
    border-radius: 4px;
    
    &:active {
      background-color: #f5f5f5;
    }
  }
}

.dialog-content {
  padding: 20px;
}

.project-info {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  
  .project-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
  }
  
  .project-details {
    flex: 1;
    
    .project-name {
      display: block;
      font-size: 16px;
      font-weight: 500;
      color: #333333;
      margin-bottom: 4px;
    }
    
    .project-desc {
      display: block;
      font-size: 14px;
      color: #666666;
      line-height: 1.4;
    }
  }
}

.settings-section {
  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    
    .setting-label {
      font-size: 16px;
      color: #333333;
    }
  }
  
  .setting-desc {
    .desc-text {
      font-size: 12px;
      color: #999999;
      line-height: 1.4;
    }
  }
}

.success-icon {
  text-align: center;
  margin-bottom: 16px;
}

.success-text {
  text-align: center;
  margin-bottom: 24px;
  
  .success-title {
    display: block;
    font-size: 18px;
    font-weight: 500;
    color: #333333;
    margin-bottom: 8px;
  }
  
  .success-desc {
    display: block;
    font-size: 14px;
    color: #666666;
  }
}

.share-code-section {
  margin-bottom: 24px;
  
  .share-code-label {
    margin-bottom: 8px;
    
    text {
      font-size: 14px;
      color: #666666;
    }
  }
  
  .share-code-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    
    .share-code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 20px;
      font-weight: 600;
      color: #007AFF;
      letter-spacing: 2px;
    }
    
    .copy-btn {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      background-color: #ffffff;
      border: 1px solid #007AFF;
      border-radius: 6px;
      
      &:active {
        background-color: #f0f8ff;
      }
      
      .copy-text {
        font-size: 12px;
        color: #007AFF;
        margin-left: 4px;
      }
    }
  }
}

.share-tips {
  .tips-text {
    display: block;
    font-size: 12px;
    color: #999999;
    line-height: 1.5;
    margin-bottom: 4px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.dialog-actions {
  padding: 16px 20px 20px;
  border-top: 1px solid #f0f0f0;
}

.action-buttons {
  display: flex;
  gap: 12px;
  
  .cancel-btn {
    flex: 1;
    height: 44px;
    background-color: #f8f9fa;
    color: #666666;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    
    &:active {
      background-color: #e9ecef;
    }
  }
  
  .confirm-btn {
    flex: 1;
    height: 44px;
    background-color: #007AFF;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    
    &:active {
      background-color: #0056CC;
    }
    
    &:disabled {
      background-color: #cccccc;
      color: #666666;
    }
  }
}

.single-action {
  .done-btn {
    width: 100%;
    height: 44px;
    background-color: #007AFF;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    
    &:active {
      background-color: #0056CC;
    }
  }
  
  .cancel-btn {
    width: 100%;
    height: 44px;
    background-color: #f8f9fa;
    color: #666666;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    
    &:active {
      background-color: #e9ecef;
    }
  }
}

.loading-container {
  text-align: center;
  padding: 40px 0;
  
  .loading-text {
    display: block;
    margin-top: 12px;
    font-size: 14px;
    color: #666666;
  }
}

.share-status-section {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  
  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .status-label {
      font-size: 14px;
      color: #666666;
    }
    
    .status-value {
      font-size: 14px;
      color: #333333;
      font-weight: 500;
    }
  }
}

.sync-limit-tips {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #fff7e6;
  border-radius: 8px;
  margin-bottom: 16px;
  
  .tips-text {
    font-size: 14px;
    color: #ff9500;
    margin-left: 8px;
  }
}

.sync-desc {
  .desc-text {
    font-size: 12px;
    color: #999999;
    line-height: 1.4;
  }
}
</style>