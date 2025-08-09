<template>
  <view class="member-item" :class="{ 'is-current-user': isCurrentUser }">
    <view class="member-avatar">
      <image 
        v-if="hasAvatar(member)" 
        :src="getMemberAvatar(member)" 
        class="avatar-image"
        mode="aspectFill" />
      <view v-else class="avatar-placeholder">
        <text class="avatar-text">{{ getMemberAvatarPlaceholder(member) }}</text>
      </view>
    </view>
    
    <view class="member-info">
      <view class="member-name-row">
        <text class="member-name">{{ getMemberNickname(member) }}</text>
        <view class="member-role-badge">
          <text class="member-role">{{ getRoleText(member.role) }}</text>
        </view>
        <view class="self-indicator" v-if="isCurrentUser">
          <text class="self-text">我</text>
        </view>
      </view>
    </view>
    
    <view class="member-actions">
      <view class="member-menu-btn" @click="handleMenuClick" v-if="showActions">
        <uni-icons color="#999999" size="18" type="more-filled" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { currentUserId } from '@/store/storage.js'
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { getMemberAvatar, getMemberAvatarPlaceholder, hasAvatar } from '@/utils/avatarUtils.js'

const emit = defineEmits(['menuClick'])

const props = defineProps({
  member: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
})

onShow(() => {
  // 页面显示时的处理逻辑
})


const isCurrentUser = computed(() => {
  return props.member.user_id === currentUserId.value
})

const getMemberNickname = (member) => {
  return member.user_info?.nickname || '未知用户'
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
@import '@/pages/todobooks/styles/mixins.scss';

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
  
  &.is-current-user {
    border-color: $primary-color;
    background-color: rgba(0, 122, 255, 0.05);
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

.member-name-row {
  @include flex-start;
  align-items: center;
  gap: $margin-sm;
}

.member-name {
  font-size: $font-size-lg;
  color: $text-primary;
  font-weight: $font-weight-medium;
  flex-shrink: 0;
}

.member-role-badge {
  background-color: $primary-color;
  padding: 6rpx 16rpx;
  border-radius: 24rpx;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32rpx;
}

.member-role {
  font-size: $font-size-xs;
  color: $bg-white;
  font-weight: $font-weight-medium;
  line-height: 1;
  text-align: center;
}

.self-indicator {
  background-color: #ff9500;
  padding: 6rpx 12rpx;
  border-radius: 24rpx;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32rpx;
}

.self-text {
  font-size: $font-size-xs;
  color: $bg-white;
  font-weight: $font-weight-medium;
  line-height: 1;
  text-align: center;
}

.member-time {
  font-size: $font-size-xs;
  color: $text-tertiary;
  display: block;
}

.member-actions {
  @include flex-start;
  align-items: center;
  flex-shrink: 0;
}

.member-menu-btn {
  @include icon-button(36rpx);
}

</style>