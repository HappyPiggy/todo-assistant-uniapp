<template>
  <view class="members-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <view class="header-left" @click="goBack">
        <uni-icons color="#333333" size="20" type="left" />
      </view>
      <text class="page-title">成员管理</text>
      <view class="header-right" @click="openInviteModal">
        <uni-icons color="#007AFF" size="20" type="plus" />
      </view>
    </view>

    <!-- 项目册信息 -->
    <view class="book-info" v-if="bookData">
      <view class="book-meta">
        <view class="book-icon" :style="{ backgroundColor: bookData.color }">
          <uni-icons color="#ffffff" size="24" :type="bookData.icon" />
        </view>
        <view class="book-details">
          <text class="book-title">{{ bookData.title }}</text>
          <text class="book-description" v-if="bookData.description">{{ bookData.description }}</text>
        </view>
      </view>
    </view>

    <!-- 成员列表 -->
    <MemberList
      :members="members"
      :loading="membersLoading"
      :error="membersError"
      :current-user-id="currentUserId"
      :current-user-role="currentUserRole"
      @retry="loadMembers"
      @invite="openInviteModal"
      @change-role="handleChangeRole"
      @remove-member="handleRemoveMember"
    />

    <!-- 邀请弹窗 -->
    <InviteModal
      ref="inviteModal"
      :book-id="bookId"
      @confirm="handleInviteConfirm"
      @cancel="handleInviteCancel"
    />

    <!-- 角色更改弹窗 -->
    <RoleChangeModal
      ref="roleChangeModal"
      :current-member="selectedMember"
      @confirm="handleRoleChangeConfirm"
      @cancel="handleRoleChangeCancel"
    />

    <!-- 确认对话框 -->
    <ConfirmDialog
      ref="confirmDialog"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MemberList from './components/member/MemberList.vue'
import InviteModal from './components/member/InviteModal.vue'
import RoleChangeModal from './components/member/RoleChangeModal.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import { useMemberData } from './composables/useMemberData.js'
import { useBookData } from './composables/useBookData.js'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'

// 获取路由参数
const pages = getCurrentPages()
const currentPage = pages[pages.length - 1]
const bookId = currentPage.options.id

// 使用组合函数
const {
  bookData,
  loading: bookLoading,
  error: bookError,
  loadBookDetail
} = useBookData(bookId)

const {
  members,
  loading: membersLoading,
  error: membersError,
  currentUserRole,
  loadMembers,
  inviteMember,
  updateMemberRole,
  removeMember
} = useMemberData(bookId)

// 当前用户ID
const currentUserId = computed(() => {
  return store.userInfo?._id || ''
})

// 组件引用
const inviteModal = ref(null)
const roleChangeModal = ref(null)
const confirmDialog = ref(null)

// 选中的成员（用于操作）
const selectedMember = ref(null)
const confirmAction = ref(null)

// 页面方法
const goBack = () => {
  uni.navigateBack()
}

const openInviteModal = () => {
  inviteModal.value?.open()
}

const handleInviteConfirm = async (inviteData) => {
  try {
    await inviteMember(inviteData)
    uni.showToast({
      title: '邀请成功',
      icon: 'success'
    })
    // 重新加载成员列表
    loadMembers()
  } catch (error) {
    uni.showToast({
      title: '邀请失败',
      icon: 'error'
    })
  }
}

const handleInviteCancel = () => {
  // 邀请取消处理
}

const handleChangeRole = (member) => {
  selectedMember.value = member
  roleChangeModal.value?.open()
}

const handleRoleChangeConfirm = async (member, newRole) => {
  try {
    await updateMemberRole(member._id, newRole)
    uni.showToast({
      title: '角色更新成功',
      icon: 'success'
    })
    // 重新加载成员列表
    loadMembers()
  } catch (error) {
    uni.showToast({
      title: '角色更新失败',
      icon: 'error'
    })
  }
}

const handleRoleChangeCancel = () => {
  selectedMember.value = null
}

const handleRemoveMember = (member) => {
  selectedMember.value = member
  confirmAction.value = 'removeMember'
  
  confirmDialog.value?.open({
    title: '确认移除',
    content: `确定要将 ${member.nickname || member.username} 移出项目册吗？`,
    confirmText: '移除',
    cancelText: '取消'
  })
}

const handleConfirm = async () => {
  if (confirmAction.value === 'removeMember' && selectedMember.value) {
    try {
      await removeMember(selectedMember.value._id)
      uni.showToast({
        title: '移除成功',
        icon: 'success'
      })
      // 重新加载成员列表
      loadMembers()
    } catch (error) {
      uni.showToast({
        title: '移除失败',
        icon: 'error'
      })
    }
  }
  
  // 清理状态
  selectedMember.value = null
  confirmAction.value = null
}

const handleCancel = () => {
  // 清理状态
  selectedMember.value = null
  confirmAction.value = null
}

// 生命周期
onMounted(() => {
  loadBookDetail()
  loadMembers()
})
</script>

<style lang="scss" scoped>
@import './styles/variables.scss';
@import './styles/mixins.scss';

.members-page {
  min-height: 100vh;
  background-color: $bg-secondary;
  padding-bottom: $safe-area-bottom;
}

.page-header {
  @include flex-between;
  align-items: center;
  padding: $padding-base;
  background-color: $bg-white;
  border-bottom: 1rpx solid $border-color-light;
  /* #ifndef APP-NVUE */
  position: sticky;
  top: 0;
  z-index: $z-index-sticky;
  /* #endif */
}

.header-left,
.header-right {
  width: 60rpx;
  height: 60rpx;
  @include flex-center;
  border-radius: 50%;
  transition: $transition-fast;
  
  &:active {
    background-color: $gray-100;
  }
}

.page-title {
  font-size: $font-size-xl;
  color: $text-primary;
  font-weight: $font-weight-medium;
}

.book-info {
  @include card-style(0);
  margin: $margin-base;
  padding: $padding-lg;
  background-color: $bg-white;
}

.book-meta {
  @include flex-start;
  align-items: center;
}

.book-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  @include flex-center;
  margin-right: $margin-base;
  flex-shrink: 0;
}

.book-details {
  flex: 1;
}

.book-title {
  font-size: $font-size-lg;
  color: $text-primary;
  font-weight: $font-weight-medium;
  margin-bottom: $margin-xs;
  display: block;
}

.book-description {
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: $line-height-base;
  display: block;
}
</style>