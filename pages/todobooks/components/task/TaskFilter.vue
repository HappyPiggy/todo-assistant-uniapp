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
    
    <!-- 标签筛选按钮 -->
    <view class="tag-filter-btn" @click="showTagFilter">
      <text class="tag-icon">🏷️</text>
      <text class="tag-count" v-if="selectedTagsCount > 0">({{ selectedTagsCount }})</text>
    </view>
    
    <!-- 标签筛选弹窗 -->
    <TagFilter 
      :show="tagFilterShow"
      :available-tags="availableTags"
      :selected-tags="selectedTags"
      :todorbook-id="todorbookId"
      @close="hideTagFilter"
      @confirm="handleTagConfirm"
    />
  </view>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
import TagFilter from './TagFilter.vue'

const props = defineProps({
  filterTabs: {
    type: Array,
    required: true
  },
  activeFilter: {
    type: String,
    default: 'all'
  },
  availableTags: {
    type: Array,
    default: () => []
  },
  selectedTags: {
    type: Array,
    default: () => []
  },
  todorbookId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['filterChange', 'tagFilterChange'])

const tagFilterShow = ref(false)

const selectedTagsCount = computed(() => {
  return props.selectedTags.length
})

const setActiveFilter = (filter) => {
  emit('filterChange', filter)
}

const showTagFilter = () => {
  tagFilterShow.value = true
}

const hideTagFilter = () => {
  tagFilterShow.value = false
}

const handleTagConfirm = (tags) => {
  emit('tagFilterChange', tags)
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.task-filter {
  @include card-style(0);
  @include flex-between;
  padding: $padding-sm $padding-base;
  margin-bottom: $margin-sm;
  background-color: $gray-50;
  border-top: 1rpx solid $gray-200;
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

.tag-filter-btn {
  @include flex-center;
  padding: $padding-xs $padding-sm;
  margin-left: $margin-sm;
  background-color: $gray-100;
  border-radius: 16rpx;
  transition: $transition-fast;
  cursor: pointer;
  min-width: 60rpx;
  
  &:active {
    transform: scale(0.95);
    background-color: $gray-200;
  }
  
  .tag-icon {
    font-size: $font-size-sm;
  }
  
  .tag-count {
    font-size: $font-size-xs;
    color: $text-secondary;
    margin-left: 4rpx;
    font-weight: $font-weight-medium;
  }
}
</style>