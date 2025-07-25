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

// 组合式函数
const { deleteShare, copyToClipboard } = useShareData()

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
    await deleteShare(currentShare.value.share_id)
    
    // 通知父组件删除成功
    emit('delete', currentShare.value.share_id)
    
    // 关闭弹窗
    deletePopupRef.value?.close()
    currentShare.value = null
    
  } catch (error) {
    console.error('删除分享失败:', error)
  } finally {
    deleting.value = false
  }
}
</script>

<style lang="scss" scoped>
.share-list {
  min-height: 200px;
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
  .share-item {
    padding: 20px;
    border-bottom: 1px solid #f0f0f0;
    
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
      margin-bottom: 8px;
    }
    
    .share-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      
      .meta-item {
        display: flex;
        align-items: center;
        font-size: 12px;
        color: #999999;
        
        uni-icons {
          margin-right: 2px;
        }
      }
    }
  }
}

.share-code-section {
  .share-code-container {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 12px 16px;
    border: 1px solid #e9ecef;
    
    .share-code-label {
      display: block;
      font-size: 12px;
      color: #666666;
      margin-bottom: 4px;
    }
    
    .share-code {
      display: block;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 18px;
      font-weight: 600;
      color: #007AFF;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    
    .share-actions {
      display: flex;
      gap: 8px;
      
      .action-btn {
        display: flex;
        align-items: center;
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid;
        
        &:active {
          opacity: 0.7;
        }
        
        .action-text {
          font-size: 12px;
          margin-left: 4px;
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