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

				<uni-forms-item name="actual_cost" label="实际花费（元）">
					<uni-easyinput 
						v-model="formData.actual_cost" 
						type="number"
						placeholder="任务实际花费金额（可选）"
						:min="0"
						:step="1">
					</uni-easyinput>
				</uni-forms-item>
			</view>

			<!-- 分类标签 -->
			<view class="form-section">
				<view class="section-header">
					<text class="section-title">分类标签</text>
					<!-- 标签管理按钮（仅登录用户可见） -->
					<view v-if="!isGuest" class="add-tag-btn" @click="openTagManager">
						<uni-icons color="#007AFF" size="18" type="plus" />
						<text class="add-tag-text">管理</text>
					</view>
				</view>

				<view class="tags-container" v-if="formData.tags.length > 0">
					<view 
						v-for="(tag, index) in formData.tags" 
						:key="getTagKey(tag, index)"
						class="tag-with-delete">
						<UniTag 
							:text="getTagName(tag)"
							:color="getTagColor(tag)"
							size="medium" />
						<view class="remove-tag" @click="removeTag(index)">
							<uni-icons color="#ffffff" size="12" type="clear" />
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
import UniTag from '@/pages/todobooks/components/common/UniTag.vue'
import { useDataAdapter } from '@/composables/useDataAdapter.js'
import { useAuthState } from '@/composables/useAuthState.js'
import { checkFeatureAccess } from '@/utils/featureGuard.js'

// 用于存储从路由获取的参数，初始为 null
let taskId = null
let bookId = null
let parentId = null

// 使用数据适配器和认证状态管理
const dataAdapter = useDataAdapter()
const { isGuest, getPageTitlePrefix } = useAuthState()

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
	actual_cost: '',
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

// 页面标题
const pageTitle = computed(() => {
	const prefix = getPageTitlePrefix()
	return prefix + (isEditMode.value ? '编辑任务' : '创建任务')
})

// 使用 onLoad 安全地获取页面参数
onLoad(async (options) => {
	console.log("onLoad options", JSON.stringify(options, null, 2))
	
	if (options && options.id) {
		// 编辑模式
		isEditMode.value = true
		taskId = options.id
		bookId = options.bookId
		
		// 设置页面标题
		uni.setNavigationBarTitle({
			title: pageTitle.value
		})
		
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
		
		// 设置页面标题
		uni.setNavigationBarTitle({
			title: pageTitle.value
		})
		
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
	uni.$off('tag-deleted')
	uni.$off('tag-updated')
})

// 监听标签相关事件
onMounted(() => {
	// 监听标签删除事件
	uni.$on('tag-deleted', (deletedTagId) => {
		// 从当前任务的标签中移除已删除的标签
		formData.tags = formData.tags.filter(tag => tag.id !== deletedTagId)
	})
	
	// 监听标签编辑事件
	uni.$on('tag-updated', (editedTag) => {
		// 更新当前任务中的标签信息
		const index = formData.tags.findIndex(tag => tag.id === editedTag.id)
		if (index !== -1) {
			formData.tags[index] = { ...editedTag }
		}
	})
})

// 加载任务数据（仅编辑模式）
const loadTaskData = async () => {
	if (!isEditMode.value) return
	
	console.log('开始加载任务数据，taskId:', taskId)
	loading.value = true
	try {
		// 使用数据适配器加载任务详情
		const result = await dataAdapter.getTask(taskId)
		
		console.log('任务数据加载结果:', JSON.stringify(result, null, 2))
		
		// 数据适配器已经处理了返回结构，直接使用返回的数据
		const task = result
		
		if (task) {
			// 填充表单数据 - 使用 Object.assign 确保响应式更新
			Object.assign(formData, {
				title: task.title || '',
				description: task.description || '',
				priority: task.priority || 'medium',
				due_date: task.due_date || null,
				estimated_hours: task.estimated_hours ? String(task.estimated_hours) : '',
				budget: task.budget ? String(task.budget) : '',
				actual_cost: task.actual_cost ? String(task.actual_cost) : '',
				tags: task.tags || [],
				parent_id: task.parent_id || null
			})
			
			console.log('表单数据已填充:', JSON.stringify(formData, null, 2))
			
			// 保存原始数据用于比较
			originalData.value = JSON.parse(JSON.stringify(formData))
			
			// 确保DOM更新
			await nextTick()
		} else {
			throw new Error('加载任务数据失败')
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
		// 使用数据适配器获取可用的父任务
		const tasks = await dataAdapter.getTasks(bookId)
		
		if (tasks && tasks.length > 0) {
			// 筛选出可作为父任务的任务
			const availableTasks = tasks.filter(task => {
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

	try {
		// 准备任务数据
		const taskData = {
			title: formData.title.trim(),
			description: formData.description.trim(),
			priority: formData.priority,
			parent_id: formData.parent_id || null,
			due_date: formData.due_date,
			tags: formData.tags || [],
			// 统一使用budget和actual_cost字段
			budget: formData.budget ? parseInt(formData.budget) : 0,
			actual_cost: formData.actual_cost ? parseInt(formData.actual_cost) : 0,
			estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : 0
		}

		let result
		if (isEditMode.value) {
			// 编辑模式：检查是否有父任务变化，决定是否跳过页面刷新
			const hasParentChange = (formData.parent_id !== originalData.value?.parent_id)
			const skipRefresh = !hasParentChange // 没有父任务变化时跳过刷新
			
			// 使用数据适配器更新任务，同时跳过加载提示
			result = await dataAdapter.updateTask(taskId, taskData, { skipRefresh })
			console.log('任务更新结果:', JSON.stringify(result, null, 2))
		} else {
			// 创建模式：使用数据适配器创建任务
			result = await dataAdapter.createTask(bookId, taskData)
			console.log('任务创建结果:', JSON.stringify(result, null, 2))
		}

		if (result) {
			// 先发送事件通知页面更新，再显示成功提示
			if (isEditMode.value) {
				// 编辑模式：检查是否有父任务变化，决定如何通知页面更新
				const hasParentChange = (formData.parent_id !== originalData.value?.parent_id)
				
				if (hasParentChange) {
					// 有父任务变化，触发完整刷新
					console.log('发送父任务变更事件')
					uni.$emit('task-parent-changed', { taskId, bookId })
				} else {
					// 没有父任务变化，发送任务更新事件用于本地更新
					// 使用表单数据构建完整的更新数据
					const updatedTaskData = {
						_id: taskId,
						title: formData.title.trim(),
						description: formData.description.trim(),
						priority: formData.priority,
						due_date: formData.due_date,
						tags: formData.tags || [],
						estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : 0,
						budget: formData.budget ? parseFloat(formData.budget) : 0,
						actual_cost: formData.actual_cost ? parseFloat(formData.actual_cost) : 0,
						parent_id: formData.parent_id || null,
						updated_at: new Date()
					}
					
					console.log('发送任务更新事件 - 完整数据:', {
						taskId, 
						bookId,
						updatedTask: updatedTaskData
					})
					
					uni.$emit('task-updated', { 
						taskId, 
						bookId,
						updatedTask: updatedTaskData
					})
					
					console.log('任务更新事件已发送')
				}
			} else {
				// 创建模式：检测是否有父任务
				const hasParentTask = !!formData.parent_id
				if (hasParentTask) {
					uni.$emit('task-parent-changed', { taskId: null, bookId })
				}
			}

			uni.showToast({
				title: isEditMode.value ? '保存成功' : '创建成功',
				icon: 'success'
			})

			// 返回上一页
			setTimeout(() => {
				uni.navigateBack()
			}, 1000)
		} else {
			throw new Error('操作失败')
		}
	} catch (error) {
		console.error(isEditMode.value ? '保存任务失败:' : '创建任务失败:', error)
		uni.showToast({
			title: isEditMode.value ? '保存失败，请重试' : '创建失败，请重试',
			icon: 'none'
		})
	} finally {
		submitting.value = false
	}
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

const openTagManager = async () => {
	// 访客用户无法使用标签管理功能
	if (isGuest.value) {
		const canAccess = await checkFeatureAccess('tag_management')
		if (!canAccess.allowed) {
			uni.showModal({
				title: '功能受限',
				content: canAccess.message,
				confirmText: '立即登录',
				cancelText: '稍后再说',
				success: (res) => {
					if (res.confirm) {
						uni.navigateTo({
							url: '/pages/login/login-withpwd'
						})
					}
				}
			})
			return
		}
	}
	
	// 登录用户可以使用标签管理功能
	// 使用 JSON.parse(JSON.stringify()) 确保传递普通对象而不是响应式代理
	const plainTags = JSON.parse(JSON.stringify(formData.tags))
	const currentTagsStr = encodeURIComponent(JSON.stringify(plainTags))
	let url = `/pages/tags/manage?bookId=${bookId}&currentTags=${currentTagsStr}`
	
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

.tag-with-delete {
	position: relative;
	display: inline-flex;
	align-items: center;
	margin: 4rpx 8rpx 4rpx 0;
}

.remove-tag {
	position: absolute;
	top: -4rpx;
	right: -4rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24rpx;
	height: 24rpx;
	border-radius: 12rpx;
	background-color: rgba(255, 71, 87, 0.9);
	border: 1rpx solid #ffffff;
	backdrop-filter: blur(4rpx);
	box-shadow: 0 2rpx 6rpx rgba(255, 71, 87, 0.25);
	transition: all 0.2s ease;
	z-index: 1;
}

.remove-tag:hover {
	background-color: #ff4757;
	box-shadow: 0 4rpx 12rpx rgba(255, 71, 87, 0.4);
	transform: scale(1.1);
}

.remove-tag:active {
	background-color: #ff3742;
	transform: scale(0.95);
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
	z-index: 10;
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