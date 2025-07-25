<template>
  <uni-popup 
    ref="popup" 
    type="bottom" 
    background-color="#ffffff" 
    :safe-area="true"
    @maskClick="handleMaskClick">
    <view class="task-menu-sheet">
      <view class="menu-header">
        <text class="menu-title">{{ currentTask && currentTask.title ? currentTask.title : '任务操作' }}</text>
      </view>
      <view class="menu-list">
        <view class="menu-item" @click="handleTogglePin">
          <uni-icons 
            :color="isPinned ? '#FF6B6B' : '#007AFF'" 
            size="20" 
            :type="isPinned ? 'star-filled' : 'star'" 
          />
          <text class="menu-text">{{ isPinned ? '取消置顶' : '置顶任务' }}</text>
        </view>
        <view class="menu-item" @click="handleViewDetail">
          <uni-icons color="#007AFF" size="20" type="eye" />
          <text class="menu-text">查看详情</text>
        </view>
        <view class="menu-item" @click="handleEdit">
          <uni-icons color="#28a745" size="20" type="compose" />
          <text class="menu-text">编辑任务</text>
        </view>
        <view class="menu-item danger" @click="handleDelete">
          <uni-icons color="#FF4757" size="20" type="trash" />
          <text class="menu-text">删除任务</text>
        </view>
      </view>
      <view class="menu-cancel" @click="handleCancel">
        <text class="cancel-text">取消</text>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue'

const props = defineProps({
  currentTask: {
    type: Object,
    default: null
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  maskClosable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['viewDetail', 'edit', 'delete', 'toggle-pin', 'cancel'])

const popup = ref(null)

const open = () => {
  popup.value?.open()
}

const close = () => {
  popup.value?.close()
}

const handleViewDetail = () => {
  emit('viewDetail', props.currentTask)
  close()
}

const handleEdit = () => {
  emit('edit', props.currentTask)
  close()
}

const handleTogglePin = () => {
  emit('toggle-pin', props.currentTask)
  close()
}

const handleDelete = () => {
  emit('delete', props.currentTask)
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

.task-menu-sheet {
  background-color: $bg-white;
  border-radius: $border-radius-large $border-radius-large 0 0;
  padding-bottom: $padding-lg;
  /* #ifndef APP-NVUE */
  padding-bottom: calc(#{$padding-lg} + env(safe-area-inset-bottom));
  z-index: $z-index-popup;
  position: relative;
  /* #endif */
}

.menu-header {
  padding: $padding-base;
  border-bottom: 1rpx solid $border-color-light;
  @include flex-center;
}

.menu-title {
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

.menu-list {
  padding: 0 $padding-base;
}

.menu-item {
  @include flex-start;
  padding: $padding-lg $padding-base;
  border-radius: $border-radius-small;
  margin: $margin-xs 0;
  transition: $transition-fast;
  cursor: pointer;
  
  &:active {
    background-color: $gray-100;
  }
  
  &.danger .menu-text {
    color: $error-color;
  }
}

.menu-text {
  font-size: $font-size-lg;
  color: $text-primary;
  margin-left: $margin-sm;
}

.menu-cancel {
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