<template>
  <view class="task-filter">
    <scroll-view scroll-x class="tab-scroll">
      <view class="tab-list">
        <view 
          v-for="filter in filterTabs" 
          :key="filter.key"
          class="tab-item"
          :class="{ active: activeFilter === filter.key }"
          @click="setActiveFilter(filter.key)">
          <text class="tab-text">{{ filter.label }}</text>
          <text class="tab-count" v-if="filter.count !== undefined">({{ filter.count }})</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  filterTabs: {
    type: Array,
    required: true
  },
  activeFilter: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['filterChange'])

const setActiveFilter = (filter) => {
  emit('filterChange', filter)
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.task-filter {
  @include card-style(0);
  @include flex-start;
  padding: $padding-sm $padding-base;
  margin-bottom: $margin-sm;
}

.tab-scroll {
  flex: 1;
  width: 100%;
}

.tab-list {
  @include flex-start;
  /* #ifndef APP-NVUE */
  white-space: nowrap;
  /* #endif */
}

.tab-item {
  @include flex-start;
  padding: $padding-xs $padding-sm;
  background-color: $gray-100;
  border-radius: 16rpx;
  margin-right: $margin-xs;
  transition: $transition-fast;
  cursor: pointer;
  
  &.active {
    background-color: $primary-color;
    
    .tab-text,
    .tab-count {
      color: $bg-white;
    }
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.tab-text {
  font-size: $font-size-sm;
  color: $text-secondary;
  font-weight: $font-weight-medium;
}

.tab-count {
  font-size: $font-size-xs;
  color: $text-tertiary;
  margin-left: 4rpx;
}
</style>