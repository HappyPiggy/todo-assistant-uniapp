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
        <view class="invite-methods">
          <view class="method-item active" @click="setInviteMethod('link')">
            <uni-icons color="#007AFF" size="20" type="link" />
            <text class="method-text">邀请链接</text>
          </view>
          <view class="method-item" @click="setInviteMethod('code')">
            <uni-icons color="#999999" size="20" type="qr-code" />
            <text class="method-text">邀请码</text>
          </view>
        </view>
        
        <view class="invite-content">
          <view class="invite-link" v-if="inviteMethod === 'link'">
            <text class="content-label">邀请链接</text>
            <view class="link-container">
              <input 
                class="link-input" 
                :value="inviteLink" 
                readonly 
                placeholder="生成中..." />
              <view class="copy-btn" @click="handleCopyLink">
                <uni-icons color="#007AFF" size="16" type="copy" />
                <text class="copy-text">复制</text>
              </view>
            </view>
          </view>
          
          <view class="invite-code" v-else>
            <text class="content-label">邀请码</text>
            <view class="code-container">
              <text class="code-text">{{ inviteCode || '生成中...' }}</text>
              <view class="copy-btn" @click="handleCopyCode">
                <uni-icons color="#007AFF" size="16" type="copy" />
                <text class="copy-text">复制</text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="invite-settings">
          <view class="setting-item">
            <text class="setting-label">有效期</text>
            <picker 
              mode="selector" 
              :range="expireOptions" 
              :range-key="'label'" 
              @change="handleExpireChange">
              <view class="picker-value">
                <text class="value-text">{{ selectedExpire.label }}</text>
                <uni-icons color="#999999" size="16" type="arrowdown" />
              </view>
            </picker>
          </view>
          
          <view class="setting-item">
            <text class="setting-label">默认角色</text>
            <picker 
              mode="selector" 
              :range="roleOptions" 
              :range-key="'label'" 
              @change="handleRoleChange">
              <view class="picker-value">
                <text class="value-text">{{ selectedRole.label }}</text>
                <uni-icons color="#999999" size="16" type="arrowdown" />
              </view>
            </picker>
          </view>
        </view>
      </view>
      
      <view class="modal-actions">
        <view class="action-btn secondary" @click="handleCancel">
          <text class="btn-text">取消</text>
        </view>
        <view class="action-btn primary" @click="handleConfirm">
          <text class="btn-text">生成</text>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { defineProps, defineEmits, ref, reactive, computed } from 'vue'

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
const inviteMethod = ref('link')
const inviteLink = ref('')
const inviteCode = ref('')

const expireOptions = [
  { value: 24, label: '24小时' },
  { value: 72, label: '3天' },
  { value: 168, label: '7天' },
  { value: 720, label: '30天' },
  { value: 0, label: '永久有效' }
]

const roleOptions = [
  { value: 'member', label: '成员' },
  { value: 'admin', label: '管理员' }
]

const selectedExpire = ref(expireOptions[1])
const selectedRole = ref(roleOptions[0])

const open = () => {
  popup.value?.open()
  generateInvite()
}

const close = () => {
  popup.value?.close()
}

const setInviteMethod = (method) => {
  inviteMethod.value = method
}

const handleExpireChange = (e) => {
  selectedExpire.value = expireOptions[e.detail.value]
  generateInvite()
}

const handleRoleChange = (e) => {
  selectedRole.value = roleOptions[e.detail.value]
  generateInvite()
}

const generateInvite = () => {
  // 模拟生成邀请链接和邀请码
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 6)
  
  inviteLink.value = `https://todoapp.com/invite/${props.bookId}?token=${timestamp}${random}`
  inviteCode.value = `${timestamp}${random}`.toUpperCase()
}

const handleCopyLink = () => {
  uni.setClipboardData({
    data: inviteLink.value,
    success: () => {
      uni.showToast({
        title: '复制成功',
        icon: 'success'
      })
    }
  })
}

const handleCopyCode = () => {
  uni.setClipboardData({
    data: inviteCode.value,
    success: () => {
      uni.showToast({
        title: '复制成功',
        icon: 'success'
      })
    }
  })
}

const handleConfirm = () => {
  const inviteData = {
    method: inviteMethod.value,
    link: inviteLink.value,
    code: inviteCode.value,
    expire: selectedExpire.value.value,
    role: selectedRole.value.value
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
@import '../../styles/mixins.scss';

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

.invite-methods {
  @include flex-start;
  gap: $margin-base;
  margin-bottom: $margin-lg;
}

.method-item {
  @include flex-start;
  align-items: center;
  gap: $margin-xs;
  padding: $padding-sm $padding-base;
  border: 1rpx solid $border-color;
  border-radius: $border-radius;
  transition: $transition-fast;
  cursor: pointer;
  
  &.active {
    border-color: $primary-color;
    background-color: rgba(0, 122, 255, 0.05);
    
    .method-text {
      color: $primary-color;
    }
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.method-text {
  font-size: $font-size-base;
  color: $text-secondary;
  font-weight: $font-weight-medium;
}

.invite-content {
  margin-bottom: $margin-lg;
}

.content-label {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: $font-weight-medium;
  margin-bottom: $margin-sm;
  display: block;
}

.link-container,
.code-container {
  @include flex-between;
  align-items: center;
  gap: $margin-sm;
  padding: $padding-sm;
  border: 1rpx solid $border-color;
  border-radius: $border-radius;
  background-color: $gray-50;
}

.link-input {
  flex: 1;
  font-size: $font-size-sm;
  color: $text-secondary;
  background-color: transparent;
  border: none;
  outline: none;
}

.code-text {
  flex: 1;
  font-size: $font-size-lg;
  color: $text-primary;
  font-weight: $font-weight-medium;
  text-align: center;
  letter-spacing: 2rpx;
}

.copy-btn {
  @include flex-start;
  align-items: center;
  gap: $margin-xs;
  padding: $padding-xs $padding-sm;
  background-color: rgba(0, 122, 255, 0.1);
  border-radius: $border-radius-small;
  transition: $transition-fast;
  cursor: pointer;
  
  &:active {
    background-color: rgba(0, 122, 255, 0.2);
  }
}

.copy-text {
  font-size: $font-size-xs;
  color: $primary-color;
  font-weight: $font-weight-medium;
}

.invite-settings {
  gap: $margin-base;
}

.setting-item {
  @include flex-between;
  align-items: center;
  padding: $padding-base 0;
  border-bottom: 1rpx solid $border-color-light;
  
  &:last-child {
    border-bottom: none;
  }
}

.setting-label {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: $font-weight-medium;
}

.picker-value {
  @include flex-start;
  align-items: center;
  gap: $margin-xs;
  cursor: pointer;
}

.value-text {
  font-size: $font-size-sm;
  color: $text-secondary;
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