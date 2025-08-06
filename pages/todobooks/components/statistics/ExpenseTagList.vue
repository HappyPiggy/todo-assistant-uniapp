<template>
  <view class="expense-tag-list">
    <view 
      v-for="(item, index) in tagData" 
      :key="item.id"
      class="tag-list-wrapper"
      :style="{ '--animation-delay': index * 100 + 'ms' }"
    >
      <ExpenseTagItem
        :item="item"
        :index="index"
        :selected="selectedSegment === item.id"
        @click="handleItemClick"
      />
    </view>
    
    <!-- 空状态 -->
    <view v-if="!tagData || tagData.length === 0" class="empty-state">
      <text class="empty-text">暂无消费数据</text>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import ExpenseTagItem from './ExpenseTagItem.vue'

const props = defineProps({
  tagData: {
    type: Array,
    default: () => []
  },
  selectedSegment: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['item-click'])

// 处理列表项点击
const handleItemClick = (item) => {
  console.log('标签列表项被点击:', item.tagName)
  emit('item-click', item)
}
</script>

<style lang="scss" scoped>
.expense-tag-list {
  padding: 16px;
  
  .tag-list-wrapper {
    margin-bottom: 12px;
    
    // 列表项进入动画
    opacity: 0;
    transform: translateY(20px);
    animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    animation-delay: var(--animation-delay, 0ms);
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px 20px;
    
    .empty-text {
      font-size: 14px;
      color: #999;
    }
  }
}

// 动画关键帧
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式适配
@media (max-width: 480px) {
  .expense-tag-list {
    padding: 12px;
    
    .tag-list-wrapper {
      margin-bottom: 8px;
    }
  }
}
</style>