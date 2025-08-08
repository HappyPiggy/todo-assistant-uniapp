<template>
	<view class="logout-redirect">
		<view class="loading-container">
			<view class="loading-icon">
				<uni-icons type="loop" size="32" color="#007AFF" />
			</view>
			<text class="loading-text">退出登录中...</text>
		</view>
	</view>
</template>

<script setup>
import { onMounted } from 'vue'

// 页面加载时立即跳转到首页
onMounted(() => {
	// 短暂延迟后跳转到首页，确保退出登录流程完成
	setTimeout(() => {
		uni.reLaunch({
			url: '/pages/list/list',
			success: () => {
				console.log('退出登录后成功跳转到首页')
			},
			fail: (error) => {
				console.error('跳转到首页失败:', error)
				// 如果跳转失败，尝试使用switchTab（如果首页是tabbar页面）
				uni.switchTab({
					url: '/pages/list/list'
				})
			}
		})
	}, 500)
})
</script>

<style lang="scss" scoped>
.logout-redirect {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100vh;
	background-color: #f8f9fa;
}

.loading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
}

.loading-icon {
	animation: rotate 1s linear infinite;
}

.loading-text {
	font-size: 28rpx;
	color: #666666;
}

@keyframes rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style>