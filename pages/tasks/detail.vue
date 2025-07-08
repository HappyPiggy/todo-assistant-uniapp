<template>
	<view class="task-detail">
		
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

				<!-- 父子关系信息 -->
				<view class="relations-section" v-if="parentTask || subtasks.length > 0">
					<view class="section-header">
						<text class="section-title">任务关系</text>
					</view>
					<view class="relations-content">
						<view class="relation-item" v-if="parentTask" @click="openParentTask">
							<view class="relation-icon">
								<uni-icons color="#666666" size="16" type="arrowup" />
							</view>
							<text class="relation-text">父任务：{{ parentTask.title }}</text>
						</view>
						<view class="relation-item" v-if="subtasks.length > 0">
							<view class="relation-icon">
								<uni-icons color="#666666" size="16" type="arrowdown" />
							</view>
							<text class="relation-text">子任务：{{ subtasks.length }}个</text>
						</view>
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
					<text class="section-title">评论 ({{ commentsData.total || 0 }})</text>
					<view class="add-comment" @click="showAddComment">
						<uni-icons color="#007AFF" size="18" type="chatboxes" />
					</view>
				</view>
				
				<!-- 评论加载状态 -->
				<view v-if="commentsLoading && comments.length === 0" class="comments-loading">
					<uni-load-more status="loading" />
				</view>
				
				<!-- 评论列表 -->
				<view v-else-if="comments.length > 0" class="comments-list">
					<view 
						v-for="comment in comments" 
						:key="comment._id"
						class="comment-item">
						
						<!-- 主评论 -->
						<view class="comment-main">
							<view class="comment-avatar">
								<image 
									v-if="comment.user_avatar" 
									:src="comment.user_avatar" 
									class="avatar-img" 
									mode="aspectFill" />
								<view v-else class="avatar-placeholder">
									<text class="avatar-text">{{ (comment.user_nickname || '用户').charAt(0) }}</text>
								</view>
							</view>
							<view class="comment-content-wrapper">
								<view class="comment-header">
									<text class="comment-author">{{ comment.user_nickname || '用户' }}</text>
									<text class="comment-time">{{ formatTime(comment.created_at) }}</text>
								</view>
								<text class="comment-content">{{ comment.content }}</text>
								
								<!-- 评论操作 -->
								<view class="comment-actions">
									<view class="action-btn" @click="showReplyInput(comment)">
										<text class="action-text">回复</text>
									</view>
									<view 
										v-if="canEditComment(comment)" 
										class="action-btn" 
										@click="editComment(comment)">
										<text class="action-text">编辑</text>
									</view>
									<view 
										v-if="canDeleteComment(comment)" 
										class="action-btn danger" 
										@click="deleteComment(comment)">
										<text class="action-text">删除</text>
									</view>
								</view>
							</view>
						</view>
						
						<!-- 回复列表 -->
						<view v-if="comment.replies && comment.replies.length > 0" class="replies-list">
							<view 
								v-for="reply in comment.replies" 
								:key="reply._id"
								class="reply-item">
								<view class="comment-avatar">
									<image 
										v-if="reply.user_avatar" 
										:src="reply.user_avatar" 
										class="avatar-img" 
										mode="aspectFill" />
									<view v-else class="avatar-placeholder">
										<text class="avatar-text">{{ (reply.user_nickname || '用户').charAt(0) }}</text>
									</view>
								</view>
								<view class="comment-content-wrapper">
									<view class="comment-header">
										<text class="comment-author">{{ reply.user_nickname || '用户' }}</text>
										<text class="comment-time">{{ formatTime(reply.created_at) }}</text>
									</view>
									<text class="comment-content">{{ reply.content }}</text>
									
									<!-- 回复操作 -->
									<view class="comment-actions">
										<view 
											v-if="canEditComment(reply)" 
											class="action-btn" 
											@click="editComment(reply)">
											<text class="action-text">编辑</text>
										</view>
										<view 
											v-if="canDeleteComment(reply)" 
											class="action-btn danger" 
											@click="deleteComment(reply)">
											<text class="action-text">删除</text>
										</view>
									</view>
								</view>
							</view>
						</view>
					</view>
					
					<!-- 加载更多 -->
					<view v-if="commentsData.hasMore" class="load-more-comments">
						<uni-load-more 
							:status="commentsLoading ? 'loading' : 'more'" 
							@click="loadMoreComments" />
					</view>
				</view>
				
				<!-- 空状态 -->
				<view v-else class="empty-comments">
					<text class="empty-text">暂无评论，来发表第一条评论吧</text>
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

		<!-- 添加/编辑评论弹窗 -->
		<uni-popup ref="commentPopup" type="center" background-color="rgba(0,0,0,0.5)">
			<view class="comment-dialog">
				<view class="dialog-header">
					<text class="dialog-title">{{ commentEditMode === 'add' ? '添加评论' : commentEditMode === 'reply' ? '回复评论' : '编辑评论' }}</text>
					<view class="dialog-close" @click="closeCommentDialog">
						<uni-icons color="#999" size="20" type="close" />
					</view>
				</view>
				<view class="dialog-content">
					<textarea 
						v-model="commentFormData.content" 
						placeholder="请输入评论内容"
						class="comment-input"
						:maxlength="1000"
						:show-confirm-bar="false"
						:auto-height="true"
						:cursor-spacing="20"
						:focus="true" />
					<view class="char-count">
						<text class="count-text">{{ (commentFormData.content || '').length }}/1000</text>
					</view>
				</view>
				<view class="dialog-actions">
					<view class="action-btn cancel-btn" @click="closeCommentDialog">
						<text class="btn-text">取消</text>
					</view>
					<view class="action-btn confirm-btn" @click="submitComment(commentFormData.content)">
						<text class="btn-text">确定</text>
					</view>
				</view>
			</view>
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
				parentTask: null,
				assigneeInfo: null,
				loading: true,
				error: null,
				// 评论相关
				comments: [],
				commentsData: {
					total: 0,
					page: 1,
					pageSize: 20,
					hasMore: false
				},
				commentsLoading: false,
				commentEditMode: 'add', // add, reply, edit
				commentFormData: {
					content: '',
					commentId: null,
					parentCommentId: null
				},
				currentUser: null
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
			
			// 获取当前用户信息
			this.getCurrentUser()
			
			// 加载任务详情和评论
			this.loadTaskDetail()
			this.loadComments()
			
			// 标记任务为已读
			this.markTaskAsRead()
		},
		methods: {
			// 加载任务详情
			async loadTaskDetail() {
				this.loading = true
				this.error = null
				
				try {
					const todoBooksObj = uniCloud.importObject('todobook-co')
					const result = await todoBooksObj.getTaskDetail(this.taskId)
					
					if (result.code === 0) {
						this.task = result.data.task
						this.subtasks = result.data.subtasks || []
						
						// 加载父任务信息
						if (this.task.parent_id) {
							this.loadParentTask()
						}
						
						// 获取负责人信息
						if (this.task.assignee_id) {
							this.loadAssigneeInfo()
						}

						// 设置页面标题
						uni.setNavigationBarTitle({
							title: this.task.title
						})
						
						// 存储项目册创建者信息用于权限判断
						if (result.data.todobook_creator_id) {
							this.task.todobook_creator_id = result.data.todobook_creator_id
						}
					} else {
						this.error = result.message || '获取任务详情失败'
						uni.showToast({
							title: this.error,
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('加载任务详情失败:', error)
					this.error = '网络错误，请重试'
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'none'
					})
				} finally {
					this.loading = false
				}
			},

			async loadAssigneeInfo() {
				// 这里可以调用用户信息接口获取负责人详情
				// 暂时使用mock数据
				this.assigneeInfo = {
					nickname: '当前用户',
					username: 'user'
				}
			},

			async loadParentTask() {
				try {
					const todoBooksObj = uniCloud.importObject('todobook-co')
					const result = await todoBooksObj.getTaskDetail(this.task.parent_id)
					
					if (result.code === 0) {
						this.parentTask = result.data.task
					}
				} catch (error) {
					console.error('加载父任务失败:', error)
				}
			},

			openParentTask() {
				if (this.parentTask) {
					uni.navigateTo({
						url: `/pages/tasks/detail?id=${this.parentTask._id}&bookId=${this.bookId}`
					})
				}
			},

			async toggleStatus() {
				// 如果有子任务且不是全部完成，不允许直接完成父任务
				if (this.subtasks.length > 0 && this.task.completed_subtask_count < this.task.subtask_count && this.task.status !== 'completed') {
					uni.showToast({
						title: '请先完成所有子任务',
						icon: 'none'
					})
					return
				}

				const newStatus = this.task.status === 'completed' ? 'todo' : 'completed'

				try {
					const todoBooksObj = uniCloud.importObject('todobook-co')
					const result = await todoBooksObj.updateTodoItemStatus(this.taskId, newStatus)

					if (result.code === 0) {
						// 更新本地数据
						this.task.status = newStatus
						this.task.updated_at = new Date()
						
						if (newStatus === 'completed') {
							this.task.completed_at = new Date()
						} else {
							this.task.completed_at = null
						}
						
						uni.showToast({
							title: '状态更新成功',
							icon: 'success'
						})
					} else {
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

			async toggleSubtaskStatus(subtask) {
				const newStatus = subtask.status === 'completed' ? 'todo' : 'completed'

				try {
					const todoBooksObj = uniCloud.importObject('todobook-co')
					const result = await todoBooksObj.updateTodoItemStatus(subtask._id, newStatus)

					if (result.code === 0) {
						// 本地更新状态
						subtask.status = newStatus
						subtask.updated_at = new Date()
						
						if (newStatus === 'completed') {
							subtask.completed_at = new Date()
							this.task.completed_subtask_count++
						} else {
							subtask.completed_at = null
							this.task.completed_subtask_count--
						}
						
						uni.showToast({
							title: '状态更新成功',
							icon: 'success'
						})
					} else {
						throw new Error(result.message || '更新失败')
					}
				} catch (error) {
					console.error('更新子任务状态失败:', error)
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

			// 获取当前用户信息
			async getCurrentUser() {
				try {
					const userInfo = await uniCloud.getCurrentUserInfo()
					this.currentUser = userInfo
				} catch (error) {
					console.error('获取用户信息失败:', error)
				}
			},

			// 加载评论列表
			async loadComments(refresh = true) {
				if (this.commentsLoading) return
				
				this.commentsLoading = true
				
				if (refresh) {
					this.commentsData.page = 1
					this.comments = []
				}
				
				try {
					const todoBooksObj = uniCloud.importObject('todobook-co')
					const result = await todoBooksObj.getTaskComments(
						this.taskId, 
						this.commentsData.page, 
						this.commentsData.pageSize
					)
					
					if (result.code === 0) {
						if (refresh) {
							this.comments = result.data.comments
						} else {
							this.comments.push(...result.data.comments)
						}
						
						this.commentsData = {
							total: result.data.total,
							page: result.data.page,
							pageSize: result.data.pageSize,
							hasMore: result.data.hasMore
						}
					} else {
						console.error('加载评论失败:', result.message)
					}
				} catch (error) {
					console.error('加载评论失败:', error)
				} finally {
					this.commentsLoading = false
				}
			},

			// 加载更多评论
			loadMoreComments() {
				if (this.commentsLoading || !this.commentsData.hasMore) return
				
				this.commentsData.page++
				this.loadComments(false)
			},

			// 显示添加评论对话框
			showAddComment() {
				this.commentEditMode = 'add'
				this.commentFormData = {
					content: '',
					commentId: null,
					parentCommentId: null
				}
				this.$refs.commentPopup.open()
			},

			// 显示回复输入框
			showReplyInput(comment) {
				this.commentEditMode = 'reply'
				this.commentFormData = {
					content: '',
					commentId: null,
					parentCommentId: comment._id
				}
				this.$refs.commentPopup.open()
			},

			// 编辑评论
			editComment(comment) {
				this.commentEditMode = 'edit'
				this.commentFormData = {
					content: comment.content,
					commentId: comment._id,
					parentCommentId: null
				}
				this.$refs.commentPopup.open()
			},

			// 提交评论
			async submitComment(content) {
				if (!content || content.trim().length === 0) {
					uni.showToast({
						title: '请输入评论内容',
						icon: 'none'
					})
					return
				}

				try {
					const todoBooksObj = uniCloud.importObject('todobook-co')
					let result

					if (this.commentEditMode === 'edit') {
						// 编辑评论
						result = await todoBooksObj.updateTaskComment(
							this.commentFormData.commentId, 
							content
						)
					} else {
						// 添加评论或回复
						result = await todoBooksObj.addTaskComment(
							this.taskId, 
							content, 
							this.commentFormData.parentCommentId
						)
					}

					if (result.code === 0) {
						uni.showToast({
							title: result.message || '操作成功',
							icon: 'success'
						})
						
						// 刷新评论列表
						this.loadComments()
						this.closeCommentDialog()
					} else {
						uni.showToast({
							title: result.message || '操作失败',
							icon: 'error'
						})
					}
				} catch (error) {
					console.error('提交评论失败:', error)
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'error'
					})
				}
			},

			// 删除评论
			deleteComment(comment) {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这条评论吗？删除后无法恢复。',
					confirmColor: '#FF4757',
					success: async (res) => {
						if (res.confirm) {
							try {
								const todoBooksObj = uniCloud.importObject('todobook-co')
								const result = await todoBooksObj.deleteTaskComment(comment._id)

								if (result.code === 0) {
									uni.showToast({
										title: '删除成功',
										icon: 'success'
									})
									
									// 刷新评论列表
									this.loadComments()
								} else {
									uni.showToast({
										title: result.message || '删除失败',
										icon: 'error'
									})
								}
							} catch (error) {
								console.error('删除评论失败:', error)
								uni.showToast({
									title: '网络错误，请重试',
									icon: 'error'
								})
							}
						}
					}
				})
			},

			// 关闭评论对话框
			closeCommentDialog() {
				this.$refs.commentPopup.close()
				this.commentFormData = {
					content: '',
					commentId: null,
					parentCommentId: null
				}
			},

			// 权限检查 - 是否可以编辑评论
			canEditComment(comment) {
				return this.currentUser && comment.user_id === this.currentUser.uid
			},

			// 权限检查 - 是否可以删除评论
			canDeleteComment(comment) {
				if (!this.currentUser) return false
				
				// 评论作者可以删除自己的评论
				if (comment.user_id === this.currentUser.uid) {
					return true
				}
				
				// 项目册owner可以删除所有评论
				if (this.task && this.task.todobook_creator_id === this.currentUser.uid) {
					return true
				}
				
				return false
			},

			// 标记任务为已读
			markTaskAsRead() {
				if (!this.taskId) return
				
				try {
					const lastViewTimes = uni.getStorageSync('task_comment_view_times') || {}
					lastViewTimes[this.taskId] = Date.now()
					uni.setStorageSync('task_comment_view_times', lastViewTimes)
				} catch (error) {
					console.error('标记已读失败:', error)
				}
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

	/* 关系区域 */
	.relations-section {
		border-top: 1rpx solid #f0f0f0;
		padding-top: 24rpx;
	}

	.relations-content {
		gap: 16rpx;
	}

	.relation-item {
		flex-direction: row;
		align-items: center;
		padding: 16rpx;
		background-color: #f8f8f8;
		border-radius: 12rpx;
	}

	.relation-item:active {
		background-color: #f0f0f0;
	}

	.relation-icon {
		width: 32rpx;
		height: 32rpx;
		background-color: #ffffff;
		border-radius: 16rpx;
		justify-content: center;
		align-items: center;
		margin-right: 12rpx;
	}

	.relation-text {
		font-size: 28rpx;
		color: #333333;
		flex: 1;
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

	.comments-loading {
		padding: 40rpx 0;
		align-items: center;
		justify-content: center;
	}

	.comments-list {
		gap: 24rpx;
	}

	.comment-item {
		background-color: #ffffff;
		border-radius: 12rpx;
		padding: 24rpx;
		box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.1);
	}

	.comment-main {
		flex-direction: row;
		align-items: flex-start;
	}

	.comment-avatar {
		width: 64rpx;
		height: 64rpx;
		margin-right: 16rpx;
		flex-shrink: 0;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 32rpx;
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		background-color: #007AFF;
		border-radius: 32rpx;
		justify-content: center;
		align-items: center;
	}

	.avatar-text {
		font-size: 24rpx;
		color: #ffffff;
		font-weight: 500;
	}

	.comment-content-wrapper {
		flex: 1;
	}

	.comment-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12rpx;
	}

	.comment-author {
		font-size: 28rpx;
		color: #333333;
		font-weight: 500;
	}

	.comment-time {
		font-size: 24rpx;
		color: #999999;
	}

	.comment-content {
		font-size: 30rpx;
		color: #333333;
		line-height: 1.6;
		margin-bottom: 16rpx;
	}

	.comment-actions {
		flex-direction: row;
		align-items: center;
		gap: 24rpx;
	}

	.action-btn {
		padding: 8rpx 16rpx;
		background-color: #f8f8f8;
		border-radius: 16rpx;
		border: 1rpx solid #e8e8e8;
	}

	.action-btn:active {
		background-color: #e8e8e8;
	}

	.action-btn.danger {
		background-color: #ffebee;
		border-color: #ffcdd2;
	}

	.action-btn.danger:active {
		background-color: #ffcdd2;
	}

	.action-text {
		font-size: 24rpx;
		color: #666666;
	}

	.action-btn.danger .action-text {
		color: #f44336;
	}

	/* 回复列表 */
	.replies-list {
		margin-top: 16rpx;
		margin-left: 80rpx;
		gap: 16rpx;
	}

	.reply-item {
		flex-direction: row;
		align-items: flex-start;
		padding: 16rpx;
		background-color: #f8f8f8;
		border-radius: 8rpx;
		border-left: 3rpx solid #007AFF;
	}

	.reply-item .comment-avatar {
		width: 48rpx;
		height: 48rpx;
		margin-right: 12rpx;
	}

	.reply-item .avatar-placeholder {
		border-radius: 24rpx;
	}

	.reply-item .avatar-img {
		border-radius: 24rpx;
	}

	.reply-item .avatar-text {
		font-size: 20rpx;
	}

	.reply-item .comment-content {
		font-size: 28rpx;
		margin-bottom: 12rpx;
	}

	.reply-item .comment-author {
		font-size: 26rpx;
	}

	.load-more-comments {
		margin-top: 20rpx;
		align-items: center;
	}

	.empty-comments {
		padding: 60rpx 20rpx;
		align-items: center;
		justify-content: center;
	}

	.empty-text {
		font-size: 28rpx;
		color: #999999;
		text-align: center;
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

	/* 评论弹窗样式 */
	.comment-dialog {
		width: 600rpx;
		background-color: #ffffff;
		border-radius: 16rpx;
		overflow: hidden;
	}

	.dialog-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.dialog-title {
		font-size: 32rpx;
		font-weight: 500;
		color: #333333;
	}

	.dialog-close {
		width: 40rpx;
		height: 40rpx;
		justify-content: center;
		align-items: center;
	}

	.dialog-content {
		padding: 30rpx;
	}

	.comment-input {
		width: 100%;
		min-height: 200rpx;
		max-height: 400rpx;
		padding: 20rpx;
		background-color: #f8f8f8;
		border-radius: 12rpx;
		border: 1rpx solid #e8e8e8;
		font-size: 30rpx;
		color: #333333;
		line-height: 1.6;
		/* #ifndef APP-NVUE */
		box-sizing: border-box;
		resize: none;
		/* #endif */
	}

	.comment-input:focus {
		border-color: #007AFF;
	}

	.char-count {
		margin-top: 16rpx;
		flex-direction: row;
		justify-content: flex-end;
	}

	.count-text {
		font-size: 24rpx;
		color: #999999;
	}

	.dialog-actions {
		flex-direction: row;
		padding: 0 30rpx 30rpx;
		gap: 20rpx;
	}

	.dialog-actions .action-btn {
		flex: 1;
		height: 80rpx;
		justify-content: center;
		align-items: center;
		border-radius: 12rpx;
		border: none;
	}

	.cancel-btn {
		background-color: #f8f8f8;
		border: 1rpx solid #e8e8e8;
	}

	.cancel-btn:active {
		background-color: #e8e8e8;
	}

	.confirm-btn {
		background-color: #007AFF;
	}

	.confirm-btn:active {
		background-color: #0056CC;
	}

	.dialog-actions .btn-text {
		font-size: 30rpx;
	}

	.cancel-btn .btn-text {
		color: #666666;
	}

	.confirm-btn .btn-text {
		color: #ffffff;
		font-weight: 500;
	}
</style>