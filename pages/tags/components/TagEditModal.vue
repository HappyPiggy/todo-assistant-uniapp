<template>
	<uni-popup ref="popup" type="center" :mask-click="false">
		<view class="edit-modal">
			<view class="modal-header">
				<view class="modal-title">编辑标签</view>
				<view class="close-btn" @click="handleCancel">
					<uni-icons type="close" size="24" color="#666666" />
				</view>
			</view>

			<view class="modal-content">
				<uni-forms ref="form" :model="formData" :rules="rules">
					<uni-forms-item name="name" label="标签名称" required>
						<uni-easyinput 
							v-model="formData.name" 
							placeholder="请输入标签名称（5字内）"
							:clearable="true"
							:maxlength="5"
							:focus="true">
						</uni-easyinput>
					</uni-forms-item>

					<uni-forms-item label="标签颜色" required>
						<view class="color-picker">
							<view 
								v-for="color in colorOptions" 
								:key="color.value"
								class="color-item"
								:class="{ active: formData.color === color.value }"
								:style="{ backgroundColor: color.value }"
								@click="selectColor(color.value)">
								<uni-icons 
									v-if="formData.color === color.value"
									color="#ffffff" 
									size="16" 
									type="checkmarkempty" />
							</view>
						</view>
					</uni-forms-item>
				</uni-forms>

				<!-- 实时预览 -->
				<view class="preview-section" v-if="formData.name">
					<view class="preview-label">预览效果：</view>
					<UniTag 
						:text="formData.name"
						:color="formData.color"
						size="medium" />
				</view>
			</view>

			<view class="modal-actions">
				<button class="cancel-btn" @click="handleCancel" :disabled="loading">
					取消
				</button>
				<button class="confirm-btn" @click="handleConfirm" :disabled="!canSave || loading">
					<text v-if="loading">保存中...</text>
					<text v-else>保存</text>
				</button>
			</view>
		</view>
	</uni-popup>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import UniTag from '@/pages/todobooks/components/common/UniTag.vue'

// Props
const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	},
	tag: {
		type: Object,
		default: null
	},
	colorOptions: {
		type: Array,
		default: () => []
	},
	availableTags: {
		type: Array,
		default: () => []
	}
})

// Emits
const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

// 模板引用
const popup = ref()
const form = ref()

// 响应式数据
const loading = ref(false)

const formData = reactive({
	name: '',
	color: '#007AFF'
})

const rules = {
	name: {
		rules: [
			{ required: true, errorMessage: '请输入标签名称' },
			{ minLength: 1, maxLength: 5, errorMessage: '标签名称应为1-5个字符' }
		]
	}
}

// 计算属性
const canSave = computed(() => {
	const trimmedName = formData.name.trim()
	return trimmedName.length > 0 && formData.color && !loading.value
})

// 监听 visible 变化
watch(() => props.visible, (newVisible) => {
	if (newVisible) {
		open()
	} else {
		close()
	}
})

// 监听 tag 变化，初始化表单数据
watch(() => props.tag, (newTag) => {
	if (newTag) {
		formData.name = newTag.name || ''
		formData.color = newTag.color || '#007AFF'
	} else {
		formData.name = ''
		formData.color = '#007AFF'
	}
}, { immediate: true })

// 方法
const open = async () => {
	if (popup.value) {
		popup.value.open()
		// 确保表单获得焦点
		await nextTick()
		if (form.value) {
			form.value.clearValidate()
		}
	}
}

const close = () => {
	if (popup.value) {
		popup.value.close()
	}
}

const selectColor = (color) => {
	formData.color = color
}

const handleCancel = () => {
	if (loading.value) return
	
	// 重置表单数据
	if (props.tag) {
		formData.name = props.tag.name || ''
		formData.color = props.tag.color || '#007AFF'
	}
	
	emit('update:visible', false)
	emit('cancel')
}

const handleConfirm = async () => {
	if (loading.value || !canSave.value) return
	
	// 表单验证
	try {
		if (!form.value) {
			throw new Error('表单引用不存在')
		}
		await form.value.validate()
	} catch (errors) {
		console.log('表单验证失败:', errors)
		
		// 显示具体的验证错误
		if (Array.isArray(errors) && errors.length > 0) {
			const firstError = errors[0]
			uni.showToast({
				title: firstError.errorMessage || '表单验证失败',
				icon: 'error'
			})
		} else {
			uni.showToast({
				title: '请检查输入内容',
				icon: 'error'
			})
		}
		return
	}
	
	const trimmedName = formData.name.trim()
	
	// 数据有效性检查
	if (!trimmedName) {
		uni.showToast({
			title: '标签名称不能为空',
			icon: 'error'
		})
		return
	}
	
	if (trimmedName.length > 5) {
		uni.showToast({
			title: '标签名称不能超过5个字符',
			icon: 'error'
		})
		return
	}
	
	if (!formData.color) {
		uni.showToast({
			title: '请选择标签颜色',
			icon: 'error'
		})
		return
	}
	
	// 检查重名 (排除自己)
	const duplicateTag = props.availableTags.find(tag => 
		tag.id !== props.tag?.id && tag.name === trimmedName
	)
	
	if (duplicateTag) {
		uni.showToast({
			title: '标签名称已存在',
			icon: 'error'
		})
		return
	}
	
	loading.value = true
	
	try {
		// 检查原始标签数据
		if (!props.tag || !props.tag.id) {
			throw new Error('原始标签数据无效')
		}
		
		const updatedTag = {
			...props.tag,
			name: trimmedName,
			color: formData.color,
			updatedAt: new Date().toISOString()
		}
		
		// 通知父组件保存
		emit('confirm', updatedTag)
		
		// 注意：这里不立即关闭对话框和显示成功提示
		// 让父组件的保存操作完成后再处理
		
	} catch (error) {
		console.error('准备保存标签数据失败:', error)
		
		let errorMessage = '保存失败，请重试'
		if (error.message.includes('无效')) {
			errorMessage = '标签数据无效，请刷新页面重试'
		}
		
		uni.showToast({
			title: errorMessage,
			icon: 'error'
		})
		
		loading.value = false
	}
}

// 暴露方法给父组件
defineExpose({
	open,
	close
})
</script>

<style lang="scss" scoped>
.edit-modal {
	width: 600rpx;
	background-color: #ffffff;
	border-radius: 24rpx;
	overflow: hidden;
}

.modal-header {
	position: relative;
	padding: 40rpx 30rpx 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.modal-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #333333;
}

.close-btn {
	position: absolute;
	right: 30rpx;
	top: 50%;
	transform: translateY(-50%);
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 30rpx;
	transition: background-color 0.2s ease;
}

.close-btn:active {
	background-color: #f5f5f5;
}

.modal-content {
	padding: 30rpx;
}

/* 颜色选择器 */
.color-picker {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	gap: 20rpx;
	padding: 20rpx 0;
}

.color-item {
	width: 60rpx;
	height: 60rpx;
	border-radius: 30rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	border: 3rpx solid transparent;
	transition: all 0.3s ease;
}

.color-item.active {
	border-color: #333333;
	transform: scale(1.1);
}

.color-item:active {
	transform: scale(0.95);
}

/* 预览区域 */
.preview-section {
	margin-top: 30rpx;
	padding-top: 30rpx;
	border-top: 1rpx solid #f0f0f0;
}

.preview-label {
	font-size: 28rpx;
	color: #333333;
	margin-bottom: 16rpx;
}

// 移除旧的tag预览样式，现在使用UniTag组件

.modal-actions {
	padding: 20rpx 30rpx 30rpx;
	display: flex;
	flex-direction: row;
	gap: 20rpx;
	border-top: 1rpx solid #f0f0f0;
}

.cancel-btn {
	flex: 1;
	height: 80rpx;
	background-color: #f8f8f8;
	color: #666666;
	border-radius: 16rpx;
	font-size: 30rpx;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background-color 0.2s ease;
}

.cancel-btn:active:not(:disabled) {
	background-color: #e8e8e8;
}

.cancel-btn:disabled {
	opacity: 0.6;
}

.confirm-btn {
	flex: 1;
	height: 80rpx;
	background-color: #007AFF;
	color: #ffffff;
	border-radius: 16rpx;
	font-size: 30rpx;
	font-weight: 500;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background-color 0.2s ease;
}

.confirm-btn:active:not(:disabled) {
	background-color: #0056CC;
}

.confirm-btn:disabled {
	background-color: #cccccc;
}
</style>