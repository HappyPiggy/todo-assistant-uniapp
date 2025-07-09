<template>
  <view class="loading-state">
    <uni-load-more :status="status" />
    <text v-if="text" class="loading-text">{{ text }}</text>
  </view>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: 'loading'
  },
  text: {
    type: String,
    default: ''
  }
})
</script>

<style lang="scss" scoped>
@import '../../styles/mixins.scss';

.loading-state {
  @include loading-state;
  
  .loading-text {
    margin-top: $margin-sm;
    font-size: $font-size-sm;
    color: $text-tertiary;
  }
}
</style>