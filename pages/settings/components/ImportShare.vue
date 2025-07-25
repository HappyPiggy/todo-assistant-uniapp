<template>
  <view class="import-share">
    <!-- 输入区域 -->
    <view class="input-section">
      <view class="input-container">
        <text class="input-label">请输入6位分享码</text>
        <input 
          class="share-code-input"
          v-model="shareCode"
          placeholder="请输入分享码"
          maxlength="6"
          :focus="inputFocused"
          @input="handleInput"
          @blur="validateShareCode"
        />
        <text v-if="inputError" class="error-text">{{ inputError }}</text>
      </view>
      
      <button 
        class="preview-btn"
        :disabled="!isValidShareCode || previewLoading"
        @click="getPreview"
      >
        {{ previewLoading ? '查询中...' : '查看预览' }}
      </button>
    </view>

    <!-- 预览区域 -->
    <view v-if="previewData" class="preview-section">
      <view class="preview-header">
        <uni-icons color="#28a745" size="20" type="eye" />
        <text class="preview-title">分享预览</text>
      </view>
      
      <view class="preview-content">
        <view class="project-preview">
          <view class="project-icon" :style="{ backgroundColor: previewData.todobook_color }">
            <uni-icons color="#ffffff" size="24" :type="previewData.todobook_icon" />
          </view>
          
          <view class="project-info">
            <text class="project-name">{{ previewData.todobook_name }}</text>
            <text class="project-desc">{{ previewData.todobook_description || '暂无描述' }}</text>
            
            <view class="project-meta">
              <text class="meta-item">
                <uni-icons color="#999999" size="12" type="list" />
                {{ previewData.task_count }}个任务
              </text>
              <text class="meta-item">
                <uni-icons color="#999999" size="12" type="person" />
                来自 {{ previewData.creator_name }}
              </text>
              <text v-if="previewData.include_comments" class="meta-item">
                <uni-icons color="#999999" size="12" type="chat" />
                包含评论
              </text>
            </view>
          </view>
        </view>
        
        <view class="import-tips">
          <text class="tips-title">导入说明：</text>
          <text class="tips-item">• 导入后您将成为新项目册的拥有者</text>
          <text class="tips-item">• 所有任务状态将重置为"未完成"</text>
          <text class="tips-item">• 项目册名称将添加"（来自分享）"后缀</text>
        </view>
      </view>
      
      <view class="preview-actions">
        <button class="cancel-btn" @click="clearPreview">取消</button>
        <button 
          class="import-btn" 
          :disabled="importLoading"
          @click="handleImport"
        >
          {{ importLoading ? '导入中...' : '确认导入' }}
        </button>
      </view>
    </view>

    <!-- 历史记录 -->
    <view v-if="recentCodes.length > 0" class="history-section">
      <view class="history-header">
        <uni-icons color="#6c757d" size="16" type="clock" />
        <text class="history-title">最近使用</text>
      </view>
      
      <view class="history-codes">
        <view 
          v-for="code in recentCodes" 
          :key="code"
          class="history-code"
          @click="selectHistoryCode(code)"
        >
          <text class="code-text">{{ code }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useShareData } from '../composables/useShareData.js'

// Emits
const emit = defineEmits(['import-success'])

// 组合式函数
const { getSharePreview, importByShareCode, importLoading } = useShareData()

// 响应式数据
const shareCode = ref('')
const inputError = ref('')
const inputFocused = ref(false)
const previewData = ref(null)
const previewLoading = ref(false)
const recentCodes = ref([])

// 本地存储key
const RECENT_CODES_KEY = 'import_recent_codes'

// 计算属性
const isValidShareCode = computed(() => {
  return /^[A-Za-z0-9]{6}$/.test(shareCode.value)
})

// 方法
const handleInput = (e) => {
  shareCode.value = e.detail.value.toUpperCase()
  inputError.value = ''
  
  // 清除预览数据
  if (previewData.value) {
    previewData.value = null
  }
}

const validateShareCode = () => {
  if (shareCode.value && !isValidShareCode.value) {
    inputError.value = '请输入6位字母数字组合'
  } else {
    inputError.value = ''
  }
}

const getPreview = async () => {
  if (!isValidShareCode.value) {
    inputError.value = '请输入正确的分享码格式'
    return
  }
  
  previewLoading.value = true
  
  try {
    const data = await getSharePreview(shareCode.value)
    previewData.value = data
    
    // 保存到历史记录
    saveToHistory(shareCode.value)
    
  } catch (error) {
    console.error('获取预览失败:', error)
    uni.showToast({
      title: error.message || '获取预览失败',
      icon: 'none'
    })
  } finally {
    previewLoading.value = false
  }
}

const handleImport = async () => {
  if (!shareCode.value) return
  
  try {
    await importByShareCode(shareCode.value)
    
    // 通知父组件导入成功
    emit('import-success')
    
    // 清理状态
    clearPreview()
    shareCode.value = ''
    
  } catch (error) {
    console.error('导入失败:', error)
  }
}

const clearPreview = () => {
  previewData.value = null
}

const selectHistoryCode = (code) => {
  shareCode.value = code
  inputError.value = ''
}

const saveToHistory = (code) => {
  let codes = getRecentCodes()
  
  // 移除重复项
  codes = codes.filter(c => c !== code)
  
  // 添加到开头
  codes.unshift(code)
  
  // 只保留最近5个
  codes = codes.slice(0, 5)
  
  // 保存到本地存储
  uni.setStorageSync(RECENT_CODES_KEY, codes)
  recentCodes.value = codes
}

const getRecentCodes = () => {
  try {
    return uni.getStorageSync(RECENT_CODES_KEY) || []
  } catch {
    return []
  }
}

const loadRecentCodes = () => {
  recentCodes.value = getRecentCodes()
}

// 生命周期
onMounted(() => {
  loadRecentCodes()
})
</script>

<style lang="scss" scoped>
.import-share {
  padding: 20px;
}

.input-section {
  margin-bottom: 24px;
  
  .input-container {
    margin-bottom: 16px;
    
    .input-label {
      display: block;
      font-size: 14px;
      color: #333333;
      margin-bottom: 8px;
    }
    
    .share-code-input {
      width: 100%;
      height: 48px;
      padding: 0 16px;
      font-size: 18px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-weight: 600;
      letter-spacing: 2px;
      text-align: center;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      background-color: #ffffff;
      
      &:focus {
        border-color: #007AFF;
        outline: none;
      }
      
      &::placeholder {
        color: #cccccc;
        font-weight: normal;
        letter-spacing: normal;
      }
    }
    
    .error-text {
      display: block;
      font-size: 12px;
      color: #dc3545;
      margin-top: 4px;
    }
  }
  
  .preview-btn {
    width: 100%;
    height: 44px;
    background-color: #007AFF;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    
    &:active {
      background-color: #0056CC;
    }
    
    &:disabled {
      background-color: #cccccc;
      color: #666666;
    }
  }
}

.preview-section {
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  margin-bottom: 24px;
  
  .preview-header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e9ecef;
    
    .preview-title {
      font-size: 16px;
      font-weight: 500;
      color: #333333;
      margin-left: 8px;
    }
  }
  
  .preview-content {
    padding: 20px;
  }
  
  .project-preview {
    display: flex;
    align-items: flex-start;
    margin-bottom: 20px;
    
    .project-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .project-info {
      flex: 1;
      
      .project-name {
        display: block;
        font-size: 18px;
        font-weight: 600;
        color: #333333;
        margin-bottom: 4px;
      }
      
      .project-desc {
        display: block;
        font-size: 14px;
        color: #666666;
        line-height: 1.4;
        margin-bottom: 12px;
      }
      
      .project-meta {
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
  
  .import-tips {
    background-color: #ffffff;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e9ecef;
    
    .tips-title {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #333333;
      margin-bottom: 8px;
    }
    
    .tips-item {
      display: block;
      font-size: 12px;
      color: #666666;
      line-height: 1.5;
      margin-bottom: 4px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  
  .preview-actions {
    display: flex;
    padding: 16px 20px 20px;
    border-top: 1px solid #e9ecef;
    gap: 12px;
    
    .cancel-btn {
      flex: 1;
      height: 44px;
      background-color: #ffffff;
      color: #666666;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      font-size: 16px;
      
      &:active {
        background-color: #f8f9fa;
      }
    }
    
    .import-btn {
      flex: 1;
      height: 44px;
      background-color: #28a745;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      
      &:active {
        background-color: #218838;
      }
      
      &:disabled {
        background-color: #cccccc;
        color: #666666;
      }
    }
  }
}

.history-section {
  .history-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    
    .history-title {
      font-size: 14px;
      color: #666666;
      margin-left: 6px;
    }
  }
  
  .history-codes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .history-code {
      padding: 8px 12px;
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      
      &:active {
        background-color: #e9ecef;
      }
      
      .code-text {
        font-size: 14px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        color: #007AFF;
        font-weight: 500;
      }
    }
  }
}
</style>