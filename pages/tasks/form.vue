<template>
	<view class="task-form">
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

				<uni-forms-item name="budget" label="预算（元）">
					<uni-easyinput 
						v-model="formData.budget" 
						type="number"
						placeholder="任务预算金额（可选）"
						:min="0"
						:step="1">
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
			<button class="submit-btn" @click="submitTask" :loading="submitting">
				{{ buttonText }}
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
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

// 用于存储从路由获取的参数，初始为 null
let taskId = null
let bookId = null
let parentId = null

// 页面模式状态
const isEditMode = ref(false)

// 组件本地状态
const submitting = ref(false)
const loading = ref(false)
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
	budget: '',
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

// 动态按钮文本
const buttonText = computed(() => {
	if (isEditMode.value) {
		return submitting.value ? '保存中...' : '保存'
	} else {
		return submitting.value ? '创建中...' : '创建任务'
	}
})

// 使用 onLoad 安全地获取页面参数
onLoad(async (options) => {
	console.log("onLoad options", JSON.stringify(options, null, 2))
	
	if (options && options.id) {
		// 编辑模式
		isEditMode.value = true
		taskId = options.id
		bookId = options.bookId
		
		if (!bookId) {
			console.error('错误：编辑模式下未能获取到项目册ID')
			uni.showToast({ title: '页面参数错误', icon: 'error' })
			uni.navigateBack()
			return
		}
		
		// 加载任务数据和父任务数据
		await loadTaskData()
		await loadParentTasks()
	} else if (options && options.bookId) {
		// 创建模式
		isEditMode.value = false
		bookId = options.bookId
		parentId = options.parentId || null
		
		// 如果传入了父任务ID，设置默认值
		if (parentId) {
			formData.parent_id = parentId
		}
		
		// 加载父任务数据
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
	// 如果页面已经初始化过，并且有ID存在，可以在这里处理一些逻辑
	if (hasInitialized.value && (taskId || bookId)) {
		// 可以在这里处理从其他页面返回时的逻辑
	}
})

// 页面卸载时清理资源
onUnmounted(() => {
	// 清理事件监听
	uni.$off('updateTags', updateTaskTags)
})

// 加载任务数据（仅编辑模式）
const loadTaskData = async () => {
	if (!isEditMode.value) return
	
	console.log('开始加载任务数据，taskId:', taskId)
	loading.value = true
	try {
		const todoBooksObj = uniCloud.importObject('todobook-co')
		const result = await todoBooksObj.getTodoItemDetail(taskId)
		
		//console.log('任务数据加载结果:', JSON.stringify(result, null, 2))
		
		if (result.code === 0 && result.data && result.data.task) {
			const task = result.data.task
			
			// 填充表单数据 - 使用 Object.assign 确保响应式更新
			Object.assign(formData, {
				title: task.title || '',
				description: task.description || '',
				priority: task.priority || 'medium',
				due_date: task.due_date || null,
				estimated_hours: task.estimated_hours ? String(task.estimated_hours) : '',
				budget: task.budget ? String(task.budget) : '',
				tags: task.tags || [],
				parent_id: task.parent_id || null
			})
			
			//console.log('表单数据已填充:', JSON.stringify(formData, null, 2))
			
			// 保存原始数据用于比较
			originalData.value = JSON.parse(JSON.stringify(formData))
			
			// 确保DOM更新
			await nextTick()
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
			const availableTasks = result.data.tasks.filter(task => {
				// 过滤已完成的任务
				if (task.status === 'completed') return false
				// 过滤已经有父任务的任务（只允许一层父子关系）
				if (task.parent_id) return false
				
				// 编辑模式下的额外过滤
				if (isEditMode.value) {
					// 过滤当前任务
					if (task._id === taskId) return false
					// 过滤当前任务的子任务
					if (task.parent_id === taskId) return false
				}
				
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

// 统一提交方法
const submitTask = async () => {
	try {
		await form.value.validate()
	} catch (errors) {
		console.log('表单验证失败:', errors)
		return
	}

	submitting.value = true

	// 准备任务数据
	const taskData = {
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
	} else if (isEditMode.value) {
		taskData.estimated_hours = null
	}

	// 添加预算
	if (formData.budget) {
		taskData.budget = parseInt(formData.budget)
	} else if (isEditMode.value) {
		taskData.budget = null
	}

	if (isEditMode.value) {
		// 编辑模式：发出更新事件
		uni.$emit('task-updated', { ...originalData.value, ...taskData, _id: taskId });
	} else {
		// 创建模式：发出创建事件
		taskData.todobook_id = bookId;
		uni.$emit('task-created', taskData);
	}
	
	// 无论成功与否，都直接返回
	uni.navigateBack();
}

const cancel = () => {
	if (hasChanges()) {
		const content = isEditMode.value ? 
			'确定要取消编辑吗？未保存的修改将丢失。' : 
			'确定要取消创建任务吗？已输入的内容将丢失。'
			
		uni.showModal({
			title: '确认取消',
			content: content,
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
	if (isEditMode.value) {
		// 编辑模式：与原始数据对比
		if (!originalData.value) return false
		return JSON.stringify(formData) !== JSON.stringify(originalData.value)
	} else {
		// 创建模式：检查是否有输入
		return formData.title.trim() || 
			   formData.description.trim() ||
			   formData.tags.length > 0
	}
}

const openTagManager = () => {
	// 跳转到标签管理页面
	// 使用 JSON.parse(JSON.stringify()) 确保传递普通对象而不是响应式代理
	const plainTags = JSON.parse(JSON.stringify(formData.tags))
	const currentTagsStr = encodeURIComponent(JSON.stringify(plainTags))
	let url = `/pages/tags/manage?bookId=${bookId}&currentTags=${currentTagsStr}`
	
	console.log('即将传递的标签数据:', JSON.stringify(plainTags, null, 2))
	
	// 编辑模式下传递taskId
	if (isEditMode.value && taskId) {
		url += `&taskId=${taskId}`
	}
	
	console.log('跳转URL:', url)
	uni.navigateTo({ url })
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

<style lang="scss" scoped>
.task-form {
	padding: 20rpx;
	padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
	background-color: #f5f5f5;
	min-height: 100vh;
	box-sizing: border-box;
}

.form-section {
	background-color: #ffffff;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	padding: 24rpx;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333333;
}

.add-tag-btn {
	display: flex;
	align-items: center;
	padding: 8rpx 16rpx;
	background-color: #f0f6ff;
	border-radius: 20rpx;
}

.add-tag-text {
	font-size: 24rpx;
	color: #007AFF;
	margin-left: 8rpx;
}

.tags-container {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.tag-item {
	display: flex;
	align-items: center;
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
	background-color: #f0f6ff;
}

.tag-text {
	font-size: 24rpx;
	color: #333333;
	margin-right: 8rpx;
}

.remove-tag {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32rpx;
	height: 32rpx;
	border-radius: 16rpx;
	background-color: rgba(0, 0, 0, 0.2);
}

.empty-tags {
	padding: 40rpx 0;
	text-align: center;
}

.empty-text {
	font-size: 28rpx;
	color: #999999;
}

.button-section {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #ffffff;
	padding: 20rpx;
	border-top: 1rpx solid #e5e5e5;
	display: flex;
	gap: 20rpx;
	/* #ifndef APP-NVUE */
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	/* #endif */
}

.cancel-btn, .submit-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 12rpx;
	font-size: 32rpx;
	border: none;
}

.cancel-btn {
	background-color: #f5f5f5;
	color: #666666;
}

.submit-btn {
	background-color: #007AFF;
	color: #ffffff;
}

.cancel-btn:active {
	background-color: #e8e8e8;
}

.submit-btn:active {
	background-color: #0056cc;
}
</style>