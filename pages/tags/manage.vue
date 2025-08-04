<template>
	<view class="tag-manage">
		<view class="header">
			<view class="title">标签管理</view>
			<view class="subtitle">为任务添加有颜色的标签</view>
		</view>

		<!-- 新建标签区域 -->
		<view class="form-section">
			<view class="section-title">新建标签</view>
			
			<uni-forms ref="form" :model="formData" :rules="rules">
				<uni-forms-item name="name" label="标签名称" required>
					<uni-easyinput 
						v-model="formData.name" 
						placeholder="请输入标签名称（5字内）"
						:clearable="true"
						:maxlength="5">
					</uni-easyinput>
				</uni-forms-item>

				<uni-forms-item label="标签颜色" required>
					<view class="color-picker">
						<view 
							v-for="color in colorOptions" 
							:key="color.value"
							class="color-item"
							:class="{ active: formData.color === color.value }"
							:style="{ backgroundColor: color.value }"
							@click="selectColor(color.value)">
							<uni-icons 
								v-if="formData.color === color.value"
								color="#ffffff" 
								size="16" 
								type="checkmarkempty" />
						</view>
					</view>
				</uni-forms-item>
			</uni-forms>

			<!-- 预览 -->
			<view class="preview-section" v-if="formData.name">
				<view class="preview-label">预览效果：</view>
				<view class="preview-tag-container">
					<UniTag 
						:text="formData.name"
						:color="formData.color"
						size="medium" />
				</view>
			</view>

			<!-- 操作按钮 -->
			<view class="form-buttons">
				<button class="create-btn" @click="handleCreateTag" :disabled="!canCreate">
					创建标签
				</button>
			</view>
		</view>

		<!-- 已有标签列表 -->
		<view class="tags-section">
			<view class="section-title">选择标签</view>
			<view class="section-subtitle">点击标签添加到任务中（最多5个）</view>
			<view class="tags-count" :class="{ 'limit-reached': selectedTags.length >= 5 }">
				已选择：{{ selectedTags.length }} / 5
			</view>
			
			<view v-if="availableTags.length > 0" class="tags-list">
				<view 
					v-for="tag in availableTags" 
					:key="tag.id"
					class="tag-item"
					:class="{ 
						selected: selectedTags.includes(tag.id), 
						'tap-feedback': tapFeedbackId === tag.id,
						'editing': editingTag && editingTag.id === tag.id
					}"
					@click="handleTagTap(tag)">
					<UniTag
						:text="tag.name"
						:color="tag.color"
						size="medium" />
					<view class="tag-actions">
						<view class="edit-btn" @click.stop="startEditTag(tag)">
							<uni-icons color="#666666" size="14" type="compose" />
						</view>
					</view>
				</view>
			</view>
			<view v-else class="empty-tags">
				<text class="empty-text">暂无标签，请先创建</text>
			</view>
		</view>

		<!-- 底部按钮 -->
		<view class="bottom-actions">
			<button class="cancel-btn" @click="cancel">取消</button>
			<button class="confirm-btn" @click="confirmSelection" :disabled="selectedTags.length === 0">
				确定 ({{ selectedTags.length }})
			</button>
		</view>

		<!-- 编辑标签模态 -->
		<TagEditModal 
			v-model:visible="editModalVisible"
			:tag="editingTag"
			:color-options="colorOptions"
			:available-tags="availableTags"
			@confirm="saveTagEdit"
			@cancel="cancelEditTag"
			@delete="deleteTag" />

		<!-- 删除确认模态 -->
		<TagDeleteConfirm
			v-model:visible="deleteConfirmVisible"
			:tag="deletingTag"
			:dependency-count="dependencyCount"
			:dependency-tasks="dependencyTasks"
			@confirm="confirmDeleteTag"
			@cancel="cancelDeleteTag" />

	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useTagManage } from './useTagManage.js'
import TagEditModal from './components/TagEditModal.vue'
import TagDeleteConfirm from './components/TagDeleteConfirm.vue'
import UniTag from '@/pages/todobooks/components/common/UniTag.vue'

const {
  // 响应式数据
  taskId,
  bookId,
  currentTags,
  selectedTags,
  availableTags,
  formData,
  colorOptions,
  rules,
  
  // 编辑相关状态
  isEditMode,
  editingTag,
  editModalVisible,
  
  // 删除确认相关状态
  deleteConfirmVisible,
  deletingTag,
  dependencyCount,
  dependencyTasks,
  
  // 计算属性
  canCreate,
  
  // 方法
  initializeData,
  selectColor,
  createTag,
  toggleTagSelection,
  deleteTag,
  confirmSelection,
  cancel,
  
  // 编辑功能
  startEditTag,
  cancelEditTag,
  saveTagEdit,
  
  // 智能删除功能
  startDeleteTag,
  confirmDeleteTag,
  cancelDeleteTag
} = useTagManage()

// 模板引用
const form = ref()

// 点击反馈状态
const tapFeedbackId = ref(null)

// 页面生命周期
onLoad((options) => {
  initializeData(options)
})

// 事件处理函数
const handleCreateTag = () => {
  createTag(form.value)
}

// 标签点击处理（带动画反馈）
const handleTagTap = (tag) => {
  // 显示点击反馈动画
  tapFeedbackId.value = tag.id
  
  // 触发选择逻辑
  toggleTagSelection(tag)
  
  // 清除动画状态
  setTimeout(() => {
    tapFeedbackId.value = null
  }, 150)
}

</script>

<style lang="scss" scoped>
@import './manage.scss';
</style>