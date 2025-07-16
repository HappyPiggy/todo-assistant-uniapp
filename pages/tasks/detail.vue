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
							<text class="attr-value">{{ assigneeInfo.nickname || assigneeInfo.username || '未知用户' }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 标签 -->
			<view class="tags-section">
				<view class="section-header">
					<text class="section-title">标签</text>
				</view>
				<view v-if="task.tags && Array.isArray(task.tags) && task.tags.length > 0" class="tags-list">
					<view 
						v-for="(tag, index) in task.tags" 
						:key="getTagKey(tag, index)" 
						class="tag-item"
						:style="{ backgroundColor: getTagColor(tag) }">
						<text class="tag-text">{{ getTagName(tag) }}</text>
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
					<!-- <view class="menu-item" @click="editTask">
						<uni-icons color="#007AFF" size="20" type="compose" />
						<text class="menu-text">编辑任务</text>
					</view> -->
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

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { markCommentIdsAsRead, extractCommentIds } from '@/utils/commentUtils.js'

const taskId = ref('')
const bookId = ref('')
const task = ref(null)
const subtasks = ref([])
const parentTask = ref(null)
const assigneeInfo = ref(null)
const loading = ref(true)
const error = ref(null)
const currentUser = ref(null)

// 评论相关
const comments = ref([])
const commentsData = reactive({
	total: 0,
	page: 1,
	pageSize: 20,
	hasMore: false
})
const commentsLoading = ref(false)
const commentEditMode = ref('add') // add, reply, edit
const commentFormData = reactive({
	content: '',
	commentId: null,
	parentCommentId: null
})

// 弹窗 refs
const taskMenuPopup = ref(null)
const commentPopup = ref(null)

// 生命周期
onMounted(() => {
	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1]
	const options = currentPage.options
	
	if (!options.id) {
		uni.showToast({
			title: '缺少任务ID',
			icon: 'error'
		})
		uni.navigateBack()
		return
	}
	taskId.value = options.id
	bookId.value = options.bookId
	
	// 获取当前用户信息
	getCurrentUser()
	
	// 加载任务详情和评论
	loadTaskDetail()
	loadComments()
})

// 页面显示时的处理
const onShow = () => {
	// 页面显示时标记评论为已读
	if (taskId.value && comments.value && comments.value.length > 0) {
		markTaskAsRead()
	}
}

// 加载任务详情
const loadTaskDetail = async () => {
	loading.value = true
	error.value = null
	
	try {
		const todoBooksObj = uniCloud.importObject('todobook-co')
		const result = await todoBooksObj.getTaskDetail(taskId.value)
		
		if (result.code === 0) {
			console.log('任务详情数据:', JSON.stringify(result.data.task, null, 2))
			task.value = result.data.task
			subtasks.value = result.data.subtasks || []
			
			// 加载父任务信息
			if (task.value.parent_id) {
				loadParentTask()
			}
			
			// 设置负责人信息
			if (result.data.assignee) {
				assigneeInfo.value = result.data.assignee
			}

			// 设置页面标题
			uni.setNavigationBarTitle({
				title: task.value.title
			})
			
			// 存储项目册创建者信息用于权限判断
			if (result.data.todobook_creator_id) {
				task.value.todobook_creator_id = result.data.todobook_creator_id
			}
		} else {
			error.value = result.message || '获取任务详情失败'
			uni.showToast({
				title: error.value,
				icon: 'none'
			})
		}
	} catch (e) {
		console.error('加载任务详情失败:', e)
		error.value = '网络错误，请重试'
		uni.showToast({
			title: '网络错误，请重试',
			icon: 'none'
		})
	} finally {
		loading.value = false
	}
}

const loadParentTask = async () => {
	try {
		const todoBooksObj = uniCloud.importObject('todobook-co')
		const result = await todoBooksObj.getTaskDetail(task.value.parent_id)
		
		if (result.code === 0) {
			parentTask.value = result.data.task
		}
	} catch (error) {
		console.error('加载父任务失败:', error)
	}
}

const openParentTask = () => {
	if (parentTask.value) {
		uni.navigateTo({
			url: `/pages/tasks/detail?id=${parentTask.value._id}&bookId=${bookId.value}`
		})
	}
}

const toggleStatus = async () => {
	// 如果有子任务且不是全部完成，不允许直接完成父任务
	if (subtasks.value.length > 0 && task.value.completed_subtask_count < task.value.subtask_count && task.value.status !== 'completed') {
		uni.showToast({
			title: '请先完成所有子任务',
			icon: 'none'
		})
		return
	}

	const newStatus = task.value.status === 'completed' ? 'todo' : 'completed'

	try {
		const todoBooksObj = uniCloud.importObject('todobook-co')
		const result = await todoBooksObj.updateTodoItemStatus(taskId.value, newStatus)

		if (result.code === 0) {
			// 更新本地数据
			task.value.status = newStatus
			task.value.updated_at = new Date()
			
			if (newStatus === 'completed') {
				task.value.completed_at = new Date()
			} else {
				task.value.completed_at = null
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
}

const toggleSubtaskStatus = async (subtask) => {
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
				task.value.completed_subtask_count++
			} else {
				subtask.completed_at = null
				task.value.completed_subtask_count--
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
}

const openSubtask = (subtask) => {
	uni.navigateTo({
		url: `/pages/tasks/detail?id=${subtask._id}&bookId=${bookId.value}`
	})
}

const addSubtask = () => {
	uni.navigateTo({
		url: `/pages/tasks/create?bookId=${bookId.value}&parentId=${taskId.value}`
	})
}

const showTaskMenu = () => {
	taskMenuPopup.value.open()
}

const hideTaskMenu = () => {
	taskMenuPopup.value.close()
}

const editTask = () => {
	hideTaskMenu()
	uni.navigateTo({
		url: `/pages/tasks/edit?id=${taskId.value}&bookId=${bookId.value}`
	})
}

const deleteTask = async () => {
	hideTaskMenu()
	
	if (!task.value || !taskId.value) {
		uni.showToast({
			title: '任务信息不存在',
			icon: 'error'
		})
		return
	}
	
	// 检查是否有子任务
	const hasSubtasks = subtasks.value && subtasks.value.length > 0
	const modalContent = hasSubtasks 
		? `删除后无法恢复，该任务包含 ${subtasks.value.length} 个子任务，将一并删除。确定要删除吗？`
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
					const result = await todoBooksObj.deleteTask(taskId.value)
					
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
}

// 获取当前用户信息
const getCurrentUser = async () => {
	try {
		const userInfo = await uniCloud.getCurrentUserInfo()
		currentUser.value = userInfo
	} catch (error) {
		console.error('获取用户信息失败:', error)
	}
}

// 加载评论列表
const loadComments = async (refresh = true) => {
	if (commentsLoading.value) return
	
	commentsLoading.value = true
	
	if (refresh) {
		commentsData.page = 1
		comments.value = []
	}
	
	try {
		const todoBooksObj = uniCloud.importObject('todobook-co')
		const result = await todoBooksObj.getTaskComments(
			taskId.value, 
			commentsData.page, 
			commentsData.pageSize
		)
		
		if (result.code === 0) {
			if (refresh) {
				comments.value = result.data.comments
			} else {
				comments.value.push(...result.data.comments)
			}
			
			commentsData.total = result.data.total
			commentsData.page = result.data.page
			commentsData.pageSize = result.data.pageSize
			commentsData.hasMore = result.data.hasMore
			
			// 评论加载完成后，标记任务为已读
			if (refresh) {
				markTaskAsRead()
			}
		} else {
			console.error('加载评论失败:', result.message)
		}
	} catch (error) {
		console.error('加载评论失败:', error)
	} finally {
		commentsLoading.value = false
	}
}

// 加载更多评论
const loadMoreComments = () => {
	if (commentsLoading.value || !commentsData.hasMore) return
	
	commentsData.page++
	loadComments(false)
}

// 显示添加评论对话框
const showAddComment = () => {
	commentEditMode.value = 'add'
	commentFormData.content = ''
	commentFormData.commentId = null
	commentFormData.parentCommentId = null
	commentPopup.value.open()
}

// 显示回复输入框
const showReplyInput = (comment) => {
	commentEditMode.value = 'reply'
	commentFormData.content = ''
	commentFormData.commentId = null
	commentFormData.parentCommentId = comment._id
	commentPopup.value.open()
}

// 编辑评论
const editComment = (comment) => {
	commentEditMode.value = 'edit'
	commentFormData.content = comment.content
	commentFormData.commentId = comment._id
	commentFormData.parentCommentId = null
	commentPopup.value.open()
}

// 提交评论
const submitComment = async (content) => {
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

		if (commentEditMode.value === 'edit') {
			// 编辑评论
			result = await todoBooksObj.updateTaskComment(
				commentFormData.commentId, 
				content
			)
		} else {
			// 添加评论或回复
			result = await todoBooksObj.addTaskComment(
				taskId.value, 
				content, 
				commentFormData.parentCommentId
			)
		}

		if (result.code === 0) {
			uni.showToast({
				title: result.message || '操作成功',
				icon: 'success'
			})
			
			// 刷新评论列表
			loadComments()
			closeCommentDialog()
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
}

// 删除评论
const deleteComment = (comment) => {
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
						loadComments()
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
}

// 关闭评论对话框
const closeCommentDialog = () => {
	commentPopup.value.close()
	commentFormData.content = ''
	commentFormData.commentId = null
	commentFormData.parentCommentId = null
}

// 权限检查 - 是否可以编辑评论
const canEditComment = (comment) => {
	return currentUser.value && comment.user_id === currentUser.value.uid
}

// 权限检查 - 是否可以删除评论
const canDeleteComment = (comment) => {
	if (!currentUser.value) return false
	
	// 评论作者可以删除自己的评论
	if (comment.user_id === currentUser.value.uid) {
		return true
	}
	
	// 项目册owner可以删除所有评论
	if (task.value && task.value.todobook_creator_id === currentUser.value.uid) {
		return true
	}
	
	return false
}

// 标记任务评论为已读
const markTaskAsRead = () => {
	if (!taskId.value || !comments.value || comments.value.length === 0) return
	
	try {
		// 提取所有评论ID（包括回复）
		const commentIds = extractCommentIds(comments.value)
		
		if (commentIds.length > 0) {
			// 批量标记评论ID为已读
			markCommentIdsAsRead(taskId.value, commentIds)
			console.log('任务评论已标记为已读:', taskId.value, '评论数量:', commentIds.length)
		}
		
		// 保留原有的查看时间记录（用于兼容性）
		const lastViewTimes = uni.getStorageSync('task_comment_view_times') || {}
		lastViewTimes[taskId.value] = Date.now()
		uni.setStorageSync('task_comment_view_times', lastViewTimes)
	} catch (error) {
		console.error('标记已读失败:', error)
	}
}

const getPriorityText = (priority) => {
	const map = {
		low: '低',
		medium: '中', 
		high: '高',
		urgent: '急'
	}
	return map[priority] || '中'
}

const isOverdue = (dueDate) => {
	return new Date(dueDate) < new Date()
}

const formatDueDate = (dueDate) => {
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
}

const formatTime = (timeStr) => {
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

// 标签相关方法
const getTagKey = (tag, index) => {
	if (typeof tag === 'object' && tag.id) {
		return tag.id
	}
	return index
}

const getTagName = (tag) => {
	if (typeof tag === 'object' && tag.name) {
		return tag.name
	}
	return tag // 兼容旧格式的字符串标签
}

const getTagColor = (tag) => {
	if (typeof tag === 'object' && tag.color) {
		return tag.color
	}
	return '#f0f6ff' // 默认颜色，兼容旧格式
}

// 导出需要的方法（供模板使用）
defineExpose({
	onShow
})
</script>

<style lang="scss" scoped src="./detail.scss"></style>