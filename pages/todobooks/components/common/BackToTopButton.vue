<template>
  <view 
    v-if="visible" 
    class="back-to-top" 
    @click="scrollToTop"
  >
    <uni-icons color="#ffffff" size="20" type="up" />
  </view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

// 定义属性
defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['scroll-to-top'])

// 返回顶部处理函数
const scrollToTop = () => {
  emit('scroll-to-top')
}
</script>

<style lang="scss" scoped>
.back-to-top {
  position: fixed;
  bottom: 180rpx;
  right: 40rpx;
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #6c757d 0%, #868e96 100%);
  border-radius: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 998;
  box-shadow: 0 8rpx 32rpx rgba(108, 117, 125, 0.3);
  transition: all 0.3s ease;
  
  /* #ifndef APP-NVUE */
  bottom: calc(180rpx + env(safe-area-inset-bottom));
  /* #endif */
  
  &:active {
    transform: scale(0.95);
    box-shadow: 0 4rpx 16rpx rgba(108, 117, 125, 0.4);
  }
}
</style>