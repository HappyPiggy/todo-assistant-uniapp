<template>
	<uni-popup ref="popup" type="center" :mask-click="false">
		<view class="delete-confirm-modal">
			<view class="modal-header">
				<view class="warning-icon">
					<uni-icons type="info-filled" size="48" color="#ff6b35" />
				</view>
				<view class="modal-title">删除标签</view>
			</view>

			<view class="modal-content">
				<view class="tag-info" v-if="tag">
					<UniTag 
						:text="tag.name"
						:color="tag.color"
						size="medium" />
				</view>

				<view class="warning-content">
					<view v-if="dependencyCount === 0" class="no-dependency">
						<text class="warning-text">确定要删除此标签吗？</text>
						<text class="sub-text">此操作不可撤销</text>
					</view>
					
					<view v-else class="has-dependency">
						<text class="warning-text">仍然有依赖任务 {{ dependencyCount }} 个，是否删除？</text>
						<text class="sub-text">删除后，所有任务中的此标签都将被移除</text>
						
						<view class="dependency-details" v-if="dependencyTasks && dependencyTasks.length > 0">
							<view class="details-title">受影响的任务：</view>
							<view class="task-list">
								<view 
									v-for="(taskTitle, index) in displayTasks" 
									:key="index"
									class="task-item">
									<text class="task-title">{{ taskTitle }}</text>
								</view>
								<view v-if="dependencyTasks.length > maxDisplayTasks" class="more-tasks">
									<text class="more-text">还有 {{ dependencyTasks.length - maxDisplayTasks }} 个任务...</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>

			<view class="modal-actions">
				<button class="cancel-btn" @click="handleCancel" :disabled="loading">
					取消
				</button>
				<button 
					class="confirm-btn" 
					:class="{ danger: dependencyCount > 0 }"
					@click="handleConfirm" 
					:disabled="loading">
					<text v-if="loading">删除中...</text>
					<text v-else>{{ dependencyCount > 0 ? '强制删除' : '删除' }}</text>
				</button>
			</view>
		</view>
	</uni-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
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
	dependencyCount: {
		type: Number,
		default: 0
	},
	dependencyTasks: {
		type: Array,
		default: () => []
	}
})

// Emits
const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

// 模板引用
const popup = ref()

// 响应式数据
const loading = ref(false)
const maxDisplayTasks = 3 // 最多显示的任务数量

// 计算属性
const displayTasks = computed(() => {
	if (!props.dependencyTasks || props.dependencyTasks.length === 0) {
		return []
	}
	return props.dependencyTasks.slice(0, maxDisplayTasks)
})

// 监听 visible 变化
watch(() => props.visible, (newVisible) => {
	if (newVisible) {
		open()
	} else {
		close()
	}
})

// 方法
const open = () => {
	if (popup.value) {
		popup.value.open()
	}
}

const close = () => {
	if (popup.value) {
		popup.value.close()
	}
}

const handleCancel = () => {
	if (loading.value) return
	
	emit('update:visible', false)
	emit('cancel')
}

const handleConfirm = async () => {
	if (loading.value) return
	
	loading.value = true
	
	try {
		emit('confirm', props.tag?.id)
		emit('update:visible', false)
	} catch (error) {
		console.error('删除标签失败:', error)
		uni.showToast({
			title: '删除失败，请重试',
			icon: 'error'
		})
	} finally {
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
.delete-confirm-modal {
	width: 600rpx;
	background-color: #ffffff;
	border-radius: 24rpx;
	overflow: hidden;
}

.modal-header {
	padding: 40rpx 30rpx 20rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	border-bottom: 1rpx solid #f0f0f0;
}

.warning-icon {
	margin-bottom: 20rpx;
}

.modal-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #333333;
}

.modal-content {
	padding: 30rpx;
}

.tag-info {
	display: flex;
	justify-content: center;
	margin-bottom: 30rpx;
}

// 移除旧的tag显示样式，现在使用UniTag组件

.warning-content {
	text-align: center;
}

.no-dependency .warning-text {
	font-size: 32rpx;
	color: #333333;
	margin-bottom: 12rpx;
	display: block;
}

.has-dependency .warning-text {
	font-size: 32rpx;
	color: #ff6b35;
	margin-bottom: 12rpx;
	display: block;
	font-weight: 500;
}

.sub-text {
	font-size: 28rpx;
	color: #666666;
	display: block;
	line-height: 1.4;
}

.dependency-details {
	margin-top: 30rpx;
	padding: 24rpx;
	background-color: #fff5f0;
	border-radius: 16rpx;
	border: 1rpx solid #ffcfb8;
}

.details-title {
	font-size: 28rpx;
	color: #ff6b35;
	font-weight: 500;
	margin-bottom: 16rpx;
	text-align: left;
}

.task-list {
	text-align: left;
}

.task-item {
	padding: 8rpx 0;
	border-bottom: 1rpx solid #ffe8d6;
}

.task-item:last-child {
	border-bottom: none;
}

.task-title {
	font-size: 26rpx;
	color: #333333;
	line-height: 1.4;
}

.more-tasks {
	padding: 12rpx 0 4rpx;
}

.more-text {
	font-size: 24rpx;
	color: #999999;
	font-style: italic;
}

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

.confirm-btn.danger {
	background-color: #ff6b35;
}

.confirm-btn:active:not(:disabled) {
	background-color: #0056CC;
}

.confirm-btn.danger:active:not(:disabled) {
	background-color: #e55a2b;
}

.confirm-btn:disabled {
	background-color: #cccccc;
}
</style>