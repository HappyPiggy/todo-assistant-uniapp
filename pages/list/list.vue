<template>
	<view class="list-page">
		<!-- 顶部搜索栏 -->
		<view class="search-section">
			<uni-search-bar 
				v-model="searchKeyword" 
				placeholder="搜索项目册..." 
				@input="onSearchInput"
				@cancel="onSearchCancel"
				@confirm="onSearchConfirm"
				:focus="false">
			</uni-search-bar>
		</view>

		<!-- 项目册列表 -->
		<view class="todobooks-container">
			<!-- 加载状态 -->
			<view v-if="loading && todoBooks.length === 0" class="loading-section">
				<uni-load-more status="loading" />
			</view>

			<!-- 错误状态 -->
			<view v-else-if="error && todoBooks.length === 0" class="error-section">
				<text class="error-text">{{ error }}</text>
			</view>

			<!-- 空状态 -->
			<view v-else-if="!loading && todoBooks.length === 0" class="empty-section">
				<view class="empty-icon">
					<uni-icons color="#cccccc" size="80" type="folder" />
				</view>
				<text class="empty-text">{{ searchKeyword ? '没有找到相关项目册' : '还没有项目册，点击右下角创建吧' }}</text>
			</view>

			<!-- 项目册卡片列表 -->
			<view v-else class="todobooks-list">
				<view 
					v-for="book in todoBooks" 
					:key="book._id" 
					class="todobook-card"
					@click="openTodoBook(book)">
					
					<view class="card-header">
						<view class="book-icon" :style="{ backgroundColor: book.color }">
							<uni-icons color="#ffffff" size="24" :type="book.icon" />
						</view>
						<view class="book-info">
							<text class="book-title">{{ book.title }}</text>
							<text class="book-description" v-if="book.description">{{ book.description }}</text>
						</view>
						<view class="book-actions" @click.stop="showBookActions(book)">
							<uni-icons color="#999999" size="20" type="more-filled" />
						</view>
					</view>

					<view class="card-stats">
						<view class="stat-item">
							<text class="stat-number">{{ book.item_count || 0 }}</text>
							<text class="stat-label">总任务</text>
						</view>
						<view class="stat-item">
							<text class="stat-number">{{ book.completed_count || 0 }}</text>
							<text class="stat-label">已完成</text>
						</view>
						<view class="stat-item">
							<text class="stat-number">{{ book.member_count || 1 }}</text>
							<text class="stat-label">成员</text>
						</view>
						<view class="stat-item">
							<text class="stat-number">{{ calculateProgress(book) }}%</text>
							<text class="stat-label">进度</text>
						</view>
					</view>

					<view class="card-progress">
						<view class="progress-bar">
							<view class="progress-fill" :style="{ width: calculateProgress(book) + '%', backgroundColor: book.color }"></view>
						</view>
					</view>

					<view class="card-footer">
						<text class="last-activity">{{ formatRelativeTime(book.last_activity_at || book.updated_at) }}</text>
						<view v-if="book.member_count > 1" class="share-badge">
							<uni-icons color="#28a745" size="14" type="checkmarkempty" />
							<text class="share-text">协作</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 浮动添加按钮 -->
		<view class="fab-container">
			<view class="fab-button" @click="createTodoBook">
				<uni-icons color="#ffffff" size="28" type="plus" />
			</view>
		</view>

		<!-- 操作弹窗 -->
		<uni-popup ref="actionPopupRef" type="bottom" background-color="#ffffff" :safe-area="true">
			<view class="action-sheet">
				<view class="action-header">
					<text class="action-title">{{ currentBook?.title }}</text>
				</view>
				<scroll-view scroll-y class="action-scroll">
					<view class="action-list">
					<view class="action-item" @click="handleEditTodoBook">
						<uni-icons color="#007AFF" size="20" type="compose" />
						<text class="action-text">编辑</text>
					</view>
					<view class="action-item" @click="handleShareTodoBook">
						<uni-icons color="#28a745" size="20" type="staff" />
						<text class="action-text">成员管理</text>
					</view>
					<view class="action-item" @click="handleShowStatistics">
						<uni-icons color="#17a2b8" size="20" type="bars" />
						<text class="action-text">数据统计</text>
					</view>
					<view class="action-item" @click="handleExportTasks">
						<uni-icons color="#6c757d" size="20" type="download" />
						<text class="action-text">导出任务</text>
					</view>
					<view class="action-item" @click="handleArchiveTodoBook">
						<uni-icons color="#ffc107" size="20" type="folder-add" />
						<text class="action-text">归档</text>
					</view>
					<view class="action-item danger" @click="handleDeleteTodoBook">
						<uni-icons color="#FF4757" size="20" type="trash" />
						<text class="action-text">删除</text>
					</view>
					</view>
				</scroll-view>
				<view class="action-cancel" @click="hideActionSheet">
					<text class="cancel-text">取消</text>
				</view>
				<!-- 底部占位空间，确保不被tab栏遮挡 -->
				<view class="bottom-spacer"></view>
			</view>
		</uni-popup>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { useBookData } from '@/pages/todobooks/composables/useBookData.js'
import { calculateProgress, formatRelativeTime } from '@/pages/todobooks/utils/bookUtils.js'

// 使用 todobook 操作组合式函数
const { 
	loadTodoBooks,
	archiveTodoBook: archiveTodoBookInStore,
	deleteTodoBook: deleteTodoBookInStore
} = useBookData()

// 页面响应式数据
const loading = ref(false)
const error = ref(null)
const todoBooks = ref([])
const searchKeyword = ref('')
const searchTimer = ref(null)
const loadMoreStatus = ref('more')
const currentBook = ref(null)
const actionPopupRef = ref(null)

// 计算属性
const hasLogin = computed(() => store.hasLogin)

// 页面生命周期
onLoad(() => {
	// 只检查登录状态，不加载数据
	if (!hasLogin.value) {
		uni.showToast({
			title: '请先登录',
			icon: 'none'
		})
		setTimeout(() => {
			uni.navigateTo({
				url: '/pages/login/login-withpwd'
			})
		}, 1500)
	}
	
	// 监听缓存更新事件
	uni.$on('todobooks-cache-updated', onCacheUpdated)
	
	// 监听用户切换事件
	uni.$on('user-switched', onUserSwitched)
})

onShow(() => {
	// 统一在onShow中处理数据加载，避免重复请求
	if (hasLogin.value) {
		loadTodoBooksOptimized()
	}
})

onUnload(() => {
	// 清理定时器
	if (searchTimer.value) {
		clearTimeout(searchTimer.value)
	}
	
	// 移除事件监听
	uni.$off('todobooks-cache-updated', onCacheUpdated)
	uni.$off('user-switched', onUserSwitched)
})

// 数据加载方法
const loadTodoBooksOptimized = async () => {
	if (loading.value) return
	
	try {
		loading.value = true
		error.value = null
		
		const books = await loadTodoBooks({
			keyword: searchKeyword.value
		})
		
		todoBooks.value = books
		loadMoreStatus.value = 'noMore'
		
	} catch (err) {
		console.error('加载项目册失败:', err)
		error.value = '加载失败，请重试'
		uni.showToast({
			title: '加载失败，请重试',
			icon: 'none'
		})
	} finally {
		loading.value = false
		uni.stopPullDownRefresh()
	}
}

// 刷新数据
const refreshTodoBooks = async () => {
	try {
		loading.value = true
		error.value = null
		
		const books = await loadTodoBooks({ keyword: searchKeyword.value }, true)
		todoBooks.value = books
		loadMoreStatus.value = 'noMore'
		
	} catch (err) {
		console.error('刷新项目册失败:', err)
		error.value = '刷新失败，请重试'
		uni.showToast({
			title: '刷新失败，请重试',
			icon: 'none'
		})
	} finally {
		loading.value = false
		uni.stopPullDownRefresh()
	}
}

// 搜索相关方法
const onSearchInput = (value) => {
	searchKeyword.value = value
	// 使用防抖处理
	clearTimeout(searchTimer.value)
	searchTimer.value = setTimeout(() => {
		refreshTodoBooks()
	}, 500)
}

const onSearchCancel = () => {
	searchKeyword.value = ''
	refreshTodoBooks()
}

const onSearchConfirm = () => {
	refreshTodoBooks()
}

// 事件处理方法
const onCacheUpdated = (updatedBooks) => {
	console.log('收到缓存更新通知，刷新页面数据，数据条数:', updatedBooks.length)
	console.log('更新前页面数据条数:', todoBooks.value.length)
	
	todoBooks.value = updatedBooks
	loadMoreStatus.value = 'noMore'
	
	console.log('更新后页面数据条数:', todoBooks.value.length)
}

const onUserSwitched = (newUserId) => {
	console.log('收到用户切换通知，清空页面数据')
	
	// 清空当前显示的数据
	todoBooks.value = []
	loadMoreStatus.value = 'more'
	loading.value = false
	error.value = null
	
	// 如果新用户已登录，重新加载数据
	if (newUserId && hasLogin.value) {
		setTimeout(() => {
			loadTodoBooksOptimized()
		}, 500)
	}
}

// 下拉刷新
const onPullDownRefresh = () => {
	refreshTodoBooks()
}

// 导出下拉刷新方法供页面使用
defineExpose({
	onPullDownRefresh
})

// 页面导航方法
const openTodoBook = (book) => {
	uni.navigateTo({
		url: `/pages/todobooks/detail?id=${book._id}`
	})
}

const createTodoBook = () => {
	uni.navigateTo({
		url: '/pages/todobooks/create'
	})
}

// 操作弹窗相关方法
const showBookActions = (book) => {
	currentBook.value = book
	actionPopupRef.value?.open()
}

const hideActionSheet = () => {
	actionPopupRef.value?.close()
	currentBook.value = null
}

// 处理各种操作
const handleEditTodoBook = () => {
	const bookId = currentBook.value?._id
	hideActionSheet()
	if (bookId) {
		uni.navigateTo({
			url: `/pages/todobooks/edit?id=${bookId}`
		})
	}
}

const handleShareTodoBook = () => {
	const bookId = currentBook.value?._id
	hideActionSheet()
	if (bookId) {
		uni.navigateTo({
			url: `/pages/todobooks/members?id=${bookId}`
		})
	}
}

const handleShowStatistics = () => {
	const bookId = currentBook.value?._id
	hideActionSheet()
	if (bookId) {
		uni.navigateTo({
			url: `/pages/todobooks/statistics?id=${bookId}`
		})
	}
}

const handleExportTasks = () => {
	hideActionSheet()
	uni.showToast({
		title: '功能开发中',
		icon: 'none'
	})
}

const handleArchiveTodoBook = async () => {
	// 先保存要归档的项目册引用
	const bookToArchive = currentBook.value
	hideActionSheet()
	
	uni.showModal({
		title: '确认归档',
		content: '归档后的项目册将移动到归档列表中，确定要归档吗？',
		success: async (res) => {
			if (res.confirm) {
				try {
					await archiveTodoBookInStore(bookToArchive._id)
					
					uni.showToast({
						title: '归档成功',
						icon: 'success'
					})
					
					// 刷新列表
					refreshTodoBooks()
				} catch (err) {
					console.error('归档失败:', err)
					uni.showToast({
						title: err.message || '归档失败',
						icon: 'error'
					})
				}
			}
		}
	})
}

const handleDeleteTodoBook = async () => {
	// 先保存要删除的项目册引用
	const bookToDelete = currentBook.value
	hideActionSheet()
	
	uni.showModal({
		title: '确认删除',
		content: '删除后无法恢复，确定要删除这个项目册吗？',
		confirmColor: '#FF4757',
		success: async (res) => {
			if (res.confirm) {
				try {
					uni.showLoading({
						title: '删除中...'
					})
					
					await deleteTodoBookInStore(bookToDelete._id)
					
					uni.hideLoading()
					
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					})
					
					// 刷新列表
					refreshTodoBooks()
				} catch (err) {
					uni.hideLoading()
					console.error('删除失败:', err)
					uni.showToast({
						title: err.message || '删除失败',
						icon: 'error'
					})
				}
			}
		}
	})
}
</script>

<style lang="scss" scoped>
	@import "./list.scss";
</style>