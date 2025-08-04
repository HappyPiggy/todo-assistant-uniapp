<template>
  <view class="sort-picker-popup" v-if="visible">
    <view class="popup-overlay" @click="cancel"></view>
    <view class="popup-panel">
      <view class="popup-header">
        <text class="popup-title">选择排序方式</text>
        <text class="close-btn" @click="cancel">✕</text>
      </view>
      
      <view class="sort-list">
        <view class="sort-grid">
          <view 
            v-for="option in sortOptions"
            :key="`${option.field}_${option.order}`"
            class="sort-item"
            :class="{ selected: isSortSelected(option) }"
            @click="selectSort(option)"
          >
            <text class="sort-label">{{ option.label }}</text>
            <view v-if="isSortSelected(option)" class="check-icon">✓</view>
          </view>
        </view>
      </view>
      
      <view class="popup-footer">
        <button class="cancel-btn" @click="cancel">取消</button>
        <button class="confirm-btn" @click="confirm">确定</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, onMounted, watch } from 'vue'
import { currentUserId } from '@/store/storage.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  currentSort: {
    type: Object,
    default: () => ({ field: 'created_at', order: 'desc' })
  },
  todorbookId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['confirm', 'cancel'])

// 排序选项定义
const sortOptions = [
  { 
    field: 'created_at', 
    order: 'desc', 
    label: '最新创建'
  },
  { 
    field: 'created_at', 
    order: 'asc', 
    label: '最早创建'
  },
  { 
    field: 'updated_at', 
    order: 'desc', 
    label: '最新更新'
  },
  { 
    field: 'updated_at', 
    order: 'asc', 
    label: '最早更新'
  },
  { 
    field: 'tags', 
    order: 'asc', 
    label: '标签 A-Z'
  },
  { 
    field: 'tags', 
    order: 'desc', 
    label: '标签 Z-A'
  }
]

// 临时选中的排序选项
const tempSelectedSort = ref({ ...props.currentSort })

// 检查排序选项是否被选中
const isSortSelected = (option) => {
  return tempSelectedSort.value.field === option.field && 
         tempSelectedSort.value.order === option.order
}

// 选择排序选项
const selectSort = (option) => {
  tempSelectedSort.value = { ...option }
}

// 确认选择
const confirm = () => {
  emit('confirm', tempSelectedSort.value)
}

// 取消选择
const cancel = () => {
  console.log('取消排序选择')
  // 恢复到原始状态
  tempSelectedSort.value = { ...props.currentSort }
  emit('cancel')
}

const getDefaultSort = () => {
  return { field: 'created_at', order: 'desc' }
}

// 监听props变化，同步临时状态
watch(() => props.currentSort, (newSort) => {
  tempSelectedSort.value = { ...newSort }
}, { immediate: true })

// 监听用户切换，清除本地排序偏好
watch(currentUserId, (newUserId, oldUserId) => {
  if (oldUserId && newUserId !== oldUserId) {
    console.log('TaskSortPicker: 用户切换，重置排序偏好到临时状态', { oldUserId, newUserId })
    tempSelectedSort.value = getDefaultSort()
    // 移除自动确认，让用户手动选择
  }
}, { immediate: false })

// 组件挂载时同步当前排序状态
onMounted(() => {
  console.log('🚀 TaskSortPicker组件挂载')
  console.log('🚀 当前props.currentSort:', JSON.stringify(props.currentSort, null, 2))
  tempSelectedSort.value = { ...props.currentSort }
  console.log('🚀 组件挂载完成，tempSelectedSort已同步:', JSON.stringify(tempSelectedSort.value, null, 2))
})
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.sort-picker-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  @include flex-end;
  flex-direction: column;
}

.popup-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.popup-panel {
  position: relative;
  background-color: $bg-white;
  border-radius: 16rpx 16rpx 0 0;
  width: 90%;
  max-width: 600rpx;
  margin: 0 auto;
  @include flex-column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.popup-header {
  @include flex-between;
  padding: 24rpx;
  border-bottom: 1rpx solid $gray-200;
}

.popup-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $text-primary;
}

.close-btn {
  font-size: $font-size-lg;
  color: $text-tertiary;
  padding: $padding-xs;
  cursor: pointer;
  
  &:active {
    color: $text-secondary;
  }
}

.sort-list {
  padding: 16rpx 24rpx;
}

.sort-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}

.sort-item {
  @include flex-between;
  padding: 24rpx 16rpx;
  background-color: $gray-50;
  border-radius: 8rpx;
  transition: $transition-fast;
  cursor: pointer;
  min-height: 60rpx;
  position: relative;
  
  &.selected {
    background-color: rgba($primary-color, 0.1);
    border: 1rpx solid $primary-color;
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.sort-label {
  font-size: $font-size-sm;
  color: $text-primary;
  font-weight: $font-weight-medium;
  flex: 1;
}

.check-icon {
  font-size: $font-size-sm;
  color: $primary-color;
  font-weight: $font-weight-bold;
  margin-left: 8rpx;
}

.popup-footer {
  @include flex-between;
  padding: 20rpx 24rpx;
  border-top: 1rpx solid $gray-200;
  gap: 16rpx;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  height: 72rpx;
  border-radius: 8rpx;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  border: none;
  cursor: pointer;
  transition: $transition-fast;
}

.cancel-btn {
  background-color: $gray-100;
  color: $text-secondary;
  
  &:active {
    background-color: $gray-200;
  }
}

.confirm-btn {
  background-color: $primary-color;
  color: $bg-white;
  
  &:active {
    background-color: darken($primary-color, 10%);
  }
}
</style>