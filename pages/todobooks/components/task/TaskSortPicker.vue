<template>
  <view class="sort-picker-popup" v-if="visible">
    <view class="popup-overlay" @click="cancel"></view>
    <view class="popup-panel">
      <view class="popup-header">
        <text class="popup-title">选择排序方式</text>
        <text class="close-btn" @click="cancel">✕</text>
      </view>
      
      <scroll-view class="sort-list" :scroll-y="true">
        <view class="sort-section">
          <text class="section-title">排序选项</text>
          <view class="sort-items">
            <view 
              v-for="option in sortOptions"
              :key="`${option.field}_${option.order}`"
              class="sort-item"
              :class="{ selected: isSortSelected(option) }"
              @click="selectSort(option)"
            >
              <view class="sort-content">
                <text class="sort-icon">{{ option.icon }}</text>
                <text class="sort-label">{{ option.label }}</text>
              </view>
              <view v-if="isSortSelected(option)" class="check-icon">✓</view>
            </view>
          </view>
        </view>
      </scroll-view>
      
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
    label: '创建时间 (最新优先)',
    icon: '🕒'
  },
  { 
    field: 'created_at', 
    order: 'asc', 
    label: '创建时间 (最早优先)',
    icon: '🕒'
  },
  { 
    field: 'updated_at', 
    order: 'desc', 
    label: '更新时间 (最新优先)',
    icon: '🔄'
  },
  { 
    field: 'updated_at', 
    order: 'asc', 
    label: '更新时间 (最早优先)',
    icon: '🔄'
  },
  { 
    field: 'tags', 
    order: 'asc', 
    label: 'Tag类别 (A-Z)',
    icon: '🏷️'
  },
  { 
    field: 'tags', 
    order: 'desc', 
    label: 'Tag类别 (Z-A)',
    icon: '🏷️'
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
  console.log('选择排序选项:', option)
}

// 确认选择
const confirm = () => {
  console.log('确认排序选择:', tempSelectedSort.value)
  saveSortToLocal(tempSelectedSort.value)
  emit('confirm', tempSelectedSort.value)
}

// 取消选择
const cancel = () => {
  console.log('取消排序选择')
  // 恢复到原始状态
  tempSelectedSort.value = { ...props.currentSort }
  emit('cancel')
}

// 本地存储相关函数
const getSortStorageKey = () => {
  const userId = currentUserId.value
  if (!userId || !props.todorbookId) return null
  return `task_sort_${userId}_${props.todorbookId}`
}

const saveSortToLocal = (sortOption) => {
  try {
    const storageKey = getSortStorageKey()
    if (storageKey) {
      const sortData = {
        sortOption: sortOption,
        timestamp: Date.now()
      }
      uni.setStorageSync(storageKey, JSON.stringify(sortData))
      console.log('排序偏好已保存到本地:', storageKey, sortData)
    }
  } catch (error) {
    console.error('保存排序偏好失败:', error)
  }
}

const loadSortFromLocal = () => {
  try {
    const storageKey = getSortStorageKey()
    if (storageKey) {
      const sortDataStr = uni.getStorageSync(storageKey)
      if (sortDataStr) {
        const sortData = JSON.parse(sortDataStr)
        console.log('从本地加载排序偏好:', storageKey, sortData)
        return sortData.sortOption || getDefaultSort()
      }
    }
  } catch (error) {
    console.error('加载排序偏好失败:', error)
  }
  return getDefaultSort()
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
    console.log('TaskSortPicker: 用户切换，重置排序偏好', { oldUserId, newUserId })
    tempSelectedSort.value = getDefaultSort()
    emit('confirm', getDefaultSort())
  }
}, { immediate: false })

// 组件挂载时加载本地存储的排序偏好
onMounted(() => {
  const localSort = loadSortFromLocal()
  console.log('TaskSortPicker: 组件挂载，本地排序偏好:', localSort, '当前排序:', props.currentSort)
  
  if (localSort && (localSort.field !== props.currentSort.field || localSort.order !== props.currentSort.order)) {
    console.log('TaskSortPicker: 应用本地存储的排序偏好')
    tempSelectedSort.value = localSort
    emit('confirm', localSort)
  } else {
    console.log('TaskSortPicker: 使用当前排序偏好')
    tempSelectedSort.value = { ...props.currentSort }
  }
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
  max-height: 60vh;
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
  padding: $padding-base;
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
  flex: 1;
  padding: $padding-base 0;
}

.sort-section {
  padding: 0 $padding-base;
}

.section-title {
  font-size: $font-size-sm;
  color: $text-secondary;
  font-weight: $font-weight-medium;
  margin-bottom: $margin-sm;
  display: block;
}

.sort-items {
  @include flex-column;
  gap: $margin-xs;
}

.sort-item {
  @include flex-between;
  padding: $padding-sm $padding-base;
  background-color: $gray-50;
  border-radius: 12rpx;
  transition: $transition-fast;
  cursor: pointer;
  
  &.selected {
    background-color: rgba($primary-color, 0.1);
    border: 1rpx solid $primary-color;
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.sort-content {
  @include flex-start;
  flex: 1;
}

.sort-icon {
  font-size: $font-size-base;
  margin-right: $margin-sm;
}

.sort-label {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: $font-weight-medium;
}

.check-icon {
  font-size: $font-size-base;
  color: $primary-color;
  font-weight: $font-weight-bold;
}

.popup-footer {
  @include flex-between;
  padding: $padding-base;
  border-top: 1rpx solid $gray-200;
  gap: $margin-base;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
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