import { markCommentIdsAsRead, extractCommentIds } from '@/utils/commentUtils.js'

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
	onShow() {
		// 页面显示时标记评论为已读
		if (this.taskId && this.comments && this.comments.length > 0) {
			this.markTaskAsRead()
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
					console.log('任务详情数据:', JSON.stringify(result.data.task, null, 2))
					this.task = result.data.task
					this.subtasks = result.data.subtasks || []
					
					// 加载父任务信息
					if (this.task.parent_id) {
						this.loadParentTask()
					}
					
					// 设置负责人信息
					if (result.data.assignee) {
						this.assigneeInfo = result.data.assignee
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

		async deleteTask() {
			this.hideTaskMenu()
			
			if (!this.task || !this.taskId) {
				uni.showToast({
					title: '任务信息不存在',
					icon: 'error'
				})
				return
			}
			
			// 检查是否有子任务
			const hasSubtasks = this.subtasks && this.subtasks.length > 0
			const modalContent = hasSubtasks 
				? `删除后无法恢复，该任务包含 ${this.subtasks.length} 个子任务，将一并删除。确定要删除吗？`
				: '删除后无法恢复，确定要删除这个任务吗？'
			
			uni.showModal({
				title: '确认删除',
				content: modalContent,
				confirmColor: '#FF4757',
				success: async (res) => {
					if (res.confirm) {
						try {
							uni.showLoading({
								title: '删除中...'
							})
							
							const todoBooksObj = uniCloud.importObject('todobook-co')
							const result = await todoBooksObj.deleteTask(this.taskId)
							
							uni.hideLoading()
							
							if (result.code === 0) {
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
								
								// 返回上一页
								setTimeout(() => {
									uni.navigateBack()
								}, 1000)
							} else {
								uni.showToast({
									title: result.message || '删除失败',
									icon: 'error'
								})
							}
						} catch (error) {
							uni.hideLoading()
							console.error('删除任务失败:', error)
							uni.showToast({
								title: '删除失败，请重试',
								icon: 'error'
							})
						}
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
					
					// 评论加载完成后，标记任务为已读
					if (refresh) {
						this.markTaskAsRead()
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

		// 标记任务评论为已读
		markTaskAsRead() {
			if (!this.taskId || !this.comments || this.comments.length === 0) return
			
			try {
				// 提取所有评论ID（包括回复）
				const commentIds = extractCommentIds(this.comments)
				
				if (commentIds.length > 0) {
					// 批量标记评论ID为已读
					markCommentIdsAsRead(this.taskId, commentIds)
					console.log('任务评论已标记为已读:', this.taskId, '评论数量:', commentIds.length)
				}
				
				// 保留原有的查看时间记录（用于兼容性）
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
		},

		// 标签相关方法
		getTagKey(tag, index) {
			if (typeof tag === 'object' && tag.id) {
				return tag.id
			}
			return index
		},

		getTagName(tag) {
			if (typeof tag === 'object' && tag.name) {
				return tag.name
			}
			return tag // 兼容旧格式的字符串标签
		},

		getTagColor(tag) {
			if (typeof tag === 'object' && tag.color) {
				return tag.color
			}
			return '#f0f6ff' // 默认颜色，兼容旧格式
		}
	}
}