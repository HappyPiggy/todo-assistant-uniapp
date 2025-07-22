/**
 * @description 提供与任务相关的无状态、可复用的工具函数
 * @returns {object} 包含一系列工具函数的对象
 */
export function useTaskUtils() {
	/**
	 * @description 将优先级的英文标识转换为中文文本
	 * @param {string} priority - 优先级的英文标识 (e.g., 'low', 'medium', 'high', 'urgent')
	 * @returns {string} - 对应的中文文本 (e.g., '低', '中', '高', '急')
	 */
	const getPriorityText = (priority) => {
		const map = {
			low: '低',
			medium: '中', 
			high: '高',
			urgent: '急'
		}
		return map[priority] || '中'
	}

	/**
	 * @description 检查任务是否已逾期
	 * @param {string | Date} dueDate - 任务的截止日期
	 * @returns {boolean} - 如果已逾期返回 true，否则返回 false
	 */
	const isOverdue = (dueDate) => {
		return new Date(dueDate) < new Date()
	}

	/**
	 * @description 将截止日期格式化为易于理解的相对时间文本
	 * @param {string | Date} dueDate - 任务的截止日期
	 * @returns {string} - 格式化后的文本 (e.g., '今天', '明天', '逾期3天')
	 */
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

	/**
	 * @description 将时间戳格式化为相对时间文本
	 * @param {string | Date} timeStr - 需要格式化的时间字符串或Date对象
	 * @returns {string} - 格式化后的文本 (e.g., '刚刚', '5分钟前', '3天前')
	 */
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

	/**
	 * @description 为标签获取一个唯一的key，用于v-for循环
	 * @param {object | string} tag - 标签对象或字符串
	 * @param {number} index - 标签在数组中的索引
	 * @returns {string | number} - 标签的ID或索引
	 */
	const getTagKey = (tag, index) => {
		if (typeof tag === 'object' && tag.id) {
			return tag.id
		}
		return index
	}

	/**
	 * @description 从标签对象或字符串中获取标签名称
	 * @param {object | string} tag - 标签对象或字符串
	 * @returns {string} - 标签的名称
	 */
	const getTagName = (tag) => {
		if (typeof tag === 'object' && tag.name) {
			return tag.name
		}
		return tag
	}

	/**
	 * @description 从标签对象或字符串中获取标签颜色
	 * @param {object | string} tag - 标签对象或字符串
	 * @returns {string} - 标签的背景颜色（CSS色值）
	 */
	const getTagColor = (tag) => {
		if (typeof tag === 'object' && tag.color) {
			return tag.color
		}
		return '#f0f6ff'
	}

	/**
	 * @description 导航到父任务的详情页
	 * @param {object} parentTask - 父任务对象
	 * @param {string} bookId - 当前任务所在任务清单的ID
	 * @returns {void}
	 */
	const openParentTask = (parentTask, bookId) => {
		if (parentTask) {
			uni.navigateTo({
				url: `/pages/tasks/detail?id=${parentTask._id}&bookId=${bookId}`
			})
		}
	}

	/**
	 * @description 导航到子任务的详情页
	 * @param {object} subtask - 子任务对象
	 * @param {string} bookId - 当前任务所在任务清单的ID
	 * @returns {void}
	 */
	const openSubtask = (subtask, bookId) => {
		uni.navigateTo({
			url: `/pages/tasks/detail?id=${subtask._id}&bookId=${bookId}`
		})
	}

	/**
	 * @description 导航到新建任务页，并预设好父任务ID
	 * @param {string} bookId - 当前任务所在任务清单的ID
	 * @param {string} parentId - 父任务的ID
	 * @returns {void}
	 */
	const addSubtask = (bookId, parentId) => {
		uni.navigateTo({
			url: `/pages/tasks/form?bookId=${bookId}&parentId=${parentId}`
		})
	}

	return {
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
	}
}
