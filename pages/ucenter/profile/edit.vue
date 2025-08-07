<template>
	<view class="edit-profile">
		<uni-forms ref="form" :model="formData" :rules="rules" label-position="top">
			<!-- 头像选择区域 -->
			<view class="avatar-section">
				<view class="current-avatar-wrapper" @click="showAvatarPicker">
					<image 
						v-if="formData.avatar" 
						:src="formData.avatar" 
						class="avatar-preview">
					</image>
					<view v-else class="default-avatar">
						<text v-if="formData.nickname" class="avatar-text">
							{{ formData.nickname.charAt(0).toUpperCase() }}
						</text>
						<uni-icons v-else color="#cccccc" size="60" type="person-filled" />
					</view>
					<view class="avatar-mask">
						<uni-icons color="#ffffff" size="24" type="camera" />
						<text class="avatar-tip">更换头像</text>
					</view>
				</view>
			</view>

			<!-- 头像选择弹窗 -->
			<uni-popup ref="avatarPopup" type="bottom">
				<view class="avatar-picker">
					<view class="picker-header">
						<text class="picker-title">选择头像</text>
						<view class="close-btn" @click="closeAvatarPicker">
							<uni-icons type="close" size="20" color="#666"></uni-icons>
						</view>
					</view>
					<view class="avatar-grid">
						<view 
							v-for="(avatar, index) in defaultAvatars" 
							:key="index"
							class="avatar-item"
							:class="{ 'selected': formData.avatar === avatar.url }"
							@click="selectAvatar(avatar)">
							<image :src="avatar.url" class="avatar-thumbnail"></image>
							<view v-if="formData.avatar === avatar.url" class="selected-mark">
								<uni-icons type="checkmarkempty" size="16" color="#ffffff"></uni-icons>
							</view>
						</view>
					</view>
				</view>
			</uni-popup>

			<!-- 基本信息表单 -->
			<view class="form-section">
				<!-- 用户ID显示 -->
				<view class="user-id-item" v-if="userInfo">
					<text class="user-id-label">用户ID</text>
					<text class="user-id-value">{{ userInfo._id }}</text>
				</view>
				
				<uni-forms-item name="nickname" label="昵称">
					<uni-easyinput 
						v-model="formData.nickname" 
						placeholder="请输入昵称"
						:clearable="true"
						:maxlength="20">
					</uni-easyinput>
				</uni-forms-item>

				<!-- #ifndef MP-WEIXIN -->
				<uni-forms-item name="gender" label="性别">
					<uni-data-picker 
						v-model="formData.gender" 
						:localdata="genderOptions"
						placeholder="请选择性别">
					</uni-data-picker>
				</uni-forms-item>

				<uni-forms-item name="description" label="个人简介">
					<uni-easyinput 
						v-model="formData.description" 
						type="textarea"
						placeholder="写点什么介绍一下自己吧"
						:maxlength="200"
						:clearable="true">
					</uni-easyinput>
				</uni-forms-item>
				<!-- #endif -->
			</view>
		</uni-forms>

		<!-- 底部按钮 -->
		<view class="button-section">
			<button class="save-btn" @click="saveProfile" :loading="saving">
				{{ saving ? '保存中...' : '保存' }}
			</button>
		</view>
	</view>
</template>

<script>
	import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'
	
	export default {
		data() {
			return {
				saving: false,
				formData: {
					nickname: '',
					// #ifndef MP-WEIXIN
					gender: 0,
					mobile: '',
					email: '',
					description: '',
					// #endif
					avatar: ''
				},
				defaultAvatars: [
					{ url: '/static/avatar/avatar1.svg', name: '红色头像' },
					{ url: '/static/avatar/avatar2.svg', name: '青色头像' },
					{ url: '/static/avatar/avatar3.svg', name: '蓝色头像' },
					{ url: '/static/avatar/avatar4.svg', name: '绿色头像' },
					{ url: '/static/avatar/avatar5.svg', name: '黄色头像' },
					{ url: '/static/avatar/avatar6.svg', name: '紫色头像' },
					{ url: '/static/avatar/avatar7.svg', name: '粉色头像' },
					{ url: '/static/avatar/avatar8.svg', name: '橙色头像' }
				],
				rules: {
					nickname: {
						rules: [
							{ required: true, errorMessage: '请输入昵称' },
							{ minLength: 2, maxLength: 20, errorMessage: '昵称长度应为2-20个字符' }
						]
					},
					// #ifndef MP-WEIXIN
					email: {
						rules: [
							{ format: 'email', errorMessage: '邮箱格式不正确' }
						]
					}
					// #endif
				},
				genderOptions: [
					{ value: 0, text: '保密' },
					{ value: 1, text: '男' },
					{ value: 2, text: '女' }
				]
			}
		},
		computed: {
			userInfo() {
				return store.userInfo
			}
		},
		onLoad() {
			this.loadUserData()
		},
		methods: {
			loadUserData() {
				if (this.userInfo) {
					this.formData = {
						nickname: this.userInfo.nickname || '',
						// #ifndef MP-WEIXIN
						gender: this.userInfo.gender || 0,
						mobile: this.userInfo.mobile || '',
						email: this.userInfo.email || '',
						description: this.userInfo.description || this.userInfo.comment || '',
						// #endif
						avatar: this.userInfo.avatar || this.defaultAvatars[0].url
					}
				}
			},
			
			showAvatarPicker() {
				this.$refs.avatarPopup.open()
			},
			
			closeAvatarPicker() {
				this.$refs.avatarPopup.close()
			},
			
			selectAvatar(avatar) {
				this.formData.avatar = avatar.url
				this.closeAvatarPicker()
				uni.showToast({
					title: '头像已选择',
					icon: 'success',
					duration: 1000
				})
			},
			
			async saveProfile() {
				try {
					await this.$refs.form.validate()
				} catch (errors) {
					console.log('表单验证失败:', errors)
					return
				}
				
				this.saving = true
				
				try {
					const userCo = uniCloud.importObject('user-co')
					const result = await userCo.updateProfile(this.formData)
					
					if (result.code === 0) {
						// 直接更新本地用户信息状态，避免clientDB权限问题
						mutations.setUserInfo(this.formData)
						
						uni.showToast({
							title: '保存成功',
							icon: 'success'
						})
						
						setTimeout(() => {
							uni.navigateBack()
						}, 1500)
					} else {
						throw new Error(result.message || '保存失败')
					}
				} catch (error) {
					console.error('保存资料失败:', error)
					uni.showToast({
						title: error.message || '保存失败',
						icon: 'error'
					})
				} finally {
					this.saving = false
				}
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

	.edit-profile {
		flex: 1;
		background: linear-gradient(180deg, #f8f9ff 0%, #f5f5f5 40%);
		min-height: 100vh;
	}


	/* 头像编辑区域 */
	.avatar-section {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 60rpx 40rpx 50rpx;
		align-items: center;
		margin-bottom: 30rpx;
		position: relative;
		overflow: hidden;
	}

	.avatar-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
		pointer-events: none;
	}

	.current-avatar-wrapper {
		position: relative;
		width: 180rpx;
		height: 180rpx;
		border-radius: 50%;
		overflow: hidden;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
		border: 6rpx solid rgba(255, 255, 255, 0.2);
		transition: all 0.3s ease;
	}

	.current-avatar-wrapper:active {
		transform: scale(0.95);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
	}

	.avatar-preview {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.default-avatar {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
		border-radius: 50%;
		justify-content: center;
		align-items: center;
		backdrop-filter: blur(10rpx);
	}

	.default-avatar .avatar-text {
		font-size: 70rpx;
		color: #ffffff;
		font-weight: 600;
		text-align: center;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
	}

	.avatar-mask {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%);
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		opacity: 0;
		transition: all 0.3s ease;
		backdrop-filter: blur(4rpx);
	}

	.current-avatar-wrapper:active .avatar-mask {
		opacity: 1;
	}

	.avatar-tip {
		font-size: 22rpx;
		color: #ffffff;
		margin-top: 6rpx;
		text-align: center;
		font-weight: 500;
		text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.3);
	}

	/* 头像选择器样式 */
	.avatar-picker {
		background: linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%);
		border-radius: 24rpx 24rpx 0 0;
		max-height: 80vh;
		overflow: hidden;
		box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.15);
		border: 1rpx solid rgba(255, 255, 255, 0.8);
	}

	.picker-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 40rpx 35rpx 25rpx;
		border-bottom: 1rpx solid #e2e8f0;
		background: linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, rgba(255, 255, 255, 0.8) 100%);
	}

	.picker-title {
		font-size: 38rpx;
		color: #2d3748;
		font-weight: 700;
		letter-spacing: 0.5rpx;
	}

	.close-btn {
		width: 64rpx;
		height: 64rpx;
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}

	.close-btn:active {
		transform: scale(0.95);
		background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
	}

	.avatar-grid {
		padding: 35rpx 30rpx;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 20rpx;
	}

	.avatar-item {
		position: relative;
		width: 140rpx;
		height: 140rpx;
		margin-bottom: 25rpx;
		border-radius: 50%;
		overflow: hidden;
		border: 4rpx solid transparent;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}

	.avatar-item:active {
		transform: scale(0.95);
	}

	.avatar-item.selected {
		border-color: #667eea;
		box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
		transform: scale(1.05);
	}

	.avatar-thumbnail {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.selected-mark {
		position: absolute;
		top: -4rpx;
		right: -4rpx;
		width: 44rpx;
		height: 44rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 50%;
		justify-content: center;
		align-items: center;
		border: 4rpx solid #ffffff;
		box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
		animation: pulse 1.5s infinite;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}

	/* 表单区域 */
	.form-section {
		background-color: #ffffff;
		margin: 0 20rpx 30rpx;
		border-radius: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
		overflow: hidden;
		border: 1rpx solid rgba(255, 255, 255, 0.8);
	}
	
	/* 用户ID显示项 */
	.user-id-item {
		padding: 32rpx 30rpx;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1rpx solid #f5f6fa;
		background: linear-gradient(90deg, #f8f9ff 0%, #ffffff 100%);
	}

	.user-id-label {
		font-size: 30rpx;
		color: #4a5568;
		font-weight: 600;
		display: flex;
		align-items: center;
	}

	.user-id-label::before {
		content: '🆔';
		margin-right: 12rpx;
		font-size: 28rpx;
	}

	.user-id-value {
		font-size: 24rpx;
		color: #2d3748;
		font-family: 'SF Mono', Monaco, 'Roboto Mono', monospace;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #ffffff;
		padding: 12rpx 20rpx;
		border-radius: 16rpx;
		font-weight: 500;
		box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
		max-width: 320rpx;
		text-align: center;
	}
		
	/* #ifndef APP-NVUE */
	.form-section ::v-deep .uni-forms-item {
		padding: 32rpx 30rpx;
		border-bottom: 1rpx solid #f5f6fa;
		transition: all 0.3s ease;
	}

	.form-section ::v-deep .uni-forms-item:hover {
		background-color: #f8f9ff;
	}
		
	::v-deep .uni-forms-item:last-child {
		border-bottom: none;
		border-radius: 0 0 24rpx 24rpx;
	}
		
	::v-deep .uni-forms-item__label {
		font-size: 32rpx;
		color: #2d3748;
		font-weight: 600;
		margin-bottom: 18rpx;
		letter-spacing: 0.5rpx;
	}
		
	::v-deep .uni-easyinput__content {
		border: 2rpx solid #e2e8f0;
		border-radius: 16rpx;
		background: linear-gradient(135deg, #ffffff 0%, #f7fafc 100%);
		transition: all 0.3s ease;
		box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.05);
	}

	::v-deep .uni-easyinput__content:focus-within {
		border-color: #667eea;
		box-shadow: 0 0 0 6rpx rgba(102, 126, 234, 0.1);
		background: #ffffff;
	}
		
	::v-deep .uni-easyinput__content-input {
		padding: 24rpx 28rpx;
		font-size: 30rpx;
		color: #2d3748;
		font-weight: 500;
		line-height: 1.4;
	}
		
	::v-deep .uni-easyinput__content-textarea {
		padding: 24rpx 28rpx;
		font-size: 30rpx;
		color: #2d3748;
		min-height: 220rpx;
		line-height: 1.6;
		font-weight: 400;
	}
		
	::v-deep .uni-data-picker {
		border: 2rpx solid #e2e8f0;
		border-radius: 16rpx;
		background: linear-gradient(135deg, #ffffff 0%, #f7fafc 100%);
		transition: all 0.3s ease;
		box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.05);
	}
		
	::v-deep .uni-data-picker__input-text {
		padding: 24rpx 28rpx;
		font-size: 30rpx;
		color: #2d3748;
		font-weight: 500;
	}
	/* #endif */

	/* 底部按钮 */
	.button-section {
		padding: 30rpx 40rpx;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, #ffffff 100%);
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		backdrop-filter: blur(20rpx);
		border-top: 1rpx solid rgba(255, 255, 255, 0.8);
		/* #ifndef APP-NVUE */
		box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.12);
		/* #endif */
	}

	.save-btn {
		width: 100%;
		height: 96rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #ffffff;
		border-radius: 24rpx;
		font-size: 34rpx;
		font-weight: 600;
		border: none;
		box-shadow: 0 8rpx 32rpx rgba(102, 126, 234, 0.4);
		transition: all 0.3s ease;
		letter-spacing: 1rpx;
		/* #ifndef APP-NVUE */
		display: flex;
		align-items: center;
		justify-content: center;
		/* #endif */
	}

	.save-btn:active {
		transform: translateY(2rpx);
		box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.6);
		background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
	}

	.save-btn[loading] {
		background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
		box-shadow: 0 4rpx 16rpx rgba(160, 174, 192, 0.3);
		transform: none;
	}

	/* 安全区域适配 */
	/* #ifndef APP-NVUE */
	.button-section {
		padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
	}
	/* #endif */

	/* 响应式设计 */
	/* #ifndef APP-NVUE */
	@media (max-width: 750rpx) {
		.avatar-section {
			padding: 50rpx 30rpx 40rpx;
		}
		
		.form-section {
			margin: 0 15rpx 25rpx;
			border-radius: 20rpx;
		}
		
		.button-section {
			padding: 25rpx 30rpx;
		}
		
		.save-btn {
			height: 88rpx;
			font-size: 32rpx;
		}
	}
	/* #endif */
</style>