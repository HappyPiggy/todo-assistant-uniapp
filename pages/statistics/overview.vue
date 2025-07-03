<template>
	<view class="statistics-page">
		<!-- 统计概览 -->
		<view class="overview-section">
			<view class="section-header">
				<text class="section-title">数据概览</text>
				<text class="update-time">{{ formatTime(updateTime) }}</text>
			</view>
			
			<view class="stats-grid">
				<view class="stat-card">
					<view class="stat-icon projects">
						<uni-icons color="#ffffff" size="24" type="folder" />
					</view>
					<view class="stat-content">
						<text class="stat-number">{{ stats.totalProjects }}</text>
						<text class="stat-label">项目册</text>
					</view>
				</view>
				
				<view class="stat-card">
					<view class="stat-icon tasks">
						<uni-icons color="#ffffff" size="24" type="list" />
					</view>
					<view class="stat-content">
						<text class="stat-number">{{ stats.totalTasks }}</text>
						<text class="stat-label">总任务</text>
					</view>
				</view>
				
				<view class="stat-card">
					<view class="stat-icon completed">
						<uni-icons color="#ffffff" size="24" type="checkmarkempty" />
					</view>
					<view class="stat-content">
						<text class="stat-number">{{ stats.completedTasks }}</text>
						<text class="stat-label">已完成</text>
					</view>
				</view>
				
				<view class="stat-card">
					<view class="stat-icon rate">
						<uni-icons color="#ffffff" size="24" type="bars" />
					</view>
					<view class="stat-content">
						<text class="stat-number">{{ completionRate }}%</text>
						<text class="stat-label">完成率</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 任务状态分布 -->
		<view class="distribution-section">
			<view class="section-header">
				<text class="section-title">任务分布</text>
			</view>
			
			<view class="chart-container">
				<view class="distribution-chart">
					<view class="chart-item">
						<view class="chart-bar todo" :style="{ height: getBarHeight(stats.todoTasks) + '%' }"></view>
						<text class="chart-label">待办</text>
						<text class="chart-value">{{ stats.todoTasks }}</text>
					</view>
					
					<view class="chart-item">
						<view class="chart-bar in-progress" :style="{ height: getBarHeight(stats.inProgressTasks) + '%' }"></view>
						<text class="chart-label">进行中</text>
						<text class="chart-value">{{ stats.inProgressTasks }}</text>
					</view>
					
					<view class="chart-item">
						<view class="chart-bar completed" :style="{ height: getBarHeight(stats.completedTasks) + '%' }"></view>
						<text class="chart-label">已完成</text>
						<text class="chart-value">{{ stats.completedTasks }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 每日活动 -->
		<view class="activity-section">
			<view class="section-header">
				<text class="section-title">最近活动</text>
			</view>
			
			<view class="activity-calendar">
				<view class="calendar-header">
					<text v-for="day in weekDays" :key="day" class="week-day">{{ day }}</text>
				</view>
				<view class="calendar-grid">
					<view 
						v-for="day in calendarDays" 
						:key="day.date"
						class="calendar-day"
						:class="{ 
							today: day.isToday,
							'has-activity': day.activityLevel > 0
						}"
						:style="{ backgroundColor: getActivityColor(day.activityLevel) }">
						<text class="day-number">{{ day.day }}</text>
					</view>
				</view>
			</view>
			
			<view class="activity-legend">
				<text class="legend-label">活跃度:</text>
				<view class="legend-colors">
					<view class="legend-item">
						<view class="legend-color" style="background-color: #ebedf0;"></view>
						<text class="legend-text">低</text>
					</view>
					<view class="legend-item">
						<view class="legend-color" style="background-color: #c6e48b;"></view>
						<text class="legend-text">中</text>
					</view>
					<view class="legend-item">
						<view class="legend-color" style="background-color: #7bc96f;"></view>
						<text class="legend-text">高</text>
					</view>
					<view class="legend-item">
						<view class="legend-color" style="background-color: #239a3b;"></view>
						<text class="legend-text">很高</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 优先级分布 -->
		<view class="priority-section">
			<view class="section-header">
				<text class="section-title">优先级分布</text>
			</view>
			
			<view class="priority-list">
				<view class="priority-item">
					<view class="priority-info">
						<view class="priority-dot urgent"></view>
						<text class="priority-label">紧急</text>
					</view>
					<view class="priority-progress">
						<view class="progress-bar">
							<view class="progress-fill urgent" :style="{ width: getPriorityPercent('urgent') + '%' }"></view>
						</view>
						<text class="priority-count">{{ stats.priorities?.urgent || 0 }}</text>
					</view>
				</view>
				
				<view class="priority-item">
					<view class="priority-info">
						<view class="priority-dot high"></view>
						<text class="priority-label">高</text>
					</view>
					<view class="priority-progress">
						<view class="progress-bar">
							<view class="progress-fill high" :style="{ width: getPriorityPercent('high') + '%' }"></view>
						</view>
						<text class="priority-count">{{ stats.priorities?.high || 0 }}</text>
					</view>
				</view>
				
				<view class="priority-item">
					<view class="priority-info">
						<view class="priority-dot medium"></view>
						<text class="priority-label">中</text>
					</view>
					<view class="priority-progress">
						<view class="progress-bar">
							<view class="progress-fill medium" :style="{ width: getPriorityPercent('medium') + '%' }"></view>
						</view>
						<text class="priority-count">{{ stats.priorities?.medium || 0 }}</text>
					</view>
				</view>
				
				<view class="priority-item">
					<view class="priority-info">
						<view class="priority-dot low"></view>
						<text class="priority-label">低</text>
					</view>
					<view class="priority-progress">
						<view class="progress-bar">
							<view class="progress-fill low" :style="{ width: getPriorityPercent('low') + '%' }"></view>
						</view>
						<text class="priority-count">{{ stats.priorities?.low || 0 }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 刷新按钮 -->
		<view class="refresh-section">
			<button class="refresh-btn" @click="refreshStats" :loading="loading">
				{{ loading ? '刷新中...' : '刷新数据' }}
			</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				loading: false,
				updateTime: new Date(),
				stats: {
					totalProjects: 0,
					totalTasks: 0,
					completedTasks: 0,
					todoTasks: 0,
					inProgressTasks: 0,
					priorities: {
						urgent: 0,
						high: 0,
						medium: 0,
						low: 0
					}
				},
				weekDays: ['日', '一', '二', '三', '四', '五', '六'],
				calendarDays: []
			}
		},
		computed: {
			completionRate() {
				if (this.stats.totalTasks === 0) return 0
				return Math.round((this.stats.completedTasks / this.stats.totalTasks) * 100)
			}
		},
		onLoad() {
			this.loadStatistics()
			this.generateCalendar()
		},
		onShow() {
			this.loadStatistics()
		},
		methods: {
			async loadStatistics() {
				try {
					this.loading = true
					
					// 获取项目册统计
					const todoBooks = await this.$storage.getTodoBooks()
					this.stats.totalProjects = todoBooks.length
					
					// 获取任务统计
					const tasks = await this.$storage.getTodoItems()
					this.stats.totalTasks = tasks.length
					
					// 按状态分组
					const statusGroups = this.groupByStatus(tasks)
					this.stats.todoTasks = statusGroups.todo || 0
					this.stats.inProgressTasks = statusGroups.in_progress || 0
					this.stats.completedTasks = statusGroups.completed || 0
					
					// 按优先级分组
					this.stats.priorities = this.groupByPriority(tasks)
					
					this.updateTime = new Date()
				} catch (error) {
					console.error('加载统计数据失败:', error)
					uni.showToast({
						title: '加载失败',
						icon: 'error'
					})
				} finally {
					this.loading = false
				}
			},

			groupByStatus(tasks) {
				return tasks.reduce((groups, task) => {
					const status = task.status || 'todo'
					groups[status] = (groups[status] || 0) + 1
					return groups
				}, {})
			},

			groupByPriority(tasks) {
				return tasks.reduce((groups, task) => {
					const priority = task.priority || 'medium'
					groups[priority] = (groups[priority] || 0) + 1
					return groups
				}, {})
			},

			getBarHeight(value) {
				const maxValue = Math.max(this.stats.todoTasks, this.stats.inProgressTasks, this.stats.completedTasks)
				if (maxValue === 0) return 0
				return Math.max((value / maxValue) * 100, 10) // 最小高度10%
			},

			getPriorityPercent(priority) {
				const total = Object.values(this.stats.priorities).reduce((sum, count) => sum + count, 0)
				if (total === 0) return 0
				return Math.round((this.stats.priorities[priority] / total) * 100)
			},

			generateCalendar() {
				const today = new Date()
				const days = []
				
				// 生成最近30天的日历
				for (let i = 29; i >= 0; i--) {
					const date = new Date(today)
					date.setDate(date.getDate() - i)
					
					days.push({
						date: date.toISOString().split('T')[0],
						day: date.getDate(),
						isToday: i === 0,
						activityLevel: this.getActivityLevel(date)
					})
				}
				
				this.calendarDays = days
			},

			getActivityLevel(date) {
				// 这里应该根据实际的任务活动数据计算
				// 目前使用随机数模拟
				return Math.floor(Math.random() * 5)
			},

			getActivityColor(level) {
				const colors = [
					'#ebedf0', // 0: 无活动
					'#c6e48b', // 1: 低活动
					'#7bc96f', // 2: 中活动  
					'#239a3b', // 3: 高活动
					'#196127'  // 4: 很高活动
				]
				return colors[level] || colors[0]
			},

			async refreshStats() {
				await this.loadStatistics()
				uni.showToast({
					title: '数据已刷新',
					icon: 'success'
				})
			},

			formatTime(time) {
				const now = new Date(time)
				const hours = String(now.getHours()).padStart(2, '0')
				const minutes = String(now.getMinutes()).padStart(2, '0')
				return `更新于 ${hours}:${minutes}`
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

	.statistics-page {
		flex: 1;
		background-color: #f5f5f5;
		min-height: 100vh;
		padding: 20rpx;
		gap: 20rpx;
	}

	/* 通用样式 */
	.overview-section,
	.distribution-section,
	.activity-section,
	.priority-section {
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 30rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	}

	.section-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
		padding-bottom: 16rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.section-title {
		font-size: 32rpx;
		color: #333333;
		font-weight: 600;
	}

	.update-time {
		font-size: 24rpx;
		color: #999999;
	}

	/* 统计概览 */
	.stats-grid {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 20rpx;
	}

	.stat-card {
		flex: 1;
		min-width: 300rpx;
		background-color: #f8f9fa;
		border-radius: 16rpx;
		padding: 24rpx;
		flex-direction: row;
		align-items: center;
	}

	.stat-icon {
		width: 60rpx;
		height: 60rpx;
		border-radius: 12rpx;
		justify-content: center;
		align-items: center;
		margin-right: 20rpx;
	}

	.stat-icon.projects {
		background-color: #007AFF;
	}

	.stat-icon.tasks {
		background-color: #ff9500;
	}

	.stat-icon.completed {
		background-color: #28a745;
	}

	.stat-icon.rate {
		background-color: #6f42c1;
	}

	.stat-content {
		flex: 1;
	}

	.stat-number {
		font-size: 36rpx;
		color: #333333;
		font-weight: 700;
		margin-bottom: 4rpx;
	}

	.stat-label {
		font-size: 26rpx;
		color: #666666;
	}

	/* 任务分布图表 */
	.chart-container {
		padding: 20rpx 0;
	}

	.distribution-chart {
		flex-direction: row;
		justify-content: space-around;
		align-items: flex-end;
		height: 200rpx;
		margin-bottom: 20rpx;
	}

	.chart-item {
		align-items: center;
		flex: 1;
		max-width: 120rpx;
	}

	.chart-bar {
		width: 60rpx;
		border-radius: 6rpx 6rpx 0 0;
		margin-bottom: 16rpx;
		min-height: 20rpx;
	}

	.chart-bar.todo {
		background-color: #6c757d;
	}

	.chart-bar.in-progress {
		background-color: #ffc107;
	}

	.chart-bar.completed {
		background-color: #28a745;
	}

	.chart-label {
		font-size: 24rpx;
		color: #666666;
		margin-bottom: 8rpx;
		text-align: center;
	}

	.chart-value {
		font-size: 28rpx;
		color: #333333;
		font-weight: 600;
		text-align: center;
	}

	/* 活动日历 */
	.activity-calendar {
		margin-bottom: 24rpx;
	}

	.calendar-header {
		flex-direction: row;
		justify-content: space-around;
		margin-bottom: 16rpx;
	}

	.week-day {
		font-size: 24rpx;
		color: #666666;
		text-align: center;
		width: 60rpx;
	}

	.calendar-grid {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 6rpx;
	}

	.calendar-day {
		width: 60rpx;
		height: 60rpx;
		border-radius: 8rpx;
		justify-content: center;
		align-items: center;
		background-color: #ebedf0;
	}

	.calendar-day.today {
		border: 2rpx solid #007AFF;
	}

	.day-number {
		font-size: 22rpx;
		color: #333333;
	}

	.activity-legend {
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 20rpx;
	}

	.legend-label {
		font-size: 24rpx;
		color: #666666;
	}

	.legend-colors {
		flex-direction: row;
		gap: 16rpx;
	}

	.legend-item {
		flex-direction: row;
		align-items: center;
		gap: 6rpx;
	}

	.legend-color {
		width: 20rpx;
		height: 20rpx;
		border-radius: 4rpx;
	}

	.legend-text {
		font-size: 22rpx;
		color: #666666;
	}

	/* 优先级分布 */
	.priority-list {
		gap: 24rpx;
	}

	.priority-item {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}

	.priority-info {
		flex-direction: row;
		align-items: center;
		min-width: 120rpx;
	}

	.priority-dot {
		width: 16rpx;
		height: 16rpx;
		border-radius: 8rpx;
		margin-right: 12rpx;
	}

	.priority-dot.urgent {
		background-color: #dc3545;
	}

	.priority-dot.high {
		background-color: #fd7e14;
	}

	.priority-dot.medium {
		background-color: #ffc107;
	}

	.priority-dot.low {
		background-color: #28a745;
	}

	.priority-label {
		font-size: 28rpx;
		color: #333333;
	}

	.priority-progress {
		flex: 1;
		flex-direction: row;
		align-items: center;
		margin-left: 20rpx;
	}

	.progress-bar {
		flex: 1;
		height: 12rpx;
		background-color: #f0f0f0;
		border-radius: 6rpx;
		overflow: hidden;
		margin-right: 16rpx;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.3s ease;
	}

	.progress-fill.urgent {
		background-color: #dc3545;
	}

	.progress-fill.high {
		background-color: #fd7e14;
	}

	.progress-fill.medium {
		background-color: #ffc107;
	}

	.progress-fill.low {
		background-color: #28a745;
	}

	.priority-count {
		font-size: 28rpx;
		color: #333333;
		font-weight: 600;
		min-width: 60rpx;
		text-align: right;
	}

	/* 刷新按钮 */
	.refresh-section {
		padding: 30rpx;
	}

	.refresh-btn {
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

	.refresh-btn:active {
		background-color: #0056CC;
	}

	.refresh-btn[loading] {
		background-color: #cccccc;
	}
</style>