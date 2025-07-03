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
			<view v-if="loading" class="loading-section">
				<uni-load-more status="loading" />
			</view>

			<!-- 空状态 -->
			<view v-else-if="filteredTodoBooks.length === 0" class="empty-section">
				<view class="empty-icon">
					<uni-icons color="#cccccc" size="80" type="folder" />
				</view>
				<text class="empty-text">{{ searchKeyword ? '没有找到相关项目册' : '还没有项目册，点击右下角创建吧' }}</text>
			</view>

			<!-- 项目册卡片列表 -->
			<view v-else class="todobooks-list">
				<view 
					v-for="book in filteredTodoBooks" 
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
							<text class="stat-number">{{ book.task_stats?.total || 0 }}</text>
							<text class="stat-label">总任务</text>
						</view>
						<view class="stat-item">
							<text class="stat-number">{{ book.task_stats?.completed || 0 }}</text>
							<text class="stat-label">已完成</text>
						</view>
						<view class="stat-item">
							<text class="stat-number">{{ book.member_count || 1 }}</text>
							<text class="stat-label">成员</text>
						</view>
						<view class="stat-item">
							<text class="stat-number">{{ calculateProgress(book.task_stats) }}%</text>
							<text class="stat-label">进度</text>
						</view>
					</view>

					<view class="card-progress">
						<view class="progress-bar">
							<view class="progress-fill" :style="{ width: calculateProgress(book.task_stats) + '%', backgroundColor: book.color }"></view>
						</view>
					</view>

					<view class="card-footer">
						<text class="last-activity">{{ formatTime(book.last_activity_at || book.updated_at) }}</text>
						<view v-if="book.is_shared" class="share-badge">
							<uni-icons color="#28a745" size="14" type="checkmarkempty" />
							<text class="share-text">共享</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 下拉刷新 -->
		<view class="refresh-section" v-if="!loading">
			<uni-load-more :status="loadMoreStatus" @clickLoadMore="loadMore" />
		</view>

		<!-- 浮动添加按钮 -->
		<view class="fab-container">
			<view class="fab-button" @click="createTodoBook">
				<uni-icons color="#ffffff" size="28" type="plus" />
			</view>
		</view>

		<!-- 操作弹窗 -->
		<uni-popup ref="actionPopup" type="bottom" background-color="#ffffff">
			<view class="action-sheet">
				<view class="action-header">
					<text class="action-title">{{ currentBook?.title }}</text>
				</view>
				<view class="action-list">
					<view class="action-item" @click="editTodoBook">
						<uni-icons color="#007AFF" size="20" type="compose" />
						<text class="action-text">编辑</text>
					</view>
					<view class="action-item" @click="shareTodoBook" v-if="!currentBook?.is_shared">
						<uni-icons color="#28a745" size="20" type="person-add" />
						<text class="action-text">共享</text>
					</view>
					<view class="action-item" @click="archiveTodoBook">
						<uni-icons color="#ffc107" size="20" type="archive" />
						<text class="action-text">归档</text>
					</view>
					<view class="action-item danger" @click="deleteTodoBook">
						<uni-icons color="#FF4757" size="20" type="trash" />
						<text class="action-text">删除</text>
					</view>
				</view>
				<view class="action-cancel" @click="hideActionSheet">
					<text class="cancel-text">取消</text>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				searchKeyword: '',
				loading: true,
				todoBooks: [],
				currentBook: null,
				loadMoreStatus: 'more',
				page: 1,
				hasMore: true
			}
		},
		computed: {
			filteredTodoBooks() {
				if (!this.searchKeyword) {
					return this.todoBooks
				}
				const keyword = this.searchKeyword.toLowerCase()
				return this.todoBooks.filter(book => 
					book.title.toLowerCase().includes(keyword) ||
					(book.description && book.description.toLowerCase().includes(keyword))
				)
			}
		},
		onLoad() {
			this.loadTodoBooks()
		},
		onShow() {
			// 页面显示时刷新数据
			this.refreshTodoBooks()
		},
		onPullDownRefresh() {
			this.refreshTodoBooks()
		},
		onReachBottom() {
			this.loadMore()
		},
		methods: {
			async loadTodoBooks(refresh = false) {
				if (refresh) {
					this.page = 1
					this.hasMore = true
					this.loadMoreStatus = 'more'
				}

				if (!this.hasMore) return

				try {
					this.loading = refresh ? false : true
					
					const todoBookCo = uniCloud.importObject('todobook-co')
					const result = await todoBookCo.getTodoBooks({
						include_archived: false,
						limit: 10,
						skip: (this.page - 1) * 10
					})

					if (result.code === 0) {
						if (refresh) {
							this.todoBooks = result.data
						} else {
							this.todoBooks.push(...result.data)
						}

						if (result.data.length < 10) {
							this.hasMore = false
							this.loadMoreStatus = 'noMore'
						}

						this.page++
					} else {
						uni.showToast({
							title: result.message || '加载失败',
							icon: 'error'
						})
					}
				} catch (error) {
					console.error('加载项目册失败:', error)
					uni.showToast({
						title: '加载失败',
						icon: 'error'
					})
				} finally {
					this.loading = false
					uni.stopPullDownRefresh()
				}
			},

			async refreshTodoBooks() {
				await this.loadTodoBooks(true)
			},

			async loadMore() {
				if (this.hasMore && this.loadMoreStatus !== 'loading') {
					this.loadMoreStatus = 'loading'
					await this.loadTodoBooks()
				}
			},

			onSearchInput(value) {
				this.searchKeyword = value
			},

			onSearchCancel() {
				this.searchKeyword = ''
			},

			onSearchConfirm() {
				// 搜索确认，可以添加搜索历史等功能
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
				this.hideActionSheet()
				uni.navigateTo({
					url: `/pages/todobooks/edit?id=${this.currentBook._id}`
				})
			},

			shareTodoBook() {
				this.hideActionSheet()
				uni.navigateTo({
					url: `/pages/todobooks/share?id=${this.currentBook._id}`
				})
			},

			archiveTodoBook() {
				this.hideActionSheet()
				uni.showModal({
					title: '确认归档',
					content: '归档后的项目册将移动到归档列表中，确定要归档吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								const todoBookCo = uniCloud.importObject('todobook-co')
								const result = await todoBookCo.updateTodoBook(this.currentBook._id, {
									is_archived: true,
									archived_at: new Date()
								})

								if (result.code === 0) {
									uni.showToast({
										title: '归档成功',
										icon: 'success'
									})
									this.refreshTodoBooks()
								} else {
									throw new Error(result.message)
								}
							} catch (error) {
								uni.showToast({
									title: error.message || '归档失败',
									icon: 'error'
								})
							}
						}
					}
				})
			},

			deleteTodoBook() {
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

								const todoBookCo = uniCloud.importObject('todobook-co')
								const result = await todoBookCo.deleteTodoBook(this.currentBook._id)

								uni.hideLoading()

								if (result.code === 0) {
									uni.showToast({
										title: '删除成功',
										icon: 'success'
									})
									this.refreshTodoBooks()
								} else {
									throw new Error(result.message)
								}
							} catch (error) {
								uni.hideLoading()
								uni.showToast({
									title: error.message || '删除失败',
									icon: 'error'
								})
							}
						}
					}
				})
			},

			calculateProgress(taskStats) {
				if (!taskStats || taskStats.total === 0) return 0
				return Math.round((taskStats.completed / taskStats.total) * 100)
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
	}

	.action-header {
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		align-items: center;
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
		padding: 24rpx;
		background-color: #f8f8f8;
		border-radius: 16rpx;
		align-items: center;
	}

	.action-cancel:active {
		background-color: #e8e8e8;
	}

	.cancel-text {
		font-size: 30rpx;
		color: #666666;
	}

	/* 安全区域适配 */
	/* #ifndef APP-NVUE */
	.fab-container {
		bottom: calc(120rpx + env(safe-area-inset-bottom));
	}
	/* #endif */
</style>