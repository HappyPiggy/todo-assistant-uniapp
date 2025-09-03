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
					:class="['todobook-card', { pinned: isPinned(book._id) }]"
					:style="[getCardStyle(book), getPatternVars(book)]"
					@tap="openTodoBook(book)">
					<!-- 纹理图案：跨端可见（伪元素在部分平台不可用） -->
					<view class="card-pattern" aria-hidden="true">
						<view class="tri t1"></view>
						<view class="tri t2"></view>
						<view class="tri t3"></view>
					</view>
					
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
						<view class="book-actions" @tap.stop="showBookActions(book)">
							<uni-icons :color="isPinned(book._id) ? '#e6e6e6' : '#999999'" size="20" type="more-filled" />
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
						<text class="last-activity">{{ formatDateYMD(book.last_activity_at || book.updated_at) }}</text>
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
import { ref, computed, nextTick } from 'vue'
import { onLoad, onShow, onUnload, onPullDownRefresh } from '@dcloudio/uni-app'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { useBookData } from '@/pages/todobooks/composables/useBookData.js'
import { useDataAdapter } from '@/composables/useDataAdapter.js'
import { useAuthState } from '@/composables/useAuthState.js'
import { calculateProgress } from '@/pages/todobooks/utils/bookUtils.js'
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
    // 先更新当前项目册，再在下一个渲染周期打开弹窗，
    // 确保子组件拿到的 props 已是最新，避免置顶状态错位。
    currentBook.value = book
    nextTick(() => {
        actionSheetRef.value?.open()
    })
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

// UI辅助：绝对日期格式 YYYY/M/D
const formatDateYMD = (time) => {
	if (!time) return ''
	const d = new Date(time)
	if (isNaN(d.getTime())) return ''
	const y = d.getFullYear()
	const m = d.getMonth() + 1
	const day = d.getDate()
	return `${y}/${m}/${day}`
}

// UI辅助：根据书本颜色为置顶卡片生成描边与发光
const hexToRgb = (hex) => {
	if (!hex || typeof hex !== 'string') return null
	let h = hex.replace('#', '')
	if (h.length === 3) {
		// e.g. #abc -> aabbcc
		h = h.split('').map(c => c + c).join('')
	}
	if (h.length !== 6) return null
	const r = parseInt(h.substring(0, 2), 16)
	const g = parseInt(h.substring(2, 4), 16)
	const b = parseInt(h.substring(4, 6), 16)
	return { r, g, b }
}

const rgbToCss = ({ r, g, b }, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`

const lighten = (hex, amount = 0.25) => {
	const rgb = hexToRgb(hex)
	if (!rgb) return null
	const r = Math.round(rgb.r + (255 - rgb.r) * amount)
	const g = Math.round(rgb.g + (255 - rgb.g) * amount)
	const b = Math.round(rgb.b + (255 - rgb.b) * amount)
	return { r, g, b }
}

const getCardStyle = (book) => {
	if (!book) return {}
	if (!isPinned(book._id)) return {}
	const color = book.color || '#ffd60a'
	const glow = lighten(color, 0.2) || { r: 255, g: 214, b: 10 }
	return {
		borderColor: color,
		boxShadow: `0 10rpx 30rpx ${rgbToCss(glow, 0.35)}, 0 0 0 4rpx ${rgbToCss(glow, 0.25)}`,
	}
}

// 纹理差异化：基于 _id 生成稳定的“随机”参数，驱动 CSS 变量
const hashCode = (str = '') => {
	let h = 0
	for (let i = 0; i < String(str).length; i++) {
		h = (h << 5) - h + String(str).charCodeAt(i)
		h |= 0
	}
	return Math.abs(h)
}

const mapRange = (val, inMin, inMax, outMin, outMax) => {
	if (inMax === inMin) return outMin
	const t = (val - inMin) / (inMax - inMin)
	return outMin + t * (outMax - outMin)
}

const getPatternVars = (book) => {
	if (!book) return {}
	const seed = hashCode(book._id || book.title || 'seed')
	// 取不同位生成参数
	const r1 = (seed % 1000) / 1000 // 0-1
	const r2 = ((seed >> 3) % 1000) / 1000
	const r3 = ((seed >> 6) % 1000) / 1000
	const r4 = ((seed >> 9) % 1000) / 1000
	const r5 = ((seed >> 12) % 1000) / 1000

	// 旋转 [-12deg, 12deg]
	const rotate = mapRange(r1, 0, 1, -12, 12).toFixed(2) + 'deg'
    // 缩放 [1.08, 1.22]：确保旋转后仍铺满
    const scale = mapRange(r2, 0, 1, 1.08, 1.22).toFixed(2)
	// 背景偏移 [-60rpx, 60rpx]
	const posX = mapRange(r3, 0, 1, -60, 60).toFixed(0) + 'rpx'
	const posY = mapRange(r4, 0, 1, -40, 40).toFixed(0) + 'rpx'
	// 背景尺寸 [220rpx, 340rpx]
	const size = Math.round(mapRange(r5, 0, 1, 220, 340)) + 'rpx'
	// 透明度：置顶更低，普通更高（在样式中会叠加基础值）
	const baseOpacity = isPinned(book._id) ? 0.16 : 0.26
	const dynOpacity = Math.min(0.4, Math.max(0.14, baseOpacity + (r2 - 0.5) * 0.1))

	return {
		'--pat-rotate': rotate,
		'--pat-scale': scale,
		'--pat-pos-x': posX,
		'--pat-pos-y': posY,
		'--pat-size': size,
		'--pat-opacity': dynOpacity,
	}
}
</script>

<style lang="scss" scoped>
	@import "./list.scss";
</style>
