<template>
  <view class="color-picker">
    <view 
      v-for="color in colorOptions" 
      :key="color.value"
      class="color-item"
      :class="{ active: selectedColor === color.value }"
      :style="{ backgroundColor: color.value }"
      @click="selectColor(color.value)">
      <uni-icons 
        v-if="selectedColor === color.value" 
        color="#ffffff" 
        size="16" 
        type="checkmarkempty" />
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { getColorOptions } from '../../utils/bookUtils.js'

const props = defineProps({
  selectedColor: {
    type: String,
    default: '#007AFF'
  }
})

const emit = defineEmits(['update:selectedColor', 'change'])

const colorOptions = getColorOptions()

const selectColor = (color) => {
  emit('update:selectedColor', color)
  emit('change', color)
}
</script>

<style lang="scss" scoped>
@import '../../styles/mixins.scss';

.color-picker {
  @include flex-start;
  flex-wrap: wrap;
  gap: $margin-base;
  padding: $padding-base 0;
}

.color-item {
  width: 60rpx;
  height: 60rpx;
  border-radius: 30rpx;
  @include flex-center;
  border: 3rpx solid transparent;
  transition: $transition-fast;
  cursor: pointer;
  
  &.active {
    border-color: $text-primary;
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
}
</style>