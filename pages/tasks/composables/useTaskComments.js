import { ref, reactive } from 'vue'
import { markCommentIdsAsRead, extractCommentIds } from '@/utils/commentUtils.js'
import { getGlobalCommentCache } from '@/pages/todobooks/composables/useTaskCommentCache.js'

/**
 * @description 任务评论相关功能的组合式函数
 * @returns {object} 包含评论状态、数据和方法的对象
 */
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
	
	// 获取全局评论缓存实例
	const commentCache = getGlobalCommentCache()

	/**
	 * @description 获取当前登录的用户信息
	 * @returns {Promise<void>}
	 */
	const getCurrentUser = async () => {
		try {
			const userInfo = await uniCloud.getCurrentUserInfo()
			currentUser.value = userInfo
		} catch (error) {
			console.error('获取用户信息失败:', error)
		}
	}

	/**
	 * @description 加载指定任务的评论列表
	 * @param {string} taskId - 任务的唯一标识符
	 * @param {boolean} [refresh=true] - 是否刷新列表（true）或加载更多（false）
	 * @param {boolean} [useCache=true] - 是否优先使用缓存
	 * @returns {Promise<void>}
	 */
	const loadComments = async (taskId, refresh = true, useCache = true) => {
		if (commentsLoading.value) return
		
		// 优先检查缓存（仅在刷新且允许使用缓存时）
		if (refresh && useCache) {
			const cachedData = commentCache.getCachedComments(taskId)
			if (cachedData) {
				console.log(`使用缓存数据加载任务 ${taskId} 的评论，共 ${cachedData.total} 条`)
				
				// 使用缓存数据，避免网络请求
				comments.value = cachedData.comments || []
				commentsData.total = cachedData.total || 0
				commentsData.page = 1
				commentsData.pageSize = Math.max(20, cachedData.comments?.length || 20)
				commentsData.hasMore = cachedData.comments?.length < cachedData.total
				
				// 自动标记为已读
				setTimeout(() => {
					markTaskAsRead(taskId)
				}, 1000)
				
				return
			}
		}
		
		// 缓存不存在或需要强制刷新时，调用云函数
		commentsLoading.value = true
		
		if (refresh) {
			commentsData.page = 1
			comments.value = []
		}
		
		try {
			console.log(`从云函数加载任务 ${taskId} 的评论数据`)
			
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
				
				// 更新缓存（仅在刷新时）
				if (refresh && result.data.comments) {
					// 通过调用getTaskComments来更新缓存（会自动缓存）
					// 注意：这里不重复缓存，因为详情页直接调用云函数获取数据
					console.log(`任务 ${taskId} 评论数据已从云函数加载`)
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

	/**
	 * @description 加载更多评论
	 * @param {string} taskId - 任务的唯一标识符
	 * @returns {void}
	 */
	const loadMoreComments = (taskId) => {
		if (commentsLoading.value || !commentsData.hasMore) return
		
		commentsData.page++
		loadComments(taskId, false)
	}

	/**
	 * @description 提交评论（新增或编辑）
	 * @param {string} taskId - 任务的唯一标识符
	 * @param {string} content - 评论内容
	 * @returns {Promise<boolean>} - 操作成功返回 true，否则返回 false
	 */
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
				
				// 清空当前任务的评论缓存，确保获取最新数据
				commentCache.clearTaskCache(taskId)
				
				// 刷新评论列表（强制从服务器获取最新数据）
				await loadComments(taskId, true, false)
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

	/**
	 * @description 删除一条评论
	 * @param {string} taskId - 任务的唯一标识符，用于刷新评论列表
	 * @param {object} comment - 要删除的评论对象
	 * @returns {Promise<boolean>} - 用户确认并删除成功返回 true，否则返回 false
	 */
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
								
								// 清空当前任务的评论缓存，确保获取最新数据
								commentCache.clearTaskCache(taskId)
								
								// 刷新评论列表（强制从服务器获取最新数据）
								await loadComments(taskId, true, false)
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

	/**
	 * @description 将当前任务的评论标记为已读
	 * @param {string} taskId - 任务的唯一标识符
	 * @returns {void}
	 */
	const markTaskAsRead = (taskId) => {
		if (!taskId || !comments.value || comments.value.length === 0) return
		
		try {
			const commentIds = extractCommentIds(comments.value)
			
			if (commentIds.length > 0) {
				markCommentIdsAsRead(taskId, commentIds)
				console.log('任务评论已标记为已读:', taskId, '评论数量:', commentIds.length)
			}
		} catch (error) {
			console.error('标记已读失败:', error)
		}
	}

	/**
	 * @description 准备添加新评论的表单状态
	 * @returns {void}
	 */
	const prepareAddComment = () => {
		commentEditMode.value = 'add'
		resetCommentForm()
	}

	/**
	 * @description 准备回复指定评论的表单状态
	 * @param {object} comment - 被回复的评论对象
	 * @returns {void}
	 */
	const prepareReplyComment = (comment) => {
		commentEditMode.value = 'reply'
		commentFormData.content = ''
		commentFormData.commentId = null
		commentFormData.parentCommentId = comment._id
	}

	/**
	 * @description 准备编辑指定评论的表单状态
	 * @param {object} comment - 被编辑的评论对象
	 * @returns {void}
	 */
	const prepareEditComment = (comment) => {
		commentEditMode.value = 'edit'
		commentFormData.content = comment.content
		commentFormData.commentId = comment._id
		commentFormData.parentCommentId = null
	}

	/**
	 * @description 重置评论表单的状态
	 * @returns {void}
	 */
	const resetCommentForm = () => {
		commentFormData.content = ''
		commentFormData.commentId = null
		commentFormData.parentCommentId = null
	}

	/**
	 * @description 检查当前用户是否可以编辑指定评论
	 * @param {object} comment - 评论对象
	 * @returns {boolean} - 如果可以编辑返回 true，否则返回 false
	 */
	const canEditComment = (comment) => {
		return currentUser.value && comment.user_id === currentUser.value.uid
	}

	/**
	 * @description 检查当前用户是否可以删除指定评论
	 * @param {object} comment - 评论对象
	 * @param {object} task - 任务对象，用于判断是否为任务创建者
	 * @returns {boolean} - 如果可以删除返回 true，否则返回 false
	 */
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
