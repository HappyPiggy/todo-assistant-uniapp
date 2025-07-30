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
				<uni-forms-item name="nickname" label="昵称">
					<uni-easyinput 
						v-model="formData.nickname" 
						placeholder="请输入昵称"
						:clearable="true"
						:maxlength="20">
					</uni-easyinput>
				</uni-forms-item>

				<uni-forms-item name="gender" label="性别">
					<uni-data-picker 
						v-model="formData.gender" 
						:localdata="genderOptions"
						placeholder="请选择性别">
					</uni-data-picker>
				</uni-forms-item>

				<uni-forms-item name="mobile" label="手机号">
					<uni-easyinput 
						v-model="formData.mobile" 
						type="number"
						placeholder="请输入手机号"
						:disabled="true">
					</uni-easyinput>
				</uni-forms-item>

				<uni-forms-item name="email" label="邮箱">
					<uni-easyinput 
						v-model="formData.email" 
						placeholder="请输入邮箱地址"
						:clearable="true">
					</uni-easyinput>
				</uni-forms-item>

				<uni-forms-item name="comment" label="个人简介">
					<uni-easyinput 
						v-model="formData.comment" 
						type="textarea"
						placeholder="写点什么介绍一下自己吧"
						:maxlength="200"
						:clearable="true">
					</uni-easyinput>
				</uni-forms-item>
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
					gender: 0,
					mobile: '',
					email: '',
					comment: '',
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
					email: {
						rules: [
							{ format: 'email', errorMessage: '邮箱格式不正确' }
						]
					}
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
						gender: this.userInfo.gender || 0,
						mobile: this.userInfo.mobile || '',
						email: this.userInfo.email || '',
						comment: this.userInfo.comment || '',
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
						// 更新本地用户信息
						await mutations.updateUserInfo(this.formData)
						
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
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	/* 头像编辑区域 */
	.avatar-section {
		background-color: #ffffff;
		padding: 40rpx;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.current-avatar-wrapper {
		position: relative;
		width: 200rpx;
		height: 200rpx;
		border-radius: 50%;
		overflow: hidden;
	}

	.avatar-preview {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.default-avatar {
		width: 100%;
		height: 100%;
		background-color: #f0f0f0;
		border-radius: 50%;
		justify-content: center;
		align-items: center;
	}

	.default-avatar .avatar-text {
		font-size: 80rpx;
		color: #666666;
		font-weight: 600;
		text-align: center;
	}

	.avatar-mask {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.current-avatar-wrapper:active .avatar-mask {
		opacity: 1;
	}

	.avatar-tip {
		font-size: 24rpx;
		color: #ffffff;
		margin-top: 8rpx;
		text-align: center;
	}

	/* 头像选择器样式 */
	.avatar-picker {
		background-color: #ffffff;
		border-radius: 20rpx 20rpx 0 0;
		max-height: 80vh;
		overflow: hidden;
	}

	.picker-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 40rpx 30rpx 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.picker-title {
		font-size: 36rpx;
		color: #333333;
		font-weight: 600;
	}

	.close-btn {
		width: 60rpx;
		height: 60rpx;
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		background-color: #f5f5f5;
	}

	.avatar-grid {
		padding: 30rpx;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;
	}

	.avatar-item {
		position: relative;
		width: 140rpx;
		height: 140rpx;
		margin-bottom: 30rpx;
		border-radius: 50%;
		overflow: hidden;
		border: 4rpx solid transparent;
	}

	.avatar-item.selected {
		border-color: #007AFF;
		box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
	}

	.avatar-thumbnail {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.selected-mark {
		position: absolute;
		top: -2rpx;
		right: -2rpx;
		width: 40rpx;
		height: 40rpx;
		background-color: #007AFF;
		border-radius: 50%;
		justify-content: center;
		align-items: center;
		border: 4rpx solid #ffffff;
	}

	/* 表单区域 */
	.form-section {
		background-color: #ffffff;
		margin-bottom: 40rpx;
		
		/* #ifndef APP-NVUE */
		::v-deep .uni-forms-item {
			padding: 30rpx;
			border-bottom: 1rpx solid #f0f0f0;
		}
		
		::v-deep .uni-forms-item:last-child {
			border-bottom: none;
		}
		
		::v-deep .uni-forms-item__label {
			font-size: 30rpx;
			color: #333333;
			font-weight: 500;
			margin-bottom: 16rpx;
		}
		
		::v-deep .uni-easyinput__content {
			border: 1rpx solid #e5e5e5;
			border-radius: 12rpx;
			background-color: #fafafa;
		}
		
		::v-deep .uni-easyinput__content-input {
			padding: 20rpx 24rpx;
			font-size: 28rpx;
			color: #333333;
		}
		
		::v-deep .uni-easyinput__content-textarea {
			padding: 20rpx 24rpx;
			font-size: 28rpx;
			color: #333333;
			min-height: 200rpx;
		}
		
		::v-deep .uni-data-picker {
			border: 1rpx solid #e5e5e5;
			border-radius: 12rpx;
			background-color: #fafafa;
		}
		
		::v-deep .uni-data-picker__input-text {
			padding: 20rpx 24rpx;
			font-size: 28rpx;
			color: #333333;
		}
		/* #endif */
	}

	/* 底部按钮 */
	.button-section {
		padding: 30rpx;
		background-color: #ffffff;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		/* #ifndef APP-NVUE */
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
		/* #endif */
	}

	.save-btn {
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

	.save-btn:active {
		background-color: #0056CC;
	}

	.save-btn[loading] {
		background-color: #cccccc;
	}

	/* 安全区域适配 */
	/* #ifndef APP-NVUE */
	.button-section {
		padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
	}
	/* #endif */
</style>