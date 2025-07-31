<template>
  <view v-if="visible" class="search-overlay" @click="handleOverlayClick">
    <view class="search-container" @click.stop>
      <view class="search-header">
        <text class="search-title">搜索任务</text>
        <view class="close-button" @click="handleClose">
          <uni-icons color="#666666" size="24" type="close" />
        </view>
      </view>
      <view class="search-input-container">
        <uni-icons color="#999999" size="20" type="search" />
        <input 
          v-model="localKeyword"
          class="search-input"
          placeholder="输入关键字搜索任务..."
          :focus="visible"
          @input="handleInput"
          @confirm="handleConfirm"
          confirm-type="search"
        />
        <view v-if="localKeyword" class="clear-button" @click="handleClear">
          <uni-icons color="#999999" size="16" type="close" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  keyword: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['search', 'clear', 'close'])

const localKeyword = ref('')

// 监听外部keyword变化
watch(() => props.keyword, (newVal) => {
  localKeyword.value = newVal
}, { immediate: true })

// 监听visible变化，弹窗打开时清空搜索框
watch(() => props.visible, (newVal) => {
  if (newVal) {
    localKeyword.value = props.keyword
  }
})

const handleInput = (e) => {
  localKeyword.value = e.detail.value
}

const handleConfirm = () => {
  emit('search', localKeyword.value)
  handleClose()
}

const handleClear = () => {
  localKeyword.value = ''
  emit('clear')
}

const handleClose = () => {
  emit('close')
}

const handleOverlayClick = () => {
  handleClose()
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/variables.scss';

.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  /* #ifndef APP-NVUE */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  /* #endif */
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 200rpx;
  animation: overlay-fade-in 0.3s ease;
}

@keyframes overlay-fade-in {
  from {
    opacity: 0;
    /* #ifndef APP-NVUE */
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
    /* #endif */
  }
  to {
    opacity: 1;
    /* #ifndef APP-NVUE */
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    /* #endif */
  }
}

.search-container {
  width: 90%;
  max-width: 600rpx;
  background-color: rgba(255, 255, 255, 0.95);
  /* #ifndef APP-NVUE */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  /* #endif */
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12), 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  animation: container-slide-up 0.3s ease;
}

@keyframes container-slide-up {
  from {
    opacity: 0;
    transform: translateY(60rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.search-title {
  font-size: 36rpx;
  color: #333333;
  font-weight: 600;
}

.close-button {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  background-color: rgba(245, 245, 245, 0.6);
  /* #ifndef APP-NVUE */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  /* #endif */
  transition: all 0.3s ease;
  
  &:active {
    background-color: rgba(230, 230, 230, 0.8);
    transform: scale(0.95);
  }
}

.search-input-container {
  display: flex;
  align-items: center;
  background-color: rgba(248, 248, 248, 0.8);
  /* #ifndef APP-NVUE */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  /* #endif */
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  
  &:focus-within {
    border-color: rgba(0, 122, 255, 0.8);
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 4rpx 16rpx rgba(0, 122, 255, 0.15);
    transform: scale(1.02);
  }
}

.search-input {
  flex: 1;
  font-size: 30rpx;
  color: #333333;
  margin-left: 12rpx;
  background-color: transparent;
  border: none;
  outline: none;
  
  &::placeholder {
    color: #999999;
  }
}

.clear-button {
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  background-color: rgba(232, 232, 232, 0.8);
  /* #ifndef APP-NVUE */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  /* #endif */
  margin-left: 12rpx;
  transition: all 0.3s ease;
  
  &:active {
    background-color: rgba(216, 216, 216, 0.9);
    transform: scale(0.9);
  }
}
</style>