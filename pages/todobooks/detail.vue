<template>
	<view class="detail-page">
		<!-- 项目册基本信息 -->
		<unicloud-db 
			v-slot:default="{data: bookData, loading: bookLoading, error: bookError}" 
			ref="bookDetailDB"
			:collection="bookColList"
			:where="bookWhere"
			:getone="true"
			@load="onBookLoad">
			
			<!-- 项目册头部信息 -->
			<view class="book-header" v-if="!bookLoading && bookData">
				<view class="header-top">
					<view class="book-icon" :style="{ backgroundColor: bookData.color }">
						<uni-icons color="#ffffff" size="32" :type="bookData.icon" />
					</view>
					<view class="book-meta">
						<text class="book-title">{{ bookData.title }}</text>
						<text class="book-description" v-if="bookData.description">{{ bookData.description }}</text>
					</view>
					<view class="header-actions" @click="showBookMenu">
						<uni-icons color="#999999" size="24" type="more-filled" />
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
						<text class="stat-number">{{ taskStats.in_progress }}</text>
						<text class="stat-label">进行中</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">{{ memberCount }}</text>
						<text class="stat-label">成员</text>
					</view>
				</view>
			</view>
		</unicloud-db>

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
			<unicloud-db 
				v-slot:default="{data: tasksData, loading: tasksLoading, error: tasksError}" 
				ref="tasksDB"
				:collection="tasksColList"
				:where="tasksWhere"
				@load="onTasksLoad">
				
				<!-- 加载状态 -->
				<view v-if="tasksLoading" class="loading-section">
					<uni-load-more status="loading" />
				</view>

				<!-- 错误状态 -->
				<view v-else-if="tasksError" class="error-section">
					<text class="error-text">{{ tasksError.message }}</text>
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
						@click="openTask(task)">
						
						<view class="task-header">
							<view class="task-checkbox" @click.stop="toggleTaskStatus(task)">
								<uni-icons 
									v-if="task.status === 'completed'"
									color="#28a745" 
									size="20" 
									type="checkmarkempty" />
								<uni-icons 
									v-else-if="task.status === 'in_progress'"
									color="#ffc107" 
									size="20" 
									type="loop" />
								<uni-icons 
									v-else
									color="#cccccc" 
									size="20" 
									type="circle" />
							</view>
							<view class="task-content">
								<text class="task-title" :class="{ completed: task.status === 'completed' }">{{ task.title }}</text>
								<text class="task-description" v-if="task.description">{{ task.description }}</text>
							</view>
							<view class="task-priority" :class="task.priority">
								<text class="priority-text">{{ getPriorityText(task.priority) }}</text>
							</view>
						</view>

						<view class="task-meta" v-if="task.due_date || task.subtask_count > 0 || (task.tags && task.tags.length > 0)">
							<view class="meta-left">
								<view class="due-date" v-if="task.due_date" :class="{ overdue: isOverdue(task.due_date) }">
									<uni-icons color="#999999" size="14" type="calendar" />
									<text class="due-text">{{ formatDueDate(task.due_date) }}</text>
								</view>
								<view class="subtasks" v-if="task.subtask_count > 0">
									<uni-icons color="#999999" size="14" type="list" />
									<text class="subtask-text">{{ task.completed_subtask_count }}/{{ task.subtask_count }}</text>
								</view>
							</view>
							<view class="task-tags" v-if="task.tags && Array.isArray(task.tags) && task.tags.length > 0">
								<view v-for="tag in task.tags.slice(0, 2)" :key="tag" class="tag-item">
									<text class="tag-text">{{ tag }}</text>
								</view>
								<text v-if="task.tags.length > 2" class="more-tags">+{{ task.tags.length - 2 }}</text>
							</view>
						</view>

						<view class="task-progress" v-if="task.progress > 0 && task.status !== 'completed'">
							<view class="progress-bar-small">
								<view class="progress-fill-small" :style="{ width: task.progress + '%' }"></view>
							</view>
							<text class="progress-text-small">{{ task.progress }}%</text>
						</view>
					</view>
				</view>
			</unicloud-db>
		</view>

		<!-- 项目册菜单弹窗 -->
		<uni-popup ref="bookMenuPopup" type="bottom" background-color="#ffffff">
			<view class="menu-sheet">
				<view class="menu-header">
					<text class="menu-title">项目册操作</text>
				</view>
				<view class="menu-list">
					<view class="menu-item" @click="editTodoBook">
						<uni-icons color="#007AFF" size="20" type="compose" />
						<text class="menu-text">编辑信息</text>
					</view>
					<view class="menu-item" @click="manageMember">
						<uni-icons color="#28a745" size="20" type="person-add" />
						<text class="menu-text">成员管理</text>
					</view>
					<view class="menu-item" @click="showStatistics">
						<uni-icons color="#17a2b8" size="20" type="bars" />
						<text class="menu-text">数据统计</text>
					</view>
					<view class="menu-item" @click="exportTasks">
						<uni-icons color="#6c757d" size="20" type="download" />
						<text class="menu-text">导出任务</text>
					</view>
				</view>
				<view class="menu-cancel" @click="hideBookMenu">
					<text class="cancel-text">取消</text>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	const db = uniCloud.database()
	
	export default {
		data() {
			return {
				bookId: '',
				tasks: [],
				memberCount: 0,
				activeFilter: 'all',
				filterTabs: [
					{ key: 'all', label: '全部', count: 0 },
					{ key: 'todo', label: '待办', count: 0 },
					{ key: 'in_progress', label: '进行中', count: 0 },
					{ key: 'completed', label: '已完成', count: 0 }
				]
			}
		},
		computed: {
			bookWhere() {
				return `_id == "${this.bookId}"`
			},
			bookColList() {
				console.log("bookColList - bookId:", this.bookId, "type:", typeof this.bookId)
				if (!this.bookId) {
					console.warn("bookId is empty or undefined")
					return []
				}
				try {
					const result = [
						db.collection('todobooks').doc(this.bookId).getTemp()
					]
					console.log("bookColList - success:", result)
					return result
				} catch (error) {
					console.error("bookColList - error:", error)
					console.error("error details:", JSON.stringify(error, null, 2))
					return []
				}
			},
			tasksWhere() {
				return `todobook_id == "${this.bookId}"`
			},
			tasksColList() {
				console.error("tasksColList", this.bookId)
				return [
					db.collection('todoitems')
						.where(this.tasksWhere)
						.field('_id,todobook_id,parent_id,title,description,creator_id,assignee_id,created_at,updated_at,due_date,completed_at,status,priority,tags,sort_order,level,progress,estimated_hours,actual_hours,subtask_count,completed_subtask_count,is_recurring,last_activity_at')
						.orderBy('sort_order asc, created_at desc')
						.getTemp()
				]
			},
			filteredTasks() {
				if (this.activeFilter === 'all') {
					return this.tasks
				}
				return this.tasks.filter(task => task.status === this.activeFilter)
			},
			taskStats() {
				const stats = {
					total: this.tasks.length,
					todo: 0,
					in_progress: 0,
					completed: 0
				}

				this.tasks.forEach(task => {
					stats[task.status] = (stats[task.status] || 0) + 1
				})

				return stats
			},
			overallProgress() {
				if (this.taskStats.total === 0) return 0
				return Math.round((this.taskStats.completed / this.taskStats.total) * 100)
			}
		},
		onLoad(options) {
			this.bookId = options.id
			// 等待 unicloud-db 组件自动加载数据
		},
		onShow() {
			// 返回时刷新数据
			if (this.bookId && this.$refs.bookDetailDB && this.$refs.tasksDB) {
				this.$refs.bookDetailDB.loadData()
				this.$refs.tasksDB.loadData()
			}
		},
		onPullDownRefresh() {
			this.refreshData()
		},
		methods: {
			// 处理项目册信息加载完成
			onBookLoad(data) {
				if (data && data.title) {
					// 设置页面标题
					uni.setNavigationBarTitle({
						title: data.title
					})
					
					// 加载成员数量
					this.loadMemberCount()
				}
				uni.stopPullDownRefresh()
			},

			// 处理任务列表加载完成
			onTasksLoad(data) {
				console.log('原始任务数据:', data)
				// 确保数据格式正确，特别是 tags 字段
				this.tasks = (data || []).map(task => {
					console.log('处理任务:', task._id, '标签类型:', typeof task.tags, '标签值:', task.tags)
					return {
						...task,
						tags: Array.isArray(task.tags) ? task.tags : [],
						attachments: Array.isArray(task.attachments) ? task.attachments : [],
						comments: Array.isArray(task.comments) ? task.comments : []
					}
				})
				console.log('处理后的任务数据:', this.tasks)
				this.updateFilterCounts()
				uni.stopPullDownRefresh()
			},

			// 加载成员数量
			async loadMemberCount() {
				try {
					const result = await db.collection('todobook_members')
						.where({
							todobook_id: this.bookId,
							is_active: true
						})
						.count()
					
					this.memberCount = result.result.total || 1
				} catch (error) {
					console.error('获取成员数量失败:', error)
					this.memberCount = 1
				}
			},

			// 刷新数据
			async refreshData() {
				if (this.$refs.bookDetailDB && this.$refs.tasksDB) {
					await Promise.all([
						this.$refs.bookDetailDB.loadData(),
						this.$refs.tasksDB.loadData()
					])
					this.loadMemberCount()
				}
			},

			updateFilterCounts() {
				this.filterTabs[0].count = this.taskStats.total
				this.filterTabs[1].count = this.taskStats.todo
				this.filterTabs[2].count = this.taskStats.in_progress
				this.filterTabs[3].count = this.taskStats.completed
			},

			setActiveFilter(filter) {
				this.activeFilter = filter
			},

			async toggleTaskStatus(task) {
				const newStatus = task.status === 'completed' ? 'todo' : 
					(task.status === 'todo' ? 'in_progress' : 'completed')

				const updates = {
					status: newStatus,
					updated_at: new Date(),
					last_activity_at: new Date()
				}

				// 如果任务完成，设置完成时间和进度
				if (newStatus === 'completed') {
					updates.completed_at = new Date()
					updates.progress = 100
				} else {
					updates.completed_at = null
					if (newStatus === 'todo') {
						updates.progress = 0
					} else if (newStatus === 'in_progress') {
						updates.progress = Math.max(task.progress || 0, 10)
					}
				}

				try {
					const result = await db.collection('todoitems')
						.doc(task._id)
						.update(updates)

					if (result.result.updated > 0) {
						// 更新本地数据
						Object.assign(task, updates)
						this.updateFilterCounts()
						
						// 更新项目册的完成计数
						this.updateBookCompletedCount(task, newStatus)
					} else {
						throw new Error('更新失败')
					}
				} catch (error) {
					console.error('更新任务状态失败:', error)
					uni.showToast({
						title: error.message || '更新失败',
						icon: 'error'
					})
				}
			},

			// 更新项目册的完成计数
			async updateBookCompletedCount(task, newStatus) {
				try {
					const oldStatus = task.status
					let increment = 0
					
					if (newStatus === 'completed' && oldStatus !== 'completed') {
						increment = 1
					} else if (newStatus !== 'completed' && oldStatus === 'completed') {
						increment = -1
					}
					
					if (increment !== 0) {
						await db.collection('todobooks')
							.doc(this.bookId)
							.update({
								completed_count: db.command.inc(increment),
								last_activity_at: new Date()
							})
					}
				} catch (error) {
					console.error('更新项目册统计失败:', error)
				}
			},

			openTask(task) {
				uni.navigateTo({
					url: `/pages/tasks/detail?id=${task._id}&bookId=${this.bookId}`
				})
			},

			addTask() {
				uni.navigateTo({
					url: `/pages/tasks/create?bookId=${this.bookId}`
				})
			},

			showBookMenu() {
				this.$refs.bookMenuPopup.open()
			},

			hideBookMenu() {
				this.$refs.bookMenuPopup.close()
			},

			editTodoBook() {
				this.hideBookMenu()
				uni.navigateTo({
					url: `/pages/todobooks/edit?id=${this.bookId}`
				})
			},

			manageMember() {
				this.hideBookMenu()
				uni.navigateTo({
					url: `/pages/todobooks/members?id=${this.bookId}`
				})
			},

			showStatistics() {
				this.hideBookMenu()
				uni.navigateTo({
					url: `/pages/todobooks/statistics?id=${this.bookId}`
				})
			},

			exportTasks() {
				this.hideBookMenu()
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
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

			getEmptyText() {
				const map = {
					all: '还没有任务，创建第一个吧',
					todo: '没有待办任务',
					in_progress: '没有进行中的任务',
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

	.header-actions {
		padding: 10rpx;
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

	.task-header {
		flex-direction: row;
		align-items: flex-start;
		margin-bottom: 16rpx;
	}

	.task-checkbox {
		width: 40rpx;
		height: 40rpx;
		justify-content: center;
		align-items: center;
		margin-right: 16rpx;
		margin-top: 4rpx;
	}

	.task-content {
		flex: 1;
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

	/* 菜单弹窗 */
	.menu-sheet {
		background-color: #ffffff;
		border-radius: 20rpx 20rpx 0 0;
		padding-bottom: 40rpx;
	}

	.menu-header {
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		align-items: center;
	}

	.menu-title {
		font-size: 32rpx;
		color: #333333;
		font-weight: 500;
	}

	.menu-list {
		padding: 0 20rpx;
	}

	.menu-item {
		flex-direction: row;
		align-items: center;
		padding: 24rpx 20rpx;
		border-radius: 12rpx;
		margin: 8rpx 0;
	}

	.menu-item:active {
		background-color: #f8f8f8;
	}

	.menu-text {
		font-size: 30rpx;
		color: #333333;
		margin-left: 16rpx;
	}

	.menu-cancel {
		margin: 20rpx;
		padding: 24rpx;
		background-color: #f8f8f8;
		border-radius: 16rpx;
		align-items: center;
	}

	.menu-cancel:active {
		background-color: #e8e8e8;
	}

	.cancel-text {
		font-size: 30rpx;
		color: #666666;
	}
</style>