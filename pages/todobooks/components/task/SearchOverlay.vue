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
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 200rpx;
}

.search-container {
  width: 90%;
  max-width: 600rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
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
  transition: background-color 0.3s ease;
  
  &:active {
    background-color: #f5f5f5;
  }
}

.search-input-container {
  display: flex;
  align-items: center;
  background-color: #f8f8f8;
  border-radius: 12rpx;
  padding: 24rpx 20rpx;
  border: 2rpx solid transparent;
  transition: border-color 0.3s ease;
  
  &:focus-within {
    border-color: #007AFF;
    background-color: #ffffff;
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
  background-color: #e8e8e8;
  margin-left: 12rpx;
  transition: background-color 0.3s ease;
  
  &:active {
    background-color: #d8d8d8;
  }
}
</style>