<template>
  <uni-popup 
    ref="popup" 
    type="center" 
    background-color="#ffffff" 
    :safe-area="true"
    @maskClick="handleMaskClick">
    <view class="invite-modal">
      <view class="modal-header">
        <text class="modal-title">邀请成员</text>
        <view class="close-btn" @click="handleClose">
          <uni-icons color="#999999" size="20" type="close" />
        </view>
      </view>
      
      <view class="modal-content">
        <view class="form-item">
          <text class="form-label">被邀请人昵称</text>
          <view class="input-wrapper">
            <input 
              class="form-input" 
              v-model="nickname" 
              placeholder="请输入被邀请人昵称"
              @confirm="handleInviteConfirm"
              @focus="handleInputFocus"
              @blur="handleInputBlur"
              :focus="inputFocus"
            />
          </view>
        </view>
      </view>
      
      <view class="modal-actions">
        <view class="action-btn secondary" @click="handleCancel">
          <text class="btn-text">取消</text>
        </view>
        <view class="action-btn primary" @click="handleInviteConfirm">
          <text class="btn-text">邀请</text>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue'

const props = defineProps({
  bookId: {
    type: String,
    required: true
  },
  maskClosable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const popup = ref(null)
const nickname = ref('')
const inputFocus = ref(false)

const open = () => {
  popup.value?.open()
  nickname.value = ''
  // 延迟设置焦点，确保弹窗完全打开后再聚焦
  setTimeout(() => {
    inputFocus.value = true
  }, 300)
}

const close = () => {
  popup.value?.close()
}

const handleInviteConfirm = () => {
  if (!nickname.value.trim()) {
    uni.showToast({
      title: '请输入被邀请人昵称',
      icon: 'none'
    })
    return
  }
  
  const inviteData = {
    nickname: nickname.value.trim()
  }
  
  emit('confirm', inviteData)
  close()
}

const handleCancel = () => {
  emit('cancel')
  close()
}

const handleClose = () => {
  handleCancel()
}

const handleInputFocus = () => {
  inputFocus.value = true
}

const handleInputBlur = () => {
  inputFocus.value = false
}

const handleMaskClick = () => {
  if (props.maskClosable) {
    handleCancel()
  }
}

// 暴露方法给父组件
defineExpose({
  open,
  close
})
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.invite-modal {
  width: 600rpx;
  background-color: $bg-white;
  border-radius: $border-radius-large;
  overflow: hidden;
  /* #ifndef APP-NVUE */
  max-width: 90vw;
  /* #endif */
}

.modal-header {
  @include flex-between;
  align-items: center;
  padding: $padding-lg $padding-base;
  border-bottom: 1rpx solid $border-color-light;
}

.modal-title {
  font-size: $font-size-xl;
  color: $text-primary;
  font-weight: $font-weight-medium;
}

.close-btn {
  @include icon-button(40rpx);
}

.modal-content {
  padding: $padding-lg;
}

.form-item {
  margin-bottom: $margin-lg;
}

.form-label {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: $font-weight-medium;
  margin-bottom: $margin-sm;
  display: block;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: $padding-base;
  border: 1rpx solid $border-color;
  border-radius: $border-radius;
  font-size: $font-size-base;
  color: $text-primary;
  background-color: $bg-white;
  box-sizing: border-box;
  height: 92rpx;
  line-height: 48rpx;
  
  &:focus {
    border-color: $primary-color;
    outline: none;
  }
  
  &::placeholder {
    color: $text-tertiary;
  }
}

.modal-actions {
  @include flex-between;
  gap: $margin-base;
  padding: $padding-lg;
  border-top: 1rpx solid $border-color-light;
}

.action-btn {
  flex: 1;
  padding: $padding-base;
  border-radius: $border-radius;
  @include flex-center;
  transition: $transition-fast;
  cursor: pointer;
  
  &.secondary {
    background-color: $gray-100;
    
    &:active {
      background-color: $gray-200;
    }
    
    .btn-text {
      color: $text-secondary;
    }
  }
  
  &.primary {
    background-color: $primary-color;
    
    &:active {
      background-color: darken($primary-color, 10%);
    }
    
    .btn-text {
      color: $bg-white;
    }
  }
}

.btn-text {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
}
</style>