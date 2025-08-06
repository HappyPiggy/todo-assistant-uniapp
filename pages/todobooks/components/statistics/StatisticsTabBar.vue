<template>
  <view class="statistics-tab-bar">
    <view class="tab-container">
      <view 
        v-for="tab in tabs" 
        :key="tab.key"
        class="tab-item"
        :class="{ 'active': activeTab === tab.key }"
        @click="handleTabClick(tab.key)"
      >
        <text class="tab-icon">{{ tab.icon }}</text>
        <text class="tab-text">{{ tab.label }}</text>
      </view>
    </view>
    <view class="tab-indicator" :style="indicatorStyle"></view>
  </view>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  activeTab: {
    type: String,
    default: 'overview'
  }
})

const emit = defineEmits(['tab-change'])

const tabs = ref([
  {
    key: 'overview',
    label: '总览统计',
    icon: '📊'
  },
  {
    key: 'expense',
    label: '消费统计',
    icon: '💰'
  }
])

const indicatorStyle = computed(() => {
  const activeIndex = tabs.value.findIndex(tab => tab.key === props.activeTab)
  const translateX = activeIndex * 100 // 每个tab占50%宽度，所以移动距离是 activeIndex * 100%
  return {
    transform: `translateX(${translateX}%)`
  }
})

const handleTabClick = (tabKey) => {
  if (tabKey !== props.activeTab) {
    emit('tab-change', tabKey)
  }
}
</script>

<style lang="scss" scoped>
.statistics-tab-bar {
  position: relative;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
  overflow: hidden;

  .tab-container {
    display: flex;
    position: relative;
    z-index: 2;

    .tab-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;

      &.active {
        .tab-icon {
          transform: scale(1.1);
        }
        .tab-text {
          color: #007aff;
          font-weight: 600;
        }
      }

      .tab-icon {
        font-size: 18px;
        margin-bottom: 2px;
        transition: transform 0.3s ease;
      }

      .tab-text {
        font-size: 12px;
        color: #666;
        transition: all 0.3s ease;
        text-align: center;
      }

      // 添加点击反馈
      &:active {
        transform: scale(0.95);
        opacity: 0.8;
        transition: all 0.1s ease;
      }
      
      // 触摸高亮效果
      &:hover {
        background: rgba(0, 0, 0, 0.02);
        border-radius: 8px;
      }
    }
  }

  .tab-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    width: 50%;
    background: linear-gradient(90deg, #007aff, #5ac8fa);
    border-radius: 2px 2px 0 0;
    transition: transform 0.3s ease;
    z-index: 1;
  }
}

// 响应式设计
@media (max-width: 375px) {
  .statistics-tab-bar {
    .tab-container {
      .tab-item {
        padding: 12px 4px;
        
        .tab-icon {
          font-size: 18px;
        }
        
        .tab-text {
          font-size: 11px;
        }
      }
    }
  }
}
</style>