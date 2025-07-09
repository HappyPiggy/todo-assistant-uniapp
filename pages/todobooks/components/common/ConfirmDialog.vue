<template>
  <view v-if="visible" class="confirm-dialog-mask" @click="handleMaskClick">
    <view class="confirm-dialog" @click.stop>
      <view class="dialog-header">
        <text class="dialog-title">{{ title }}</text>
      </view>
      
      <view class="dialog-content">
        <text class="dialog-message">{{ message }}</text>
      </view>
      
      <view class="dialog-actions">
        <button 
          class="cancel-btn" 
          @click="handleCancel"
          :disabled="loading">
          {{ cancelText }}
        </button>
        <button 
          :class="['confirm-btn', { danger: type === 'danger' }]"
          @click="handleConfirm"
          :loading="loading">
          {{ confirmText }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '提示'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'default', // default, danger
    validator: (value) => ['default', 'danger'].includes(value)
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  loading: {
    type: Boolean,
    default: false
  },
  maskClosable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['cancel', 'confirm', 'update:visible'])

const handleCancel = () => {
  if (props.loading) return
  emit('cancel')
  emit('update:visible', false)
}

const handleConfirm = () => {
  if (props.loading) return
  emit('confirm')
}

const handleMaskClick = () => {
  if (props.maskClosable && !props.loading) {
    handleCancel()
  }
}
</script>

<style lang="scss" scoped>
@import '../../styles/mixins.scss';

.confirm-dialog-mask {
  @include popup-mask;
  z-index: $z-index-modal;
}

.confirm-dialog {
  @include popup-content;
  min-width: 280px;
  max-width: 400px;
}

.dialog-header {
  text-align: center;
  margin-bottom: $margin-base;
  
  .dialog-title {
    font-size: $font-size-2xl;
    color: $text-primary;
    font-weight: $font-weight-semibold;
  }
}

.dialog-content {
  margin-bottom: $margin-lg;
  
  .dialog-message {
    font-size: $font-size-lg;
    color: $text-secondary;
    line-height: $line-height-lg;
    text-align: center;
  }
}

.dialog-actions {
  @include flex-start;
  gap: $margin-sm;
  
  .cancel-btn,
  .confirm-btn {
    flex: 1;
    height: 88rpx;
    border-radius: $border-radius-small;
    font-size: $font-size-lg;
    border: none;
    @include flex-center;
    transition: $transition-fast;
  }
  
  .cancel-btn {
    @include button-secondary;
  }
  
  .confirm-btn {
    @include button-primary;
    
    &.danger {
      @include button-danger;
    }
    
    &[loading] {
      opacity: 0.7;
      pointer-events: none;
    }
  }
}
</style>