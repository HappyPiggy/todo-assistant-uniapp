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
						<text class="last-activity">{{ formatTime(book.last_activity_at || book.updated_at) }}</text>
						<view v-if="book.member_count > 1" class="share-badge">
							<uni-icons color="#28a745" size="14" type="checkmarkempty" />
							<text class="share-text">协作</text>
						</view>
					</view>
				</view>
				
				<!-- 加载更多 -->
				<view class="refresh-section" v-if="todoBooks.length > 0">
					<uni-load-more :status="loadMoreStatus" @clickLoadMore="loadMore" />
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
		<uni-popup ref="actionPopup" type="bottom" background-color="#ffffff" :safe-area="true">
			<view class="action-sheet">
				<view class="action-header">
					<text class="action-title">{{ currentBook?.title }}</text>
				</view>
				<scroll-view scroll-y class="action-scroll">
					<view class="action-list">
					<view class="action-item" @click="editTodoBook">
						<uni-icons color="#007AFF" size="20" type="compose" />
						<text class="action-text">编辑</text>
					</view>
					<view class="action-item" @click="shareTodoBook">
						<uni-icons color="#28a745" size="20" type="staff" />
						<text class="action-text">成员管理</text>
					</view>
					<view class="action-item" @click="showStatistics">
						<uni-icons color="#17a2b8" size="20" type="bars" />
						<text class="action-text">数据统计</text>
					</view>
					<view class="action-item" @click="exportTasks">
						<uni-icons color="#6c757d" size="20" type="download" />
						<text class="action-text">导出任务</text>
					</view>
					<view class="action-item" @click="archiveTodoBook">
						<uni-icons color="#ffc107" size="20" type="folder-add" />
						<text class="action-text">归档</text>
					</view>
					<view class="action-item danger" @click="deleteTodoBook">
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

<script>
	import {
		store
	} from '@/uni_modules/uni-id-pages/common/store.js'
	import { currentUserId } from '@/store/storage.js'
	import globalStore from '@/store/index.js'
	
	export default {
		data() {
			return {
				// 新增
				loading: false,
				error: null,
				todoBooks: [],
				totalCount: 0,
				searchTimer: null,
				isFirstLoad: true, // 添加首次加载标识
				
				// 保留原有
				searchKeyword: '',
				currentBook: null,
				loadMoreStatus: 'more',
				
				// 修改分页相关
				currentPage: 1,
				pageSize: 10,
				hasMore: true
			}
		},
		computed: {
			hasLogin() {
				return store.hasLogin
			}
		},
		onShow() {
			// 统一在onShow中处理数据加载，避免重复请求
			if (this.hasLogin) {
				this.loadTodoBooksOptimized()
			}
		},
		onLoad() {
			// 只检查登录状态，不加载数据
			if (!this.hasLogin) {
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
			uni.$on('todobooks-cache-updated', this.onCacheUpdated)
			
			// 监听用户切换事件
			uni.$on('user-switched', this.onUserSwitched)
		},
		onPullDownRefresh() {
			this.refreshTodoBooks()
		},
		onReachBottom() {
			this.loadMore()
		},
		onUnload() {
			// 清理定时器
			if (this.searchTimer) {
				clearTimeout(this.searchTimer)
			}
			
			// 移除事件监听
			uni.$off('todobooks-cache-updated', this.onCacheUpdated)
			uni.$off('user-switched', this.onUserSwitched)
		},
		methods: {
			// 处理缓存更新事件
			onCacheUpdated(updatedBooks) {
				console.log('收到缓存更新通知，刷新页面数据，数据条数:', updatedBooks.length)
				console.log('更新前页面数据条数:', this.todoBooks.length)
				
				this.todoBooks = updatedBooks
				this.totalCount = updatedBooks.length
				this.loadMoreStatus = 'noMore'
				
				console.log('更新后页面数据条数:', this.todoBooks.length)
				
				// 可选：显示更新提示
				// uni.showToast({
				//   title: '数据已更新',
				//   icon: 'none',
				//   duration: 1000
				// })
			},

			// 处理用户切换事件
			onUserSwitched(newUserId) {
				console.log('收到用户切换通知，清空页面数据')
				
				// 清空当前显示的数据
				this.todoBooks = []
				this.totalCount = 0
				this.loadMoreStatus = 'more'
				this.loading = false
				this.error = null
				
				// 如果新用户已登录，重新加载数据
				if (newUserId && this.hasLogin) {
					setTimeout(() => {
						this.loadTodoBooksOptimized()
					}, 500)
				}
			},

			// 优化的加载方法 - 缓存优先策略
			async loadTodoBooksOptimized() {
				// 如果正在加载，直接返回
				if (this.loading) return
				
				try {
					this.loading = true
					this.error = null
					
					// 优先从缓存获取数据
					const cached = globalStore.todoBook.getTodoBooksFromCache()
					if (cached.success) {
						console.log('使用缓存数据:', cached.source)
						this.todoBooks = cached.data
						this.totalCount = cached.data.length
						this.loadMoreStatus = 'noMore'
						
						// 标记首次加载完成
						this.isFirstLoad = false
						return
					}
					
					// 缓存无效，从云端加载
					console.log('缓存无效，从云端加载')
					const books = await globalStore.todoBook.loadTodoBooks({
						include_archived: false,
						keyword: this.searchKeyword
					})
					
					this.todoBooks = books
					this.totalCount = books.length
					this.loadMoreStatus = 'noMore'
					this.isFirstLoad = false
					
				} catch (error) {
					console.error('加载项目册失败:', error)
					this.error = '加载失败，请重试'
					uni.showToast({
						title: '加载失败，请重试',
						icon: 'none'
					})
				} finally {
					this.loading = false
					uni.stopPullDownRefresh()
				}
			},

			// 新增：加载项目册数据
			async loadTodoBooks(isLoadMore = false) {
				if (this.loading) return
				
				this.loading = true
				this.error = null
				
				try {
					const todoBooksObj = uniCloud.importObject('todobook-co')
					
					const result = await todoBooksObj.getTodoBooks({
						include_archived: false,
						page: this.currentPage,
						pageSize: this.pageSize,
						keyword: this.searchKeyword
					})
					
					if (result.code === 0) {
						const { list, pagination } = result.data
						
						
						if (isLoadMore) {
							this.todoBooks = [...this.todoBooks, ...list]
						} else {
							this.todoBooks = list
						}
						
						this.totalCount = pagination.total
						this.hasMore = pagination.hasMore
						this.loadMoreStatus = pagination.hasMore ? 'more' : 'noMore'
					} else {
						this.error = result.message || '获取数据失败'
						uni.showToast({
							title: this.error,
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('加载项目册失败:', error)
					this.error = '网络错误，请重试'
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'none'
					})
				} finally {
					this.loading = false
					uni.stopPullDownRefresh()
				}
			},
			

			// 修改：刷新数据（强制从云端获取）
			async refreshTodoBooks() {
				try {
					this.loading = true
					this.error = null
					console.log('强制刷新项目册...')
					
					const books = await globalStore.todoBook.refreshTodoBooks()
					
					this.todoBooks = books
					this.totalCount = books.length
					this.loadMoreStatus = 'noMore'
					this.currentPage = 1
					this.hasMore = false
					
				} catch (error) {
					console.error('刷新项目册失败:', error)
					this.error = '刷新失败，请重试'
					uni.showToast({
						title: '刷新失败，请重试',
						icon: 'none'
					})
				} finally {
					this.loading = false
					uni.stopPullDownRefresh()
				}
			},

			// 修改：加载更多
			async loadMore() {
				if (!this.hasMore || this.loadMoreStatus === 'loading') return
				
				this.loadMoreStatus = 'loading'
				this.currentPage++
				await this.loadTodoBooks(true)
			},

			// 修改：搜索输入处理（添加防抖）
			onSearchInput(value) {
				this.searchKeyword = value
				// 使用防抖处理
				clearTimeout(this.searchTimer)
				this.searchTimer = setTimeout(() => {
					this.refreshTodoBooks()
				}, 500)
			},

			onSearchCancel() {
				this.searchKeyword = ''
				this.refreshTodoBooks()
			},

			onSearchConfirm() {
				// 搜索确认，触发查询
				this.refreshTodoBooks()
			},

			openTodoBook(book) {
				uni.navigateTo({
					url: `/pages/todobooks/detail?id=${book._id}`
				})
			},

			createTodoBook() {
				uni.navigateTo({
					url: '/pages/todobooks/create'
				})
			},

			showBookActions(book) {
				this.currentBook = book
				this.$refs.actionPopup.open()
			},

			hideActionSheet() {
				this.$refs.actionPopup.close()
				this.currentBook = null
			},

			editTodoBook() {
				const bookId = this.currentBook?._id
				this.hideActionSheet()
				if (bookId) {
					uni.navigateTo({
						url: `/pages/todobooks/edit?id=${bookId}`
					})
				}
			},

			shareTodoBook() {
				const bookId = this.currentBook?._id
				this.hideActionSheet()
				if (bookId) {
					uni.navigateTo({
						url: `/pages/todobooks/members?id=${bookId}`
					})
				}
			},

			async archiveTodoBook() {
				// 先保存要归档的项目册引用
				const bookToArchive = this.currentBook
				this.hideActionSheet()
				
				uni.showModal({
					title: '确认归档',
					content: '归档后的项目册将移动到归档列表中，确定要归档吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								// 使用全局store更新（缓存更新后会自动通过事件通知页面刷新）
								await globalStore.todoBook.updateTodoBook(bookToArchive._id, {
									is_archived: true,
									archived_at: new Date()
								})

								uni.showToast({
									title: '归档成功',
									icon: 'success'
								})
							} catch (error) {
								console.error('归档失败:', error)
								uni.showToast({
									title: error.message || '归档失败',
									icon: 'error'
								})
							}
						}
					}
				})
			},

			async deleteTodoBook() {
				// 先保存要删除的项目册引用
				const bookToDelete = this.currentBook
				this.hideActionSheet()
				
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

								// 使用全局store删除（缓存更新后会自动通过事件通知页面刷新）
								await globalStore.todoBook.deleteTodoBook(bookToDelete._id)

								uni.hideLoading()
								
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
							} catch (error) {
								uni.hideLoading()
								console.error('删除失败:', error)
								uni.showToast({
									title: error.message || '删除失败',
									icon: 'error'
								})
							}
						}
					}
				})
			},

			showStatistics() {
				const bookId = this.currentBook?._id
				this.hideActionSheet()
				if (bookId) {
					uni.navigateTo({
						url: `/pages/todobooks/statistics?id=${bookId}`
					})
				}
			},

			exportTasks() {
				this.hideActionSheet()
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				})
			},

			calculateProgress(book) {
				if (!book.item_count || book.item_count === 0) return 0
				return Math.round((book.completed_count / book.item_count) * 100)
			},

			formatTime(timeStr) {
				if (!timeStr) return ''
				
				const time = new Date(timeStr)
				const now = new Date()
				const diff = now.getTime() - time.getTime()
				
				const minutes = Math.floor(diff / (1000 * 60))
				const hours = Math.floor(diff / (1000 * 60 * 60))
				const days = Math.floor(diff / (1000 * 60 * 60 * 24))
				
				if (minutes < 60) {
					return minutes <= 1 ? '刚刚' : `${minutes}分钟前`
				} else if (hours < 24) {
					return `${hours}小时前`
				} else if (days < 7) {
					return `${days}天前`
				} else {
					return time.toLocaleDateString()
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	/* #ifndef APP-NVUE */
	view {
		display: flex;
		box-sizing: border-box;
		flex-direction: column;
	}

	page {
		background-color: #f5f5f5;
	}
	/* #endif*/

	.list-page {
		flex: 1;
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	/* 搜索区域 */
	.search-section {
		background-color: #ffffff;
		padding: 20rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	}

	/* 项目册容器 */
	.todobooks-container {
		flex: 1;
		padding: 20rpx;
	}

	/* 加载状态 */
	.loading-section {
		padding: 60rpx 0;
		align-items: center;
		justify-content: center;
	}

	/* 空状态 */
	.empty-section {
		padding: 120rpx 40rpx;
		align-items: center;
		justify-content: center;
	}

	.empty-icon {
		margin-bottom: 30rpx;
	}

	.empty-text {
		font-size: 28rpx;
		color: #999999;
		text-align: center;
	}

	/* 错误状态 */
	.error-section {
		padding: 80rpx 40rpx;
		align-items: center;
		justify-content: center;
	}

	.error-text {
		font-size: 28rpx;
		color: #ff4757;
		text-align: center;
	}

	/* 项目册列表 */
	.todobooks-list {
		gap: 20rpx;
	}

	/* 项目册卡片 */
	.todobook-card {
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		margin-bottom: 20rpx;
	}

	.todobook-card:active {
		transform: scale(0.98);
		transition: transform 0.1s ease;
	}

	/* 卡片头部 */
	.card-header {
		flex-direction: row;
		align-items: center;
		margin-bottom: 24rpx;
	}

	.book-icon {
		width: 60rpx;
		height: 60rpx;
		border-radius: 12rpx;
		justify-content: center;
		align-items: center;
		margin-right: 20rpx;
		position: relative;
	}


	.book-info {
		flex: 1;
	}

	.book-title {
		font-size: 32rpx;
		color: #333333;
		font-weight: 500;
		margin-bottom: 8rpx;
	}

	.book-description {
		font-size: 26rpx;
		color: #666666;
		/* #ifndef APP-NVUE */
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		/* #endif */
	}

	.book-actions {
		padding: 10rpx;
	}

	/* 统计信息 */
	.card-stats {
		flex-direction: row;
		justify-content: space-between;
		margin-bottom: 24rpx;
	}

	.stat-item {
		align-items: center;
	}

	.stat-number {
		font-size: 28rpx;
		color: #333333;
		font-weight: 600;
		margin-bottom: 4rpx;
	}

	.stat-label {
		font-size: 22rpx;
		color: #999999;
	}

	/* 进度条 */
	.card-progress {
		margin-bottom: 20rpx;
	}

	.progress-bar {
		height: 6rpx;
		background-color: #f0f0f0;
		border-radius: 3rpx;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.3s ease;
	}

	/* 卡片底部 */
	.card-footer {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	.last-activity {
		font-size: 24rpx;
		color: #999999;
	}

	.share-badge {
		flex-direction: row;
		align-items: center;
		background-color: #f0f9f0;
		padding: 8rpx 12rpx;
		border-radius: 8rpx;
	}

	.share-text {
		font-size: 22rpx;
		color: #28a745;
		margin-left: 4rpx;
	}

	/* 下拉刷新 */
	.refresh-section {
		padding: 20rpx 0;
	}

	/* 浮动按钮 */
	.fab-container {
		position: fixed;
		right: 30rpx;
		bottom: 120rpx;
		/* #ifndef APP-NVUE */
		z-index: 100;
		/* #endif */
	}

	.fab-button {
		width: 100rpx;
		height: 100rpx;
		background-color: #007AFF;
		border-radius: 50rpx;
		justify-content: center;
		align-items: center;
		box-shadow: 0 8rpx 20rpx rgba(0, 122, 255, 0.3);
	}

	.fab-button:active {
		transform: scale(0.95);
		transition: transform 0.1s ease;
	}

	/* 操作弹窗 */
	.action-sheet {
		background-color: #ffffff;
		border-radius: 20rpx 20rpx 0 0;
		padding-bottom: 40rpx;
		/* #ifndef APP-NVUE */
		padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
		z-index: 9999;
		position: relative;
		/* #endif */
	}

	.action-header {
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		align-items: center;
	}

	.action-scroll {
		max-height: 60vh;
		flex: 1;
	}

	.action-title {
		font-size: 32rpx;
		color: #333333;
		font-weight: 500;
	}

	.action-list {
		padding: 0 20rpx;
	}

	.action-item {
		flex-direction: row;
		align-items: center;
		padding: 24rpx 20rpx;
		border-radius: 12rpx;
		margin: 8rpx 0;
	}

	.action-item:active {
		background-color: #f8f8f8;
	}

	.action-item.danger .action-text {
		color: #FF4757;
	}

	.action-text {
		font-size: 30rpx;
		color: #333333;
		margin-left: 16rpx;
	}

	.action-cancel {
		margin: 20rpx;
		margin-bottom: 60rpx;
		padding: 24rpx;
		background-color: #f8f8f8;
		border-radius: 16rpx;
		align-items: center;
		/* #ifndef APP-NVUE */
		margin-bottom: calc(60rpx + env(safe-area-inset-bottom));
		/* #endif */
	}

	.action-cancel:active {
		background-color: #e8e8e8;
	}

	.cancel-text {
		font-size: 30rpx;
		color: #666666;
	}

	.bottom-spacer {
		height: 120rpx;
		/* #ifndef APP-NVUE */
		height: calc(120rpx + env(safe-area-inset-bottom));
		/* #endif */
	}

	/* 安全区域适配 */
	/* #ifndef APP-NVUE */
	.fab-container {
		bottom: calc(120rpx + env(safe-area-inset-bottom));
	}
	/* #endif */
</style>