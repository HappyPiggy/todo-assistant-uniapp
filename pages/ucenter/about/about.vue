<template>
	<view class="about-container">
		<!-- 应用Logo和标题区域 -->
		<view class="app-header">
			<view class="app-logo">
				<view class="logo-container">
					<uni-icons color="#007AFF" size="60" type="list" />
				</view>
			</view>
			<text class="app-name">大薯的记录册</text>
			<text class="app-version">v1.0.0</text>
		</view>

		<!-- 应用介绍卡片 -->
		<view class="intro-card">
			<view class="card-header">
				<view class="header-icon">
					<uni-icons color="#007AFF" size="24" type="info-filled" />
				</view>
				<text class="card-title">应用介绍</text>
			</view>
			<view class="card-content">
				<text class="intro-text">
					大薯的记录册是一款专业的任务管理应用，采用先进的云端同步技术，让您的任务管理更加高效便捷。支持团队协作、多平台同步，让工作和生活井井有条。
				</text>
			</view>
		</view>

		<!-- 核心功能特性 -->
		<view class="features-section">
			<text class="section-title">核心特性</text>
			<view class="features-grid">
				<view class="feature-item">
					<view class="feature-icon">
						<uni-icons color="#34C759" size="28" type="checkmarkempty" />
					</view>
					<text class="feature-title">智能任务管理</text>
					<text class="feature-desc">层级化任务组织，优先级智能排序</text>
				</view>
				<view class="feature-item">
					<view class="feature-icon">
						<uni-icons color="#FF9500" size="28" type="cloud-upload" />
					</view>
					<text class="feature-title">云端实时同步</text>
					<text class="feature-desc">多设备无缝同步，数据永不丢失</text>
				</view>
				<view class="feature-item">
					<view class="feature-icon">
						<uni-icons color="#AF52DE" size="28" type="person-add" />
					</view>
					<text class="feature-title">团队协作</text>
					<text class="feature-desc">成员共享，权限管理，高效协作</text>
				</view>
				<view class="feature-item">
					<view class="feature-icon">
						<uni-icons color="#FF3B30" size="28" type="chart" />
					</view>
					<text class="feature-title">数据统计</text>
					<text class="feature-desc">可视化统计，洞察工作效率</text>
				</view>
			</view>
		</view>

		<!-- 联系信息 -->
		<view class="contact-section">
			<text class="section-title">联系我们</text>
			<view class="contact-info">
				<text class="contact-text">如有问题或建议，欢迎反馈</text>
				<text class="copyright">© 2024 大薯的记录册 All rights reserved.</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			
		}
	},
	onLoad() {
		
	},
	methods: {
		
	}
}
</script>

<style lang="scss" scoped>
.about-container {
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	position: relative;
	overflow: hidden;
	
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 200rpx;
		background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%);
		z-index: 1;
	}
}

// 应用Logo和标题区域
.app-header {
	padding: 80rpx 40rpx 60rpx;
	text-align: center;
	position: relative;
	z-index: 2;
	
	.app-logo {
		margin-bottom: 30rpx;
		
		.logo-container {
			width: 120rpx;
			height: 120rpx;
			background: rgba(255, 255, 255, 0.9);
			border-radius: 30rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			margin: 0 auto;
			box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
			backdrop-filter: blur(10rpx);
		}
	}
	
	.app-name {
		display: block;
		font-size: 40rpx;
		font-weight: 600;
		color: #ffffff;
		margin-bottom: 10rpx;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
	}
	
	.app-version {
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 400;
	}
}

// 卡片通用样式
.intro-card, .tech-card {
	margin: 30rpx 30rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 20rpx;
	backdrop-filter: blur(20rpx);
	box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.1);
	overflow: hidden;
	
	.card-header {
		padding: 30rpx 30rpx 20rpx;
		display: flex;
		align-items: center;
		border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
		
		.header-icon {
			margin-right: 20rpx;
		}
		
		.card-title {
			font-size: 32rpx;
			font-weight: 600;
			color: #333;
		}
	}
	
	.card-content {
		padding: 30rpx;
	}
}

.intro-text {
	font-size: 28rpx;
	line-height: 1.6;
	color: #666;
	text-align: justify;
}

// 功能特性网格
.features-section {
	margin: 50rpx 30rpx;
	
	.section-title {
		display: block;
		font-size: 32rpx;
		font-weight: 600;
		color: #ffffff;
		margin-bottom: 30rpx;
		text-align: center;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
	}
	
	.features-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20rpx;
	}
	
	.feature-item {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 16rpx;
		padding: 30rpx 20rpx;
		text-align: center;
		backdrop-filter: blur(10rpx);
		box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.08);
		
		.feature-icon {
			margin-bottom: 20rpx;
		}
		
		.feature-title {
			display: block;
			font-size: 26rpx;
			font-weight: 600;
			color: #333;
			margin-bottom: 10rpx;
		}
		
		.feature-desc {
			font-size: 22rpx;
			color: #666;
			line-height: 1.4;
		}
	}
}

// 技术架构信息
.tech-stack {
	.tech-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
		
		&:last-child {
			border-bottom: none;
		}
		
		.tech-label {
			font-size: 26rpx;
			color: #666;
		}
		
		.tech-value {
			font-size: 26rpx;
			font-weight: 500;
			color: #007AFF;
		}
	}
}

// 联系信息
.contact-section {
	margin: 50rpx 30rpx 80rpx;
	text-align: center;
	
	.section-title {
		display: block;
		font-size: 32rpx;
		font-weight: 600;
		color: #ffffff;
		margin-bottom: 30rpx;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
	}
	
	.contact-info {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 16rpx;
		padding: 40rpx 30rpx;
		backdrop-filter: blur(10rpx);
		box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.08);
		
		.contact-text {
			display: block;
			font-size: 26rpx;
			color: #666;
			margin-bottom: 20rpx;
		}
		
		.copyright {
			font-size: 22rpx;
			color: #999;
		}
	}
}
</style>