<template>
  <view class="archive-page">
    <!-- 归档统计卡片 -->
    <view class="stats-section">
      <view class="stats-card">
        <view class="stats-header">
          <uni-icons type="chart-pie" size="20" color="#ffffff" />
          <text class="stats-title">归档统计</text>
        </view>
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-number">{{ archiveStats.totalBooks }}</text>
            <text class="stat-label">项目册</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ archiveStats.totalTasks }}</text>
            <text class="stat-label">总任务</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ archiveStats.completedTasks }}</text>
            <text class="stat-label">已完成</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ archiveStats.completionRate }}%</text>
            <text class="stat-label">完成率</text>
          </view>
        </view>
        <view class="stats-footer">
          <text class="stats-summary">共有 {{ archiveStats.totalMembers }} 位成员参与了这些项目</text>
        </view>
      </view>
    </view>
    
    <!-- 归档项目册列表 -->
    <view class="archive-list">
      <view 
        v-for="book in archivedBooks" 
        :key="book._id"
        class="archive-card"
        @click="openArchivedBook(book)">
        
        <view class="card-content">
          <view class="book-header">
            <view class="book-icon-small" :style="{ backgroundColor: book.color || '#007AFF' }">
              <uni-icons :type="book.icon || 'folder'" size="16" color="#ffffff" />
            </view>
            <view class="book-info">
              <text class="book-title">{{ book.title }}</text>
              <text class="archive-date">归档于 {{ formatDate(book.archived_at) }}</text>
            </view>
          </view>
          
          <view class="book-stats">
            <text class="stat-text">{{ book.item_count || 0 }} 任务</text>
            <text class="stat-divider">·</text>
            <text class="stat-text">{{ book.member_count || 1 }} 成员</text>
            <text class="stat-divider">·</text>
            <text class="stat-text">{{ calculateProgress(book) }}% 完成</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <uni-load-more status="loading" :content-text="{ contentdown: '上拉显示更多', contentrefresh: '正在加载...', contentnomore: '没有更多数据了' }" />
    </view>
    
    <!-- 空状态 -->
    <view v-if="!loading && archivedBooks.length === 0" class="empty-state">
      <uni-icons type="folder" size="60" color="#ccc" />
      <text class="empty-text">暂无归档项目册</text>
      <text class="empty-desc">已归档的项目册将显示在这里</text>
    </view>
    
    <!-- 错误状态 -->
    <view v-if="error && !loading" class="error-state">
      <uni-icons type="refresh" size="40" color="#999" />
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @click="loadData">重试</button>
    </view>
  </view>
</template>

<script>
import { useArchiveData } from './composables/useArchiveData.js'

export default {
  setup() {
    // 使用归档数据组合式函数
    const {
      archivedBooks,
      loading,
      error,
      archiveStats,
      loadArchivedBooks
    } = useArchiveData()

    // 格式化日期 - 显示具体的日期时间
    const formatDate = (dateString) => {
      if (!dateString) return ''
      
      try {
        const date = new Date(dateString)
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          console.warn('无效的日期字符串:', dateString)
          return dateString // 返回原始字符串作为fallback
        }
        
        // 格式化为 YYYY-MM-DD HH:mm
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        
        return `${year}-${month}-${day} ${hours}:${minutes}`
      } catch (error) {
        console.error('格式化日期时出错:', error, '原始值:', dateString)
        return dateString
      }
    }

    // 计算完成进度
    const calculateProgress = (book) => {
      if (!book.item_count || book.item_count === 0) return 0
      return Math.round((book.completed_count || 0) / book.item_count * 100)
    }

    // 打开归档项目册详情
    const openArchivedBook = (book) => {
      console.log('点击归档项目册:', JSON.stringify(book, null, 2))
      
      if (!book || !book._id) {
        console.error('项目册数据无效:', book)
        uni.showToast({
          title: '项目册数据异常',
          icon: 'none'
        })
        return
      }
      
      console.log('跳转到项目册详情:', book._id)
      uni.navigateTo({
        url: `/pages/todobooks/detail?id=${book._id}&from=archive&archived=true`
      })
    }

    // 加载数据
    const loadData = async () => {
      try {
        console.log('归档页面开始加载数据...')
        await loadArchivedBooks()
        
        console.log('============ 归档页面数据加载完成 ============')
        console.log('archivedBooks 响应式数据:', JSON.stringify(archivedBooks.value, null, 2))
        console.log('数据数量:', archivedBooks.value.length)
        
        // 验证每个项目册的 archived_at 字段和格式化结果
        archivedBooks.value.forEach((book, index) => {
          console.log(`验证归档项目册 ${index + 1}:`)
          console.log('  - 原始 archived_at:', book.archived_at)
          console.log('  - 格式化后时间:', formatDate(book.archived_at))
          console.log('  - Date 对象:', new Date(book.archived_at))
          console.log('  - 是否有效日期:', !isNaN(new Date(book.archived_at).getTime()))
        })
        console.log('============ 归档页面验证完成 ============')
        
      } catch (err) {
        console.error('加载归档数据失败:', err)
      }
    }

    return {
      archivedBooks,
      loading,
      error,
      archiveStats,
      formatDate,
      calculateProgress,
      openArchivedBook,
      loadData
    }
  },
  
  async onLoad() {
    console.log('归档管理页面加载')
    await this.loadData()
  },
  
  async onPullDownRefresh() {
    console.log('下拉刷新归档数据')
    try {
      await this.loadData()
    } finally {
      uni.stopPullDownRefresh()
    }
  }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>