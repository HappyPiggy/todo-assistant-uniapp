<template>
  <uni-popup ref="popupRef" type="bottom" background-color="#ffffff" :safe-area="true">
    <view class="action-sheet">
      <view class="action-header">
        <text class="action-title">{{ bookData?.title }}</text>
      </view>
      <scroll-view scroll-y class="action-scroll">
        <view class="action-list">
          <!-- 置顶功能 (仅列表页显示) -->
          <view v-if="showPin" class="action-item" @click="handlePinAction">
            <uni-icons 
              :color="isBookPinned ? '#FF6B6B' : '#007AFF'" 
              size="20" 
              :type="isBookPinned ? 'star-filled' : 'star'" 
            />
            <text class="action-text">{{ isBookPinned ? '取消置顶' : '置顶' }}</text>
          </view>
          
          <!-- 编辑 -->
          <view class="action-item" @click="handleEditAction">
            <uni-icons color="#007AFF" size="20" type="compose" />
            <text class="action-text">编辑</text>
          </view>
          
          <!-- 成员管理 -->
          <view class="action-item" @click="handleMembersAction">
            <uni-icons color="#28a745" size="20" type="staff" />
            <text class="action-text">成员管理</text>
          </view>
          
          <!-- 数据统计 -->
          <view class="action-item" @click="handleStatisticsAction">
            <uni-icons color="#17a2b8" size="20" type="bars" />
            <text class="action-text">数据统计</text>
          </view>
          
          <!-- 分享 -->
          <view class="action-item" @click="handleShareAction">
            <uni-icons color="#ff9500" size="20" type="redo" />
            <text class="action-text">分享</text>
          </view>
          
          <!-- 归档  -->
          <view v-if="showArchive" class="action-item" @click="handleArchiveAction">
            <uni-icons color="#ffc107" size="20" type="folder-add" />
            <text class="action-text">归档</text>
          </view>
          
          <!-- 删除  -->
          <view v-if="showDelete" class="action-item danger" @click="handleDeleteAction">
            <uni-icons color="#FF4757" size="20" type="trash" />
            <text class="action-text">删除</text>
          </view>
        </view>
      </scroll-view>
      <view class="action-cancel" @click="close">
        <text class="cancel-text">取消</text>
      </view>
      <!-- 底部占位空间，确保不被tab栏遮挡 -->
      <view class="bottom-spacer"></view>
    </view>

    <!-- 分享对话框 -->
    <ShareDialog 
      ref="shareDialogRef"
      :todo-bok-id="bookData?._id"
      :todo-bok-data="bookData"
    />
  </uni-popup>
</template>

<script setup>
import { ref } from 'vue'
import ShareDialog from './ShareDialog.vue'
import { useBookData } from '@/pages/todobooks/composables/useBookData.js'
import { usePinning } from '@/composables/usePinning.js'

// Props - 只需要基本数据，不需要回调
const props = defineProps({
  bookData: {
    type: Object,
    default: () => ({})
  },
  // 控制显示哪些菜单项
  showPin: {
    type: Boolean,
    default: false
  },
  showArchive: {
    type: Boolean,
    default: false
  },
  showDelete: {
    type: Boolean,
    default: false
  },
  // 页面类型（用于不同页面的不同行为）
  pageType: {
    type: String,
    default: 'detail', // 'list' | 'detail'
    validator: (value) => ['list', 'detail'].includes(value)
  }
})

// Emits - 只保留必要的通知事件
const emit = defineEmits([
  'action-completed' // 通用完成事件，传递操作类型和结果
])

// 响应式数据
const popupRef = ref(null)
const shareDialogRef = ref(null)

// 组合式函数
const { archiveTodoBook, deleteTodoBook } = useBookData()
const { isPinned, togglePin } = usePinning('todobooks')

// 检查是否置顶
const isBookPinned = ref(false)
const refreshPinnedStatus = () => {
  if (props.bookData?._id) {
    isBookPinned.value = isPinned(props.bookData._id)
  }
}

// 方法
const open = () => {
  refreshPinnedStatus()
  popupRef.value?.open()
}

const close = () => {
  popupRef.value?.close()
}

const handlePinAction = () => {
  if (props.bookData?._id) {
    togglePin(props.bookData._id)
    refreshPinnedStatus()
  }
  close()
  emit('action-completed', { type: 'pin', success: true })
}

const handleEditAction = () => {
  close()
  const bookId = props.bookData?._id
  if (bookId) {
    uni.navigateTo({
      url: `/pages/todobooks/form?id=${bookId}`
    })
  }
}

const handleMembersAction = () => {
  close()
  const bookId = props.bookData?._id
  if (bookId) {
    uni.navigateTo({
      url: `/pages/todobooks/members?id=${bookId}&bookData=${encodeURIComponent(JSON.stringify(props.bookData))}`
    })
  }
}

const handleStatisticsAction = () => {
  close()
  const bookId = props.bookData?._id
  if (bookId) {
    uni.navigateTo({
      url: `/pages/todobooks/statistics?id=${bookId}`
    })
  }
}

const handleShareAction = () => {
  close()
  console.log("handleShareAction")
  shareDialogRef.value?.open()
}

const handleArchiveAction = async () => {
  const bookToArchive = props.bookData
  close()
  
  uni.showModal({
    title: '确认归档',
    content: '归档后的项目册将移动到归档列表中，确定要归档吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await archiveTodoBook(bookToArchive._id)
          
          uni.showToast({
            title: '归档成功',
            icon: 'success'
          })
          
          emit('action-completed', { type: 'archive', success: true })
          
        } catch (err) {
          console.error('归档失败:', err)
          uni.showToast({
            title: err.message || '归档失败',
            icon: 'error'
          })
          emit('action-completed', { type: 'archive', success: false, error: err })
        }
      }
    }
  })
}

const handleDeleteAction = async () => {
  const bookToDelete = props.bookData
  close()
  
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除这个项目册吗？',
    confirmColor: '#FF4757',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({
            title: '删除中...'
          })
          
          await deleteTodoBook(bookToDelete._id)
          
          uni.hideLoading()
          
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          
          emit('action-completed', { type: 'delete', success: true })
          
        } catch (err) {
          uni.hideLoading()
          console.error('删除失败:', err)
          uni.showToast({
            title: err.message || '删除失败',
            icon: 'error'
          })
          emit('action-completed', { type: 'delete', success: false, error: err })
        }
      }
    }
  })
}

// 暴露方法给父组件
defineExpose({
  open,
  close
})
</script>

<style lang="scss" scoped>
/* 操作弹窗 */
.action-sheet {
  background-color: #ffffff;
  border-radius: 20rpx 20rpx 0 0;
  padding-bottom: 40rpx;
  /* #ifndef APP-NVUE */
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  z-index: 9999;
  position: relative;
  /* #endif */
}

.action-header {
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  align-items: center;
}

.action-scroll {
  max-height: 60vh;
  flex: 1;
}

.action-title {
  font-size: 32rpx;
  color: #333333;
  font-weight: 500;
}

.action-list {
  padding: 0 20rpx;
}

.action-item {
  flex-direction: row;
  align-items: center;
  padding: 24rpx 20rpx;
  border-radius: 12rpx;
  margin: 8rpx 0;
}

.action-item:active {
  background-color: #f8f8f8;
}

.action-item.danger .action-text {
  color: #FF4757;
}

.action-text {
  font-size: 30rpx;
  color: #333333;
  margin-left: 16rpx;
}

.action-cancel {
  margin: 20rpx;
  margin-bottom: 60rpx;
  padding: 24rpx;
  background-color: #f8f8f8;
  border-radius: 16rpx;
  align-items: center;
  /* #ifndef APP-NVUE */
  margin-bottom: calc(60rpx + env(safe-area-inset-bottom));
  /* #endif */
}

.action-cancel:active {
  background-color: #e8e8e8;
}

.cancel-text {
  font-size: 30rpx;
  color: #666666;
}

.bottom-spacer {
  height: 120rpx;
  /* #ifndef APP-NVUE */
  height: calc(120rpx + env(safe-area-inset-bottom));
  /* #endif */
}
</style>