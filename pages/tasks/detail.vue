<template>
	<view class="task-detail">
		<!-- 任务详情查询 -->
		<unicloud-db 
			ref="taskDB"
			v-slot:default="{ data, loading, error }"
			:collection="taskCollection"
			@load="onTaskLoaded">
		</unicloud-db>
		
		<!-- 子任务查询 -->
		<unicloud-db 
			ref="subtasksDB"
			v-slot:default="{ data, loading, error }"
			:collection="subtasksCollection"
			@load="onSubtasksLoaded">
		</unicloud-db>
		
		<!-- 任务状态更新 -->
		<unicloud-db 
			ref="updateTaskDB"
			:collection="taskUpdateCollection"
			action="update"
			@success="onTaskUpdated"
			@error="onUpdateError">
		</unicloud-db>
		
		<view v-if="loading" class="loading-section">
			<uni-load-more status="loading" />
		</view>

		<view v-else-if="task" class="detail-content">
			<!-- 任务头部 -->
			<view class="task-header">
				<view class="header-top">
					<view class="task-status" @click="toggleStatus">
						<uni-icons 
							v-if="task.status === 'completed'"
							color="#28a745" 
							size="32" 
							type="checkmarkempty" />
						<uni-icons 
							v-else-if="task.status === 'in_progress'"
							color="#ffc107" 
							size="32" 
							type="loop" />
						<uni-icons 
							v-else
							color="#cccccc" 
							size="32" 
							type="circle" />
					</view>
					<view class="task-info">
						<text class="task-title" :class="{ completed: task.status === 'completed' }">{{ task.title }}</text>
						<view class="task-meta">
							<text class="meta-text">{{ formatTime(task.created_at) }} 创建</text>
							<view class="priority-badge" :class="task.priority">
								<text class="priority-text">{{ getPriorityText(task.priority) }}</text>
							</view>
						</view>
					</view>
					<view class="header-actions" @click="showTaskMenu">
						<uni-icons color="#999999" size="24" type="more-filled" />
					</view>
				</view>

				<!-- 进度条 -->
				<view class="progress-section" v-if="task.progress > 0 && task.status !== 'completed'">
					<view class="progress-info">
						<text class="progress-label">完成进度</text>
						<text class="progress-percent">{{ task.progress }}%</text>
					</view>
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: task.progress + '%' }"></view>
					</view>
				</view>
			</view>

			<!-- 任务描述 -->
			<view class="description-section" v-if="task.description">
				<view class="section-header">
					<text class="section-title">任务描述</text>
				</view>
				<text class="description-content">{{ task.description }}</text>
			</view>

			<!-- 任务属性 -->
			<view class="attributes-section">
				<view class="section-header">
					<text class="section-title">任务属性</text>
				</view>
				<view class="attributes-list">
					<view class="attribute-item" v-if="task.due_date">
						<view class="attr-icon">
							<uni-icons color="#ff9800" size="20" type="calendar" />
						</view>
						<view class="attr-content">
							<text class="attr-label">截止日期</text>
							<text class="attr-value" :class="{ overdue: isOverdue(task.due_date) }">{{ formatDueDate(task.due_date) }}</text>
						</view>
					</view>
					
					<view class="attribute-item" v-if="task.estimated_hours > 0">
						<view class="attr-icon">
							<uni-icons color="#17a2b8" size="20" type="clock" />
						</view>
						<view class="attr-content">
							<text class="attr-label">预估工时</text>
							<text class="attr-value">{{ task.estimated_hours }}小时</text>
						</view>
					</view>

					<view class="attribute-item" v-if="task.actual_hours > 0">
						<view class="attr-icon">
							<uni-icons color="#28a745" size="20" type="clock" />
						</view>
						<view class="attr-content">
							<text class="attr-label">实际工时</text>
							<text class="attr-value">{{ task.actual_hours }}小时</text>
						</view>
					</view>

					<view class="attribute-item" v-if="assigneeInfo">
						<view class="attr-icon">
							<uni-icons color="#6c757d" size="20" type="person" />
						</view>
						<view class="attr-content">
							<text class="attr-label">负责人</text>
							<text class="attr-value">{{ assigneeInfo.nickname || assigneeInfo.username }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 标签 -->
			<view class="tags-section" v-if="task.tags && Array.isArray(task.tags) && task.tags.length > 0">
				<view class="section-header">
					<text class="section-title">标签</text>
				</view>
				<view class="tags-list">
					<view v-for="tag in task.tags" :key="tag" class="tag-item">
						<text class="tag-text">{{ tag }}</text>
					</view>
				</view>
			</view>

			<!-- 子任务 -->
			<view class="subtasks-section" v-if="subtasks.length > 0">
				<view class="section-header">
					<text class="section-title">子任务 ({{ task.completed_subtask_count }}/{{ task.subtask_count }})</text>
					<view class="add-subtask" @click="addSubtask">
						<uni-icons color="#007AFF" size="18" type="plus" />
					</view>
				</view>
				<view class="subtasks-list">
					<view 
						v-for="subtask in subtasks" 
						:key="subtask._id"
						class="subtask-item"
						@click="openSubtask(subtask)">
						<view class="subtask-checkbox" @click.stop="toggleSubtaskStatus(subtask)">
							<uni-icons 
								v-if="subtask.status === 'completed'"
								color="#28a745" 
								size="18" 
								type="checkmarkempty" />
							<uni-icons 
								v-else
								color="#cccccc" 
								size="18" 
								type="circle" />
						</view>
						<text class="subtask-title" :class="{ completed: subtask.status === 'completed' }">{{ subtask.title }}</text>
					</view>
				</view>
			</view>

			<!-- 评论区域 -->
			<view class="comments-section">
				<view class="section-header">
					<text class="section-title">评论 ({{ task.comments?.length || 0 }})</text>
					<view class="add-comment" @click="showAddComment">
						<uni-icons color="#007AFF" size="18" type="chatboxes" />
					</view>
				</view>
				<view v-if="task.comments && task.comments.length > 0" class="comments-list">
					<view v-for="comment in task.comments" :key="comment.created_at" class="comment-item">
						<view class="comment-header">
							<text class="comment-author">{{ comment.user_nickname || '用户' }}</text>
							<text class="comment-time">{{ formatTime(comment.created_at) }}</text>
						</view>
						<text class="comment-content">{{ comment.content }}</text>
					</view>
				</view>
				<view v-else class="empty-comments">
					<text class="empty-text">暂无评论</text>
				</view>
			</view>
		</view>

		<!-- 任务菜单弹窗 -->
		<uni-popup ref="taskMenuPopup" type="bottom" background-color="#ffffff">
			<view class="menu-sheet">
				<view class="menu-header">
					<text class="menu-title">任务操作</text>
				</view>
				<view class="menu-list">
					<view class="menu-item" @click="editTask">
						<uni-icons color="#007AFF" size="20" type="compose" />
						<text class="menu-text">编辑任务</text>
					</view>
					<view class="menu-item" @click="updateProgress">
						<uni-icons color="#28a745" size="20" type="gear" />
						<text class="menu-text">更新进度</text>
					</view>
					<view class="menu-item" @click="addTimeRecord">
						<uni-icons color="#17a2b8" size="20" type="clock" />
						<text class="menu-text">记录工时</text>
					</view>
					<view class="menu-item danger" @click="deleteTask">
						<uni-icons color="#FF4757" size="20" type="trash" />
						<text class="menu-text">删除任务</text>
					</view>
				</view>
				<view class="menu-cancel" @click="hideTaskMenu">
					<text class="cancel-text">取消</text>
				</view>
			</view>
		</uni-popup>

		<!-- 添加评论弹窗 -->
		<uni-popup ref="commentPopup" type="dialog">
			<uni-popup-dialog 
				title="添加评论"
				placeholder="请输入评论内容"
				:value="newComment"
				@confirm="addComment"
				@close="closeCommentDialog">
			</uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				taskId: '',
				bookId: '',
				task: null,
				subtasks: [],
				assigneeInfo: null,
				loading: true,
				newComment: ''
			}
		},
		computed: {
			taskCollection() {
				if (!this.taskId || typeof this.taskId !== 'string') {
					console.warn("taskId is empty, undefined or not string:", this.taskId)
					return null
				}
				console.log("taskCollection")
				const db = uniCloud.database()
				// 使用 where 查询代替 doc() 方法
				return [
					db.collection('todoitems')
						.where(`_id == "${this.taskId}"`)
						.getTemp()
				]
			},
			subtasksCollection() {
				return null
				if (!this.taskId) return null
				const db = uniCloud.database()
				return [
					db.collection('todoitems')
						.where({
							parent_id: this.taskId
						})
						.orderBy('sort_order', 'asc')
						.orderBy('created_at', 'asc')
						.getTemp()
				]
			},
			taskUpdateCollection() {
				const db = uniCloud.database()
				return db.collection('todoitems')
			}
		},
		onLoad(options) {
			if (!options.id) {
				uni.showToast({
					title: '缺少任务ID',
					icon: 'error'
				})
				uni.navigateBack()
				return
			}
			this.taskId = options.id
			this.bookId = options.bookId
		},
		methods: {
			onTaskLoaded(data) {
				// 任务数据加载完成
				if (data && data.length > 0) {
					this.task = data[0]
					
					// 获取负责人信息
					if (this.task.assignee_id) {
						this.loadAssigneeInfo()
					}

					// 设置页面标题
					uni.setNavigationBarTitle({
						title: this.task.title
					})
				}
				this.loading = false
			},
			
			onSubtasksLoaded(data) {
				// 子任务数据加载完成
				this.subtasks = data || []
			},

			async loadAssigneeInfo() {
				// 这里可以调用用户信息接口获取负责人详情
				// 暂时使用mock数据
				this.assigneeInfo = {
					nickname: '当前用户',
					username: 'user'
				}
			},

			async toggleStatus() {
				const newStatus = this.task.status === 'completed' ? 'todo' : 
					(this.task.status === 'todo' ? 'in_progress' : 'completed')

				try {
					const updateData = {
						status: newStatus,
						updated_at: new Date()
					}
					
					if (newStatus === 'completed') {
						updateData.completed_at = new Date()
						updateData.progress = 100
					} else {
						updateData.completed_at = null
						updateData.progress = newStatus === 'in_progress' ? Math.max(this.task.progress || 0, 10) : 0
					}

					await this.$refs.updateTaskDB.update(this.taskId, updateData)
				} catch (error) {
					uni.showToast({
						title: error.message || '更新失败',
						icon: 'error'
					})
				}
			},
			
			onTaskUpdated(e) {
				// 任务更新成功事件处理
				this.task.status = e.status || this.task.status
				this.task.completed_at = e.completed_at
				this.task.progress = e.progress || this.task.progress
				
				uni.showToast({
					title: '状态更新成功',
					icon: 'success'
				})
			},
			
			onUpdateError(e) {
				// 任务更新失败事件处理
				console.error('更新任务失败:', e)
				uni.showToast({
					title: e.message || '更新失败',
					icon: 'error'
				})
			},

			async toggleSubtaskStatus(subtask) {
				const newStatus = subtask.status === 'completed' ? 'todo' : 'completed'

				try {
					const updateData = {
						status: newStatus,
						updated_at: new Date()
					}
					
					if (newStatus === 'completed') {
						updateData.completed_at = new Date()
						updateData.progress = 100
					} else {
						updateData.completed_at = null
						updateData.progress = 0
					}

					await this.$refs.updateTaskDB.update(subtask._id, updateData)
					
					// 本地更新状态
					subtask.status = newStatus
					
					// 更新父任务的子任务完成数量
					if (newStatus === 'completed') {
						this.task.completed_subtask_count++
					} else {
						this.task.completed_subtask_count--
					}
					
					uni.showToast({
						title: '状态更新成功',
						icon: 'success'
					})
				} catch (error) {
					uni.showToast({
						title: error.message || '更新失败',
						icon: 'error'
					})
				}
			},

			openSubtask(subtask) {
				uni.navigateTo({
					url: `/pages/tasks/detail?id=${subtask._id}&bookId=${this.bookId}`
				})
			},

			addSubtask() {
				uni.navigateTo({
					url: `/pages/tasks/create?bookId=${this.bookId}&parentId=${this.taskId}`
				})
			},

			showTaskMenu() {
				this.$refs.taskMenuPopup.open()
			},

			hideTaskMenu() {
				this.$refs.taskMenuPopup.close()
			},

			editTask() {
				this.hideTaskMenu()
				uni.navigateTo({
					url: `/pages/tasks/edit?id=${this.taskId}&bookId=${this.bookId}`
				})
			},

			updateProgress() {
				this.hideTaskMenu()
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				})
			},

			addTimeRecord() {
				this.hideTaskMenu()
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				})
			},

			deleteTask() {
				this.hideTaskMenu()
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这个任务吗？删除后无法恢复。',
					confirmColor: '#FF4757',
					success: (res) => {
						if (res.confirm) {
							// TODO: 实现删除任务功能
							uni.showToast({
								title: '功能开发中',
								icon: 'none'
							})
						}
					}
				})
			},

			showAddComment() {
				this.newComment = ''
				this.$refs.commentPopup.open()
			},

			addComment(content) {
				// TODO: 实现添加评论功能
				console.log('添加评论:', content)
				this.closeCommentDialog()
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				})
			},

			closeCommentDialog() {
				this.$refs.commentPopup.close()
				this.newComment = ''
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

	.task-detail {
		flex: 1;
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	.loading-section {
		padding: 60rpx 0;
		align-items: center;
		justify-content: center;
	}

	.detail-content {
		padding: 20rpx;
		gap: 20rpx;
	}

	/* 通用区域样式 */
	.task-header,
	.description-section,
	.attributes-section,
	.tags-section,
	.subtasks-section,
	.comments-section {
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 30rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	}

	.section-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;
		padding-bottom: 16rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.section-title {
		font-size: 32rpx;
		color: #333333;
		font-weight: 500;
	}

	/* 任务头部 */
	.header-top {
		flex-direction: row;
		align-items: flex-start;
		margin-bottom: 24rpx;
	}

	.task-status {
		width: 60rpx;
		height: 60rpx;
		justify-content: center;
		align-items: center;
		margin-right: 20rpx;
	}

	.task-info {
		flex: 1;
	}

	.task-title {
		font-size: 36rpx;
		color: #333333;
		font-weight: 600;
		line-height: 1.4;
		margin-bottom: 12rpx;
	}

	.task-title.completed {
		color: #999999;
		/* #ifndef APP-NVUE */
		text-decoration: line-through;
		/* #endif */
	}

	.task-meta {
		flex-direction: row;
		align-items: center;
		gap: 16rpx;
	}

	.meta-text {
		font-size: 26rpx;
		color: #999999;
	}

	.priority-badge {
		padding: 8rpx 16rpx;
		border-radius: 12rpx;
	}

	.priority-badge.low {
		background-color: #e8f5e8;
	}

	.priority-badge.medium {
		background-color: #fff3e0;
	}

	.priority-badge.high {
		background-color: #ffebee;
	}

	.priority-badge.urgent {
		background-color: #ffebee;
	}

	.priority-text {
		font-size: 22rpx;
		font-weight: 500;
	}

	.priority-badge.low .priority-text {
		color: #28a745;
	}

	.priority-badge.medium .priority-text {
		color: #ff9800;
	}

	.priority-badge.high .priority-text {
		color: #f44336;
	}

	.priority-badge.urgent .priority-text {
		color: #d32f2f;
	}

	.header-actions {
		padding: 10rpx;
	}

	/* 进度区域 */
	.progress-section {
		border-top: 1rpx solid #f0f0f0;
		padding-top: 24rpx;
	}

	.progress-info {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12rpx;
	}

	.progress-label {
		font-size: 28rpx;
		color: #666666;
	}

	.progress-percent {
		font-size: 28rpx;
		color: #007AFF;
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
		background-color: #007AFF;
		transition: width 0.3s ease;
	}

	/* 描述区域 */
	.description-content {
		font-size: 30rpx;
		color: #333333;
		line-height: 1.6;
	}

	/* 属性区域 */
	.attributes-list {
		gap: 24rpx;
	}

	.attribute-item {
		flex-direction: row;
		align-items: center;
	}

	.attr-icon {
		width: 60rpx;
		height: 60rpx;
		background-color: #f8f8f8;
		border-radius: 30rpx;
		justify-content: center;
		align-items: center;
		margin-right: 20rpx;
	}

	.attr-content {
		flex: 1;
	}

	.attr-label {
		font-size: 26rpx;
		color: #999999;
		margin-bottom: 4rpx;
	}

	.attr-value {
		font-size: 30rpx;
		color: #333333;
		font-weight: 500;
	}

	.attr-value.overdue {
		color: #ff4757;
	}

	/* 标签区域 */
	.tags-list {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 12rpx;
	}

	.tag-item {
		background-color: #f0f6ff;
		padding: 12rpx 20rpx;
		border-radius: 20rpx;
		border: 1rpx solid #e6f3ff;
	}

	.tag-text {
		font-size: 26rpx;
		color: #007AFF;
	}

	/* 子任务区域 */
	.add-subtask {
		width: 36rpx;
		height: 36rpx;
		background-color: #f0f6ff;
		border-radius: 18rpx;
		justify-content: center;
		align-items: center;
	}

	.subtasks-list {
		gap: 20rpx;
	}

	.subtask-item {
		flex-direction: row;
		align-items: center;
		padding: 20rpx;
		background-color: #f8f8f8;
		border-radius: 12rpx;
	}

	.subtask-item:active {
		background-color: #f0f0f0;
	}

	.subtask-checkbox {
		width: 36rpx;
		height: 36rpx;
		justify-content: center;
		align-items: center;
		margin-right: 16rpx;
	}

	.subtask-title {
		flex: 1;
		font-size: 30rpx;
		color: #333333;
	}

	.subtask-title.completed {
		color: #999999;
		/* #ifndef APP-NVUE */
		text-decoration: line-through;
		/* #endif */
	}

	/* 评论区域 */
	.add-comment {
		width: 36rpx;
		height: 36rpx;
		background-color: #f0f6ff;
		border-radius: 18rpx;
		justify-content: center;
		align-items: center;
	}

	.comments-list {
		gap: 20rpx;
	}

	.comment-item {
		padding: 20rpx;
		background-color: #f8f8f8;
		border-radius: 12rpx;
	}

	.comment-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12rpx;
	}

	.comment-author {
		font-size: 26rpx;
		color: #666666;
		font-weight: 500;
	}

	.comment-time {
		font-size: 24rpx;
		color: #999999;
	}

	.comment-content {
		font-size: 28rpx;
		color: #333333;
		line-height: 1.5;
	}

	.empty-comments {
		padding: 40rpx 20rpx;
		align-items: center;
		justify-content: center;
	}

	.empty-text {
		font-size: 26rpx;
		color: #999999;
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

	.menu-item.danger .menu-text {
		color: #FF4757;
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