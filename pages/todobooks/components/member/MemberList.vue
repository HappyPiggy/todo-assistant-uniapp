<template>
  <view class="member-list">
    <!-- 加载状态 -->
    <LoadingState v-if="loading" />
    
    <!-- 错误状态 -->
    <ErrorState 
      v-else-if="error" 
      :message="error"
      @retry="handleRetry" />
    
    <!-- 空状态 -->
    <EmptyState 
      v-else-if="members.length === 0"
      title="还没有成员"
      :show-action="canInvite"
      action-text="邀请成员"
      @action="handleInvite" />
    
    <!-- 成员列表 -->
    <view v-else class="members-container">
      <view class="member-header" v-if="showHeader">
        <text class="member-title">成员 ({{ members.length }})</text>
        <view class="invite-btn" @click="handleInvite" v-if="canInvite">
          <uni-icons color="#007AFF" size="16" type="plus" />
          <text class="invite-text">邀请</text>
        </view>
      </view>
      
      <view class="member-items">
        <MemberItem
          v-for="member in members"
          :key="member._id"
          :member="member"
          :show-actions="shouldShowMemberActions(member)"
          @menu-click="handleMemberMenu"
        />
      </view>
    </view>
    
    <!-- 成员操作菜单 -->
    <MemberActions
      ref="memberActions"
      :current-member="currentMember"
      :current-user-role="currentUserRole"
      :can-remove="canRemoveMember"
      :can-change-role="canChangeRole"
      @change-role="handleChangeRole"
      @remove-member="handleRemoveMember"
      @leave-todobook="handleLeaveTodobook"
      @cancel="handleMenuCancel"
    />
  </view>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
import LoadingState from '../common/LoadingState.vue'
import ErrorState from '../common/ErrorState.vue'
import EmptyState from '../common/EmptyState.vue'
import MemberItem from './MemberItem.vue'
import MemberActions from './MemberActions.vue'
import { currentUserId } from '@/store/storage.js'

const props = defineProps({
  members: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  currentUserRole: {
    type: String,
    required: true
  },
  showHeader: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'retry',
  'invite',
  'changeRole',
  'removeMember',
  'leaveTodobook'
])

const memberActions = ref(null)
const currentMember = ref(null)

const canInvite = computed(() => {
  return ['owner', 'admin'].includes(props.currentUserRole)
})

const canManage = computed(() => {
  return ['owner', 'admin'].includes(props.currentUserRole)
})

const canRemoveMember = computed(() => {
  if (!currentMember.value) return false
  
  // 不能移除自己
  if (currentMember.value.user_id === currentUserId.value) return false
  
  // 只有所有者能移除管理员
  if (currentMember.value.role === 'admin' && props.currentUserRole !== 'owner') return false
  
  // 只有所有者和管理员能移除成员
  return ['owner', 'admin'].includes(props.currentUserRole)
})

const canChangeRole = computed(() => {
  if (!currentMember.value) return false
  
  // 不能修改自己的角色
  if (currentMember.value.user_id === currentUserId.value) return false
  
  // 只有所有者能修改角色
  return props.currentUserRole === 'owner'
})

const shouldShowMemberActions = (member) => {
  // owner对自己不显示菜单
  if (props.currentUserRole === 'owner' && member.user_id === currentUserId.value) {
    return false
  }
  
  // owner可以对其他成员显示菜单
  if (props.currentUserRole === 'owner') {
    return true
  }
  
  // admin可以对所有成员显示菜单（包括自己）
  if (props.currentUserRole === 'admin') {
    return true
  }
  
  // 普通成员只能对自己显示菜单
  return member.user_id === currentUserId.value
}

const handleRetry = () => {
  emit('retry')
}

const handleInvite = () => {
  emit('invite')
}

const handleMemberMenu = (member) => {
  currentMember.value = member
  memberActions.value?.open()
}

const handleChangeRole = (member, newRole) => {
  emit('changeRole', member, newRole)
}

const handleRemoveMember = (member) => {
  emit('removeMember', member)
}

const handleLeaveTodobook = (member) => {
  emit('leaveTodobook', member)
}

const handleMenuCancel = () => {
  currentMember.value = null
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.member-list {
  flex: 1;
}

.members-container {
  padding: 0 $padding-base;
}

.member-header {
  @include flex-between;
  align-items: center;
  padding: $padding-base 0;
  border-bottom: 1rpx solid $border-color-light;
  margin-bottom: $margin-base;
}

.member-title {
  font-size: $font-size-xl;
  color: $text-primary;
  font-weight: $font-weight-medium;
}

.invite-btn {
  @include flex-start;
  align-items: center;
  gap: $margin-xs;
  padding: $padding-sm $padding-base;
  background-color: rgba(0, 122, 255, 0.1);
  border-radius: $border-radius;
  transition: $transition-fast;
  
  &:active {
    background-color: rgba(0, 122, 255, 0.2);
    transform: scale(0.95);
  }
}

.invite-text {
  font-size: $font-size-sm;
  color: $primary-color;
  font-weight: $font-weight-medium;
}

.member-items {
  gap: $margin-sm;
}
</style>