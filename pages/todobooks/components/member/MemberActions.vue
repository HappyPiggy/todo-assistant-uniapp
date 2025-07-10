<template>
  <uni-popup 
    ref="popup" 
    type="bottom" 
    background-color="#ffffff" 
    :safe-area="true"
    @maskClick="handleMaskClick">
    <view class="member-actions-sheet">
      <view class="actions-header">
        <text class="actions-title">{{ currentMember && currentMember.nickname ? currentMember.nickname : '成员操作' }}</text>
      </view>
      
      <view class="actions-list">
        <!-- 移除成员 (owner对其他成员) -->
        <view class="action-item danger" @click="handleRemoveMember" v-if="canRemove && !isSelf">
          <uni-icons color="#FF4757" size="20" type="trash" />
          <text class="action-text">移除</text>
        </view>
        
        <!-- 退出项目册 (普通成员对自己) -->
        <view class="action-item danger" @click="handleLeaveTodobook" v-if="isSelf && props.currentUserRole !== 'owner'">
          <uni-icons color="#FF4757" size="20" type="logout" />
          <text class="action-text">退出</text>
        </view>
      </view>
      
      <view class="actions-cancel" @click="handleCancel">
        <text class="cancel-text">取消</text>
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
  currentUserId: {
    type: String,
    required: true
  },
  currentUserRole: {
    type: String,
    required: true
  },
  canRemove: {
    type: Boolean,
    default: false
  },
  canChangeRole: {
    type: Boolean,
    default: false
  },
  maskClosable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'changeRole',
  'removeMember',
  'sendMessage',
  'leaveTodobook',
  'cancel'
])

const popup = ref(null)

const isSelf = computed(() => {
  return props.currentMember && props.currentMember.user_id === props.currentUserId
})

const open = () => {
  popup.value?.open()
}

const close = () => {
  popup.value?.close()
}

const handleChangeRole = () => {
  emit('changeRole', props.currentMember)
  close()
}

const handleSendMessage = () => {
  emit('sendMessage', props.currentMember)
  close()
}

const handleRemoveMember = () => {
  emit('removeMember', props.currentMember)
  close()
}

const handleLeaveTodobook = () => {
  emit('leaveTodobook', props.currentMember)
  close()
}

const handleCancel = () => {
  emit('cancel')
  close()
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

.member-actions-sheet {
  background-color: $bg-white;
  border-radius: $border-radius-large $border-radius-large 0 0;
  padding-bottom: $padding-lg;
  /* #ifndef APP-NVUE */
  padding-bottom: calc(#{$padding-lg} + env(safe-area-inset-bottom));
  z-index: $z-index-popup;
  position: relative;
  /* #endif */
}

.actions-header {
  padding: $padding-base;
  border-bottom: 1rpx solid $border-color-light;
  @include flex-center;
}

.actions-title {
  font-size: $font-size-xl;
  color: $text-primary;
  font-weight: $font-weight-medium;
  /* #ifndef APP-NVUE */
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  /* #endif */
}

.actions-list {
  padding: 0 $padding-base;
}

.action-item {
  @include flex-start;
  padding: $padding-lg $padding-base;
  border-radius: $border-radius-small;
  margin: $margin-xs 0;
  transition: $transition-fast;
  cursor: pointer;
  
  &:active {
    background-color: $gray-100;
  }
  
  &.danger .action-text {
    color: $error-color;
  }
}

.action-text {
  font-size: $font-size-lg;
  color: $text-primary;
  margin-left: $margin-sm;
}

.actions-cancel {
  margin: $margin-base;
  margin-bottom: $margin-xl;
  padding: $padding-lg;
  background-color: $gray-100;
  border-radius: $border-radius;
  @include flex-center;
  transition: $transition-fast;
  cursor: pointer;
  /* #ifndef APP-NVUE */
  margin-bottom: calc(#{$margin-xl} + env(safe-area-inset-bottom));
  /* #endif */
  
  &:active {
    background-color: $gray-200;
  }
}

.cancel-text {
  font-size: $font-size-lg;
  color: $text-secondary;
}
</style>