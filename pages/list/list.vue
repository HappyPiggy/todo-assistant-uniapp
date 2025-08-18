<template>
	<view class="list-page">
		<!-- 顶部搜索按钮 -->
		<view class="search-header">
			<text class="page-title">项目册</text>
			<view class="search-button" @click="handleSearchClick">
				<uni-icons color="#ffffff" size="20" type="search" />
				<!-- 搜索提示点 -->
				<view v-if="hasSearchKeyword" class="search-indicator"></view>
			</view>
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
				<text class="empty-text">{{ getEmptyStateText() }}</text>
			</view>

			<!-- 项目册卡片列表 -->
			<view v-else class="todobooks-list">
				<view 
					v-for="book in sortedTodoBooks" 
					:key="book._id" 
					class="todobook-card"
					@click="openTodoBook(book)">
					
					<view class="card-header">
						<view class="book-icon" :style="{ backgroundColor: book.color }">
							<uni-icons color="#ffffff" size="24" :type="book.icon" />
						</view>
						<view class="book-info">
							<view class="book-title-line">
								<uni-icons 
									v-if="isPinned(book._id)" 
									color="#FF6B6B" 
									size="16" 
									type="star-filled" 
									class="pin-icon"
								/>
								<text class="book-title">{{ book.title }}</text>
							</view>
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
						<view class="badges-container">
							<!-- 本地数据标识 -->
							<view v-if="book.is_local" class="local-badge">
								<uni-icons color="#FF9500" size="14" type="gear" />
								<text class="local-text">本地</text>
							</view>
							<!-- 协作标识 -->
							<view v-if="book.member_count > 1" class="share-badge">
								<uni-icons color="#28a745" size="14" type="checkmarkempty" />
								<text class="share-text">协作</text>
							</view>
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

		<!-- 搜索弹窗 -->
		<SearchOverlay
			:visible="showSearchOverlay"
			:keyword="searchKeyword"
			title="搜索项目册"
			@search="handleSearchOverlaySearch"
			@clear="handleSearchOverlayClear"
			@close="handleSearchOverlayClose"
		/>

		<!-- 操作弹窗 -->
		<TodoBookActionSheet
			ref="actionSheetRef"
			:book-data="currentBook"
			:show-pin="true"
			:show-archive="true"
			:show-delete="true"
			page-type="list"
			@action-completed="handleActionCompleted"
		/>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow, onUnload, onPullDownRefresh } from '@dcloudio/uni-app'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { useBookData } from '@/pages/todobooks/composables/useBookData.js'
import { useDataAdapter } from '@/composables/useDataAdapter.js'
import { useAuthState } from '@/composables/useAuthState.js'
import { calculateProgress, formatRelativeTime } from '@/pages/todobooks/utils/bookUtils.js'
import { usePinning } from '@/composables/usePinning.js'
import { usePageTokenListener } from '@/composables/usePageTokenListener.js'
import TodoBookActionSheet from '@/pages/todobooks/components/TodoBookActionSheet.vue'
import SearchOverlay from '@/pages/todobooks/components/task/SearchOverlay.vue'

// 使用数据适配器和认证状态管理
const dataAdapter = useDataAdapter()
const { isGuest, userMode, getPageTitlePrefix } = useAuthState()

// 使用 todobook 操作组合式函数（作为备用）
const { 
	loadTodoBooks: cloudLoadTodoBooks
} = useBookData()

// 页面响应式数据
const loading = ref(false)
const error = ref(null)
const todoBooks = ref([])
const searchKeyword = ref('')
const searchTimer = ref(null)
const loadMoreStatus = ref('more')
const currentBook = ref(null)
const actionSheetRef = ref(null)
const showSearchOverlay = ref(false) // 搜索弹窗显示状态

// 置顶功能
const { sortedItems: sortedTodoBooks, isPinned, togglePin, refreshPinnedIds } = usePinning('todobooks', todoBooks)

// 页面token过期监听
usePageTokenListener({
	pageName: '项目册列表页',
	redirectToLogin: false, // 不跳转，因为list页面本身就支持访客模式
	onTokenExpired: () => {
		// 清理页面数据
		todoBooks.value = []
		error.value = null
		loading.value = false
		console.log('项目册列表页: token过期，已清理页面数据，切换到访客模式')
		// 刷新页面数据，以访客模式重新加载
		setTimeout(() => {
			loadData()
		}, 2000)
	}
})

// 计算属性
const hasLogin = computed(() => {
	const loginStatus = store.hasLogin
	console.log('list.vue hasLogin computed:', loginStatus, 'store.userInfo:', JSON.stringify(store.userInfo, null, 2))
	return loginStatus
})

// 为了保持兼容，基于 hasLogin 计算 isGuest
const isGuestComputed = computed(() => {
	const guestStatus = !hasLogin.value
	console.log('list.vue isGuestComputed:', guestStatus)
	return guestStatus
})

// 页面标题（显示访客模式标识）
const pageTitle = computed(() => {
	return `${getPageTitlePrefix()}大薯的记录册`
})

// 检查是否有搜索关键词
const hasSearchKeyword = computed(() => {
	return searchKeyword.value && searchKeyword.value.trim().length > 0
})

// 页面生命周期
onLoad(() => {
	// 设置页面标题
	uni.setNavigationBarTitle({
		title: pageTitle.value
	})
	
	// 监听数据更新事件
	uni.$on('todobooks-updated', onCacheUpdated)
	
	// 监听用户切换事件
	uni.$on('user-switched', onUserSwitched)
	
	// 监听用户登录状态变化
	uni.$on('user-login-status-changed', onUserLoginStatusChanged)
	
	// 监听全局登录状态变化事件
	uni.$on('login-status-changed', onLoginStatusChanged)
	
	// 监听刷新访客数据事件
	uni.$on('refresh-guest-data', () => {
		console.log('收到refresh-guest-data事件，重新加载访客数据')
		setTimeout(() => {
			loadTodoBooksOptimized()
		}, 500)
	})
})

onShow(() => {
	// 更新页面标题（可能登录状态发生了变化）
	uni.setNavigationBarTitle({
		title: pageTitle.value
	})
	
	// 始终加载数据（无论是否登录）
	loadTodoBooksOptimized()
})

onUnload(() => {
	// 清理定时器
	if (searchTimer.value) {
		clearTimeout(searchTimer.value)
	}
	
	// 移除事件监听
	uni.$off('todobooks-updated', onCacheUpdated)
	uni.$off('user-switched', onUserSwitched)
	uni.$off('user-login-status-changed', onUserLoginStatusChanged)
	uni.$off('login-status-changed', onLoginStatusChanged)
	uni.$off('refresh-guest-data')
})

// 数据加载方法
const loadTodoBooksOptimized = async () => {
	if (loading.value) return
	
	try {
		loading.value = true
		error.value = null
		
		// 使用数据适配器加载数据（自动根据登录状态选择数据源）
		const books = await dataAdapter.getTodoBooks({
			keyword: searchKeyword.value
		})
		
		todoBooks.value = books || []
		loadMoreStatus.value = 'noMore'
		
	} catch (err) {
		console.error('加载项目册失败:', err, JSON.stringify(err, null, 2))
		error.value = '加载失败，请重试'
		
		// 访客模式下的错误处理更温和一些
		if (isGuestComputed.value) {
			console.log('访客模式加载失败，将重置本地存储')
			// 可以考虑重置或修复本地存储
		} else {
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none'
			})
		}
	} finally {
		loading.value = false
	}
}

// 刷新数据（用于下拉刷新）
const refreshTodoBooks = async (isFromPullDown = false) => {
	try {
		loading.value = true
		error.value = null
		
		// 使用数据适配器刷新数据
		const books = await dataAdapter.getTodoBooks({ 
			keyword: searchKeyword.value 
		})
		todoBooks.value = books || []
		loadMoreStatus.value = 'noMore'
		
	} catch (err) {
		console.error('刷新项目册失败:', err, JSON.stringify(err, null, 2))
		error.value = '刷新失败，请重试'
		
		if (!isGuestComputed.value) {
			uni.showToast({
				title: '刷新失败，请重试',
				icon: 'none'
			})
		}
	} finally {
		loading.value = false
		// 只有在下拉刷新时才停止刷新状态
		if (isFromPullDown) {
			uni.stopPullDownRefresh()
		}
	}
}

// 搜索弹窗处理函数
const handleSearchClick = () => {
	showSearchOverlay.value = true
}

const handleSearchOverlaySearch = (keyword) => {
	searchKeyword.value = keyword
	showSearchOverlay.value = false
	// 使用防抖处理
	clearTimeout(searchTimer.value)
	searchTimer.value = setTimeout(() => {
		refreshTodoBooks(false)
	}, 300)
}

const handleSearchOverlayClear = () => {
	searchKeyword.value = ''
	refreshTodoBooks(false)
}

const handleSearchOverlayClose = () => {
	showSearchOverlay.value = false
}

// 清除搜索（现在通过搜索弹窗处理）
const clearSearch = () => {
	searchKeyword.value = ''
	refreshTodoBooks(false)
}

// 事件处理方法
const onCacheUpdated = (updatedBooks) => {
	console.log('TodoBooks数据已更新')
	
	// 参数验证和防护：确保 updatedBooks 是有效数组
	if (Array.isArray(updatedBooks)) {
		// 如果传入了更新后的数据，直接使用
		todoBooks.value = updatedBooks
		loadMoreStatus.value = 'noMore'
	} else {
		// 如果没有传入数据或数据无效，重新加载数据
		console.log('重新加载项目册数据...')
		loadTodoBooksOptimized()
	}
}

const onUserSwitched = (newUserId) => {
	console.log('收到用户切换通知，清空页面数据')
	
	// 清空当前显示的数据
	todoBooks.value = []
	loadMoreStatus.value = 'more'
	loading.value = false
	error.value = null
	
	// 刷新置顶ids
	refreshPinnedIds()
	
	// 如果新用户已登录，重新加载数据
	if (newUserId && hasLogin.value) {
		setTimeout(() => {
			loadTodoBooksOptimized()
		}, 500)
	}
}

// 注册下拉刷新生命周期
onPullDownRefresh(() => {
	console.log('触发下拉刷新')
	refreshPinnedIds() // 刷新置顶状态
	refreshTodoBooks(true)
})

// 页面导航方法
const openTodoBook = (book) => {
	uni.navigateTo({
		url: `/pages/todobooks/detail?id=${book._id}&filter=all&from=list`
	})
}

const createTodoBook = () => {
	uni.navigateTo({
		url: '/pages/todobooks/form'
	})
}

// 操作弹窗相关方法
const showBookActions = (book) => {
	currentBook.value = book
	actionSheetRef.value?.open()
}

// 处理操作完成事件
const handleActionCompleted = (result) => {
	console.log('操作完成:', result)
	
	// 如果是需要刷新列表的操作，包括置顶操作
	if (['archive', 'delete', 'pin'].includes(result.type) && result.success) {
		// 置顶操作只需要刷新置顶状态，不需要重新加载数据
		if (result.type === 'pin') {
			refreshPinnedIds()
		} else {
			refreshTodoBooks(false)
		}
	}
}

// 处理用户登录状态变化
const onUserLoginStatusChanged = (eventData) => {
	console.log('用户登录状态变化:', eventData)
	
	// 更新页面标题
	uni.setNavigationBarTitle({
		title: pageTitle.value
	})
	
	// 重新加载数据（会自动切换数据源）
	loadTodoBooksOptimized()
}

// 处理全局登录状态变化事件
const onLoginStatusChanged = (eventData) => {
	console.log('收到全局登录状态变化事件:', eventData)
	
	// 更新页面标题
	uni.setNavigationBarTitle({
		title: pageTitle.value
	})
	
	// 重新加载数据（会自动切换数据源）
	loadTodoBooksOptimized()
}

// 注意：onCacheUpdated函数已在上面定义，这里不需要重复定义

// 注意：onUserSwitched函数已在上面定义，这里不需要重复定义

// 获取空状态提示文案
const getEmptyStateText = () => {
	if (searchKeyword.value) {
		return '没有找到相关项目册'
	}
	
	if (isGuestComputed.value) {
		return '还没有项目册，点击右下角创建第一个项目册吧'
	}
	
	return '还没有项目册，点击右下角创建吧'
}
</script>

<style lang="scss" scoped>
	@import "./list.scss";
</style>