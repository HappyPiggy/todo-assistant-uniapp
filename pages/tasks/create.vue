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
					<view class="add-tag-btn" @click="showAddTag">
						<uni-icons color="#007AFF" size="18" type="plus" />
						<text class="add-tag-text">添加</text>
					</view>
				</view>

				<view class="tags-container" v-if="formData.tags.length > 0">
					<view 
						v-for="(tag, index) in formData.tags" 
						:key="index"
						class="tag-item">
						<text class="tag-text">{{ tag }}</text>
						<view class="remove-tag" @click="removeTag(index)">
							<uni-icons color="#999999" size="14" type="clear" />
						</view>
					</view>
				</view>
				<view v-else class="empty-tags">
					<text class="empty-text">暂无标签，点击右上角添加</text>
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

<script>
	export default {
		data() {
			return {
				bookId: '',
				creating: false,
				newTag: '',
				availableParents: [],
				formData: {
					title: '',
					description: '',
					priority: 'medium',
					due_date: null,
					estimated_hours: '',
					tags: [],
					parent_id: null
				},
				rules: {
					title: {
						rules: [
							{ required: true, errorMessage: '请输入任务标题' },
							{ minLength: 1, maxLength: 200, errorMessage: '标题长度应为1-200个字符' }
						]
					}
				},
				priorityOptions: [
					{ value: 'low', text: '低优先级' },
					{ value: 'medium', text: '中优先级' },
					{ value: 'high', text: '高优先级' },
					{ value: 'urgent', text: '紧急' }
				]
			}
		},
		onLoad(options) {
			if (!options.bookId) {
				uni.showToast({
					title: '缺少项目册ID',
					icon: 'error'
				})
				uni.navigateBack()
				return
			}
			this.bookId = options.bookId
			
			// 如果传入了父任务ID，设置默认值
			if (options.parentId) {
				this.formData.parent_id = options.parentId
			}
			
			this.loadParentTasks()
		},
		methods: {
			// 加载父任务数据
			async loadParentTasks() {
				if (!this.bookId || typeof this.bookId !== 'string') {
					console.warn("bookId is empty, undefined or not string:", this.bookId)
					return
				}
				
				try {
					// 使用云对象获取可用的父任务
					const todoBooksObj = uniCloud.importObject('todobook-co')
					const result = await todoBooksObj.getTodoBookDetail(this.bookId)
					
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
						
						this.availableParents = availableTasks.map(task => ({
							value: task._id,
							text: task.title
						}))
					}
				} catch (error) {
					console.error('加载父任务失败:', error)
				}
			},

			async createTask() {
				try {
					await this.$refs.form.validate()
				} catch (errors) {
					console.log('表单验证失败:', errors)
					return
				}

				// 准备任务数据
				const taskData = {
					todobook_id: this.bookId,
					title: this.formData.title.trim(),
					description: this.formData.description.trim(),
					priority: this.formData.priority,
					parent_id: this.formData.parent_id || null,
					due_date: this.formData.due_date,
					tags: this.formData.tags || []
				}

				// 添加预估工时
				if (this.formData.estimated_hours) {
					taskData.estimated_hours = parseFloat(this.formData.estimated_hours)
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
				this.createTaskAsync(taskData)
			},

			async createTaskAsync(taskData) {
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
			},
			
			onTaskCreated(result) {
				// 任务创建成功事件处理
				this.creating = false
				
				if (result.code === 0) {
					uni.showToast({
						title: '创建成功',
						icon: 'success'
					})

					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} else {
					this.onCreateError({ message: result.message || '创建失败' })
				}
			},
			
			onCreateError(e) {
				// 任务创建失败事件处理
				this.creating = false
				console.error('创建任务失败:', e)
				uni.showToast({
					title: e.message || '创建失败',
					icon: 'error'
				})
			},

			cancel() {
				if (this.hasChanges()) {
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
			},

			hasChanges() {
				return this.formData.title.trim() || 
					   this.formData.description.trim() ||
					   this.formData.tags.length > 0
			},

			showAddTag() {
				this.newTag = ''
				this.$refs.tagPopup.open()
			},

			addTag(value) {
				const tag = value.trim()
				if (tag && !this.formData.tags.includes(tag)) {
					this.formData.tags.push(tag)
				}
				this.closeTagDialog()
			},

			removeTag(index) {
				this.formData.tags.splice(index, 1)
			},

			closeTagDialog() {
				this.$refs.tagPopup.close()
				this.newTag = ''
			},
			
		}
	}
</script>

<style lang="scss" scoped>
	/* #ifndef APP-NVUE */
	view {
		display: flex;
		box-sizing: border-box;
		flex-direction: column;
	}

	page {
		background-color: #f5f5f5;
	}
	/* #endif*/

	.create-task {
		flex: 1;
		background-color: #f5f5f5;
		min-height: 100vh;
		padding-bottom: 140rpx;
	}

	/* 表单区域 */
	.form-section {
		background-color: #ffffff;
		margin-bottom: 20rpx;
		padding: 0 20rpx 20rpx;
	}

	.section-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx 0 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
		margin-bottom: 20rpx;
	}

	.section-title {
		font-size: 32rpx;
		color: #333333;
		font-weight: 500;
	}

	.add-tag-btn {
		flex-direction: row;
		align-items: center;
		background-color: #f0f6ff;
		padding: 12rpx 20rpx;
		border-radius: 20rpx;
	}

	.add-tag-btn:active {
		background-color: #e6f3ff;
	}

	.add-tag-text {
		font-size: 26rpx;
		color: #007AFF;
		margin-left: 6rpx;
	}

	/* 表单项样式 */
	/* #ifndef APP-NVUE */
	.form-section ::v-deep .uni-forms-item {
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.form-section ::v-deep .uni-forms-item:last-child {
		border-bottom: none;
	}

	.form-section ::v-deep .uni-forms-item__label {
		font-size: 30rpx;
		color: #333333;
		font-weight: 500;
		margin-bottom: 16rpx;
	}

	.form-section ::v-deep .uni-easyinput__content {
		border: 1rpx solid #e5e5e5;
		border-radius: 12rpx;
		background-color: #fafafa;
	}

	.form-section ::v-deep .uni-easyinput__content-input {
		padding: 20rpx 24rpx;
		font-size: 28rpx;
		color: #333333;
	}

	.form-section ::v-deep .uni-easyinput__content-textarea {
		padding: 20rpx 24rpx;
		font-size: 28rpx;
		color: #333333;
		min-height: 200rpx;
	}

	.form-section ::v-deep .uni-data-picker,
	.form-section ::v-deep .uni-datetime-picker {
		border: 1rpx solid #e5e5e5;
		border-radius: 12rpx;
		background-color: #fafafa;
	}

	.form-section ::v-deep .uni-data-picker__input-text,
	.form-section ::v-deep .uni-datetime-picker__input-text {
		padding: 20rpx 24rpx;
		font-size: 28rpx;
		color: #333333;
	}
	/* #endif */

	/* 标签容器 */
	.tags-container {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 16rpx;
		padding: 20rpx 0;
	}

	.tag-item {
		flex-direction: row;
		align-items: center;
		background-color: #f0f6ff;
		padding: 12rpx 16rpx;
		border-radius: 20rpx;
		border: 1rpx solid #e6f3ff;
	}

	.tag-text {
		font-size: 26rpx;
		color: #007AFF;
		margin-right: 8rpx;
	}

	.remove-tag {
		width: 24rpx;
		height: 24rpx;
		justify-content: center;
		align-items: center;
	}

	.empty-tags {
		padding: 40rpx 20rpx;
		align-items: center;
		justify-content: center;
	}

	.empty-text {
		font-size: 26rpx;
		color: #999999;
	}

	/* 底部按钮 */
	.button-section {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #ffffff;
		padding: 30rpx;
		flex-direction: row;
		gap: 20rpx;
		/* #ifndef APP-NVUE */
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
		/* #endif */
	}

	.cancel-btn {
		flex: 1;
		height: 88rpx;
		background-color: #f8f8f8;
		color: #666666;
		border-radius: 16rpx;
		font-size: 32rpx;
		border: none;
		/* #ifndef APP-NVUE */
		display: flex;
		align-items: center;
		justify-content: center;
		/* #endif */
	}

	.cancel-btn:active {
		background-color: #e8e8e8;
	}

	.create-btn {
		flex: 2;
		height: 88rpx;
		background-color: #007AFF;
		color: #ffffff;
		border-radius: 16rpx;
		font-size: 32rpx;
		font-weight: 500;
		border: none;
		/* #ifndef APP-NVUE */
		display: flex;
		align-items: center;
		justify-content: center;
		/* #endif */
	}

	.create-btn:active {
		background-color: #0056CC;
	}

	.create-btn[loading] {
		background-color: #cccccc;
	}

	/* 安全区域适配 */
	/* #ifndef APP-NVUE */
	.button-section {
		padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
	}
	/* #endif */
</style>