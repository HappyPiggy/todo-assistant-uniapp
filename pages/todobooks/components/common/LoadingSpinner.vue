<template>
  <view class="loading-spinner">
    <view class="spinner-circle"></view>
    <text class="loading-text">{{ text }}</text>
  </view>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  text: {
    type: String,
    default: '加载中...'
  },
  size: {
    type: String,
    default: 'medium' // small, medium, large
  },
  color: {
    type: String,
    default: '#007aff'
  }
})
</script>

<style lang="scss" scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  
  .spinner-circle {
    width: 40px;
    height: 40px;
    border: 3px solid #f0f0f0;
    border-top-color: #007aff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 12px;
  }
  
  .loading-text {
    font-size: 14px;
    color: #666;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  // 尺寸变体
  &[data-size="small"] .spinner-circle {
    width: 24px;
    height: 24px;
    border-width: 2px;
  }
  
  &[data-size="large"] .spinner-circle {
    width: 60px;
    height: 60px;
    border-width: 4px;
  }
}
</style>