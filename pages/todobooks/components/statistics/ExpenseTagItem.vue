<template>
  <view 
    class="expense-tag-item" 
    :class="{ 'selected': selected, 'clickable': true }"
    :style="selected ? {
      borderColor: item.color,
      backgroundColor: item.color + '10'
    } : {}"
    @tap="handleClick"
  >
    <!-- 颜色标识条 -->
    <view 
      class="color-indicator"
      :style="{ backgroundColor: item.color }"
    ></view>
    
    <!-- 标签内容 -->
    <view class="tag-content">
      <view class="tag-header">
        <text class="tag-name">{{ item.tagName }}</text>
        <text class="tag-percentage">{{ item.percentage }}%</text>
      </view>
      
      <view class="tag-details">
        <text class="tag-amount">{{ formatAmount(item.amount) }}</text>
        <text class="tag-count">({{ item.count }}笔)</text>
      </view>
    </view>
    
    <!-- 进度条 -->
    <view class="progress-bar">
      <view 
        class="progress-fill" 
        :style="{ 
          width: item.percentage + '%',
          backgroundColor: item.color + '60',
          boxShadow: `0 1px 3px ${item.color}30`
        }"
      ></view>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0
  },
  selected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

// 格式化金额显示
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '¥0.00'
  return '¥' + Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}


// 处理点击事件
const handleClick = () => {
  // 添加触觉反馈
  try {
    uni.vibrateShort({
      type: 'light'
    })
  } catch (e) {
    console.log('设备不支持触觉反馈')
  }
  
  emit('click', props.item)
}
</script>

<style lang="scss" scoped>
.expense-tag-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
  
  &.clickable {
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }
  
  &.selected {
    border: 2px solid;
    
    .color-indicator {
      width: 6px; // 选中时加宽颜色条
    }
  }
  
  .color-indicator {
    width: 4px;
    height: 100%;
    border-radius: 0 2px 2px 0;
    margin-right: 12px;
    flex-shrink: 0;
    transition: width 0.3s ease;
  }
  
  
  .tag-content {
    flex: 1;
    min-width: 0; // 防止内容溢出
  }
  
  .tag-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  
  .tag-name {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .tag-percentage {
    font-size: 14px;
    font-weight: 600;
    color: #666;
    margin-left: 8px;
  }
  
  .tag-details {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .tag-amount {
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }
  
  .tag-count {
    font-size: 12px;
    color: #999;
  }
  
  .progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px; // 稍微加高进度条
    background: #f5f5f5;
    border-radius: 0 0 12px 12px; // 与卡片圆角保持一致
    
    .progress-fill {
      height: 100%;
      transition: width 0.6s ease;
      border-radius: 0 0 12px 0; // 右下角保持圆角
    }
  }
}

// 响应式适配
@media (max-width: 480px) {
  .expense-tag-item {
    padding: 12px;
    
    .color-indicator {
      width: 3px; // 小屏设备上颜色条稍窄
      margin-right: 10px;
    }
    
    .tag-name {
      font-size: 15px;
    }
    
    .tag-percentage {
      font-size: 13px;
    }
    
    .tag-amount {
      font-size: 16px;
    }
    
    .tag-count {
      font-size: 11px;
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .expense-tag-item {
    background: #1c1c1e;
    box-shadow: 0 2px 8px rgba(255, 255, 255, 0.06);
    
    .tag-name,
    .tag-amount {
      color: #fff;
    }
    
    .tag-percentage {
      color: #999;
    }
    
    .tag-count {
      color: #666;
    }
    
    .progress-bar {
      background: #2c2c2e;
    }
    
    &.selected {
      background: rgba(0, 122, 255, 0.1);
    }
  }
}
</style>