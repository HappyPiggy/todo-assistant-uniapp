<template>
	<view class="create-todobook">
		<uni-forms ref="form" :model="formData" :rules="rules" label-position="top">
			<!-- 基本信息 -->
			<view class="form-section">
				<view class="section-header">
					<text class="section-title">基本信息</text>
				</view>

				<uni-forms-item name="title" label="项目册名称" required>
					<uni-easyinput 
						v-model="formData.title" 
						placeholder="请输入项目册名称"
						:clearable="true"
						:maxlength="100">
					</uni-easyinput>
				</uni-forms-item>

				<uni-forms-item name="description" label="项目描述">
					<uni-easyinput 
						v-model="formData.description" 
						type="textarea"
						placeholder="描述项目册的内容和目标（可选）"
						:maxlength="500"
						:clearable="true">
					</uni-easyinput>
				</uni-forms-item>
			</view>

			<!-- 外观设置 -->
			<view class="form-section">
				<view class="section-header">
					<text class="section-title">外观设置</text>
				</view>

				<uni-forms-item name="color" label="主题颜色">
					<view class="color-picker">
						<view 
							v-for="color in colorOptions" 
							:key="color.value"
							class="color-item"
							:class="{ active: formData.color === color.value }"
							:style="{ backgroundColor: color.value }"
							@click="selectColor(color.value)">
							<uni-icons v-if="formData.color === color.value" color="#ffffff" size="16" type="checkmarkempty" />
						</view>
					</view>
				</uni-forms-item>

				<uni-forms-item name="icon" label="项目图标">
					<view class="icon-picker">
						<view 
							v-for="icon in iconOptions" 
							:key="icon.value"
							class="icon-item"
							:class="{ active: formData.icon === icon.value }"
							@click="selectIcon(icon.value)">
							<view class="icon-preview" :style="{ backgroundColor: formData.color }">
								<uni-icons color="#ffffff" size="20" :type="icon.value" />
							</view>
							<text class="icon-name">{{ icon.name }}</text>
						</view>
					</view>
				</uni-forms-item>
			</view>

			<!-- 共享设置 -->
			<view class="form-section">
				<view class="section-header">
					<text class="section-title">共享设置</text>
				</view>

				<uni-forms-item name="shareType" label="共享类型">
					<uni-data-picker 
						v-model="formData.shareType" 
						:localdata="shareOptions"
						placeholder="选择共享类型">
					</uni-data-picker>
				</uni-forms-item>

				<view v-if="formData.shareType !== 'private'" class="share-notice">
					<uni-icons color="#ff9500" size="16" type="info" />
					<text class="notice-text">共享项目册的成员可以查看和编辑其中的任务</text>
				</view>
			</view>
		</uni-forms>

		<!-- 预览区域 -->
		<view class="preview-section">
			<view class="section-header">
				<text class="section-title">预览效果</text>
			</view>
			<view class="preview-card">
				<view class="card-header">
					<view class="book-icon" :style="{ backgroundColor: formData.color }">
						<uni-icons color="#ffffff" size="24" :type="formData.icon" />
					</view>
					<view class="book-info">
						<text class="book-title">{{ formData.title || '项目册名称' }}</text>
						<text class="book-description">{{ formData.description || '项目描述' }}</text>
					</view>
				</view>
				<view class="card-stats">
					<view class="stat-item">
						<text class="stat-number">0</text>
						<text class="stat-label">总任务</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">0</text>
						<text class="stat-label">已完成</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">1</text>
						<text class="stat-label">成员</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">0%</text>
						<text class="stat-label">进度</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部按钮 -->
		<view class="button-section">
			<button class="cancel-btn" @click="cancel">取消</button>
			<button class="create-btn" @click="createTodoBook" :loading="creating">
				{{ creating ? '创建中...' : '创建项目册' }}
			</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				creating: false,
				formData: {
					title: '',
					description: '',
					color: '#007AFF',
					icon: 'folder',
					shareType: 'private'
				},
				rules: {
					title: {
						rules: [
							{ required: true, errorMessage: '请输入项目册名称' },
							{ minLength: 1, maxLength: 100, errorMessage: '名称长度应为1-100个字符' }
						]
					}
				},
				colorOptions: [
					{ value: '#007AFF', name: '蓝色' },
					{ value: '#28a745', name: '绿色' },
					{ value: '#ff9500', name: '橙色' },
					{ value: '#FF3B30', name: '红色' },
					{ value: '#AF52DE', name: '紫色' },
					{ value: '#FF9500', name: '黄色' },
					{ value: '#5AC8FA', name: '青色' },
					{ value: '#FF2D92', name: '粉色' }
				],
				iconOptions: [
					{ value: 'folder', name: '文件夹' },
					{ value: 'star', name: '星标' },
					{ value: 'heart', name: '爱心' },
					{ value: 'fire', name: '火焰' },
					{ value: 'home', name: '房子' },
					{ value: 'gear', name: '设置' },
					{ value: 'location', name: '位置' },
					{ value: 'calendar', name: '日历' },
					{ value: 'camera', name: '相机' },
					{ value: 'cart', name: '购物车' },
					{ value: 'email', name: '邮件' },
					{ value: 'phone', name: '电话' }
				],
				shareOptions: [
					{ value: 'private', text: '私有项目册' },
					{ value: 'public', text: '公开项目册' },
					{ value: 'member', text: '成员项目册' }
				]
			}
		},
		methods: {
			selectColor(color) {
				this.formData.color = color
			},

			selectIcon(icon) {
				this.formData.icon = icon
			},

			async createTodoBook() {
				try {
					await this.$refs.form.validate()
				} catch (errors) {
					console.log('表单验证失败:', errors)
					return
				}

				this.creating = true

				try {
					const todoBookCo = uniCloud.importObject('todobook-co')
					
					const bookData = {
						title: this.formData.title.trim(),
						description: this.formData.description.trim(),
						color: this.formData.color,
						icon: this.formData.icon,
						is_shared: this.formData.shareType !== 'private',
						share_type: this.formData.shareType
					}

					const result = await todoBookCo.createTodoBook(bookData)

					if (result.code === 0) {
						uni.showToast({
							title: '创建成功',
							icon: 'success'
						})

						setTimeout(() => {
							uni.navigateBack()
						}, 1500)
					} else {
						throw new Error(result.message || '创建失败')
					}
				} catch (error) {
					console.error('创建项目册失败:', error)
					uni.showToast({
						title: error.message || '创建失败',
						icon: 'error'
					})
				} finally {
					this.creating = false
				}
			},

			cancel() {
				if (this.hasChanges()) {
					uni.showModal({
						title: '确认取消',
						content: '确定要取消创建项目册吗？已输入的内容将丢失。',
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
					   this.formData.color !== '#007AFF' ||
					   this.formData.icon !== 'folder'
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

	.create-todobook {
		flex: 1;
		background-color: #f5f5f5;
		min-height: 100vh;
		padding-bottom: 140rpx;
	}

	/* 表单区域 */
	.form-section,
	.preview-section {
		background-color: #ffffff;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 30rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	}

	.section-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
		margin-bottom: 30rpx;
	}

	.section-title {
		font-size: 32rpx;
		color: #333333;
		font-weight: 500;
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

	.form-section ::v-deep .uni-data-picker {
		border: 1rpx solid #e5e5e5;
		border-radius: 12rpx;
		background-color: #fafafa;
	}

	.form-section ::v-deep .uni-data-picker__input-text {
		padding: 20rpx 24rpx;
		font-size: 28rpx;
		color: #333333;
	}
	/* #endif */

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
	}

	.color-item.active {
		border-color: #333333;
	}

	/* 图标选择器 */
	.icon-picker {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 20rpx;
		padding: 20rpx 0;
	}

	.icon-item {
		align-items: center;
		width: 120rpx;
	}

	.icon-preview {
		width: 60rpx;
		height: 60rpx;
		border-radius: 12rpx;
		justify-content: center;
		align-items: center;
		margin-bottom: 8rpx;
		border: 2rpx solid transparent;
	}

	.icon-item.active .icon-preview {
		border-color: #333333;
	}

	.icon-name {
		font-size: 24rpx;
		color: #666666;
		text-align: center;
	}

	/* 共享提示 */
	.share-notice {
		flex-direction: row;
		align-items: center;
		background-color: #fff3e0;
		padding: 20rpx;
		border-radius: 12rpx;
		margin-top: 20rpx;
	}

	.notice-text {
		font-size: 26rpx;
		color: #ff9500;
		margin-left: 12rpx;
		flex: 1;
		line-height: 1.4;
	}

	/* 预览卡片 */
	.preview-card {
		background-color: #f8f9fa;
		border-radius: 16rpx;
		padding: 30rpx;
	}

	.card-header {
		flex-direction: row;
		align-items: center;
		margin-bottom: 24rpx;
	}

	.book-icon {
		width: 60rpx;
		height: 60rpx;
		border-radius: 12rpx;
		justify-content: center;
		align-items: center;
		margin-right: 20rpx;
	}

	.book-info {
		flex: 1;
	}

	.book-title {
		font-size: 32rpx;
		color: #333333;
		font-weight: 500;
		margin-bottom: 8rpx;
	}

	.book-description {
		font-size: 26rpx;
		color: #666666;
	}

	.card-stats {
		flex-direction: row;
		justify-content: space-between;
	}

	.stat-item {
		align-items: center;
	}

	.stat-number {
		font-size: 28rpx;
		color: #333333;
		font-weight: 600;
		margin-bottom: 4rpx;
	}

	.stat-label {
		font-size: 22rpx;
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