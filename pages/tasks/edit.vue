<template>
	<view class="edit-task">
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
			<button class="save-btn" @click="saveTask" :loading="saving">
				{{ saving ? '保存中...' : '保存' }}
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

// 用于存储从路由获取的参数，初始为 null
let taskId = null
let bookId = null

// 组件本地状态
const saving = ref(false)
const loading = ref(true)
const newTag = ref('')
const availableParents = ref([])
const originalData = ref(null)
const form = ref(null)
const tagPopup = ref(null)
const hasInitialized = ref(false) // 用于 onShow 判断是否为首次进入页面

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

// 使用 onLoad 安全地获取页面参数
onLoad(async (options) => {
	console.log("onLoad options", JSON.stringify(options, null, 2))
	if (options && options.id && options.bookId) {
		taskId = options.id
		bookId = options.bookId
		
		// 加载任务数据和父任务数据
		await loadTaskData()
		await loadParentTasks()
	} else {
		console.error('错误：未能从路由参数中获取到必要参数')
		uni.showToast({ title: '页面参数错误', icon: 'error' })
		uni.navigateBack()
	}
})

// onMounted 在 onLoad 之后执行，适合用来标记页面已完成首次渲染
onMounted(() => {
	hasInitialized.value = true
})

// 页面再次显示时触发（例如从下一页返回）
onShow(() => {
	// 如果页面已经初始化过，并且 taskId 存在，可以在这里处理一些逻辑
	if (hasInitialized.value && taskId) {
		// 可以在这里处理从其他页面返回时的逻辑
	}
})

// 页面卸载时清理资源
onUnmounted(() => {
	// 清理事件监听
	uni.$off('updateTags', updateTaskTags)
})

// 加载任务数据
const loadTaskData = async () => {
	try {
		const todoBooksObj = uniCloud.importObject('todobook-co')
		const result = await todoBooksObj.getTodoItemDetail(taskId)
		
		if (result.code === 0 && result.data) {
			const task = result.data
			
			// 填充表单数据
			formData.title = task.title || ''
			formData.description = task.description || ''
			formData.priority = task.priority || 'medium'
			formData.due_date = task.due_date || null
			formData.estimated_hours = task.estimated_hours ? String(task.estimated_hours) : ''
			formData.tags = task.tags || []
			formData.parent_id = task.parent_id || null
			
			// 保存原始数据用于比较
			originalData.value = JSON.parse(JSON.stringify(formData))
		} else {
			throw new Error(result.message || '加载任务数据失败')
		}
	} catch (error) {
		console.error('加载任务数据失败:', error)
		uni.showToast({
			title: '加载失败',
			icon: 'error'
		})
		setTimeout(() => {
			uni.navigateBack()
		}, 1500)
	} finally {
		loading.value = false
	}
}

// 加载父任务数据
const loadParentTasks = async () => {
	if (!bookId || typeof bookId !== 'string') {
		console.warn('bookId is empty, undefined or not string:', bookId)
		return
	}
	
	try {
		// 使用云对象获取可用的父任务
		const todoBooksObj = uniCloud.importObject('todobook-co')
		const result = await todoBooksObj.getTodoBookDetail(bookId)
		
		if (result.code === 0 && result.data.tasks) {
			// 筛选出可作为父任务的任务
			// 1. 不能选择已完成的任务
			// 2. 不能选择有父任务的任务（避免多层嵌套）
			// 3. 不能选择当前编辑的任务
			// 4. 不能选择当前任务的子任务
			const availableTasks = result.data.tasks.filter(task => {
				// 过滤当前任务
				if (task._id === taskId) return false
				// 过滤已完成的任务
				if (task.status === 'completed') return false
				// 过滤已经有父任务的任务（只允许一层父子关系）
				if (task.parent_id) return false
				// 过滤当前任务的子任务
				if (task.parent_id === taskId) return false
				return true
			})
			
			availableParents.value = availableTasks.map(task => ({
				value: task._id,
				text: task.title
			}))
		}
	} catch (error) {
		console.error('加载父任务失败:', error)
	}
}

const saveTask = async () => {
	try {
		await form.value.validate()
	} catch (errors) {
		console.log('表单验证失败:', errors)
		return
	}

	// 准备更新数据
	const updateData = {
		title: formData.title.trim(),
		description: formData.description.trim(),
		priority: formData.priority,
		parent_id: formData.parent_id || null,
		due_date: formData.due_date,
		tags: formData.tags || []
	}

	// 添加预估工时
	if (formData.estimated_hours) {
		updateData.estimated_hours = parseFloat(formData.estimated_hours)
	} else {
		updateData.estimated_hours = null
	}

	// 乐观更新：立即返回并显示成功消息
	uni.showToast({
		title: '保存中...',
		icon: 'loading',
		duration: 10000 // 设置较长时间，后续会手动关闭
	})

	// 立即返回列表页
	setTimeout(() => {
		uni.navigateBack()
	}, 300)

	// 异步更新任务
	updateTaskAsync(updateData)
}

const updateTaskAsync = async (updateData) => {
	try {
		// 使用云对象更新任务
		const todoBooksObj = uniCloud.importObject('todobook-co')
		const result = await todoBooksObj.updateTodoItem(taskId, updateData)
		
		// 隐藏loading提示
		uni.hideToast()
		
		if (result.code === 0) {
			// 更新成功，显示成功提示
			uni.showToast({
				title: '保存成功',
				icon: 'success',
				duration: 1500
			})
		} else {
			// 更新失败，显示错误
			uni.showToast({
				title: result.message || '保存失败',
				icon: 'error',
				duration: 2000
			})
		}
	} catch (error) {
		console.error('更新任务失败:', error)
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
			content: '确定要取消编辑吗？未保存的修改将丢失。',
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
	if (!originalData.value) return false
	return JSON.stringify(formData) !== JSON.stringify(originalData.value)
}

const openTagManager = () => {
	// 跳转到标签管理页面
	const currentTagsStr = encodeURIComponent(JSON.stringify(formData.tags))
	uni.navigateTo({
		url: `/pages/tags/manage?taskId=${taskId}&bookId=${bookId}&currentTags=${currentTagsStr}`
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

<style lang="scss" scoped src="./edit.scss"></style>