import { ref, reactive } from 'vue'
import { markCommentIdsAsRead, extractCommentIds } from '@/utils/commentUtils.js'

export function useTaskComments() {
	const comments = ref([])
	const commentsData = reactive({
		total: 0,
		page: 1,
		pageSize: 20,
		hasMore: false
	})
	const commentsLoading = ref(false)
	const commentEditMode = ref('add')
	const commentFormData = reactive({
		content: '',
		commentId: null,
		parentCommentId: null
	})
	const currentUser = ref(null)

	const getCurrentUser = async () => {
		try {
			const userInfo = await uniCloud.getCurrentUserInfo()
			currentUser.value = userInfo
		} catch (error) {
			console.error('获取用户信息失败:', error)
		}
	}

	const loadComments = async (taskId, refresh = true) => {
		if (commentsLoading.value) return
		
		commentsLoading.value = true
		
		if (refresh) {
			commentsData.page = 1
			comments.value = []
		}
		
		try {
			const todoBooksObj = uniCloud.importObject('todobook-co')
			const result = await todoBooksObj.getTaskComments(
				taskId, 
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
				
				if (refresh) {
					markTaskAsRead(taskId)
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

	const loadMoreComments = (taskId) => {
		if (commentsLoading.value || !commentsData.hasMore) return
		
		commentsData.page++
		loadComments(taskId, false)
	}

	const submitComment = async (taskId, content) => {
		if (!content || content.trim().length === 0) {
			uni.showToast({
				title: '请输入评论内容',
				icon: 'none'
			})
			return false
		}

		try {
			const todoBooksObj = uniCloud.importObject('todobook-co')
			let result

			if (commentEditMode.value === 'edit') {
				result = await todoBooksObj.updateTaskComment(
					commentFormData.commentId, 
					content
				)
			} else {
				result = await todoBooksObj.addTaskComment(
					taskId, 
					content, 
					commentFormData.parentCommentId
				)
			}

			if (result.code === 0) {
				uni.showToast({
					title: result.message || '操作成功',
					icon: 'success'
				})
				
				loadComments(taskId)
				resetCommentForm()
				return true
			} else {
				uni.showToast({
					title: result.message || '操作失败',
					icon: 'error'
				})
				return false
			}
		} catch (error) {
			console.error('提交评论失败:', error)
			uni.showToast({
				title: '网络错误，请重试',
				icon: 'error'
			})
			return false
		}
	}

	const deleteComment = async (taskId, comment) => {
		return new Promise((resolve) => {
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
								
								loadComments(taskId)
								resolve(true)
							} else {
								uni.showToast({
									title: result.message || '删除失败',
									icon: 'error'
								})
								resolve(false)
							}
						} catch (error) {
							console.error('删除评论失败:', error)
							uni.showToast({
								title: '网络错误，请重试',
								icon: 'error'
							})
							resolve(false)
						}
					} else {
						resolve(false)
					}
				}
			})
		})
	}

	const markTaskAsRead = (taskId) => {
		if (!taskId || !comments.value || comments.value.length === 0) return
		
		try {
			const commentIds = extractCommentIds(comments.value)
			
			if (commentIds.length > 0) {
				markCommentIdsAsRead(taskId, commentIds)
				console.log('任务评论已标记为已读:', taskId, '评论数量:', commentIds.length)
			}
			
			const lastViewTimes = uni.getStorageSync('task_comment_view_times') || {}
			lastViewTimes[taskId] = Date.now()
			uni.setStorageSync('task_comment_view_times', lastViewTimes)
		} catch (error) {
			console.error('标记已读失败:', error)
		}
	}

	const prepareAddComment = () => {
		commentEditMode.value = 'add'
		resetCommentForm()
	}

	const prepareReplyComment = (comment) => {
		commentEditMode.value = 'reply'
		commentFormData.content = ''
		commentFormData.commentId = null
		commentFormData.parentCommentId = comment._id
	}

	const prepareEditComment = (comment) => {
		commentEditMode.value = 'edit'
		commentFormData.content = comment.content
		commentFormData.commentId = comment._id
		commentFormData.parentCommentId = null
	}

	const resetCommentForm = () => {
		commentFormData.content = ''
		commentFormData.commentId = null
		commentFormData.parentCommentId = null
	}

	const canEditComment = (comment) => {
		return currentUser.value && comment.user_id === currentUser.value.uid
	}

	const canDeleteComment = (comment, task) => {
		if (!currentUser.value) return false
		
		if (comment.user_id === currentUser.value.uid) {
			return true
		}
		
		if (task && task.todobook_creator_id === currentUser.value.uid) {
			return true
		}
		
		return false
	}

	return {
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
	}
}