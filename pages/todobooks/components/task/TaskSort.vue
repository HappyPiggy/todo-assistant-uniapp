<template>
  <view class="task-sort">
    <view class="sort-trigger" @click="showSortPicker">
      <text class="sort-icon">📊</text>
      <text class="sort-text">{{ currentSortText }}</text>
      <text class="sort-arrow">▼</text>
    </view>
    
    <!-- 排序选择器弹窗 -->
    <TaskSortPicker
      v-if="showPicker"
      :visible="showPicker"
      :current-sort="currentSort"
      :todorbook-id="todorbookId"
      @confirm="handleSortConfirm"
      @cancel="handleSortCancel"
    />
  </view>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
import TaskSortPicker from './TaskSortPicker.vue'

const props = defineProps({
  todorbookId: {
    type: String,
    required: true
  },
  currentSort: {
    type: Object,
    default: () => ({ field: 'created_at', order: 'desc' })
  }
})

const emit = defineEmits(['sort-change'])

const showPicker = ref(false)

// 计算当前排序的显示文本
const currentSortText = computed(() => {
  const { field, order } = props.currentSort
  
  const sortLabels = {
    'created_at': order === 'desc' ? '创建↓' : '创建↑',
    'updated_at': order === 'desc' ? '更新↓' : '更新↑', 
    'tags': order === 'desc' ? 'Tag↓' : 'Tag↑'
  }
  
  return sortLabels[field] || '排序'
})

const showSortPicker = () => {
  showPicker.value = true
  console.log('TaskSort: 显示排序选择器', props.currentSort)
}

const handleSortConfirm = (sortOption) => {
  console.log('排序确认:', sortOption)
  emit('sort-change', sortOption)
  showPicker.value = false
}

const handleSortCancel = () => {
  console.log('取消排序选择')
  showPicker.value = false
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.task-sort {
  position: relative;
}

.sort-trigger {
  @include flex-center;
  padding: 10rpx 14rpx; /* 与TaskFilter其他按钮保持一致 */
  background-color: $bg-white; /* 与TaskFilter其他按钮保持一致 */
  border-radius: 12rpx; /* 与TaskFilter其他按钮保持一致 */
  transition: $transition-fast;
  cursor: pointer;
  min-width: 80rpx;
  min-height: 50rpx; /* 与TaskFilter其他按钮保持一致 */
  border: 1rpx solid rgba(0, 0, 0, 0.06); /* 添加微妙边框 */
  
  &:active {
    transform: scale(0.95);
    background-color: $gray-50;
  }
  
  .sort-icon {
    font-size: $font-size-sm;
    margin-right: 4rpx;
  }
  
  .sort-text {
    font-size: $font-size-xs;
    color: $text-secondary;
    font-weight: $font-weight-medium;
    margin-right: 4rpx;
    white-space: nowrap; /* 防止文字换行 */
  }
  
  .sort-arrow {
    font-size: $font-size-xs;
    color: $text-tertiary;
    transition: transform $transition-fast;
  }
}
</style>