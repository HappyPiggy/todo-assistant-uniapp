<template>
  <view class="error-state">
    <view class="error-icon">
      <uni-icons 
        :type="icon" 
        :size="iconSize" 
        :color="iconColor" />
    </view>
    <text class="error-title">{{ title }}</text>
    <text v-if="message" class="error-message">{{ message }}</text>
    <view v-if="showRetry" class="error-actions">
      <button class="retry-btn" @click="handleRetry">
        {{ retryText }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '出错了'
  },
  message: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'close-filled'
  },
  iconSize: {
    type: [String, Number],
    default: 60
  },
  iconColor: {
    type: String,
    default: '#ff4757'
  },
  showRetry: {
    type: Boolean,
    default: true
  },
  retryText: {
    type: String,
    default: '重试'
  }
})

const emit = defineEmits(['retry'])

const handleRetry = () => {
  emit('retry')
}
</script>

<style lang="scss" scoped>
@import '../../styles/mixins.scss';

.error-state {
  @include error-state;
  
  .error-icon {
    margin-bottom: $margin-base;
  }
  
  .error-title {
    font-size: $font-size-lg;
    color: $error-color;
    font-weight: $font-weight-medium;
    margin-bottom: $margin-sm;
  }
  
  .error-message {
    font-size: $font-size-base;
    color: $text-secondary;
    line-height: $line-height-lg;
    margin-bottom: $margin-base;
  }
  
  .error-actions {
    margin-top: $margin-base;
  }
  
  .retry-btn {
    @include button-primary;
    height: 72rpx;
    padding: 0 $padding-base;
    font-size: $font-size-base;
  }
}
</style>