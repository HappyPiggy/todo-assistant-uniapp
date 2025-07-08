<template>
	<view class="members-container">
		<!-- 导航栏 -->
		<uni-nav-bar 
			:left-icon="'left'" 
			:title="'成员管理'" 
			@clickLeft="goBack">
			<template v-slot:right>
				<view class="nav-right" @click="openInviteModal">
					<uni-icons type="plus" size="20" color="#007AFF" />
				</view>
			</template>
		</uni-nav-bar>

		<!-- 邀请弹窗 -->
		<view v-if="showInviteModal" class="popup-mask" @click="closeInviteModal">
			<view class="popup-content" @click.stop>
				<view class="invite-dialog">
				<view class="dialog-header">
					<text class="dialog-title">邀请成员</text>
				</view>
				
				<view class="dialog-content">
					<uni-forms-item label="用户昵称">
						<uni-easyinput 
							v-model="inviteNickname" 
							placeholder="请输入要邀请的用户昵称"
							:maxlength="20">
						</uni-easyinput>
					</uni-forms-item>
					
					<view class="invite-tip">
						<uni-icons type="info" size="14" color="#909399" />
						<text class="tip-text">输入准确的用户昵称来邀请对方加入项目册</text>
					</view>
				</view>
				
				<view class="dialog-buttons">
					<button class="cancel-btn" @click="closeInviteModal">取消</button>
					<button class="confirm-btn" @click="inviteUser" :loading="inviting">邀请</button>
				</view>
			</view>
			</view>
		</view>

		<!-- 成员列表 -->
		<view class="members-list">
			<view class="list-header">
				<text class="header-title">成员列表 ({{ members.length }})</text>
			</view>

			<view v-if="loading" class="loading-wrapper">
				<uni-load-more status="loading" />
			</view>

			<view v-else class="member-items">
				<view 
					v-for="member in members" 
					:key="member.user_id"
					class="member-item">
					
					<view class="member-info">
						<view class="avatar-wrapper">
							<image 
								v-if="member['user_info.avatar_file']" 
								:src="member['user_info.avatar_file']" 
								class="avatar" 
								mode="aspectFill" />
							<view v-else class="avatar-placeholder">
								<text>{{ (member['user_info.nickname'] ? member['user_info.nickname'].charAt(0).toUpperCase() : '?') }}</text>
							</view>
						</view>
						
						<view class="member-details">
							<view class="member-name">
								<text class="nickname">{{ member['user_info.nickname'] || '未知用户' }}</text>
								<view v-if="member.role === 'owner'" class="owner-badge">
									<text>创建者</text>
								</view>
							</view>
							<text class="join-time">{{ formatJoinTime(member.joined_at) }}</text>
						</view>
					</view>

					<view class="member-actions">
						<!-- 只有创建者能移除其他成员 -->
						<view 
							v-if="isOwner && member.role !== 'owner'" 
							class="action-btn remove-btn"
							@click="showRemoveConfirm(member)">
							<uni-icons type="trash" size="16" color="#F56C6C" />
						</view>
						
						<!-- 非创建者可以退出项目册 -->
						<view 
							v-else-if="!isOwner && member.user_id === currentUserId" 
							class="action-btn leave-btn"
							@click="showLeaveConfirm">
							<text>退出</text>
						</view>
					</view>
				</view>
			</view>

			<view v-if="!loading && members.length === 0" class="empty-state">
				<uni-icons type="person" size="48" color="#C0C4CC" />
				<text class="empty-text">暂无成员</text>
			</view>
		</view>

		<!-- 确认移除弹窗 -->
		<view v-if="showRemoveModal" class="popup-mask" @click="closeRemoveModal">
			<view class="popup-content" @click.stop>
				<view class="confirm-dialog">
				<view class="dialog-header">
					<text class="dialog-title">移除成员</text>
				</view>
				
				<view class="dialog-content">
					<text class="confirm-text">确定要移除成员 "{{ selectedMember ? (selectedMember['user_info.nickname'] || '未知用户') : '未知用户' }}" 吗？</text>
				</view>
				
				<view class="dialog-buttons">
					<button class="cancel-btn" @click="closeRemoveModal">取消</button>
					<button class="danger-btn" @click="removeMember" :loading="removing">移除</button>
				</view>
			</view>
			</view>
		</view>

		<!-- 确认退出弹窗 -->
		<view v-if="showLeaveModal" class="popup-mask" @click="closeLeaveModal">
			<view class="popup-content" @click.stop>
				<view class="confirm-dialog">
				<view class="dialog-header">
					<text class="dialog-title">退出项目册</text>
				</view>
				
				<view class="dialog-content">
					<text class="confirm-text">确定要退出此项目册吗？退出后将无法查看项目册内容。</text>
				</view>
				
				<view class="dialog-buttons">
					<button class="cancel-btn" @click="closeLeaveModal">取消</button>
					<button class="danger-btn" @click="leaveBook" :loading="leaving">退出</button>
				</view>
			</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			bookId: '',
			members: [],
			loading: true,
			showInviteModal: false,
			showRemoveModal: false,
			showLeaveModal: false,
			inviteNickname: '',
			inviting: false,
			removing: false,
			leaving: false,
			selectedMember: null,
			currentUserId: '',
			isOwner: false
		}
	},

	onLoad(options) {
		this.bookId = options.id
		this.getCurrentUser()
		this.loadMembers()
	},


	methods: {
		goBack() {
			uni.navigateBack()
		},

		openInviteModal() {
			console.log('点击邀请按钮')
			this.showInviteModal = true
			console.log('showInviteModal:', this.showInviteModal)
		},

		closeInviteModal() {
			console.log('关闭邀请弹窗')
			this.showInviteModal = false
			this.inviteNickname = ''
		},

		async getCurrentUser() {
			try {
				const userInfo = uni.getStorageSync('uni-id-pages-userInfo')
				if (userInfo) {
					this.currentUserId = userInfo._id
				}
			} catch (error) {
				console.error('获取用户信息失败:', error)
			}
		},

		async loadMembers() {
			this.loading = true
			try {
				const todoBookCo = uniCloud.importObject('todobook-co')
				const result = await todoBookCo.getMembers(this.bookId)
				
				if (result.code === 0) {
					this.members = result.data.members
					// 检查当前用户是否是创建者
					const currentMember = this.members.find(m => m.user_id === this.currentUserId)
					this.isOwner = currentMember?.role === 'owner'
				} else {
					uni.showToast({
						title: result.message || '获取成员列表失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('获取成员列表失败:', error)
				uni.showToast({
					title: '获取成员列表失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},

		async inviteUser() {
			if (!this.inviteNickname.trim()) {
				uni.showToast({
					title: '请输入用户昵称',
					icon: 'none'
				})
				return
			}

			this.inviting = true
			try {
				const todoBookCo = uniCloud.importObject('todobook-co')
				const result = await todoBookCo.inviteUserByNickname(this.bookId, this.inviteNickname.trim())
				
				if (result.code === 0) {
					uni.showToast({
						title: '邀请成功',
						icon: 'success'
					})
					this.closeInviteModal()
					this.loadMembers() // 重新加载成员列表
				} else {
					uni.showToast({
						title: result.message || '邀请失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('邀请用户失败:', error)
				uni.showToast({
					title: '邀请失败',
					icon: 'none'
				})
			} finally {
				this.inviting = false
			}
		},

		showRemoveConfirm(member) {
			this.selectedMember = member
			this.showRemoveModal = true
		},

		closeRemoveModal() {
			this.showRemoveModal = false
			this.selectedMember = null
		},

		async removeMember() {
			if (!this.selectedMember) return

			this.removing = true
			try {
				const todoBookCo = uniCloud.importObject('todobook-co')
				const result = await todoBookCo.removeMember(this.bookId, this.selectedMember.user_id)
				
				if (result.code === 0) {
					uni.showToast({
						title: '移除成功',
						icon: 'success'
					})
					this.closeRemoveModal()
					this.loadMembers() // 重新加载成员列表
				} else {
					uni.showToast({
						title: result.message || '移除失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('移除成员失败:', error)
				uni.showToast({
					title: '移除失败',
					icon: 'none'
				})
			} finally {
				this.removing = false
			}
		},

		showLeaveConfirm() {
			this.showLeaveModal = true
		},

		closeLeaveModal() {
			this.showLeaveModal = false
		},

		async leaveBook() {
			this.leaving = true
			try {
				const todoBookCo = uniCloud.importObject('todobook-co')
				const result = await todoBookCo.leaveBook(this.bookId)
				
				if (result.code === 0) {
					uni.showToast({
						title: '已退出项目册',
						icon: 'success'
					})
					// 退出成功后返回项目册列表
					setTimeout(() => {
						uni.navigateBack({
							delta: 2 // 返回到项目册列表页面
						})
					}, 1500)
				} else {
					uni.showToast({
						title: result.message || '退出失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('退出项目册失败:', error)
				uni.showToast({
					title: '退出失败',
					icon: 'none'
				})
			} finally {
				this.leaving = false
				this.closeLeaveModal()
			}
		},

		formatJoinTime(joinTime) {
			if (!joinTime) return ''
			const date = new Date(joinTime)
			const now = new Date()
			const diff = now - date
			const days = Math.floor(diff / (1000 * 60 * 60 * 24))
			
			if (days === 0) {
				return '今天加入'
			} else if (days === 1) {
				return '昨天加入'
			} else if (days < 30) {
				return `${days}天前加入`
			} else {
				return date.toLocaleDateString()
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.members-container {
	background-color: #f8f9fa;
	min-height: 100vh;
}

.nav-right {
	padding: 8px;
}

/* 弹窗遮罩样式 */
.popup-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.popup-content {
	animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: scale(0.8);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

/* 邀请弹窗样式 */
.invite-dialog, .confirm-dialog {
	background-color: white;
	border-radius: 16px;
	padding: 24px;
	min-width: 280px;
	max-width: 400px;
}

.dialog-header {
	text-align: center;
	margin-bottom: 20px;
}

.dialog-title {
	font-size: 18px;
	font-weight: 600;
	color: #1f1f1f;
}

.dialog-content {
	margin-bottom: 24px;
}

.invite-tip {
	display: flex;
	align-items: center;
	margin-top: 12px;
	padding: 8px 12px;
	background-color: #f0f9ff;
	border-radius: 8px;
}

.tip-text {
	margin-left: 8px;
	font-size: 12px;
	color: #909399;
	line-height: 1.4;
}

.confirm-text {
	font-size: 15px;
	color: #606266;
	line-height: 1.5;
	text-align: center;
}

.dialog-buttons {
	display: flex;
	gap: 12px;
}

.cancel-btn, .confirm-btn, .danger-btn {
	flex: 1;
	height: 44px;
	border-radius: 8px;
	font-size: 16px;
	border: none;
}

.cancel-btn {
	background-color: #f5f5f5;
	color: #606266;
}

.confirm-btn {
	background-color: #007AFF;
	color: white;
}

.danger-btn {
	background-color: #F56C6C;
	color: white;
}

/* 成员列表样式 */
.members-list {
	padding: 16px;
}

.list-header {
	margin-bottom: 16px;
}

.header-title {
	font-size: 16px;
	font-weight: 600;
	color: #1f1f1f;
}

.loading-wrapper {
	padding: 40px 0;
	text-align: center;
}

.member-items {
	background-color: white;
	border-radius: 12px;
	overflow: hidden;
}

.member-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	border-bottom: 1px solid #f0f0f0;

	&:last-child {
		border-bottom: none;
	}
}

.member-info {
	display: flex;
	align-items: center;
	flex: 1;
}

.avatar-wrapper {
	margin-right: 12px;
}

.avatar {
	width: 48px;
	height: 48px;
	border-radius: 50%;
}

.avatar-placeholder {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background-color: #007AFF;
	display: flex;
	align-items: center;
	justify-content: center;
	
	text {
		color: white;
		font-size: 18px;
		font-weight: 600;
	}
}

.member-details {
	flex: 1;
}

.member-name {
	display: flex;
	align-items: center;
	margin-bottom: 4px;
}

.nickname {
	font-size: 16px;
	font-weight: 500;
	color: #1f1f1f;
	margin-right: 8px;
}

.owner-badge {
	background-color: #007AFF;
	color: white;
	padding: 2px 8px;
	border-radius: 12px;
	font-size: 12px;
	
	text {
		color: white;
	}
}

.join-time {
	font-size: 13px;
	color: #909399;
}

.member-actions {
	display: flex;
	align-items: center;
	gap: 8px;
}

.action-btn {
	padding: 6px 12px;
	border-radius: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.remove-btn {
	background-color: #fef0f0;
}

.leave-btn {
	background-color: #f0f0f0;
	
	text {
		font-size: 14px;
		color: #F56C6C;
	}
}

.empty-state {
	text-align: center;
	padding: 60px 20px;
	background-color: white;
	border-radius: 12px;
}

.empty-text {
	margin-top: 16px;
	font-size: 15px;
	color: #909399;
}
</style>