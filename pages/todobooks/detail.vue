<template>
	<view class="detail-page">
		<!-- 项目册基本信息 -->
		<!-- 加载状态 -->
		<view v-if="bookLoading" class="loading-section">
			<uni-load-more status="loading" />
		</view>

		<!-- 错误状态 -->
		<view v-else-if="bookError" class="error-section">
			<text class="error-text">{{ bookError }}</text>
		</view>

		<!-- 项目册头部信息 -->
		<view class="book-header" v-else-if="bookData">
			<view class="header-top">
				<view class="book-icon" :style="{ backgroundColor: bookData.color }">
					<uni-icons color="#ffffff" size="32" :type="bookData.icon" />
				</view>
				<view class="book-meta">
					<text class="book-title">{{ bookData.title }}</text>
					<text class="book-description" v-if="bookData.description">{{ bookData.description }}</text>
				</view>
			</view>

			<view class="progress-section">
				<view class="progress-info">
					<text class="progress-text">完成进度</text>
					<text class="progress-percent">{{ overallProgress }}%</text>
				</view>
				<view class="progress-bar">
					<view class="progress-fill" :style="{ width: overallProgress + '%', backgroundColor: bookData.color }"></view>
				</view>
			</view>

			<view class="stats-section">
				<view class="stat-item">
					<text class="stat-number">{{ taskStats.total }}</text>
					<text class="stat-label">总任务</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ taskStats.completed }}</text>
					<text class="stat-label">已完成</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ memberCount }}</text>
					<text class="stat-label">成员</text>
				</view>
			</view>
		</view>

		<!-- 任务筛选标签 -->
		<view class="filter-tabs">
			<scroll-view scroll-x class="tab-scroll">
				<view class="tab-list">
					<view 
						v-for="filter in filterTabs" 
						:key="filter.key"
						class="tab-item"
						:class="{ active: activeFilter === filter.key }"
						@click="setActiveFilter(filter.key)">
						<text class="tab-text">{{ filter.label }}</text>
						<text class="tab-count" v-if="filter.count !== undefined">({{ filter.count }})</text>
					</view>
				</view>
			</scroll-view>
			<view class="add-task-btn" @click="addTask">
				<uni-icons color="#007AFF" size="20" type="plus" />
			</view>
		</view>

		<!-- 任务列表 -->
		<view class="tasks-container">
			<!-- 加载状态 -->
			<view v-if="tasksLoading" class="loading-section">
				<uni-load-more status="loading" />
			</view>

			<!-- 错误状态 -->
			<view v-else-if="tasksError" class="error-section">
				<text class="error-text">{{ tasksError }}</text>
			</view>

			<!-- 空状态 -->
			<view v-else-if="filteredTasks.length === 0" class="empty-section">
				<view class="empty-icon">
					<uni-icons color="#cccccc" size="60" type="list" />
				</view>
				<text class="empty-text">{{ getEmptyText() }}</text>
				<view class="empty-action" @click="addTask" v-if="activeFilter === 'all'">
					<text class="action-text">创建第一个任务</text>
				</view>
			</view>

			<!-- 任务卡片列表 -->
			<view v-else class="tasks-list">
				<view 
					v-for="task in filteredTasks" 
					:key="task._id"
					class="task-card"
					@click="task.subtask_count > 0 ? toggleTaskExpand(task) : null">
					
					<view class="task-header">
						<view class="task-left">
							<view class="task-expand" v-if="task.subtask_count > 0">
								<uni-icons 
									color="#666666" 
									size="16" 
									:type="task.expanded ? 'arrowdown' : 'arrowright'" />
							</view>
							<view class="task-content">
								<text class="task-title" :class="{ completed: task.status === 'completed' }">{{ task.title }}</text>
								<text class="task-description" v-if="task.description">{{ task.description }}</text>
							</view>
						</view>
						<view class="task-right">
							<view class="task-priority" :class="task.priority">
								<text class="priority-text">{{ getPriorityText(task.priority) }}</text>
							</view>
							<view class="task-detail-btn" @click.stop="openTask(task)">
								<uni-icons 
									color="#999999" 
									size="20" 
									type="more-filled" />
							</view>
							<view class="task-status" @click.stop="toggleTaskStatus(task)">
								<uni-icons 
									v-if="task.status === 'completed'"
									color="#28a745" 
									size="24" 
									type="checkmarkempty" />
								<uni-icons 
									v-else
									color="#cccccc" 
									size="24" 
									type="circle" />
							</view>
						</view>
					</view>

					<view class="task-meta" v-if="task.due_date || task.subtask_count > 0 || (task.tags && task.tags.length > 0) || getUnreadCommentCount(task._id) > 0">
						<view class="meta-left">
							<view class="due-date" v-if="task.due_date" :class="{ overdue: isOverdue(task.due_date) }">
								<uni-icons color="#999999" size="14" type="calendar" />
								<text class="due-text">{{ formatDueDate(task.due_date) }}</text>
							</view>
							<view class="subtasks" v-if="task.subtask_count > 0">
								<uni-icons color="#999999" size="14" type="list" />
								<text class="subtask-text">{{ task.completed_subtask_count }}/{{ task.subtask_count }}</text>
							</view>
							<!-- 未读评论提醒 -->
							<view v-if="getUnreadCommentCount(task._id) > 0" class="comment-hint">
								<uni-icons color="#ff9800" size="14" type="chatbubble" />
								<text class="comment-count">{{ getUnreadCommentCount(task._id) }}</text>
							</view>
						</view>
						<view class="task-tags" v-if="task.tags && Array.isArray(task.tags) && task.tags.length > 0">
							<view v-for="tag in task.tags.slice(0, 2)" :key="tag" class="tag-item">
								<text class="tag-text">{{ tag }}</text>
							</view>
							<text v-if="task.tags.length > 2" class="more-tags">+{{ task.tags.length - 2 }}</text>
						</view>
					</view>

					<!-- 子任务列表 -->
					<view v-if="task.expanded && task.subtasks && task.subtasks.length > 0" class="subtasks-container">
						<view 
							v-for="subtask in task.subtasks" 
							:key="subtask._id"
							class="subtask-item">
							<view class="subtask-content">
								<text class="subtask-title" :class="{ completed: subtask.status === 'completed' }">{{ subtask.title }}</text>
								<text class="subtask-description" v-if="subtask.description">{{ subtask.description }}</text>
								<!-- 子任务未读评论提醒 -->
								<view v-if="getUnreadCommentCount(subtask._id) > 0" class="subtask-comment-hint">
									<uni-icons color="#ff9800" size="12" type="chatbubble" />
									<text class="subtask-comment-count">{{ getUnreadCommentCount(subtask._id) }}</text>
								</view>
							</view>
							<view class="subtask-actions">
								<view class="subtask-detail-btn" @click.stop="openTask(subtask)">
									<uni-icons 
										color="#999999" 
										size="18" 
										type="more-filled" />
								</view>
								<view class="subtask-status" @click.stop="toggleTaskStatus(subtask)">
									<uni-icons 
										v-if="subtask.status === 'completed'"
										color="#28a745" 
										size="20" 
										type="checkmarkempty" />
									<uni-icons 
										v-else
										color="#cccccc" 
										size="20" 
										type="circle" />
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

	</view>
</template>

<script>
	import { calculateUnreadCount, markTaskCommentsAsRead } from '@/utils/commentUtils.js'
	import { store } from '@/uni_modules/uni-id-pages/common/store.js'
	
	export default {
		data() {
			return {
				bookId: '',
				// 项目册数据和状态
				bookData: null,
				bookLoading: false,
				bookError: null,
				// 任务数据和状态
				tasks: [],
				tasksLoading: false,
				tasksError: null,
				// 成员数量
				memberCount: 0,
				// 筛选相关
				activeFilter: 'all',
				filterTabs: [
					{ key: 'all', label: '全部', count: 0 },
					{ key: 'todo', label: '待办', count: 0 },
					{ key: 'completed', label: '已完成', count: 0 }
				]
			}
		},
		computed: {
			currentUserId() {
				return store.userInfo?._id || ''
			},
			filteredTasks() {
				if (this.activeFilter === 'all') {
					return this.tasks
				}
				
				// 筛选逻辑
				return this.tasks.filter(task => {
					if (this.activeFilter === 'completed') {
						// 已完成列表：只显示状态为completed的父任务
						return task.status === 'completed'
					} else if (this.activeFilter === 'todo') {
						// 待办列表：显示状态不是completed的父任务
						return task.status !== 'completed'
					}
					
					return false
				})
			},
			taskStats() {
				const stats = {
					total: 0,
					todo: 0,
					completed: 0
				}

				// 只统计父任务（顶级任务）
				this.tasks.forEach(task => {
					stats.total++
					if (task.status === 'completed') {
						stats.completed++
					} else {
						stats.todo++
					}
				})

				return stats
			},
			overallProgress() {
				if (this.taskStats.total === 0) return 0
				return Math.round((this.taskStats.completed / this.taskStats.total) * 100)
			}
		},
		onLoad(options) {
			console.log('[onLoad] options:', options)
			console.log('[onLoad] options.id:', options.id, 'type:', typeof options.id)
			
			if (!options.id) {
				uni.showToast({
					title: '缺少项目册ID',
					icon: 'error'
				})
				uni.navigateBack()
				return
			}
			this.bookId = options.id
			console.log('[onLoad] this.bookId 设置为:', this.bookId)
			
			// 加载项目册详情和任务数据
			this.loadBookDetail()
			this.loadTasks()
		},
		onShow() {
			// 返回时刷新数据
			if (this.bookId) {
				this.refreshData()
			}
			
			// 标记当前页面任务的评论为已读
			this.markCurrentTasksAsRead()
		},
		onPullDownRefresh() {
			this.refreshData()
		},
		methods: {
			// 加载项目册详情
			async loadBookDetail() {
				if (this.bookLoading) return
				
				this.bookLoading = true
				this.bookError = null
				
				try {
					const todoBooksObj = uniCloud.importObject('todobook-co')
					const result = await todoBooksObj.getTodoBookDetail(this.bookId)
					
					if (result.code === 0) {
						this.bookData = result.data.book
						this.memberCount = result.data.members.length
						
						// 设置页面标题
						if (this.bookData.title) {
							uni.setNavigationBarTitle({
								title: this.bookData.title
							})
						}
					} else {
						this.bookError = result.message || '获取项目册详情失败'
						uni.showToast({
							title: this.bookError,
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('加载项目册详情失败:', error)
					this.bookError = '网络错误，请重试'
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'none'
					})
				} finally {
					this.bookLoading = false
					uni.stopPullDownRefresh()
				}
			},

			// 加载任务列表
			async loadTasks() {
				if (this.tasksLoading) return
				
				this.tasksLoading = true
				this.tasksError = null
				
				try {
					const todoBooksObj = uniCloud.importObject('todobook-co')
					const result = await todoBooksObj.getTodoBookDetail(this.bookId)
					
					if (result.code === 0) {
						// 处理任务数据，确保格式正确
						const allTasks = (result.data.tasks || []).map(task => {
							return {
								...task,
								tags: Array.isArray(task.tags) ? task.tags : [],
								attachments: Array.isArray(task.attachments) ? task.attachments : [],
								expanded: false,
								subtasks: []
							}
						})
						
						// 组织父子关系：只显示父任务，子任务作为父任务的属性
						this.tasks = this.organizeParentChildTasks(allTasks)
						this.updateFilterCounts()
						
						// 加载任务评论数据（用于显示未读提示）
						await this.loadTasksCommentCounts(allTasks)
						
						// 标记当前页面任务的评论为已读
						this.markCurrentTasksAsRead()
					} else {
						this.tasksError = result.message || '获取任务列表失败'
						uni.showToast({
							title: this.tasksError,
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('加载任务列表失败:', error)
					this.tasksError = '网络错误，请重试'
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'none'
					})
				} finally {
					this.tasksLoading = false
					uni.stopPullDownRefresh()
				}
			},

			// 刷新数据
			async refreshData() {
				await Promise.all([
					this.loadBookDetail(),
					this.loadTasks()
				])
			},

			updateFilterCounts() {
				this.filterTabs[0].count = this.taskStats.total
				this.filterTabs[1].count = this.taskStats.todo
				this.filterTabs[2].count = this.taskStats.completed
			},

			setActiveFilter(filter) {
				this.activeFilter = filter
			},

			async toggleTaskStatus(task) {
				// 如果有子任务且不是全部完成，不允许直接完成父任务
				if (task.subtask_count > 0 && task.completed_subtask_count < task.subtask_count && task.status !== 'completed') {
					uni.showToast({
						title: '请先完成所有子任务',
						icon: 'none'
					})
					return
				}

				const oldStatus = task.status
				const newStatus = task.status === 'completed' ? 'todo' : 'completed'

				// 先乐观更新UI
				task.status = newStatus
				task.updated_at = new Date()
				task.last_activity_at = new Date()
				
				if (newStatus === 'completed') {
					task.completed_at = new Date()
				} else {
					task.completed_at = null
				}

				try {
					const todoBooksObj = uniCloud.importObject('todobook-co')
					const result = await todoBooksObj.updateTodoItemStatus(task._id, newStatus)

					if (result.code === 0) {
						// 更新统计数据
						this.updateLocalStats(oldStatus, newStatus)
						
						// 处理父子任务关系的本地更新
						this.handleLocalParentChildUpdate(task, newStatus)
						
						// 更新过滤器计数
						this.updateFilterCounts()
					} else {
						// 如果失败，回滚本地更新
						task.status = oldStatus
						task.updated_at = new Date()
						task.last_activity_at = new Date()
						
						if (oldStatus === 'completed') {
							task.completed_at = new Date()
						} else {
							task.completed_at = null
						}
						
						throw new Error(result.message || '更新失败')
					}
				} catch (error) {
					console.error('更新任务状态失败:', error)
					uni.showToast({
						title: error.message || '更新失败',
						icon: 'error'
					})
				}
			},

			// 更新本地统计数据
			updateLocalStats(oldStatus, newStatus) {
				// 更新项目册的统计
				if (newStatus === 'completed' && oldStatus !== 'completed') {
					if (this.bookData) {
						this.bookData.completed_count = (this.bookData.completed_count || 0) + 1
					}
				} else if (newStatus !== 'completed' && oldStatus === 'completed') {
					if (this.bookData) {
						this.bookData.completed_count = Math.max(0, (this.bookData.completed_count || 0) - 1)
					}
				}
			},

			// 处理父子任务关系的本地更新
			handleLocalParentChildUpdate(task, newStatus) {
				// 如果是子任务，更新父任务的完成子任务计数
				if (task.parent_id) {
					// 查找父任务
					let parentTask = null
					for (let i = 0; i < this.tasks.length; i++) {
						if (this.tasks[i]._id === task.parent_id) {
							parentTask = this.tasks[i]
							break
						}
					}
					
					if (parentTask) {
						// 更新父任务的完成子任务计数
						if (newStatus === 'completed') {
							parentTask.completed_subtask_count = (parentTask.completed_subtask_count || 0) + 1
						} else {
							parentTask.completed_subtask_count = Math.max(0, (parentTask.completed_subtask_count || 0) - 1)
						}
						
						// 如果所有子任务都完成了，自动完成父任务
						if (parentTask.completed_subtask_count === parentTask.subtask_count && parentTask.status !== 'completed') {
							parentTask.status = 'completed'
							parentTask.completed_at = new Date()
							parentTask.updated_at = new Date()
							// 更新统计
							this.updateLocalStats('todo', 'completed')
						}
						// 如果父任务已完成但有子任务变为未完成，父任务回退
						else if (parentTask.completed_subtask_count < parentTask.subtask_count && parentTask.status === 'completed') {
							parentTask.status = 'todo'
							parentTask.completed_at = null
							parentTask.updated_at = new Date()
							// 更新统计
							this.updateLocalStats('completed', 'todo')
						}
					}
				}
				
				// 如果是父任务且有子任务，更新子任务计数
				if (task.subtask_count > 0 && task.subtasks) {
					let completedCount = 0
					task.subtasks.forEach(subtask => {
						if (subtask.status === 'completed') {
							completedCount++
						}
					})
					task.completed_subtask_count = completedCount
				}
			},

			toggleTaskExpand(task) {
				this.$set(task, 'expanded', !task.expanded)
			},

			// 组织父子任务关系
			organizeParentChildTasks(allTasks) {
				// 创建任务映射
				const taskMap = {}
				allTasks.forEach(task => {
					taskMap[task._id] = task
				})
				
				// 分离父任务和子任务
				const parentTasks = []
				const childTasks = []
				
				allTasks.forEach(task => {
					if (task.parent_id) {
						childTasks.push(task)
					} else {
						parentTasks.push(task)
					}
				})
				
				// 将子任务关联到父任务
				childTasks.forEach(childTask => {
					const parentTask = taskMap[childTask.parent_id]
					if (parentTask) {
						parentTask.subtasks.push(childTask)
					}
				})
				
				// 对子任务进行排序
				parentTasks.forEach(parent => {
					if (parent.subtasks.length > 0) {
						parent.subtasks.sort((a, b) => {
							// 按照sort_order排序，如果没有则按创建时间
							if (a.sort_order !== undefined && b.sort_order !== undefined) {
								return a.sort_order - b.sort_order
							}
							return new Date(a.created_at) - new Date(b.created_at)
						})
					}
				})
				
				// 返回只包含父任务的数组
				return parentTasks.sort((a, b) => {
					if (a.sort_order !== undefined && b.sort_order !== undefined) {
						return a.sort_order - b.sort_order
					}
					return new Date(a.created_at) - new Date(b.created_at)
				})
			},

			openTask(task) {
				// 标记任务评论为已读
				if (task.comments && task.comments.length > 0) {
					markTaskCommentsAsRead(task._id, task.comments)
				}
				
				uni.navigateTo({
					url: `/pages/tasks/detail?id=${task._id}&bookId=${this.bookId}`
				})
			},

			addTask() {
				uni.navigateTo({
					url: `/pages/tasks/create?bookId=${this.bookId}`
				})
			},


			getPriorityText(priority) {
				const map = {
					low: '低',
					medium: '中',
					high: '高',
					urgent: '急'
				}
				return map[priority] || '中'
			},

			isOverdue(dueDate) {
				return new Date(dueDate) < new Date()
			},

			formatDueDate(dueDate) {
				const date = new Date(dueDate)
				const now = new Date()
				const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
				const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
				
				const diffDays = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24))
				
				if (diffDays === 0) return '今天'
				if (diffDays === 1) return '明天'
				if (diffDays === -1) return '昨天'
				if (diffDays > 0) return `${diffDays}天后`
				return `逾期${Math.abs(diffDays)}天`
			},

			// 加载任务评论数据
			async loadTasksCommentCounts(tasks) {
				
				try {
					const todoBooksObj = uniCloud.importObject('todobook-co')
					
					// 并行获取每个任务的评论数据
					const commentPromises = tasks.map(async task => {
						try {
							// 获取前50条评论，这样可以获取到评论的创建时间等详细信息
							const result = await todoBooksObj.getTaskComments(task._id, 1, 50)
							if (result.code === 0) {
								// 扁平化评论数据，包含顶级评论和回复
								const allComments = []
								result.data.comments.forEach(comment => {
									allComments.push(comment)
									if (comment.replies && comment.replies.length > 0) {
										allComments.push(...comment.replies)
									}
								})
								
								return {
									taskId: task._id,
									comments: allComments,
									total: result.data.total
								}
							}
						} catch (error) {
							console.error(`获取任务${task._id}评论数据失败:`, error)
						}
						
						return {
							taskId: task._id,
							comments: [],
							total: 0
						}
					})
					
					const commentData = await Promise.all(commentPromises)
					
					// 将评论数据添加到任务对象中
					commentData.forEach(({ taskId, comments, total }) => {
						const task = tasks.find(t => t._id === taskId)
						if (task) {
							task.comments = comments
							task.comment_count = total
						}
					})
					
					// 确保子任务也能获取到评论数据（从allTasks中同步到this.tasks的子任务中）
					this.tasks.forEach(parentTask => {
						if (parentTask.subtasks && parentTask.subtasks.length > 0) {
							parentTask.subtasks.forEach(subtask => {
								const allTaskData = tasks.find(t => t._id === subtask._id)
								if (allTaskData && allTaskData.comments) {
									subtask.comments = allTaskData.comments
									subtask.comment_count = allTaskData.comment_count || 0
								}
							})
						}
					})
				} catch (error) {
					console.error('加载评论数据失败:', error)
				}
			},

			// 获取未读评论数量
			getUnreadCommentCount(taskId) {
				try {
					// 先在父任务中查找
					let task = this.tasks.find(t => t._id === taskId)
					
					// 如果没找到，则在子任务中查找
					if (!task) {
						for (const parentTask of this.tasks) {
							if (parentTask.subtasks && parentTask.subtasks.length > 0) {
								task = parentTask.subtasks.find(subtask => subtask._id === taskId)
								if (task) break
							}
						}
					}
					
					if (!task) {
						return 0
					}
					
					if (!task.comments || task.comments.length === 0) {
						return 0
					}
					
					// 使用工具函数计算未读数量
					const unreadCount = calculateUnreadCount(taskId, task.comments, this.currentUserId)
					return unreadCount
				} catch (error) {
					console.error('计算未读评论数量失败:', error)
					return 0
				}
			},
			
			// 标记当前页面任务的评论为已读
			markCurrentTasksAsRead() {
				if (!this.tasks || this.tasks.length === 0) {
					return
				}
				
				// 标记所有父任务的评论为已读
				this.tasks.forEach(task => {
					if (task.comments && task.comments.length > 0) {
						markTaskCommentsAsRead(task._id, task.comments)
					}
					
					// 标记子任务的评论为已读
					if (task.subtasks && task.subtasks.length > 0) {
						task.subtasks.forEach(subtask => {
							if (subtask.comments && subtask.comments.length > 0) {
								markTaskCommentsAsRead(subtask._id, subtask.comments)
							}
						})
					}
				})
			},

			getEmptyText() {
				const map = {
					all: '还没有任务，创建第一个吧',
					todo: '没有待办任务',
					completed: '还没有完成的任务'
				}
				return map[this.activeFilter] || '暂无数据'
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

	.detail-page {
		flex: 1;
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	/* 项目册头部 */
	.book-header {
		background-color: #ffffff;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	}

	.header-top {
		flex-direction: row;
		align-items: flex-start;
		margin-bottom: 30rpx;
	}

	.book-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 16rpx;
		justify-content: center;
		align-items: center;
		margin-right: 20rpx;
	}

	.book-meta {
		flex: 1;
	}

	.book-title {
		font-size: 36rpx;
		color: #333333;
		font-weight: 600;
		margin-bottom: 8rpx;
	}

	.book-description {
		font-size: 28rpx;
		color: #666666;
		line-height: 1.5;
	}


	/* 进度区域 */
	.progress-section {
		margin-bottom: 30rpx;
	}

	.progress-info {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12rpx;
	}

	.progress-text {
		font-size: 28rpx;
		color: #666666;
	}

	.progress-percent {
		font-size: 32rpx;
		color: #333333;
		font-weight: 600;
	}

	.progress-bar {
		height: 8rpx;
		background-color: #f0f0f0;
		border-radius: 4rpx;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.3s ease;
	}

	/* 统计区域 */
	.stats-section {
		flex-direction: row;
		justify-content: space-between;
	}

	.stat-item {
		align-items: center;
	}

	.stat-number {
		font-size: 32rpx;
		color: #333333;
		font-weight: 600;
		margin-bottom: 8rpx;
	}

	.stat-label {
		font-size: 24rpx;
		color: #999999;
	}

	/* 筛选标签 */
	.filter-tabs {
		background-color: #ffffff;
		flex-direction: row;
		align-items: center;
		padding: 20rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	}

	.tab-scroll {
		flex: 1;
	}

	.tab-list {
		flex-direction: row;
		/* #ifndef APP-NVUE */
		white-space: nowrap;
		/* #endif */
	}

	.tab-item {
		flex-direction: row;
		align-items: center;
		padding: 16rpx 24rpx;
		background-color: #f8f8f8;
		border-radius: 20rpx;
		margin-right: 16rpx;
	}

	.tab-item.active {
		background-color: #007AFF;
	}

	.tab-item.active .tab-text,
	.tab-item.active .tab-count {
		color: #ffffff;
	}

	.tab-text {
		font-size: 28rpx;
		color: #666666;
	}

	.tab-count {
		font-size: 24rpx;
		color: #999999;
		margin-left: 8rpx;
	}

	.add-task-btn {
		width: 60rpx;
		height: 60rpx;
		background-color: #f0f6ff;
		border-radius: 30rpx;
		justify-content: center;
		align-items: center;
		margin-left: 16rpx;
	}

	.add-task-btn:active {
		background-color: #e6f3ff;
	}

	/* 任务容器 */
	.tasks-container {
		flex: 1;
		padding: 0 20rpx;
	}

	/* 加载、错误和空状态 */
	.loading-section {
		padding: 60rpx 0;
		align-items: center;
		justify-content: center;
	}

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

	.empty-section {
		padding: 80rpx 40rpx;
		align-items: center;
		justify-content: center;
	}

	.empty-icon {
		margin-bottom: 24rpx;
	}

	.empty-text {
		font-size: 28rpx;
		color: #999999;
		text-align: center;
		margin-bottom: 30rpx;
	}

	.empty-action {
		background-color: #007AFF;
		padding: 20rpx 40rpx;
		border-radius: 25rpx;
	}

	.action-text {
		font-size: 28rpx;
		color: #ffffff;
	}

	/* 任务列表 */
	.tasks-list {
		gap: 16rpx;
	}

	/* 任务卡片 */
	.task-card {
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 30rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
		margin-bottom: 16rpx;
	}

	.task-card:active {
		transform: scale(0.98);
		transition: transform 0.1s ease;
	}

	/* 当任务有子任务时，显示指针手势 */
	/* #ifndef APP-NVUE */
	.task-card[data-has-subtasks="true"] {
		cursor: pointer;
	}
	/* #endif */

	.task-header {
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 16rpx;
	}

	.task-left {
		flex-direction: row;
		align-items: flex-start;
		flex: 1;
	}

	.task-right {
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
	}

	.task-expand {
		width: 32rpx;
		height: 32rpx;
		justify-content: center;
		align-items: center;
		margin-right: 12rpx;
		margin-top: 4rpx;
	}

	.task-content {
		flex: 1;
	}

	.task-status {
		width: 44rpx;
		height: 44rpx;
		justify-content: center;
		align-items: center;
		background-color: #f8f8f8;
		border-radius: 22rpx;
		border: 1rpx solid #e8e8e8;
	}

	.task-status:active {
		background-color: #e8e8e8;
	}

	.task-detail-btn {
		width: 36rpx;
		height: 36rpx;
		justify-content: center;
		align-items: center;
		background-color: #f8f8f8;
		border-radius: 18rpx;
		margin-right: 12rpx;
	}

	.task-detail-btn:active {
		background-color: #e8e8e8;
	}

	.task-title {
		font-size: 30rpx;
		color: #333333;
		font-weight: 500;
		line-height: 1.4;
		margin-bottom: 8rpx;
	}

	.task-title.completed {
		color: #999999;
		/* #ifndef APP-NVUE */
		text-decoration: line-through;
		/* #endif */
	}

	.task-description {
		font-size: 26rpx;
		color: #666666;
		line-height: 1.4;
	}

	.task-priority {
		padding: 8rpx 16rpx;
		border-radius: 12rpx;
		margin-left: 16rpx;
	}

	.task-priority.low {
		background-color: #e8f5e8;
	}

	.task-priority.medium {
		background-color: #fff3e0;
	}

	.task-priority.high {
		background-color: #ffebee;
	}

	.task-priority.urgent {
		background-color: #ffebee;
	}

	.priority-text {
		font-size: 22rpx;
		font-weight: 500;
	}

	.task-priority.low .priority-text {
		color: #28a745;
	}

	.task-priority.medium .priority-text {
		color: #ff9800;
	}

	.task-priority.high .priority-text {
		color: #f44336;
	}

	.task-priority.urgent .priority-text {
		color: #d32f2f;
	}

	/* 任务元信息 */
	.task-meta {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
	}

	.meta-left {
		flex-direction: row;
		align-items: center;
		gap: 20rpx;
	}

	.due-date,
	.subtasks {
		flex-direction: row;
		align-items: center;
		gap: 6rpx;
	}

	.due-text,
	.subtask-text {
		font-size: 24rpx;
		color: #999999;
	}

	.due-date.overdue .due-text {
		color: #ff4757;
	}

	.comment-hint {
		flex-direction: row;
		align-items: center;
		gap: 4rpx;
		background-color: #fff3e0;
		padding: 4rpx 8rpx;
		border-radius: 8rpx;
		border: 1rpx solid #ffcc80;
	}

	.comment-count {
		font-size: 20rpx;
		color: #ff9800;
		font-weight: 500;
		min-width: 16rpx;
		text-align: center;
	}

	.task-tags {
		flex-direction: row;
		align-items: center;
		gap: 8rpx;
	}

	.tag-item {
		background-color: #f0f0f0;
		padding: 6rpx 12rpx;
		border-radius: 8rpx;
	}

	.tag-text {
		font-size: 22rpx;
		color: #666666;
	}

	.more-tags {
		font-size: 22rpx;
		color: #999999;
	}

	/* 任务进度 */
	.task-progress {
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
	}

	.progress-bar-small {
		flex: 1;
		height: 4rpx;
		background-color: #f0f0f0;
		border-radius: 2rpx;
		overflow: hidden;
	}

	.progress-fill-small {
		height: 100%;
		background-color: #007AFF;
		transition: width 0.3s ease;
	}

	.progress-text-small {
		font-size: 22rpx;
		color: #999999;
		min-width: 60rpx;
	}

	/* 子任务容器 */
	.subtasks-container {
		margin-top: 16rpx;
		padding-top: 16rpx;
		border-top: 1rpx solid #f0f0f0;
		gap: 12rpx;
	}

	.subtask-item {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 16rpx;
		background-color: #f8f8f8;
		border-radius: 12rpx;
		margin-left: 24rpx;
	}

	.subtask-item:active {
		background-color: #f0f0f0;
	}

	.subtask-content {
		flex: 1;
	}

	.subtask-title {
		font-size: 28rpx;
		color: #333333;
		margin-bottom: 4rpx;
	}

	.subtask-title.completed {
		color: #999999;
		/* #ifndef APP-NVUE */
		text-decoration: line-through;
		/* #endif */
	}

	.subtask-description {
		font-size: 24rpx;
		color: #666666;
		line-height: 1.4;
	}

	/* 子任务未读评论提醒 */
	.subtask-comment-hint {
		flex-direction: row;
		align-items: center;
		gap: 4rpx;
		background-color: #fff8e1;
		padding: 4rpx 8rpx;
		border-radius: 8rpx;
		border: 1rpx solid #ffcc80;
		margin-top: 8rpx;
		align-self: flex-start;
	}

	.subtask-comment-count {
		font-size: 18rpx;
		color: #ff9800;
		font-weight: 500;
		min-width: 12rpx;
		text-align: center;
	}

	.subtask-actions {
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
	}

	.subtask-detail-btn {
		width: 32rpx;
		height: 32rpx;
		justify-content: center;
		align-items: center;
		background-color: #f8f8f8;
		border-radius: 16rpx;
	}

	.subtask-detail-btn:active {
		background-color: #f0f0f0;
	}

	.subtask-status {
		width: 36rpx;
		height: 36rpx;
		justify-content: center;
		align-items: center;
	}

</style>