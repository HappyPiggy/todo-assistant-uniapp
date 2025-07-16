<template>
	<view class="create-task">
		<uni-forms ref="form" :model="formData" :rules="rules" label-position="top">
			<!-- 基本信息 -->
			<view class="form-section">
				<view class="section-header">
					<text class="section-title">基本信息</text>
				</view>

				<uni-forms-item name="title" label="任务标题" required>
					<uni-easyinput 
						v-model="formData.title" 
						placeholder="请输入任务标题"
						:clearable="true"
						:maxlength="200">
					</uni-easyinput>
				</uni-forms-item>

				<uni-forms-item name="description" label="任务描述">
					<uni-easyinput 
						v-model="formData.description" 
						type="textarea"
						placeholder="描述任务的详细内容（可选）"
						:maxlength="2000"
						:clearable="true">
					</uni-easyinput>
				</uni-forms-item>
			</view>

			<!-- 任务属性 -->
			<view class="form-section">
				<view class="section-header">
					<text class="section-title">任务属性</text>
				</view>

				<uni-forms-item name="priority" label="优先级">
					<uni-data-picker 
						v-model="formData.priority" 
						:localdata="priorityOptions"
						placeholder="选择优先级">
					</uni-data-picker>
				</uni-forms-item>

				<uni-forms-item name="due_date" label="截止日期">
					<uni-datetime-picker 
						v-model="formData.due_date"
						type="date"
						:clear-icon="true"
						placeholder="选择截止日期">
					</uni-datetime-picker>
				</uni-forms-item>

				<uni-forms-item name="estimated_hours" label="预估工时（小时）">
					<uni-easyinput 
						v-model="formData.estimated_hours" 
						type="number"
						placeholder="预估完成所需工时"
						:min="0"
						:step="0.5">
					</uni-easyinput>
				</uni-forms-item>
			</view>

			<!-- 分类标签 -->
			<view class="form-section">
				<view class="section-header">
					<text class="section-title">分类标签</text>
					<view class="add-tag-btn" @click="openTagManager">
						<uni-icons color="#007AFF" size="18" type="plus" />
						<text class="add-tag-text">管理</text>
					</view>
				</view>

				<view class="tags-container" v-if="formData.tags.length > 0">
					<view 
						v-for="(tag, index) in formData.tags" 
						:key="getTagKey(tag, index)"
						class="tag-item"
						:style="{ backgroundColor: getTagColor(tag) }">
						<text class="tag-text">{{ getTagName(tag) }}</text>
						<view class="remove-tag" @click="removeTag(index)">
							<uni-icons color="#ffffff" size="14" type="clear" />
						</view>
					</view>
				</view>
				<view v-else class="empty-tags">
					<text class="empty-text">暂无标签，点击右上角管理</text>
				</view>
			</view>

			<!-- 父任务选择 -->
			<view class="form-section" v-if="availableParents.length > 0 || formData.parent_id">
				<view class="section-header">
					<text class="section-title">父任务</text>
				</view>

				<uni-forms-item name="parent_id" label="选择父任务">
					<uni-data-picker 
						v-model="formData.parent_id" 
						:localdata="availableParents"
						placeholder="选择父任务（可选）">
					</uni-data-picker>
				</uni-forms-item>
			</view>
		</uni-forms>

		<!-- 底部按钮 -->
		<view class="button-section">
			<button class="cancel-btn" @click="cancel">取消</button>
			<button class="create-btn" @click="createTask" :loading="creating">
				{{ creating ? '创建中...' : '创建任务' }}
			</button>
		</view>

		<!-- 添加标签弹窗 -->
		<uni-popup ref="tagPopup" type="dialog">
			<uni-popup-dialog 
				ref="tagDialog"
				title="添加标签"
				placeholder="请输入标签名称"
				:value="newTag"
				@confirm="addTag"
				@close="closeTagDialog">
			</uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const bookId = ref('')
const creating = ref(false)
const newTag = ref('')
const availableParents = ref([])
const form = ref(null)
const tagPopup = ref(null)

const formData = reactive({
	title: '',
	description: '',
	priority: 'medium',
	due_date: null,
	estimated_hours: '',
	tags: [],
	parent_id: null
})

const rules = {
	title: {
		rules: [
			{ required: true, errorMessage: '请输入任务标题' },
			{ minLength: 1, maxLength: 200, errorMessage: '标题长度应为1-200个字符' }
		]
	}
}

const priorityOptions = [
	{ value: 'low', text: '低优先级' },
	{ value: 'medium', text: '中优先级' },
	{ value: 'high', text: '高优先级' },
	{ value: 'urgent', text: '紧急' }
]

// 生命周期
onMounted(() => {
	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1]
	const options = currentPage.options
	
	if (!options.bookId) {
		uni.showToast({
			title: '缺少项目册ID',
			icon: 'error'
		})
		uni.navigateBack()
		return
	}
	bookId.value = options.bookId
	
	// 如果传入了父任务ID，设置默认值
	if (options.parentId) {
		formData.parent_id = options.parentId
	}
	
	loadParentTasks()
})

// 加载父任务数据
const loadParentTasks = async () => {
	if (!bookId.value || typeof bookId.value !== 'string') {
		console.warn('bookId is empty, undefined or not string:', bookId.value)
		return
	}
	
	try {
		// 使用云对象获取可用的父任务
		const todoBooksObj = uniCloud.importObject('todobook-co')
		const result = await todoBooksObj.getTodoBookDetail(bookId.value)
		
		if (result.code === 0 && result.data.tasks) {
			console.log('所有任务数量:', result.data.tasks.length)
			console.log('任务列表:', result.data.tasks)
			
			// 筛选出可作为父任务的任务
			// 1. 不能选择已完成的任务
			// 2. 不能选择有父任务的任务（避免多层嵌套）
			const availableTasks = result.data.tasks.filter(task => {
				// 过滤已完成的任务
				if (task.status === 'completed') return false
				// 过滤已经有父任务的任务（只允许一层父子关系）
				if (task.parent_id) return false
				return true
			})
			
			console.log('可选父任务数量:', availableTasks.length)
			console.log('可选父任务:', availableTasks)
			
			availableParents.value = availableTasks.map(task => ({
				value: task._id,
				text: task.title
			}))
		}
	} catch (error) {
		console.error('加载父任务失败:', error)
	}
}

const createTask = async () => {
	try {
		await form.value.validate()
	} catch (errors) {
		console.log('表单验证失败:', errors)
		return
	}

	// 准备任务数据
	const taskData = {
		todobook_id: bookId.value,
		title: formData.title.trim(),
		description: formData.description.trim(),
		priority: formData.priority,
		parent_id: formData.parent_id || null,
		due_date: formData.due_date,
		tags: formData.tags || []
	}

	// 添加预估工时
	if (formData.estimated_hours) {
		taskData.estimated_hours = parseFloat(formData.estimated_hours)
	}

	// 乐观更新：立即返回并显示成功消息
	uni.showToast({
		title: '创建中...',
		icon: 'loading',
		duration: 10000 // 设置较长时间，后续会手动关闭
	})

	// 立即返回列表页
	setTimeout(() => {
		uni.navigateBack()
	}, 300)

	// 异步创建任务
	createTaskAsync(taskData)
}

const createTaskAsync = async (taskData) => {
	try {
		// 使用云对象创建任务
		const todoBooksObj = uniCloud.importObject('todobook-co')
		const result = await todoBooksObj.createTodoItem(taskData)
		
		// 隐藏loading提示
		uni.hideToast()
		
		if (result.code === 0) {
			// 创建成功，显示成功提示
			uni.showToast({
				title: '创建成功',
				icon: 'success',
				duration: 1500
			})
		} else {
			// 创建失败，显示错误
			uni.showToast({
				title: result.message || '创建失败',
				icon: 'error',
				duration: 2000
			})
		}
	} catch (error) {
		console.error('创建任务失败:', error)
		uni.hideToast()
		uni.showToast({
			title: error.message || '网络错误',
			icon: 'error',
			duration: 2000
		})
	}
}

const cancel = () => {
	if (hasChanges()) {
		uni.showModal({
			title: '确认取消',
			content: '确定要取消创建任务吗？已输入的内容将丢失。',
			success: (res) => {
				if (res.confirm) {
					uni.navigateBack()
				}
			}
		})
	} else {
		uni.navigateBack()
	}
}

const hasChanges = () => {
	return formData.title.trim() || 
		   formData.description.trim() ||
		   formData.tags.length > 0
}

const openTagManager = () => {
	// 跳转到标签管理页面
	const currentTagsStr = encodeURIComponent(JSON.stringify(formData.tags))
	uni.navigateTo({
		url: `/pages/tags/manage?bookId=${bookId.value}&currentTags=${currentTagsStr}`
	})
}

// 从标签管理页面返回时调用
const updateTaskTags = (selectedTags) => {
	formData.tags = selectedTags
}

// 获取标签的唯一key
const getTagKey = (tag, index) => {
	if (typeof tag === 'object' && tag.id) {
		return tag.id
	}
	return index
}

// 获取标签名称
const getTagName = (tag) => {
	if (typeof tag === 'object' && tag.name) {
		return tag.name
	}
	return tag // 兼容旧格式的字符串标签
}

// 获取标签颜色
const getTagColor = (tag) => {
	if (typeof tag === 'object' && tag.color) {
		return tag.color
	}
	return '#f0f6ff' // 默认颜色，兼容旧格式
}

const showAddTag = () => {
	newTag.value = ''
	tagPopup.value.open()
}

const addTag = (value) => {
	const tag = value.trim()
	if (tag && !formData.tags.includes(tag)) {
		formData.tags.push(tag)
	}
	closeTagDialog()
}

const removeTag = (index) => {
	formData.tags.splice(index, 1)
}

const closeTagDialog = () => {
	tagPopup.value.close()
	newTag.value = ''
}

// 监听标签更新事件
uni.$on('updateTags', updateTaskTags)
</script>

<style lang="scss" scoped src="./create.scss"></style>