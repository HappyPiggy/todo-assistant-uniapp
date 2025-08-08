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
				<view class="avatar-section" @click="handleAvatarClick">
					<view class="avatar-container">
						<image v-if="!isGuest && userInfo.avatar" :src="userInfo.avatar" class="avatar-image"></image>
						
						<view v-else class="default-avatar">
							<text v-if="!isGuest && userInfo.nickname" class="avatar-text">
								{{ userInfo.nickname.charAt(0).toUpperCase() }}
							</text>
							<uni-icons v-else color="#ffffff" size="50" type="person-filled" />
						</view>
						
						<view class="avatar-status-dot" v-if="!isGuest"></view>
						<view v-if="!isGuest" class="edit-avatar-overlay">
							<uni-icons color="#ffffff" size="16" type="camera" />
						</view>
					</view>
				</view>
				
				<view class="user-info">
					<!-- 访客模式显示 -->
					<text v-if="isGuest" class="user-name guest-name">访客用户</text>
					<!-- 登录用户显示 -->
					<text class="user-name" v-else-if="!isGuest">{{userInfo.nickname||userInfo.username||userInfo.mobile}}</text>
					
					<!-- 访客模式提示 -->
					<view v-if="isGuest" class="guest-notice">
						<text class="guest-hint">您正在使用访客模式</text>
						<text class="guest-features">当前可用功能：创建1个项目册、管理任务</text>
					</view>
					
					<!-- 登录用户详情 -->
					<view class="user-details" v-else-if="!isGuest">
						<text class="user-gender" v-if="userInfo.gender">{{ genderText }}</text>
					</view>
					<text class="user-description" v-if="!isGuest && (userInfo.description || userInfo.comment)">{{ userInfo.description || userInfo.comment }}</text>
					<text class="user-description placeholder" v-else-if="!isGuest">添加一句话介绍自己吧～</text>
				</view>
			</view>
		</view>

		<!-- 功能卡片区域 -->
		<view class="function-cards">
			<!-- 访客模式登录提示卡片 -->
			<view v-if="isGuest" class="guest-login-card">
				<view class="login-card-header">
					<view class="login-icon">
						<uni-icons color="#007AFF" size="32" type="person-add" />
					</view>
					<text class="login-card-title">登录解锁更多功能</text>
				</view>
				<view class="login-features">
					<view class="feature-item">
						<uni-icons color="#34C759" size="16" type="checkmarkempty" />
						<text class="feature-text">无限创建项目册</text>
					</view>
					<view class="feature-item">
						<uni-icons color="#34C759" size="16" type="checkmarkempty" />
						<text class="feature-text">团队协作功能</text>
					</view>
					<view class="feature-item">
						<uni-icons color="#34C759" size="16" type="checkmarkempty" />
						<text class="feature-text">云端同步存储</text>
					</view>
					<view class="feature-item">
						<uni-icons color="#34C759" size="16" type="checkmarkempty" />
						<text class="feature-text">评论和分享功能</text>
					</view>
				</view>
				<view class="login-btn-container">
					<button class="login-btn" @click="handleLogin">
						<text class="login-btn-text">立即登录</text>
					</button>
				</view>
			</view>
			
			<!-- 登录用户快捷操作卡片 -->
			<view class="quick-actions" v-else>
				<view class="quick-action-item" @click="toEditProfile">
					<view class="action-icon">
						<uni-icons color="#007AFF" size="24" type="person" />
					</view>
					<text class="action-text">编辑资料</text>
				</view>
				<view class="quick-action-item" @click="toArchiveManagement">
					<view class="action-icon">
						<uni-icons color="#34C759" size="24" type="folder-add" />
					</view>
					<text class="action-text">归档管理</text>
				</view>
				<view class="quick-action-item" @click="handleShareManagement">
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
			<view class="logout-section" v-if="!isGuest">
				<button class="logout-btn" @click="logout">
					<uni-icons color="#ffffff" size="18" type="loop" />
					<text class="logout-text">退出登录</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import {
	store,
	mutations
} from '@/uni_modules/uni-id-pages/common/store.js'
import { useAuthState } from '@/composables/useAuthState.js'
import { useDataAdapter } from '@/composables/useDataAdapter.js'
import { checkFeatureAccess } from '@/utils/featureGuard.js'

// 使用认证状态管理和数据适配器
const { isGuest, getPageTitlePrefix } = useAuthState()
const dataAdapter = useDataAdapter()

// 用户信息从store获取
const userInfo = computed(() => store.userInfo)
const hasLogin = computed(() => store.hasLogin)

// 性别文本
const genderText = computed(() => {
	if (!userInfo.value.gender) return ''
	const genderMap = {
		0: '保密',
		1: '男',
		2: '女'
	}
	return genderMap[userInfo.value.gender] || '保密'
})

// 页面生命周期
onLoad(() => {
	// 设置页面标题（包含访客模式前缀）
	const prefix = getPageTitlePrefix()
	uni.setNavigationBarTitle({
		title: `${prefix}个人中心`
	})
})

onMounted(() => {
	// 页面初始化
	
	// 监听全局登录状态变化事件
	uni.$on('login-status-changed', onLoginStatusChanged)
})

// 页面卸载时清理事件监听
onUnmounted(() => {
	uni.$off('login-status-changed', onLoginStatusChanged)
})

// 处理全局登录状态变化事件
const onLoginStatusChanged = (eventData) => {
	console.log('个人中心收到全局登录状态变化事件:', eventData)
	
	// 更新页面标题
	const prefix = getPageTitlePrefix()
	uni.setNavigationBarTitle({
		title: `${prefix}个人中心`
	})
}

// 事件处理方法
const handleLogin = () => {
	console.log('handleLogin: 开始跳转到登录页面')
	uni.navigateTo({
		url: '/pages/login/login-withpwd',
		success: () => {
			console.log('handleLogin: 跳转成功')
		},
		fail: (error) => {
			console.error('handleLogin: 跳转失败', error)
			uni.showToast({
				title: '跳转登录页失败，请重试',
				icon: 'none'
			})
		}
	})
}

const handleAvatarClick = () => {
	if (isGuest.value) {
		// 访客用户点击头像跳转到登录
		handleLogin()
	} else {
		// 登录用户点击头像编辑资料
		toEditProfile()
	}
}

const toEditProfile = () => {
	uni.navigateTo({
		url: '/pages/ucenter/profile/edit'
	})
}

const toArchiveManagement = () => {
	uni.navigateTo({
		url: '/pages/archive-management/index'
	})
}

const handleShareManagement = async () => {
	// 访客用户无法使用分享管理功能
	if (isGuest.value) {
		const canAccess = await checkFeatureAccess('share_management')
		if (!canAccess.allowed) {
			uni.showModal({
				title: '功能受限',
				content: canAccess.message,
				confirmText: '立即登录',
				cancelText: '稍后再说',
				success: (res) => {
					if (res.confirm) {
						handleLogin()
					}
				}
			})
			return
		}
	}
	
	// 登录用户可以访问分享管理
	uni.navigateTo({
		url: '/pages/settings/share-management'
	})
}

const toAbout = () => {
	uni.navigateTo({
		url: '/pages/ucenter/about/about'
	})
}

const navToSettings = () => {
	uni.navigateTo({
		url: '/pages/ucenter/settings/settings'
	})
}

const changeLoginState = async () => {
	if (hasLogin.value) {
		await mutations.logout()
		// 退出登录后跳转到首页
		uni.reLaunch({
			url: '/pages/list/list'
		})
	} else {
		uni.redirectTo({
			url: '/pages/login/login-withpwd',
		});
	}
}

const logout = () => {
	uni.showModal({
		title: '确认退出',
		content: '确定要退出登录吗？',
		success: (res) => {
			if (res.confirm) {
				changeLoginState()
				uni.showToast({
					title: '已退出登录',
					icon: 'success'
				})
			}
		}
	})
}
</script>

<style lang="scss" scoped>
@import './styles/ucenter.scss';
</style>
