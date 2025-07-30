<template>
	<view class="center">
		<!-- 背景装饰 -->
		<view class="bg-decoration">
			<view class="decoration-circle circle-1"></view>
			<view class="decoration-circle circle-2"></view>
			<view class="decoration-circle circle-3"></view>
		</view>
		
		<!-- 用户信息区域 -->
		<view class="user-header">
			<view class="header-content">
				<view class="avatar-section" @click="toUserInfo">
					<view class="avatar-container">
						<image v-if="hasLogin&&userInfo.avatar" :src="userInfo.avatar" class="avatar-image"></image>
						
						<view v-else class="default-avatar">
							<text v-if="hasLogin && userInfo.nickname" class="avatar-text">
								{{ userInfo.nickname.charAt(0).toUpperCase() }}
							</text>
							<uni-icons v-else color="#ffffff" size="50" type="person-filled" />
						</view>
						
						<view class="avatar-status-dot" v-if="hasLogin"></view>
						<view class="edit-avatar-overlay">
							<uni-icons color="#ffffff" size="16" type="camera" />
						</view>
					</view>
				</view>
				
				<view class="user-info">
					<text class="user-name" v-if="hasLogin">{{userInfo.nickname||userInfo.username||userInfo.mobile}}</text>
					<text class="user-name login-prompt" v-else @click="toLogin">点击登录</text>
					<view class="user-details" v-if="hasLogin">
						<text class="user-gender" v-if="userInfo.gender">{{ genderText }}</text>

					</view>
					<text class="user-description" v-if="hasLogin && (userInfo.description || userInfo.comment)">{{ userInfo.description || userInfo.comment }}</text>
					<text class="user-description placeholder" v-else-if="hasLogin">添加一句话介绍自己吧～</text>
				</view>
			</view>
		</view>

		<!-- 功能卡片区域 -->
		<view class="function-cards">
			<!-- 快捷操作卡片 -->
			<view class="quick-actions" v-if="hasLogin">
				<view class="quick-action-item" @click="toEditProfile">
					<view class="action-icon">
						<uni-icons color="#007AFF" size="24" type="person" />
					</view>
					<text class="action-text">编辑资料</text>
				</view>
				<view class="quick-action-item" @click="toChangePassword">
					<view class="action-icon">
						<uni-icons color="#FF6B35" size="24" type="locked" />
					</view>
					<text class="action-text">修改密码</text>
				</view>
				<view class="quick-action-item" @click="toArchiveManagement">
					<view class="action-icon">
						<uni-icons color="#34C759" size="24" type="folder" />
					</view>
					<text class="action-text">归档管理</text>
				</view>
				<view class="quick-action-item" @click="toShareManagement">
					<view class="action-icon">
						<uni-icons color="#AF52DE" size="24" type="paperplane" />
					</view>
					<text class="action-text">分享管理</text>
				</view>
			</view>

			<!-- 设置卡片 -->
			<view class="card settings-card">
				<view class="card-header">
					<view class="header-left">
						<view class="icon-wrapper settings-icon">
							<uni-icons color="#6c757d" size="20" type="gear" />
						</view>
						<text class="card-title">设置</text>
					</view>
				</view>
				<view class="card-content">
					<view class="menu-item" @click="navToSettings">
						<view class="menu-left">
							<view class="menu-icon">
								<uni-icons color="#007AFF" size="18" type="settings" />
							</view>
							<text class="menu-title">应用设置</text>
						</view>
						<view class="menu-right">
							<text class="menu-desc">个性化配置</text>
							<uni-icons color="#c0c4cc" size="14" type="right" />
						</view>
					</view>
					<view class="menu-item" @click="toAbout">
						<view class="menu-left">
							<view class="menu-icon">
								<uni-icons color="#FF9500" size="18" type="info" />
							</view>
							<text class="menu-title">关于应用</text>
						</view>
						<view class="menu-right">
							<text class="menu-desc">版本信息</text>
							<uni-icons color="#c0c4cc" size="14" type="right" />
						</view>
					</view>
				</view>
			</view>

			<!-- 登出按钮 -->
			<view class="logout-section" v-if="hasLogin">
				<button class="logout-btn" @click="logout">
					<uni-icons color="#ffffff" size="18" type="loop" />
					<text class="logout-text">退出登录</text>
				</button>
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
			},
			genderText() {
				if (!this.userInfo.gender) return ''
				const genderMap = {
					0: '保密',
					1: '男',
					2: '女'
				}
				return genderMap[this.userInfo.gender] || '保密'
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
			toArchiveManagement() {
				uni.navigateTo({
					url: '/pages/archive-management/index'
				})
			},
			toShareManagement() {
				uni.navigateTo({
					url: '/pages/settings/share-management'
				})
			},
			toAbout() {
				uni.navigateTo({
					url: '/pages/ucenter/about/about'
				})
			},
			
			navToSettings() {
				uni.navigateTo({
					url: '/pages/ucenter/settings/settings'
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
@import './styles/ucenter.scss';
</style>
