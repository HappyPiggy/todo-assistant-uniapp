<template>
	<view class="tag-manage">
		<view class="header">
			<view class="title">标签管理</view>
			<view class="subtitle">为任务添加有颜色的标签</view>
		</view>

		<!-- 新建标签区域 -->
		<view class="form-section">
			<view class="section-title">新建标签</view>
			
			<uni-forms ref="form" :model="formData" :rules="rules">
				<uni-forms-item name="name" label="标签名称" required>
					<uni-easyinput 
						v-model="formData.name" 
						placeholder="请输入标签名称（5字内）"
						:clearable="true"
						:maxlength="5">
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

			<!-- 预览 -->
			<view class="preview-section" v-if="formData.name">
				<view class="preview-label">预览效果：</view>
				<view class="tag-preview" :style="{ backgroundColor: formData.color }">
					<text class="tag-preview-text">{{ formData.name }}</text>
				</view>
			</view>

			<!-- 操作按钮 -->
			<view class="form-buttons">
				<button class="create-btn" @click="createTag" :disabled="!canCreate">
					创建标签
				</button>
			</view>
		</view>

		<!-- 已有标签列表 -->
		<view class="tags-section">
			<view class="section-title">选择标签</view>
			<view class="section-subtitle">点击标签添加到任务中</view>
			
			<view v-if="availableTags.length > 0" class="tags-list">
				<view 
					v-for="tag in availableTags" 
					:key="tag.id"
					class="tag-item"
					:class="{ selected: selectedTags.includes(tag.id) }"
					:style="{ backgroundColor: tag.color }"
					@click="toggleTagSelection(tag)">
					<text class="tag-name">{{ tag.name }}</text>
					<view class="tag-actions">
						<view class="edit-btn" @click.stop="editTag(tag)">
							<uni-icons color="#ffffff" size="14" type="compose" />
						</view>
						<view class="delete-btn" @click.stop="deleteTag(tag)">
							<uni-icons color="#ffffff" size="14" type="trash" />
						</view>
					</view>
				</view>
			</view>
			<view v-else class="empty-tags">
				<text class="empty-text">暂无标签，请先创建</text>
			</view>
		</view>

		<!-- 底部按钮 -->
		<view class="bottom-actions">
			<button class="cancel-btn" @click="cancel">取消</button>
			<button class="confirm-btn" @click="confirmSelection" :disabled="selectedTags.length === 0">
				确定 ({{ selectedTags.length }})
			</button>
		</view>

		<!-- 编辑标签弹窗 -->
		<uni-popup ref="editPopup" type="dialog">
			<uni-popup-dialog 
				ref="editDialog"
				title="编辑标签"
				:placeholder="editingTag.name"
				:value="editTagName"
				@confirm="saveEditTag"
				@close="closeEditDialog">
			</uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				taskId: '',
				bookId: '',
				currentTags: [], // 当前任务已有的标签
				formData: {
					name: '',
					color: '#007AFF'
				},
				selectedTags: [], // 选中要添加的标签ID
				availableTags: [], // 可用标签列表
				editingTag: {},
				editTagName: '',
				colorOptions: [
					{ name: '蓝色', value: '#007AFF' },
					{ name: '绿色', value: '#28a745' },
					{ name: '红色', value: '#dc3545' },
					{ name: '橙色', value: '#fd7e14' },
					{ name: '紫色', value: '#6f42c1' },
					{ name: '青色', value: '#17a2b8' },
					{ name: '粉色', value: '#e83e8c' },
					{ name: '黄色', value: '#ffc107' },
					{ name: '深绿', value: '#198754' },
					{ name: '深蓝', value: '#0d6efd' },
					{ name: '深紫', value: '#8031a8' },
					{ name: '深灰', value: '#6c757d' }
				],
				rules: {
					name: {
						rules: [
							{ required: true, errorMessage: '请输入标签名称' },
							{ minLength: 1, maxLength: 5, errorMessage: '标签名称应为1-5个字符' }
						]
					}
				}
			}
		},
		computed: {
			canCreate() {
				return this.formData.name.trim().length > 0 && this.formData.color
			}
		},
		onLoad(options) {
			if (options.taskId) {
				this.taskId = options.taskId
			}
			if (options.bookId) {
				this.bookId = options.bookId
			}
			if (options.currentTags) {
				try {
					this.currentTags = JSON.parse(decodeURIComponent(options.currentTags))
				} catch (error) {
					console.error('解析当前标签失败:', error)
					this.currentTags = []
				}
			}
			
			this.loadAvailableTags()
		},
		methods: {
			async loadAvailableTags() {
				try {
					// 从本地存储加载标签
					const storedTags = uni.getStorageSync(`user_tags_${this.getCurrentUserId()}`) || []
					this.availableTags = storedTags
					
					// 初始化选中状态（当前任务已有的标签）
					this.selectedTags = this.currentTags.map(tag => {
						if (typeof tag === 'string') {
							// 处理旧格式的字符串标签
							const existingTag = this.availableTags.find(t => t.name === tag)
							return existingTag ? existingTag.id : null
						} else {
							// 新格式的标签对象
							return tag.id
						}
					}).filter(id => id !== null)
					
				} catch (error) {
					console.error('加载标签失败:', error)
					this.availableTags = []
				}
			},

			getCurrentUserId() {
				// 获取当前用户ID，这里使用简单的方法
				// 实际项目中应该从store或其他地方获取
				return 'current_user' // 临时方案
			},

			selectColor(color) {
				this.formData.color = color
			},

			async createTag() {
				try {
					await this.$refs.form.validate()
				} catch (errors) {
					console.log('表单验证失败:', errors)
					return
				}

				const newTag = {
					id: Date.now().toString(), // 简单的ID生成
					name: this.formData.name.trim(),
					color: this.formData.color,
					createdAt: new Date().toISOString()
				}

				// 检查是否重名
				if (this.availableTags.some(tag => tag.name === newTag.name)) {
					uni.showToast({
						title: '标签名称已存在',
						icon: 'error'
					})
					return
				}

				// 添加到列表
				this.availableTags.push(newTag)
				
				// 保存到本地存储
				try {
					uni.setStorageSync(`user_tags_${this.getCurrentUserId()}`, this.availableTags)
					
					// 清空表单
					this.formData.name = ''
					this.formData.color = '#007AFF'
					
					uni.showToast({
						title: '标签创建成功',
						icon: 'success'
					})
				} catch (error) {
					console.error('保存标签失败:', error)
					uni.showToast({
						title: '保存失败',
						icon: 'error'
					})
				}
			},

			toggleTagSelection(tag) {
				const index = this.selectedTags.indexOf(tag.id)
				if (index > -1) {
					this.selectedTags.splice(index, 1)
				} else {
					this.selectedTags.push(tag.id)
				}
			},

			editTag(tag) {
				this.editingTag = tag
				this.editTagName = tag.name
				this.$refs.editPopup.open()
			},

			async saveEditTag(newName) {
				const trimmedName = newName.trim()
				if (!trimmedName || trimmedName.length > 5) {
					uni.showToast({
						title: '标签名称格式错误',
						icon: 'error'
					})
					return
				}

				// 检查重名
				if (this.availableTags.some(tag => tag.id !== this.editingTag.id && tag.name === trimmedName)) {
					uni.showToast({
						title: '标签名称已存在',
						icon: 'error'
					})
					return
				}

				// 更新标签
				const tagIndex = this.availableTags.findIndex(tag => tag.id === this.editingTag.id)
				if (tagIndex > -1) {
					this.availableTags[tagIndex].name = trimmedName
					
					// 保存到本地存储
					uni.setStorageSync(`user_tags_${this.getCurrentUserId()}`, this.availableTags)
					
					uni.showToast({
						title: '修改成功',
						icon: 'success'
					})
				}
				
				this.closeEditDialog()
			},

			deleteTag(tag) {
				uni.showModal({
					title: '确认删除',
					content: `确定要删除标签"${tag.name}"吗？`,
					success: (res) => {
						if (res.confirm) {
							// 从列表中移除
							const index = this.availableTags.findIndex(t => t.id === tag.id)
							if (index > -1) {
								this.availableTags.splice(index, 1)
								
								// 从选中列表中移除
								const selectedIndex = this.selectedTags.indexOf(tag.id)
								if (selectedIndex > -1) {
									this.selectedTags.splice(selectedIndex, 1)
								}
								
								// 保存到本地存储
								uni.setStorageSync(`user_tags_${this.getCurrentUserId()}`, this.availableTags)
								
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
							}
						}
					}
				})
			},

			closeEditDialog() {
				this.$refs.editPopup.close()
				this.editingTag = {}
				this.editTagName = ''
			},

			confirmSelection() {
				if (this.selectedTags.length === 0) {
					uni.showToast({
						title: '请选择标签',
						icon: 'error'
					})
					return
				}

				// 构造选中的标签数据
				const selectedTagData = this.selectedTags.map(tagId => {
					const tag = this.availableTags.find(t => t.id === tagId)
					return {
						id: tag.id,
						name: tag.name,
						color: tag.color
					}
				})

				// 返回数据给上一页
				const pages = getCurrentPages()
				const prevPage = pages[pages.length - 2]
				if (prevPage) {
					prevPage.$vm.updateTaskTags(selectedTagData)
				}

				uni.navigateBack()
			},

			cancel() {
				uni.navigateBack()
			}
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

	.tag-manage {
		flex: 1;
		background-color: #f5f5f5;
		min-height: 100vh;
		padding-bottom: 140rpx;
	}

	.header {
		background-color: #ffffff;
		padding: 40rpx 30rpx 30rpx;
		text-align: center;
		margin-bottom: 20rpx;
	}

	.title {
		font-size: 36rpx;
		color: #333333;
		font-weight: 600;
		margin-bottom: 12rpx;
	}

	.subtitle {
		font-size: 26rpx;
		color: #666666;
	}

	/* 表单区域 */
	.form-section {
		background-color: #ffffff;
		margin-bottom: 20rpx;
		padding: 30rpx;
	}

	.section-title {
		font-size: 32rpx;
		color: #333333;
		font-weight: 500;
		margin-bottom: 20rpx;
	}

	.section-subtitle {
		font-size: 26rpx;
		color: #666666;
		margin-bottom: 20rpx;
	}

	/* 颜色选择器 */
	.color-picker {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 20rpx;
		padding: 20rpx 0;
	}

	.color-item {
		width: 60rpx;
		height: 60rpx;
		border-radius: 30rpx;
		justify-content: center;
		align-items: center;
		border: 3rpx solid transparent;
		transition: all 0.3s ease;
	}

	.color-item.active {
		border-color: #333333;
		transform: scale(1.1);
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

	.tag-preview {
		align-self: flex-start;
		padding: 12rpx 20rpx;
		border-radius: 20rpx;
	}

	.tag-preview-text {
		font-size: 26rpx;
		color: #ffffff;
		font-weight: 500;
	}

	/* 按钮 */
	.form-buttons {
		margin-top: 30rpx;
	}

	.create-btn {
		width: 100%;
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

	.create-btn:disabled {
		background-color: #cccccc;
	}

	.create-btn:active:not(:disabled) {
		background-color: #0056CC;
	}

	/* 标签列表区域 */
	.tags-section {
		background-color: #ffffff;
		padding: 30rpx;
		margin-bottom: 20rpx;
	}

	.tags-list {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	.tag-item {
		flex-direction: row;
		align-items: center;
		padding: 12rpx 16rpx;
		border-radius: 20rpx;
		position: relative;
		min-height: 56rpx;
		border: 2rpx solid transparent;
	}

	.tag-item.selected {
		border-color: #333333;
	}

	.tag-name {
		font-size: 26rpx;
		color: #ffffff;
		font-weight: 500;
		margin-right: 8rpx;
		flex: 1;
	}

	.tag-actions {
		flex-direction: row;
		gap: 8rpx;
	}

	.edit-btn,
	.delete-btn {
		width: 28rpx;
		height: 28rpx;
		justify-content: center;
		align-items: center;
		border-radius: 14rpx;
		background-color: rgba(0, 0, 0, 0.2);
	}

	.empty-tags {
		padding: 60rpx 20rpx;
		align-items: center;
		justify-content: center;
	}

	.empty-text {
		font-size: 26rpx;
		color: #999999;
	}

	/* 底部按钮 */
	.bottom-actions {
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

	.confirm-btn {
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

	.confirm-btn:disabled {
		background-color: #cccccc;
	}

	.confirm-btn:active:not(:disabled) {
		background-color: #0056CC;
	}

	/* 安全区域适配 */
	/* #ifndef APP-NVUE */
	.bottom-actions {
		padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
	}
	/* #endif */
</style>