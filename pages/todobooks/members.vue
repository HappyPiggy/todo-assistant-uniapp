<template>
  <view class="members-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <view class="header-left" @click="goBack">
        <uni-icons color="#333333" size="20" type="left" />
      </view>
      <text class="page-title">成员管理</text>
      <view class="header-right">
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
      :current-user-role="currentUserRole"
      @invite="openInviteModal"
      @change-role="handleChangeRole"
      @remove-member="handleRemoveMember"
      @leave-todobook="handleLeaveTodobook"
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
      v-model:visible="confirmDialogVisible"
      :title="confirmDialogTitle"
      :message="confirmDialogMessage"
      :type="confirmDialogType"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MemberList from '@/pages/todobooks/components/member/MemberList.vue'
import InviteModal from '@/pages/todobooks/components/member/InviteModal.vue'
import RoleChangeModal from '@/pages/todobooks/components/member/RoleChangeModal.vue'
import ConfirmDialog from '@/pages/todobooks/components/common/ConfirmDialog.vue'
import { useMemberData } from '@/pages/todobooks/composables/useMemberData.js'
import { onLoad, onShow } from '@dcloudio/uni-app'

const bookId = ref(null)
const hasInitialized = ref(false) // 用于 onShow 判断是否为首次进入页面


const bookData = ref(null)

const {
  members,
  loading: membersLoading,
  error: membersError,
  currentMember,
  loadMembers,
  inviteUser,
  updateMemberRole,
  removeMember,
  leaveBook:currentUserLeaveBook
} = useMemberData()

// 计算当前用户角色
const currentUserRole = computed(() => {
  if (!currentMember.value) return 'member'
  return currentMember.value.role || 'member'
})

// 组件引用
const inviteModal = ref(null)
const roleChangeModal = ref(null)
const confirmDialog = ref(null)

// 选中的成员（用于操作）
const selectedMember = ref(null)
const confirmAction = ref(null)

// 确认对话框的状态
const confirmDialogVisible = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogType = ref('default')

onLoad((options) => {
  console.log("onLoad options", JSON.stringify(options, null, 2))
  if (options && options.id) {
    bookId.value = options.id
    
    // 如果有传递的bookData，直接使用；否则从云端获取
    if (options.bookData) {
      try {
        bookData.value = JSON.parse(decodeURIComponent(options.bookData))
        console.log('使用传递的bookData:', JSON.stringify(bookData.value, null, 2))
      } catch (error) {
        console.error('解析传递的bookData失败:', error)
      }
    } 
    
    loadMembers(bookId.value)
  } else {
    console.error('错误：未能从路由参数中获取到 id')
    uni.showToast({ title: '页面参数错误', icon: 'error' })
  }
})

onShow(() => {
  // 如果页面已经初始化过，并且 bookId 存在，则刷新数据
  if (hasInitialized.value && bookId.value) {
    Promise.all([
      loadMembers(bookId.value)
    ])
  }
})

onMounted(() => {
  hasInitialized.value = true
})

// 页面方法
const goBack = () => {
  uni.navigateBack()
}

const openInviteModal = () => {
  if (inviteModal.value && inviteModal.value.open) {
    inviteModal.value.open()
  }
}

const handleInviteConfirm = async (inviteData) => {
  try {
    await inviteUser(bookId.value, inviteData.nickname)
    uni.showToast({
      title: '邀请成功',
      icon: 'success'
    })
    // 重新加载成员列表
    loadMembers(bookId.value)
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
  if (roleChangeModal.value && roleChangeModal.value.open) {
    roleChangeModal.value.open()
  }
}

const handleRoleChangeConfirm = async (member, newRole) => {
  try {
    await updateMemberRole(bookId.value, member._id, newRole)
    uni.showToast({
      title: '角色更新成功',
      icon: 'success'
    })
    // 重新加载成员列表
    loadMembers(bookId.value)
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
  
  confirmDialogTitle.value = '确认移除'
  confirmDialogMessage.value = `确定要将 ${member['user_info.nickname'] || member.username} 移出项目册吗？`
  confirmDialogType.value = 'danger'
  confirmDialogVisible.value = true
}

const handleLeaveTodobook = (member) => {
  selectedMember.value = member
  confirmAction.value = 'leaveTodobook'
  
  confirmDialogTitle.value = '确认退出'
  confirmDialogMessage.value = '确定要退出这个项目册吗？退出后将无法访问项目册中的任务。'
  confirmDialogType.value = 'danger'
  confirmDialogVisible.value = true
}

const handleConfirm = async () => {
  if (confirmAction.value === 'removeMember' && selectedMember.value) {
    try {
      await removeMember(bookId.value, selectedMember.value.user_id)
      uni.showToast({
        title: '移除成功',
        icon: 'success'
      })
      // 重新加载成员列表
      loadMembers(bookId.value)
    } catch (error) {
      uni.showToast({
        title: '移除失败',
        icon: 'error'
      })
    }
  } else if (confirmAction.value === 'leaveTodobook' && selectedMember.value) {
    try {
      await currentUserLeaveBook(bookId.value)
      uni.showToast({
        title: '退出成功',
        icon: 'success'
      })
      // 退出成功后返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1000)
    } catch (error) {
      uni.showToast({
        title: '退出失败',
        icon: 'error'
      })
    }
  }
  
  // 清理状态
  selectedMember.value = null
  confirmAction.value = null
  confirmDialogVisible.value = false
}

const handleCancel = () => {
  // 清理状态
  selectedMember.value = null
  confirmAction.value = null
  confirmDialogVisible.value = false
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/variables.scss';
@import '@/pages/todobooks/styles/mixins.scss';

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