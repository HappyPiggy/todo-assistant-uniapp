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
          <text class="tab-count" v-if="filter.count !== undefined">{{ filter.count }}</text>
        </view>
      </view>
    </scroll-view>
    
    <!-- 右侧按钮组 -->
    <view class="action-buttons">
      <!-- 标签筛选按钮 -->
      <view class="tag-filter-btn" @click="showTagFilter">
        <text class="tag-icon">🏷️</text>
        <text class="tag-count" v-if="selectedTagsCount > 0">({{ selectedTagsCount }})</text>
      </view>
      
      <!-- 排序按钮 -->
      <TaskSort
        :todorbook-id="todorbookId"
        :current-sort="currentSort"
        @sort-change="handleSortChange"
      />
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
import TaskSort from './TaskSort.vue'

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
  },
  currentSort: {
    type: Object,
    default: () => ({ field: 'created_at', order: 'desc' })
  }
})

const emit = defineEmits(['filterChange', 'tagFilterChange', 'sortChange'])

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

const handleSortChange = (sortOption) => {
  console.log('TaskFilter: 排序变更', sortOption)
  emit('sortChange', sortOption)
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.task-filter {
  @include card-style(0);
  @include flex-between;
  padding: $padding-sm $padding-lg; /* 减少垂直padding */
  margin-bottom: $margin-sm;
  background-color: #f8f9fa; /* 稍微深一点的浅灰色背景 */
  border-bottom: 1rpx solid $gray-200; /* 稍微深一点的底部边框 */
  gap: $margin-lg; /* 增加左右两侧的间距 */
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06); /* 稍微增强阴影 */
}

.tab-scroll {
  flex: 1;
  width: 100%;
  margin-right: $margin-base; /* 左侧标签区域右边距 */
}

.tab-list {
  @include flex-start;
  gap: $margin-sm; /* 状态标签之间的间距 */
  /* #ifndef APP-NVUE */
  white-space: nowrap;
  /* #endif */
}

.tab-item {
  @include flex-column; /* 改为垂直布局 */
  @include flex-center; /* 居中对齐 */
  padding: 10rpx 14rpx; /* 减少内边距 */
  background-color: $bg-white; /* 白色背景在新的深色背景下更突出 */
  border-radius: 12rpx; /* 稍微调小圆角 */
  transition: $transition-fast;
  cursor: pointer;
  min-width: 70rpx; /* 减少最小宽度 */
  min-height: 50rpx; /* 减少最小高度 */
  text-align: center; /* 文字居中 */
  justify-content: center; /* 垂直居中 */
  border: 1rpx solid rgba(0, 0, 0, 0.06); /* 添加微妙边框 */
  
  &.active {
    background-color: $primary-color;
    border-color: $primary-color;
    
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
  font-size: $font-size-xs; /* 从 sm 改为 xs，字体更小 */
  color: $text-secondary;
  font-weight: $font-weight-medium;
  line-height: 1.1; /* 更紧凑的行高 */
}

.tab-count {
  font-size: 22rpx; /* 比 xs 更小的字体 */
  color: $text-tertiary;
  font-weight: $font-weight-bold; /* 数量字体加粗突出 */
  margin-top: 1rpx; /* 减少上边距 */
  line-height: 1; /* 紧凑的行高 */
}

// 右侧按钮组
.action-buttons {
  @include flex-center;
  gap: $margin-sm; /* 按钮之间的间距 */
  flex-shrink: 0; /* 防止缩小 */
}

.tag-filter-btn {
  @include flex-center;
  padding: 10rpx 14rpx; /* 与tab-item保持一致 */
  background-color: $bg-white; /* 与tab-item保持一致 */
  border-radius: 12rpx; /* 与tab-item保持一致 */
  transition: $transition-fast;
  cursor: pointer;
  min-width: 60rpx;
  min-height: 50rpx; /* 与tab-item保持一致 */
  border: 1rpx solid rgba(0, 0, 0, 0.06); /* 添加微妙边框 */
  
  &:active {
    transform: scale(0.95);
    background-color: $gray-50;
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