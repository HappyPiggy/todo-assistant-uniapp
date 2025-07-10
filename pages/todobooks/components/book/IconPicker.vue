<template>
  <view class="icon-picker">
    <view 
      v-for="icon in iconOptions" 
      :key="icon.value"
      class="icon-item"
      :class="{ active: selectedIcon === icon.value }"
      @click="selectIcon(icon.value)">
      <view class="icon-preview" :style="{ backgroundColor: previewColor }">
        <uni-icons color="#ffffff" size="20" :type="icon.value" />
      </view>
      <text class="icon-name">{{ icon.name }}</text>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { getIconOptions } from '@/pages/todobooks/utils/bookUtils.js'

const props = defineProps({
  selectedIcon: {
    type: String,
    default: 'folder'
  },
  previewColor: {
    type: String,
    default: '#007AFF'
  }
})

const emit = defineEmits(['update:selectedIcon', 'change'])

const iconOptions = getIconOptions()

const selectIcon = (icon) => {
  emit('update:selectedIcon', icon)
  emit('change', icon)
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.icon-picker {
  @include flex-start;
  flex-wrap: wrap;
  gap: $margin-base;
  padding: $padding-base 0;
}

.icon-item {
  @include flex-column;
  align-items: center;
  width: 120rpx;
  cursor: pointer;
  
  &.active .icon-preview {
    border-color: $text-primary;
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.icon-preview {
  width: 60rpx;
  height: 60rpx;
  border-radius: $border-radius-small;
  @include flex-center;
  margin-bottom: $margin-xs;
  border: 2rpx solid transparent;
  transition: $transition-fast;
}

.icon-name {
  font-size: $font-size-sm;
  color: $text-secondary;
  text-align: center;
}
</style>