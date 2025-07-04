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
			<unicloud-db 
				v-slot:default="{data, loading, error}" 
				ref="todoBooksDB"
				:collection="collection"
				:where="where"
				:orderby="'sort_order asc, updated_at desc'"
				:page-size="pageSize"
				:page-current="page"
				:options="loadOptions"
				@load="onDataLoad">
				
				<!-- 加载状态 -->
				<view v-if="loading" class="loading-section">
					<uni-load-more status="loading" />
				</view>

				<!-- 错误状态 -->
				<view v-else-if="error" class="error-section">
					<text class="error-text">{{ error.message }}</text>
				</view>

				<!-- 空状态 -->
				<view v-else-if="processedData.length === 0" class="empty-section">
					<view class="empty-icon">
						<uni-icons color="#cccccc" size="80" type="folder" />
					</view>
					<text class="empty-text">{{ searchKeyword ? '没有找到相关项目册' : '还没有项目册，点击右下角创建吧' }}</text>
				</view>

				<!-- 项目册卡片列表 -->
				<view v-else class="todobooks-list">
					<view 
						v-for="book in processedData" 
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

				<!-- 下拉刷新 -->
				<view class="refresh-section" v-if="!loading && hasMore">
					<uni-load-more :status="loadMoreStatus" @clickLoadMore="loadMore" />
				</view>
			</unicloud-db>
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
	import {
		store
	} from '@/uni_modules/uni-id-pages/common/store.js'
	
	const db = uniCloud.database()
	
	export default {
		data() {
			return {
				searchKeyword: '',
				currentBook: null,
				loadMoreStatus: 'more',
				page: 1,
				hasMore: true,
				pageSize: 10,
				processedData: [],
				loadOptions: {
					noData: '<p style="text-align:center;color:#666">加载中...</p>'
				}
			}
		},
		computed: {
			hasLogin() {
				return store.hasLogin
			},
			where() {
				// 简化查询条件：只查询用户创建的项目册，参与的项目册通过单独查询获取
				let whereStr = `creator_id == $env.uid && is_archived == false`
				
				// 添加搜索条件
				if (this.searchKeyword) {
					const keyword = this.searchKeyword.replace(/'/g, "\\'") // 转义单引号
					whereStr += ` && (title.indexOf('${keyword}') != -1 || description.indexOf('${keyword}') != -1)`
				}
				
				return whereStr
			},
			collection() {
				// 只查询项目册主表
				return 'todobooks'
			}
		},
		onLoad() {
			// 检查登录状态
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
		},
		onShow() {
			// 页面显示时刷新数据
			if (this.hasLogin && this.$refs.todoBooksDB) {
				this.$refs.todoBooksDB.loadData()
			}
		},
		onPullDownRefresh() {
			this.refreshTodoBooks()
		},
		onReachBottom() {
			this.loadMore()
		},
		methods: {
			// 处理数据加载完成
			async onDataLoad(data) {
				if (!data || data.length === 0) {
					this.processedData = []
					this.hasMore = false
					this.loadMoreStatus = 'noMore'
					uni.stopPullDownRefresh()
					return
				}
				
				// 处理数据，只有项目册主表数据
				const ownedBooks = Array.isArray(data) ? data : [data]
				
				// 查询用户参与的项目册
				let participatedBooks = []
				try {
					// 获取用户参与的项目册 ID 列表
					const memberResult = await db.collection('todobook_members')
						.where({
							user_id: db.env.uid,
							is_active: true
						})
						.field({ todobook_id: true })
						.get()
					
					if (memberResult.result.data && memberResult.result.data.length > 0) {
						const bookIds = memberResult.result.data.map(item => item.todobook_id)
						
						// 查询这些项目册的详细信息
						if (bookIds.length > 0) {
							let participatedWhere = `_id in [${bookIds.map(id => `"${id}"`).join(',')}] && is_archived == false`
							
							// 添加搜索条件
							if (this.searchKeyword) {
								const keyword = this.searchKeyword.replace(/'/g, "\\'")
								participatedWhere += ` && (title.indexOf('${keyword}') != -1 || description.indexOf('${keyword}') != -1)`
							}
							
							const participatedResult = await db.collection('todobooks')
								.where(participatedWhere)
								.orderBy('sort_order asc, updated_at desc')
								.get()
							
							if (participatedResult.result.data) {
								participatedBooks = participatedResult.result.data
							}
						}
					}
				} catch (error) {
					console.error('查询参与的项目册失败:', error)
				}
				
				// 合并用户创建的和参与的项目册，去重
				const allBooks = [...ownedBooks]
				participatedBooks.forEach(book => {
					if (!allBooks.find(b => b._id === book._id)) {
						allBooks.push(book)
					}
				})
				
				// 如果没有项目册，直接返回空数据
				if (allBooks.length === 0) {
					this.processedData = []
					this.hasMore = false
					this.loadMoreStatus = 'noMore'
					uni.stopPullDownRefresh()
					return
				}
				
				// 获取所有项目册的 ID
				const bookIds = allBooks.map(book => book._id)
				
				// 查询成员统计和任务统计
				const [memberStats, taskStats] = await Promise.all([
					this.getMemberStats(bookIds),
					this.getTaskStats(bookIds)
				])
				
				// 创建成员统计映射
				const memberMap = {}
				if (memberStats && memberStats.length > 0) {
					memberStats.forEach(item => {
						memberMap[item.todobook_id] = item.member_count
					})
				}
				
				// 创建任务统计映射
				const taskMap = {}
				if (taskStats && taskStats.length > 0) {
					taskStats.forEach(item => {
						if (!taskMap[item.todobook_id]) {
							taskMap[item.todobook_id] = {
								total: 0,
								todo: 0,
								in_progress: 0,
								completed: 0
							}
						}
						taskMap[item.todobook_id][item.status] = item.count
						taskMap[item.todobook_id].total += item.count
					})
				}
				
				// 整合数据
				this.processedData = allBooks.map(book => {
					return {
						...book,
						member_count: memberMap[book._id] || 1,
						task_stats: taskMap[book._id] || {
							total: 0,
							todo: 0,
							in_progress: 0,
							completed: 0
						}
					}
				})
				
				// 更新分页状态
				if (allBooks.length < this.pageSize) {
					this.hasMore = false
					this.loadMoreStatus = 'noMore'
				} else {
					this.loadMoreStatus = 'more'
				}
				
				uni.stopPullDownRefresh()
			},

			async refreshTodoBooks() {
				this.page = 1
				this.hasMore = true
				this.loadMoreStatus = 'more'
				this.processedData = []
				
				if (this.$refs.todoBooksDB) {
					await this.$refs.todoBooksDB.loadData()
				}
			},

			async loadMore() {
				if (this.hasMore && this.loadMoreStatus !== 'loading') {
					this.loadMoreStatus = 'loading'
					this.page++
					
					if (this.$refs.todoBooksDB) {
						await this.$refs.todoBooksDB.loadMore()
					}
				}
			},

			onSearchInput(value) {
				this.searchKeyword = value
				// 触发重新查询
				this.refreshTodoBooks()
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

			async archiveTodoBook() {
				this.hideActionSheet()
				uni.showModal({
					title: '确认归档',
					content: '归档后的项目册将移动到归档列表中，确定要归档吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								// 使用 unicloud-db 直接更新
								const updateResult = await db.collection('todobooks')
									.doc(this.currentBook._id)
									.update({
										is_archived: true,
										archived_at: new Date()
									})

								if (updateResult.result.updated > 0) {
									uni.showToast({
										title: '归档成功',
										icon: 'success'
									})
									this.refreshTodoBooks()
								} else {
									throw new Error('归档失败')
								}
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

								// 使用 unicloud-db 删除相关数据
								const deletePromises = [
									// 删除项目册
									db.collection('todobooks').doc(this.currentBook._id).remove(),
									// 删除成员关系
									db.collection('todobook_members').where({
										todobook_id: this.currentBook._id
									}).remove(),
									// 删除任务
									db.collection('todoitems').where({
										todobook_id: this.currentBook._id
									}).remove()
								]

								await Promise.all(deletePromises)

								uni.hideLoading()
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
								this.refreshTodoBooks()
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
			},
			
			// 获取成员统计
			async getMemberStats(bookIds) {
				try {
					const result = await db.collection('todobook_members')
						.where({
							todobook_id: db.command.in(bookIds),
							is_active: true
						})
						.field({ todobook_id: true })
						.get()
					
					// 手动统计每个项目册的成员数
					const memberCounts = {}
					if (result.result.data) {
						result.result.data.forEach(member => {
							if (!memberCounts[member.todobook_id]) {
								memberCounts[member.todobook_id] = 0
							}
							memberCounts[member.todobook_id]++
						})
					}
					
					return Object.keys(memberCounts).map(todobook_id => ({
						todobook_id,
						member_count: memberCounts[todobook_id]
					}))
				} catch (error) {
					console.error('获取成员统计失败:', error)
					return []
				}
			},
			
			// 获取任务统计
			async getTaskStats(bookIds) {
				try {
					const result = await db.collection('todoitems')
						.where({
							todobook_id: db.command.in(bookIds)
						})
						.field({ todobook_id: true, status: true })
						.get()
					
					// 手动统计每个项目册的任务状态
					const taskCounts = {}
					if (result.result.data) {
						result.result.data.forEach(task => {
							if (!taskCounts[task.todobook_id]) {
								taskCounts[task.todobook_id] = {}
							}
							if (!taskCounts[task.todobook_id][task.status]) {
								taskCounts[task.todobook_id][task.status] = 0
							}
							taskCounts[task.todobook_id][task.status]++
						})
					}
					
					// 转换为数组格式
					const results = []
					Object.keys(taskCounts).forEach(todobook_id => {
						Object.keys(taskCounts[todobook_id]).forEach(status => {
							results.push({
								todobook_id,
								status,
								count: taskCounts[todobook_id][status]
							})
						})
					})
					
					return results
				} catch (error) {
					console.error('获取任务统计失败:', error)
					return []
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