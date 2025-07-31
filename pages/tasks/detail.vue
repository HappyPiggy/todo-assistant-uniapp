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
						<view class="task-title-row">
							<text class="task-title" :class="{ completed: task.status === 'completed' }">{{ task.title }}</text>
							<!-- 标签直接显示在标题后面 -->
							<view v-if="task.tags && Array.isArray(task.tags) && task.tags.length > 0" class="inline-tags">
								<view 
									v-for="(tag, index) in task.tags" 
									:key="getTagKey(tag, index)" 
									class="inline-tag-item"
									:style="{ backgroundColor: getTagColor(tag) }">
									<text class="inline-tag-text">{{ getTagName(tag) }}</text>
								</view>
							</view>
						</view>
						<view class="task-meta">
							<text class="meta-text">{{ formatTime(task.created_at) }} 创建</text>
							<view class="priority-badge" :class="task.priority">
								<text class="priority-text">{{ getPriorityText(task.priority) }}</text>
							</view>
						</view>
					</view>
					<view v-if="canEdit" class="header-actions" @click="showTaskMenu">
						<uni-icons color="#999999" size="24" type="more-filled" />
					</view>
				</view>

				<!-- 父子关系信息 -->
				<view class="relations-section" v-if="parentTask || subtasks.length > 0">
					<view class="section-header">
						<text class="section-title">任务关系</text>
					</view>
					<view class="relations-content">
						<view class="relation-item" v-if="parentTask" @click="handleOpenParentTask">
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

					<view class="attribute-item" v-if="task.budget > 0">
						<view class="attr-icon">
							<uni-icons color="#28a745" size="20" type="wallet" />
						</view>
						<view class="attr-content">
							<text class="attr-label">预算</text>
							<text class="attr-value">{{ task.budget }}元</text>
						</view>
					</view>

					<view class="attribute-item" v-if="task.budget > 0">
						<view class="attr-icon">
							<uni-icons color="#dc3545" size="20" type="wallet-filled" />
						</view>
						<view class="attr-content">
							<text class="attr-label">实际花费</text>
							<view class="attr-value-editable" @click="editActualCost">
								<text class="attr-value">{{ task.actual_cost || 0 }}元</text>
								<uni-icons color="#666" size="16" type="compose" />
							</view>
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


			<!-- 子任务 -->
			<view class="subtasks-section" v-if="subtasks.length > 0">
				<view class="section-header">
					<text class="section-title">子任务 ({{ task.completed_subtask_count }}/{{ task.subtask_count }})</text>
					<view class="add-subtask" @click="handleAddSubtask">
						<uni-icons color="#007AFF" size="18" type="plus" />
					</view>
				</view>
				<view class="subtasks-list">
					<view 
						v-for="subtask in subtasks" 
						:key="subtask._id"
						class="subtask-item"
						@click="handleOpenSubtask(subtask)">
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
					<view v-if="canEdit" class="add-comment" @click="showAddComment">
						<uni-icons color="#007AFF" size="18" type="chatboxes" />
					</view>
				</view>
				
				<!-- 归档状态提示 -->
				<view v-if="!canEdit" class="archived-notice-section">
					<text class="archived-text">已归档项目册不支持评论操作</text>
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
									v-if="hasAvatar(comment)" 
									:src="getCommentAvatar(comment)" 
									class="avatar-img" 
									mode="aspectFill" />
								<view v-else class="avatar-placeholder">
									<text class="avatar-text">{{ getCommentAvatarPlaceholder(comment) }}</text>
								</view>
							</view>
							<view class="comment-content-wrapper">
								<view class="comment-header">
									<text class="comment-author">{{ comment.user_nickname || '用户' }}</text>
									<text class="comment-time">{{ formatTime(comment.created_at) }}</text>
								</view>
								<text class="comment-content">{{ comment.content }}</text>
								
								<!-- 评论操作 -->
								<view v-if="canEdit" class="comment-actions">
									<view class="action-btn" @click="showReplyInput(comment)">
										<text class="action-text">回复</text>
									</view>
									<view 
										v-if="canEditComment(comment, task)" 
										class="action-btn" 
										@click="editComment(comment)">
										<text class="action-text">编辑</text>
									</view>
									<view 
										v-if="handleCanDeleteComment(comment)" 
										class="action-btn danger" 
										@click="handleDeleteComment(comment)">
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
										v-if="hasAvatar(reply)" 
										:src="getCommentAvatar(reply)" 
										class="avatar-img" 
										mode="aspectFill" />
									<view v-else class="avatar-placeholder">
										<text class="avatar-text">{{ getCommentAvatarPlaceholder(reply) }}</text>
									</view>
								</view>
								<view class="comment-content-wrapper">
									<view class="comment-header">
										<text class="comment-author">{{ reply.user_nickname || '用户' }}</text>
										<text class="comment-time">{{ formatTime(reply.created_at) }}</text>
									</view>
									<text class="comment-content">{{ reply.content }}</text>
									
									<!-- 回复操作 -->
									<view v-if="canEdit" class="comment-actions">
										<view 
											v-if="canEditComment(reply, task)" 
											class="action-btn" 
											@click="editComment(reply)">
											<text class="action-text">编辑</text>
										</view>
										<view 
											v-if="handleCanDeleteComment(reply)" 
											class="action-btn danger" 
											@click="handleDeleteComment(reply)">
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
							@click="handleLoadMoreComments" />
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
					<view class="action-btn confirm-btn" @click="handleSubmitComment(commentFormData.content)">
						<text class="btn-text">确定</text>
					</view>
				</view>
			</view>
		</uni-popup>

		<!-- 编辑实际花费弹窗 -->
		<uni-popup ref="costPopup" type="center" background-color="rgba(0,0,0,0.5)">
			<view class="cost-dialog">
				<view class="dialog-header">
					<text class="dialog-title">编辑实际花费</text>
					<view class="dialog-close" @click="closeCostDialog">
						<uni-icons color="#999" size="20" type="close" />
					</view>
				</view>
				<view class="dialog-content">
					<uni-forms-item label="实际花费（元）">
						<uni-easyinput 
							v-model="costFormData.actual_cost" 
							type="number"
							placeholder="请输入实际花费金额"
							:min="0"
							:step="1"
							:focus="true">
						</uni-easyinput>
					</uni-forms-item>
				</view>
				<view class="dialog-actions">
					<view class="action-btn cancel-btn" @click="closeCostDialog">
						<text class="btn-text">取消</text>
					</view>
					<view class="action-btn confirm-btn" @click="updateActualCost" :class="{ disabled: updating }">
						<text class="btn-text">{{ updating ? '保存中...' : '保存' }}</text>
					</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow, onHide } from '@dcloudio/uni-app'
import { useTaskDetail } from './composables/useTaskDetail.js'
import { useTaskComments } from './composables/useTaskComments.js'
import { useTaskUtils } from './composables/useTaskUtils.js'
import { getCommentAvatar, getCommentAvatarPlaceholder, hasAvatar } from '@/utils/avatarUtils.js'

// 用于存储从路由获取的参数，初始为 null
let taskId = null
let bookId = null

// 初始化组合式函数，此时不传入具体参数
const {
	task,
	subtasks,
	parentTask,
	assigneeInfo,
	loading,
	error,
	loadTaskDetail,
	toggleStatus,
	toggleSubtaskStatus,
	deleteTask: deleteTaskFn
} = useTaskDetail()

const {
	comments,
	commentsData,
	commentsLoading,
	commentEditMode,
	commentFormData,
	currentUser,
	getCurrentUser,
	loadComments,
	loadMoreComments,
	submitComment,
	deleteComment,
	markTaskAsRead,
	prepareAddComment,
	prepareReplyComment,
	prepareEditComment,
	resetCommentForm,
	canEditComment,
	canDeleteComment
} = useTaskComments()

const {
	getPriorityText,
	isOverdue,
	formatDueDate,
	formatTime,
	getTagKey,
	getTagName,
	getTagColor,
	openParentTask,
	openSubtask,
	addSubtask
} = useTaskUtils()

// 组件本地状态
const taskMenuPopup = ref(null)
const commentPopup = ref(null)
const costPopup = ref(null)
const hasInitialized = ref(false) // 用于 onShow 判断是否为首次进入页面

// 实际花费编辑相关状态
const costFormData = ref({
	actual_cost: ''
})
const updating = ref(false)

// 归档状态
const isArchived = ref(false)
const canEdit = computed(() => !isArchived.value)

// 检查项目册归档状态
const checkBookArchiveStatus = async (bookId) => {
	try {
		const todoBookCo = uniCloud.importObject('todobook-co')
		const result = await todoBookCo.getTodoBookDetail(bookId, {
			includeBasic: true,
			includeMembers: false,
			includeTasks: false
		})
		
		if (result.code === 0 && result.data && result.data.book) {
			isArchived.value = result.data.book.is_archived === true
			if (isArchived.value) {
				console.log('当前任务所属项目册已归档，编辑功能受限')
			}
		}
	} catch (error) {
		console.error('检查项目册归档状态失败:', error)
	}
}

// 使用 onLoad 安全地获取页面参数
onLoad(async (options) => {
	console.log("onLoad options", JSON.stringify(options, null, 2))
	if (options && options.id) {
		taskId = options.id
		bookId = options.bookId
		
		// 获取当前用户信息
		getCurrentUser()
		
		// 检查项目册归档状态
		if (bookId) {
			await checkBookArchiveStatus(bookId)
		}
		
		// 加载任务详情和评论
		await loadTaskDetail(taskId)
		await loadComments(taskId)
	} else {
		console.error('错误：未能从路由参数中获取到任务ID')
		uni.showToast({ title: '页面参数错误', icon: 'error' })
		uni.navigateBack()
	}
})

// onMounted 在 onLoad 之后执行，适合用来标记页面已完成首次渲染
onMounted(() => {
	hasInitialized.value = true
	// 注册任务更新事件监听
	uni.$on('task-updated', handleTaskUpdated)
})

// 停留1秒后标记已读的定时器
let readMarkTimer = null

// 页面再次显示时触发（例如从下一页返回）
onShow(() => {
	console.log('detail页面 onShow 触发, hasInitialized:', hasInitialized.value, 'taskId:', taskId)
	// 如果页面已经初始化过，并且 taskId 存在，则刷新数据
	if (hasInitialized.value && taskId) {
		console.log('onShow 触发刷新任务详情')
		refreshTaskDetail()
	}
	
	// 设置1秒后标记评论为已读
	if (taskId && comments.value && comments.value.length > 0) {
		if (readMarkTimer) {
			clearTimeout(readMarkTimer)
		}
		readMarkTimer = setTimeout(() => {
			markTaskAsRead(taskId)
		}, 500)
	}
})

// 页面隐藏时触发
onHide(() => {
	// 清除已读标记定时器
	if (readMarkTimer) {
		clearTimeout(readMarkTimer)
		readMarkTimer = null
	}
})

// 处理任务更新事件
const handleTaskUpdated = async (updatedTask) => {
	console.log('任务详情页面收到task-updated事件:', JSON.stringify(updatedTask, null, 2))
	if (updatedTask._id === taskId) {
		console.log('更新的是当前任务，调用云函数更新')
		try {
			const todoBooksObj = uniCloud.importObject('todobook-co')
			const result = await todoBooksObj.updateTodoItem(updatedTask._id, updatedTask)
			if (result.code === 0) {
				console.log('任务更新成功，刷新详情')
				await refreshTaskDetail()
				uni.showToast({ title: '保存成功', icon: 'success' })
			} else {
				throw new Error(result.message)
			}
		} catch (error) {
			console.error('任务更新失败:', error)
			uni.showToast({ title: error.message || '保存失败', icon: 'error' })
		}
	}
}


// 页面卸载时清理资源
onUnmounted(() => {
	// 移除事件监听
	uni.$off('task-updated', handleTaskUpdated)
	// 可以在这里清理一些资源，如定时器等
})

// 刷新任务详情
const refreshTaskDetail = async () => {
	if (!taskId) return
	
	console.log('refreshTaskDetail 被调用，taskId:', taskId)
	await loadTaskDetail(taskId)
	await loadComments(taskId)
}

// 导航和操作方法
const handleOpenParentTask = () => {
	openParentTask(parentTask.value, bookId)
}

const handleOpenSubtask = (subtask) => {
	openSubtask(subtask, bookId)
}

const handleAddSubtask = () => {
	addSubtask(bookId, taskId)
}

// 菜单操作
const showTaskMenu = () => {
	taskMenuPopup.value.open()
}

const hideTaskMenu = () => {
	taskMenuPopup.value.close()
}

const editTask = () => {
	hideTaskMenu()
	uni.navigateTo({
		url: `/pages/tasks/form?id=${taskId}&bookId=${bookId}`
	})
}

const deleteTask = async () => {
	hideTaskMenu()
	await deleteTaskFn()
}

// 评论操作包装方法
const handleLoadMoreComments = () => {
	loadMoreComments(taskId)
}

// 评论弹窗操作
const showAddComment = () => {
	prepareAddComment()
	commentPopup.value.open()
}

const showReplyInput = (comment) => {
	prepareReplyComment(comment)
	commentPopup.value.open()
}

const editComment = (comment) => {
	prepareEditComment(comment)
	commentPopup.value.open()
}

// 提交评论包装方法
const handleSubmitComment = async (content) => {
	const success = await submitComment(taskId, content)
	if (success) {
		closeCommentDialog()
	}
}

// 删除评论包装方法
const handleDeleteComment = (comment) => {
	deleteComment(taskId, comment)
}

// 关闭评论对话框
const closeCommentDialog = () => {
	commentPopup.value.close()
	resetCommentForm()
}

// 权限检查包装方法
const handleCanDeleteComment = (comment) => {
	return canDeleteComment(comment, task.value)
}

// 编辑实际花费
const editActualCost = () => {
	costFormData.value.actual_cost = String(task.value.actual_cost || 0)
	costPopup.value.open()
}

// 关闭实际花费编辑对话框
const closeCostDialog = () => {
	costPopup.value.close()
	costFormData.value.actual_cost = ''
}

// 更新实际花费
const updateActualCost = async () => {
	const cost = parseInt(costFormData.value.actual_cost)
	if (isNaN(cost) || cost < 0) {
		uni.showToast({
			title: '请输入有效的金额',
			icon: 'error'
		})
		return
	}

	updating.value = true
	try {
		const todoBooksObj = uniCloud.importObject('todobook-co')
		const result = await todoBooksObj.updateTodoItem(taskId, {
			actual_cost: cost
		})

		if (result.code === 0) {
			// 更新本地任务数据
			task.value.actual_cost = cost
			
			uni.showToast({
				title: '更新成功',
				icon: 'success'
			})
			closeCostDialog()
		} else {
			throw new Error(result.message || '更新失败')
		}
	} catch (error) {
		console.error('更新实际花费失败:', error)
		uni.showToast({
			title: error.message || '更新失败',
			icon: 'error'
		})
	} finally {
		updating.value = false
	}
}

// 在 <script setup> 中，所有在顶层声明的变量、计算属性和方法都会自动暴露给模板，无需手动 return 或 defineExpose。
</script>

<style lang="scss" scoped src="./detail.scss"></style>