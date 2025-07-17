<template>
  <view class="statistics-overview-tab">
    <TaskStatsOverview 
      :stats-data="statsData"
      :book-data="bookData"
    />
  </view>
</template>

<script setup>
import { defineProps } from 'vue'
import TaskStatsOverview from './TaskStatsOverview.vue'

const props = defineProps({
  statsData: {
    type: Object,
    required: true
  },
  bookData: {
    type: Object,
    required: true
  }
})
</script>

<style lang="scss" scoped>
.statistics-overview-tab {
  padding: 0;
  
  // 确保内容在tab切换时有适当的间距
  :deep(.stats-overview) {
    margin-top: 0;
  }
}
</style>