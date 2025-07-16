<template>
	<view class="center">
		<!-- 用户信息区域 -->
		<view class="user-header">
			<view class="avatar-section" @click="toUserInfo">
				<cloud-image width="150rpx" height="150rpx" v-if="hasLogin&&userInfo.avatar_file&&userInfo.avatar_file.url" :src="userInfo.avatar_file.url" class="avatar-image"></cloud-image>
				
				<view v-else class="default-avatar">
					<uni-icons color="#ffffff" size="50" type="person-filled" />
				</view>
				
				<view class="edit-avatar-tip" v-if="hasLogin">
					<uni-icons color="#007AFF" size="20" type="camera" />
				</view>
			</view>
			
			<view class="user-info">
				<text class="user-name" v-if="hasLogin">{{userInfo.nickname||userInfo.username||userInfo.mobile}}</text>
				<text class="user-name" v-else @click="toLogin">点击登录</text>
				<text class="user-id" v-if="hasLogin">ID: {{userInfo._id}}</text>
			</view>
		</view>

		<!-- 功能卡片区域 -->
		<view class="function-cards">
			<!-- 个人资料卡片 -->
			<view class="card" v-if="hasLogin">
				<view class="card-header">
					<uni-icons color="#007AFF" size="24" type="person" />
					<text class="card-title">个人资料</text>
				</view>
				<uni-list class="card-list">
					<uni-list-item title="编辑资料" link @click="toEditProfile" :show-extra-icon="true" :extraIcon="{type:'right',color:'#c0c4cc'}">
					</uni-list-item>
					<uni-list-item title="修改密码" link @click="toChangePassword" :show-extra-icon="true" :extraIcon="{type:'right',color:'#c0c4cc'}">
					</uni-list-item>
				</uni-list>
			</view>

			<!-- 设置卡片 -->
			<view class="card">
				<view class="card-header">
					<uni-icons color="#6c757d" size="24" type="gear" />
					<text class="card-title">设置</text>
				</view>
				<uni-list class="card-list">
					<uni-list-item title="数据统计" link @click="toStatistics" :show-extra-icon="true" :extraIcon="{type:'right',color:'#c0c4cc'}">
					</uni-list-item>
					<uni-list-item title="应用设置" link to="/pages/ucenter/settings/settings" :show-extra-icon="true" :extraIcon="{type:'right',color:'#c0c4cc'}">
					</uni-list-item>
					<uni-list-item title="关于应用" link @click="toAbout" :show-extra-icon="true" :extraIcon="{type:'right',color:'#c0c4cc'}">
					</uni-list-item>
				</uni-list>
			</view>

			<!-- 登出按钮 -->
			<view class="logout-section" v-if="hasLogin">
				<button class="logout-btn" @click="logout">退出登录</button>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		store,
		mutations
	} from '@/uni_modules/uni-id-pages/common/store.js'
	export default {
		data() {
			return {
				// 基本数据
			}
		},
		computed: {
			userInfo() {
				const info = store.userInfo
				// console.log('【userInfo】', JSON.parse(JSON.stringify(store)))
				return info
			},
			hasLogin(){
				return store.hasLogin
			}
		},
		onLoad() {
			// 基本初始化
		},
		methods: {
			toLogin() {
				uni.navigateTo({
					url: '/pages/login/login-withpwd'
				})
			},
			toUserInfo() {
				if (!this.hasLogin) {
					this.toLogin()
					return
				}
				uni.navigateTo({
					url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo'
				})
			},
			toEditProfile() {
				uni.navigateTo({
					url: '/pages/ucenter/profile/edit'
				})
			},
			toChangePassword() {
				uni.navigateTo({
					url: '/uni_modules/uni-id-pages/pages/pwd/pwd'
				})
			},
			toStatistics() {
				//todo
			},
			toAbout() {
				uni.navigateTo({
					url: '/pages/ucenter/about/about'
				})
			},

			async changeLoginState(){
				if(this.hasLogin){
					await mutations.logout()
				}else{
					uni.redirectTo({
						url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd',
					});
				}
			},


			logout() {
				uni.showModal({
					title: '确认退出',
					content: '确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							this.changeLoginState()
							uni.showToast({
								title: '已退出登录',
								icon: 'success'
							})
						}
					}
				})
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
	
	.center {
		flex: 1;
		flex-direction: column;
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	/* 用户头部区域 */
	.user-header {
		background: linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%);
		padding: 60rpx 40rpx 40rpx;
		flex-direction: column;
		align-items: center;
		position: relative;
		overflow: hidden;
	}

	.avatar-section {
		position: relative;
		margin-bottom: 20rpx;
	}

	.avatar-image {
		border-radius: 50%;
		border: 4rpx solid rgba(255, 255, 255, 0.3);
	}

	.default-avatar {
		width: 150rpx;
		height: 150rpx;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		justify-content: center;
		align-items: center;
		border: 4rpx solid rgba(255, 255, 255, 0.3);
	}

	.edit-avatar-tip {
		position: absolute;
		bottom: 5rpx;
		right: 5rpx;
		width: 40rpx;
		height: 40rpx;
		background-color: rgba(255, 255, 255, 0.9);
		border-radius: 50%;
		justify-content: center;
		align-items: center;
	}

	.user-info {
		align-items: center;
		margin-bottom: 20rpx;
	}

	.user-name {
		font-size: 42rpx;
		color: #FFFFFF;
		font-weight: 500;
		text-align: center;
		margin-bottom: 8rpx;
	}

	.user-id {
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.8);
		text-align: center;
	}

	.sync-status {
		flex-direction: row;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.15);
		padding: 16rpx 24rpx;
		border-radius: 30rpx;
		margin-top: 10rpx;
	}

	.sync-text {
		font-size: 28rpx;
		color: #FFFFFF;
		margin-left: 12rpx;
	}

	/* 功能卡片区域 */
	.function-cards {
		padding: 30rpx;
		gap: 20rpx;
	}

	.card {
		background-color: #FFFFFF;
		border-radius: 20rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		overflow: hidden;
		margin-bottom: 20rpx;
	}

	.card-header {
		flex-direction: row;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.card-title {
		font-size: 32rpx;
		color: #333333;
		font-weight: 500;
		margin-left: 16rpx;
	}

	.card-list {
		/* #ifndef APP-NVUE */
		::v-deep .uni-list {
			border: none;
		}
		
		::v-deep .uni-list-item {
			padding: 24rpx 30rpx;
			border-bottom: 1rpx solid #f0f0f0;
		}
		
		::v-deep .uni-list-item:last-child {
			border-bottom: none;
		}
		
		::v-deep .uni-list-item__content-title {
			font-size: 30rpx;
			color: #333333;
		}
		
		::v-deep .uni-list-item__content-note {
			font-size: 26rpx;
			color: #999999;
		}
		/* #endif */
	}

	/* 登出按钮 */
	.logout-section {
		padding: 20rpx 30rpx 50rpx;
	}

	.logout-btn {
		width: 100%;
		height: 88rpx;
		background-color: #FF4757;
		color: #FFFFFF;
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

	.logout-btn:active {
		background-color: #FF3742;
	}

	/* 响应式设计 */
	/* #ifndef APP-NVUE */
	@media (max-width: 750rpx) {
		.user-header {
			padding: 50rpx 30rpx 30rpx;
		}
		
		.function-cards {
			padding: 20rpx;
		}
		
		.card-header {
			padding: 24rpx;
		}
	}
	/* #endif */
</style>
