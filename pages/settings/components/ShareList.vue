<template>
  <view class="share-list">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <uni-icons color="#cccccc" size="32" type="reload" />
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="shares.length === 0" class="empty-state">
      <uni-icons color="#cccccc" size="48" type="folder-add" />
      <text class="empty-title">暂无分享</text>
      <text class="empty-desc">您还没有创建任何分享</text>
    </view>

    <!-- 分享列表 -->
    <view v-else class="share-items">
      <view 
        v-for="share in shares" 
        :key="share.share_id"
        class="share-item"
      >
        <!-- 项目册信息 -->
        <view class="share-info">
          <view class="project-icon" :style="{ backgroundColor: share.todobook_color }">
            <uni-icons color="#ffffff" size="20" :type="share.todobook_icon" />
          </view>
          
          <view class="project-details">
            <text class="project-name">{{ share.todobook_name }}</text>
            <text class="project-desc">{{ share.todobook_description || '暂无描述' }}</text>
            
            <view class="share-meta">
              <text class="meta-item">
                <uni-icons color="#999999" size="12" type="calendar" />
                {{ formatDate(share.created_at) }}
              </text>
              <text class="meta-item">
                <uni-icons color="#999999" size="12" type="eye" />
                {{ share.share_count || 0 }}次导入
              </text>
              <text v-if="share.include_comments" class="meta-item">
                <uni-icons color="#999999" size="12" type="chat" />
                含评论
              </text>
            </view>
          </view>
        </view>

        <!-- 分享码区域 -->
        <view class="share-code-section">
          <view class="share-code-container">
            <text class="share-code-label">分享码</text>
            <text class="share-code">{{ share.share_code }}</text>
            <view class="share-actions">
              <view class="action-btn copy-btn" @click="copyShareCode(share.share_code)">
                <uni-icons color="#007AFF" size="14" type="copy" />
                <text class="action-text">复制</text>
              </view>
              <view class="action-btn delete-btn" @click="confirmDelete(share)">
                <uni-icons color="#dc3545" size="14" type="trash" />
                <text class="action-text">删除</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 删除确认弹窗 -->
    <uni-popup ref="deletePopupRef" type="dialog" background-color="#ffffff">
      <view class="delete-dialog">
        <view class="dialog-header">
          <text class="dialog-title">确认删除</text>
        </view>
        <view class="dialog-content">
          <text class="dialog-message">
            确定要删除「{{ currentShare?.todobook_name }}」的分享吗？
          </text>
          <text class="dialog-warning">
            删除后分享码将失效，但已导入的项目册不会受影响。
          </text>
        </view>
        <view class="dialog-actions">
          <button class="cancel-btn" @click="cancelDelete">取消</button>
          <button class="confirm-btn" :disabled="deleting" @click="handleDelete">
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useShareData } from '../composables/useShareData.js'

// Props
const props = defineProps({
  shares: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['delete', 'refresh'])

// 组合式函数 - 只保留复制功能
const { copyToClipboard } = useShareData()

// 响应式数据
const deletePopupRef = ref(null)
const currentShare = ref(null)
const deleting = ref(false)

// 方法
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟前`
  }
  
  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时前`
  }
  
  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}天前`
  }
  
  // 超过7天显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  })
}

const copyShareCode = (shareCode) => {
  copyToClipboard(shareCode, '分享码已复制')
}

const confirmDelete = (share) => {
  currentShare.value = share
  deletePopupRef.value?.open()
}

const cancelDelete = () => {
  currentShare.value = null
  deletePopupRef.value?.close()
}

const handleDelete = async () => {
  if (!currentShare.value) return
  
  deleting.value = true
  
  try {
    // 直接调用云函数删除，不要自行刷新数据
    const todoBookCo = uniCloud.importObject('todobook-co')
    const result = await todoBookCo.deleteShare(currentShare.value.share_id)
    
    if (result.code === 0) {
      // 通知父组件删除成功，由父组件负责刷新数据
      emit('delete', currentShare.value.share_id)
      
      // 关闭弹窗
      deletePopupRef.value?.close()
      currentShare.value = null
      
      // 显示成功提示
      uni.showToast({
        title: '分享已删除',
        icon: 'success'
      })
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error('删除分享失败:', error)
    uni.showToast({
      title: error.message || '删除失败',
      icon: 'none'
    })
  } finally {
    deleting.value = false
  }
}
</script>

<style lang="scss" scoped>
.share-list {
  min-height: 200px;
  // 防止组件溢出
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  
  .loading-text {
    font-size: 14px;
    color: #999999;
    margin-top: 12px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  
  .empty-title {
    font-size: 16px;
    color: #666666;
    margin: 16px 0 8px;
  }
  
  .empty-desc {
    font-size: 14px;
    color: #999999;
  }
}

.share-items {
  // 确保列表容器不会超出
  width: 100%;
  overflow: hidden;
  
  .share-item {
    padding: 12rpx 16rpx; // 使用rpx单位，减少内边距
    border-bottom: 1px solid #f0f0f0;
    // 确保每个分享项不会超出容器
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    
    &:last-child {
      border-bottom: none;
    }
  }
}

.share-info {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  
  .project-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    flex-shrink: 0;
  }
  
  .project-details {
    flex: 1;
    min-width: 0;
    // 确保项目详情不会超出可用空间 - 更严格的控制
    max-width: calc(100% - 60px); // 更保守的计算方式
    width: calc(100% - 60px);
    overflow: hidden;
    word-wrap: break-word;
    word-break: break-all;
    
    // 小屏幕适配
    @media (max-width: 375px) {
      max-width: calc(100% - 55px);
      width: calc(100% - 55px);
    }
    
    @media (max-width: 320px) {
      max-width: calc(100% - 50px);
      width: calc(100% - 50px);
    }
    
    .project-name {
      display: -webkit-box;
      font-size: 14px; // 进一步减小字体
      font-weight: 500;
      color: #333333;
      margin-bottom: 4px;
      word-break: break-all;
      overflow-wrap: break-word;
      // 限制项目名称的行数，避免过长 - 更严格的控制
      -webkit-line-clamp: 1; // 限制为1行防止溢出
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.3;
      width: 100%;
      max-width: 100%;
      
      // 小屏幕适配
      @media (max-width: 375px) {
        font-size: 13px;
      }
      
      @media (max-width: 320px) {
        font-size: 12px;
      }
    }
    
    .project-desc {
      display: block;
      font-size: 12px; // 进一步减小字体
      color: #666666;
      line-height: 1.4;
      margin-bottom: 8px;
      word-break: break-all;
      overflow-wrap: break-word;
      // 限制描述的行数，避免过长
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      
      // 小屏幕适配
      @media (max-width: 375px) {
        font-size: 11px;
        -webkit-line-clamp: 1; // 小屏幕上限制为1行
      }
    }
    
    .share-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 10px; // 减小间距
      
      .meta-item {
        display: flex;
        align-items: center;
        font-size: 11px; // 减小字体
        color: #999999;
        min-width: 0;
        flex-shrink: 1;
        
        uni-icons {
          margin-right: 2px;
          flex-shrink: 0;
        }
      }
    }
  }
}

.share-code-section {
  // 确保父容器不会超出屏幕
  width: 100%;
  overflow: hidden;
  
  .share-code-container {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 10px 12px; // 减小内边距防止溢出
    border: 1px solid #e9ecef;
    // 确保容器不会超出父元素 - 更严格的控制
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    
    // 小屏幕适配
    @media (max-width: 375px) {
      padding: 8px 10px;
    }
    
    @media (max-width: 320px) {
      padding: 6px 8px;
    }
    
    .share-code-label {
      display: block;
      font-size: 12px;
      color: #666666;
      margin-bottom: 4px;
    }
    
    .share-code {
      display: block;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px; // 进一步减小字体
      font-weight: 600;
      color: #007AFF;
      letter-spacing: 0px; // 完全移除字符间距防止溢出
      margin-bottom: 8px;
      word-break: break-all;
      overflow-wrap: break-word;
      // 确保分享码不会溢出 - 更严格的控制
      width: 100%;
      max-width: 100%;
      min-width: 0;
      overflow: hidden;
      line-height: 1.2;
      // 强制在容器内换行
      white-space: normal;
      
      // 小屏幕适配
      @media (max-width: 375px) {
        font-size: 11px;
        letter-spacing: 0px;
      }
      
      // 超小屏幕适配
      @media (max-width: 320px) {
        font-size: 10px;
      }
    }
    
    .share-actions {
      display: flex;
      gap: 4px; // 减小间距防止溢出
      flex-wrap: wrap;
      // 确保按钮行不会超出容器
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      
      .action-btn {
        display: flex;
        align-items: center;
        padding: 3px 6px; // 进一步减少内边距防止溢出
        border-radius: 4px;
        border: 1px solid;
        min-width: 40px; // 进一步减小最小宽度
        max-width: calc(48% - 4px); // 更严格的最大宽度限制
        flex: 1; // 使用flex: 1而不是flex-shrink
        justify-content: center; // 居中对齐
        box-sizing: border-box;
        // 防止按钮内容溢出
        overflow: hidden;
        
        &:active {
          opacity: 0.7;
        }
        
        .action-text {
          font-size: 11px; // 减小字体
          margin-left: 3px; // 减小间距
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        // 小屏幕适配
        @media (max-width: 375px) {
          padding: 3px 6px;
          min-width: 45px;
          
          .action-text {
            font-size: 10px;
            margin-left: 2px;
          }
        }
        
        &.copy-btn {
          border-color: #007AFF;
          background-color: #ffffff;
          
          .action-text {
            color: #007AFF;
          }
        }
        
        &.delete-btn {
          border-color: #dc3545;
          background-color: #ffffff;
          
          .action-text {
            color: #dc3545;
          }
        }
      }
    }
  }
}

.delete-dialog {
  width: 280px;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
}

.dialog-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f0f0f0;
  
  .dialog-title {
    font-size: 18px;
    font-weight: 600;
    color: #333333;
  }
}

.dialog-content {
  padding: 16px 20px 20px;
  
  .dialog-message {
    display: block;
    font-size: 16px;
    color: #333333;
    line-height: 1.5;
    margin-bottom: 8px;
  }
  
  .dialog-warning {
    display: block;
    font-size: 14px;
    color: #dc3545;
    line-height: 1.4;
  }
}

.dialog-actions {
  display: flex;
  padding: 16px 20px 20px;
  border-top: 1px solid #f0f0f0;
  gap: 12px;
  
  .cancel-btn {
    flex: 1;
    height: 40px;
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
    height: 40px;
    background-color: #dc3545;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    
    &:active {
      background-color: #c82333;
    }
    
    &:disabled {
      background-color: #cccccc;
      color: #666666;
    }
  }
}
</style>