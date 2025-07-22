import { ref, reactive } from 'vue'

/**
 * @description 任务详情页的核心业务逻辑，包括数据获取、状态管理和操作
 * @returns {object} 包含任务详情状态、数据和方法的对象
 */
export function useTaskDetail() {
	const taskId = ref('')
	const bookId = ref('')
	const task = ref(null)
	const subtasks = ref([])
	const parentTask = ref(null)
	const assigneeInfo = ref(null)
	const loading = ref(true)
	const error = ref(null)

	/**
	 * @description 加载任务的详细信息，包括子任务、负责人等
	 * @param {string} id - 任务的唯一标识符
	 * @returns {Promise<void>}
	 */
	const loadTaskDetail = async (id) => {
		// 如果传入了 id，更新 taskId
		if (id) {
			taskId.value = id
		}
		
		// 确保 taskId 存在
		if (!taskId.value) {
			error.value = '任务ID不能为空'
			uni.showToast({
				title: '任务ID不能为空',
				icon: 'none'
			})
			loading.value = false
			return
		}
		
		console.log('loadTaskDetail 开始加载，taskId:', taskId.value)
		loading.value = true
		error.value = null
		
		try {
			const todoBooksObj = uniCloud.importObject('todobook-co')
			// 添加时间戳避免缓存
			const timestamp = Date.now()
			console.log('loadTaskDetail 调用云函数, taskId:', taskId.value, 'timestamp:', timestamp)
			const result = await todoBooksObj.getTodoItemDetail(taskId.value, { _t: timestamp })
			
			if (result.code === 0) {
				task.value = result.data.task
				subtasks.value = result.data.subtasks || []
				console.log('任务数据更新完成, 标签信息:', JSON.stringify(task.value.tags, null, 2))
				
				if (task.value.parent_id) {
					await loadParentTask()
				}
				
				if (result.data.assignee) {
					assigneeInfo.value = result.data.assignee
				}

				uni.setNavigationBarTitle({
					title: task.value.title
				})
				
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

	/**
	 * @description 加载父任务的简要信息
	 * @returns {Promise<void>}
	 */
	const loadParentTask = async () => {
		try {
			const todoBooksObj = uniCloud.importObject('todobook-co')
			const result = await todoBooksObj.getTodoItemDetail(task.value.parent_id)
			
			if (result.code === 0) {
				parentTask.value = result.data.task
			}
		} catch (error) {
			console.error('加载父任务失败:', error)
		}
	}

	/**
	 * @description 切换主任务的完成状态
	 * @returns {Promise<void>}
	 */
	const toggleStatus = async () => {
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

	/**
	 * @description 切换子任务的完成状态
	 * @param {object} subtask - 要切换状态的子任务对象
	 * @returns {Promise<void>}
	 */
	const toggleSubtaskStatus = async (subtask) => {
		const newStatus = subtask.status === 'completed' ? 'todo' : 'completed'

		try {
			const todoBooksObj = uniCloud.importObject('todobook-co')
			const result = await todoBooksObj.updateTodoItemStatus(subtask._id, newStatus)

			if (result.code === 0) {
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

	/**
	 * @description 删除当前任务，如果包含子任务则一并删除
	 * @returns {Promise<boolean>} - 用户确认并删除成功返回 true，否则返回 false
	 */
	const deleteTask = async () => {
		if (!task.value || !taskId.value) {
			uni.showToast({
				title: '任务信息不存在',
				icon: 'error'
			})
			return
		}
		
		const hasSubtasks = subtasks.value && subtasks.value.length > 0
		const modalContent = hasSubtasks 
			? `删除后无法恢复，该任务包含 ${subtasks.value.length} 个子任务，将一并删除。确定要删除吗？`
			: '删除后无法恢复，确定要删除这个任务吗？'
		
		return new Promise((resolve) => {
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
								
								setTimeout(() => {
									uni.navigateBack()
								}, 1000)
								resolve(true)
							} else {
								uni.showToast({
									title: result.message || '删除失败',
									icon: 'error'
								})
								resolve(false)
							}
						} catch (error) {
							uni.hideLoading()
							console.error('删除任务失败:', error)
							uni.showToast({
								title: '删除失败，请重试',
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

	return {
		taskId,
		bookId,
		task,
		subtasks,
		parentTask,
		assigneeInfo,
		loading,
		error,
		loadTaskDetail,
		toggleStatus,
		toggleSubtaskStatus,
		deleteTask
	}
}
