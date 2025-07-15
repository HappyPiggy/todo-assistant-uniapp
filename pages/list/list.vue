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
	@import "./list.scss";
</style>