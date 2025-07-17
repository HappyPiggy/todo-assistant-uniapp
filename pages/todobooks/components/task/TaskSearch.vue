<template>
  <view class="task-search">
    <view class="search-wrapper">
      <view class="search-input-wrapper">
        <uni-icons 
          type="search" 
          size="18" 
          color="#999" 
          class="search-icon"
        />
        <input 
          v-model="searchValue"
          class="search-input"
          type="text"
          placeholder="搜索任务名称、描述或标签..."
          @input="handleInput"
          @confirm="handleConfirm"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <view 
          v-if="searchValue" 
          class="clear-icon"
          @click="handleClear"
        >
          <uni-icons type="clear" size="16" color="#999" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '搜索任务名称、描述或标签...'
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'clear'])

const searchValue = ref(props.modelValue)
const isFocused = ref(false)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  searchValue.value = newValue
})

// 监听内部值变化并向外发送
watch(searchValue, (newValue) => {
  emit('update:modelValue', newValue)
})

const handleInput = (e) => {
  const value = e.detail.value
  searchValue.value = value
  emit('search', value)
}

const handleConfirm = () => {
  emit('search', searchValue.value)
}

const handleFocus = () => {
  isFocused.value = true
}

const handleBlur = () => {
  isFocused.value = false
}

const handleClear = () => {
  searchValue.value = ''
  emit('clear')
  emit('search', '')
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/variables.scss';

.task-search {
  background-color: $bg-white;
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid $border-color;
}

.search-wrapper {
  position: relative;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background-color: $bg-secondary;
  border-radius: 24rpx;
  padding: 0 32rpx;
  height: 72rpx;
  
  &:focus-within {
    background-color: $bg-white;
    border: 2rpx solid $primary-color;
    box-shadow: 0 0 0 4rpx rgba(0, 122, 255, 0.1);
  }
}

.search-icon {
  margin-right: 16rpx;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: $text-primary;
  border: none;
  outline: none;
  background: transparent;
  
  &::placeholder {
    color: $text-light;
  }
}

.clear-icon {
  margin-left: 16rpx;
  padding: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  
  &:active {
    opacity: 0.6;
  }
}
</style>