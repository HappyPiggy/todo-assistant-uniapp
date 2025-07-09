<template>
  <view class="member-item">
    <view class="member-avatar">
      <image 
        v-if="member.avatar" 
        :src="member.avatar" 
        class="avatar-image"
        mode="aspectFill" />
      <view v-else class="avatar-placeholder">
        <text class="avatar-text">{{ getAvatarText(member.nickname || member.username) }}</text>
      </view>
    </view>
    
    <view class="member-info">
      <text class="member-name">{{ member.nickname || member.username }}</text>
      <text class="member-role">{{ getRoleText(member.role) }}</text>
      <text class="member-time" v-if="member.joined_at">{{ formatJoinTime(member.joined_at) }}</text>
    </view>
    
    <view class="member-actions">
      <view class="member-status" :class="member.is_active ? 'active' : 'inactive'">
        <text class="status-text">{{ member.is_active ? '在线' : '离线' }}</text>
      </view>
      <view class="member-menu-btn" @click="handleMenuClick" v-if="showActions">
        <uni-icons color="#999999" size="18" type="more-filled" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { formatJoinTime } from '../../utils/dateUtils.js'

const props = defineProps({
  member: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: String,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['menuClick'])

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

const handleMenuClick = () => {
  emit('menuClick', props.member)
}
</script>

<style lang="scss" scoped>
@import '../../styles/mixins.scss';

.member-item {
  @include flex-between;
  align-items: center;
  padding: $padding-base;
  background-color: $bg-white;
  border-radius: $border-radius;
  margin-bottom: $margin-sm;
  border: 1rpx solid $border-color-light;
  transition: $transition-fast;
  
  &:active {
    background-color: $gray-50;
  }
}

.member-avatar {
  width: 80rpx;
  height: 80rpx;
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
  font-size: $font-size-lg;
  color: $bg-white;
  font-weight: $font-weight-medium;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: $font-size-lg;
  color: $text-primary;
  font-weight: $font-weight-medium;
  margin-bottom: $margin-xs;
  display: block;
}

.member-role {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: 4rpx;
  display: block;
}

.member-time {
  font-size: $font-size-xs;
  color: $text-tertiary;
  display: block;
}

.member-actions {
  @include flex-start;
  gap: $margin-sm;
  align-items: center;
  flex-shrink: 0;
}

.member-status {
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  
  &.active {
    background-color: rgba(40, 167, 69, 0.1);
    
    .status-text {
      color: $success-color;
    }
  }
  
  &.inactive {
    background-color: $gray-100;
    
    .status-text {
      color: $text-tertiary;
    }
  }
}

.status-text {
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
}

.member-menu-btn {
  @include icon-button(36rpx);
}
</style>