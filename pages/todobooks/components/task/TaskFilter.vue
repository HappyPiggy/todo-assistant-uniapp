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
    <view class="add-task-btn" @click="handleAddTask">
      <uni-icons color="#007AFF" size="20" type="plus" />
    </view>
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

const emit = defineEmits(['filterChange', 'addTask'])

const setActiveFilter = (filter) => {
  emit('filterChange', filter)
}

const handleAddTask = () => {
  emit('addTask')
}
</script>

<style lang="scss" scoped>
@import '../../styles/mixins.scss';

.task-filter {
  @include card-style(0);
  @include flex-start;
  padding: $padding-base;
  margin-bottom: $margin-base;
}

.tab-scroll {
  flex: 1;
}

.tab-list {
  @include flex-start;
  /* #ifndef APP-NVUE */
  white-space: nowrap;
  /* #endif */
}

.tab-item {
  @include flex-start;
  padding: $padding-sm $padding-base;
  background-color: $gray-100;
  border-radius: 20rpx;
  margin-right: $margin-sm;
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
  font-size: $font-size-base;
  color: $text-secondary;
  font-weight: $font-weight-medium;
}

.tab-count {
  font-size: $font-size-sm;
  color: $text-tertiary;
  margin-left: $margin-xs;
}

.add-task-btn {
  width: 60rpx;
  height: 60rpx;
  background-color: rgba(0, 122, 255, 0.1);
  border-radius: 30rpx;
  @include flex-center;
  margin-left: $margin-sm;
  transition: $transition-fast;
  
  &:active {
    background-color: rgba(0, 122, 255, 0.2);
    transform: scale(0.95);
  }
}
</style>