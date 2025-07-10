<template>
  <view class="empty-state">
    <view class="empty-icon">
      <uni-icons 
        :type="icon" 
        :size="iconSize" 
        :color="iconColor" />
    </view>
    <text class="empty-title">{{ title }}</text>
    <text v-if="description" class="empty-description">{{ description }}</text>
    <view v-if="showAction" class="empty-actions">
      <button class="action-btn" @click="handleAction">
        {{ actionText }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '暂无数据'
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'list'
  },
  iconSize: {
    type: [String, Number],
    default: 60
  },
  iconColor: {
    type: String,
    default: '#cccccc'
  },
  showAction: {
    type: Boolean,
    default: false
  },
  actionText: {
    type: String,
    default: '去添加'
  }
})

const emit = defineEmits(['action'])

const handleAction = () => {
  emit('action')
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.empty-state {
  @include empty-state;
  
  .empty-icon {
    margin-bottom: $margin-base;
  }
  
  .empty-title {
    font-size: $font-size-lg;
    color: $text-tertiary;
    font-weight: $font-weight-medium;
    margin-bottom: $margin-sm;
  }
  
  .empty-description {
    font-size: $font-size-base;
    color: $text-tertiary;
    line-height: $line-height-lg;
    margin-bottom: $margin-base;
  }
  
  .empty-actions {
    margin-top: $margin-base;
  }
  
  .action-btn {
    @include button-primary;
    height: 72rpx;
    padding: 0 $padding-base;
    font-size: $font-size-base;
  }
}
</style>