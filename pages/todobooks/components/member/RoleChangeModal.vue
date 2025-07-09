<template>
  <uni-popup 
    ref="popup" 
    type="center" 
    background-color="#ffffff" 
    :safe-area="true"
    @maskClick="handleMaskClick">
    <view class="role-change-modal">
      <view class="modal-header">
        <text class="modal-title">更改角色</text>
        <view class="close-btn" @click="handleClose">
          <uni-icons color="#999999" size="20" type="close" />
        </view>
      </view>
      
      <view class="modal-content" v-if="currentMember">
        <view class="member-info">
          <view class="member-avatar">
            <image 
              v-if="currentMember.avatar" 
              :src="currentMember.avatar" 
              class="avatar-image"
              mode="aspectFill" />
            <view v-else class="avatar-placeholder">
              <text class="avatar-text">{{ getAvatarText(currentMember.nickname || currentMember.username) }}</text>
            </view>
          </view>
          <view class="member-details">
            <text class="member-name">{{ currentMember.nickname || currentMember.username }}</text>
            <text class="current-role">当前角色：{{ getRoleText(currentMember.role) }}</text>
          </view>
        </view>
        
        <view class="role-options">
          <text class="options-label">选择新角色</text>
          <view class="role-list">
            <view 
              v-for="role in roleOptions" 
              :key="role.value"
              class="role-item"
              :class="{ 
                active: selectedRole === role.value,
                disabled: role.value === currentMember.role
              }"
              @click="selectRole(role.value)">
              <view class="role-icon">
                <uni-icons 
                  :color="selectedRole === role.value ? '#007AFF' : '#999999'" 
                  size="20" 
                  :type="role.icon" />
              </view>
              <view class="role-info">
                <text class="role-name">{{ role.label }}</text>
                <text class="role-desc">{{ role.description }}</text>
              </view>
              <view class="role-check" v-if="selectedRole === role.value">
                <uni-icons color="#007AFF" size="16" type="checkmarkempty" />
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <view class="modal-actions">
        <view class="action-btn secondary" @click="handleCancel">
          <text class="btn-text">取消</text>
        </view>
        <view 
          class="action-btn primary" 
          :class="{ disabled: !selectedRole || selectedRole === currentMember?.role }"
          @click="handleConfirm">
          <text class="btn-text">确认更改</text>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'

const props = defineProps({
  currentMember: {
    type: Object,
    default: null
  },
  maskClosable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const popup = ref(null)
const selectedRole = ref('')

// 角色选项
const roleOptions = [
  {
    value: 'member',
    label: '成员',
    description: '可以查看和编辑任务',
    icon: 'person'
  },
  {
    value: 'admin',
    label: '管理员',
    description: '可以管理项目册和成员',
    icon: 'staff'
  },
  {
    value: 'owner',
    label: '所有者',
    description: '拥有项目册的完全控制权',
    icon: 'crown'
  }
]

const getAvatarText = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

const getRoleText = (role) => {
  const roleMap = {
    owner: '所有者',
    admin: '管理员',
    member: '成员'
  }
  return roleMap[role] || '成员'
}

const selectRole = (role) => {
  if (role !== props.currentMember?.role) {
    selectedRole.value = role
  }
}

const open = () => {
  selectedRole.value = props.currentMember?.role || ''
  popup.value?.open()
}

const close = () => {
  popup.value?.close()
}

const handleConfirm = () => {
  if (selectedRole.value && selectedRole.value !== props.currentMember?.role) {
    emit('confirm', props.currentMember, selectedRole.value)
    close()
  }
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

.role-change-modal {
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

.member-info {
  @include flex-start;
  align-items: center;
  margin-bottom: $margin-lg;
  padding: $padding-base;
  background-color: $gray-50;
  border-radius: $border-radius;
}

.member-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: $margin-base;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background-color: $primary-color;
  @include flex-center;
}

.avatar-text {
  font-size: $font-size-base;
  color: $bg-white;
  font-weight: $font-weight-medium;
}

.member-details {
  flex: 1;
}

.member-name {
  font-size: $font-size-lg;
  color: $text-primary;
  font-weight: $font-weight-medium;
  margin-bottom: $margin-xs;
  display: block;
}

.current-role {
  font-size: $font-size-sm;
  color: $text-secondary;
  display: block;
}

.role-options {
  margin-bottom: $margin-lg;
}

.options-label {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: $font-weight-medium;
  margin-bottom: $margin-base;
  display: block;
}

.role-list {
  gap: $margin-sm;
}

.role-item {
  @include flex-between;
  align-items: center;
  padding: $padding-base;
  border: 1rpx solid $border-color;
  border-radius: $border-radius;
  transition: $transition-fast;
  cursor: pointer;
  margin-bottom: $margin-sm;
  
  &.active {
    border-color: $primary-color;
    background-color: rgba(0, 122, 255, 0.05);
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:active:not(.disabled) {
    transform: scale(0.98);
  }
}

.role-icon {
  width: 40rpx;
  height: 40rpx;
  @include flex-center;
  margin-right: $margin-base;
  flex-shrink: 0;
}

.role-info {
  flex: 1;
}

.role-name {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: $font-weight-medium;
  margin-bottom: 4rpx;
  display: block;
}

.role-desc {
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: $line-height-base;
  display: block;
}

.role-check {
  width: 24rpx;
  height: 24rpx;
  @include flex-center;
  flex-shrink: 0;
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
    
    &:active:not(.disabled) {
      background-color: darken($primary-color, 10%);
    }
    
    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
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