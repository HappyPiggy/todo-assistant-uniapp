export function useTaskUtils() {
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
		return tag
	}

	const getTagColor = (tag) => {
		if (typeof tag === 'object' && tag.color) {
			return tag.color
		}
		return '#f0f6ff'
	}

	const openParentTask = (parentTask, bookId) => {
		if (parentTask) {
			uni.navigateTo({
				url: `/pages/tasks/detail?id=${parentTask._id}&bookId=${bookId}`
			})
		}
	}

	const openSubtask = (subtask, bookId) => {
		uni.navigateTo({
			url: `/pages/tasks/detail?id=${subtask._id}&bookId=${bookId}`
		})
	}

	const addSubtask = (bookId, parentId) => {
		uni.navigateTo({
			url: `/pages/tasks/create?bookId=${bookId}&parentId=${parentId}`
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