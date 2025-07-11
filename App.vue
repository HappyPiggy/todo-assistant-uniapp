<script>
	import globalStore from '@/store/index.js'
	import { store } from '@/uni_modules/uni-id-pages/common/store.js'
	import { currentUserId } from '@/store/storage.js'
	
	export default {
		data() {
			return {
				currentUserIdLocal: null // 跟踪当前用户ID
			}
		},
		onLaunch: function() {
			console.warn('当前组件仅支持 uni_modules 目录结构 ，请升级 HBuilderX 到 3.1.0 版本以上！')
			console.log('App Launch')
			
			// 初始化全局store
			globalStore.init()
			
			// 记录当前用户ID
			this.currentUserIdLocal = currentUserId.value
			
			// 延迟1秒后检查是否需要启动同步
			setTimeout(() => {
				this.performStartupSync()
			}, 1000)
		},
		onShow: function() {
			console.log('App Show')
			
			// 检查用户是否切换
			this.checkUserSwitch()
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {

			// 检查用户切换
			checkUserSwitch() {
				const newUserId = currentUserId.value
				
				if (this.currentUserIdLocal !== newUserId) {
					console.log(`检测到用户切换: ${this.currentUserIdLocal} -> ${newUserId}`)
					
					// 通知store用户已切换
					if (newUserId) {
						globalStore.todoBook.onUserSwitch(newUserId)
					}
					
					// 更新当前用户ID
					this.currentUserIdLocal = newUserId
					
					// 如果有新用户，触发启动同步
					if (newUserId) {
						// 重置启动同步标记，让新用户可以执行同步
						globalStore.state.sync.hasStartupSynced = false
						
						setTimeout(() => {
							this.performStartupSync()
						}, 500)
					}
				}
			},
			// 执行启动同步（新策略：先加载缓存，再静默同步）
			async performStartupSync() {
				try {
					// 检查用户是否已登录
					const userId = currentUserId.value
					if (!userId) {
						console.log('用户未登录，跳过启动同步')
						return
					}
					
					// 检查是否已经启动同步过
					if (globalStore.state.sync.hasStartupSynced) {
						console.log('应用启动同步已完成，跳过')
						return
					}
					
					console.log('开始应用启动同步策略...')
					
					// 标记启动同步开始
					globalStore.state.sync.hasStartupSynced = true
					
					// 步骤1：立即加载缓存数据（如果有的话）
					const cached = globalStore.todoBook.getTodoBooksFromCache()
					if (cached.success) {
						console.log('缓存数据已准备好，页面可以立即显示')
					}
					
					// 步骤2：延迟一段时间后开始静默后台同步
					setTimeout(async () => {
						console.log('开始静默后台同步最新数据...')
						await globalStore.todoBook.silentSyncTodoBooks()
					}, 2000) // 延迟2秒，让页面先渲染
					
					console.log('应用启动同步策略完成')
					
				} catch (error) {
					console.error('应用启动同步失败:', error)
					// 同步失败时重置标记，允许下次重试
					globalStore.state.sync.hasStartupSynced = false
				}
			}
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	/* #ifndef APP-NVUE */
	@import '@/static/customicons.css';
	// 设置整个项目的背景色
	page {
		background-color: #f5f5f5;
	}

	/* #endif */
	.example-info {
		font-size: 14px;
		color: #333;
		padding: 10px;
	}
</style>
